// src/errors.ts
var AppError = class _AppError extends Error {
  code;
  retryable;
  details;
  /** The call this error settled, when it came from one (action links use it). */
  callId;
  constructor(code, message, retryable, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
  static from(input) {
    const code = input.code ?? "internal";
    const retryable = typeof input.retryable === "boolean" ? input.retryable : defaultRetryable(code);
    return new _AppError(code, input.message ?? defaultMessage(code), retryable, input.details);
  }
};
function isAppError(e) {
  return e instanceof AppError;
}
function defaultRetryable(code) {
  switch (code) {
    case "robot_offline":
    case "queue_full":
    case "timeout":
      return true;
    default:
      return false;
  }
}
function defaultMessage(code) {
  switch (code) {
    case "invalid_params":
      return "The request had invalid parameters.";
    case "unknown_action":
      return "The app does not know that action.";
    case "contract_mismatch":
      return "This app was updated. Reload the page to continue.";
    case "robot_offline":
      return "The robot for this app is not connected.";
    case "queue_full":
      return "The robot is busy. Try again in a moment.";
    case "timeout":
      return "The action took too long to answer.";
    case "cancelled":
      return "The action was cancelled.";
    case "concurrency_rejected":
      return "Too many of these are already running.";
    default:
      return "Something went wrong inside the app.";
  }
}

// src/inspect.ts
var OVERLAY_ATTR = "data-rm-inspect";
var ACCENT = "#FF4F00";
var installed = null;
function isElement(node) {
  return !!node && node.nodeType === 1;
}
function sourceOf(el) {
  try {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    if (!key) return null;
    let fiber = el[key];
    for (let hops = 0; fiber && hops < 40; hops++) {
      const s = fiber._debugSource;
      if (s?.fileName) {
        const parts = String(s.fileName).split(/[\\/]/);
        return {
          file: parts[parts.length - 1] ?? String(s.fileName),
          path: String(s.fileName),
          line: s.lineNumber ?? 0
        };
      }
      fiber = fiber.return;
    }
  } catch {
  }
  return null;
}
function appRoute() {
  let base = "/";
  try {
    const pathname = new URL(document.baseURI).pathname;
    base = pathname.endsWith("/") ? pathname : pathname.slice(0, pathname.lastIndexOf("/") + 1);
  } catch {
    base = "/";
  }
  let path = location.pathname;
  if (base !== "/" && path.startsWith(base)) path = path.slice(base.length - 1);
  if (!path.startsWith("/")) path = "/" + path;
  return path + location.search + location.hash;
}
function describe(el) {
  const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  return {
    tag: el.tagName.toLowerCase(),
    text: text.length > 120 ? `${text.slice(0, 120)}\u2026` : text,
    id: el.id || void 0,
    className: typeof el.className === "string" ? el.className : void 0,
    role: el.getAttribute("role") || void 0,
    route: appRoute(),
    source: sourceOf(el)
  };
}
function installInspector() {
  const noop = { stop: () => {
  } };
  if (typeof window === "undefined" || typeof document === "undefined") return noop;
  if (window.parent === window) return noop;
  if (installed) return installed;
  let armed = false;
  let host = null;
  let hovered = null;
  let box = null;
  let label = null;
  const post = (type, data) => {
    if (!host) return;
    try {
      window.parent.postMessage({ type, ...data ?? {} }, host);
    } catch {
    }
  };
  const ensureOverlay = () => {
    if (box) return;
    box = document.createElement("div");
    box.setAttribute(OVERLAY_ATTR, "box");
    box.style.cssText = [
      "position:fixed",
      "z-index:2147483646",
      "pointer-events:none",
      `border:1px solid ${ACCENT}`,
      "background:rgba(255,79,0,.10)",
      "border-radius:2px",
      "transition:all .05s linear",
      "display:none"
    ].join(";");
    label = document.createElement("div");
    label.setAttribute(OVERLAY_ATTR, "label");
    label.style.cssText = [
      "position:fixed",
      "z-index:2147483647",
      "pointer-events:none",
      "display:none",
      `background:${ACCENT}`,
      "color:#fff",
      "font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace",
      "padding:1px 5px",
      "border-radius:3px",
      "white-space:nowrap"
    ].join(";");
    document.body.appendChild(box);
    document.body.appendChild(label);
  };
  const paint = (el) => {
    ensureOverlay();
    if (!box || !label) return;
    const r = el.getBoundingClientRect();
    box.style.display = "block";
    box.style.left = `${r.left}px`;
    box.style.top = `${r.top}px`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
    label.style.display = "block";
    label.textContent = el.tagName.toLowerCase();
    label.style.left = `${r.left}px`;
    label.style.top = `${r.top >= 18 ? r.top - 17 : r.top + 2}px`;
  };
  const clearPaint = () => {
    hovered = null;
    if (box) box.style.display = "none";
    if (label) label.style.display = "none";
  };
  const pickable = (t) => isElement(t) && t !== document.body && t !== document.documentElement && !t.hasAttribute(OVERLAY_ATTR);
  const setArmed = (on) => {
    armed = on;
    if (on) {
      ensureOverlay();
      document.documentElement.style.cursor = "crosshair";
    } else {
      document.documentElement.style.cursor = "";
      clearPaint();
    }
  };
  const onMove = (e) => {
    if (!armed) return;
    const t = e.target;
    if (!pickable(t)) {
      clearPaint();
      return;
    }
    if (t === hovered) return;
    hovered = t;
    paint(t);
  };
  const onClick = (e) => {
    if (!armed) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.target;
    if (!pickable(t)) return;
    const r = t.getBoundingClientRect();
    post("rm-inspect-pick", {
      element: describe(t),
      rect: { x: r.left, y: r.top, width: r.width, height: r.height }
    });
    setArmed(false);
  };
  const onKey = (e) => {
    if (!armed || e.key !== "Escape") return;
    setArmed(false);
    post("rm-inspect-cancel", {});
  };
  const onScroll = () => {
    if (armed && hovered) paint(hovered);
  };
  const onMessage = (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || typeof d !== "object" || d.type !== "rm-inspect-mode") return;
    host = e.origin;
    setArmed(Boolean(d.enabled));
  };
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("message", onMessage);
  installed = {
    stop() {
      setArmed(false);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("message", onMessage);
      box?.remove();
      label?.remove();
      box = null;
      label = null;
      installed = null;
    }
  };
  return installed;
}

// src/links.ts
var OVERLAY_ATTR2 = "data-rm-links";
var ATTR_ACTION = "data-rm-action";
var ATTR_COLLECTION = "data-rm-collection";
var ATTR_EVENT = "data-rm-event";
var ATTR_INFERRED = "data-rm-action-inferred";
var ATTR_DROPZONE = "data-rm-dropzone";
var GESTURE_WINDOW_MS = 250;
var DEBOUNCE_MS = 100;
var OK_FADE_MS = 4e3;
var HOVER_LINGER_MS = 1e3;
var REVEAL_WAIT_MS = 2e3;
var REVEAL_POLL_MS = 50;
var CAUSE_WINDOW_MS = 150;
var LABEL_MAX = 60;
var ACCENT2 = "#FF4F00";
var COLORS = {
  linked: "#8b8f98",
  running: ACCENT2,
  ok: "#16a34a",
  failed: "#dc2626",
  missing: "#f59e0b"
};
var SITE_SELECTOR = `button,a,[role="button"],label,form,[${ATTR_DROPZONE}],[${ATTR_ACTION}]`;
var DECLARED_SELECTOR = `[${ATTR_ACTION}],[${ATTR_COLLECTION}],[${ATTR_EVENT}],[${ATTR_INFERRED}]`;
function linkKey(ns, name) {
  return `${ns}:${name}`;
}
function splitLinkKey(key) {
  const at = key.indexOf(":");
  if (at < 0) return { ns: "action", name: key };
  const ns = key.slice(0, at);
  const name = key.slice(at + 1);
  if (ns === "collection" || ns === "event") return { ns, name };
  return { ns: "action", name };
}
function describeKey(key) {
  const { ns, name } = splitLinkKey(key);
  return { key, [ns]: name };
}
var tags = /* @__PURE__ */ new WeakMap();
function taggable(value) {
  return typeof value === "object" && value !== null || typeof value === "function";
}
function tagCollection(value, name) {
  if (taggable(value)) tags.set(value, linkKey("collection", name));
}
function tagAction(value, name) {
  if (taggable(value)) tags.set(value, linkKey("action", name));
}
function lookupTag(value) {
  if (!taggable(value)) return void 0;
  const key = tags.get(value);
  return key ? { key } : void 0;
}
function nameOf(v) {
  return typeof v === "string" ? v : v.name;
}
function bindAction(action) {
  return { "data-rm-action": nameOf(action) };
}
function bindCollection(collection) {
  return { "data-rm-collection": nameOf(collection) };
}
var cause = null;
function setCause(key) {
  cause = key ? { key, at: Date.now() } : null;
}
function currentCause() {
  if (!cause) return void 0;
  if (Date.now() - cause.at > CAUSE_WINDOW_MS) return void 0;
  return { key: cause.key };
}
var lastGesture = null;
function isElement2(node) {
  return !!node && node.nodeType === 1;
}
function markGesture(el) {
  if (isElement2(el)) lastGesture = { el, at: Date.now() };
}
function names(attr) {
  if (!attr) return [];
  const out = [];
  for (const n of attr.split(/\s+/)) {
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}
function isOverlay(node) {
  let el = isElement2(node) ? node : null;
  while (el) {
    if (el.hasAttribute(OVERLAY_ATTR2)) return true;
    el = el.parentElement;
  }
  return false;
}
function indexIn(parent, el) {
  const kids = parent.children;
  for (let i = 0; i < kids.length; i++) {
    if (kids[i] === el) return i;
  }
  return 0;
}
function domPath(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const parent = node.parentElement;
    parts.unshift(`${node.tagName.toLowerCase()}[${parent ? indexIn(parent, node) : 0}]`);
    node = parent;
  }
  return parts.join("/");
}
function shapePath(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body && node !== document.documentElement) {
    parts.unshift(node.tagName.toLowerCase());
    node = node.parentElement;
  }
  return parts.join("/");
}
function elementAtPath(path) {
  if (!path) return null;
  let node = document.body;
  for (const part of path.split("/")) {
    const m = /^([a-z0-9-]+)\[(\d+)\]$/.exec(part);
    if (!m) return null;
    const child = node.children[Number(m[2])];
    if (!child || child.tagName.toLowerCase() !== m[1]) return null;
    node = child;
  }
  return node;
}
function shapeOf(el) {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  if (tag === "table" || role === "table" || role === "grid" || el.querySelector?.("table")) return "table";
  if (tag === "form" || role === "form") return "form";
  if (tag === "ul" || tag === "ol" || role === "list") return "list";
  return "section";
}
function labelOf(el) {
  const clip = (t) => t.length > LABEL_MAX ? `${t.slice(0, LABEL_MAX - 1).trimEnd()}\u2026` : t;
  const explicit = (el.getAttribute("aria-label") || el.getAttribute("title") || "").trim();
  if (explicit) return clip(explicit.replace(/\s+/g, " "));
  const tag = el.tagName.toLowerCase();
  const isControl = tag === "button" || tag === "a" || tag === "label" || tag === "summary" || el.getAttribute("role") === "button" || el.hasAttribute("data-rm-dropzone");
  const caption = el.querySelector?.("caption");
  const captionText = caption ? (caption.textContent || "").replace(/\s+/g, " ").trim() : "";
  if (!isControl && captionText) return clip(captionText);
  const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  if (isControl) return clip(text || tag);
  if (text && text.length <= 40) return text;
  return shapeOf(el);
}
function submitButtonOf(form) {
  const candidates = form.querySelectorAll("button,input");
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const type = c.getAttribute("type");
    if (c.tagName === "INPUT" ? type === "submit" : (type ?? "submit") === "submit") return c;
  }
  return null;
}
function resolveSite(el) {
  if (el.tagName === "INPUT" && el.getAttribute("type") === "file") {
    const label = el.closest("label") ?? (el.id ? document.querySelector(`label[for="${el.id.replace(/"/g, '\\"')}"]`) : null);
    if (label) return label;
    const zone = el.closest(`[${ATTR_DROPZONE}]`) ?? el.parentElement?.querySelector(`[${ATTR_DROPZONE}]`) ?? null;
    if (zone) return zone;
  }
  const site = el.closest(SITE_SELECTOR);
  if (!site) return null;
  if (site.tagName === "FORM") return submitButtonOf(site) ?? site;
  return site;
}
function declaresAction(el, action) {
  let node = el;
  while (node) {
    if (names(node.getAttribute(ATTR_ACTION)).includes(action)) return true;
    node = node.parentElement;
  }
  return false;
}
function appendName(el, attr, name) {
  const current = names(el.getAttribute(attr));
  if (current.includes(name)) return false;
  el.setAttribute(attr, [...current, name].join(" "));
  return true;
}
function appBase() {
  try {
    const pathname = new URL(document.baseURI).pathname;
    return pathname.endsWith("/") ? pathname : pathname.slice(0, pathname.lastIndexOf("/") + 1);
  } catch {
    return "/";
  }
}
function sameRoute(a, b) {
  const norm = (r) => {
    let s = r.trim();
    if (!s.startsWith("/")) s = "/" + s;
    if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
    return s;
  };
  return norm(a) === norm(b);
}
var installed2 = null;
function installLinks(options = {}) {
  const noop = { stop: () => {
  } };
  if (typeof window === "undefined" || typeof document === "undefined") return noop;
  if (window.parent === window) return noop;
  if (installed2) return installed2;
  const appId = options.appId ?? (() => "");
  lastGesture = null;
  let host = null;
  let mode = "off";
  let handlers = {};
  let hostAt = 0;
  let inspectArmed = false;
  let sites = [];
  const screenSites = /* @__PURE__ */ new Map();
  const local = /* @__PURE__ */ new Map();
  const okTimers = /* @__PURE__ */ new Map();
  let lastSignature = "";
  let lastRoute = "";
  let debounce = null;
  let observer = null;
  let layer = null;
  let tip = null;
  const badges = /* @__PURE__ */ new Map();
  let hoveredSite = null;
  let lingerTimer = null;
  const post = (type, data) => {
    if (!host) return;
    try {
      window.parent.postMessage({ type, ...data ?? {} }, host);
    } catch {
    }
  };
  const armed = () => host !== null;
  let memoryFallback = {};
  const storageKey = () => `rm.links.${appId() || "app"}.inferred`;
  const readMemory = () => {
    try {
      const raw = sessionStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return memoryFallback;
    }
  };
  const writeMemory = (m) => {
    memoryFallback = m;
    try {
      sessionStorage.setItem(storageKey(), JSON.stringify(m));
    } catch {
    }
  };
  const remember = (path, action) => {
    const m = readMemory();
    const current = names(m[path]);
    if (current.includes(action)) return;
    m[path] = [...current, action].join(" ");
    writeMemory(m);
  };
  const applyMemory = () => {
    const m = readMemory();
    for (const path of Object.keys(m)) {
      const el = elementAtPath(path);
      if (!el || isOverlay(el)) continue;
      for (const action of names(m[path])) {
        if (declaresAction(el, action)) continue;
        appendName(el, ATTR_INFERRED, action);
      }
    }
  };
  const scanSites = () => {
    const out = [];
    const nodes = document.querySelectorAll(DECLARED_SELECTOR);
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (isOverlay(el)) continue;
      const path = domPath(el);
      const shape = shapePath(el);
      const label = labelOf(el);
      const declared = /* @__PURE__ */ new Set();
      const pairs = [
        [ATTR_ACTION, "action"],
        [ATTR_COLLECTION, "collection"],
        [ATTR_EVENT, "event"]
      ];
      for (const [attr, ns] of pairs) {
        for (const name of names(el.getAttribute(attr))) {
          const key = linkKey(ns, name);
          declared.add(key);
          out.push({ el, key, kind: "declared", id: `${key}@${path}`, label, group: `${key}|${shape}` });
        }
      }
      for (const name of names(el.getAttribute(ATTR_INFERRED))) {
        const key = linkKey("action", name);
        if (declared.has(key)) continue;
        out.push({ el, key, kind: "inferred", id: `${key}@${path}`, label, group: `${key}|${shape}` });
      }
    }
    return out;
  };
  const collapsed = (all) => {
    const groups = /* @__PURE__ */ new Map();
    for (const s of all) {
      const g = groups.get(s.group);
      if (g) g.count++;
      else groups.set(s.group, { site: s, count: 1 });
    }
    return [...groups.values()];
  };
  const linksPayload = (route) => {
    const links = [];
    for (const { site, count } of collapsed(sites)) {
      const entry = {
        ...describeKey(site.key),
        id: site.id,
        label: site.label,
        kind: site.kind
      };
      if (count > 1) entry.count = count;
      links.push(entry);
    }
    const screen = screenSites.get(route);
    if (screen) {
      for (const key of screen) {
        links.push({
          ...describeKey(key),
          id: `${key}@screen:${route}`,
          label: "When the screen opens",
          kind: "screen"
        });
      }
    }
    return links;
  };
  const emitLinks = (force = false) => {
    if (!armed()) return;
    const route = appRoute();
    const links = linksPayload(route);
    const signature = `${route}|${JSON.stringify(links)}`;
    if (!force && signature === lastSignature) return;
    lastSignature = signature;
    lastRoute = route;
    post("rm-links", { route, links });
  };
  const tick = (force = false) => {
    if (debounce) {
      clearTimeout(debounce);
      debounce = null;
    }
    if (!armed()) return;
    applyMemory();
    sites = scanSites();
    emitLinks(force);
    syncBadges();
  };
  const scheduleTick = () => {
    if (!armed()) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => tick(), DEBOUNCE_MS);
  };
  const setLocal = (key, state) => {
    local.set(key, { state, at: Date.now() });
    const t = okTimers.get(key);
    if (t) {
      clearTimeout(t);
      okTimers.delete(key);
    }
    if (state === "ok") {
      okTimers.set(
        key,
        setTimeout(() => {
          okTimers.delete(key);
          const cur = local.get(key);
          if (cur && cur.state === "ok") {
            local.set(key, { state: "linked", at: cur.at });
            restyleBadges();
          }
        }, OK_FADE_MS)
      );
    }
    restyleBadges();
  };
  const stateOf = (key) => {
    const h = handlers[key];
    const l = local.get(key);
    if (l && l.at >= hostAt) return l.state;
    return h?.state ?? l?.state ?? "linked";
  };
  const addScreenSite = (key) => {
    const route = appRoute();
    let set = screenSites.get(route);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      screenSites.set(route, set);
    }
    set.add(key);
  };
  const onInvoked = (e) => {
    const d = e.detail ?? {};
    const action = typeof d.action === "string" ? d.action : "";
    if (!action || !armed()) return;
    const key = linkKey("action", action);
    setLocal(key, "running");
    const g = lastGesture;
    const elapsed = g ? Date.now() - g.at : Infinity;
    const fresh = g !== null && elapsed >= 0 && elapsed <= GESTURE_WINDOW_MS && g.el.isConnected !== false;
    const site = fresh && g ? resolveSite(g.el) : null;
    if (site && !isOverlay(site)) {
      if (!declaresAction(site, action)) {
        appendName(site, ATTR_INFERRED, action);
        remember(domPath(site), action);
      }
    } else {
      addScreenSite(key);
    }
    tick();
  };
  const onSettled = (e) => {
    const d = e.detail ?? {};
    const action = typeof d.action === "string" ? d.action : "";
    if (!action || !armed()) return;
    const key = linkKey("action", action);
    setLocal(key, d.ok ? "ok" : "failed");
    if (d.relayed) return;
    post("rm-action-settled", {
      action,
      callId: d.callId,
      ok: Boolean(d.ok),
      code: d.code,
      message: d.message,
      ms: d.ms
    });
  };
  const onProgress = (e) => {
    const d = e.detail ?? {};
    const action = typeof d.action === "string" ? d.action : "";
    if (!action || !armed()) return;
    setLocal(linkKey("action", action), "running");
    if (d.relayed) return;
    post("rm-action-progress", {
      action,
      callId: d.callId,
      percent: d.percent,
      message: d.message
    });
  };
  const recordGesture = (e) => {
    const t = e.target;
    if (!isElement2(t) || isOverlay(t)) return;
    if (e.type === "keydown") {
      const k = e.key;
      if (k !== "Enter" && k !== " " && k !== "Spacebar") return;
    }
    lastGesture = { el: t, at: Date.now() };
  };
  const ensureOverlay = () => {
    if (layer) return;
    layer = document.createElement("div");
    layer.setAttribute(OVERLAY_ATTR2, "layer");
    layer.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:0",
      "height:0",
      "z-index:2147483644",
      "pointer-events:none",
      "display:none"
    ].join(";");
    const style = document.createElement("style");
    style.setAttribute(OVERLAY_ATTR2, "style");
    style.textContent = [
      `@keyframes rm-links-pulse{0%{box-shadow:0 0 0 2px #fff,0 0 0 3px rgba(255,79,0,.55)}100%{box-shadow:0 0 0 2px #fff,0 0 0 9px rgba(255,79,0,0)}}`,
      `@keyframes rm-links-ring{0%{opacity:1;transform:scale(1)}70%{opacity:.9}100%{opacity:0;transform:scale(1.03)}}`,
      `[${OVERLAY_ATTR2}="badge"][data-state="running"]{animation:rm-links-pulse 1s ease-out infinite}`,
      `[${OVERLAY_ATTR2}="ring"]{animation:rm-links-ring 1.5s ease-out 1 forwards}`
    ].join("\n");
    layer.appendChild(style);
    tip = document.createElement("div");
    tip.setAttribute(OVERLAY_ATTR2, "tip");
    tip.style.cssText = [
      "position:fixed",
      "z-index:2147483645",
      "pointer-events:none",
      "display:none",
      "max-width:260px",
      "background:#1f2937",
      "color:#fff",
      "font:400 11px/1.4 system-ui,-apple-system,Segoe UI,sans-serif",
      "padding:5px 8px",
      "border-radius:5px",
      "box-shadow:0 2px 8px rgba(0,0,0,.25)",
      "white-space:normal"
    ].join(";");
    document.body.appendChild(layer);
    document.body.appendChild(tip);
  };
  const glyph = (ns) => {
    switch (ns) {
      case "collection":
        return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="1.5" width="8" height="7" rx="1"/><path d="M1 4.5h8M4 4.5v4"/></svg>`;
      case "event":
        return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 3.5v3M4 2v6M6 3v4M8 3.8v2.4"/></svg>`;
      default:
        return `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5.6 1 2 5.6h2.6L4.2 9 8 4.4H5.4z"/></svg>`;
    }
  };
  const showTip = (badge, site, count) => {
    if (!tip) return;
    const h = handlers[site.key];
    const { ns, name } = splitLinkKey(site.key);
    tip.textContent = "";
    const title = document.createElement("div");
    title.style.cssText = "font-weight:600";
    title.textContent = h?.title || (ns === "action" ? name : `${ns} ${name}`);
    tip.appendChild(title);
    const noteText = [
      h?.note,
      site.kind === "inferred" ? "learned from a click" : void 0,
      count > 1 ? `${count} of these` : void 0
    ].filter(Boolean).join(" \xB7 ");
    if (noteText) {
      const note = document.createElement("div");
      note.style.cssText = "opacity:.85;margin-top:2px";
      note.textContent = noteText;
      tip.appendChild(note);
    }
    const r = badge.getBoundingClientRect();
    tip.style.display = "block";
    tip.style.left = `${Math.max(4, r.left - 8)}px`;
    tip.style.top = `${r.top >= 48 ? r.top - 44 : r.bottom + 6}px`;
  };
  const hideTip = () => {
    if (tip) tip.style.display = "none";
  };
  const badgeVisible = (site) => {
    if (mode === "all") return true;
    if (mode === "hover") return hoveredSite !== null && (site.el === hoveredSite || site.el.contains(hoveredSite));
    return false;
  };
  const positionBadge = (entry) => {
    const r = entry.site.el.getBoundingClientRect();
    if (!r || r.width === 0 && r.height === 0) {
      entry.el.style.display = "none";
      return;
    }
    entry.el.style.display = "flex";
    entry.el.style.left = `${r.right - 9 - entry.offset * 20}px`;
    entry.el.style.top = `${r.top - 9}px`;
  };
  const styleBadge = (entry) => {
    const state = stateOf(entry.site.key);
    entry.el.style.background = COLORS[state];
    entry.el.setAttribute("data-state", state);
    entry.el.style.opacity = badgeVisible(entry.site) ? "1" : "0";
    entry.el.style.pointerEvents = badgeVisible(entry.site) ? "auto" : "none";
  };
  const restyleBadges = () => {
    for (const entry of badges.values()) styleBadge(entry);
  };
  const positionBadges = () => {
    for (const entry of badges.values()) positionBadge(entry);
  };
  const syncBadges = () => {
    if (!layer) {
      if (mode === "off" || inspectArmed) return;
      ensureOverlay();
    }
    if (!layer) return;
    layer.style.display = mode === "off" || inspectArmed ? "none" : "block";
    for (const entry of badges.values()) entry.el.remove();
    badges.clear();
    if (mode === "off" || inspectArmed) return;
    const perElement = /* @__PURE__ */ new Map();
    for (const { site, count } of collapsed(sites)) {
      if (!handlers[site.key]) continue;
      const { ns } = splitLinkKey(site.key);
      const offset = perElement.get(site.el) ?? 0;
      perElement.set(site.el, offset + 1);
      const b = document.createElement("div");
      b.setAttribute(OVERLAY_ATTR2, "badge");
      b.setAttribute("data-key", site.key);
      b.style.cssText = [
        "position:fixed",
        "width:18px",
        "height:18px",
        `border-radius:${ns === "action" ? "50%" : "4px"}`,
        "color:#fff",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "font:700 10px/1 system-ui,-apple-system,Segoe UI,sans-serif",
        "box-shadow:0 0 0 2px #fff",
        "cursor:pointer",
        "pointer-events:auto",
        "transition:opacity .2s ease",
        "opacity:0",
        "user-select:none"
      ].join(";");
      if (count > 1) b.textContent = String(count);
      else b.innerHTML = glyph(ns);
      b.addEventListener("mouseenter", () => {
        if (lingerTimer) {
          clearTimeout(lingerTimer);
          lingerTimer = null;
        }
        showTip(b, site, count);
      });
      b.addEventListener("mouseleave", () => {
        hideTip();
        if (mode === "hover") startLinger();
      });
      const swallow = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      b.addEventListener("pointerdown", swallow, true);
      b.addEventListener("mousedown", swallow, true);
      b.addEventListener(
        "click",
        (e) => {
          swallow(e);
          post("rm-link-click", { ...describeKey(site.key), id: site.id });
        },
        true
      );
      const entry = { el: b, site, offset };
      badges.set(site.id, entry);
      positionBadge(entry);
      styleBadge(entry);
      layer.appendChild(b);
    }
  };
  const startLinger = () => {
    if (lingerTimer) clearTimeout(lingerTimer);
    lingerTimer = setTimeout(() => {
      lingerTimer = null;
      hoveredSite = null;
      restyleBadges();
    }, HOVER_LINGER_MS);
  };
  const onMove = (e) => {
    if (mode !== "hover" || inspectArmed) return;
    const t = e.target;
    if (!isElement2(t)) return;
    if (isOverlay(t)) {
      if (lingerTimer) {
        clearTimeout(lingerTimer);
        lingerTimer = null;
      }
      return;
    }
    let site = null;
    for (const s of sites) {
      if (s.el === t || s.el.contains(t)) {
        if (!site || site.contains(s.el)) site = s.el;
      }
    }
    if (site) {
      if (lingerTimer) {
        clearTimeout(lingerTimer);
        lingerTimer = null;
      }
      if (site !== hoveredSite) {
        hoveredSite = site;
        restyleBadges();
      }
      return;
    }
    if (hoveredSite && !lingerTimer) startLinger();
  };
  const paintRing = (el) => {
    ensureOverlay();
    if (!layer) return;
    const r = el.getBoundingClientRect();
    const ring = document.createElement("div");
    ring.setAttribute(OVERLAY_ATTR2, "ring");
    ring.style.cssText = [
      "position:fixed",
      "pointer-events:none",
      `border:2px solid ${ACCENT2}`,
      "border-radius:6px",
      "box-shadow:0 0 0 4px rgba(255,79,0,.25)",
      `left:${r.left - 4}px`,
      `top:${r.top - 4}px`,
      `width:${r.width + 8}px`,
      `height:${r.height + 8}px`
    ].join(";");
    const wasHidden = layer.style.display === "none";
    if (wasHidden) layer.style.display = "block";
    layer.appendChild(ring);
    setTimeout(() => {
      ring.remove();
      if (layer && wasHidden && (mode === "off" || inspectArmed) && badges.size === 0) {
        layer.style.display = "none";
      }
    }, 1500);
  };
  const findSite = (key) => {
    const all = scanSites();
    return all.find((s) => s.key === key && s.kind === "declared") ?? all.find((s) => s.key === key) ?? null;
  };
  const navigateTo = (route) => {
    const href = appBase() + route.replace(/^\//, "");
    try {
      history.pushState(null, "", href);
    } catch {
      return;
    }
    try {
      window.dispatchEvent(
        typeof PopStateEvent !== "undefined" ? new PopStateEvent("popstate") : new Event("popstate")
      );
    } catch {
    }
  };
  const reveal = (key, route) => {
    if (route && !sameRoute(route, appRoute())) navigateTo(route);
    const t0 = Date.now();
    const attempt = () => {
      const site = findSite(key);
      if (site) {
        try {
          site.el.scrollIntoView({ block: "center" });
        } catch {
        }
        paintRing(site.el);
        tick();
        post("rm-reveal-result", { key, found: true });
        return;
      }
      if (Date.now() - t0 >= REVEAL_WAIT_MS) {
        const screen = screenSites.get(appRoute());
        post("rm-reveal-result", { key, found: Boolean(screen?.has(key)) });
        return;
      }
      setTimeout(attempt, REVEAL_POLL_MS);
    };
    attempt();
  };
  const onMessage = (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || typeof d !== "object" || typeof d.type !== "string") return;
    if (d.type === "rm-inspect-mode") {
      inspectArmed = Boolean(d.enabled);
      if (inspectArmed) {
        hideTip();
        if (layer) layer.style.display = "none";
      } else if (armed()) {
        syncBadges();
      }
      return;
    }
    if (d.type === "rm-links-mode") {
      if (host === null) host = e.origin;
      else if (host !== e.origin) return;
      const m = d.mode;
      mode = m === "hover" || m === "all" ? m : "off";
      const h = d.handlers;
      handlers = {};
      if (h && typeof h === "object") {
        for (const [k, v] of Object.entries(h)) {
          if (v && typeof v === "object") {
            const { ns, name } = splitLinkKey(k);
            handlers[linkKey(ns, name)] = v;
          }
        }
      }
      hostAt = Date.now();
      hoveredSite = null;
      startObserving();
      tick(true);
      return;
    }
    if (d.type === "rm-reveal") {
      if (!armed() || host !== e.origin) return;
      const key = d.key;
      const route = d.route;
      if (typeof key !== "string" || !key) return;
      const { ns, name } = splitLinkKey(key);
      reveal(linkKey(ns, name), typeof route === "string" ? route : void 0);
    }
  };
  const onRouteSignal = () => {
    if (!armed()) return;
    if (appRoute() !== lastRoute) tick();
    else scheduleTick();
  };
  const onScrollOrResize = () => {
    if (badges.size) positionBadges();
  };
  const startObserving = () => {
    if (observer || typeof MutationObserver === "undefined" || !document.body) return;
    observer = new MutationObserver((records) => {
      let relevant = false;
      for (const r of records) {
        if (!isOverlay(r.target)) {
          relevant = true;
          break;
        }
      }
      if (relevant) scheduleTick();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [ATTR_ACTION, ATTR_COLLECTION, ATTR_EVENT, ATTR_INFERRED]
    });
  };
  const gestureTypes = ["pointerdown", "click", "keydown", "submit", "change", "drop"];
  for (const type of gestureTypes) document.addEventListener(type, recordGesture, true);
  document.addEventListener("mousemove", onMove, true);
  window.addEventListener("rm:action-invoked", onInvoked);
  window.addEventListener("rm:action-settled", onSettled);
  window.addEventListener("rm:action-progress", onProgress);
  window.addEventListener("popstate", onRouteSignal);
  window.addEventListener("hashchange", onRouteSignal);
  window.addEventListener("rm:navigate", onRouteSignal);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("message", onMessage);
  try {
    window.parent.postMessage({ type: "rm-links-ready" }, "*");
  } catch {
  }
  installed2 = {
    stop() {
      for (const type of gestureTypes) document.removeEventListener(type, recordGesture, true);
      document.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("rm:action-invoked", onInvoked);
      window.removeEventListener("rm:action-settled", onSettled);
      window.removeEventListener("rm:action-progress", onProgress);
      window.removeEventListener("popstate", onRouteSignal);
      window.removeEventListener("hashchange", onRouteSignal);
      window.removeEventListener("rm:navigate", onRouteSignal);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("message", onMessage);
      observer?.disconnect();
      observer = null;
      if (debounce) clearTimeout(debounce);
      if (lingerTimer) clearTimeout(lingerTimer);
      for (const t of okTimers.values()) clearTimeout(t);
      okTimers.clear();
      layer?.remove();
      tip?.remove();
      layer = null;
      tip = null;
      badges.clear();
      host = null;
      lastGesture = null;
      installed2 = null;
    }
  };
  return installed2;
}

export {
  AppError,
  isAppError,
  installInspector,
  linkKey,
  splitLinkKey,
  tagCollection,
  tagAction,
  lookupTag,
  bindAction,
  bindCollection,
  setCause,
  currentCause,
  markGesture,
  installLinks
};
//# sourceMappingURL=chunk-6JQLVNM7.js.map