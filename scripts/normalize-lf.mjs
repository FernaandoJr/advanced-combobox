// Normalizes every tracked text source file to LF in place.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && /\.(ts|tsx|json|css|md|html|mjs|yml|yaml)$/.test(f) && !f.startsWith("public/r/"));

let changed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue; // renames without a git index refresh
  const buf = fs.readFileSync(file);
  const text = buf.toString("utf8");
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r(?!\n)/g, "\n");
  if (normalized !== text) {
    fs.writeFileSync(file, normalized);
    changed++;
    console.log("normalized:", file);
  }
}
console.log("changed files:", changed);
