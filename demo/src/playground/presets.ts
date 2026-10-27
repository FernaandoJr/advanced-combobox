import { DEFAULT_LIST_CONFIG } from "./config";
import type { ListConfig } from "./config";
import { datasetConfigDefaults } from "./datasets";

/*
  Presets: each one is a complete, intentionally different playground scenario.
  They span every dataset, the node-style catalog, all pagination modes and the
  remote edge cases, so each preset shows a distinct capability of the
  component. Selecting a preset resets the whole panel to the scenario baseline.
*/

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
    label: "Basic (cities)",
    patch: {},
  },
  {
    name: "people-directory",
    label: "People: avatars + role badges (multi)",
    patch: {
      dataset: "people",
      multiple: true,
      maxSelection: 3,
      maxVisibleItems: 3,
      showClearButton: true,
      menuStartNodeStyle: "person-avatar",
      menuLabelStyle: "person-role-badge",
      selectedLabelStyle: "plain-badge",
      multipleSeparator: " / ",
    },
  },
  {
    name: "plugins-catalog",
    label: "Plugins: icons + two-line (legacy off)",
    patch: {
      dataset: "plugins",
      itemCount: 24,
      searchRule: "explicit",
      menuStartNodeStyle: "plugin-icon",
      menuLabelStyle: "plugin-two-line",
      disableRule: "plugins-legacy",
    },
  },
  {
    name: "cars-paged",
    label: "Cars: plates + client pagination",
    patch: {
      dataset: "cars",
      itemCount: 40,
      pagination: "client",
      pageSize: 6,
      showEmptyOption: true,
      menuLabelStyle: "car-plate",
      disableRule: "cars-old",
    },
  },
  {
    name: "foods-remote",
    label: "Foods: emoji + remote search (spicy off)",
    patch: {
      dataset: "foods",
      dataSource: "remote",
      searchOnInput: true,
      latency: 450,
      menuStartNodeStyle: "food-emoji",
      menuLabelStyle: "food-spicy",
      disableRule: "foods-spicy",
    },
  },
  {
    name: "cities-server",
    label: "Cities: server pagination (multi)",
    patch: {
      pagination: "server",
      pageSize: 5,
      itemCount: 23,
      multiple: true,
      maxSelection: 4,
      showEmptyOption: true,
    },
  },
  {
    name: "hydration",
    label: "Cities: pre-selected hydration (remote)",
    patch: {
      dataSource: "remote",
      searchOnInput: false,
      latency: 400,
    },
    persistedValue: "curitiba",
  },
  {
    name: "refresh-on-open",
    label: "Cities: refresh on open (cache bypass)",
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

export function applyListPreset(name: string): ListConfig {
  const preset = LIST_PRESETS.find((candidate) => candidate.name === name) ?? LIST_PRESETS[0];
  const dataset = preset.patch.dataset;
  const base =
    dataset && dataset !== DEFAULT_LIST_CONFIG.dataset
      ? { ...DEFAULT_LIST_CONFIG, ...datasetConfigDefaults(dataset) }
      : DEFAULT_LIST_CONFIG;
  return { ...base, preset: preset.name, ...preset.patch };
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
