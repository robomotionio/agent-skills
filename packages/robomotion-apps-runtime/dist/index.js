import {
  AppError,
  bindAction,
  bindCollection,
  currentCause,
  installInspector,
  installLinks,
  isAppError,
  linkKey,
  lookupTag,
  markGesture,
  setCause,
  splitLinkKey,
  tagAction,
  tagCollection
} from "./chunk-VKE7X2KZ.js";

// src/collection.ts
var Collection = class {
  name;
  /** The current record array. Treat as read-only. */
  records = [];
  /** True until the first snapshot lands. */
  loading = true;
  /** Highest seq applied so far; 0 before the first snapshot. */
  lastSeq = 0;
  /** Wire subscription bookkeeping, driven by the client. */
  desired = 0;
  wireSubscribed = false;
  keys = [];
  index = /* @__PURE__ */ new Map();
  changeCbs = /* @__PURE__ */ new Set();
  requestSubscribe;
  requestUnsubscribe;
  constructor(name, requestSubscribe, requestUnsubscribe) {
    this.name = name;
    this.requestSubscribe = requestSubscribe;
    this.requestUnsubscribe = requestUnsubscribe;
    tagCollection(this.records, name);
  }
  /**
   * Stamp the array and every record with the collection's identity, so a
   * table fed these objects (or a filtered subset of them) can say which
   * collection it shows without the author writing anything.
   */
  tagRecords() {
    tagCollection(this.records, this.name);
    for (const r of this.records) tagCollection(r, this.name);
  }
  /**
   * Declare interest. Returns an unsubscribe function; the wire subscription
   * is reference counted, so several screens can share one collection.
   */
  subscribe() {
    this.desired++;
    this.requestSubscribe(this, this.lastSeq);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.desired = Math.max(0, this.desired - 1);
      if (this.desired === 0) {
        this.requestUnsubscribe(this);
      }
    };
  }
  /** Drop every subscription and tell the robot to stop sending. */
  unsubscribe() {
    this.desired = 0;
    this.requestUnsubscribe(this);
  }
  /** Fires after every applied snapshot or delta. Returns an off function. */
  onChange(cb) {
    this.changeCbs.add(cb);
    return () => this.changeCbs.delete(cb);
  }
  // -- Applied by the client from wire messages ----------------------------
  applySnapshot(seq, records, keyOf) {
    this.records = records.slice();
    this.keys = this.records.map(keyOf);
    this.index = /* @__PURE__ */ new Map();
    for (let i = 0; i < this.keys.length; i++) {
      this.index.set(this.keys[i], i);
    }
    this.lastSeq = seq;
    this.loading = false;
    this.tagRecords();
    this.emit();
  }
  /**
   * Apply one data_change. Returns:
   *  - "applied": in-order, records updated
   *  - "stale":   duplicate (seq <= lastSeq), dropped
   *  - "gap":     out of order (seq > lastSeq + 1), caller must resubscribe
   */
  applyChange(seq, ops) {
    if (seq <= this.lastSeq) return "stale";
    if (seq !== this.lastSeq + 1) return "gap";
    for (const op of ops) {
      const kind = String(op.op || "").toLowerCase();
      if (kind === "delete" || kind === "remove") {
        const at = this.index.get(op.key);
        if (at !== void 0) {
          this.records.splice(at, 1);
          this.keys.splice(at, 1);
          this.index.delete(op.key);
          for (let i = at; i < this.keys.length; i++) {
            this.index.set(this.keys[i], i);
          }
        }
      } else {
        if (op.record === void 0) continue;
        const at = this.index.get(op.key);
        if (at !== void 0) {
          this.records[at] = op.record;
        } else {
          this.index.set(op.key, this.records.length);
          this.keys.push(op.key);
          this.records.push(op.record);
        }
      }
    }
    this.records = this.records.slice();
    this.lastSeq = seq;
    this.loading = false;
    this.tagRecords();
    this.emit();
    return "applied";
  }
  emit() {
    for (const cb of this.changeCbs) {
      try {
        cb();
      } catch {
      }
    }
  }
};

// src/files.ts
function encodeArtifactId(addr) {
  const json = JSON.stringify({ f: addr.f, s: addr.s, u: addr.u, v: addr.v });
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, "utf-8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeArtifactId(artifactId) {
  try {
    let b64 = artifactId.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const json = typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (typeof parsed.f !== "string" || typeof parsed.v !== "number") return null;
    return {
      f: parsed.f,
      s: typeof parsed.s === "string" ? parsed.s : "",
      u: typeof parsed.u === "string" ? parsed.u : "",
      v: parsed.v
    };
  } catch {
    return null;
  }
}
var FilesApi = class {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  /**
   * Upload one browser File and get back a FileRef to pass in action params.
   * Three steps: presigned upload URL, PUT the bytes to S3, confirm.
   */
  async upload(file, opts = {}) {
    const { apiUrl, appId, instanceId, userId, sessionId, fetchFn } = this.ctx();
    const onProgress = opts.onProgress;
    const mime = file.type || "application/octet-stream";
    onProgress?.(0);
    const urlRes = await this.postJson(fetchFn, `${apiUrl}/v1/artifacts.upload-url`, {
      app_name: appId,
      app_id: appId,
      instance_id: instanceId,
      user_id: userId,
      session_id: sessionId,
      filename: file.name,
      mime_type: mime,
      is_public: !!opts.isPublic
    });
    if (!urlRes.ok || typeof urlRes.upload_url !== "string") {
      throw new AppError("internal", "Could not get an upload URL for the file.", true);
    }
    const version = Number(urlRes.version ?? 0);
    onProgress?.(5);
    await putWithProgress(String(urlRes.upload_url), file, mime, (loaded, total) => {
      if (total > 0) onProgress?.(5 + loaded / total * 85);
    });
    onProgress?.(92);
    const confirm = await this.postJson(fetchFn, `${apiUrl}/v1/artifacts.confirm-upload`, {
      app_name: appId,
      app_id: appId,
      instance_id: instanceId,
      user_id: userId,
      session_id: sessionId,
      filename: file.name,
      mime_type: mime,
      version,
      size: file.size,
      is_public: !!opts.isPublic
    });
    if (!confirm.ok) {
      throw new AppError("internal", "The upload could not be confirmed.", true);
    }
    onProgress?.(100);
    return {
      artifact_id: encodeArtifactId({ f: file.name, s: sessionId, u: userId, v: version }),
      name: file.name,
      size: file.size,
      mime
    };
  }
  /** Resolve a FileRef to a short-lived download URL. */
  async downloadUrl(ref) {
    const { apiUrl, appId, instanceId, userId, sessionId, fetchFn } = this.ctx();
    const addr = decodeArtifactId(ref.artifact_id) ?? {
      f: ref.name,
      s: sessionId,
      u: userId,
      v: 0
    };
    const params = new URLSearchParams({
      app_name: appId,
      app_id: appId,
      instance_id: instanceId,
      user_id: addr.u || userId,
      session_id: addr.s || sessionId,
      filename: addr.f,
      version: String(addr.v)
    });
    const res = await fetchFn(`${apiUrl}/v1/artifacts.download-url?${params.toString()}`, {
      credentials: "include"
    });
    if (!res.ok) {
      throw new AppError("internal", "Could not get a download URL for the file.", true);
    }
    const json = await res.json();
    if (!json.ok || !json.download_url) {
      throw new AppError("internal", "Could not get a download URL for the file.", true);
    }
    return json.download_url;
  }
  async postJson(fetchFn, url, body) {
    const res = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new AppError("internal", `Artifact request failed with status ${res.status}`, true);
    }
    return await res.json();
  }
};
function putWithProgress(url, file, mime, onProgress) {
  if (typeof XMLHttpRequest === "undefined") {
    return fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": mime }
    }).then((res) => {
      if (!res.ok) throw new AppError("internal", `Upload failed: ${res.statusText}`, true);
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new AppError("internal", `Upload failed: ${xhr.statusText}`, true));
    });
    xhr.addEventListener(
      "error",
      () => reject(new AppError("internal", "Upload failed.", true))
    );
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.send(file);
  });
}

// src/base58.ts
var BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function isBase58(str) {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
}
function uuidToBase58(uuidStr) {
  const cleanUUID = uuidStr.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(cleanUUID)) {
    throw new Error("Not a UUID: " + uuidStr);
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(cleanUUID.substring(i * 2, i * 2 + 2), 16);
  }
  let result = "";
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256n + BigInt(bytes[i]);
  }
  while (num > 0n) {
    const mod = Number(num % 58n);
    result = BASE58_CHARS[mod] + result;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = "1" + result;
  }
  return result;
}
function base58ToUuid(base58) {
  let num = 0n;
  for (let i = 0; i < base58.length; i++) {
    const index = BASE58_CHARS.indexOf(base58[i]);
    if (index === -1) throw new Error("Invalid Base58 character");
    num = num * 58n + BigInt(index);
  }
  const bytes = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(num % 256n);
    num = num / 256n;
  }
  if (num > 0n) throw new Error("Base58 value does not fit in a UUID");
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.substring(0, 8) + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16) + "-" + hex.substring(16, 20) + "-" + hex.substring(20);
}

// src/resolve.ts
var UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function instanceIdFromUrl(appUrl) {
  let url;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }
  const fromQuery = url.searchParams.get("instance");
  if (fromQuery) {
    if (UUID_RE.test(fromQuery)) return fromQuery.toLowerCase();
    if (isBase58(fromQuery)) {
      try {
        return base58ToUuid(fromQuery);
      } catch {
      }
    }
  }
  const segments = url.pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (UUID_RE.test(seg)) return seg.toLowerCase();
    if (seg.length >= 21 && seg.length <= 22 && isBase58(seg)) {
      try {
        return base58ToUuid(seg);
      } catch {
      }
    }
  }
  return null;
}
async function resolveInstance(apiUrl, instanceUuid, fetchFn) {
  const res = await fetchFn(
    `${apiUrl.replace(/\/$/, "")}/v1/apps.instance.get?id=${encodeURIComponent(instanceUuid)}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error(`apps.instance.get failed with status ${res.status}`);
  }
  const json = await res.json();
  if (!json.ok || !json.data) {
    throw new Error("apps.instance.get returned no instance");
  }
  const d = json.data;
  const robotId = String(d.robot_id ?? "");
  if (!robotId) {
    throw new Error("Instance has no robot bound to it");
  }
  return {
    id: String(d.id ?? instanceUuid),
    appId: String(d.app_id ?? ""),
    robotId,
    workspaceId: d.workspace_id ? String(d.workspace_id) : void 0,
    isPublic: Boolean(d.is_public),
    runId: d.run_id ? String(d.run_id) : void 0,
    flowId: d.flow_id ? String(d.flow_id) : void 0,
    name: d.name ? String(d.name) : void 0
  };
}

// src/crypto.ts
var subtle = () => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error("WebCrypto is not available in this environment");
  return c.subtle;
};
function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
function utf8ToBase64(text) {
  return arrayBufferToBase64(new TextEncoder().encode(text));
}
function base64ToUtf8(b64) {
  return new TextDecoder("utf-8").decode(new Uint8Array(base64ToArrayBuffer(b64)));
}
function decodePemIfBase64(pem) {
  if (!pem.startsWith("-----BEGIN")) {
    try {
      return atob(pem);
    } catch {
      return pem;
    }
  }
  return pem;
}
async function importRsaPublicKey(pem) {
  pem = decodePemIfBase64(pem);
  const pemContents = pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return subtle().importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}
async function encryptWithRsaOaep(publicKey, data) {
  return subtle().encrypt({ name: "RSA-OAEP" }, publicKey, data);
}
async function generateAesKey() {
  return subtle().generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function exportAesKeyRaw(key) {
  return subtle().exportKey("raw", key);
}
async function aesGcmEncrypt(key, plaintext) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = await subtle().encrypt({ name: "AES-GCM", iv }, key, data);
  return arrayBufferToBase64(iv) + ":" + arrayBufferToBase64(ciphertext);
}
async function aesGcmDecrypt(key, encrypted) {
  const sep = encrypted.indexOf(":");
  if (sep < 0) throw new Error("Encrypted payload is missing the iv separator");
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.slice(0, sep)));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(encrypted.slice(sep + 1)));
  const decrypted = await subtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder("utf-8").decode(decrypted);
}
async function sealBody(key, body) {
  return aesGcmEncrypt(key, utf8ToBase64(JSON.stringify(body)));
}
async function openBody(key, payload) {
  const plaintext = await aesGcmDecrypt(key, payload);
  return JSON.parse(base64ToUtf8(plaintext));
}
function uuid4() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
}

// src/client.ts
var DEFAULT_API_URL = "https://api.robomotion.io";
var DEFAULT_PROXY_URL = "wss://amq.robomotion.io";
var DEFAULT_TIMEOUT_MS = 3e4;
var DEFAULT_RECONNECT_MS = 5e3;
var DEFAULT_PING_MS = 3e4;
var ROBOT_RECHECK_INTERVAL_MS = 5e3;
var ROBOT_RECHECK_START_MS = 3e3;
var ROBOT_RECHECK_MAX_MS = 3e4;
function dispatchDom(type, detail) {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch {
  }
}
function windowEnv() {
  return typeof window !== "undefined" ? window : {};
}
var MemoryStorage = class {
  m = /* @__PURE__ */ new Map();
  getItem(k) {
    return this.m.has(k) ? this.m.get(k) : null;
  }
  setItem(k, v) {
    this.m.set(k, v);
  }
};
var ConnectionInfo = class {
  _state = "connecting";
  cbs = /* @__PURE__ */ new Set();
  get state() {
    return this._state;
  }
  onChange(cb) {
    this.cbs.add(cb);
    return () => this.cbs.delete(cb);
  }
  /** @internal */
  set(state) {
    if (this._state === "contract_mismatch" && state !== "contract_mismatch") return;
    if (this._state === state) return;
    this._state = state;
    for (const cb of this.cbs) {
      try {
        cb(state);
      } catch {
      }
    }
  }
};
var AppClient = class {
  connection = new ConnectionInfo();
  files;
  contractHash;
  opts;
  storage;
  apiUrl;
  /** WebSocket base including the /ws path segment. */
  wsBase;
  fetchFn;
  reconnectDelayMs;
  pingIntervalMs;
  instance = null;
  connId = "";
  clientId = "";
  ws = null;
  aesKey = null;
  robotPublicKey = null;
  manifestSummary = null;
  helloSentOnce = false;
  closed = false;
  reconnectTimer = null;
  /** Throttles the instance re-resolve in reconnectIfRobotChanged. */
  lastRobotRecheck = 0;
  robotRecheckTimer = null;
  robotRecheckDelayMs = ROBOT_RECHECK_START_MS;
  pingTimer = null;
  sendChain = Promise.resolve();
  recvChain = Promise.resolve();
  pending = /* @__PURE__ */ new Map();
  eventHandlers = /* @__PURE__ */ new Map();
  collections = /* @__PURE__ */ new Map();
  constructor(options) {
    this.opts = options;
    this.contractHash = options.contractHash;
    const env = windowEnv();
    this.apiUrl = (options.config?.api_url || options.apiUrl || env.env?.API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    this.wsBase = options.config?.ws_url ? options.config.ws_url.replace(/\/$/, "") : `${(options.proxyUrl ?? env.env?.PROXY_URL ?? DEFAULT_PROXY_URL).replace(/\/$/, "")}/ws`;
    this.fetchFn = options.fetchFn ?? ((...args) => fetch(...args));
    this.reconnectDelayMs = options.reconnectDelayMs ?? DEFAULT_RECONNECT_MS;
    this.pingIntervalMs = options.pingIntervalMs ?? DEFAULT_PING_MS;
    this.storage = options.storage ?? (typeof localStorage !== "undefined" ? localStorage : new MemoryStorage());
    this.connection.onChange((state) => {
      if (state === "robot_offline") this.startRobotRecheck();
      else this.stopRobotRecheck();
    });
    this.files = new FilesApi(() => ({
      apiUrl: this.apiUrl,
      appId: this.instance?.appId ?? "",
      instanceId: this.instance?.id ?? "",
      userId: this.opts.identity?.userId ?? "",
      sessionId: this.opts.identity?.sessionId ?? this.clientId,
      fetchFn: this.fetchFn
    }));
  }
  get appId() {
    return this.instance?.appId ?? "";
  }
  get instanceId() {
    return this.instance?.id ?? "";
  }
  // -------------------------------------------------------------------------
  // Connection
  // -------------------------------------------------------------------------
  /**
   * Start (or restart) the connection. Never throws on transport failure:
   * failures surface through connection state and typed call rejections.
   */
  connect() {
    if (this.closed) return;
    void this.connectInner().catch(() => {
      this.connection.set("offline");
      this.scheduleReconnect();
    });
  }
  async connectInner() {
    this.clearReconnect();
    if (this.connection.state !== "contract_mismatch") {
      this.connection.set("connecting");
    }
    if (!this.instance) {
      if (this.opts.instance) {
        this.instance = {
          id: this.opts.instance.id,
          appId: this.opts.instance.appId,
          robotId: this.opts.instance.robotId,
          workspaceId: this.opts.instance.workspaceId
        };
      } else if (this.opts.config) {
        const cfg = this.opts.config;
        if (!cfg.instance_id || !this.apiUrl) {
          this.connection.set("unconfigured");
          return;
        }
        const fetched = await resolveInstance(this.apiUrl, cfg.instance_id, this.fetchFn);
        this.instance = {
          ...fetched,
          id: cfg.instance_id || fetched.id,
          appId: cfg.app_id || fetched.appId,
          isPublic: cfg.is_public || fetched.isPublic
        };
      } else {
        const appUrl = this.opts.appUrl ?? windowEnv().location?.href ?? "";
        const uuid = instanceIdFromUrl(appUrl);
        if (!uuid) {
          throw new Error("Could not find an instance id in the app URL");
        }
        this.instance = await resolveInstance(this.apiUrl, uuid, this.fetchFn);
      }
    }
    this.clientId = this.ensureClientId(this.instance.appId);
    this.connId = `ui-${uuid4()}`;
    this.aesKey = null;
    this.robotPublicKey = null;
    const wsUrl = this.buildWsUrl(this.instance.robotId);
    const factory = this.opts.webSocketFactory ?? ((url) => new WebSocket(url));
    const ws = factory(wsUrl);
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.sendRaw({
        type: "client",
        mode: "app",
        user_id: "",
        guid: this.connId,
        instance_id: this.instance.id,
        robot_id: this.instance.robotId,
        additional: {
          client_id: this.clientId,
          app_id: this.instance.appId,
          instance_id: this.instance.id,
          robot_id: this.instance.robotId
        },
        profile: {}
      });
      this.startPing();
    };
    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      const task = () => this.handleMessage(ev.data).catch(() => void 0);
      this.recvChain = this.recvChain.then(task, task);
    };
    ws.onerror = () => {
      if (this.ws !== ws) return;
      this.onSocketDown();
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.onSocketDown();
    };
  }
  /** Tear the client down for good. In-flight calls reject as cancelled. */
  close() {
    this.closed = true;
    this.clearReconnect();
    this.stopRobotRecheck();
    this.stopPing();
    const ws = this.ws;
    this.ws = null;
    try {
      ws?.close();
    } catch {
    }
    for (const p of [...this.pending.values()]) {
      this.settle(p, void 0, new AppError("cancelled", "The app client was closed.", false));
    }
  }
  onSocketDown() {
    if (this.closed) return;
    this.stopPing();
    this.aesKey = null;
    this.ws = null;
    this.connection.set("offline");
    this.scheduleReconnect();
  }
  scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelayMs);
  }
  clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        this.sendRaw({ type: "ping" });
      } else {
        this.stopPing();
      }
    }, this.pingIntervalMs);
  }
  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  buildWsUrl(robotId) {
    let sid = "";
    try {
      const appUrl = this.opts.appUrl ?? windowEnv().location?.href ?? "";
      if (appUrl) sid = new URL(appUrl).searchParams.get("sid") ?? "";
    } catch {
    }
    const base = `${this.wsBase}/${robotId}`;
    return sid ? `${base}?sid=${encodeURIComponent(sid)}` : base;
  }
  /** Durable per-browser identity under rm.app.<app_id>.client_id (protocol.md section 1). */
  ensureClientId(appId) {
    const key = `rm.app.${appId}.client_id`;
    try {
      const existing = this.storage.getItem(key);
      if (existing && existing.startsWith("app-")) return existing;
      const minted = `app-${uuid4()}`;
      this.storage.setItem(key, minted);
      return minted;
    } catch {
      return this.clientId || `app-${uuid4()}`;
    }
  }
  // -------------------------------------------------------------------------
  // Inbound
  // -------------------------------------------------------------------------
  async handleMessage(raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const type = String(data.type ?? "");
    switch (type) {
      case "robot_status":
        await this.handleRobotStatus(data);
        return;
      case "registration":
      case "pong":
        return;
      case "error": {
        const backoff = Number(data.backoff ?? this.reconnectDelayMs);
        this.connection.set("offline");
        try {
          this.ws?.close();
        } catch {
        }
        this.ws = null;
        if (!this.reconnectTimer && !this.closed) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, backoff);
        }
        return;
      }
      default:
        break;
    }
    if (data.mode === "app" || this.isAppType(type)) {
      await this.handleAppEnvelope(type, data);
    }
  }
  isAppType(type) {
    switch (type) {
      case "hello_ack":
      case "action_result":
      case "action_error":
      case "action_progress":
      case "event":
      case "data_change":
      case "data_snapshot":
      case "contract_mismatch":
        return true;
      default:
        return false;
    }
  }
  async handleRobotStatus(data) {
    const status = String(data.robot_status ?? "");
    if (status === "connected") {
      const publicKey = typeof data.public_key === "string" ? data.public_key : null;
      const rekey = Boolean(publicKey) && publicKey !== this.robotPublicKey;
      if (publicKey && (!this.aesKey || rekey)) {
        this.robotPublicKey = publicKey;
        if (rekey) this.aesKey = null;
        try {
          await this.doKeyExchange();
          await this.sendHelloOrResume();
        } catch {
          this.connection.set("offline");
          try {
            this.ws?.close();
          } catch {
          }
        }
      }
      return;
    }
    if (status === "waiting" || status === "disconnected") {
      this.connection.set("robot_offline");
      this.failInFlight(
        new AppError("robot_offline", "The robot for this app is not connected.", true)
      );
      void this.reconnectIfRobotChanged();
    }
  }
  /**
   * Re-resolve the instance when the proxy says no robot is attached, and
   * reconnect if it now names a different one.
   *
   * An instance is created bound to the app's OWN application robot, which
   * exists as a quota row and never runs anything. A draft session started
   * from the Build view rewrites that binding to the robot the person
   * actually runs on. A preview page that resolved the instance before the
   * session started therefore holds the application robot's id, opens its
   * socket against a robot that will never connect, and waits for ever under
   * "the robot for this app is offline" while the real robot sits there
   * running the flow. Nothing recovered it but a full reload.
   *
   * Being told nothing is attached is exactly the moment to check, so this
   * costs one request in the case that was already broken and none in the
   * case that works.
   */
  async reconnectIfRobotChanged(throttled = true) {
    if (this.closed || !this.instance || !this.apiUrl) return;
    if (this.opts.instance) return;
    const now = Date.now();
    if (throttled && now - this.lastRobotRecheck < ROBOT_RECHECK_INTERVAL_MS) return;
    this.lastRobotRecheck = now;
    let fresh;
    try {
      fresh = await resolveInstance(this.apiUrl, this.instance.id, this.fetchFn);
    } catch {
      return;
    }
    if (this.closed || !fresh.robotId || fresh.robotId === this.instance.robotId) return;
    this.instance = fresh;
    try {
      this.ws?.close();
    } catch {
    }
    this.ws = null;
    this.connect();
  }
  /** Begin asking, while we are waiting on a robot that may never come. */
  startRobotRecheck() {
    if (this.closed || this.opts.instance) return;
    this.robotRecheckDelayMs = ROBOT_RECHECK_START_MS;
    this.scheduleRobotRecheck();
  }
  scheduleRobotRecheck() {
    if (this.closed || this.robotRecheckTimer) return;
    this.robotRecheckTimer = setTimeout(() => {
      this.robotRecheckTimer = null;
      if (this.closed || this.connection.state !== "robot_offline") return;
      void this.reconnectIfRobotChanged(false).then(
        () => this.continueRobotRecheck(),
        () => this.continueRobotRecheck()
      );
    }, this.robotRecheckDelayMs);
  }
  /** Back off and go round again, unless we got somewhere. */
  continueRobotRecheck() {
    if (this.closed || this.connection.state !== "robot_offline") return;
    this.robotRecheckDelayMs = Math.min(
      Math.round(this.robotRecheckDelayMs * 1.5),
      ROBOT_RECHECK_MAX_MS
    );
    this.scheduleRobotRecheck();
  }
  stopRobotRecheck() {
    if (this.robotRecheckTimer) {
      clearTimeout(this.robotRecheckTimer);
      this.robotRecheckTimer = null;
    }
    this.robotRecheckDelayMs = ROBOT_RECHECK_START_MS;
  }
  async doKeyExchange() {
    if (!this.robotPublicKey || !this.ws) return;
    const rsaKey = await importRsaPublicKey(this.robotPublicKey);
    const aesKey = await generateAesKey();
    const raw = await exportAesKeyRaw(aesKey);
    const encrypted = await encryptWithRsaOaep(rsaKey, raw);
    this.aesKey = aesKey;
    this.sendRaw({
      type: "key_exchange",
      encrypted_key: arrayBufferToBase64(encrypted),
      guid: this.connId,
      instance_id: this.instance.id,
      user_id: "",
      additional: {
        client_id: this.clientId,
        app_id: this.instance.appId,
        instance_id: this.instance.id,
        robot_id: this.instance.robotId
      },
      profile: {}
    });
  }
  /** First connection sends hello; every reconnect sends resume (protocol.md section 8). */
  async sendHelloOrResume() {
    const collections = {};
    for (const col of this.collections.values()) {
      if (col.desired > 0) {
        collections[col.name] = col.lastSeq;
        col.wireSubscribed = true;
      }
    }
    if (!this.helloSentOnce) {
      this.helloSentOnce = true;
      await this.sendEnvelope("hello", {
        client_id: this.clientId,
        contract_hash: this.contractHash,
        collections
      });
    } else {
      await this.sendEnvelope("resume", {
        client_id: this.clientId,
        pending_calls: [...this.pending.keys()],
        collections
      });
    }
  }
  async handleAppEnvelope(type, data) {
    let body = data;
    if (typeof data.payload === "string" && data.payload.includes(":") && this.aesKey) {
      try {
        body = await openBody(this.aesKey, data.payload);
      } catch {
        try {
          const plain = await aesGcmDecrypt(this.aesKey, data.payload);
          body = JSON.parse(tryBase64(plain));
        } catch {
          return;
        }
      }
    }
    switch (type) {
      case "hello_ack": {
        const ack = body;
        this.manifestSummary = ack.manifest_summary ?? null;
        if (ack.contract_hash && ack.contract_hash !== this.contractHash) {
          this.connection.set("contract_mismatch");
          return;
        }
        this.connection.set("ready");
        for (const col of this.collections.values()) {
          if (col.desired > 0 && !col.wireSubscribed) {
            col.wireSubscribed = true;
            void this.sendEnvelope("collection_subscribe", {
              collection: col.name,
              since_seq: col.lastSeq
            });
          }
        }
        return;
      }
      case "contract_mismatch": {
        this.connection.set("contract_mismatch");
        this.failInFlight(
          new AppError(
            "contract_mismatch",
            "This app was updated. Reload the page to continue.",
            false,
            { expected: body.expected, got: body.got }
          )
        );
        return;
      }
      case "action_result": {
        const callId = String(body.call_id ?? data.call_id ?? "");
        const p = this.pending.get(callId);
        if (p) this.settle(p, body.result, void 0);
        return;
      }
      case "action_error": {
        const callId = String(body.call_id ?? data.call_id ?? "");
        const p = this.pending.get(callId);
        if (p) {
          const err = AppError.from({
            code: body.code ?? data.code,
            message: body.message ?? data.message,
            retryable: body.retryable ?? data.retryable,
            details: body.details
          });
          err.callId = callId;
          this.settle(p, void 0, err);
        }
        return;
      }
      case "action_progress": {
        const callId = String(body.call_id ?? data.call_id ?? "");
        const p = this.pending.get(callId);
        if (p && !p.settled) {
          const percent = typeof body.percent === "number" ? body.percent : void 0;
          const message = typeof body.message === "string" ? body.message : void 0;
          if (p.onProgress) p.onProgress({ percent, message, data: body.data });
          dispatchDom("rm:action-progress", { action: p.action, callId, percent, message });
        }
        return;
      }
      case "event": {
        const name = String(body.event ?? "");
        const handlers = this.eventHandlers.get(name);
        if (handlers) {
          setCause(`event:${name}`);
          for (const h of [...handlers]) {
            try {
              h(body.payload);
            } catch {
            }
          }
        }
        return;
      }
      case "data_snapshot": {
        const name = String(body.collection ?? "");
        const col = this.collections.get(name);
        if (!col) return;
        const seq = Number(body.seq ?? 0);
        const records = Array.isArray(body.records) ? body.records : [];
        const keyField = this.opts.contract?.collections?.[name]?.key;
        col.applySnapshot(seq, records, (r) => {
          const rec = r;
          if (keyField && rec && rec[keyField] !== void 0) return String(rec[keyField]);
          for (const k of ["key", "id"]) {
            if (rec && rec[k] !== void 0) return String(rec[k]);
          }
          return JSON.stringify(rec);
        });
        return;
      }
      case "data_change": {
        const name = String(body.collection ?? "");
        const col = this.collections.get(name);
        if (!col) return;
        const seq = Number(body.seq ?? 0);
        const ops = Array.isArray(body.ops) ? body.ops : [];
        const outcome = col.applyChange(seq, ops);
        if (outcome === "gap") {
          void this.sendEnvelope("collection_subscribe", {
            collection: col.name,
            since_seq: col.lastSeq
          });
        }
        return;
      }
    }
  }
  failInFlight(err) {
    for (const p of [...this.pending.values()]) {
      this.settle(p, void 0, err);
    }
  }
  // -------------------------------------------------------------------------
  // Outbound
  // -------------------------------------------------------------------------
  sendRaw(obj) {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1) return;
    try {
      ws.send(JSON.stringify(obj));
    } catch {
    }
  }
  /**
   * Seal a body and send it in an app envelope. Sends are chained so the
   * async crypto cannot reorder hello ahead of key_exchange or interleave
   * two calls' envelopes.
   */
  sendEnvelope(type, body, extraTop = {}) {
    const task = async () => {
      const key = this.aesKey;
      if (!key) return;
      const payload = await sealBody(key, body);
      this.sendRaw({
        type,
        mode: "app",
        app_id: this.instance?.appId ?? "",
        instance_id: this.instance?.id ?? "",
        robot_id: this.instance?.robotId ?? "",
        contract_hash: this.contractHash,
        ...extraTop,
        payload
      });
    };
    const next = this.sendChain.then(task, task);
    this.sendChain = next.catch(() => void 0);
    return next;
  }
  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  /**
   * Invoke one action (sdk.md "Calling actions"). Resolves with the action
   * result; rejects with AppError using the protocol.md section 4.3 codes.
   */
  call(action, params, opts = {}) {
    if (this.closed) {
      return Promise.reject(new AppError("internal", "The app client is closed.", false));
    }
    const state = this.connection.state;
    if (state === "contract_mismatch") {
      return Promise.reject(
        new AppError("contract_mismatch", "This app was updated. Reload the page to continue.", false)
      );
    }
    if (state !== "ready") {
      return Promise.reject(
        new AppError("robot_offline", "The robot for this app is not connected.", true)
      );
    }
    if (opts.signal?.aborted) {
      return Promise.reject(new AppError("cancelled", "The action was cancelled.", false));
    }
    const callId = uuid4();
    const timeoutMs = opts.timeoutMs ?? this.defaultTimeout(action);
    return new Promise((resolve, reject) => {
      const p = {
        callId,
        action,
        resolve,
        reject,
        onProgress: opts.onProgress,
        signal: opts.signal,
        settled: false,
        startedAt: Date.now()
      };
      p.timer = setTimeout(() => {
        const err = new AppError("timeout", "The action took too long to answer.", true);
        err.callId = callId;
        this.settle(p, void 0, err);
      }, timeoutMs);
      if (opts.signal) {
        p.onAbort = () => {
          void this.sendEnvelope("action_cancel", { call_id: callId }, { call_id: callId });
          const err = new AppError("cancelled", "The action was cancelled.", false);
          err.callId = callId;
          this.settle(p, void 0, err);
        };
        opts.signal.addEventListener("abort", p.onAbort, { once: true });
      }
      this.pending.set(callId, p);
      void this.sendEnvelope("action_call", { call_id: callId, action, params: params ?? {} }, {
        call_id: callId
      });
      dispatchDom("rm:action-invoked", { action, callId });
    });
  }
  defaultTimeout(action) {
    const fromAck = this.manifestSummary?.actions?.[action]?.timeout_ms;
    if (typeof fromAck === "number" && fromAck > 0) return fromAck;
    const fromContract = this.opts.contract?.actions?.[action]?.timeout_ms;
    if (typeof fromContract === "number" && fromContract > 0) return fromContract;
    return DEFAULT_TIMEOUT_MS;
  }
  settle(p, value, err) {
    if (p.settled) return;
    p.settled = true;
    if (p.timer) clearTimeout(p.timer);
    if (p.signal && p.onAbort) p.signal.removeEventListener("abort", p.onAbort);
    this.pending.delete(p.callId);
    setCause(`action:${p.action}`);
    if (err) p.reject(err);
    else p.resolve(value);
    dispatchDom("rm:action-settled", {
      action: p.action,
      callId: p.callId,
      ok: !err,
      code: err?.code,
      message: err?.message,
      ms: Date.now() - p.startedAt
    });
  }
  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------
  /** Subscribe to a server event by name. Returns an off function. */
  on(event, handler) {
    let set = this.eventHandlers.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.eventHandlers.set(event, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
      if (set.size === 0) this.eventHandlers.delete(event);
    };
  }
  // -------------------------------------------------------------------------
  // Collections
  // -------------------------------------------------------------------------
  /** Get (or create) the shared handle for one collection. */
  collection(name) {
    let col = this.collections.get(name);
    if (!col) {
      col = new Collection(
        name,
        (c, sinceSeq) => {
          if (this.connection.state === "ready" && !c.wireSubscribed) {
            c.wireSubscribed = true;
            void this.sendEnvelope("collection_subscribe", {
              collection: c.name,
              since_seq: sinceSeq
            });
          }
        },
        (c) => {
          if (c.wireSubscribed) {
            c.wireSubscribed = false;
            if (this.connection.state === "ready") {
              void this.sendEnvelope("collection_unsubscribe", { collection: c.name });
            }
          }
        }
      );
      this.collections.set(name, col);
    }
    return col;
  }
};
function createApp(options) {
  const client = new AppClient(options);
  client.connect();
  try {
    installInspector();
  } catch {
  }
  try {
    installLinks({ appId: () => client.appId });
  } catch {
  }
  return client;
}
function tryBase64(text) {
  try {
    return base64ToUtf8(text);
  } catch {
    return text;
  }
}

// src/config.ts
async function loadRuntimeConfig(options) {
  const injected = readWindowEnv();
  if (injected) return injected;
  const fetchFn = options?.fetchFn ?? ((...args) => fetch(...args));
  let res;
  try {
    res = await fetchFn(devConfigURL());
  } catch (e) {
    throw new Error(
      "No runtime config: window.env is not injected and /__rm/config.json is not served. In dev, add robomotionAppKit() from @robomotion/app-kit/vite to vite.config.ts."
    );
  }
  if (!res.ok) {
    throw new Error(`/__rm/config.json answered with status ${res.status}`);
  }
  const json = await res.json();
  return normalize(json);
}
function devConfigURL() {
  const search = typeof location !== "undefined" ? location.search : "";
  const relative = `__rm/config.json${search}`;
  const base = typeof document !== "undefined" ? document.baseURI : void 0;
  if (!base) return `/${relative}`;
  try {
    return new URL(relative, base).toString();
  } catch {
    return `/${relative}`;
  }
}
function readWindowEnv() {
  if (typeof window === "undefined") return null;
  const env = window.env;
  if (!env || typeof env !== "object") return null;
  if (typeof env.instance_id !== "string" || env.instance_id === "") return null;
  if (typeof env.ws_url !== "string" || env.ws_url === "") return null;
  return normalize(env);
}
function normalize(input) {
  return {
    instance_id: typeof input.instance_id === "string" ? input.instance_id : "",
    app_id: typeof input.app_id === "string" ? input.app_id : "",
    ws_url: typeof input.ws_url === "string" ? input.ws_url : "",
    api_url: typeof input.api_url === "string" ? input.api_url : "",
    is_public: Boolean(input.is_public)
  };
}
export {
  AppClient,
  AppError,
  Collection,
  ConnectionInfo,
  FilesApi,
  aesGcmDecrypt,
  aesGcmEncrypt,
  arrayBufferToBase64,
  base58ToUuid,
  base64ToArrayBuffer,
  base64ToUtf8,
  bindAction,
  bindCollection,
  createApp,
  currentCause,
  decodeArtifactId,
  encodeArtifactId,
  installInspector,
  installLinks,
  instanceIdFromUrl,
  isAppError,
  isBase58,
  linkKey,
  loadRuntimeConfig,
  lookupTag,
  markGesture,
  openBody,
  resolveInstance,
  sealBody,
  splitLinkKey,
  tagAction,
  tagCollection,
  utf8ToBase64,
  uuidToBase58
};
//# sourceMappingURL=index.js.map