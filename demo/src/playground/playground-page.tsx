import { useCallback, useMemo, useState } from "react";
import { CheckIcon, CopyIcon, RotateCcwIcon } from "lucide-react";

import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type { RemoteConfig } from "@/components/ui/combobox/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListConfig, TreeConfig } from "@/playground/config";
import { DEFAULT_LIST_CONFIG } from "@/playground/config";
import { listConfigToCode, treeConfigToCode } from "@/playground/codegen";
import { ListCustomizePanel, TreeCustomizePanel } from "@/playground/customize-panel";
import { applyTreePreset, listPresetUsesTickingRemote, listPresetWith } from "@/playground/presets";
import {
  createCityRemote,
  createTickingRemote,
  delay,
  makeCities,
  REGIONS_FLAT,
  REGIONS_NESTED,
} from "@/playground/fixtures";

type Variant = "list" | "tree";
type View = "preview" | "code";

type CityRow = { code: string; displayName: string };

function StateChips({ label, value }: { label: string; value: unknown }) {
  return (
    <Badge variant='outline' className='gap-1.5 bg-background/70 font-normal'>
      <span className='text-muted-foreground'>{label}</span>
      <code className='font-mono text-xs'>
        {value === null || value === undefined
          ? "null"
          : value !== "" && typeof value === "string"
            ? value
            : JSON.stringify(value)}
      </code>
    </Badge>
  );
}

function useListSetup() {
  const [config, setConfig] = useState<ListConfig>(DEFAULT_LIST_CONFIG);
  const [value, setValue] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CityRow | null>(null);
  const [pool, setPool] = useState<CityRow[]>(() => makeCities(DEFAULT_LIST_CONFIG.itemCount));
  const [serverPage, setServerPage] = useState(0);
  const [serverSearch, setServerSearch] = useState("");
  const [serverLoading, setServerLoading] = useState(false);

  const set = useCallback(
    <K extends keyof ListConfig>(key: K, next: ListConfig[K]) => {
      setConfig((current) => ({ ...current, [key]: next }));
    },
    [],
  );

  const setItemCount = useCallback((count: number) => {
    setConfig((current) => ({ ...current, itemCount: count }));
    setPool(makeCities(count));
  }, []);

  const setPreset = useCallback((presetName: string) => {
    const { config: nextConfig, persistedValue } = listPresetWith(presetName);
    setConfig(nextConfig);
    setPool(makeCities(nextConfig.itemCount));
    setValue(persistedValue);
    setSelectedItem(null);
    setServerSearch("");
    setServerPage(0);
    setServerLoading(false);
  }, []);

  const usesTicking = listPresetUsesTickingRemote(config.preset);
  const remote: RemoteConfig<CityRow> | undefined = useMemo(() => {
    if (config.dataSource !== "remote") return undefined;
    if (usesTicking) return createTickingRemote(config.latency, config.failAfterCalls);
    return createCityRemote({
      searchOnInput: config.searchOnInput,
      minimumSearchLength: config.minimumSearchLength,
      refreshOnOpen: config.refreshOnOpen,
      latency: config.latency,
      failAfterCalls: config.failAfterCalls,
      count: config.itemCount,
    });
  }, [
    usesTicking,
    config.dataSource,
    config.searchOnInput,
    config.minimumSearchLength,
    config.refreshOnOpen,
    config.latency,
    config.failAfterCalls,
    config.itemCount,
  ]);

  const serverQuery = serverSearch.trim().toLowerCase();
  const serverHasMore = (serverPage + 1) * config.pageSize < pool.length;
  const serverItems = useMemo(
    () =>
      serverQuery
        ? pool.filter((row) => row.displayName.toLowerCase().includes(serverQuery))
        : pool.slice(0, (serverPage + 1) * config.pageSize),
    [pool, serverPage, config.pageSize, serverQuery],
  );

  const serverMachine = useMemo(
    () =>
      config.pagination === "server"
        ? {
            hasMore: serverHasMore,
            isLoadingMore: serverLoading,
            onLoadMore: () => {
              setServerLoading(true);
              delay(Math.min(config.latency, 600)).then(() => {
                setServerPage((current) => current + 1);
                setServerLoading(false);
              });
            },
            onSearchChange: (next: string) => {
              setServerSearch(next);
              setServerPage(0);
            },
          }
        : undefined,
    [config.pagination, config.latency, serverHasMore, serverLoading],
  );

  const localItems = useMemo(() => pool, [pool]);

  const resetList = useCallback(() => setPreset("basic"), [setPreset]);

  return {
    config,
    set,
    setPreset,
    setItemCount,
    value,
    setValue,
    selectedItem,
    setSelectedItem,
    remote,
    localItems,
    server: { items: serverItems, machine: serverMachine },
    resetList,
  };
}

function ListPreview({ setup }: { setup: ReturnType<typeof useListSetup> }) {
  const { config } = setup;
  const isMulti = config.multiple;
  const [multiValue, setMultiValue] = useState<string[]>([]);

  const server = config.pagination === "server" ? setup.server.machine : undefined;
  const options =
    config.pagination === "server" ? setup.server.items : (setup.localItems ?? undefined);

  const handleSingleChange = useCallback(
    (value: string | string[] | null | undefined, item: unknown) => {
      setup.setValue(typeof value === "string" ? value : null);
      setup.setSelectedItem(Array.isArray(value) ? null : ((item as CityRow | null) ?? null));
    },
    [setup],
  );

  const handleMultiChange = useCallback((next: unknown) => {
    setMultiValue((next ?? []) as string[]);
  }, []);

  return (
    <Combobox
      label={config.label}
      placeholder={config.placeholder}
      searchPlaceholder={config.searchPlaceholder}
      emptyMessage={config.emptyMessage}
      loadingMessage={config.loadingMessage}
      remoteErrorMessage={config.remoteErrorMessage}
      minimumSearchMessage={config.minimumSearchMessage}
      clearOptionLabel={config.clearOptionLabel}
      clearButtonLabel={config.clearButtonLabel}
      required={config.required}
      multiple={config.multiple}
      fullWidth={config.fullWidth}
      disabled={config.disabled}
      error={config.error}
      searchInput={config.searchInput}
      showClearOption={config.showClearOption && !isMulti}
      showClearButton={config.showClearButton && !isMulti}
      multipleConfig={
        isMulti
          ? {
              maxSelection: config.maxSelection ?? undefined,
              maxVisibleItems: config.maxVisibleItems ?? undefined,
            }
          : undefined
      }
      value={isMulti ? multiValue : (setup.value ?? null)}
      onChange={isMulti ? handleMultiChange : handleSingleChange}
      options={config.dataSource === "local" ? options : undefined}
      remote={config.dataSource === "remote" ? setup.remote : undefined}
      pagination={
        config.pagination === "client"
          ? { pageSize: config.pageSize, loadMoreLabel: config.loadMoreLabel }
          : server
            ? {
                mode: "server",
                pageSize: config.pageSize,
                hasMore: server.hasMore,
                isLoadingMore: server.isLoadingMore,
                onLoadMore: server.onLoadMore,
                onSearchChange: server.onSearchChange,
              }
            : undefined
      }
      menuItemConfig={{ value: "code", label: ["displayName"] }}
    />
  );
}

export function PlaygroundPage() {
  const [variant, setVariant] = useState<Variant>("list");
  const [view, setView] = useState<View>("preview");
  const listSetup = useListSetup();
  const [treeConfig, setTreeConfig] = useState<TreeConfig>(() => applyTreePreset("tree-single"));
  const [treeValue, setTreeValue] = useState<string | string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const setTree = useCallback(
    <K extends keyof TreeConfig>(key: K, next: TreeConfig[K]) => {
      setTreeConfig((current) => ({ ...current, [key]: next }));
    },
    [],
  );

  const setTreePreset = useCallback((presetName: string) => {
    setTreeConfig(applyTreePreset(presetName));
    setTreeValue(null);
  }, []);

  const listCode = useMemo(() => listConfigToCode(listSetup.config), [listSetup.config]);
  const treeCode = useMemo(() => treeConfigToCode(treeConfig), [treeConfig]);

  const copyActive = useCallback(() => {
    const code = variant === "list" ? listCode : treeCode;
    // eslint-disable-next-line no-alert
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [listCode, treeCode, variant]);

  const canvasDots =
    "bg-[radial-gradient(rgba(0,0,0,0.07)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(rgba(255,255,255,0.055)_1px,transparent_1px)]";

  return (
    <div className='grid gap-4'>
      <Card className='overflow-hidden rounded-xl py-0'>
        <div className='flex h-11 items-center justify-between gap-2 border-b px-3'>
          <Tabs value={view} onValueChange={(next) => setView(next as View)}>
            <TabsList className='h-8 rounded-md bg-transparent p-0'>
              {(["preview", "code"] as const).map((item) => (
                <TabsTrigger
                  key={item}
                  value={item}
                  className='data-[state=active]:bg-muted data-[state=active]:shadow-none h-8 rounded-md px-3 text-xs'
                >
                  <span className='font-mono text-xs'>{item === "preview" ? "Preview" : "Code"}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='sm' className='h-8 gap-1.5 font-mono text-xs' onClick={copyActive}>
              {copied ? <CheckIcon className='h-3.5 text-green-600' /> : <CopyIcon className='h-3.5' />}
              {copied ? "copied" : "Copy code"}
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              title='Reset props'
              onClick={() => {
                if (variant === "list") listSetup.setPreset("basic");
                else setTreePreset("tree-single");
              }}
            >
              <RotateCcwIcon className='h-3.5' />
              <span className='sr-only'>Reset props</span>
            </Button>
          </div>
        </div>

        <CardContent className='p-0'>
          <Tabs value={variant} onValueChange={(next) => setVariant(next as Variant)} className='gap-0'>
            <div className='px-3 pt-3'>
              <TabsList className='h-7 bg-transparent p-0'>
                {(
                  [
                    { value: "list", label: "Combobox" },
                    { value: "tree", label: "ComboboxTree" },
                  ] as const
                ).map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className='data-[state=active]:bg-muted data-[state=active]:shadow-none h-7 rounded-md px-3 text-xs'
                  >
                    <span className='font-mono text-xs'>{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value='preview' className='mt-0'>
              <div
                className={`relative m-3 min-h-[400px] overflow-hidden rounded-lg border bg-gradient-to-b from-muted/50 to-muted/20`}
              >
                <div className={`absolute inset-0 ${canvasDots}`} aria-hidden />
                <div
                  className='absolute inset-0'
                  style={{
                    background:
                      "radial-gradient(640px 260px at 50% 40%, color-mix(in oklab, var(--primary) 7%, transparent), transparent)",
                  }}
                  aria-hidden
                />
                <div className='relative flex min-h-[400px] items-center justify-center px-6 py-16'>
                  {variant === "list" ? (
                    <div className='w-full max-w-sm'>
                      <ListPreview setup={listSetup} />
                      <div className='mt-8 flex flex-wrap justify-center gap-2'>
                        <StateChips label='value' value={listSetup.value ?? null} />
                        {listSetup.selectedItem ? (
                          <StateChips label='item' value={listSetup.selectedItem} />
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className='w-full max-w-sm'>
                      <TreePreview config={treeConfig} value={treeValue} onValueChange={setTreeValue} />
                      <div className='mt-8 flex flex-wrap justify-center gap-2'>
                        <StateChips label='value' value={treeValue ?? null} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='code' className='mt-0'>
              <div className='m-3 overflow-hidden rounded-lg border bg-muted/30'>
                <pre className='p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre text-foreground/90'>
                  {variant === "list" ? listCode : treeCode}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className='rounded-xl py-0'>
        <CardContent className='p-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-sm font-semibold tracking-wide'>Customize</h2>
            <span className='text-muted-foreground text-xs'>
              {variant === "list" ? "<Combobox /> props" : "<ComboboxTree /> props"}
            </span>
          </div>
          {variant === "list" ? (
            <ListCustomizePanel config={listSetup.config} set={listSetup.set} />
          ) : (
            <TreeCustomizePanel config={treeConfig} set={setTree} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TreePreview({
  config,
  value,
  onValueChange,
}: {
  config: TreeConfig;
  value: string | string[] | null;
  onValueChange: (value: string | string[] | null) => void;
}) {
  const remote = useMemo(
    () =>
      config.remote
        ? {
            identifier: "playground-regions",
            refreshOnOpen: config.refreshOnOpen,
            optionsFn: async (signal?: AbortSignal) => {
              await delay(config.latency);
              if (config.failAfterCalls > 0) throw { status: 403 };
              if (signal?.aborted) {
                throw new DOMException("The request was aborted.", "AbortError");
              }
              return config.shape === "flat" ? REGIONS_FLAT : REGIONS_NESTED;
            },
          }
        : undefined,
    [config.remote, config.latency, config.failAfterCalls, config.refreshOnOpen, config.shape],
  );

  const data = config.remote ? undefined : config.shape === "flat" ? REGIONS_FLAT : REGIONS_NESTED;

  return (
    <ComboboxTree
      label={config.label}
      placeholder={config.placeholder}
      searchPlaceholder={config.searchPlaceholder}
      emptyMessage={config.emptyMessage}
      loadingMessage={config.loadingMessage}
      remoteErrorMessage={config.remoteErrorMessage}
      expandAllLabel={config.expandAllLabel}
      collapseAllLabel={config.collapseAllLabel}
      required={config.required}
      multiple={config.multiple}
      fullWidth={config.fullWidth}
      disabled={config.disabled}
      error={config.error}
      multipleConfig={config.multiple ? { maxSelection: config.maxSelection ?? undefined } : undefined}
      data={remote ? undefined : data}
      remote={remote}
      flatParentKey={config.shape === "flat" ? "parentCode" : undefined}
      value={value}
      onChange={(next) => {
        const adapted = Array.isArray(next)
          ? next.map(String)
          : next != null
            ? String(next)
            : null;
        onValueChange(adapted as string | string[] | null);
      }}
      menuItemConfig={{ value: "code", label: ["name"] }}
    />
  );
}
