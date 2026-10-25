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
  label: "Region",
  placeholder: "Select a region",
  searchPlaceholder: "Search regions",
  emptyMessage: "No regions found",
  loadingMessage: "Loading regions...",
  remoteErrorMessage: "Could not load the regions.",
  expandAllLabel: "Expand all",
  collapseAllLabel: "Collapse all",
};
