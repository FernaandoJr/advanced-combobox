import { DEFAULT_LIST_CONFIG, DEFAULT_TREE_CONFIG } from "./config";
import type { ListConfig, TreeConfig } from "./config";

export interface ListPreset {
  name: string;
  label: string;
  patch: Partial<ListConfig>;
  /** Sets a persisted controlled value for hydration demos. */
  persistedValue?: string;
  /** Pairs the remote with the ticking counter fixture (refreshOnOpen). */
  tickingRemote?: boolean;
}

export const LIST_PRESETS: ListPreset[] = [
  {
    name: "basic",
    label: "Basic list",
    patch: {},
  },
  {
    name: "remote-search",
    label: "Remote search (searchOnInput)",
    patch: {
      dataSource: "remote",
      searchOnInput: true,
      minimumSearchLength: 2,
      latency: 400,
    },
  },
  {
    name: "multi",
    label: "Multiple selection",
    patch: {
      dataSource: "local",
      multiple: true,
      maxSelection: 2,
      maxVisibleItems: 1,
      pagination: "off",
    },
  },
  {
    name: "pagination-client",
    label: "Pagination (client)",
    patch: {
      dataSource: "local",
      itemCount: 75,
      pagination: "client",
      pageSize: 10,
      multiple: false,
    },
  },
  {
    name: "pagination-server",
    label: "Pagination (server)",
    patch: {
      dataSource: "local",
      itemCount: 23,
      pagination: "server",
      pageSize: 5,
      latency: 350,
    },
  },
  {
    name: "hydration",
    label: "Persisted value hydration",
    patch: {
      dataSource: "remote",
      searchOnInput: false,
      latency: 400,
      label: "City",
      searchInput: true,
    },
    persistedValue: "curitiba",
  },
  {
    name: "refresh-on-open",
    label: "Refresh on open",
    patch: {
      dataSource: "remote",
      searchOnInput: false,
      refreshOnOpen: true,
      latency: 300,
    },
    tickingRemote: true,
  },
  {
    name: "remote-error",
    label: "Remote error (revoked)",
    patch: {
      dataSource: "remote",
      searchOnInput: false,
      refreshOnOpen: true,
      latency: 400,
      failAfterCalls: 2,
      remoteErrorMessage: "Voc\u00ea n\u00e3o tem acesso a estas op\u00e7\u00f5es.",
    },
  },
];

export interface TreePreset {
  name: string;
  label: string;
  patch: Partial<TreeConfig>;
}

export const TREE_PRESETS: TreePreset[] = [
  { name: "tree-single", label: "Single (flat data)", patch: { shape: "flat" } },
  { name: "tree-nested", label: "Single (nested data)", patch: { shape: "nested" } },
  {
    name: "tree-multi",
    label: "Multi (cascading)",
    patch: { shape: "flat", multiple: true, maxSelection: 3 },
  },
  {
    name: "tree-remote",
    label: "Remote tree",
    patch: { shape: "flat", remote: true, latency: 400 },
  },
];

export function applyListPreset(name: string): ListConfig {
  const preset = LIST_PRESETS.find((candidate) => candidate.name === name) ?? LIST_PRESETS[0];
  return { ...DEFAULT_LIST_CONFIG, preset: preset.name, ...preset.patch };
}

export function applyTreePreset(name: string): TreeConfig {
  const preset = TREE_PRESETS.find((candidate) => candidate.name === name) ?? TREE_PRESETS[0];
  return { ...DEFAULT_TREE_CONFIG, preset: preset.name, ...preset.patch };
}

export function listPresetWith(name: string): { config: ListConfig; persistedValue: string | null } {
  const preset = LIST_PRESETS.find((candidate) => candidate.name === name) ?? LIST_PRESETS[0];
  const config = applyListPreset(name);
  return { config, persistedValue: preset.persistedValue ?? null };
}

export function listPresetUsesTickingRemote(name: string): boolean {
  const preset = LIST_PRESETS.find((candidate) => candidate.name === name) ?? LIST_PRESETS[0];
  return preset.tickingRemote === true;
}
