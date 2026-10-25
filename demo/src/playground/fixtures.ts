import type { RemoteConfig } from "@/components/ui/combobox/types";

export type City = { code: string; displayName: string };
export type RegionRow = {
  code: string;
  name: string;
  parentCode?: string;
  children?: RegionRow[];
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const CITY_NAMES = [
  "Campinas",
  "São Paulo",
  "Miguelópolis",
  "Curitiba",
  "Porto Alegre",
  "Belo Horizonte",
  "Rio de Janeiro",
  "Recife",
  "Manaus",
  "Belém",
  "Goiânia",
  "Brasília",
];

/** Deterministic city fixture; `count` scales the dataset for pagination demos. */
export function makeCities(count: number): City[] {
  const total = Math.max(1, Math.min(count, 999));
  return Array.from({ length: total }, (_, index) => {
    const name = CITY_NAMES[index % CITY_NAMES.length];
    return {
      code: index < CITY_NAMES.length ? name.toLowerCase() : `${name.toLowerCase()}-${index}`,
      displayName: index < CITY_NAMES.length ? name : `${name} ${index}`,
    };
  });
}

export const REGIONS_FLAT: RegionRow[] = [
  { code: "GR", name: "Global", parentCode: "" },
  { code: "AM", name: "Americas", parentCode: "GR" },
  { code: "BR", name: "Brazil", parentCode: "AM" },
  { code: "SP", name: "São Paulo", parentCode: "BR" },
  { code: "SPE", name: "São Paulo City", parentCode: "SP" },
  { code: "PR", name: "Paraná", parentCode: "BR" },
  { code: "CUR", name: "Curitiba", parentCode: "PR" },
  { code: "AR", name: "Argentina", parentCode: "AM" },
  { code: "MZA", name: "Mendoza", parentCode: "AR" },
  { code: "EU", name: "Europe", parentCode: "GR" },
  { code: "PT", name: "Portugal", parentCode: "EU" },
  { code: "LIS", name: "Lisbon", parentCode: "PT" },
];

export const REGIONS_NESTED: RegionRow[] = [
  {
    code: "GR",
    name: "Global",
    children: [
      {
        code: "AM",
        name: "Americas",
        children: [
          {
            code: "BR",
            name: "Brazil",
            children: [
              {
                code: "SP",
                name: "São Paulo",
                children: [{ code: "SPE", name: "São Paulo City" }],
              },
              { code: "PR", name: "Paraná", children: [{ code: "CUR", name: "Curitiba" }] },
            ],
          },
          { code: "AR", name: "Argentina", children: [{ code: "MZA", name: "Mendoza" }] },
        ],
      },
      {
        code: "EU",
        name: "Europe",
        children: [{ code: "PT", name: "Portugal", children: [{ code: "LIS", name: "Lisbon" }] }],
      },
    ],
  },
];

export interface CityRemoteOptions {
  identifier?: string;
  searchOnInput: boolean;
  minimumSearchLength?: number;
  refreshOnOpen?: boolean;
  latency: number;
  /** Fails from the Nth call onwards (0 disables simulated failure). */
  failAfterCalls: number;
  count: number;
}

export function createCityRemote(options: CityRemoteOptions): RemoteConfig<City> {
  const pool = makeCities(options.count);
  let calls = 0;
  return {
    identifier: options.identifier ?? "playground-cities",
    searchOnInput: options.searchOnInput,
    minimumSearchLength: options.minimumSearchLength,
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
      return pool.filter((city) => city.displayName.toLowerCase().includes(query));
    },
  };
}

/** Single-item remote whose label shows how many times it refetched; pairs with refreshOnOpen. */
export function createTickingRemote(
  latency: number,
  failAfterCalls: number,
): RemoteConfig<City> {
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
      return [{ code: "tick", displayName: `Fetched ${calls} time(s) on open` }];
    },
  };
}
