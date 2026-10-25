import type { PlaygroundRow } from "./fixtures";
import {
  makeCars,
  makeCities,
  makeFoods,
  makePeople,
  makePlugins,
} from "./fixtures";

/*
  Dataset specs. Each spec describes the fixture domain the playground plays
  with: which keys are selectable as menu label parts, which keys feed the
  simulated remote search, how options can be disabled, and which honorific
  node styles (see node-styles.ts) make sense for it.
*/

export type DatasetKey = "cities" | "people" | "plugins" | "cars" | "foods";

export interface DisabledRule {
  key: string;
  label: string;
  predicate: (item: PlaygroundRow) => boolean;
  /** Arrow function snippet emitted by the codegen. */
  code: string;
}

export interface DatasetSpec {
  key: DatasetKey;
  label: string;
  /** Keys of the row used as the Combobox `value` (emitted into the codegen). */
  valueKey: "code" | "id";
  /** Menu label parts offered in the Customize chips row. */
  labelKeyOptions: string[];
  defaultLabelKeys: string[];
  /** Keys used by `searchProperties` when the user opts into explicit search. */
  searchTextKeys: string[];
  /** Keys offered as selectedItemConfig.label override. */
  selectedLabelKeyOptions: string[];
  /** Keys the "two-line" style renders under the title, or null when unsupported. */
  secondaryLine?: { key: string; render: (item: PlaygroundRow) => string };
  make: (count: number) => PlaygroundRow[];
  /** Value prop emitted by the codegen. */
  valueCode: string;
  /** TypeScript interface + data source emitted by the codegen. */
  typeName: string;
  variableName: string;
  interfaceCode: string;
  /** Serialized row fields for the copied data array, in this field order. */
  rowFields: string[];
  /** Default texts written into the config when this dataset is selected. */
  screen: {
    label: string;
    placeholder: string;
    searchPlaceholder: string;
    empty: string;
    loading: string;
    remoteError: string;
  };
}

const PEOPLE_RULES: DisabledRule[] = [
  {
    key: "people-offline",
    label: "Offline is disabled",
    predicate: (item) => item.isOnline === false,
    code: `(item) => item.isOnline === false`,
  },
];

const PLUGIN_RULES: DisabledRule[] = [
  {
    key: "plugins-legacy",
    label: "Legacy is disabled",
    predicate: (item) => item.category === "Legacy",
    code: `(item) => item.category === "Legacy"`,
  },
];

const CAR_RULES: DisabledRule[] = [
  {
    key: "cars-old",
    label: "Pre-2015 is disabled",
    predicate: (item) => (item.year ?? 3000) < 2015,
    code: `(item) => item.year < 2015`,
  },
];

const FOOD_RULES: DisabledRule[] = [
  {
    key: "foods-spicy",
    label: "Spicy is disabled",
    predicate: (item) => item.spicy === true,
    code: `(item) => item.spicy === true`,
  },
];

const PEOPLE_SPEC: DatasetSpec = {
  key: "people",
  label: "People",
  valueKey: "id",
  labelKeyOptions: ["name", "email", "role"],
  defaultLabelKeys: ["name", "email"],
  searchTextKeys: ["name", "email"],
  selectedLabelKeyOptions: ["name", "email", "role"],
  make: makePeople,
  valueCode: `value: "id"`,
  typeName: "PersonRow",
  variableName: "people",
  interfaceCode: [
    `interface PersonRow {`,
    `  id: string;`,
    `  name: string;`,
    `  email: string;`,
    `  role: "admin" | "manager" | "user";`,
    `  isOnline: boolean;`,
    `}`,
  ].join("\n"),
  rowFields: ["id", "name", "email", "role", "isOnline"],
  screen: {
    label: "People",
    placeholder: "Select a person",
    searchPlaceholder: "Search people",
    empty: "No people found",
    loading: "Loading people...",
    remoteError: "Could not load the people.",
  },
};

const PLUGINS_SPEC: DatasetSpec = {
  key: "plugins",
  label: "Plugins",
  valueKey: "id",
  labelKeyOptions: ["name", "version", "category"],
  defaultLabelKeys: ["name"],
  searchTextKeys: ["name", "description"],
  selectedLabelKeyOptions: ["name", "version"],
  secondaryLine: {
    key: "description",
    render: (item) => item.description ?? item.version ?? "",
  },
  make: makePlugins,
  valueCode: `value: "id"`,
  typeName: "PluginRow",
  variableName: "plugins",
  interfaceCode: [
    `type PluginRow = {`,
    `  id: string;`,
    `  name: string;`,
    `  version: string;`,
    `  description: string;`,
    `  iconKey: "layout" | "chart" | "sparkles";`,
    `  isNew: boolean;`,
    `  category: "Core" | "Data" | "Legacy";`,
    `};`,
  ].join("\n"),
  rowFields: ["id", "name", "version", "description", "iconKey", "isNew", "category"],
  screen: {
    label: "Plugins",
    placeholder: "Select a plugin",
    searchPlaceholder: "Search plugins",
    empty: "No plugins found",
    loading: "Loading plugins...",
    remoteError: "Could not load the plugins.",
  },
};

const CARS_SPEC: DatasetSpec = {
  key: "cars",
  label: "Cars",
  valueKey: "id",
  labelKeyOptions: ["name", "brand", "year"],
  defaultLabelKeys: ["brand", "name"],
  searchTextKeys: ["name", "brand", "plate"],
  selectedLabelKeyOptions: ["name", "brand", "year"],
  make: makeCars,
  valueCode: `value: "id"`,
  typeName: "CarRow",
  variableName: "cars",
  interfaceCode: [
    `interface CarRow {`,
    `  id: string;`,
    `  name: string;`,
    `  brand: string;`,
    `  year: number;`,
    `  plate: string;`,
    `}`,
  ].join("\n"),
  rowFields: ["id", "name", "brand", "year", "plate"],
  screen: {
    label: "Cars",
    placeholder: "Select a car",
    searchPlaceholder: "Search cars",
    empty: "No cars found",
    loading: "Loading cars...",
    remoteError: "Could not load the cars.",
  },
};

const CITIES_SPEC: DatasetSpec = {
  key: "cities",
  label: "Cities",
  valueKey: "code",
  labelKeyOptions: ["name", "code", "stateName"],
  defaultLabelKeys: ["name", "code"],
  searchTextKeys: ["name", "code"],
  selectedLabelKeyOptions: ["name", "code", "stateName"],
  make: makeCities,
  valueCode: `value: "code"`,
  typeName: "CityRow",
  variableName: "cities",
  interfaceCode: [
    `interface CityRow {`,
    `  id: string;`,
    `  code: string;`,
    `  name: string;`,
    `  stateName: string;`,
    `}`,
  ].join("\n"),
  rowFields: ["id", "code", "name", "stateName"],
  screen: {
    label: "City",
    placeholder: "Select a city",
    searchPlaceholder: "Search cities",
    empty: "No cities found",
    loading: "Loading cities...",
    remoteError: "Could not load the cities.",
  },
};

const FOODS_SPEC: DatasetSpec = {
  key: "foods",
  label: "Foods",
  valueKey: "id",
  labelKeyOptions: ["name", "kind"],
  defaultLabelKeys: ["name"],
  searchTextKeys: ["name", "kind"],
  selectedLabelKeyOptions: ["name", "kind"],
  make: makeFoods,
  valueCode: `value: "id"`,
  typeName: "FoodRow",
  variableName: "foods",
  interfaceCode: [
    `interface FoodRow {`,
    `  id: string;`,
    `  name: string;`,
    `  kind: "dish" | "dessert" | "drink";`,
    `  spicy: boolean;`,
    `}`,
  ].join("\n"),
  rowFields: ["id", "name", "kind", "spicy"],
  screen: {
    label: "Foods",
    placeholder: "Select a food",
    searchPlaceholder: "Search foods",
    empty: "No foods found",
    loading: "Loading foods...",
    remoteError: "Could not load the foods.",
  },
};

export const DATASETS: DatasetSpec[] = [CITIES_SPEC, PEOPLE_SPEC, PLUGINS_SPEC, CARS_SPEC, FOODS_SPEC];

export function getDataset(key: string): DatasetSpec {
  return DATASETS.find((dataset) => dataset.key === key) ?? DATASETS[0];
}

export function getDatasetDisableRules(key: string): DisabledRule[] {
  switch (key) {
    case "people":
      return PEOPLE_RULES;
    case "plugins":
      return PLUGIN_RULES;
    case "cars":
      return CAR_RULES;
    case "foods":
      return FOOD_RULES;
    default:
      return [];
  }
}

/* playground filter over rows: the keys the dataset marks as searchable */
export function rowMatchesQuery(row: PlaygroundRow, searchTextKeys: string[], query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return searchTextKeys.some((key) =>
    String(row[key as keyof PlaygroundRow] ?? "")
      .toLowerCase()
      .includes(needle),
  );
}

/** Config patch applied when the playground switches dataset: contextual texts, clean styles. */
export function datasetConfigDefaults(key: string) {
  const spec = getDataset(key);
  return {
    dataset: spec.key,
    menuLabelKeys: [...spec.defaultLabelKeys],
    searchRule: "label" as const,
    disableRule: "none",
    menuLabelStyle: "none",
    menuStartNodeStyle: "none",
    selectedLabelKeys: [],
    selectedLabelStyle: "none",
    selectedStartNodeStyle: "none",
    label: spec.screen.label,
    placeholder: spec.screen.placeholder,
    searchPlaceholder: spec.screen.searchPlaceholder,
    emptyMessage: spec.screen.empty,
    loadingMessage: spec.screen.loading,
    remoteErrorMessage: spec.screen.remoteError,
  };
}
