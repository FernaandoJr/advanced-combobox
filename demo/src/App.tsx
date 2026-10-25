import { useCallback, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, MoonIcon, SunIcon } from "lucide-react";

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type { RemoteConfig } from "@/components/ui/combobox/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const tools = [
  { code: "pg", name: "PostgreSQL", kind: "database", deprecated: false },
  { code: "my", name: "MySQL", kind: "database", deprecated: false },
  { code: "rd", name: "Redis", kind: "cache", deprecated: false },
  { code: "mc", name: "MemcacheD", kind: "cache", deprecated: true },
  { code: "kf", name: "Kafka", kind: "stream", deprecated: false },
  { code: "rb", name: "RabbitMQ", kind: "stream", deprecated: true },
];

const serverItems = Array.from({ length: 23 }, (_, index) => ({
  code: `SRV-${String(index).padStart(2, "0")}`,
  name: `Server item ${index}`,
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fakeCityRemote(failOnCall: number, searchOnInput: boolean): RemoteConfig<(typeof cities)[number]> {
  let calls = 0;
  return {
    identifier: "demo-cities",
    searchOnInput,
    minimumSearchLength: 2,
    disableLazyFetch: !searchOnInput,
    optionsFn: async (searchValue?: string, signal?: AbortSignal) => {
      calls += 1;
      await delay(400);
      if (failOnCall > 0 && calls >= failOnCall) throw { status: 403 };
      if (signal?.aborted) throw new DOMException("The request was aborted.", "AbortError");
      const query = (searchValue ?? "").trim().toLowerCase();
      if (!query) return cities;
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

function StateLine({ label, value }: { label: string; value: unknown }) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-md border bg-muted/40 px-3 py-2'>
      <span className='text-xs text-muted-foreground font-medium uppercase'>{label}</span>
      <code className='font-mono text-xs text-foreground max-w-[70%] truncate'>
        {value === null || value === undefined ? "null" : JSON.stringify(value)}
      </code>
    </div>
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

function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [command]);
  return (
    <Button type='button' variant='outline' size='sm' className='font-mono text-xs' onClick={copy}>
      {copied ? <CheckIcon className='text-green-600' /> : <CopyIcon />}
      {copied ? "copied" : command}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Playground                                                          */
/* ------------------------------------------------------------------ */

type PlaygroundConfig = {
  dataSource: "local" | "remote";
  multiple: boolean;
  searchInput: boolean;
  fullWidth: boolean;
  disabled: boolean;
  error: boolean;
  required: boolean;
  showClearOption: boolean;
  showClearButton: boolean;
  minimumSearchLength: number;
  refreshOnOpen: boolean;
  pagination: boolean;
  pageSize: number;
  maxVisibleItems: "auto" | "1" | "2";
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  loadingMessage: string;
  remoteErrorMessage: string;
  minimumSearchMessage: string;
  clearOptionLabel: string;
  clearButtonLabel: string;
  loadMoreLabel: string;
};

const initialPlayground: PlaygroundConfig = {
  dataSource: "local",
  multiple: false,
  searchInput: true,
  fullWidth: true,
  disabled: false,
  error: false,
  required: false,
  showClearOption: false,
  showClearButton: false,
  minimumSearchLength: 2,
  refreshOnOpen: false,
  pagination: false,
  pageSize: 3,
  maxVisibleItems: "auto",
  label: "City",
  placeholder: "Select...",
  searchPlaceholder: "Search...",
  emptyMessage: "No results found",
  loadingMessage: "Loading...",
  remoteErrorMessage: "Could not load the options.",
  minimumSearchMessage: "Type at least 2 characters to search",
  clearOptionLabel: "Clear",
  clearButtonLabel: "Clear selection",
  loadMoreLabel: "Load more",
};

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Label className='flex items-center justify-between gap-2 text-sm font-normal'>
      <span className='text-muted-foreground'>{label}</span>
      <input
        type='checkbox'
        className='size-4 accent-foreground'
        checked={checked}
        onChange={(event) => onChange(Boolean(event.target.checked))}
      />
    </Label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='grid gap-1'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className='h-8 text-xs' />
    </div>
  );
}

function ConfigGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='space-y-2.5'>
      <Label className='text-xs font-semibold tracking-wide uppercase'>{title}</Label>
      {children}
    </div>
  );
}

function PlaygroundCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);
  return (
    <div className='relative bg-muted/60 w-full rounded-md p-3 pr-24 dark:bg-muted/20'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='absolute top-2 right-2 h-7 font-mono text-xs'
        onClick={copy}
      >
        {copied ? <CheckIcon className='text-green-600' /> : <CopyIcon />}
        {copied ? "copied" : "copy"}
      </Button>
      <pre className='font-mono text-xs leading-relaxed overflow-x-auto text-foreground/90 whitespace-pre'>
        {code}
      </pre>
    </div>
  );
}

function Playground() {
  const [cfg, setCfg] = useState<PlaygroundConfig>(initialPlayground);
  const set = <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) =>
    setCfg((current) => ({ ...current, [key]: value }));

  const [singleValue, setSingleValue] = useState<string | null>(null);
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<unknown>(null);

  const isLocal = cfg.dataSource === "local";
  const isMulti = cfg.multiple;

  const remote: RemoteConfig<(typeof cities)[number]> | undefined = isLocal
    ? undefined
    : {
        identifier: "playground-cities",
        searchOnInput: true,
        minimumSearchLength: cfg.minimumSearchLength,
        refreshOnOpen: cfg.refreshOnOpen,
        optionsFn: async (searchValue?: string, signal?: AbortSignal) => {
          await delay(350);
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          const query = (searchValue ?? "").trim().toLowerCase();
          if (!query) return [];
          return cities.filter((city) => city.displayName.toLowerCase().includes(query));
        },
      };

  const handleSingleChange = (value: string | string[] | null | undefined, item: unknown) => {
    const scalar = typeof value === "string" || typeof value === "number" ? value : null;
    setSingleValue((scalar ?? null) as string | null);
    setSelectedItem(Array.isArray(value) ? null : item);
  };

  const handleMultiChange = (value: unknown) => {
    const values = (value ?? []) as string[];
    setMultiValue(values);
    setSelectedItem(null);
  };

  const code = [
    "<Combobox",
    `  label="${cfg.label}"`,
    cfg.required && `  required`,
    cfg.multiple && `  multiple`,
    cfg.fullWidth && `  fullWidth`,
    cfg.disabled && `  disabled`,
    cfg.error && `  error`,
    cfg.searchInput && `  searchInput`,
    isLocal && isMulti && `  multipleConfig={{ maxSelection: 3, maxVisibleItems: ${cfg.maxVisibleItems === "auto" ? "undefined" : cfg.maxVisibleItems} }}`,
    !isMulti && cfg.showClearOption && `  showClearOption`,
    !isMulti && cfg.showClearButton && `  showClearButton`,
    `  placeholder="${cfg.placeholder}"`,
    cfg.searchInput && `  searchPlaceholder="${cfg.searchPlaceholder}"`,
    `  emptyMessage="${cfg.emptyMessage}"`,
    remote && `  loadingMessage="${cfg.loadingMessage}"`,
    remote && `  remoteErrorMessage="${cfg.remoteErrorMessage}"`,
    remote && `  minimumSearchMessage="${cfg.minimumSearchMessage}"`,
    !isMulti && cfg.showClearOption && `  clearOptionLabel="${cfg.clearOptionLabel}"`,
    !isMulti && cfg.showClearButton && `  clearButtonLabel="${cfg.clearButtonLabel}"`,
    isLocal && `  value={value}`,
    `  onChange={(value, item) => setSelection(value, item)}`,
    isLocal && `  options={cities}`,
    remote &&
      `  remote={{\n    identifier: "playground-cities",\n    optionsFn,\n    searchOnInput: true,\n    minimumSearchLength: ${cfg.minimumSearchLength},\n    refreshOnOpen: ${cfg.refreshOnOpen},\n  }}`,
    `  menuItemConfig={{ value: "code", label: ["displayName"] }}`,
    cfg.pagination &&
      isLocal &&
      `  pagination={{ pageSize: ${cfg.pageSize}, loadMoreLabel: "${cfg.loadMoreLabel}" }}`,
  ]
    .filter(Boolean)
    .join("\n")
    .concat("\n/>");

  const displayCode = code;

  return (
    <Card className='gap-0 overflow-hidden rounded-lg'>
      <CardHeader className='gap-1.5 border-b py-5'>
        <CardTitle className='text-base font-medium'>Playground</CardTitle>
        <CardDescription>
          Toggle props on the right and watch the component update live. The generated code block
          mirrors the current configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid p-0 lg:grid-cols-[1fr_300px]'>
        <div className='flex min-h-96 flex-col items-start justify-center gap-5 border-r border-b p-6 lg:border-b-0'>
          <div className={cfg.fullWidth ? "w-full" : "w-max min-w-70"}>
            <Combobox
              label={cfg.label}
              required={cfg.required}
              multiple={cfg.multiple}
              fullWidth={cfg.fullWidth}
              disabled={cfg.disabled}
              error={cfg.error}
              searchInput={cfg.searchInput}
              showClearOption={cfg.showClearOption && !isMulti}
              showClearButton={cfg.showClearButton && !isMulti}
              clearOptionLabel={cfg.clearOptionLabel}
              clearButtonLabel={cfg.clearButtonLabel}
              placeholder={cfg.placeholder}
              searchPlaceholder={cfg.searchPlaceholder}
              emptyMessage={cfg.emptyMessage}
              loadingMessage={cfg.loadingMessage}
              remoteErrorMessage={cfg.remoteErrorMessage}
              minimumSearchMessage={cfg.minimumSearchMessage}
              value={isMulti ? multiValue : singleValue}
              onChange={isMulti ? handleMultiChange : handleSingleChange}
              options={isLocal ? cities : undefined}
              remote={remote}
              menuItemConfig={{ value: "code", label: ["displayName"] }}
              pagination={
                cfg.pagination && isLocal
                  ? { pageSize: cfg.pageSize, loadMoreLabel: cfg.loadMoreLabel }
                  : undefined
              }
            />
          </div>
          <StateLine
            label={isMulti ? "values" : "value"}
            value={isMulti ? multiValue : singleValue}
          />
          {selectedItem ? (
            <StateLine
              label="resolved item"
              value={selectedItem}
            />
          ) : null}
        </div>

        <div className='space-y-5 p-6'>
          <ConfigGroup title='Data source'>
            <div className='flex gap-2'>
              {(["local", "remote"] as const).map((source) => (
                <Button
                  key={source}
                  variant={cfg.dataSource === source ? "default" : "outline"}
                  size='sm'
                  className='flex-1'
                  onClick={() => set("dataSource", source)}
                >
                  {source === "local" ? "Local list" : "Remote API"}
                </Button>
              ))}
            </div>
          </ConfigGroup>

          <ConfigGroup title='Behavior'>
            <ToggleRow label='multiple' checked={cfg.multiple} onChange={(v) => set("multiple", v)} />
            <ToggleRow label='searchInput' checked={cfg.searchInput} onChange={(v) => set("searchInput", v)} />
            <ToggleRow label='fullWidth' checked={cfg.fullWidth} onChange={(v) => set("fullWidth", v)} />
            <ToggleRow label='disabled' checked={cfg.disabled} onChange={(v) => set("disabled", v)} />
            <ToggleRow label='error' checked={cfg.error} onChange={(v) => set("error", v)} />
            <ToggleRow label='required' checked={cfg.required} onChange={(v) => set("required", v)} />
          </ConfigGroup>

          {!isMulti && (
            <ConfigGroup title='Clear'>
              <ToggleRow
                label='showClearOption'
                checked={cfg.showClearOption}
                onChange={(v) => set("showClearOption", v)}
              />
              <ToggleRow
                label='showClearButton'
                checked={cfg.showClearButton}
                onChange={(v) => set("showClearButton", v)}
              />
            </ConfigGroup>
          )}

          {remote && (
            <ConfigGroup title='Remote'>
              <ToggleRow
                label='refreshOnOpen'
                checked={cfg.refreshOnOpen}
                onChange={(v) => set("refreshOnOpen", v)}
              />
              <div className='flex items-center justify-between gap-2'>
                <span className='text-muted-foreground text-sm'>minimumSearchLength</span>
                <Input
                  type='number'
                  min={1}
                  max={5}
                  value={cfg.minimumSearchLength}
                  onChange={(event) => set("minimumSearchLength", Math.max(1, Math.min(5, Number(event.target.value) || 1)))}
                  className='h-8 w-16 text-xs'
                />
              </div>
            </ConfigGroup>
          )}

          {isLocal && isMulti && (
            <ConfigGroup title='Overflow'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-muted-foreground text-sm'>maxVisibleItems</span>
                <select
                  value={cfg.maxVisibleItems}
                  onChange={(event) => set("maxVisibleItems", event.target.value as PlaygroundConfig["maxVisibleItems"])}
                  className='border-input bg-background rounded-md border px-2 py-1 text-xs'
                >
                  <option value='auto'>auto</option>
                  <option value='1'>1</option>
                  <option value='2'>2</option>
                </select>
              </div>
            </ConfigGroup>
          )}

          {cfg.pagination && isLocal && (
            <ConfigGroup title='Pagination'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-muted-foreground text-sm'>pageSize</span>
                <Input
                  type='number'
                  min={1}
                  max={8}
                  value={cfg.pageSize}
                  onChange={(event) => set("pageSize", Math.max(1, Math.min(8, Number(event.target.value) || 3)))}
                  className='h-8 w-16 text-xs'
                />
              </div>
              <TextField label='loadMoreLabel' value={cfg.loadMoreLabel} onChange={(v) => set("loadMoreLabel", v)} />
            </ConfigGroup>
          )}

          <ConfigGroup title='Label content'>
            <TextField label='label' value={cfg.label} onChange={(v) => set("label", v)} />
            <TextField label='placeholder' value={cfg.placeholder} onChange={(v) => set("placeholder", v)} />
            {cfg.searchInput && <TextField label='searchPlaceholder' value={cfg.searchPlaceholder} onChange={(v) => set("searchPlaceholder", v)} />}
            <TextField label='emptyMessage' value={cfg.emptyMessage} onChange={(v) => set("emptyMessage", v)} />
            {remote && <TextField label='loadingMessage' value={cfg.loadingMessage} onChange={(v) => set("loadingMessage", v)} />}
            {remote && <TextField label='remoteErrorMessage' value={cfg.remoteErrorMessage} onChange={(v) => set("remoteErrorMessage", v)} />}
            {remote && <TextField label='minimumSearchMessage' value={cfg.minimumSearchMessage} onChange={(v) => set("minimumSearchMessage", v)} />}
            {!isMulti && cfg.showClearOption && <TextField label='clearOptionLabel' value={cfg.clearOptionLabel} onChange={(v) => set("clearOptionLabel", v)} />}
            {!isMulti && cfg.showClearButton && <TextField label='clearButtonLabel' value={cfg.clearButtonLabel} onChange={(v) => set("clearButtonLabel", v)} />}
          </ConfigGroup>
        </div>
      </CardContent>
      <CardFooter className='p-6 pt-4'>
        <PlaygroundCode code={displayCode} />
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Example scenes                                                      */
/* ------------------------------------------------------------------ */

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
  const remote = fakeCityRemote(fail ? 1 : 0, true);
  return (
    <DemoCard
      title='Remote options'
      description='searchOnInput delegates every keystroke to the API once the search passes 2 characters. Opening the dropdown before typing shows the minimum-search hint, not a misleading empty state. Identical searches resolve from the shared cache without a request.'
      footer={
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          <input
            type='checkbox'
            className='size-3.5 accent-foreground'
            checked={fail}
            onChange={(event) => setFail(event.target.checked)}
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
          minimumSearchMessage='Digite ao menos 2 caracteres para pesquisar'
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
      description='Checkbox rows with maxSelection = 2 and maxVisibleItems = 1 so the trigger collapses into a +N overflow. Selecting a third fires onMaxSelectionReached, shown here as a form-style field error.'
    >
      <div className='grid gap-1 sm:max-w-sm'>
        <Combobox
          label='Kind'
          multiple
          fullWidth
          options={kinds}
          menuItemConfig={{ value: "value", label: ["label"] }}
          multipleConfig={{ maxSelection: 2, maxVisibleItems: 1 }}
          value={selected}
          error={limitHit}
          onChange={(value) => {
            const values = (value ?? []) as number[];
            setSelected(values);
            if (values.length < 2) setLimitHit(false);
          }}
          onMaxSelectionReached={() => setLimitHit(true)}
        />
        {limitHit && (
          <p className='text-destructive text-sm'>
            Maximum of 2 options reached. Remove one to select another.
          </p>
        )}
        <div className='pt-2'>
          <StateLine label='values' value={selected} />
        </div>
      </div>
    </DemoCard>
  );
}

function CustomItems() {
  const [tool, setTool] = useState<string | null>(null);
  return (
    <DemoCard
      title='Custom items'
      description='customStartNode, customLabel with an inline badge and isOptionDisabled graying out deprecated tools row by row.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='Data store'
          searchInput
          options={tools}
          menuItemConfig={{
            value: "code",
            label: ["name"],
            searchProperties: ["name", "kind"],
            customStartNode: (item) => (
              <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary'>
                {item.name.slice(0, 2)}
              </span>
            ),
            customLabel: (item) => (
              <span className='flex items-center gap-2'>
                {item.name}
                {item.deprecated && <Badge variant='outline'>deprecated</Badge>}
              </span>
            ),
            isOptionDisabled: (item) => item.deprecated,
          }}
          onChange={(value) => setTool((value ?? null) as string | null)}
        />
        <StateLine label='selected' value={tool} />
      </div>
    </DemoCard>
  );
}

function PersistedHydration() {
  const [resolved, setResolved] = useState<(typeof cities)[number] | null>(null);
  return (
    <DemoCard
      title='Persisted value hydration'
      description='The controlled value points at an item the API has not loaded yet: the trigger first shows selectedFallbackLabel, then onSelectedItemResolved reports the full item once the remote page arrives.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='City'
          searchInput
          remote={fakeCityRemote(0, false)}
          selectedFallbackLabel='Resolving selected city...'
          value='curitiba'
          menuItemConfig={{ value: "code", label: ["displayName"] }}
          onSelectedItemResolved={setResolved}
        />
        <StateLine label='resolved' value={resolved} />
      </div>
    </DemoCard>
  );
}

function RefreshOnOpen() {
  const [last, setLast] = useState<string | null>(null);
  let fetches = 0;
  const remote: RemoteConfig<{ code: string; name: string }> = {
    identifier: "demo-tick",
    refreshOnOpen: true,
    optionsFn: async () => {
      await delay(250);
      fetches += 1;
      return [{ code: "tick", name: `Fetched ${fetches} time(s) on open` }];
    },
  };
  return (
    <DemoCard
      title='Refresh on open'
      description='With remote.refreshOnOpen the cache is bypassed and the API revalidates on every dropdown open. Open and close a few times: the label keeps changing because every open fetches fresh data.'
    >
      <div className='grid gap-4 sm:max-w-sm'>
        <Combobox
          label='Ticker'
          remote={remote}
          menuItemConfig={{ value: "code", label: ["name"] }}
          onChange={(value) => setLast((value ?? null) as string | null)}
        />
        <StateLine label='selected' value={last} />
      </div>
    </DemoCard>
  );
}

function ClientPagination() {
  const [lastSelection, setLastSelection] = useState<string | null>(null);
  return (
    <DemoCard
      title='Client pagination'
      description='75 items with pageSize 50. The search filters the full list before the visible slice applies.'
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
          onSelectedItemResolved={useCallback((item: unknown) => {
            const row = item as { qualifiedName?: string } | null;
            setLastSelection(row?.qualifiedName ?? null);
          }, [])}
        />
        <StateLine label='resolved item' value={lastSelection} />
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
      <StateLine label='error value' value={invalid} />
    </DemoCard>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme='system'>
      <div className='bg-background text-foreground min-h-screen'>
        <div className='border-b'>
          <div className='mx-auto flex h-14 max-w-4xl items-center justify-between px-6'>
            <a href='#top' className='flex items-center gap-2 text-sm font-medium'>
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
            <h1 className='scroll-m-20 text-4xl font-semibold tracking-tight nowrap'>
              Advanced Combobox
            </h1>
            <p className='max-w-2xl leading-7 text-muted-foreground'>
              List and tree combobox for the shadcn registry: remote options with a
              deduplicated shared cache, server or client pagination, multi-select and
              cascading trees. Zero runtime dependencies beyond React; every string is a
              prop with a sensible default.
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              <InstallCommand command='npx shadcn add https://fernaandojr.github.io/advanced-combobox/r/combobox.json' />
              <Button asChild variant='secondary' size='sm'>
                <a
                  href='https://github.com/FernaandoJr/advanced-combobox'
                  target='_blank'
                  rel='noreferrer'
                >
                  Repository
                </a>
              </Button>
            </div>
          </header>

          <Separator />

          <Playground />

          <div className='grid gap-6'>
            <BasicList />
            <RemoteSearch />
            <MultipleSelection />
            <CustomItems />
            <PersistedHydration />
            <RefreshOnOpen />
            <ClientPagination />
            <ServerPagination />
            <TreeVariants />
            <States />
          </div>

          <footer className='border-t pt-6 pb-4'>
            <p className='text-muted-foreground text-xs'>
              Every component on this page was installed from the published registry with{" "}
              <code className='bg-muted rounded px-1 py-0.5'>npx shadcn add</code> and runs on the
              shared remote cache engine of the item.
            </p>
          </footer>
        </main>
      </div>
    </ThemeProvider>
  );
}
