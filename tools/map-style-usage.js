const fs = require("fs");
const path = require("path");

const styles = fs.readFileSync("styles.js", "utf8");
const keys = [...styles.matchAll(/^\s{2}(\w+)\s*:\s*\{/gm)].map((m) => m[1]);
const ignore = new Set(["default"]);
const uniq = [...new Set(keys)].filter((k) => !ignore.has(k));

const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "android" ||
      ent.name === "assets" ||
      ent.name === "server" ||
      ent.name.startsWith(".")
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) files.push(p);
  }
}
walk(".");

const byFile = {};
for (const k of uniq) {
  const re = new RegExp(
    "\\bstyles\\." + k + "\\b|styles\\[['\"]" + k + "['\"]\\]"
  );
  for (const f of files) {
    const txt = fs.readFileSync(f, "utf8");
    if (re.test(txt)) {
      const rel = path.relative(".", f);
      (byFile[rel] ??= []).push(k);
    }
  }
}

console.log(JSON.stringify(byFile, null, 2));
