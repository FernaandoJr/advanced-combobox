export type DataSource = "local" | "remote";
export type PaginationMode = "off" | "client" | "server";

export interface ListConfig {
  preset: string;
  dataSource: DataSource;
  /** Fixture size for local options and the remote pool (12..120). */
  itemCount: number;
  /** Simulated network latency in ms (0..1500). */
  latency: number;
  /** Simulated permission failure from the Nth request onwards (0 = never). */
  failAfterCalls: number;
  /** Which fixture domain the playground selects as `options` / `remote`. */
  dataset: string;
  /** Menu label parts joined by menuSeparator (overridden by menuLabelStyle). */
  menuLabelKeys: string[];
  /** Separator between menu label parts. */
  menuSeparator: string;
  disableSpaceBetween: boolean;
  /** "label" = default (label keys); "explicit" = dataset searchTextKeys. */
  searchRule: "label" | "explicit";
  /** isOptionDisabled rule per dataset ("none" disables nothing). */
  disableRule: string;
  /** customLabel style for menu items ("none" = keys + separator). */
  menuLabelStyle: string;
  /** customStartNode style for menu items ("none" = nothing). */
  menuStartNodeStyle: string;
  /** selectedItemConfig.label override (empty = follow menu). */
  selectedLabelKeys: string[];
  /** selectedItemConfig.customLabel style ("none" = label keys). */
  selectedLabelStyle: string;
  /** selectedItemConfig.customStartNode style ("none" = menu start node). */
  selectedStartNodeStyle: string;
  /** Separator between multiple selected items in the trigger ("" = spacing only). */
  multipleSeparator: string;
  /** selectedItemConfig.disableStartNode. */
  selectedDisableStartNode: boolean;
  searchInput: boolean;
  fullWidth: boolean;
  disabled: boolean;
  error: boolean;
  required: boolean;
  multiple: boolean;
  maxSelection: number | null;
  maxVisibleItems: number | null;
  showEmptyOption: boolean;
  showClearButton: boolean;
  searchOnInput: boolean;
  refreshOnOpen: boolean;
  pagination: PaginationMode;
  pageSize: number;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  loadingMessage: string;
  remoteErrorMessage: string;
  emptyOptionLabel: string;
  clearButtonLabel: string;
  loadMoreLabel: string;
}

export const DEFAULT_LIST_CONFIG: ListConfig = {
  preset: "basic",
  dataSource: "local",
  itemCount: 12,
  latency: 350,
  failAfterCalls: 0,
  dataset: "cities",
  menuLabelKeys: ["name", "code"],
  menuSeparator: " - ",
  disableSpaceBetween: false,
  searchRule: "label",
  disableRule: "none",
  menuLabelStyle: "none",
  menuStartNodeStyle: "none",
  selectedLabelKeys: [],
  selectedLabelStyle: "none",
  selectedStartNodeStyle: "none",
  multipleSeparator: "",
  selectedDisableStartNode: false,
  searchInput: true,
  fullWidth: true,
  disabled: false,
  error: false,
  required: false,
  multiple: false,
  maxSelection: null,
  maxVisibleItems: null,
  showEmptyOption: false,
  showClearButton: false,
  searchOnInput: true,
  refreshOnOpen: false,
  pagination: "off",
  pageSize: 5,
  label: "City",
  placeholder: "Select a city",
  searchPlaceholder: "Search cities",
  emptyMessage: "No cities found",
  loadingMessage: "Loading cities...",
  remoteErrorMessage: "Could not load the cities.",
  emptyOptionLabel: "No selection",
  clearButtonLabel: "Clear selection",
  loadMoreLabel: "Load more",
};

export interface TreeConfig {
  preset: string;
  /** flat data joined by flatParentKey, or already nested rows. */
  shape: "flat" | "nested";
  remote: boolean;
  latency: number;
  failAfterCalls: number;
  refreshOnOpen: boolean;
  multiple: boolean;
  maxSelection: number | null;
  fullWidth: boolean;
  disabled: boolean;
  error: boolean;
  required: boolean;
  /** customStartNode style ("none" = nothing). */
  startNodeStyle: string;
  /** selectedItemConfig customLabel style for the trigger ("none" = label). */
  selectedLabelStyle: string;
  /** Separator between multiple selected items in the trigger ("" = spacing only). */
  multipleSeparator: string;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  loadingMessage: string;
  remoteErrorMessage: string;
  expandAllLabel: string;
  collapseAllLabel: string;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
  preset: "tree-single",
  shape: "flat",
  remote: false,
  latency: 350,
  failAfterCalls: 0,
  refreshOnOpen: false,
  multiple: false,
  maxSelection: null,
  fullWidth: true,
  disabled: false,
  error: false,
  required: false,
  startNodeStyle: "none",
  selectedLabelStyle: "none",
  multipleSeparator: "",
  label: "Region",
  placeholder: "Select a region",
  searchPlaceholder: "Search regions",
  emptyMessage: "No regions found",
  loadingMessage: "Loading regions...",
  remoteErrorMessage: "Could not load the regions.",
  expandAllLabel: "Expand all",
  collapseAllLabel: "Collapse all",
};
