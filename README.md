<div align="center">

# Advanced Combobox
*A list & tree combobox for the shadcn registry. Simple, light, performatic, reusable.*

[![CI](https://img.shields.io/github/actions/workflow/status/FernaandoJr/advanced-combobox/ci.yml?branch=main&style=flat-square)](https://github.com/FernaandoJr/advanced-combobox/actions)
[![shadcn registry](https://img.shields.io/badge/shadcn-registry-blue?style=flat-square)](#install)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-3c873a?style=flat-square)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub!

[Features](#features) • [Install](#install) • [Usage](#usage) • [Props](#props) • [Development](#development)

</div>

---

One `npx shadcn add` copies the **source code** into your project, exactly like shadcn/ui does. No npm package to update, no wrappers to fight. The component is fully decoupled: **zero runtime dependencies** beyond React, all strings configurable via props, and the shadcn primitives it builds on are pulled in as registry dependencies.

> [!TIP]
> **No generics needed at the call site.** Just use `<Combobox>`. The item type `T` is inferred from the `options` array or the return type of `remote.optionsFn`, and flows into `value`, `onChange` and `menuItemConfig` automatically.

## Features

- 📋 **List combobox**: single/multi selection, clear option & inline clear button, error state, required indicator, form-ready (`id`/`name`/`aria-*`)
- 🌳 **Tree combobox**: flat data joined by a parent key *or* already nested data; cascading parent⇄descendant checkboxes; expand/collapse all; branch-preserving search
- 🌐 **Remote options**: lazy fetch with cancellation (`AbortSignal`), `searchOnInput` mode, min-length gate, in-memory cache per identifier, retries that skip 401/403
- 📄 **Pagination**: client-side slices or server-driven mode
- 🕸️ **Fully inferred generics**: write `<Combobox>`, never `<Combobox<User>`; `value` types are preserved (number, string, …), controlled & uncontrolled
- 🪶 **Light by design**: no `react-query`, no i18n lib, no HTTP client, no provider

## Install

Add the registry to your project's `components.json` once:

```jsonc
{
  // ...your existing shadcn config
  "registries": {
    "@advanced-combobox": {
      "url": "https://raw.githubusercontent.com/FernaandoJr/advanced-combobox/main/public/r/{name}.json"
    }
  }
}
```

Then install:

```bash
npx shadcn add @advanced-combobox/combobox
```

Or by raw URL, no configuration needed:

```bash
npx shadcn add https://fernaandojr.github.io/advanced-combobox/r/combobox.json
```

This brings the component plus its shadcn `ui` primitives (`button`, `popover`, `command`, `checkbox`, `label`, `collapsible`, `input-group`, `scroll-area`, `tooltip`) and deps (`cmdk`, `lucide-react`) into **your** codebase. Edit anything afterwards.

> [!NOTE]
> Requirements: React 18/19, Tailwind CSS (v4 recommended), a shadcn-style project with `cn` exported from `@/lib/utils`.

## Usage

### List: local options

```tsx
import { Combobox } from "@/components/ui/combobox";

const users = [
  { id: 1, name: "Ada", email: "ada@lovelace.dev" }, // T inferred from here
  { id: 2, name: "Alan", email: "alan@turing.dev" },
];

<Combobox
  label="Owner"
  required
  searchInput
  value={form.ownerId}
  onChange={(value, item) => form.setOwnerId(value)} // value: number | null, item: (typeof users)[number]
  options={users}
  menuItemConfig={{ value: "id", label: ["name", "email"] }}
/>
```

### List: remote + multi-select + pagination

```tsx
type Product = { code: string; sku: string; name: string };

// T inferred from the return type of searchProducts
const searchProducts = (search?: string, signal?: AbortSignal): Promise<Product[]> =>
  api.get("products", { params: { search }, signal });

<Combobox
  label="Products"
  multiple
  fullWidth
  searchInput
  emptyMessage="No products found"
  remote={{
    identifier: "sale-order-products",           // cache key
    optionsFn: searchProducts,
    searchOnInput: true,                          // send search to the API
    minimumSearchLength: 2,
  }}
  menuItemConfig={{ value: "code", label: ["sku", "name"] }}
  pagination={{ pageSize: 30, loadMoreLabel: "Load more" }}
/>
```

> [!NOTE]
> If the source can't be inferred (e.g. you pass `vi.fn()` in tests or a callback stored as `any`), annotate it: `optionsFn: ((search?: string) => Promise<Product[]>)` or keep the explicit `remote?.` config with a typed helper. You can still write `<Combobox<Product>>` when you prefer to be explicit.

### Tree

```tsx
const regions = [
  { code: "BR", name: "Brazil", parentCode: "" },
  { code: "SP", name: "São Paulo", parentCode: "BR" },
];

// Flat data joined by a parent key...
<ComboboxTree
  label="Region"
  data={regions}
  flatParentKey="parentCode"
  rootParentValues={["-1"]} // extra parent values treated as root
  multiple
  menuItemConfig={{ value: "code", label: ["name"] }}
/>

// ...or already nested data:
<ComboboxTree
  data={nestedRegions}
  menuItemConfig={{ value: "code", label: ["name"] }}
/>
```

## Props

| Prop | Description |
| --- | --- |
| `options` / `remote` | Local items or remote config (`identifier`, `optionsFn`, `searchOnInput`, `minimumSearchLength`, `disableLazyFetch`, `refreshOnOpen`) |
| `menuItemConfig` | Maps item → `value` key, `label` keys / `customLabel`, search keys, disabled predicate, `customStartNode` |
| `selectedItemConfig` | Overrides the trigger label only (`label`, `customLabel`, `customStartNode`, `multipleSeparator`) |
| `multiple` / `multipleConfig` | Multi-select with `maxSelection` and `maxVisibleItems` (+N overflow) |
| `pagination` | `pageSize`, `loadMoreLabel`, `mode: "client" \| "server"` with `onLoadMore` / `onSearchChange` / `hasMore` |
| `value` / `onChange` | Controlled value; `onChange(value, item)`; `value` is `null` when cleared |
| Form | `label`, `required`, `error`, `id`, `name`, `aria-describedby`, `aria-invalid`, `onBlur` |
| Labels | `placeholder`, `searchPlaceholder`, `emptyMessage`, `loadingMessage`, `remoteErrorMessage`, `clearOptionLabel`, `clearButtonLabel` (tree: `expandAllLabel`, `collapseAllLabel`) |
| Tree | `data`, `flatParentKey`, `rootParentValues`, `multipleConfig` |

### Remote data model

- Fetches lazily when the dropdown opens (or on mount with `disableLazyFetch`).
- Cached **per identifier** (+ search text when `searchOnInput`), in a cache shared by every mounted instance: two fields using the same identifier never fetch twice.
- `refreshOnOpen: true` revalidates on every open instead.
- Errors clear the cache, so the next open tries again; transient failures retry twice, auth/permission (401/403) never retry.
- Superseded requests are aborted and never write stale state or cache: changing the search text can't leak an older response into the list.
- Concurrent searches cancel the previous request via `AbortSignal`.

## Development

```bash
npm install
npm run test             # vitest, 18 tests
npm run typecheck        # tsc --noEmit
npm run registry:build   # rebuild public/r/*.json
npm run registry:check   # fail if registry JSONs are stale
```

> [!TIP]
> `src/components/ui/*` in this repo are dev references (standard shadcn primitives) used for type-checking and tests. The registry item only ships `src/components/combobox/*`.
