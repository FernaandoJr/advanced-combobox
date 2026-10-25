import type { ReactNode } from "react";

/** Inferred type of the option value from item T and menuItemConfig.value. */
export type ComboboxValueType<T> = T[MenuItemConfig<T>["value"]];

/** Single selectable option (internal shape; options/remote items are mapped via menuItemConfig). */
export interface ComboboxOption<V = string> {
  value: V;
  label: ReactNode;
  /** String used for search filtering. */
  searchableValue?: string;
}

/**
 * Config for loading options from a remote API.
 * The component keeps a small in-memory cache per identifier (plus search value
 * when searchOnInput is on) so reopening the dropdown does not hit the API again.
 * Set refreshOnOpen to true to revalidate on every open instead.
 */
export interface RemoteConfig<T> {
  /** Unique id for this remote config; used as the cache key. */
  identifier: string;
  /** Returns raw items; component maps them with menuItemConfig. */
  optionsFn: (searchValue?: string, signal?: AbortSignal) => Promise<T[]>;
  /** If true, fetches data on mount. If false, fetches on dropdown open. */
  disableLazyFetch?: boolean;
  /** When true, the current search text is sent to optionsFn instead of filtering one page locally. */
  searchOnInput?: boolean;
  /** Minimum trimmed search length before a remote search is sent. Defaults to 1. */
  minimumSearchLength?: number;
  /** When true, refetches every time the dropdown opens (cache is ignored). Defaults to false. */
  refreshOnOpen?: boolean;
}

/**
 * Maps type T to value and label for menu items.
 * Keys are type-checked; value type is preserved (number, string, etc.); label is built from the given keys (or customLabel).
 */
export interface MenuItemConfig<T> {
  /** Key of T used as option value (e.g. "id", "code"). Type is preserved in Combobox value/onChange. */
  value: keyof T;
  /** Keys of T used to build the label (e.g. ["sku", "name"]). Joined with separator. Ignored when customLabel is set. */
  label: (keyof T)[];
  /** Separator between label parts. Default: " - " (with spaces). */
  separator?: string;
  /** When true, no spaces around separator. */
  disableSpaceBetween?: boolean;
  /** Custom ReactNode per item (overrides label). Use for badges, images, etc. */
  customLabel?: (item: T) => ReactNode;
  /** ReactNode at the start of each menu item (e.g. icon, avatar). */
  customStartNode?: (item: T) => ReactNode;
  /** Keys of T used for search filtering. Defaults to label keys when omitted. */
  searchProperties?: (keyof T)[];
  /** When set, menu items for which this returns true are shown but not selectable. */
  isOptionDisabled?: (item: T) => boolean;
}

/**
 * Config for multiple selection. Only used when multiple === true.
 * When maxVisibleItems is omitted, behavior is automatic (shows all selected items).
 */
export interface MultipleConfig {
  /** Max number of items that can be selected. Omit = unlimited. */
  maxSelection?: number;
  /** How many selected items to show on the trigger before "+N". Omit = automatic behavior. */
  maxVisibleItems?: number;
}

/** Optional pagination for large option lists. Defaults to client-side pagination. */
export interface PaginationConfig {
  /** Number of matching options rendered initially and by each load-more action. */
  pageSize: number;
  /** Optional label for the load-more action. */
  loadMoreLabel?: string;
  /** Server mode delegates search and loading the next page to the caller. */
  mode?: "client" | "server";
  /** Whether the server has another page. Used only in server mode. */
  hasMore?: boolean;
  /** Whether the next server page is being loaded. Used only in server mode. */
  isLoadingMore?: boolean;
  /** Loads the next server page. */
  onLoadMore?: () => void;
  /** Receives the current search text. */
  onSearchChange?: (value: string) => void;
}

/**
 * Config for the trigger button label when an item is selected.
 * Overrides menuItemConfig for display only; does not affect dropdown items.
 */
export interface SelectedItemConfig<T> {
  /** Keys of T to build the button label (e.g. ["name", "email"]). Defaults to menuItemConfig.label. */
  label?: (keyof T)[];
  /** Separator between label parts. Defaults to menuItemConfig.separator. */
  separator?: string;
  /** When true, no spaces around separator. Defaults to menuItemConfig.disableSpaceBetween. */
  disableSpaceBetween?: boolean;
  /**
   * Separator string rendered between multiple selected items in the trigger,
   * e.g. "/" or " | ". When omitted, items are separated only by spacing.
   */
  multipleSeparator?: string;
  /** Custom ReactNode for the button when selected (overrides label and menuItemConfig.customLabel). */
  customLabel?: (item: T) => ReactNode;
  /** ReactNode at the start of the button when selected (overrides menuItemConfig.customStartNode). */
  customStartNode?: (item: T) => ReactNode;
  /** When true, hides startNode on the button. Ignored if customStartNode is set. */
  disableStartNode?: boolean;
}

export interface ComboboxProps<T> {
  /** Controlled selected option value. Single: ComboboxValueType<T> or null when cleared. Multi: ComboboxValueType<T>[]. */
  value?: ComboboxValueType<T> | ComboboxValueType<T>[] | null;
  /** Id for the trigger (e.g. from FormControl). */
  id?: string;
  /** Name for the trigger when used as a form field. */
  name?: string;
  /** aria-describedby for the trigger (e.g. from FormControl). */
  "aria-describedby"?: string;
  /** aria-invalid for the trigger (e.g. from FormControl). */
  "aria-invalid"?: boolean;
  /** When true, allows multiple selections with checkboxes. */
  multiple?: boolean;
  /** When multiple is true: limits and how many items to show on the trigger. */
  multipleConfig?: MultipleConfig;
  /** When true, shows required indicator (red asterisk) next to label. */
  required?: boolean;
  /** Text shown when no option is selected. Defaults to "Select...". */
  placeholder?: string;
  /** When true in single-select mode, shows a first option that clears the current selection. */
  showClearOption?: boolean;
  /** When true in single-select mode, shows an inline button that clears the current selection. */
  showClearButton?: boolean;
  /** Label for the clear option. Defaults to "Clear". */
  clearOptionLabel?: string;
  /** Accessible label / title of the inline clear button. Defaults to "Clear selection". */
  clearButtonLabel?: string;
  /** Placeholder for the dropdown search input. Defaults to "Search...". */
  searchPlaceholder?: string;
  /** Message when no options match the search. Defaults to "No results found". */
  emptyMessage?: string;
  /** Message shown while loading remote data. Defaults to "Loading...". */
  loadingMessage?: string;
  /** Message shown when loading remote data fails. */
  remoteErrorMessage?: string;
  /** Label text for the combobox trigger (associated via htmlFor/id). */
  label?: string;
  /** Disables the combobox. */
  disabled?: boolean;
  /** Extra CSS classes for the trigger button. */
  className?: string;
  /** When true, trigger button uses full width of its container. */
  fullWidth?: boolean;
  /** When true, shows search input inside the dropdown. */
  searchInput?: boolean;
  /** Pagination for the option list. Requires a positive pageSize. */
  pagination?: PaginationConfig;
  /** When true, marks the combobox as invalid (validation error). */
  error?: boolean;
  /** Raw items of type T. Value and label are derived from menuItemConfig. */
  options?: T[];
  /** Mapping from T to value/label and search. Required. */
  menuItemConfig: MenuItemConfig<T>;
  /** Overrides for how the selected item is shown in the trigger. Defaults to menuItemConfig. */
  selectedItemConfig?: SelectedItemConfig<T>;
  /** Label shown for the selected value when the selected item is not loaded yet. */
  selectedFallbackLabel?: ReactNode;
  /** Fetches options from API; items are shaped via menuItemConfig. */
  remote?: RemoteConfig<T>;
  /** Called when selection changes. Single: (value, item). Multi: (values, items[]). Value is null when single selection is cleared. */
  onChange?: (
    value: ComboboxValueType<T> | ComboboxValueType<T>[] | null | undefined,
    item: T | T[] | null,
  ) => void;
  /** Reports the complete item after controlled-value hydration, including remote options. */
  onSelectedItemResolved?: (item: T | null) => void;
  /** Called when the combobox loses focus. */
  onBlur?: () => void;
  /** Called when user tries to select beyond maxSelection (multiple only). */
  onMaxSelectionReached?: () => void;
  /** Called on key events on the trigger. */
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/** Config for loading tree items from a remote API. */
export interface RemoteConfigTree<T> {
  /** Unique id for this remote config; used as the cache key. */
  identifier: string;
  /** Returns raw items. */
  optionsFn: (signal?: AbortSignal) => Promise<T[]>;
  /** If true, fetches data on mount. If false, fetches on dropdown open. */
  disableLazyFetch?: boolean;
  /** When true, refetches every time the dropdown opens (cache is ignored). Defaults to false. */
  refreshOnOpen?: boolean;
}

export interface ComboboxTreeProps<T> {
  /** Controlled selected value. Single: ComboboxValueType<T> or null. Multi: ComboboxValueType<T>[]. */
  value?: ComboboxValueType<T> | ComboboxValueType<T>[] | null;
  /** Called when selection changes. */
  onChange?: (
    value: ComboboxValueType<T> | ComboboxValueType<T>[] | null | undefined,
    items: T[],
  ) => void;
  /** Tree items as a flat list (rows joined by flatParentKey) or already nested (children key). */
  data?: T[];
  /** Fetches items from API. */
  remote?: RemoteConfigTree<T>;
  /** `value` key must be unique per row. */
  menuItemConfig: MenuItemConfig<T>;
  /** Overrides for how the selected item is shown in the trigger. Defaults to menuItemConfig. */
  selectedItemConfig?: SelectedItemConfig<T>;
  /** Parent pointer on each flat row (e.g. `parentCode`). Empty / null / `""` / `rootParentValues` → root. */
  flatParentKey?: keyof T;
  /**
   * Parent values treated as root (in addition to null / undefined / `""`).
   * Compared using the same string coercion as item values.
   */
  rootParentValues?: readonly string[];
  multiple?: boolean;
  multipleConfig?: MultipleConfig;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  remoteErrorMessage?: string;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  error?: boolean;
  required?: boolean;
  /** Accessible label / tooltip of the expand-all button. Defaults to "Expand all". */
  expandAllLabel?: string;
  /** Accessible label / tooltip of the collapse-all button. Defaults to "Collapse all". */
  collapseAllLabel?: string;
  className?: string;
  onBlur?: () => void;
  onMaxSelectionReached?: () => void;
}
