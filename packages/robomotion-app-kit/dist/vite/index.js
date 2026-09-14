// src/vite/index.ts
import { createRequire } from "module";
import { readFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { pathToFileURL } from "url";

// src/vite/heal.ts
function createHealer(deps) {
  var targets = {};
  var order = [];
  var timer = null;
  var inFlight = false;
  var until = 0;
  var stop = function() {
    if (timer !== null) {
      deps.clearInterval(timer);
      timer = null;
    }
  };
  var tick = function() {
    if (deps.hasDrawn()) {
      stop();
      return;
    }
    if (deps.now() > until) {
      stop();
      return;
    }
    if (inFlight) return;
    inFlight = true;
    var pending = order.slice();
    Promise.all(
      pending.map(function(u) {
        return deps.fetch(u, { cache: "no-store" }).then(
          function(r) {
            return !!(r && r.ok);
          },
          function() {
            return false;
          }
        );
      })
    ).then(
      function(oks) {
        inFlight = false;
        for (var i = 0; i < oks.length; i++) if (!oks[i]) return;
        if (deps.hasDrawn()) {
          stop();
          return;
        }
        stop();
        deps.reload();
      },
      function() {
        inFlight = false;
      }
    );
  };
  var watch = function(url) {
    if (!url || targets[url]) return;
    targets[url] = true;
    order.push(url);
    until = deps.now() + deps.forMs;
    if (timer === null) timer = deps.setInterval(tick, deps.everyMs);
  };
  return {
    noteFailure: function(id) {
      watch(deps.urlFor(id));
    },
    watchUrl: function(url) {
      watch(typeof url === "string" && url ? url : null);
    },
    watching: function() {
      return order.slice();
    },
    stop
  };
}
function healUrlFor(id, baseURI) {
  if (!id || typeof id !== "string" || id.charAt(0) !== "/") return null;
  if (id.indexOf("\0") >= 0 || id.indexOf("/@id/") >= 0) return null;
  try {
    return new URL("@fs" + id, baseURI).toString();
  } catch (e) {
    return null;
  }
}

// src/vite/index.ts
var DEFAULT_CONTRACT = "../app.json";
function loadContract(root, contractPath) {
  const candidates = contractPath ? [isAbsolute(contractPath) ? contractPath : resolve(root, contractPath)] : [resolve(root, DEFAULT_CONTRACT), resolve(root, "app.json")];
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, "utf-8"));
    } catch {
    }
  }
  return null;
}
function loadDevSession(root) {
  for (const candidate of [
    resolve(root, "../.robomotion/dev-session.json"),
    resolve(root, ".robomotion/dev-session.json")
  ]) {
    try {
      return JSON.parse(readFileSync(candidate, "utf-8"));
    } catch {
    }
  }
  return null;
}
function screensOf(contract) {
  const screens = contract?.screens ?? {};
  return Object.entries(screens).map(([name, s]) => ({
    name,
    description: s?.description ?? "",
    route: s?.route ?? `/${name}`
  }));
}
function bridgeScript(screens) {
  return `(function () {
  var embedded = window.parent !== window;
  var post = function (type, data) {
    if (!embedded) return;
    try {
      var msg = { type: type };
      if (data) for (var k in data) msg[k] = data[k];
      window.parent.postMessage(msg, "*");
    } catch (e) { /* the preview host is gone; nothing to do */ }
  };

  // A page load's identity. The host uses it to tell an error left over from
  // a previous load - which a fresh "ready" should clear - from one this very
  // load produced, which it must not (issue 41).
  var loadId = "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var errorCount = 0;

  // Errors the DEV SERVER can never see (issue 40).
  //
  // Vite serves a module that fails on import perfectly happily, so a wrong
  // import name, a crash on first render or a rejected promise leaves nothing
  // in the dev server's output at all - and the dev server's output is the
  // only thing the assistant can read. It reported "the screens are live with
  // no errors" about a page that had failed to load. Sending them back here
  // is what lets get_preview_errors answer honestly.
  var reportToDevServer = function (payload) {
    try {
      var url = new URL("__rm/errors", document.baseURI).toString();
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () { /* the dev server is gone; the panel still has it */ });
    } catch (e) { /* no fetch, no URL: not worth failing the page over */ }
  };

  var reportError = function (message, stack, source) {
    errorCount++;
    var payload = {
      message: String(message || "Unknown error"),
      stack: stack ? String(stack) : "",
      source: source ? String(source) : "",
      url: String(location.href),
      loadId: loadId,
      at: Date.now(),
    };
    post("rm-app-error", payload);
    reportToDevServer(payload);
    // Something failed, so start watching for it to stop failing.
    if (typeof watchForRecovery === "function") watchForRecovery();
  };
  var screens = ${JSON.stringify(screens)};

  // The first screen actually drawn, as distinct from the page having
  // loaded. rm-app-ready fires on DOMContentLoaded, which is before the
  // app's module has run - so a module that fails on import, or a Vite
  // transform that answers 500, leaves the page "ready" with nothing on it
  // but the placeholder below. The host covered that gap with the kit's
  // own "Getting your app ready" line for as long as it took (twenty-ninth
  // pass, app 3: four minutes). The placeholder is marked, and the app has
  // drawn when the mount point holds something that is not it.
  var drawn = false;
  var hasDrawn = function () {
    var root = document.getElementById("root");
    if (!root || root.children.length === 0) return false;
    for (var i = 0; i < root.children.length; i++) {
      if (!root.children[i].hasAttribute("data-rm-placeholder")) return true;
    }
    return false;
  };
  var drawnObserver = null;
  var announceDrawn = function () {
    if (drawn) return;
    drawn = true;
    // The app is on screen, so the self-heal budget below is spent and owed
    // again fresh the next time something breaks.
    try { sessionStorage.removeItem(HEAL_KEY); } catch (e) {}
    if (drawnObserver) { try { drawnObserver.disconnect(); } catch (e) {} drawnObserver = null; }
    post("rm-app-drawn", { loadId: loadId });
  };
  var watchForDrawn = function () {
    if (hasDrawn()) { announceDrawn(); return; }
    var root = document.getElementById("root");
    if (!root || typeof MutationObserver !== "function") return;
    if (drawnObserver) return;
    drawnObserver = new MutationObserver(function () { if (hasDrawn()) announceDrawn(); });
    drawnObserver.observe(root, { childList: true });
  };
  // reportsDrawn tells the host a drawn announcement follows; a host framing
  // an older kit, which never sends one, keeps treating ready as drawn.
  var ready = function () {
    post("rm-app-ready", { screens: screens, loadId: loadId, reportsDrawn: true });
    watchForDrawn();
  };
  if (document.readyState === "complete" || document.readyState === "interactive") ready();
  else document.addEventListener("DOMContentLoaded", ready);

  // The app came back. Say so, however it came back.
  //
  // A greeting under a NEW load id is the only thing that clears the host's
  // "Something in the app needs fixing" banner (issue 41), and for a long
  // time the only thing that produced one was a hot update landing cleanly.
  // That is not the only way an app recovers: Vite falls back to a full
  // reload for a change it cannot patch, the dev server gets bounced, a
  // render that threw on one pass succeeds on the next. On 2026-09-06 an app
  // was fixed, rendered correctly, and kept "CardBody is not defined" pinned
  // under it for the rest of the session - the panel's own logic was right
  // and no signal ever reached it.
  //
  // So recovery is observed rather than inferred from one event: once
  // anything has been reported, a page that has gone quiet for a moment AND
  // has something on screen is a page that is working again. Re-armed by
  // every error, so a broken app never announces itself well.
  var recoveryTimer = 0;
  var announceRecovery = function () {
    loadId = "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    // A new load id is a new page as far as the host is concerned, so the
    // drawn announcement is owed again under it.
    drawn = false;
    ready();
  };

  // Re-fetch the whole page to pick up a fixed module graph that Vite's own
  // hot reload did not deliver to us.
  //
  // The first write to an app's screens brings the preview up (issue 119),
  // which is by definition a moment when screens.tsx names page files the
  // assistant has not written yet: the frame boots, screens.tsx answers 500,
  // and #root holds only the placeholder. When the missing files land, Vite
  // sends a full-reload over its HMR socket - and a fresh tab of the same URL
  // gets it and draws. The Build panel's embedded, cross-origin frame does
  // NOT reliably get it (thirty-sixth pass: the frame sat on the placeholder
  // for a whole build while, from inside it, screens.tsx served 200 and
  // @vite/client pinged 200 - the module graph was healthy, the document was
  // just stale). The bridge runs inside that frame, so it can do what the
  // socket did not: reload.
  //
  // WHEN to reload is the whole question. A timer is wrong: the pages landed
  // 17 s and 51 s after the boot, and any budget of blind reloads is spent
  // long before that. Vite's error names the module it could not serve
  // (err.id, the importer's file), so the frame polls exactly that file and
  // reloads the moment the server answers it with 200 - not before, and not
  // on a guess. The reload itself is still bounded, so a module that serves
  // but whose graph fails on the next import cannot loop the frame; after
  // the budget the host shows its own "hasn't shown its first screen" card.
  var HEAL_KEY = "rm-heal-reloads";
  var HEAL_MAX = 3;
  var HEAL_EVERY_MS = 3000;
  var HEAL_FOR_MS = 15 * 60 * 1000;
  var selfHealReload = function () {
    var n = 0;
    try { n = parseInt(sessionStorage.getItem(HEAL_KEY) || "0", 10) || 0; } catch (e) {}
    if (n >= HEAL_MAX) return;
    try { sessionStorage.setItem(HEAL_KEY, String(n + 1)); } catch (e) {}
    try { location.reload(); } catch (e) { /* a locked-down frame cannot heal itself */ }
  };
  // The state machine lives in heal.ts (tested on its own) and is embedded
  // here verbatim: a set of failing modules that only grows, one interval
  // guarded by an in-flight flag, a reload only when every one of them
  // serves (issue 251).
  var healUrlFor = ${healUrlFor.toString()};
  var createHealer = ${createHealer.toString()};
  var healer = createHealer({
    fetch: function (u, init) { return fetch(u, init); },
    reload: selfHealReload,
    hasDrawn: function () { return drawn || hasDrawn(); },
    now: Date.now,
    setInterval: function (fn, ms) { return setInterval(fn, ms); },
    clearInterval: function (h) { clearInterval(h); },
    urlFor: function (id) { return healUrlFor(id, document.baseURI); },
    everyMs: HEAL_EVERY_MS,
    forMs: HEAL_FOR_MS,
  });
  var healWhenServed = function (id) { healer.noteFailure(id); };
  // A fresh document whose own <script type=module> answered 500 raises no
  // vite:error at all - the failure happened before any module ran. When
  // the placeholder is still up a few seconds after boot and nothing is
  // being watched, the module script is probed once and, if it does not
  // serve, watched like any other failure.
  var HEAL_BOOT_MS = 5000;
  setTimeout(function () {
    if (drawn || hasDrawn() || healer.watching().length > 0) return;
    var s = document.querySelector('script[type="module"][src]');
    var src = s && s.src;
    if (!src) return;
    fetch(src, { cache: "no-store" }).then(function (r) {
      if (!r.ok) healer.watchUrl(src);
    }).catch(function () { healer.watchUrl(src); });
  }, HEAL_BOOT_MS);

  // The host answers a stale backend (issue 262): while it restarts the
  // robot's side the banner shows "Updating" instead of a Reload that cannot
  // help, and reloads once the host says the backend matches the screens.
  // Carried into the page as DOM events the kit's banner listens for.
  window.addEventListener("message", function (e) {
    if (!embedded || e.source !== window.parent) return;
    var d = e && e.data;
    if (!d || typeof d !== "object" || typeof d.type !== "string") return;
    if (d.type === "rm-backend-updating") {
      try { window.dispatchEvent(new CustomEvent("rm:backend-updating", { detail: {} })); } catch (err) {}
    } else if (d.type === "rm-backend-updated") {
      try { window.dispatchEvent(new CustomEvent("rm:backend-updated", { detail: { ok: !!d.ok, message: d.message || "" } })); } catch (err) {}
    }
  });

  var watchForRecovery = function () {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    var seen = errorCount;
    recoveryTimer = setTimeout(function () {
      recoveryTimer = 0;
      if (errorCount !== seen) return;           // still failing; stay quiet
      // hasDrawn excludes the placeholder: a page holding only "Getting your
      // app ready" has NOT come back, however quiet it has gone, and must not
      // greet the host as if it had (that greeting is what wiped the reason
      // off the host's card in the thirty-sixth pass).
      if (!hasDrawn()) return;
      announceRecovery();
    }, 1500);
  };
  // Vite hands its own events - vite:error, vite:afterUpdate - ONLY to
  // listeners registered through its HMR API (import.meta.hot.on); it never
  // dispatches them on window. The two window listeners below had therefore
  // never fired since the day they were written: no compile failure ever
  // reached reportError or __rm/errors, no hot update ever armed the
  // recovery watch, and a frame that booted on a 500 had nothing watching it
  // at all (thirty-sixth pass, proven with an instrumented page). This inline
  // script has no import.meta.hot of its own, but the client module is
  // served under the same base and exports the context factory, so borrow
  // one and relay. Dynamic, and swallowed when it fails: a page not served
  // by Vite has nothing to relay.
  try {
    import(new URL("@vite/client", document.baseURI).href).then(function (m) {
      var hot = m.createHotContext("/__rm/bridge");
      ["vite:error", "vite:afterUpdate"].forEach(function (ev) {
        hot.on(ev, function (payload) {
          try { window.dispatchEvent(new CustomEvent(ev, { detail: payload })); } catch (e) {}
        });
      });
    }).catch(function () { /* not a Vite dev page: nothing to relay */ });
  } catch (e) { /* no dynamic import here: nothing to relay */ }

  window.addEventListener("vite:afterUpdate", watchForRecovery);

  // Vite's own compile/transform failures, which reach the page as an overlay
  // event rather than as a thrown error.
  window.addEventListener("vite:error", function (e) {
    var err = e && e.detail && e.detail.err;
    if (!err) return;
    reportError(err.message, err.stack, err.id || "vite");
    // The one failure with a file to watch: poll it, reload when it serves.
    healWhenServed(err.id);
  });

  // The route as the app's own router sees it: "/review", not
  // "/preview/<instance>/review". The mount prefix is announced by the
  // <base href> in the page; the host matches routes against app.json,
  // which never heard of the prefix.
  var appRoute = function () {
    var base = "/";
    try { base = new URL(document.baseURI).pathname; } catch (e) { base = "/"; }
    if (base.charAt(base.length - 1) !== "/") base = base.slice(0, base.lastIndexOf("/") + 1);
    var p = location.pathname;
    if (base !== "/" && p.indexOf(base) === 0) p = p.slice(base.length - 1);
    if (p.charAt(0) !== "/") p = "/" + p;
    return p + location.search + location.hash;
  };
  var emitRoute = function () {
    post("rm-route-change", { path: appRoute() });
  };
  var wrapHistory = function (fn) {
    return function () {
      var out = fn.apply(this, arguments);
      emitRoute();
      return out;
    };
  };
  try {
    history.pushState = wrapHistory(history.pushState);
    history.replaceState = wrapHistory(history.replaceState);
  } catch (e) { /* history is locked down; popstate still fires */ }
  window.addEventListener("popstate", emitRoute);
  window.addEventListener("hashchange", emitRoute);

  window.addEventListener("error", function (e) {
    reportError(
      (e && e.message) || "Unknown error",
      e && e.error && e.error.stack ? e.error.stack : "",
      ((e && e.filename) || "") + (e && e.lineno ? ":" + e.lineno : "")
    );
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    reportError(r && r.message ? r.message : r, r && r.stack ? r.stack : "", "unhandledrejection");
  });

  window.addEventListener("rm:action-invoked", function (e) {
    var d = (e && e.detail) || {};
    post("rm-action-invoked", { action: d.action, callId: d.callId });
  });
  window.addEventListener("rm:action-settled", function (e) {
    var d = (e && e.detail) || {};
    try { d.relayed = true; } catch (err) { /* frozen detail: the runtime may post its own copy */ }
    post("rm-action-settled", {
      action: d.action, callId: d.callId, ok: !!d.ok, code: d.code, message: d.message, ms: d.ms
    });
  });
  window.addEventListener("rm:action-progress", function (e) {
    var d = (e && e.detail) || {};
    try { d.relayed = true; } catch (err) { /* see above */ }
    post("rm-action-progress", { action: d.action, callId: d.callId, percent: d.percent, message: d.message });
  });
  // How the app is connected to its robot - the one thing the host framing
  // this page could never see. It could tell whether the SCREENS were being
  // served, and nothing else, so it painted "isn't running" over a live app
  // and framed an app with no backend as if its buttons would answer. The
  // runtime announces every transition; this carries it across the frame.
  window.addEventListener("rm:connection", function (e) {
    var d = (e && e.detail) || {};
    post("rm-connection", { state: d.state, mismatch: d.mismatch || null });
  });

})();`;
}
var SHARED_SPECIFIERS = [
  "@robomotion/apps-runtime",
  "@robomotion/apps-runtime/react",
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime"
];
function sharedResolvePlugin() {
  return {
    name: "robomotion-app-kit:resolve",
    enforce: "pre",
    config(userConfig) {
      const root = userConfig.root ? resolve(userConfig.root) : process.cwd();
      const req = createRequire(pathToFileURL(join(root, "package.json")));
      const alias = [];
      for (const spec of SHARED_SPECIFIERS) {
        try {
          alias.push({
            find: new RegExp(`^${spec.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}$`),
            replacement: req.resolve(spec)
          });
        } catch {
        }
      }
      if (alias.length === 0) return void 0;
      return { resolve: { alias, dedupe: SHARED_SPECIFIERS } };
    }
  };
}
function robomotionAppKit(options = {}) {
  return [sharedResolvePlugin(), bridgePlugin(options)];
}
var ROOT_DIV = '<div id="root"></div>';
var ROOT_DIV_WITH_PLACEHOLDER = `<div id="root"><div data-rm-placeholder="" style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:24px;font:14px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#8a8a8a;text-align:center">Getting your app ready\u2026</div></div>`;
function bridgePlugin(options = {}) {
  let root = process.cwd();
  let base = "/";
  return {
    name: "robomotion-app-kit",
    // Dev server only. Production builds never load this plugin, which is
    // exactly the "no-op in production" contract.
    apply: "serve",
    /**
     * Vite's crash overlay is off, because the person watching this frame is
     * not the one who can fix it.
     *
     * The preview now comes up on the first write to the app's screens
     * (issue 119) - which is, by definition, a moment when `screens.tsx`
     * names a page file the assistant has not written yet. So the first
     * pixel of the first app of the twenty-third pass was Vite's red
     * overlay, full-frame, reading `[plugin:vite:import-analysis] Failed to
     * resolve import "./pages/CalculatorPage"`, a stack of absolute paths,
     * and the advice to set `server.hmr.overlay` to false in
     * `vite.config.ts`. To somebody who has never seen a file path, ninety
     * seconds after asking for an app about parcels.
     *
     * Nothing is lost by turning it off. The bridge above listens for
     * `vite:error` itself and posts every compile failure to `__rm/errors`,
     * which is what `get_preview_errors` reads and what the assistant acts
     * on; and the Build panel shows its own plain banner over the frame.
     * The overlay was the only part of that chain written for a developer.
     */
    config(userConfig) {
      const root2 = userConfig.root ? resolve(userConfig.root) : process.cwd();
      return {
        server: {
          hmr: { overlay: false },
          fs: { allow: [resolve(root2, "..")] }
        }
      };
    },
    configResolved(config) {
      root = config.root;
      base = config.base || "/";
    },
    configureServer(server) {
      const configPath = "/__rm/config.json";
      const errorsPath = "/__rm/errors";
      const base2 = server.config.base || "/";
      const withBase = (p) => base2 === "/" ? p : base2.replace(/\/$/, "") + p;
      const basedConfigPath = withBase(configPath);
      const basedErrorsPath = withBase(errorsPath);
      const browserErrors = [];
      const MAX_BROWSER_ERRORS = 50;
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "/").replace(/[?#].*$/, "");
        if (pathname !== errorsPath && pathname !== basedErrorsPath) {
          next();
          return;
        }
        res.setHeader("Cache-Control", "no-store");
        if ((req.method ?? "GET").toUpperCase() === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            if (body.length < 64e3) body += String(chunk);
          });
          req.on("end", () => {
            try {
              const raw = JSON.parse(body);
              browserErrors.push({
                message: String(raw.message ?? "Unknown error"),
                stack: typeof raw.stack === "string" ? raw.stack : "",
                source: typeof raw.source === "string" ? raw.source : "",
                url: typeof raw.url === "string" ? raw.url : "",
                at: typeof raw.at === "number" ? raw.at : Date.now()
              });
              while (browserErrors.length > MAX_BROWSER_ERRORS) browserErrors.shift();
            } catch {
            }
            res.statusCode = 204;
            res.end();
          });
          return;
        }
        if ((req.method ?? "GET").toUpperCase() === "DELETE") {
          browserErrors.length = 0;
          res.statusCode = 204;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ errors: browserErrors }));
      });
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "/").replace(/[?#].*$/, "");
        if (pathname !== configPath && pathname !== basedConfigPath) {
          next();
          return;
        }
        const params = new URL(req.url ?? "/", "http://localhost").searchParams;
        const contract = loadContract(root, options.contract);
        const session = loadDevSession(root);
        const pick = (name, fallback) => {
          const q = params.get(name);
          if (q !== null && q !== "") return q;
          const f = session?.[name];
          if (typeof f === "string" && f !== "") return f;
          const d = options.config?.[name];
          if (typeof d === "string" && d !== "") return d;
          return fallback;
        };
        const isPublicRaw = params.get("is_public");
        const config = {
          instance_id: pick("instance_id", ""),
          app_id: pick("app_id", contract?.app_id ?? ""),
          ws_url: pick("ws_url", ""),
          api_url: pick("api_url", ""),
          is_public: isPublicRaw !== null ? isPublicRaw === "true" || isPublicRaw === "1" : typeof session?.is_public === "boolean" ? session.is_public : Boolean(options.config?.is_public)
        };
        for (const key of ["user_id", "session_id"]) {
          const v = session?.[key];
          if (typeof v === "string" && v !== "") config[key] = v;
        }
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(JSON.stringify(config));
      });
    },
    transformIndexHtml(html) {
      const contract = loadContract(root, options.contract);
      const tags = [
        {
          tag: "script",
          children: bridgeScript(screensOf(contract)),
          injectTo: "head"
        }
      ];
      if (!/<base\s/i.test(html)) {
        tags.push({ tag: "base", attrs: { href: base }, injectTo: "head-prepend" });
      }
      return { html: html.replace(ROOT_DIV, ROOT_DIV_WITH_PLACEHOLDER), tags };
    }
  };
}
var vite_default = robomotionAppKit;
export {
  vite_default as default,
  robomotionAppKit
};
//# sourceMappingURL=index.js.map