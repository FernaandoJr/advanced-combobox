import { DEFAULT_LIST_CONFIG, DEFAULT_TREE_CONFIG } from "./config";
import type { ListConfig, TreeConfig } from "./config";

const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

/** Emits only props that differ from the defaults, shadcn-docs style. */
export function listConfigToCode(config: ListConfig): string {
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
      `    identifier: "playground-cities",`,
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
    lines.push(`  options={cities}`);
  }
  lines.push(`  menuItemConfig={{ value: "code", label: ["displayName"] }}`);
  return ["<Combobox", ...lines, "/>"].join("\n");
}

export function treeConfigToCode(config: TreeConfig): string {
  const lines: string[] = [];
  const push = (condition: boolean, line: string) => {
    if (condition) lines.push(line);
  };

  push(config.label !== DEFAULT_TREE_CONFIG.label, `  label=${quote(config.label)}`);
  push(config.required, "  required");
  push(config.multiple, "  multiple");
  push(config.fullWidth, "  fullWidth");
  push(config.disabled, "  disabled");
  push(config.error, "  error");
  push(
    config.multiple && (config.maxSelection ?? null) !== null,
    `  multipleConfig={{ maxSelection: ${config.maxSelection} }}`,
  );
  push(
    config.placeholder !== DEFAULT_TREE_CONFIG.placeholder,
    `  placeholder=${quote(config.placeholder)}`,
  );
  push(
    config.searchPlaceholder !== DEFAULT_TREE_CONFIG.searchPlaceholder,
    `  searchPlaceholder=${quote(config.searchPlaceholder)}`,
  );
  push(
    config.emptyMessage !== DEFAULT_TREE_CONFIG.emptyMessage,
    `  emptyMessage=${quote(config.emptyMessage)}`,
  );
  push(
    config.remote && config.loadingMessage !== DEFAULT_TREE_CONFIG.loadingMessage,
    `  loadingMessage=${quote(config.loadingMessage)}`,
  );
  push(
    config.remote &&
      config.remoteErrorMessage !== DEFAULT_TREE_CONFIG.remoteErrorMessage,
    `  remoteErrorMessage=${quote(config.remoteErrorMessage)}`,
  );
  if (config.remote) {
    lines.push(
      `  remote={{ identifier: "playground-regions", optionsFn, refreshOnOpen: ${config.refreshOnOpen} }}`,
    );
  } else {
    lines.push(`  data={config.rows} // ${config.shape}`);
    push(config.shape === "flat", `  flatParentKey="parentCode"`);
  }
  lines.push(
    `  value={value}`,
    `  onChange={(value, items) => setSelection(value, items)}`,
    `  menuItemConfig={{ value: "code", label: ["name"] }}`,
  );
  return ["<ComboboxTree", ...lines, "/>"].join("\n");
}
