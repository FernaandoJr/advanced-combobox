import { useCallback, useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, MoonIcon, SunIcon } from "lucide-react";

import { ThemeProvider, useTheme } from "@/components/theme-provider";

import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type { RemoteConfig } from "@/components/ui/combobox/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

const serverItems = Array.from({ length: 23 }, (_, index) => ({
  code: `SRV-${String(index).padStart(2, "0")}`,
  name: `Server item ${index}`,
}));

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
      return cities.filter((city) => city.displayName.toLowerCase().includes(query));
    },
  };
}

function DemoCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className='gap-4 rounded-lg pt-6'>
      <CardHeader className='gap-1.5'>
        <CardTitle className='text-base font-medium'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className='border-t bg-muted/40 rounded-b-lg py-3'>{footer}</CardFooter>}
    </Card>
  );
}

function ThemeToggle() {
  const { setTheme } = useTheme();
  return (
    <Button
      variant='ghost'
      size='icon'
      title='Toggle theme'
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      }}
    >
      <SunIcon className='hidden dark:block' />
      <MoonIcon className='dark:hidden' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}

function StateLine({ label, value }: { label: string; value: unknown }) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-3 py-2'>
      <span className='text-xs font-medium text-muted-foreground uppercase'>{label}</span>
      <code className='font-mono text-xs text-foreground max-w-[70%] truncate'>
        {value === null || value === undefined ? "null" : JSON.stringify(value)}
      </code>
    </div>
  );
}

function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command =
    "npx shadcn add https://fernaandojr.github.io/advanced-combobox/r/combobox.json";
  const copy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [command]);
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='font-mono text-xs'
      onClick={copy}
    >
      {copied ? <CheckIcon className='text-green-600' /> : <CopyIcon />}
      {copied ? "copied" : "npx shadcn add"}
    </Button>
  );
}

function BasicList() {
  const [owner, setOwner] = useState<number | null>(null);
  return (
    <DemoCard
      title='Basic list'
      description='Local options, in-dropdown search, clear option and controlled value. Type is inferred from the options array, no generics needed.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='Owner'
          searchInput
          showClearOption
          clearOptionLabel='Limpar seleção'
          placeholder='Select an owner'
          options={users}
          menuItemConfig={{ value: "id", label: ["name", "email"], searchProperties: ["name"] }}
          onChange={(value) => setOwner((value ?? null) as number | null)}
        />
        <StateLine label='ownerId' value={owner} />
      </div>
    </DemoCard>
  );
}

function RemoteSearch() {
  const [city, setCity] = useState<{ code: string; displayName: string } | null>(null);
  const [fail, setFail] = useState(false);
  const remote = fakeCityRemote(fail ? 1 : 0);
  return (
    <DemoCard
      title='Remote options'
      description='searchOnInput delegates every keystroke to the API once the search passes 2 characters. Identical searches resolve from the shared cache without a request; reopening never refetches unless refreshOnOpen is set.'
      footer={
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          <input
            type='checkbox'
            className='size-3.5 accent-foreground'
            checked={fail}
            onChange={(e) => setFail(e.target.checked)}
          />
          Fail the next request and show the error state
        </label>
      }
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='City'
          searchInput
          emptyMessage='Nenhuma cidade encontrada'
          remote={remote}
          menuItemConfig={{ value: "code", label: ["displayName"] }}
          onChange={(_, item) => setCity(Array.isArray(item) ? null : item)}
        />
        <StateLine label='selected' value={city} />
      </div>
    </DemoCard>
  );
}

function MultipleSelection() {
  const [selected, setSelected] = useState<number[]>([3]);
  const [limitHit, setLimitHit] = useState(false);
  return (
    <DemoCard
      title='Multiple selection'
      description='Checkbox rows with maxSelection = 2 and maxVisibleItems = 1 so the trigger collapses into a +N overflow. Selecting a third fires onMaxSelectionReached.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
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
        {limitHit && <Alert variant='destructive'><AlertTitle>Limit reached</AlertTitle><AlertDescription>The second kind is the last selectable option.</AlertDescription></Alert>}
        <StateLine label='values' value={selected} />
      </div>
    </DemoCard>
  );
}

function ClientPagination() {
  const [page, setPage] = useState(1);
  return (
    <DemoCard
      title='Client pagination'
      description='75 items with pageSize 50. The search filters the full list before the visible slice applies.'
      footer={<span className='text-xs text-muted-foreground'>Current page: {page}</span>}
    >
      <div className='grid gap-4 sm:max-w-sm'>
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
          onSelectedItemResolved={() => setPage((p) => p + 1)}
        />
      </div>
    </DemoCard>
  );
}

function ServerPagination() {
  const pageSize = 5;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<(typeof serverItems)[]>(() => [serverItems.slice(0, pageSize)]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = serverItems.filter((item) => item.name.toLowerCase().includes(query));
  const hasMore = (page + 1) * pageSize < filtered.length;

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    delay(350).then(() => {
      const next = page + 1;
      setPage(next);
      setItems((pages) => [...pages, filtered.slice(next * pageSize, (next + 1) * pageSize)]);
      setIsLoadingMore(false);
    });
  }, [page, filtered]);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    setItems([serverItems.slice(0, pageSize)]);
  }, []);

  return (
    <DemoCard
      title='Server pagination'
      description='With mode: "server" the component delegates search and next-page loading to the caller; options are whatever the caller renders per page.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='Product'
          searchInput
          searchPlaceholder='Search product'
          options={items.flat()}
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
        <StateLine label='request state' value={{ search, page, hasMore }} />
      </div>
    </DemoCard>
  );
}

function TreeVariants() {
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  return (
    <DemoCard
      title='Tree'
      description='Flat rows joined by flatParentKey. Multi-select cascades: checking a folder applies it and every descendant.'
    >
      <div className='grid gap-6 sm:max-w-sm'>
        <ComboboxTree
          label='Single region'
          data={regionRows}
          flatParentKey='parentCode'
          required
          menuItemConfig={{ value: "code", label: ["name"] }}
          onChange={(value) => setSingle((value as string | null) ?? null)}
        />
        <StateLine label='single' value={single} />
        <Separator />
        <ComboboxTree
          label='Regions (multi)'
          data={regionRows}
          flatParentKey='parentCode'
          multiple
          fullWidth
          menuItemConfig={{ value: "code", label: ["name"] }}
          onChange={(value) => setMulti(value as string[])}
        />
        <StateLine label='multi' value={multi} />
      </div>
    </DemoCard>
  );
}

function States() {
  const [invalid, setInvalid] = useState("sale-order.edit");
  const permissions: { code: string; name: string }[] = [
    { code: "sale-order.edit", name: "Edit sale order" },
  ];
  return (
    <DemoCard title='Presentation states' description='Disabled, error and inline clear button.'>
      <div className='flex flex-wrap items-start gap-6'>
        <Combobox
          disabled
          label='Disabled'
          options={users}
          menuItemConfig={{ value: "id", label: ["name"] }}
        />
        <Combobox
          label='Error state'
          showClearButton
          value={invalid}
          onChange={(value) => setInvalid((value ?? "") as string)}
          options={permissions}
          error
          menuItemConfig={{ value: "code", label: ["name"] }}
        />
      </div>
    </DemoCard>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme='system'>
      <div className='bg-background text-foreground min-h-screen'>
      <div className='border-b'>
        <div className='mx-auto flex h-14 max-w-4xl items-center justify-between px-6'>
          <a href='#top' className='flex items-center gap-2 font-medium text-sm'>
            Advanced Combobox
          </a>
          <div className='flex items-center gap-1.5'>
            <Badge variant='secondary'>shadcn registry</Badge>
            <Badge variant='outline'>MIT</Badge>
            <ThemeToggle />
            <Button asChild variant='ghost' size='icon'>
              <a
                href='https://github.com/FernaandoJr/advanced-combobox'
                target='_blank'
                rel='noreferrer'
              >
                <ExternalLinkIcon />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <main id='top' className='mx-auto max-w-4xl space-y-10 px-6 py-12'>
        <header className='space-y-4'>
          <h1 className='scroll-m-20 text-4xl font-semibold tracking-tight'>
            Advanced Combobox
          </h1>
          <p className='leading-7 text-muted-foreground max-w-2xl'>
            List and tree combobox for the shadcn registry: remote options with a
            deduplicated shared cache, server or client pagination, multi-select and
            cascading trees. Zero runtime dependencies beyond React; every string is a
            prop with a sensible default.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <InstallCommand />
            <Button asChild variant='secondary' size='sm'>
              <a href='https://github.com/FernaandoJr/advanced-combobox' target='_blank' rel='noreferrer'>
                Repository
              </a>
            </Button>
          </div>
        </header>

        <Separator />

        <div className='grid gap-6'>
          <BasicList />
          <RemoteSearch />
          <MultipleSelection />
          <ClientPagination />
          <ServerPagination />
          <TreeVariants />
          <States />
        </div>

        <footer className='border-t pt-6 pb-4'>
          <p className='text-xs text-muted-foreground'>
            Every component on this page was installed from the published registry with{" "}
            <code className='bg-muted rounded px-1 py-0.5'>
              npx shadcn add
            </code>{" "}
            and runs on the shared remote cache engine of the item.
          </p>
        </footer>
      </main>
    </div>
    </ThemeProvider>
  );
}
