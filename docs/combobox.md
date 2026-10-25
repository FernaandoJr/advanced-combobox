# Combobox

Autocomplete dropdown with single or multiple selection, remote options, pagination and search. The item type is always inferred from `options` or `remote.optionsFn`, so `<Combobox>` needs no explicit generics.

- Quick start:

```tsx
import { Combobox } from "@/components/ui/combobox/combobox";

<Combobox
  label="Owner"
  searchInput
  options={users}
  menuItemConfig={{ value: "id", label: ["name", "email"] }}
  onChange={(value, item) => form.setField("ownerId", value)} // value: number | null
/>
```

## API Reference

### `<Combobox />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `T[]` | `undefined` | Raw items. Wins over remote items when both are provided and non-empty. `value`, `label` and search come from `menuItemConfig`. |
| `remote` | `RemoteConfig<T>` | `undefined` | Fetches options from an API. See `remote` config below. |
| `menuItemConfig` | `MenuItemConfig<T>` | (required) | Maps each item to `value`, `label` and search text. See config below. |
| `value` | `ComboboxValueType<T> \| ComboboxValueType<T>[] \| null` | uncontrolled | Controlled selection. Single: one value or `null` when cleared. Multi: array of values. Omit for uncontrolled (internal state). |
| `multiple` | `boolean` | `false` | Enables multi-select with checkboxes. |
| `multipleConfig` | `MultipleConfig` | `undefined` | Multi-select limits. See config below. |
| `pagination` | `PaginationConfig` | `undefined` | Optional paging for large lists. See config below. |
| `selectedItemConfig` | `SelectedItemConfig<T>` | `undefined` | Overrides how the trigger shows the selected item (display only, does not change dropdown items). |
| `selectedFallbackLabel` | `ReactNode` | `undefined` | Trigger label when the controlled value is set but its item is not loaded yet (e.g. remote hydration). |
| `onSelectedItemResolved` | `(item: T \| null) => void` | `undefined` | Reports the complete item of a single selection after hydration, including via remote options. Fires in single-select mode only, when the item becomes available. |
| `searchInput` | `boolean` | `false` | Shows the search input inside the dropdown. |
| `showEmptyOption` | `boolean` | `false` | Shows a first empty option in the list (single mode only); picking it empties the selection. |
| `showClearButton` | `boolean` | `false` | Shows an inline clear button on the trigger (single mode only, hidden while disabled). |
| `pagination` | `PaginationConfig` | `undefined` | Optional paging for large option lists, client or server driven. |
| `label` | `string` | `undefined` | Text label rendered above the trigger, associated via `htmlFor`/`id`. |
| `required` | `boolean` | `false` | Shows the required indicator (red asterisk) next to the label. |
| `error` | `boolean` | `false` | Marks the trigger as invalid (`aria-invalid` + destructive border). |
| `disabled` | `boolean` | `false` | Disables the combobox. |
| `fullWidth` | `boolean` | `false` | Trigger stretches to fill its container instead of `w-max` with `min-w-70`. |
| `className` | `string` | `undefined` | Extra CSS classes for the trigger button. |
| `id` | `string` | `useId()` | Id for the trigger (e.g. from `FormControl`). Also used by the `label`. |
| `name` | `string` | `undefined` | Name for the trigger when used as a form field. |
| `placeholder` | `string` | `"Select..."` | Text shown when no option is selected. |
| `searchPlaceholder` | `string` | `"Search..."` | Placeholder of the dropdown search input. |
| `emptyMessage` | `string` | `"No results found"` | Message when no option matches the search. |
| `loadingMessage` | `string` | `"Loading..."` | Message shown while loading remote data. |
| `remoteErrorMessage` | `string` | `"Could not load the options. Close and reopen this field to try again."` | Message shown when remote loading fails. |
| `emptyOptionLabel` | `string` | `"No selection"` | Label of the first option when `showEmptyOption` is on; picking it empties the selection. |
| `clearButtonLabel` | `string` | `"Clear selection"` | Accessible label / title of the inline clear button (`showClearButton`). |
| `aria-describedby` | `string` | `undefined` | Forwarded to the trigger (e.g. from `FormControl`). |
| `aria-invalid` | `boolean` | `undefined` | Forwarded to the trigger. `error` also implies it. |

### Callbacks

| Prop | Signature | Description |
| --- | --- | --- |
| `onChange` | `(value: ComboboxValueType<T> \| ComboboxValueType<T>[] \| null \| undefined, item: T \| T[] \| null) => void` | Fires on selection change. Single: `(value, item)`, value is `null` when cleared. Multi: `(values, items)`, `items` follows the order the selection was built. |
| `onSelectedItemResolved` | `(item: T \| null) => void` | Single mode only. Reports the full item once the controlled value can be resolved from local options or a remote page. |
| `onBlur` | `() => void` | Fires when the dropdown closes. |
| `onMaxSelectionReached` | `() => void` | Fires when the user selects beyond `multipleConfig.maxSelection` (multi only). |
| `onKeyDown` | `(event: React.KeyboardEvent) => void` | Key events on the trigger. |

### `remote` (RemoteConfig<T>)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `identifier` | `string` | (required) | Unique id for this config; the cache key. Two fields sharing the same identifier share remote data without a second request. |
| `optionsFn` | `(searchValue?: string, signal?: AbortSignal) => Promise<T[]>` | (required) | Returns raw items. Receives the current search text when `searchOnInput` is on, and an `AbortSignal` that cancels the request when a newer search starts. |
| `disableLazyFetch` | `boolean` | `false` | Fetches on mount instead of on first dropdown open. Ignored while `searchOnInput` is on. |
| `searchOnInput` | `boolean` | `false` | Sends the search text to `optionsFn` on each input instead of filtering one locally loaded page. |
| `refreshOnOpen` | `boolean` | `false` | Revalidates on every fetch enable (e.g. each dropdown open) instead of trusting the cache. |

Request semantics:

- Fetch runs lazily when the dropdown opens (or on mount with `disableLazyFetch`): with `searchOnInput`, the API is called right away with the current (possibly empty) search text, and again on each keystroke.
- Cached per identifier (+ search text when `searchOnInput`) in a cache shared by every mounted instance: two fields using the same identifier never fetch twice.
- Superseded requests are aborted and never write state or cache, so switching the search text cannot leak an older response into the list.
- Errors clear the cache for the key, so the next open tries again. Transient failures retry up to 3 attempts; 401/403 never retry.

### `menuItemConfig` (MenuItemConfig<T>)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `keyof T` | (required) | Key of the item used as the option value. Its type is preserved in the value and in `onChange` (number, string etc.). |
| `label` | `(keyof T)[]` | (required) | Keys joined to build the display label (e.g. `["sku", "name"]`). Ignored when `customLabel` is set. |
| `separator` | `string` | `" "` | Separator between label parts. When set (e.g. `" - "`), it renders with spaces around it. |
| `disableSpaceBetween` | `boolean` | `false` | Uses the separator as-is, without spaces around it. |
| `customLabel` | `(item: T) => ReactNode` | `undefined` | Custom node per item (badges, images etc.). Overrides `label`. |
| `customStartNode` | `(item: T) => ReactNode` | `undefined` | Node at the start of each menu item (icon, avatar). |
| `searchProperties` | `(keyof T)[]` | `label` keys | Keys used to build the searchable string for filtering. |
| `isOptionDisabled` | `(item: T) => boolean` | `undefined` | Items where this returns true are shown but not selectable. |

### `pagination` (PaginationConfig)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pageSize` | `number` | (required) | Options rendered initially and by each load-more action. Requires a positive value. |
| `mode` | `"client" \| "server"` | `"client"` | Client mode slices locally and keeps filtering the full list. Server mode delegates search and next-page loading to the caller. |
| `loadMoreLabel` | `string` | `"Load more"` | Label of the load-more button. |
| `hasMore` | `boolean` | `false` | Whether the server still has another page. Server mode only. |
| `isLoadingMore` | `boolean` | `false` | Tracks the next server page being loaded. Server mode only. |
| `onLoadMore` | `() => void` | `undefined` | Loads the next server page. Server mode only. |
| `onSearchChange` | `(value: string) => void` | `undefined` | Receives the current search text on every change, and `""` when the search resets. Used with `mode: "server"` or `remote.searchOnInput`. |

### `multipleConfig` (MultipleConfig)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `maxSelection` | `number` | unlimited | Maximum number of selectable items. Beyond it, `onMaxSelectionReached` fires. |
| `maxVisibleItems` | `number` | automatic | How many selected items show on the trigger before a `+N` overflow. |

### `selectedItemConfig` (SelectedItemConfig<T>)

Display-only overrides for the trigger. Does not change dropdown items.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `(keyof T)[]` | `menuItemConfig.label` | Keys joined to build the trigger label. |
| `separator` | `string` | `menuItemConfig.separator` | Separator between label parts on the trigger. |
| `disableSpaceBetween` | `boolean` | `menuItemConfig.disableSpaceBetween` | Uses the separator as-is on the trigger. |
| `multipleSeparator` | `string` | `, ` (via `title` tooltip) | Separator rendered between multiple selected items on the trigger, e.g. `"/"` or `" \| "`. |
| `customLabel` | `(item: T) => ReactNode` | `undefined` | Custom trigger node; overrides `label` and `menuItemConfig.customLabel`. |
| `customStartNode` | `(item: T) => ReactNode` | `undefined` | Trigger start node; overrides `menuItemConfig.customStartNode`. |
| `disableStartNode` | `boolean` | `false` | Hides the start node on the trigger. Ignored when `customStartNode` is set. |

## Server pagination example

```tsx
const [page, setPage] = useState(0);
const results = useApi(`/products?search=${query}&page=${page}`);

<Combobox
  multiple
  searchInput
  options={results.items} // items for the current page
  menuItemConfig={{ value: "code", label: ["sku", "name"] }}
  pagination={{
    mode: "server",
    pageSize: 30,
    hasMore: results.hasMore,
    isLoadingMore: results.isFetchingNextPage,
    onLoadMore: () => setPage((p) => p + 1),
    onSearchChange: (search) => {
      setPage(0);
      setQuery(search);
    },
  }}
/>
```

## Not available on `<Combobox />`

- Tree rendering and cascading selection: use `<ComboboxTree />` (see `docs/combobox-tree.md`).
- Built-in trigger search field styling beyond `searchInput` (the tree variant always renders its own search bar).

## Form integration note

The trigger accepts `id`, `name` and `aria-*` like a shadcn form control, and value lives outside the DOM: the component is a controlled/uncontrolled input pair, the same contract as `react-hook-form` consuming `onChange` with `null` on clear.
