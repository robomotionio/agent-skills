"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/tailwind/index.ts
var tailwind_exports = {};
__export(tailwind_exports, {
  SEMANTIC_COLORS: () => SEMANTIC_COLORS,
  appKitPreset: () => appKitPreset,
  default: () => tailwind_default
});
module.exports = __toCommonJS(tailwind_exports);
function token(name) {
  return `oklch(var(--rm-${name}) / <alpha-value>)`;
}
var SEMANTIC_COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "muted",
  "muted-foreground",
  "border",
  "input",
  "ring",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
  "sidebar",
  "sidebar-foreground",
  "sidebar-border",
  "sidebar-accent",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "accent-50",
  "accent-100",
  "accent-200",
  "accent-300",
  "accent-400",
  "accent-500",
  "accent-600",
  "accent-700",
  "accent-800",
  "accent-900",
  "accent-950"
];
var appKitPreset = {
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("destructive-foreground") },
        success: { DEFAULT: token("success"), foreground: token("success-foreground") },
        warning: { DEFAULT: token("warning"), foreground: token("warning-foreground") },
        info: { DEFAULT: token("info"), foreground: token("info-foreground") },
        sidebar: {
          DEFAULT: token("sidebar"),
          foreground: token("sidebar-foreground"),
          border: token("sidebar-border"),
          accent: token("sidebar-accent")
        },
        chart: {
          1: token("chart-1"),
          2: token("chart-2"),
          3: token("chart-3"),
          4: token("chart-4"),
          5: token("chart-5")
        },
        accent: {
          50: token("accent-50"),
          100: token("accent-100"),
          200: token("accent-200"),
          300: token("accent-300"),
          400: token("accent-400"),
          500: token("accent-500"),
          600: token("accent-600"),
          700: token("accent-700"),
          800: token("accent-800"),
          900: token("accent-900"),
          950: token("accent-950")
        }
      },
      borderColor: {
        DEFAULT: token("border")
      },
      borderRadius: {
        DEFAULT: "var(--rm-radius)",
        sm: "calc(var(--rm-radius) - 0.25rem)",
        md: "calc(var(--rm-radius) - 0.125rem)",
        lg: "var(--rm-radius)",
        xl: "calc(var(--rm-radius) + 0.25rem)",
        "2xl": "calc(var(--rm-radius) + 0.5rem)"
      },
      boxShadow: {
        sm: "var(--rm-shadow-sm)",
        DEFAULT: "var(--rm-shadow-sm)",
        md: "var(--rm-shadow-md)",
        lg: "var(--rm-shadow-lg)"
      },
      fontFamily: {
        sans: ["var(--rm-font-sans)"],
        mono: ["var(--rm-font-mono)"]
      },
      ringColor: {
        DEFAULT: token("ring")
      }
    }
  }
};
var tailwind_default = appKitPreset;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SEMANTIC_COLORS,
  appKitPreset
});
//# sourceMappingURL=index.cjs.map