"use client";
import {
  El,
  S,
  co
} from "./chunk-MAGV6XDF.js";

// node_modules/streamdown/dist/highlighted-body-KPVGNVTW.js
import { useContext, useState, useEffect } from "react";
import { jsx } from "react/jsx-runtime";
var x = ({ code: s, language: e, maxHeight: h, raw: t, className: m, startLine: d, lineNumbers: a, ...c$1 }) => {
  let { shikiTheme: l } = useContext(S), i = El(), [p, o] = useState(t);
  return useEffect(() => {
    if (!i) {
      o(t);
      return;
    }
    let g = i.highlight({ code: s, language: e, themes: l }, (H) => {
      o(H);
    });
    g && o(g);
  }, [s, e, l, i, t]), jsx(co, { className: m, language: e, lineNumbers: a, maxHeight: h, result: p, startLine: d, ...c$1 });
};
export {
  x as HighlightedCodeBlockBody
};
//# sourceMappingURL=highlighted-body-KPVGNVTW-NUJGR42L.js.map