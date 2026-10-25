// Injects the full documentation into the built registry item so `shadcn view`
// (and any tooling reading the item JSON) ships the API reference with the code.
// Single source of truth: docs/*.md.
import fs from "node:fs";

const itemPath = "public/r/combobox.json";
const docsFiles = [
  "docs/combobox.md",
  "docs/combobox-tree.md",
];

const item = JSON.parse(fs.readFileSync(itemPath, "utf8"));
item.docs = docsFiles
  .map((file) => fs.readFileSync(file, "utf8").trim())
  .join("\n\n---\n\n");
fs.writeFileSync(itemPath, JSON.stringify(item, null, 2) + "\n");
console.log(`injected ${item.docs.length} chars of docs into ${itemPath}`);
