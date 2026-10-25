<div align="center">

# Advanced Combobox
*A list & tree combobox for the shadcn registry — simple, light, performatic, reusable.*

[![CI](https://img.shields.io/github/actions/workflow/status/FernaandoJr/advanced-combobox/ci.yml?branch=main&style=flat-square)](https://github.com/FernaandoJr/advanced-combobox/actions)
[![shadcn registry](https://img.shields.io/badge/shadcn-registry-blue?style=flat-square)](#install)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-3c873a?style=flat-square)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub!

[Features](#features) • [Install](#install) • [Usage](#usage) • [Props](#props) • [Development](#development)

</div>

---

One `npx shadcn add` copies the **source code** into your project, exactly like shadcn/ui does — no npm package to update, no wrappers to fight. The component is fully decoupled: **zero runtime dependencies** beyond React, all strings configurable via props, and the shadcn primitives it builds on are pulled in as registry dependencies.

## Features

- 📋 **List combobox** — single/multi selection, clear option & inline clear button, error state, required indicator, form-ready (`id`/`name`/`aria-*`)
- 🌳 **Tree combobox** — flat data joined by a parent key *or* already nested data; cascading parent⇄descendant checkboxes; expand/collapse all; branch-preserving search
- 🌐 **Remote options** — lazy fetch with cancellation (`AbortSignal`), `searchOnInput` mode, min-length gate, in-memory cache per identifier, retries that skip 401/403
- 📄 **Pagination** — client-side slices or server-driven mode
- 🕸️ **Typed generics** — option `value` types are preserved (number, string, …), controlled & uncontrolled
- 🪶 **Light by design** — no `react-query`, no i18n lib, no HTTP client, no provider

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

This brings the component plus its shadcn `ui` primitives (`button`, `popover`, `command`, `checkbox`, `label`, `collapsible`, `input-group`, `scroll-area`, `tooltip`) and deps (`cmdk`, `lucide-react`) into **your** codebase — edit anything afterwards.

> [!NOTE]
> Requirements: React 18/19, Tailwind CSS (v4 recommended), a shadcn-style project with `cn` exported from `@/lib/utils`.

## Usage

### List — local options

```tsx
import { Combobox } from "@/components/ui/combobox";

type User = { id: number; name: string; email: string };

<Combobox<User>
  label="Owner"
  required
  searchInput
  value={form.ownerId}
  onChange={(value, item) => form.setOwnerId(value)} // number | null
  options={users}
  menuItemConfig={{ value: "id", label: ["name", "email"] }}
/>
```

### List — remote + multi-select + pagination

```tsx
type Product = { code: string; sku: string; name: string };

<Combobox<Product>
  label="Products"
  multiple
  fullWidth
  searchInput
  emptyMessage="No products found"
  remote={{
    identifier: "sale-order-products",           // cache key
    optionsFn: (search, signal) => api.search(search!, signal),
    searchOnInput: true,                          // send search to the API
    minimumSearchLength: 2,
  }}
  menuItemConfig={{ value: "code", label: ["sku", "name"] }}
  pagination={{ pageSize: 30, loadMoreLabel: "Load more" }}
/>
```

### Tree

```tsx
type Region = { code: string; name: string; parentCode?: string };

// Flat data joined by a parent key...
<ComboboxTree<Region>
  label="Region"
  data={regions}
  flatParentKey="parentCode"
  rootParentValues={["-1"]} // extra parent values treated as root
  multiple
  menuItemConfig={{ value: "code", label: ["name"] }}
/>

// ...or already nested data:
<ComboboxTree<Region> data={nestedRegions} menuItemConfig={{ value: "code", label: ["name"] }} />
```

## Props

| Prop | Description |
| --- | --- |
| `options` / `remote` | Local items or remote config (`identifier`, `optionsFn`, `searchOnInput`, `minimumSearchLength`, `disableLazyFetch`, `refreshOnOpen`) |
| `menuItemConfig` | Maps item → `value` key, `label` keys / `customLabel`, search keys, disabled predicate, `customStartNode` |
| `selectedItemConfig` | Overrides the trigger label only (`label`, `customLabel`, `customStartNode`, `multipleSeparator`) |
| `multiple` / `multipleConfig` | Multi-select with `maxSelection` and `maxVisibleItems` (+N overflow) |
| `pagination` | `pageSize`, `loadMoreLabel`, `mode: "client" \| "server"` with `onLoadMore` / `onSearchChange` / `hasMore` |
| `value` / `onChange` | Controlled value; `onChange(value, item)` — `value` is `null` when cleared |
| Form | `label`, `required`, `error`, `id`, `name`, `aria-describedby`, `aria-invalid`, `onBlur` |
| Labels | `placeholder`, `searchPlaceholder`, `emptyMessage`, `loadingMessage`, `remoteErrorMessage`, `clearOptionLabel`, `clearButtonLabel` (tree: `expandAllLabel`, `collapseAllLabel`) |
| Tree | `data`, `flatParentKey`, `rootParentValues`, `multipleConfig` |

### Remote data model

- Fetches lazily when the dropdown opens (or on mount with `disableLazyFetch`).
- Cached **per identifier** (+ search text when `searchOnInput`) — reopening is instant and network-free.
- `refreshOnOpen: true` revalidates on every open instead.
- Errors clear the cache, so the next open tries again; transient failures retry twice, auth/permission (401/403) never retry.
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
