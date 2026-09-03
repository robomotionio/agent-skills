#!/usr/bin/env node
import {
  contractHashOf,
  generate
} from "../chunk-DVAUVKNF.js";

// src/codegen/cli.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import process from "process";
function parseArgs(argv) {
  const args = {
    contractPath: "app.json",
    appOut: null,
    flowOut: null,
    hashOnly: false
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--app-out":
        args.appOut = argv[++i] ?? null;
        break;
      case "--flow-out":
        args.flowOut = argv[++i] ?? null;
        break;
      case "--hash-only":
        args.hashOnly = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        positional.push(a);
    }
  }
  if (positional.length > 0) args.contractPath = positional[0];
  return args;
}
function printHelp() {
  console.log(
    [
      "robomotion-app-codegen [app.json] [options]",
      "",
      "Options:",
      "  --app-out <file>    where to write the SPA actions.gen.ts",
      "                      (default: app/src/generated/actions.gen.ts when app/ exists)",
      "  --flow-out <file>   where to write the flow actions.gen.ts",
      "                      (default: flow/src/generated/actions.gen.ts when flow/ exists)",
      "  --hash-only         print the contract hash and write nothing"
    ].join("\n")
  );
}
function writeOut(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
  console.log(`wrote ${path}`);
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contractPath = resolve(args.contractPath);
  let text;
  try {
    text = readFileSync(contractPath, "utf-8");
  } catch {
    console.error(`Cannot read contract at ${contractPath}`);
    process.exit(1);
    return;
  }
  if (args.hashOnly) {
    console.log(await contractHashOf(text));
    return;
  }
  const result = await generate(text);
  console.log(`contract_hash ${result.contractHash}`);
  const root = dirname(contractPath);
  let appOut = args.appOut ? resolve(args.appOut) : null;
  let flowOut = args.flowOut ? resolve(args.flowOut) : null;
  if (!appOut && existsSync(resolve(root, "app"))) {
    appOut = resolve(root, "app/src/generated/actions.gen.ts");
  }
  if (!flowOut && existsSync(resolve(root, "flow"))) {
    flowOut = resolve(root, "flow/src/generated/actions.gen.ts");
  }
  if (!appOut && !flowOut) {
    appOut = resolve(root, "actions.gen.ts");
  }
  if (appOut) writeOut(appOut, result.spaSource);
  if (flowOut) writeOut(flowOut, result.flowSource);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
//# sourceMappingURL=cli.js.map