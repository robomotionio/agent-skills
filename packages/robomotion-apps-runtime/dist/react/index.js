import {
  AppError,
  bindAction,
  bindCollection,
  linkKey,
  markGesture,
  noteHookUse,
  tagAction
} from "../chunk-VKE7X2KZ.js";

// src/react/index.ts
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
var AppContext = createContext(null);
function AppProvider({ app, children }) {
  return createElement(AppContext.Provider, { value: app }, children);
}
function useAppClient() {
  const app = useContext(AppContext);
  if (!app) {
    throw new Error("This hook needs an <AppProvider> above it in the tree.");
  }
  return app;
}
function useMaybeAppClient() {
  return useContext(AppContext);
}
function useAction(name) {
  const app = useAppClient();
  const [data, setData] = useState(void 0);
  const [error, setError] = useState(void 0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(void 0);
  const abortRef = useRef(null);
  const aliveRef = useRef(true);
  const runSeqRef = useRef(0);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    const key = linkKey("action", name);
    noteHookUse(key, 1);
    return () => noteHookUse(key, -1);
  }, [name]);
  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);
  const lastCallRef = useRef(null);
  const errorRef = useRef(void 0);
  errorRef.current = error;
  const runRef = useRef(null);
  useEffect(
    () => app.connection.onChange((state) => {
      const last = lastCallRef.current;
      if (!last || !shouldRetryOnReconnect(errorRef.current, state)) return;
      void runRef.current?.(last.params, last.opts);
    }),
    [app]
  );
  const run = useCallback(
    async (params, opts) => {
      lastCallRef.current = { params, opts };
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      runSeqRef.current += 1;
      const seq = runSeqRef.current;
      const current = () => aliveRef.current && runSeqRef.current === seq;
      if (current()) {
        setLoading(true);
        setError(void 0);
        setProgress(void 0);
      }
      try {
        const result = await app.call(name, params, {
          signal: controller.signal,
          timeoutMs: opts?.timeoutMs,
          onProgress: (p) => {
            tagAction(p, name);
            if (current()) setProgress(p);
          }
        });
        tagAction(result, name);
        if (current()) {
          setData(result);
          setError(void 0);
        }
        return result;
      } catch (e) {
        const err = e instanceof AppError ? e : new AppError("internal", String(e), false);
        tagAction(err, name);
        if (current()) {
          setError(err);
          setData(void 0);
        }
        return void 0;
      } finally {
        if (current()) setLoading(false);
      }
    },
    [app, name]
  );
  runRef.current = run;
  return { run, data, error, loading, progress, cancel, name };
}
function shouldRetryOnReconnect(error, state) {
  return state === "ready" && !!error && error.code === "robot_offline";
}
function useCollection(name) {
  const app = useAppClient();
  const col = useMemo(() => app.collection(name), [app, name]);
  useEffect(() => {
    const key = linkKey("collection", name);
    noteHookUse(key, 1);
    return () => noteHookUse(key, -1);
  }, [name]);
  const [records, setRecords] = useState(col.records);
  const [loading, setLoading] = useState(col.loading);
  const [error] = useState(void 0);
  useEffect(() => {
    setRecords(col.records);
    setLoading(col.loading);
    const offChange = col.onChange(() => {
      setRecords(col.records);
      setLoading(col.loading);
    });
    const off = col.subscribe();
    return () => {
      offChange();
      off();
    };
  }, [col]);
  return { records, loading, error, name };
}
function useEvent(name, cb) {
  const app = useAppClient();
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    return app.on(name, (payload) => cbRef.current(payload));
  }, [app, name]);
}
function useConnection() {
  const app = useAppClient();
  const [state, setState] = useState(app.connection.state);
  useEffect(() => {
    setState(app.connection.state);
    return app.connection.onChange(setState);
  }, [app]);
  return { state, robotOnline: state === "ready" };
}
function useViewer() {
  const app = useAppClient();
  const [viewer, setViewer] = useState(app.viewer.current);
  useEffect(() => {
    setViewer(app.viewer.current);
    return app.viewer.onChange(setViewer);
  }, [app]);
  return viewer;
}
function useFileUpload() {
  const app = useAppClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(void 0);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  const upload = useCallback(
    async (file, opts) => {
      if (aliveRef.current) {
        setUploading(true);
        setProgress(0);
        setError(void 0);
      }
      try {
        const ref = await app.files.upload(file, {
          ...opts,
          onProgress: (pct) => {
            if (aliveRef.current) setProgress(pct);
            opts?.onProgress?.(pct);
          }
        });
        return ref;
      } catch (e) {
        const err = e instanceof AppError ? e : new AppError("internal", String(e), true);
        if (aliveRef.current) setError(err);
        return void 0;
      } finally {
        if (aliveRef.current) setUploading(false);
      }
    },
    [app]
  );
  return { upload, uploading, progress, error };
}
function useAssistant() {
  const app = useAppClient();
  const { state } = useConnection();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const handleRef = useRef(null);
  const available = state === "ready" && app.assistantAvailable();
  const greeting = app.assistantGreeting();
  useEffect(() => () => handleRef.current?.stop(), []);
  const send = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      const replyId = `a-${Date.now()}`;
      setMessages((list) => [
        ...list,
        { id: `u-${Date.now()}`, role: "user", text: trimmed },
        { id: replyId, role: "assistant", text: "", streaming: true }
      ]);
      setBusy(true);
      const patch = (fn) => setMessages((list) => list.map((m) => m.id === replyId ? fn(m) : m));
      handleRef.current = app.sendAssistantPrompt(trimmed, {
        onDelta: (delta) => patch((m) => ({ ...m, text: m.text + delta })),
        onTool: (tool) => patch((m) => ({ ...m, tools: [...m.tools ?? [], tool] })),
        onDone: () => {
          patch((m) => ({ ...m, streaming: false }));
          setBusy(false);
        },
        onError: (message) => {
          patch((m) => ({ ...m, streaming: false, error: message }));
          setBusy(false);
        }
      });
    },
    [app, busy]
  );
  const clear = useCallback(() => {
    handleRef.current?.stop();
    setMessages([]);
    setBusy(false);
  }, []);
  return useMemo(
    () => ({ available, greeting, messages, busy, send, clear }),
    [available, greeting, messages, busy, send, clear]
  );
}
export {
  AppProvider,
  bindAction,
  bindCollection,
  markGesture,
  shouldRetryOnReconnect,
  useAction,
  useAppClient,
  useAssistant,
  useCollection,
  useConnection,
  useEvent,
  useFileUpload,
  useMaybeAppClient,
  useViewer
};
//# sourceMappingURL=index.js.map