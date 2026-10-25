import { useCallback, useEffect, useState } from "react";

import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type { RemoteConfig } from "@/components/ui/combobox/types";

type User = { id: number; name: string; email: string };

const users: User[] = [
  { id: 1, name: "Ada Lovelace", email: "ada@lovelace.dev" },
  { id: 2, name: "Alan Turing", email: "alan@turing.dev" },
  { id: 3, name: "Grace Hopper", email: "grace@hopper.dev" },
  { id: 4, name: "Edsger Dijkstra", email: "edsger@dijkstra.dev" },
  { id: 5, name: "Donald Knuth", email: "donald@knuth.dev" },
  { id: 6, name: "Barbara Liskov", email: "barbara@liskov.dev" },
  { id: 7, name: "John McCarthy", email: "john@mccarthy.dev" },
  { id: 8, name: "Margaret Hamilton", email: "margaret@hamilton.dev" },
];

const kinds = [
  { value: 1, label: "Venda" },
  { value: 2, label: "Bonificação" },
  { value: 3, label: "Devolução" },
];

const tables = Array.from({ length: 75 }, (_, index) => ({
  qualifiedName: `FURLAN.TABLE_${String(index).padStart(2, "0")}`,
  owner: "FURLAN",
  name: `TABLE_${String(index).padStart(2, "0")}`,
}));

const cities = [
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
].map((name) => ({ code: name.toLowerCase(), displayName: name }));

const regionRows = [
  { code: "BR", name: "Brazil", parentCode: "" },
  { code: "AR", name: "Argentina", parentCode: "" },
  { code: "SP", name: "São Paulo", parentCode: "BR" },
  { code: "PR", name: "Paraná", parentCode: "BR" },
  { code: "CUR", name: "Curitiba", parentCode: "PR" },
  { code: "SPE", name: "São Paulo City", parentCode: "SP" },
  { code: "MZA", name: "Mendoza", parentCode: "AR" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fakeCityRemote(failOnCall: number): RemoteConfig<(typeof cities)[number]> {
  let calls = 0;
  return {
    identifier: "demo-cities",
    searchOnInput: true,
    minimumSearchLength: 2,
    optionsFn: async (searchValue?: string, signal?: AbortSignal) => {
      calls += 1;
      await delay(400);
      if (failOnCall > 0 && calls >= failOnCall) throw { status: 403 };
      if (signal?.aborted) throw new DOMException("The request was aborted.", "AbortError");
      const query = (searchValue ?? "").trim().toLowerCase();
      if (!query) return [];
      return cities.filter((city) =>
        city.displayName.toLowerCase().includes(query),
      );
    },
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='border rounded-lg p-6 space-y-4 bg-card'>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{title}</h2>
        {description && <p className='text-sm text-muted-foreground'>{description}</p>}
      </div>
      <div className='space-y-3'>{children}</div>
    </section>
  );
}

function StateLine({ value }: { value: unknown }) {
  return <pre className='text-xs bg-muted text-muted-foreground rounded-md p-2 overflow-x-auto'>
    {JSON.stringify(value, null, 2)}
  </pre>;
}

function BasicList() {
  const [owner, setOwner] = useState<number | null>(null);
  return (
    <Section
      title='Basic list'
      description='Local options, search input, clear option and controlled value.'
    >
      <div className='max-w-96'>
        <Combobox
          label='Owner'
          searchInput
          showClearOption
          clearOptionLabel='Limpar seleção'
          options={users}
          menuItemConfig={{ value: "id", label: ["name", "email"], searchProperties: ["name"] }}
          onChange={(value) => setOwner((value ?? null) as number | null)}
        />
      </div>
      <StateLine value={owner} />
    </Section>
  );
}

function RemoteSearch() {
  const [city, setCity] = useState<{ code: string; displayName: string } | null>(null);
  const [fail, setFail] = useState(false);
  const remote = fakeCityRemote(fail ? 1 : 0);
  return (
    <Section
      title='Remote search (searchOnInput, min length, cache, abort)'
      description='Each keystroke after 2 chars hits the fake API. Identical searches hit the shared cache (no request). Reopen never refetches unless refreshOnOpen is set.'
    >
      <label className='flex items-center gap-2 text-sm'>
        <input type='checkbox' checked={fail} onChange={(e) => setFail(e.target.checked)} />
        Fail next request (shows remoteErrorMessage)
      </label>
      <div className='max-w-96'>
        <Combobox
          label='City'
          searchInput
          emptyMessage='Nenhuma cidade encontrada'
          remote={remote}
          menuItemConfig={{ value: "code", label: ["displayName"] }}
          onChange={(_, item) => setCity(Array.isArray(item) ? null : item)}
        />
      </div>
      <StateLine value={city} />
    </Section>
  );
}

function MultipleSelection() {
  const [selected, setSelected] = useState<number[]>([3]);
  const [limitHit, setLimitHit] = useState(false);
  return (
    <Section
      title='Multiple selection'
      description='maxSelection = 2 here; selecting a third fires onMaxSelectionReached.'
    >
      <div className='max-w-96'>
        <Combobox
          label='Kind'
          multiple
          fullWidth
          options={kinds}
          menuItemConfig={{ value: "value", label: ["label"] }}
          multipleConfig={{ maxSelection: 2, maxVisibleItems: 1 }}
          value={selected}
          onChange={(value) => setSelected((value ?? []) as number[])}
          onMaxSelectionReached={() => setLimitHit(true)}
        />
      </div>
      {limitHit && <p className='text-sm text-destructive'>Max selection reached!</p>}
      <StateLine value={selected} />
    </Section>
  );
}

function ClientPagination() {
  return (
    <Section
      title='Client pagination'
      description='75 items, pageSize 50: filters the full list, then slices.'
    >
      <div className='max-w-96'>
        <Combobox
          label='Root table'
          searchInput
          searchPlaceholder='Search table'
          options={tables}
          menuItemConfig={{
            value: "qualifiedName",
            label: ["qualifiedName"],
            searchProperties: ["qualifiedName", "owner", "name"],
          }}
          pagination={{ pageSize: 50, loadMoreLabel: "Load more tables" }}
        />
      </div>
    </Section>
  );
}

const serverItems = Array.from({ length: 23 }, (_, index) => ({
  code: `SRV-${String(index).padStart(2, "0")}`,
  name: `Server item ${index}`,
}));

function ServerPagination() {
  const pageSize = 5;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<(typeof serverItems)>(() =>
    serverItems.slice(0, pageSize),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = serverItems.filter((item) => item.name.toLowerCase().includes(query));
  const hasMore = (page + 1) * pageSize < filtered.length;

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    delay(350).then(() => {
      const next = page + 1;
      setPage(next);
      setItems(filtered.slice(0, (next + 1) * pageSize));
      setIsLoadingMore(false);
    });
  }, [page, filtered]);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    setItems(serverItems.slice(0, pageSize));
  }, []);

  return (
    <Section
      title='Server pagination'
      description='Search and next-page loading delegated to the caller.'
    >
      <div className='max-w-96'>
        <Combobox
          label='Product'
          searchInput
          searchPlaceholder='Search product'
          options={items}
          menuItemConfig={{ value: "code", label: ["code", "name"], searchProperties: ["name"] }}
          pagination={{
            mode: "server",
            pageSize,
            hasMore,
            isLoadingMore,
            onLoadMore: loadMore,
            onSearchChange,
          }}
        />
      </div>
      <StateLine value={{ search, page, hasMore }} />
    </Section>
  );
}

function TreeVariants() {
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  return (
    <Section
      title='Tree (flat data, cascading multi-select)'
      description='multi: checking a folder applies it and all descendants.'
    >
      <div className='max-w-96 space-y-4'>
        <ComboboxTree
          label='Single region'
          data={regionRows}
          flatParentKey='parentCode'
          required
          menuItemConfig={{ value: "code", label: ["name"] }}
          onChange={(value) => setSingle((value as string | null) ?? null)}
        />
        <ComboboxTree
          label='Regions (multi)'
          data={regionRows}
          flatParentKey='parentCode'
          multiple
          fullWidth
          menuItemConfig={{ value: "code", label: ["name"] }}
          onChange={(value) => setMulti(value as string[])}
        />
      </div>
      <StateLine value={{ single, multi }} />
    </Section>
  );
}

function States() {
  const [invalid, setInvalid] = useState("sale-order.edit");
  const permissions: { code: string; name: string }[] = [
    { code: "sale-order.edit", name: "Edit sale order" },
  ];
  return (
    <Section title='Disabled, error, clear button' description='Static presentation states.'>
      <div className='flex flex-wrap gap-4 items-start max-w-screen-md'>
        <Combobox
          label='Disabled'
          disabled
          options={users}
          menuItemConfig={{ value: "id", label: ["name"] }}
        />
        <Combobox
          label='Persistence error'
          showClearButton
          value={invalid}
          onChange={(value) => setInvalid((value ?? "") as string)}
          options={permissions}
          error
          menuItemConfig={{ value: "code", label: ["name"] }}
        />
      </div>
      <StateLine value={invalid} />
    </Section>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);
  return (
    <main className='min-h-screen p-8 max-w-3xl mx-auto space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-bold tracking-tight'>Advanced Combobox demo</h1>
        <p className='text-sm text-muted-foreground'>
          A demo installed straight from the registry with{" "}
          <code className='bg-muted rounded px-1 py-0.5 text-xs'>
            npx shadcn add https://fernaandojr.github.io/advanced-combobox/r/combobox.json
          </code>
          . Every field below holds the shared remote cache experiment and the same tree / list
          engine as the source component.
        </p>
      </header>
      <BasicList />
      <RemoteSearch />
      <MultipleSelection />
      <ClientPagination />
      <ServerPagination />
      <TreeVariants />
      <States />
    </main>
  );
}
