import type { RemoteConfig } from "@/components/ui/combobox/types";

/*
  Playground fixtures: several small domains (people, plugins, cars, cities,
  foods) with the same normalized row shape so node styles can mix and match.
  Every generator is deterministic and parametric so the itemCount slider,
  pagination and the simulated remote all reuse them.
*/

export type PersonRole = "admin" | "manager" | "user";

/**
 * Normalized row: `id` is the option value on list datasets (`code` for
 * cities), `name` is the title, and every optional field feeds one node style
 * or disabled rule.
 */
export type PlaygroundRow = {
  id?: string;
  name: string;
  email?: string;
  role?: PersonRole;
  isOnline?: boolean;
  version?: string;
  description?: string;
  iconKey?: "layout" | "chart" | "sparkles";
  isNew?: boolean;
  category?: "Core" | "Data" | "Legacy";
  brand?: string;
  year?: number;
  plate?: string;
  code?: string;
  stateName?: string;
  kind?: string;
  spicy?: boolean;
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ===== people ===== */

const PEOPLE_SEED: Array<{ name: string; role: PersonRole; isOnline: boolean }> = [
  { name: "Ana Costa", role: "user", isOnline: true },
  { name: "Bruno Souza", role: "manager", isOnline: false },
  { name: "Carla Dias", role: "admin", isOnline: true },
  { name: "Diego Lima", role: "user", isOnline: true },
  { name: "Elisa Ramos", role: "manager", isOnline: true },
  { name: "Fábio Nunes", role: "user", isOnline: false },
  { name: "Gilda Prado", role: "admin", isOnline: true },
  { name: "Heitor Melo", role: "user", isOnline: true },
  { name: "Iris Campos", role: "manager", isOnline: false },
  { name: "João Braga", role: "user", isOnline: true },
  { name: "Kelly Rocha", role: "admin", isOnline: false },
  { name: "Lucas Pires", role: "user", isOnline: true },
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function makePeople(count: number): PlaygroundRow[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const seed = PEOPLE_SEED[index % PEOPLE_SEED.length];
    return {
      id: slug(seed.name),
      name: index < PEOPLE_SEED.length ? seed.name : `${seed.name} ${index}`,
      email: `${slug(seed.name).replace(/-/g, ".")}@example.com`,
      role: seed.role,
      isOnline: seed.isOnline,
    };
  });
}

/* ===== plugins ===== */

const PLUGIN_SEED: Array<{
  name: string;
  version: string;
  description: string;
  iconKey: PlaygroundRow["iconKey"];
  isNew: boolean;
  category: PlaygroundRow["category"];
}> = [
  { name: "Charts", version: "2.4.1", description: "Dashboards, plots and gauges", iconKey: "chart", isNew: true, category: "Core" },
  { name: "Scheduler", version: "1.9.0", description: "Cron-like job scheduling", iconKey: "layout", isNew: false, category: "Core" },
  { name: "Sparks", version: "0.8.3", description: "Inline sparkline widgets", iconKey: "sparkles", isNew: true, category: "Data" },
  { name: "Exports", version: "3.1.2", description: "CSV, XLSX and PDF exports", iconKey: "layout", isNew: false, category: "Data" },
  { name: "Importer", version: "1.2.7", description: "Delimited file ingestion", iconKey: "chart", isNew: false, category: "Legacy" },
  { name: "Notifier", version: "2.0.0", description: "Webhook and email alerts", iconKey: "sparkles", isNew: true, category: "Core" },
  { name: "Explorer", version: "1.4.5", description: "Saved queries browser", iconKey: "chart", isNew: false, category: "Data" },
  { name: "Forms", version: "2.2.9", description: "Dynamic form rendering", iconKey: "layout", isNew: false, category: "Core" },
  { name: "Legacy exporter", version: "0.6.1", description: "Old XML reporting", iconKey: "layout", isNew: false, category: "Legacy" },
  { name: "Access", version: "1.1.0", description: "Row-level permissions", iconKey: "sparkles", isNew: true, category: "Core" },
  { name: "Tenant switch", version: "1.0.4", description: "Multi-tenant helpers", iconKey: "layout", isNew: false, category: "Data" },
  { name: "Audit", version: "2.9.0", description: "Change history trails", iconKey: "chart", isNew: false, category: "Legacy" },
];

export function makePlugins(count: number): PlaygroundRow[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const seed = PLUGIN_SEED[index % PLUGIN_SEED.length];
    const name = index < PLUGIN_SEED.length ? seed.name : `${seed.name} ${index}`;
    return {
      id: slug(name),
      name,
      version: seed.version,
      description: seed.description,
      iconKey: seed.iconKey,
      isNew: seed.isNew,
      category: seed.category,
    };
  });
}

/* ===== cars ===== */

const CAR_SEED: Array<{ name: string; brand: string; year: number; plate: string }> = [
  { name: "Model 3", brand: "Tesla", year: 2024, plate: "ABC-1D23" },
  { name: "Corolla", brand: "Toyota", year: 2022, plate: "BRC-7E01" },
  { name: "Civic", brand: "Honda", year: 2019, plate: "CDE-3F44" },
  { name: "Gol", brand: "Volkswagen", year: 2013, plate: "DEF-9G55" },
  { name: "Onix", brand: "Chevrolet", year: 2021, plate: "EFG-1H66" },
  { name: "HB20", brand: "Hyundai", year: 2016, plate: "FGH-5J77" },
  { name: "Strada", brand: "Fiat", year: 2014, plate: "GHI-8K88" },
  { name: "Hilux", brand: "Toyota", year: 2024, plate: "HIJ-2L99" },
  { name: "F2000", brand: "Scania", year: 2018, plate: "IJK-4M10" },
  { name: "Compass", brand: "Jeep", year: 2023, plate: "JKL-6N11" },
];

export function makeCars(count: number): PlaygroundRow[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const seed = CAR_SEED[index % CAR_SEED.length];
    const name = index < CAR_SEED.length ? seed.name : `${seed.brand} ${seed.name} ${index}`;
    return {
      id: `${slug(seed.brand)}-${slug(seed.name)}`,
      name,
      brand: seed.brand,
      year: index < CAR_SEED.length ? seed.year : 2010,
      plate: seed.plate,
    };
  });
}

/* ===== cities ===== */

const CITY_NAMES = [
  "Campinas",
  "São Paulo",
  "Curitiba",
  "Porto Alegre",
  "Belo Horizonte",
  "Rio de Janeiro",
  "Recife",
  "Manaus",
  "Belém",
  "Goiânia",
  "Brasília",
  "Fortaleza",
];

const CITY_STATES = ["SP", "SP", "PR", "RS", "MG", "RJ", "PE", "AM", "PA", "GO", "DF", "CE"];

// Kept the old name: tests and presets reference the cities generator via datasets.
export function makeCities(count: number): PlaygroundRow[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const name = CITY_NAMES[index % CITY_NAMES.length];
    return {
      id: index < CITY_NAMES.length ? slug(name) : `${slug(name)}-${index}`,
      name,
      code: index < CITY_NAMES.length ? slug(name) : `${slug(name)}-${index}`,
      stateName: CITY_STATES[index % CITY_STATES.length],
    };
  });
}

/* ===== foods ===== */

const FOOD_SEED: Array<{ name: string; kind: "dish" | "dessert" | "drink"; spicy: boolean }> = [
  { name: "Feijoada", kind: "dish", spicy: false },
  { name: "Moqueca", kind: "dish", spicy: true },
  { name: "Pastel", kind: "dish", spicy: false },
  { name: "Pudim", kind: "dessert", spicy: false },
  { name: "Cocada", kind: "dessert", spicy: false },
  { name: "Vatapá", kind: "dish", spicy: true },
  { name: "Guaraná", kind: "drink", spicy: false },
  { name: "Caldo de cana", kind: "drink", spicy: false },
  { name: "Açaí", kind: "dessert", spicy: false },
  { name: "Acarajé", kind: "dish", spicy: true },
  { name: "Brigadeiro", kind: "dessert", spicy: false },
  { name: "Coxinha", kind: "dish", spicy: false },
];

export function makeFoods(count: number): PlaygroundRow[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const seed = FOOD_SEED[index % FOOD_SEED.length];
    return {
      id: slug(seed.name),
      name: seed.name,
      kind: seed.kind,
      spicy: seed.spicy,
    };
  });
}

/* ===== simulated remote ===== */

export interface RowRemoteOptions {
  identifier?: string;
  searchOnInput: boolean;
  refreshOnOpen?: boolean;
  latency: number;
  /** Fails from the Nth call onwards (0 disables simulated failure). */
  failAfterCalls: number;
  count: number;
  searchTextKeys: string[];
}

export function makeDatasetRemote(
  source: (count: number) => PlaygroundRow[],
  options: RowRemoteOptions,
): RemoteConfig<PlaygroundRow> {
  const pool = source(options.count);
  let calls = 0;
  return {
    identifier: options.identifier ?? "playground-rows",
    searchOnInput: options.searchOnInput,
    refreshOnOpen: options.refreshOnOpen,
    disableLazyFetch: options.searchOnInput ? undefined : true,
    optionsFn: async (searchValue?: string, signal?: AbortSignal) => {
      calls += 1;
      await delay(options.latency);
      if (options.failAfterCalls > 0 && calls >= options.failAfterCalls) {
        throw { status: 403 };
      }
      if (signal?.aborted) {
        throw new DOMException("The request was aborted.", "AbortError");
      }
      const query = (searchValue ?? "").trim().toLowerCase();
      if (!query) return pool;
      return pool.filter((row) =>
        options.searchTextKeys.some((key) =>
          String(row[key as keyof PlaygroundRow] ?? "")
            .toLowerCase()
            .includes(query),
        ),
      );
    },
  };
}

/** Single-item remote whose label shows how many times it refetched; pairs with refreshOnOpen. */
export function createTickingRemote(
  latency: number,
  failAfterCalls: number,
): RemoteConfig<PlaygroundRow> {
  let calls = 0;
  return {
    identifier: "playground-ticker",
    refreshOnOpen: true,
    optionsFn: async (_searchValue?: string, signal?: AbortSignal) => {
      calls += 1;
      await delay(latency);
      if (failAfterCalls > 0 && calls >= failAfterCalls) throw { status: 403 };
      if (signal?.aborted) {
        throw new DOMException("The request was aborted.", "AbortError");
      }
      return [{ id: "tick", name: `Fetched ${calls} time(s) on open`, code: "tick" }];
    },
  };
}
