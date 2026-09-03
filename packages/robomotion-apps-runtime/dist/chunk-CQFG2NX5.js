// src/codegen/canonical.ts
function canonicalizeJson(text) {
  const p = { text, pos: 0 };
  skipWs(p);
  const out = parseValue(p);
  skipWs(p);
  if (p.pos !== p.text.length) {
    throw new Error(`Unexpected trailing content at offset ${p.pos}`);
  }
  return out;
}
async function contractHashOf(text) {
  const canonical = canonicalizeJson(text);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}
function skipWs(p) {
  while (p.pos < p.text.length) {
    const c = p.text[p.pos];
    if (c === " " || c === "	" || c === "\n" || c === "\r") p.pos++;
    else break;
  }
}
function parseValue(p) {
  const c = p.text[p.pos];
  if (c === "{") return parseObject(p);
  if (c === "[") return parseArray(p);
  if (c === '"') return parseStringToken(p);
  return parseLiteral(p);
}
function parseObject(p) {
  expect(p, "{");
  skipWs(p);
  const members = [];
  if (p.text[p.pos] === "}") {
    p.pos++;
    return "{}";
  }
  for (; ; ) {
    skipWs(p);
    if (p.text[p.pos] !== '"') {
      throw new Error(`Expected a string key at offset ${p.pos}`);
    }
    const rawKey = parseStringToken(p);
    const sortKey = rawKey.slice(1, -1);
    skipWs(p);
    expect(p, ":");
    skipWs(p);
    const value = parseValue(p);
    if (members.some((m) => m.sortKey === sortKey)) {
      throw new Error(`Duplicate key ${rawKey} in object`);
    }
    members.push({ rawKey, sortKey, value });
    skipWs(p);
    const next = p.text[p.pos];
    if (next === ",") {
      p.pos++;
      continue;
    }
    if (next === "}") {
      p.pos++;
      break;
    }
    throw new Error(`Expected "," or "}" at offset ${p.pos}`);
  }
  members.sort((a, b) => a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0);
  return "{" + members.map((m) => m.rawKey + ":" + m.value).join(",") + "}";
}
function parseArray(p) {
  expect(p, "[");
  skipWs(p);
  const items = [];
  if (p.text[p.pos] === "]") {
    p.pos++;
    return "[]";
  }
  for (; ; ) {
    skipWs(p);
    items.push(parseValue(p));
    skipWs(p);
    const next = p.text[p.pos];
    if (next === ",") {
      p.pos++;
      continue;
    }
    if (next === "]") {
      p.pos++;
      break;
    }
    throw new Error(`Expected "," or "]" at offset ${p.pos}`);
  }
  return "[" + items.join(",") + "]";
}
function parseStringToken(p) {
  const start = p.pos;
  expect(p, '"');
  while (p.pos < p.text.length) {
    const c = p.text[p.pos];
    if (c === "\\") {
      p.pos += 2;
      continue;
    }
    if (c === '"') {
      p.pos++;
      return p.text.slice(start, p.pos);
    }
    p.pos++;
  }
  throw new Error(`Unterminated string starting at offset ${start}`);
}
function parseLiteral(p) {
  const start = p.pos;
  while (p.pos < p.text.length) {
    const c = p.text[p.pos];
    if (c === "," || c === "}" || c === "]" || c === " " || c === "	" || c === "\n" || c === "\r") {
      break;
    }
    p.pos++;
  }
  const token = p.text.slice(start, p.pos);
  if (token === "true" || token === "false" || token === "null") return token;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(token)) return token;
  throw new Error(`Invalid JSON literal "${token}" at offset ${start}`);
}
function expect(p, ch) {
  if (p.text[p.pos] !== ch) {
    throw new Error(`Expected "${ch}" at offset ${p.pos}`);
  }
  p.pos++;
}

// src/codegen/index.ts
async function generate(contractText) {
  let contract;
  try {
    contract = JSON.parse(contractText);
  } catch (e) {
    throw new Error(`app.json is not valid JSON: ${String(e)}`);
  }
  if (contract.schema !== "robomotion.app/v1") {
    throw new Error(
      `Unsupported contract schema "${String(contract.schema)}": this generator reads robomotion.app/v1`
    );
  }
  if (!contract.app_id || !contract.name || !contract.actions) {
    throw new Error("app.json must have app_id, name and actions");
  }
  const contractHash = await contractHashOf(contractText);
  return {
    contract,
    contractHash,
    spaSource: emitSpa(contract, contractHash),
    flowSource: emitFlow(contract, contractHash)
  };
}
function refName(ref) {
  const m = /^#\/types\/([A-Za-z0-9]+)$/.exec(ref);
  if (!m) throw new Error(`Unsupported $ref "${ref}": only #/types/<Name> is allowed`);
  return m[1];
}
function schemaToTs(schema, indent) {
  if (!schema) return "unknown";
  if (schema.$ref) return refName(schema.$ref);
  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(" | ") || "never";
  }
  switch (schema.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const item = schemaToTs(schema.items, indent);
      return /^[A-Za-z0-9_.]+(\[\])*$/.test(item) ? `${item}[]` : `Array<${item}>`;
    }
    case "object": {
      const props = schema.properties;
      if (!props || Object.keys(props).length === 0) {
        return "Record<string, unknown>";
      }
      const required = new Set(schema.required ?? []);
      const inner = indent + "  ";
      const lines = Object.entries(props).map(([key, prop]) => {
        const opt = required.has(key) ? "" : "?";
        const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        return `${inner}${safeKey}${opt}: ${schemaToTs(prop, inner)};`;
      });
      return "{\n" + lines.join("\n") + "\n" + indent + "}";
    }
    default:
      return "unknown";
  }
}
function pascal(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
function emitNamedTypes(contract) {
  const out = [];
  for (const [name, schema] of Object.entries(contract.types ?? {})) {
    if (schema.type === "object" && schema.properties) {
      const body = schemaToTs(schema, "");
      out.push(`export interface ${name} ${body}`);
    } else {
      out.push(`export type ${name} = ${schemaToTs(schema, "")};`);
    }
  }
  return out.join("\n\n");
}
function emitSpa(contract, hash) {
  const definesFileRef = Boolean(contract.types?.FileRef);
  const types = emitNamedTypes(contract);
  const actionSigs = [];
  const actionImpls = [];
  const perAction = [];
  const hooks = [];
  for (const [name, action] of Object.entries(contract.actions)) {
    const paramsTs = schemaToTs(action.params, "  ");
    const resultTs = schemaToTs(action.result, "  ");
    actionSigs.push(`  ${name}(params: ${paramsTs}): Promise<${resultTs}>;`);
    actionImpls.push(
      `    ${name}: (params: ${paramsTs}) => app.call(${JSON.stringify(name)}, params) as Promise<${resultTs}>,`
    );
    const P = `${pascal(name)}Params`;
    const R = `${pascal(name)}Result`;
    const pTs = schemaToTs(action.params, "");
    const rTs = schemaToTs(action.result, "");
    if (!contract.types?.[P]) {
      if (pTs.startsWith("{")) {
        perAction.push(`export interface ${P} ${pTs}`);
      } else {
        perAction.push(`export type ${P} = ${pTs};`);
      }
    }
    if (!contract.types?.[R]) {
      perAction.push(`export type ${R} = ${rTs};`);
    }
    hooks.push(
      [
        `/** Bind the ${JSON.stringify(name)} action with its contract types. */`,
        `export function use${pascal(name)}() {`,
        `  return useAction<${P}, ${R}>(${JSON.stringify(name)});`,
        `}`
      ].join("\n")
    );
  }
  const actions = [
    "export interface Actions {",
    ...actionSigs,
    "}",
    "",
    "export function typedApp(app: AppClient): Actions {",
    "  return {",
    ...actionImpls,
    "  };",
    "}"
  ].join("\n");
  const body = [types, perAction.join("\n\n"), actions, hooks.join("\n\n")].filter(Boolean).join("\n\n");
  const usesFileRef = !definesFileRef && /\bFileRef\b/.test(body);
  const header = [
    "// Generated by robomotion-app-codegen from app.json. Do not edit.",
    `// App: ${contract.name}`,
    "",
    usesFileRef ? 'import type { AppClient, FileRef } from "@robomotion/apps-runtime";' : 'import type { AppClient } from "@robomotion/apps-runtime";',
    ...hooks.length > 0 ? ['import { useAction } from "@robomotion/apps-runtime/react";'] : [],
    "",
    `export const CONTRACT_HASH = ${JSON.stringify(hash)};`
  ].join("\n");
  return [header, body].filter(Boolean).join("\n\n") + "\n";
}
function emitFlow(contract, hash) {
  const header = [
    "// Generated by robomotion-app-codegen from app.json. Do not edit.",
    `// App: ${contract.name}`,
    "",
    `export const CONTRACT_HASH = ${JSON.stringify(hash)};`
  ].join("\n");
  const fileRef = contract.types?.FileRef ? "" : [
    "export interface FileRef {",
    "  artifact_id: string;",
    "  name: string;",
    "  size: number;",
    "  mime: string;",
    "}"
  ].join("\n");
  const types = emitNamedTypes(contract);
  const perAction = [];
  const mapEntries = [];
  for (const [name, action] of Object.entries(contract.actions)) {
    const P = `${pascal(name)}Params`;
    const R = `${pascal(name)}Result`;
    const paramsTs = schemaToTs(action.params, "");
    const resultTs = schemaToTs(action.result, "");
    if (paramsTs.startsWith("{")) {
      perAction.push(`export interface ${P} ${paramsTs}`);
    } else {
      perAction.push(`export type ${P} = ${paramsTs};`);
    }
    perAction.push(`export type ${R} = ${resultTs};`);
    mapEntries.push(`  ${name}: { params: ${P}; result: ${R} };`);
  }
  const map = [
    "export interface ActionTypes {",
    ...mapEntries,
    "}",
    "",
    "export type ActionName = keyof ActionTypes;"
  ].join("\n");
  return [header, fileRef, types, perAction.join("\n\n"), map].filter(Boolean).join("\n\n") + "\n";
}

export {
  canonicalizeJson,
  contractHashOf,
  generate
};
//# sourceMappingURL=chunk-CQFG2NX5.js.map