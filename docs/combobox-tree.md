# Combobox Tree

Tree dropdown with collapsible folders, cascading checkbox selection in multi-select mode, branch-preserving search and expand/collapse all. Data comes from a flat list joined by a parent key, or an already nested structure. The item type is always inferred from `data` or `remote.optionsFn`, so `<ComboboxTree>` needs no explicit generics.

- Quick start (flat data):

```tsx
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";

const rows = [
  { code: "BR", name: "Brazil", parentCode: "" },
  { code: "SP", name: "São Paulo", parentCode: "BR" },
];

<ComboboxTree
  label="Region"
  data={rows}
  flatParentKey="parentCode"
  multiple
  menuItemConfig={{ value: "code", label: ["name"] }}
  onChange={(values, items) => form.setField("regions", values)}
/>
```

## API Reference

### `<ComboboxTree />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `T[]` | `undefined` | Items. Flat list joined by `flatParentKey`, or already nested with `children` (then omit `flatParentKey`). Ignored while `remote` is set. |
| `remote` | `RemoteConfigTree<T>` | `undefined` | Fetches items from an API. See config below. |
| `menuItemConfig` | `MenuItemConfig<T>` | (required) | Maps each item to `value` and `label`. Same config as `<Combobox />`. |
| `flatParentKey` | `keyof T` | `undefined` | Parent pointer on each flat row (e.g. `parentCode`). Rows whose parent is null, empty (`""`) or listed in `rootParentValues` become roots. Omit when the data is already nested. |
| `rootParentValues` | `readonly string[]` | `undefined` | Extra parent values treated as root, compared with the same string coercion as item values. |
| `value` | `ComboboxValueType<T> \| ComboboxValueType<T>[] \| null` | uncontrolled | Controlled selection. Single: one value or `null`. Multi: array of values. |
| `multiple` | `boolean` | `false` | Enables checkboxes with cascading parent and descendant selection. |
| `multipleConfig` | `MultipleConfig` | `undefined` | `maxSelection` and `maxVisibleItems`, same as `<Combobox />`. |
| `selectedItemConfig` | `SelectedItemConfig<T>` | `undefined` | Overrides how the trigger shows the selection (display only). |
| `label` | `string` | `undefined` | Text label rendered above the trigger, associated via `htmlFor`/`id`. |
| `required` | `boolean` | `false` | Shows the required indicator next to the label. |
| `error` | `boolean` | `false` | Marks the trigger as invalid (`aria-invalid` + destructive border). |
| `disabled` | `boolean` | `false` | Disables the combobox (the trigger also disables itself while remote data loads). |
| `fullWidth` | `boolean` | `false` | Trigger stretches to fill its container instead of `w-max` with `min-w-70`. |
| `className` | `string` | `undefined` | Extra CSS classes for the trigger button. |
| `placeholder` | `string` | `"Select..."` | Text shown when nothing is selected. |
| `searchPlaceholder` | `string` | `"Search..."` | Placeholder of the built-in search field. |
| `emptyMessage` | `string` | `"No results found"` | Message when no branch matches the search. |
| `loadingMessage` | `string` | `"Loading..."` | Message shown while remote data loads. |
| `remoteErrorMessage` | `string` | `"Could not load the options. Close and reopen this field to try again."` | Message shown when remote loading fails. |
| `expandAllLabel` | `string` | `"Expand all"` | Accessible label / tooltip of the expand-all button. |
| `collapseAllLabel` | `string` | `"Collapse all"` | Accessible label / tooltip of the collapse-all button. |

### Callbacks

| Prop | Signature | Description |
| --- | --- | --- |
| `onChange` | `(value: ComboboxValueType<T> \| ComboboxValueType<T>[] \| null \| undefined, items: T[]) => void` | Fires on selection change. Single: `(value, [item])`. Multi: `(values, items)` where a checked folder applies itself and all descendants, and unchecking removes them. |
| `onBlur` | `() => void` | Fires when the dropdown closes. |
| `onMaxSelectionReached` | `() => void` | Fires when a cascade would exceed `multipleConfig.maxSelection`. |

### `remote` (RemoteConfigTree<T>)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `identifier` | `string` | (required) | Unique id for this config; the cache key, shared with `<Combobox />` instances that reuse it. |
| `optionsFn` | `(signal?: AbortSignal) => Promise<T[]>` | (required) | Returns raw items (the full tree; the component joins it by `flatParentKey`). |
| `disableLazyFetch` | `boolean` | `false` | Fetches on mount instead of on first dropdown open. |
| `refreshOnOpen` | `boolean` | `false` | Revalidates on every dropdown open instead of trusting the cache. |

Caching, cancellation and retry semantics are the same as `<Combobox />` (see `docs/combobox.md`).

## Behavior details

- **Search keeps branches intact:** matching leaves stay together with their parent path, and matched parents auto-expand while searching. A branch with no match (and no matching descendant) is removed.
- **Cascading checks:** checking a folder checks all its descendants (`onMaxSelectionReached` blocks the whole cascade if it would exceed the limit); unchecking removes them all.
- **Check state propagation:** a folder shows checked when every descendant is checked, indeterminate when some are.
- **Expand/collapse all** appears only when there is at least one folder.

## Not available on `<ComboboxTree />`

- `options`/`remote` list mode without hierarchy: use `<Combobox />` (see `docs/combobox.md`).
- `pagination`: trees are loaded fully, locally filtered.
- `showEmptyOption`, `showClearButton`, `searchInput`, `id`, `name`, `aria-*`: the tree always renders its own search bar and does not position itself as a plain form field. Pass `aria-invalid` through the `error` prop instead.
