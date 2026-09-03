// src/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/theme.ts
var DEFAULT_ACCENT = "#FF4F00";
function accentStyle(accent) {
  return { "--rm-accent": accent || DEFAULT_ACCENT };
}
var focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";
var inputBase = "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-[color:var(--rm-accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--rm-accent)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500";

// src/components/connection-banner.tsx
import { useEffect, useState } from "react";
import { useMaybeAppClient } from "@robomotion/apps-runtime/react";

// src/components/button.tsx
import { forwardRef } from "react";
import { cva } from "class-variance-authority";

// src/action.ts
function resolveParams(params, event) {
  return typeof params === "function" ? params(event) : params;
}
function joinNames(names) {
  const out = [];
  for (const n of names) {
    if (n && !out.includes(n)) out.push(n);
  }
  return out.length ? out.join(" ") : void 0;
}

// src/components/button.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    focusRing
  ),
  {
    variants: {
      variant: {
        primary: "bg-[color:var(--rm-accent)] text-white shadow-sm hover:brightness-95 active:brightness-90",
        secondary: "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-sm"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
var Button = forwardRef(function Button2({ className, variant, size, loading, disabled, children, type, action, params, onClick, ...props }, ref) {
  const busy = loading ?? action?.loading ?? false;
  const handleClick = action ? (e) => {
    onClick?.(e);
    void Promise.resolve(action.run(resolveParams(params, e))).catch(() => void 0);
  } : onClick;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ref,
      type: type ?? "button",
      className: cn(buttonVariants({ variant, size }), className),
      disabled: disabled || busy,
      "aria-busy": busy || void 0,
      "data-rm-action": action?.name,
      onClick: handleClick,
      ...props,
      children: [
        busy && /* @__PURE__ */ jsx(Spinner, {}),
        children
      ]
    }
  );
});
function Spinner({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn("h-4 w-4 animate-spin", className),
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          }
        )
      ]
    }
  );
}

// src/components/connection-banner.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function ConnectionBanner({ state, className }) {
  if (state !== void 0) return /* @__PURE__ */ jsx2(BannerView, { state, className });
  return /* @__PURE__ */ jsx2(AutoBanner, { className });
}
function AutoBanner({ className }) {
  const app = useMaybeAppClient();
  const [state, setState] = useState(app?.connection.state);
  useEffect(() => {
    if (!app) return;
    setState(app.connection.state);
    return app.connection.onChange(setState);
  }, [app]);
  if (!app || state === void 0) return null;
  return /* @__PURE__ */ jsx2(BannerView, { state, className });
}
function BannerView({ state, className }) {
  if (state === "ready" || state === "connecting") return null;
  if (state === "contract_mismatch") {
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "alert",
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5 text-left dark:border-red-500/30 dark:bg-red-950",
          className
        ),
        children: [
          /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium text-red-800 dark:text-red-300", children: "This app was updated. Reload the page to continue." }),
          /* @__PURE__ */ jsx2(
            Button,
            {
              variant: "danger",
              size: "sm",
              onClick: () => {
                if (typeof window !== "undefined") window.location.reload();
              },
              children: "Reload"
            }
          )
        ]
      }
    );
  }
  const message = state === "robot_offline" ? "The robot for this app is offline. Waiting for it to come back." : state === "unconfigured" ? (
    // Nothing was lost: this app has never had a backend to talk to.
    // Saying "reconnecting" here sends people hunting for a network
    // problem that does not exist.
    "Not connected to your robot yet. The screens below show sample data."
  ) : "Connection lost. Reconnecting.";
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      role: "status",
      className: cn(
        "flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-left dark:border-amber-500/30 dark:bg-amber-950",
        className
      ),
      children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", className: "h-2 w-2 animate-pulse rounded-full bg-amber-500" }),
        /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium text-amber-800 dark:text-amber-300", children: message })
      ]
    }
  );
}

// src/components/toast.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { currentCause, splitLinkKey } from "@robomotion/apps-runtime";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function causeAttrs(cause) {
  if (!cause) return {};
  const { ns, name } = splitLinkKey(cause);
  return { [`data-rm-${ns}`]: name };
}
var items = [];
var counter = 0;
var listeners = /* @__PURE__ */ new Set();
var timers = /* @__PURE__ */ new Map();
function emit() {
  for (const l of listeners) l(items);
}
function toast(opts) {
  const id = `toast-${++counter}`;
  let cause;
  try {
    cause = currentCause()?.key;
  } catch {
  }
  const item = { variant: "default", ...opts, id, cause };
  items = [...items, item];
  emit();
  const duration = opts.durationMs ?? 5e3;
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration)
    );
  }
  return id;
}
function dismissToast(id) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  const before = items.length;
  items = items.filter((i) => i.id !== id);
  if (items.length !== before) emit();
}
function useToast() {
  return { toast, dismiss: dismissToast };
}
var VARIANT_STYLES = {
  default: "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-950 dark:text-green-300",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950 dark:text-red-300"
};
function Toast({ className }) {
  const [list, setList] = useState2(items);
  useEffect2(() => {
    const listener = (l) => setList(l);
    listeners.add(listener);
    setList(items);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  if (list.length === 0) return null;
  return /* @__PURE__ */ jsx3(
    "div",
    {
      "aria-live": "polite",
      "aria-label": "Notifications",
      className: cn(
        "pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2",
        className
      ),
      children: list.map((item) => /* @__PURE__ */ jsxs3(
        "div",
        {
          role: "status",
          className: cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border p-3 text-left shadow-lg",
            VARIANT_STYLES[item.variant]
          ),
          ...causeAttrs(item.cause),
          children: [
            /* @__PURE__ */ jsxs3("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx3("div", { className: "text-sm font-medium", children: item.title }),
              item.description !== void 0 && /* @__PURE__ */ jsx3("div", { className: "mt-0.5 text-sm opacity-80", children: item.description })
            ] }),
            /* @__PURE__ */ jsx3(
              "button",
              {
                type: "button",
                "aria-label": "Dismiss notification",
                onClick: () => dismissToast(item.id),
                className: "shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rm-accent)]",
                children: /* @__PURE__ */ jsx3("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx3("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
              }
            )
          ]
        },
        item.id
      ))
    }
  );
}

// src/components/app-shell.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function AppShell({
  title,
  accent,
  logo,
  nav,
  activePath,
  onNavigate,
  connectionState,
  headerRight,
  children,
  className,
  style,
  ...props
}) {
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className: cn(
        "flex min-h-screen flex-col bg-neutral-50 text-left text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100",
        className
      ),
      style: { ...accentStyle(accent), ...style },
      ...props,
      children: [
        /* @__PURE__ */ jsx4("header", { className: "border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900", children: /* @__PURE__ */ jsxs4("div", { className: "mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4", children: [
          /* @__PURE__ */ jsxs4("div", { className: "flex min-w-0 items-center gap-2.5", children: [
            logo ?? /* @__PURE__ */ jsx4(
              "span",
              {
                "aria-hidden": "true",
                className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--rm-accent)] text-sm font-bold text-white",
                children: firstGlyph(title)
              }
            ),
            /* @__PURE__ */ jsx4("span", { className: "truncate text-sm font-semibold", children: title })
          ] }),
          nav && nav.length > 0 && /* @__PURE__ */ jsx4("nav", { "aria-label": "Main", className: "flex items-center gap-1 overflow-x-auto", children: nav.map((item) => {
            const active = item.path === activePath;
            const classes = cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              focusRing,
              active ? "bg-neutral-100 text-[color:var(--rm-accent)] dark:bg-neutral-800" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            );
            return onNavigate ? /* @__PURE__ */ jsx4(
              "button",
              {
                type: "button",
                onClick: () => onNavigate(item.path),
                "aria-current": active ? "page" : void 0,
                className: classes,
                children: item.label
              },
              item.path
            ) : /* @__PURE__ */ jsx4(
              "a",
              {
                href: item.path,
                "aria-current": active ? "page" : void 0,
                className: classes,
                children: item.label
              },
              item.path
            );
          }) }),
          /* @__PURE__ */ jsx4("div", { className: "ml-auto flex items-center gap-2", children: headerRight })
        ] }) }),
        /* @__PURE__ */ jsx4(ConnectionBanner, { state: connectionState }),
        /* @__PURE__ */ jsx4("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-6", children }),
        /* @__PURE__ */ jsx4(Toast, {})
      ]
    }
  );
}
function firstGlyph(title) {
  if (typeof title === "string" && title.length > 0) return title[0].toUpperCase();
  return "R";
}

// src/components/screen.tsx
import { useId } from "react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function Screen({ title, description, actions, children, className, ...props }) {
  const headingId = useId();
  return /* @__PURE__ */ jsxs5("section", { "aria-labelledby": headingId, className: cn("text-left", className), ...props, children: [
    /* @__PURE__ */ jsxs5("header", { className: "mb-6 flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(
          "h1",
          {
            id: headingId,
            className: "text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100",
            children: title
          }
        ),
        description !== void 0 && /* @__PURE__ */ jsx5("p", { className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
      ] }),
      actions !== void 0 && /* @__PURE__ */ jsx5("div", { className: "flex items-center gap-2", children: actions })
    ] }),
    children
  ] });
}

// src/components/card.tsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      className: cn(
        "rounded-lg border border-neutral-200 bg-white text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, title, description, children, ...props }) {
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className: cn(
        "border-b border-neutral-200 px-4 py-3 dark:border-neutral-800",
        className
      ),
      ...props,
      children: [
        title !== void 0 && /* @__PURE__ */ jsx6("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx6("p", { className: "mt-0.5 text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        children
      ]
    }
  );
}
function CardBody({ className, ...props }) {
  return /* @__PURE__ */ jsx6("div", { className: cn("px-4 py-4", className), ...props });
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      className: cn(
        "flex items-center justify-end gap-2 rounded-b-lg border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60",
        className
      ),
      ...props
    }
  );
}

// src/components/data-table.tsx
import {
  useEffect as useEffect3,
  useMemo,
  useRef,
  useState as useState3
} from "react";
import { lookupTag, splitLinkKey as splitLinkKey2 } from "@robomotion/apps-runtime";

// src/components/empty-state.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function EmptyState({ icon, title, description, action, className, ...props }) {
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700",
        className
      ),
      ...props,
      children: [
        icon !== void 0 ? /* @__PURE__ */ jsx7("div", { "aria-hidden": "true", className: "mb-1 text-neutral-400 dark:text-neutral-500", children: icon }) : /* @__PURE__ */ jsx7(
          "svg",
          {
            "aria-hidden": "true",
            className: "mb-1 h-8 w-8 text-neutral-300 dark:text-neutral-600",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: /* @__PURE__ */ jsx7(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M20 13V7a2 2 0 0 0-2-2h-3.5l-1-2h-3l-1 2H6a2 2 0 0 0-2 2v6m16 0v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4m16 0h-5a3 3 0 0 1-6 0H4"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx7("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx7("p", { className: "max-w-sm text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        action !== void 0 && /* @__PURE__ */ jsx7("div", { className: "mt-3", children: action })
      ]
    }
  );
}

// src/components/data-table.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function isLinkedAction(a) {
  return "action" in a && !!a.action;
}
function sourceLinkAttrs(source) {
  if (!source.name) return {};
  const ns = "records" in source ? "collection" : "action";
  return { [`data-rm-${ns}`]: source.name };
}
function rowsLinkAttrs(rows) {
  const tag = lookupTag(rows) ?? lookupTag(rows[0]);
  if (!tag) return {};
  const { ns, name } = splitLinkKey2(tag.key);
  return { [`data-rm-${ns}`]: name };
}
function defaultValue(row, col) {
  if (col.value) return col.value(row);
  const v = row[col.key];
  if (v === null || v === void 0) return v;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v);
}
function DataTable({
  columns,
  rows,
  rowKey,
  source,
  filterable = false,
  filterPlaceholder = "Filter rows",
  pageSize = 10,
  rowActions,
  onRowClick,
  caption,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyState,
  loading = false,
  className
}) {
  const [filter, setFilter] = useState3("");
  const [sortKey, setSortKey] = useState3(null);
  const [sortDir, setSortDir] = useState3("asc");
  const [page, setPage] = useState3(0);
  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) => columns.some((col) => {
        const v = defaultValue(row, col);
        return v !== null && v !== void 0 && String(v).toLowerCase().includes(needle);
      })
    );
  }, [rows, columns, filter]);
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = defaultValue(a, col);
      const vb = defaultValue(b, col);
      if (va === null || va === void 0) return vb === null || vb === void 0 ? 0 : 1;
      if (vb === null || vb === void 0) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), void 0, { numeric: true }) * dir;
    });
  }, [filtered, columns, sortKey, sortDir]);
  const paging = pageSize > 0;
  const pageCount = paging ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = paging ? sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize) : sorted;
  useEffect3(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  const toggleSort = (col) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };
  const alignClass = (align) => align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const showEmpty = !loading && sorted.length === 0;
  const linkAttrs = useMemo(
    () => source ? sourceLinkAttrs(source) : rowsLinkAttrs(rows),
    [rows, source]
  );
  return /* @__PURE__ */ jsxs8("div", { className: cn("text-left", className), ...linkAttrs, children: [
    filterable && /* @__PURE__ */ jsx8("div", { className: "mb-3 max-w-xs", children: /* @__PURE__ */ jsx8(
      "input",
      {
        type: "search",
        "aria-label": filterPlaceholder,
        className: cn(inputBase, "h-9"),
        placeholder: filterPlaceholder,
        value: filter,
        onChange: (e) => {
          setFilter(e.target.value);
          setPage(0);
        }
      }
    ) }),
    /* @__PURE__ */ jsx8("div", { className: "overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxs8("table", { className: "w-full border-collapse bg-white text-sm dark:bg-neutral-900", children: [
      caption && /* @__PURE__ */ jsx8("caption", { className: "sr-only", children: caption }),
      /* @__PURE__ */ jsx8("thead", { children: /* @__PURE__ */ jsxs8("tr", { className: "border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60", children: [
        columns.map((col) => {
          const active = sortKey === col.key;
          return /* @__PURE__ */ jsx8(
            "th",
            {
              scope: "col",
              "aria-sort": active ? sortDir === "asc" ? "ascending" : "descending" : void 0,
              className: cn(
                "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                alignClass(col.align),
                col.className
              ),
              children: col.sortable ? /* @__PURE__ */ jsxs8(
                "button",
                {
                  type: "button",
                  onClick: () => toggleSort(col),
                  className: cn(
                    "inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-neutral-900 dark:hover:text-neutral-100",
                    focusRing,
                    active && "text-neutral-900 dark:text-neutral-100"
                  ),
                  children: [
                    col.header,
                    /* @__PURE__ */ jsx8(SortIcon, { active, dir: sortDir })
                  ]
                }
              ) : col.header
            },
            col.key
          );
        }),
        rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx8("th", { scope: "col", className: "w-12 px-3 py-2.5", children: /* @__PURE__ */ jsx8("span", { className: "sr-only", children: "Row actions" }) })
      ] }) }),
      /* @__PURE__ */ jsxs8("tbody", { children: [
        loading && /* @__PURE__ */ jsx8("tr", { children: /* @__PURE__ */ jsx8(
          "td",
          {
            colSpan: columns.length + (rowActions?.length ? 1 : 0),
            className: "px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400",
            children: "Loading"
          }
        ) }),
        !loading && pageRows.map((row, i) => {
          const key = rowKey ? rowKey(row) : String(clampedPage * pageSize + i);
          return /* @__PURE__ */ jsxs8(
            "tr",
            {
              onClick: onRowClick ? () => onRowClick(row) : void 0,
              className: cn(
                "border-b border-neutral-100 last:border-b-0 dark:border-neutral-800",
                onRowClick && "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              ),
              children: [
                columns.map((col) => /* @__PURE__ */ jsx8(
                  "td",
                  {
                    className: cn(
                      "px-3 py-2.5 text-neutral-800 dark:text-neutral-200",
                      alignClass(col.align),
                      col.className
                    ),
                    children: col.render ? col.render(row) : cellText(defaultValue(row, col))
                  },
                  col.key
                )),
                rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx8("td", { className: "px-2 py-1.5 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx8(RowMenu, { row, actions: rowActions }) })
              ]
            },
            key
          );
        }),
        showEmpty && /* @__PURE__ */ jsx8("tr", { children: /* @__PURE__ */ jsx8("td", { colSpan: columns.length + (rowActions?.length ? 1 : 0), className: "p-0", children: emptyState ?? /* @__PURE__ */ jsx8(
          EmptyState,
          {
            className: "rounded-none border-0",
            title: emptyTitle,
            description: emptyDescription ?? (filter ? "No rows match the current filter." : void 0)
          }
        ) }) })
      ] })
    ] }) }),
    paging && sorted.length > pageSize && /* @__PURE__ */ jsxs8(
      "nav",
      {
        "aria-label": "Table pagination",
        className: "mt-3 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400",
        children: [
          /* @__PURE__ */ jsxs8("span", { children: [
            "Showing ",
            clampedPage * pageSize + 1,
            " to",
            " ",
            Math.min((clampedPage + 1) * pageSize, sorted.length),
            " of ",
            sorted.length
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx8(
              PagerButton,
              {
                label: "Previous page",
                disabled: clampedPage === 0,
                onClick: () => setPage(clampedPage - 1),
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsxs8("span", { "aria-current": "page", className: "tabular-nums", children: [
              clampedPage + 1,
              " / ",
              pageCount
            ] }),
            /* @__PURE__ */ jsx8(
              PagerButton,
              {
                label: "Next page",
                disabled: clampedPage >= pageCount - 1,
                onClick: () => setPage(clampedPage + 1),
                children: "Next"
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function cellText(v) {
  if (v === null || v === void 0 || v === "") {
    return /* @__PURE__ */ jsx8("span", { className: "text-neutral-400 dark:text-neutral-600", children: "-" });
  }
  return String(v);
}
function SortIcon({ active, dir }) {
  return /* @__PURE__ */ jsx8(
    "svg",
    {
      "aria-hidden": "true",
      className: cn("h-3 w-3", active ? "opacity-100" : "opacity-30"),
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      children: !active || dir === "asc" ? /* @__PURE__ */ jsx8("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 14 6-6 6 6" }) : /* @__PURE__ */ jsx8("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 10 6 6 6-6" })
    }
  );
}
function PagerButton({
  label,
  disabled,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx8(
    "button",
    {
      type: "button",
      "aria-label": label,
      disabled,
      onClick,
      className: cn(
        "rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
        focusRing
      ),
      children
    }
  );
}
function RowMenu({ row, actions }) {
  const [open, setOpen] = useState3(false);
  const buttonRef = useRef(null);
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  useEffect3(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    const first = itemRefs.current.find((el) => el && !el.disabled);
    first?.focus();
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const moveFocus = (delta) => {
    const enabled = itemRefs.current.filter((el) => !!el && !el.disabled);
    if (enabled.length === 0) return;
    const current = enabled.findIndex((el) => el === document.activeElement);
    const next = (current + delta + enabled.length) % enabled.length;
    enabled[next].focus();
  };
  const onMenuKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        itemRefs.current.find((el) => el && !el.disabled)?.focus();
        break;
      case "End": {
        e.preventDefault();
        const enabled = itemRefs.current.filter((el) => el && !el.disabled);
        enabled[enabled.length - 1]?.focus();
        break;
      }
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };
  const linkedNames = joinNames(actions.map((a) => isLinkedAction(a) ? a.action.name : void 0));
  return /* @__PURE__ */ jsxs8("div", { ref: rootRef, className: "relative inline-block", children: [
    /* @__PURE__ */ jsx8(
      "button",
      {
        ref: buttonRef,
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-label": "Row actions",
        "data-rm-action": linkedNames,
        onClick: () => setOpen((v) => !v),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
        className: cn(
          "rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          focusRing
        ),
        children: /* @__PURE__ */ jsxs8("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "currentColor", children: [
          /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "5", r: "1.75" }),
          /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "12", r: "1.75" }),
          /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "19", r: "1.75" })
        ] })
      }
    ),
    open && /* @__PURE__ */ jsx8(
      "div",
      {
        role: "menu",
        "aria-label": "Row actions",
        onKeyDown: onMenuKeyDown,
        className: "absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900",
        children: actions.map((action, i) => {
          const disabled = action.disabled?.(row) ?? false;
          return /* @__PURE__ */ jsx8(
            "button",
            {
              ref: (el) => {
                itemRefs.current[i] = el;
              },
              type: "button",
              role: "menuitem",
              tabIndex: -1,
              disabled,
              "data-rm-action": isLinkedAction(action) ? action.action.name : void 0,
              onClick: () => {
                close(false);
                if (isLinkedAction(action)) {
                  void Promise.resolve(action.action.run(action.params(row))).catch(() => void 0);
                } else {
                  action.onSelect(row);
                }
              },
              className: cn(
                "block w-full px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                action.danger ? "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10" : "text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800",
                "focus:outline-none"
              ),
              children: action.label
            },
            action.label
          );
        })
      }
    )
  ] });
}

// src/components/form.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect as useEffect4,
  useId as useId2,
  useMemo as useMemo2,
  useRef as useRef2,
  useState as useState4
} from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var FormContext = createContext(null);
var FieldContext = createContext(null);
function validateAgainstSchema(schema, values) {
  const errors = {};
  if (!schema || schema.type !== "object" || !schema.properties) return errors;
  const required = new Set(schema.required ?? []);
  for (const [name, prop] of Object.entries(schema.properties)) {
    const value = values[name];
    const empty = value === void 0 || value === null || typeof value === "string" && value.trim() === "";
    if (empty) {
      if (required.has(name)) errors[name] = "This field is required.";
      continue;
    }
    if (prop.enum && !prop.enum.some((v) => v === value)) {
      errors[name] = "Pick one of the allowed values.";
      continue;
    }
    switch (prop.type) {
      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) errors[name] = "Enter a number.";
        break;
      case "integer":
        if (typeof value !== "number" || !Number.isInteger(value)) {
          errors[name] = "Enter a whole number.";
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") errors[name] = "This must be on or off.";
        break;
      case "string":
        if (typeof value !== "string") errors[name] = "Enter text.";
        break;
      default:
        break;
    }
  }
  return errors;
}
function submitControlOf(form) {
  const candidates = form.querySelectorAll("button,input");
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const type = c.getAttribute("type");
    if (c.tagName === "INPUT" ? type === "submit" : (type ?? "submit") === "submit") return c;
  }
  return null;
}
function Form({
  schema,
  initialValues,
  values: controlledValues,
  onChange,
  onSubmit,
  action,
  disabled = false,
  children,
  className,
  ...props
}) {
  const [ownValues, setOwnValues] = useState4(initialValues ?? {});
  const [errors, setErrors] = useState4({});
  const values = controlledValues ?? ownValues;
  const formRef = useRef2(null);
  useEffect4(() => {
    const form = formRef.current;
    if (!form || !action) return;
    const target = submitControlOf(form) ?? form;
    const current = (target.getAttribute("data-rm-action") ?? "").split(/\s+/).filter(Boolean);
    if (!current.includes(action.name)) {
      target.setAttribute("data-rm-action", [...current, action.name].join(" "));
    }
  });
  const setValue = useCallback(
    (name, value) => {
      const next = { ...values, [name]: value };
      if (controlledValues === void 0) setOwnValues(next);
      onChange?.(next);
      setErrors((prev) => {
        if (!(name in prev)) return prev;
        const rest = { ...prev };
        delete rest[name];
        return rest;
      });
    },
    [values, controlledValues, onChange]
  );
  const ctx = useMemo2(
    () => ({ values, errors, disabled, setValue }),
    [values, errors, disabled, setValue]
  );
  return /* @__PURE__ */ jsx9(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx9(
    "form",
    {
      ref: formRef,
      noValidate: true,
      className: cn("text-left", className),
      onSubmit: (e) => {
        e.preventDefault();
        const nextErrors = validateAgainstSchema(schema, values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) {
          void onSubmit?.(values);
          if (action) void Promise.resolve(action.run(values)).catch(() => void 0);
        }
      },
      ...props,
      children
    }
  ) });
}
function useFormValues() {
  return useContext(FormContext)?.values ?? {};
}
function Field({ name, label, help, required = false, error, className, children }) {
  const form = useContext(FormContext);
  const id = useId2();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const shownError = error ?? form?.errors[name];
  const describedBy = [help !== void 0 ? helpId : null, shownError ? errorId : null].filter(Boolean).join(" ") || void 0;
  const ctx = useMemo2(
    () => ({ name, id, describedBy, invalid: Boolean(shownError), required }),
    [name, id, describedBy, shownError, required]
  );
  return /* @__PURE__ */ jsx9(FieldContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs9("div", { className: cn("flex flex-col gap-1.5", className), children: [
    /* @__PURE__ */ jsxs9("label", { htmlFor: id, className: "text-sm font-medium text-neutral-800 dark:text-neutral-200", children: [
      label,
      required && /* @__PURE__ */ jsx9("span", { "aria-hidden": "true", className: "ml-0.5 text-red-500", children: "*" })
    ] }),
    children,
    help !== void 0 && /* @__PURE__ */ jsx9("p", { id: helpId, className: "text-xs text-neutral-500 dark:text-neutral-400", children: help }),
    shownError && /* @__PURE__ */ jsx9("p", { id: errorId, className: "text-xs font-medium text-red-600 dark:text-red-400", children: shownError })
  ] }) });
}
function useControl(explicitId) {
  const form = useContext(FormContext);
  const field = useContext(FieldContext);
  const fallbackId = useId2();
  return {
    form,
    field,
    id: explicitId ?? field?.id ?? fallbackId,
    ariaProps: {
      "aria-invalid": field?.invalid || void 0,
      "aria-describedby": field?.describedBy,
      "aria-required": field?.required || void 0
    },
    read() {
      return field && form ? form.values[field.name] : void 0;
    },
    write(value) {
      if (field && form) form.setValue(field.name, value);
    },
    disabled: form?.disabled ?? false
  };
}
function TextInput({ value, onChange, className, id, disabled, type = "text", ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx9(
    "input",
    {
      id: c.id,
      type,
      className: cn(inputBase, className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function NumberInput({ value, onChange, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read();
  return /* @__PURE__ */ jsx9(
    "input",
    {
      id: c.id,
      type: "number",
      inputMode: "decimal",
      className: cn(inputBase, className),
      value: current ?? "",
      disabled: disabled || c.disabled,
      onChange: (e) => {
        const raw = e.target.value;
        const parsed = raw === "" ? void 0 : Number(raw);
        onChange?.(parsed);
        c.write(parsed);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function TextArea({ value, onChange, className, id, disabled, rows = 4, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx9(
    "textarea",
    {
      id: c.id,
      rows,
      className: cn(inputBase, "min-h-[80px] resize-y", className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function Select({
  options,
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
  ...props
}) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsxs9(
    "select",
    {
      id: c.id,
      className: cn(inputBase, "pr-8", className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props,
      children: [
        placeholder !== void 0 && /* @__PURE__ */ jsx9("option", { value: "", disabled: true, children: placeholder }),
        options.map((opt) => /* @__PURE__ */ jsx9("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
      ]
    }
  );
}
function Checkbox({ checked, onChange, label, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = checked ?? Boolean(c.read());
  return /* @__PURE__ */ jsxs9(
    "label",
    {
      className: cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
        (disabled || c.disabled) && "cursor-not-allowed opacity-60",
        className
      ),
      children: [
        /* @__PURE__ */ jsx9(
          "input",
          {
            id: c.id,
            type: "checkbox",
            className: cn(
              "h-4 w-4 rounded border-neutral-300 text-[color:var(--rm-accent)] accent-[var(--rm-accent)] dark:border-neutral-600",
              focusRing
            ),
            checked: current,
            disabled: disabled || c.disabled,
            onChange: (e) => {
              onChange?.(e.target.checked);
              c.write(e.target.checked);
            },
            ...c.ariaProps,
            ...props
          }
        ),
        label
      ]
    }
  );
}
function RadioGroup({ options, value, onChange, name, className, disabled }) {
  const c = useControl();
  const groupName = name ?? c.field?.name ?? c.id;
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx9(
    "div",
    {
      role: "radiogroup",
      "aria-describedby": c.ariaProps["aria-describedby"],
      "aria-invalid": c.ariaProps["aria-invalid"],
      className: cn("flex flex-col gap-2", className),
      children: options.map((opt) => /* @__PURE__ */ jsxs9(
        "label",
        {
          className: cn(
            "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
            (disabled || c.disabled || opt.disabled) && "cursor-not-allowed opacity-60"
          ),
          children: [
            /* @__PURE__ */ jsx9(
              "input",
              {
                type: "radio",
                name: groupName,
                value: opt.value,
                checked: current === opt.value,
                disabled: disabled || c.disabled || opt.disabled,
                onChange: () => {
                  onChange?.(opt.value);
                  c.write(opt.value);
                },
                className: cn(
                  "h-4 w-4 border-neutral-300 text-[color:var(--rm-accent)] accent-[var(--rm-accent)] dark:border-neutral-600",
                  focusRing
                )
              }
            ),
            opt.label
          ]
        },
        opt.value
      ))
    }
  );
}
function DatePicker({ value, onChange, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx9(
    "input",
    {
      id: c.id,
      type: "date",
      className: cn(inputBase, className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}

// src/components/file-upload.tsx
import { useEffect as useEffect5, useRef as useRef3, useState as useState5 } from "react";
import { markGesture } from "@robomotion/apps-runtime";
import { useFileUpload } from "@robomotion/apps-runtime/react";

// src/components/progress.tsx
import { Fragment, jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function Progress({ value, label, showValue = false, className, ...props }) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : 0;
  return /* @__PURE__ */ jsxs10("div", { className: cn("w-full", className), ...props, children: [
    (label || showValue && determinate) && /* @__PURE__ */ jsxs10("div", { className: "mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsx10("span", { children: label }),
      showValue && determinate && /* @__PURE__ */ jsxs10("span", { children: [
        Math.round(clamped),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx10(
      "div",
      {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": determinate ? Math.round(clamped) : void 0,
        className: "h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
        children: determinate ? /* @__PURE__ */ jsx10(
          "div",
          {
            className: "h-full rounded-full bg-[color:var(--rm-accent)] transition-[width] duration-300",
            style: { width: `${clamped}%` }
          }
        ) : /* @__PURE__ */ jsxs10(Fragment, { children: [
          /* @__PURE__ */ jsx10("style", { children: `@keyframes rm-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}` }),
          /* @__PURE__ */ jsx10(
            "div",
            {
              className: "h-full w-1/3 rounded-full bg-[color:var(--rm-accent)]",
              style: { animation: "rm-indeterminate 1.2s ease-in-out infinite" }
            }
          )
        ] })
      }
    )
  ] });
}

// src/components/file-upload.tsx
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
function FileUpload({
  onUpload,
  onError,
  accept,
  label = "Drop a file here, or browse",
  hint,
  disabled = false,
  isPublic = false,
  action,
  params,
  className
}) {
  const { upload, uploading, progress, error } = useFileUpload();
  const inputRef = useRef3(null);
  const zoneRef = useRef3(null);
  const [dragOver, setDragOver] = useState5(false);
  const [uploaded, setUploaded] = useState5(null);
  const onErrorRef = useRef3(onError);
  onErrorRef.current = onError;
  useEffect5(() => {
    if (error) onErrorRef.current?.(error);
  }, [error]);
  const start = async (file) => {
    if (!file || disabled || uploading) return;
    setUploaded(null);
    const ref = await upload(file, { isPublic });
    if (ref) {
      setUploaded(ref);
      markGesture(zoneRef.current);
      onUpload?.(ref);
      if (action) {
        const extra = typeof params === "function" ? params() : params;
        void Promise.resolve(action.run({ file: ref, ...extra ?? {} })).catch(() => void 0);
      }
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    void start(e.dataTransfer.files?.[0]);
  };
  return /* @__PURE__ */ jsxs11("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx11(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept,
        className: "sr-only",
        tabIndex: -1,
        "aria-hidden": "true",
        onChange: (e) => {
          void start(e.target.files?.[0]);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxs11(
      "button",
      {
        ref: zoneRef,
        type: "button",
        "data-rm-dropzone": "",
        "data-rm-action": action?.name,
        disabled: disabled || uploading,
        onClick: () => inputRef.current?.click(),
        onDragOver: (e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop,
        className: cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
          focusRing,
          dragOver ? "border-[color:var(--rm-accent)] bg-orange-50/50 dark:bg-neutral-800" : "border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600",
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        ),
        children: [
          /* @__PURE__ */ jsx11(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-7 w-7 text-neutral-400 dark:text-neutral-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.5",
              children: /* @__PURE__ */ jsx11(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx11("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: label }),
          hint && /* @__PURE__ */ jsx11("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: hint })
        ]
      }
    ),
    uploading && /* @__PURE__ */ jsx11("div", { className: "mt-3", children: /* @__PURE__ */ jsx11(Progress, { value: progress, label: "Uploading", showValue: true }) }),
    !uploading && uploaded && /* @__PURE__ */ jsxs11("p", { className: "mt-2 flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400", children: [
      /* @__PURE__ */ jsx11("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx11("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" }) }),
      uploaded.name,
      " uploaded"
    ] }),
    !uploading && error && /* @__PURE__ */ jsx11("p", { role: "alert", className: "mt-2 text-sm font-medium text-red-600 dark:text-red-400", children: error.message })
  ] });
}

// src/components/status-badge.tsx
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
var STYLES = {
  ok: {
    pill: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
    dot: "bg-green-500",
    label: "OK"
  },
  warn: {
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Warning"
  },
  error: {
    pill: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
    dot: "bg-red-500",
    label: "Error"
  },
  pending: {
    pill: "bg-neutral-100 text-neutral-600 ring-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-300 dark:ring-neutral-400/30",
    dot: "bg-neutral-400",
    label: "Pending"
  }
};
function StatusBadge({ status, children, className, ...props }) {
  const s = STYLES[status];
  return /* @__PURE__ */ jsxs12(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx12("span", { "aria-hidden": "true", className: cn("h-1.5 w-1.5 rounded-full", s.dot) }),
        children ?? s.label
      ]
    }
  );
}

// src/components/error-state.tsx
import { AppError } from "@robomotion/apps-runtime";
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
function messageOf(error) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}
function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
  retryLabel = "Try again",
  className,
  ...props
}) {
  const retryable = error instanceof AppError ? error.retryable : true;
  return /* @__PURE__ */ jsxs13(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-left dark:border-red-500/30 dark:bg-red-500/10",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs13("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx13(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-5 w-5 shrink-0 text-red-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.75",
              children: /* @__PURE__ */ jsx13(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx13("h3", { className: "text-sm font-semibold text-red-800 dark:text-red-300", children: title })
        ] }),
        /* @__PURE__ */ jsx13("p", { className: "text-sm text-red-700 dark:text-red-300/90", children: messageOf(error) }),
        onRetry && retryable && /* @__PURE__ */ jsx13(Button, { variant: "secondary", size: "sm", className: "mt-1", onClick: onRetry, children: retryLabel })
      ]
    }
  );
}

// src/components/layout.tsx
import { jsx as jsx14 } from "react/jsx-runtime";
var GAP = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8"
};
var ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch"
};
var JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between"
};
function Stack({ className, gap = 4, align, ...props }) {
  return /* @__PURE__ */ jsx14(
    "div",
    {
      className: cn("flex flex-col", GAP[gap], align && ALIGN[align], className),
      ...props
    }
  );
}
function Row({
  className,
  gap = 4,
  align = "center",
  justify,
  wrap = false,
  ...props
}) {
  return /* @__PURE__ */ jsx14(
    "div",
    {
      className: cn(
        "flex flex-row",
        GAP[gap],
        ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className
      ),
      ...props
    }
  );
}
var COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6"
};
var MD_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6"
};
var LG_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6"
};
function Grid({ className, gap = 4, cols = 1, mdCols, lgCols, ...props }) {
  return /* @__PURE__ */ jsx14(
    "div",
    {
      className: cn(
        "grid",
        GAP[gap],
        COLS[cols],
        mdCols && MD_COLS[mdCols],
        lgCols && LG_COLS[lgCols],
        className
      ),
      ...props
    }
  );
}
export {
  AppShell,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  ConnectionBanner,
  DEFAULT_ACCENT,
  DataTable,
  DatePicker,
  EmptyState,
  ErrorState,
  Field,
  FileUpload,
  Form,
  Grid,
  NumberInput,
  Progress,
  RadioGroup,
  Row,
  Screen,
  Select,
  Spinner,
  Stack,
  StatusBadge,
  TextArea,
  TextInput,
  Toast,
  accentStyle,
  cn,
  dismissToast,
  focusRing,
  toast,
  useFormValues,
  useToast
};
//# sourceMappingURL=index.js.map