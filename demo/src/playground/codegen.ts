import { DEFAULT_LIST_CONFIG } from "./config";
import type { ListConfig } from "./config";
import { getDataset, getDatasetDisableRules } from "./datasets";
import { getNodeStyle } from "./node-styles";
import type { PlaygroundRow } from "./fixtures";

const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;
const singleQuote = (value: string) => `'${value.replace(/'/g, "\\'")}'`;

const serializeFieldValue = (value: unknown) =>
  typeof value === "string" ? singleQuote(value) : String(value === undefined ? "" : value);

/**
 * Indents a style code fragment so it can be inlined after
 * `customLabel: ` / `customStartNode: `. The first line goes right after the
 * `key: `; every following line keeps its stored internal indentation but is
 * re-based on `base`; a trailing, missing comma is appended.
 */
function inlineFragment(code: string, base: number): string[] {
  const pad = " ".repeat(base);
  const fragments = code.split("\n");
  const last = fragments.length - 1;
  return fragments.map((line, index) => {
    if (index === 0) return line;
    const rebuilt = `${pad}${line}`;
    if (index === last && !rebuilt.endsWith(",")) return `${rebuilt},`;
    return rebuilt;
  });
}

interface StyleUsage {
  helpers: string[][];
  badgeUsed: boolean;
  lucide: string[];
}

function collectStyleUsage(config: ListConfig): StyleUsage {
  const helpers: string[][] = [];
  const seen = new Set<string>();
  let badgeUsed = false;
  const lucide = new Set<string>();

  const visit = (styleKey: string) => {
    if (styleKey === "none") return;
    const style = getNodeStyle(styleKey);
    if (!style || seen.has(style.key)) return;
    seen.add(style.key);
    (style.helpers ?? []).forEach((helper) => helpers.push(helper.split("\n")));
    (style.importNames ?? []).forEach((name) => lucide.add(name));
    if ((style.codeLabel ?? "").includes("Badge") || (style.codeStart ?? "").includes("Badge")) {
      badgeUsed = true;
    }
  };
  visit(config.menuLabelStyle);
  visit(config.menuStartNodeStyle);
  visit(config.selectedLabelStyle);
  visit(config.selectedStartNodeStyle);

  return { helpers, badgeUsed, lucide: [...lucide] };
}

/** Emits only props that differ from the defaults, shadcn-docs style. */
export function listConfigToCode(config: ListConfig): string {
  const dataset = getDataset(config.dataset);
  const rows = dataset.make(Math.min(config.itemCount, 6));
  const usage = collectStyleUsage(config);

  // ----- header: interface + data + style helpers -----
  const header: string[] = [];
  if (usage.badgeUsed) header.push("// Requires the shadcn Badge: npx shadcn add badge");
  if (usage.lucide.length > 0) {
    header.push(`// Also imports from lucide-react: { ${usage.lucide.sort().join(", ")} }`);
  }
  header.push(dataset.interfaceCode, ``);
  header.push(
    `const ${dataset.variableName}: ${dataset.typeName}[] = [`,
    ...rows.map(
      (row: PlaygroundRow) =>
        `  { ${dataset.rowFields
          .map((field) => `${field}: ${serializeFieldValue(row[field as keyof PlaygroundRow])}`)
          .join(", ")} },`,
    ),
    `];`,
  );
  usage.helpers.forEach((helperLines) => {
    header.push(``, ...helperLines);
  });

  // ----- component -----
  const lines: string[] = [];
  const push = (condition: boolean, line: string) => {
    if (condition) lines.push(line);
  };

  push(config.label !== DEFAULT_LIST_CONFIG.label, `  label=${quote(config.label)}`);
  push(config.required, "  required");
  push(config.multiple, "  multiple");
  push(config.fullWidth, "  fullWidth");
  push(config.disabled, "  disabled");
  push(config.error, "  error");
  push(
    config.multiple && (config.maxSelection ?? null) !== null,
    `  multipleConfig={{ maxSelection: ${config.maxSelection}, maxVisibleItems: ${
      (config.maxVisibleItems ?? null) === null ? "undefined" : config.maxVisibleItems
    } }}`,
  );
  push(config.searchInput, "  searchInput");
  push(
    config.placeholder !== DEFAULT_LIST_CONFIG.placeholder,
    `  placeholder=${quote(config.placeholder)}`,
  );
  push(config.showEmptyOption, "  showEmptyOption");
  push(config.showClearButton, "  showClearButton");
  push(
    config.showEmptyOption &&
      config.emptyOptionLabel !== DEFAULT_LIST_CONFIG.emptyOptionLabel,
    `  emptyOptionLabel=${quote(config.emptyOptionLabel)}`,
  );
  push(
    config.searchInput &&
      config.searchPlaceholder !== DEFAULT_LIST_CONFIG.searchPlaceholder,
    `  searchPlaceholder=${quote(config.searchPlaceholder)}`,
  );
  push(
    config.emptyMessage !== DEFAULT_LIST_CONFIG.emptyMessage,
    `  emptyMessage=${quote(config.emptyMessage)}`,
  );
  push(
    config.dataSource === "remote" &&
      config.loadingMessage !== DEFAULT_LIST_CONFIG.loadingMessage,
    `  loadingMessage=${quote(config.loadingMessage)}`,
  );
  if (config.dataSource === "remote") {
    const remoteLines: string[] = [
      `  remote={{`,
      `    identifier: "playground-${dataset.key}",`,
      `    optionsFn,`,
    ];
    if (config.searchOnInput) {
      remoteLines.push(`    searchOnInput: true,`);
    }
    remoteLines.push(`    refreshOnOpen: ${config.refreshOnOpen},`, `  },`);
    lines.push(...remoteLines);
  }
  if (config.pagination === "client") {
    lines.push(
      `  pagination={{ pageSize: ${config.pageSize}, loadMoreLabel: ${quote(config.loadMoreLabel)} }}`,
    );
  }
  if (config.pagination === "server") {
    lines.push(
      `  pagination={{`,
      `    mode: "server",`,
      `    pageSize: ${config.pageSize},`,
      `    hasMore,`,
      `    isLoadingMore,`,
      `    onLoadMore,`,
      `    onSearchChange,`,
      `  }},`,
    );
  }

  lines.push(
    `  value={value}`,
    `  onChange={(value, item) => setSelection(value, item)}`,
  );
  if (config.dataSource === "local") {
    lines.push(`  options={${dataset.variableName}}`);
  }

  // ----- menuItemConfig -----
  const usesMenuLabelStyle = config.menuLabelStyle !== "none";
  const menuItemLines: string[] = [`    ${dataset.valueCode},`];
  if (!usesMenuLabelStyle) {
    menuItemLines.push(`    label: [${config.menuLabelKeys.map(quote).join(", ")}],`);
    if (config.menuSeparator !== DEFAULT_LIST_CONFIG.menuSeparator) {
      menuItemLines.push(`    separator: ${quote(config.menuSeparator)},`);
    }
    if (config.disableSpaceBetween) {
      menuItemLines.push(`    disableSpaceBetween: true,`);
    }
  }
  if (config.searchRule === "explicit") {
    menuItemLines.push(`    searchProperties: [${dataset.searchTextKeys.map(quote).join(", ")}],`);
  }
  const rule = getDatasetDisableRules(config.dataset).find(
    (candidate) => candidate.key === config.disableRule,
  );
  if (rule) {
    menuItemLines.push(`    isOptionDisabled: ${rule.code},`);
  }
  const menuLabelStyle = getNodeStyle(config.menuLabelStyle);
  if (menuLabelStyle?.codeLabel) {
    menuItemLines.push(...inlineFragment(menuLabelStyle.codeLabel, 4).map((fragmentLine, index) => (index === 0 ? `    customLabel: ${fragmentLine}` : fragmentLine)));
  }
  const menuStartStyle = getNodeStyle(config.menuStartNodeStyle);
  if (menuStartStyle?.codeStart) {
    menuItemLines.push(...inlineFragment(menuStartStyle.codeStart, 4).map((fragmentLine, index) => (index === 0 ? `    customStartNode: ${fragmentLine}` : fragmentLine)));
  }
  lines.push(`  menuItemConfig={{`, ...menuItemLines, `  }}`);

  // ----- selectedItemConfig -----
  const selectedLines: string[] = [];
  if (config.selectedLabelKeys.length > 0) {
    selectedLines.push(`    label: [${config.selectedLabelKeys.map(quote).join(", ")}],`);
  }
  const selectedStyle = getNodeStyle(config.selectedLabelStyle);
  if (selectedStyle?.codeLabel) {
    selectedLines.push(...inlineFragment(selectedStyle.codeLabel, 4).map((fragmentLine, index) => (index === 0 ? `    customLabel: ${fragmentLine}` : fragmentLine)));
  }
  const selectedStartStyle = getNodeStyle(config.selectedStartNodeStyle);
  if (selectedStartStyle?.codeStart) {
    selectedLines.push(...inlineFragment(selectedStartStyle.codeStart, 4).map((fragmentLine, index) => (index === 0 ? `    customStartNode: ${fragmentLine}` : fragmentLine)));
  }
  if (config.multiple && config.multipleSeparator) {
    selectedLines.push(`    multipleSeparator: ${quote(config.multipleSeparator)},`);
  }
  if (config.selectedDisableStartNode) {
    selectedLines.push(`    disableStartNode: true,`);
  }
  if (selectedLines.length > 0) {
    lines.push(`  selectedItemConfig={{`, ...selectedLines, `  }}`);
  }

  const component = [`<Combobox`, ...lines, `/>`].join("\n");
  return [...header, ``, component].join("\n");
}
