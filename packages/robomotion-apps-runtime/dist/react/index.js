import {
  AppError,
  LiveReader,
  bindAction,
  linkKey,
  markGesture,
  noteHookUse,
  tagAction
} from "../chunk-4IJJAWQH.js";

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
var writeDoneListeners = /* @__PURE__ */ new Set();
var writeEpoch = 0;
function announceWriteDone(name) {
  writeEpoch += 1;
  for (const listen of [...writeDoneListeners]) {
    try {
      listen(name);
    } catch {
    }
  }
}
function onWriteDone(listen) {
  writeDoneListeners.add(listen);
  return () => {
    writeDoneListeners.delete(listen);
  };
}
function callKey(params, opts) {
  const seen = /* @__PURE__ */ new Set();
  const norm = (v) => {
    if (v === null || typeof v !== "object") {
      if (typeof v === "function" || typeof v === "symbol" || typeof v === "bigint") throw new Error("uncomparable");
      return v;
    }
    if (seen.has(v)) throw new Error("cycle");
    const proto = Object.getPrototypeOf(v);
    if (!Array.isArray(v) && proto !== Object.prototype && proto !== null) throw new Error("uncomparable");
    seen.add(v);
    const out = Array.isArray(v) ? v.map(norm) : Object.fromEntries(
      Object.keys(v).sort().map((k) => [k, norm(v[k])])
    );
    seen.delete(v);
    return out;
  };
  try {
    return JSON.stringify([norm(params), opts?.timeoutMs ?? null, opts?.refreshOnWrite ?? null]);
  } catch {
    return null;
  }
}
var LOOP_LIMIT = 10;
var LOOP_WINDOW_MS = 3e4;
var LoopBrake = class {
  constructor(name) {
    this.name = name;
  }
  name;
  key = null;
  starts = [];
  epoch = -1;
  tripped = false;
  error;
  /** Notes a send of `key`. True when it must not be sent. */
  note(key, now = Date.now()) {
    if (key !== this.key) {
      this.key = key;
      this.starts = [];
      this.tripped = false;
      this.error = void 0;
      this.epoch = writeEpoch;
    }
    if (this.tripped) return true;
    if (this.epoch !== writeEpoch) {
      this.epoch = writeEpoch;
      this.starts = [];
    }
    this.starts = this.starts.filter((t) => now - t < LOOP_WINDOW_MS);
    this.starts.push(now);
    if (this.starts.length <= LOOP_LIMIT) return false;
    this.tripped = true;
    const message = `This screen asked for "${this.name}" with the same values more than ${LOOP_LIMIT} times in ${LOOP_WINDOW_MS / 1e3} seconds by itself, so it is no longer being sent. The screen asks for the same thing in a loop: check its effect dependencies - use [] to ask when the screen opens, or the values that should ask again (an id), never the action hook object or a function made during render.`;
    this.error = new AppError("internal", message, false);
    tagAction(this.error, this.name);
    console.error(`[apps-runtime] ${message}`);
    return true;
  }
};
function useAction(name, hookOpts) {
  const app = useAppClient();
  const [data, setData] = useState(void 0);
  const [error, setError] = useState(void 0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(void 0);
  const abortRef = useRef(null);
  const aliveRef = useRef(true);
  const runSeqRef = useRef(0);
  const pendingAbortRef = useRef(null);
  useEffect(() => {
    if (pendingAbortRef.current !== null) {
      clearTimeout(pendingAbortRef.current);
      pendingAbortRef.current = null;
    }
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      pendingAbortRef.current = setTimeout(() => {
        pendingAbortRef.current = null;
        if (aliveRef.current) return;
        inflightRef.current = null;
        abortRef.current?.abort();
      }, 0);
    };
  }, []);
  useEffect(() => {
    const key = linkKey("action", name);
    noteHookUse(key, 1);
    return () => noteHookUse(key, -1);
  }, [name]);
  const inflightRef = useRef(null);
  const brakeRef = useRef(null);
  if (!brakeRef.current) brakeRef.current = new LoopBrake(name);
  const brake = brakeRef.current;
  const cancel = useCallback(() => {
    inflightRef.current = null;
    abortRef.current?.abort();
  }, []);
  const lastCallRef = useRef(null);
  const errorRef = useRef(void 0);
  errorRef.current = error;
  const loadingRef = useRef(false);
  loadingRef.current = loading;
  const runRef = useRef(null);
  useEffect(
    () => app.connection.onChange((state) => {
      const last = lastCallRef.current;
      if (!last || !shouldRetryOnReconnect(errorRef.current, state)) return;
      void runRef.current?.(last.params, last.opts);
    }),
    [app]
  );
  const readOnly = hookOpts?.readOnly === true;
  useEffect(() => {
    if (!readOnly) return;
    let queued = false;
    return onWriteDone((writer) => {
      if (writer === name || queued) return;
      const last = lastCallRef.current;
      if (!last || last.opts?.refreshOnWrite === false || loadingRef.current) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!aliveRef.current || loadingRef.current) return;
        void runRef.current?.(last.params, last.opts);
      });
    });
  }, [name, readOnly]);
  const run = useCallback(
    (params, opts) => {
      const key = callKey(params, opts);
      const out = inflightRef.current;
      if (key !== null && out && out.key === key) {
        lastCallRef.current = { params, opts };
        return out.promise;
      }
      if (key !== null && brake.note(key)) {
        if (brake.error && errorRef.current !== brake.error && aliveRef.current) {
          setError(brake.error);
          setLoading(false);
          loadingRef.current = false;
        }
        return Promise.resolve(void 0);
      }
      const promise = send(params, opts);
      if (key !== null) {
        const entry = { key, promise };
        inflightRef.current = entry;
        const clear = () => {
          if (inflightRef.current === entry) inflightRef.current = null;
        };
        promise.then(clear, clear);
      }
      return promise;
    },
    // send and brake are stable for the hook's life (refs / created once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app, name]
  );
  const send = useCallback(
    async (params, opts) => {
      lastCallRef.current = { params, opts };
      loadingRef.current = true;
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
        if (current()) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [app, name]
  );
  runRef.current = run;
  return { run, data, error, loading, progress, cancel, name };
}
function shouldRetryOnReconnect(error, state) {
  if (state !== "ready" || !error || error.code !== "robot_offline") return false;
  const details = error.details;
  return details?.sent !== true;
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
function useFileUrl(ref) {
  const app = useMaybeAppClient();
  const key = ref?.artifact_id ?? "";
  const fixed = ref?.url;
  const [state, setState] = useState({
    key,
    loading: !!app && !!key && !fixed
  });
  const [nonce, setNonce] = useState(0);
  const forceRef = useRef(false);
  const refRef = useRef(ref);
  refRef.current = ref;
  useEffect(() => {
    const target = refRef.current;
    if (!app || !target || !key || fixed) return;
    let alive = true;
    const force = forceRef.current;
    forceRef.current = false;
    setState((s) => s.key === key ? { ...s, loading: true, error: void 0 } : { key, loading: true });
    app.files.previewUrl(target, { force }).then(
      (url) => {
        if (alive) setState({ key, url, loading: false });
      },
      (e) => {
        if (!alive) return;
        const error = e instanceof AppError ? e : new AppError("internal", String(e), true);
        setState({ key, error, loading: false });
      }
    );
    return () => {
      alive = false;
    };
  }, [app, key, fixed, nonce]);
  const refresh = useCallback(() => {
    forceRef.current = true;
    setNonce((n) => n + 1);
  }, []);
  if (fixed) return { url: fixed, loading: false, error: void 0, refresh };
  const mine = state.key === key;
  return {
    url: mine ? state.url : void 0,
    loading: mine ? state.loading : !!app && !!key,
    error: mine ? state.error : void 0,
    refresh
  };
}
function useLive(action, opts) {
  const app = useAppClient();
  const name = typeof action === "string" ? action : action.name;
  const enabled = opts.enabled !== false;
  const paramsKey = callKey(opts.params) ?? "";
  const eventsKey = opts.events.join("\n");
  const pollMs = opts.pollMs;
  const minIntervalMs = opts.minIntervalMs;
  const timeoutMs = opts.timeoutMs;
  const latest = useRef(opts);
  latest.current = opts;
  const readerRef = useRef(null);
  const [state, setState] = useState({
    data: void 0,
    error: void 0,
    loading: enabled,
    refreshing: false,
    done: false
  });
  useEffect(() => {
    const key = linkKey("action", name);
    noteHookUse(key, 1);
    return () => noteHookUse(key, -1);
  }, [name]);
  useEffect(() => {
    if (!enabled) return;
    const reader = new LiveReader({
      read: async () => {
        const result = await app.call(name, latest.current.params, { timeoutMs });
        tagAction(result, name);
        return result;
      },
      subscribe: (event, cb) => app.on(event, cb),
      events: eventsKey ? eventsKey.split("\n") : [],
      pollMs,
      minIntervalMs,
      isDone: (data) => latest.current.isDone ? latest.current.isDone(data) : liveDoneDefault(data),
      onEvent: (event, payload) => latest.current.onEvent?.(event, payload),
      onChange: setState
    });
    readerRef.current = reader;
    setState(reader.current);
    reader.start();
    const offConnection = app.connection.onChange((s) => {
      if (s === "ready") reader.refresh();
    });
    return () => {
      offConnection();
      reader.stop();
      if (readerRef.current === reader) readerRef.current = null;
    };
  }, [app, name, enabled, paramsKey, eventsKey, pollMs, minIntervalMs, timeoutMs]);
  const refresh = useCallback(() => readerRef.current?.refresh(), []);
  const error = state.error === void 0 ? void 0 : state.error instanceof AppError ? state.error : new AppError("internal", String(state.error), true);
  if (error) tagAction(error, name);
  return {
    data: state.data,
    error,
    loading: enabled && state.loading,
    refreshing: state.refreshing,
    done: state.done,
    refresh,
    name
  };
}
function liveDoneDefault(data) {
  return typeof data === "object" && data !== null && data.done === true;
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
  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setBusy(false);
  }, []);
  const clear = useCallback(() => {
    handleRef.current?.stop();
    setMessages([]);
    setBusy(false);
  }, []);
  return useMemo(
    () => ({ available, greeting, messages, busy, send, stop, clear }),
    [available, greeting, messages, busy, send, stop, clear]
  );
}
export {
  AppProvider,
  LOOP_LIMIT,
  LOOP_WINDOW_MS,
  LoopBrake,
  announceWriteDone,
  bindAction,
  callKey,
  markGesture,
  onWriteDone,
  shouldRetryOnReconnect,
  useAction,
  useAppClient,
  useAssistant,
  useConnection,
  useEvent,
  useFileUpload,
  useFileUrl,
  useLive,
  useMaybeAppClient,
  useViewer
};
//# sourceMappingURL=index.js.map