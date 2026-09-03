// src/vite/index.ts
import { readFileSync } from "fs";
import { isAbsolute, resolve } from "path";
function loadContract(root, contractPath) {
  const candidates = contractPath ? [isAbsolute(contractPath) ? contractPath : resolve(root, contractPath)] : [resolve(root, "app.json"), resolve(root, "../app.json")];
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
    resolve(root, ".robomotion/dev-session.json"),
    resolve(root, "../.robomotion/dev-session.json")
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
  if (window.parent === window) return;
  var post = function (type, data) {
    try {
      var msg = { type: type };
      if (data) for (var k in data) msg[k] = data[k];
      window.parent.postMessage(msg, "*");
    } catch (e) { /* the preview host is gone; nothing to do */ }
  };
  var screens = ${JSON.stringify(screens)};
  var ready = function () { post("rm-app-ready", { screens: screens }); };
  if (document.readyState === "complete" || document.readyState === "interactive") ready();
  else document.addEventListener("DOMContentLoaded", ready);

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
    post("rm-app-error", {
      message: String((e && e.message) || "Unknown error"),
      stack: e && e.error && e.error.stack ? String(e.error.stack) : "",
      source: ((e && e.filename) || "") + (e && e.lineno ? ":" + e.lineno : "")
    });
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    post("rm-app-error", {
      message: r && r.message ? String(r.message) : String(r),
      stack: r && r.stack ? String(r.stack) : "",
      source: "unhandledrejection"
    });
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

})();`;
}
function robomotionAppKit(options = {}) {
  let root = process.cwd();
  let base = "/";
  return {
    name: "robomotion-app-kit",
    // Dev server only. Production builds never load this plugin, which is
    // exactly the "no-op in production" contract.
    apply: "serve",
    configResolved(config) {
      root = config.root;
      base = config.base || "/";
    },
    configureServer(server) {
      const configPath = "/__rm/config.json";
      const base2 = server.config.base || "/";
      const basedConfigPath = base2 === "/" ? configPath : base2.replace(/\/$/, "") + configPath;
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
      return tags;
    }
  };
}
var vite_default = robomotionAppKit;
export {
  vite_default as default,
  robomotionAppKit
};
//# sourceMappingURL=index.js.map