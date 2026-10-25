import { useCallback, useMemo, useState } from "react";
import { CheckIcon, CopyIcon, MoonIcon, RotateCcw, SunIcon } from "lucide-react";

import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type { RemoteConfig } from "@/components/ui/combobox/types";
import { useTheme } from "@/components/theme-provider";
import type { ListConfig, TreeConfig } from "@/playground/config";
import { listConfigToCode, treeConfigToCode } from "@/playground/codegen";
import { ListCustomizePanel, ListLabelsPanel, TreeCustomizePanel, TreeLabelsPanel } from "@/playground/customize-panel";
import { applyTreePreset, listPresetUsesTickingRemote, listPresetWith } from "@/playground/presets";
import {
  createCityRemote,
  createTickingRemote,
  delay,
  makeCities,
  REGIONS_FLAT,
  REGIONS_NESTED,
} from "@/playground/fixtures";
import { DocsToolbar } from "@/rb/chrome";

type Variant = "list" | "tree";
type View = "preview" | "code";
type CityRow = { code: string; displayName: string };

/* ===== Customize chrome (copied literally from Customize.jsx, MIT: react-bits) ===== */

function CustomizeFrame({
  canReset,
  onReset,
  children,
}: {
  canReset: boolean;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='customize-frame'>
      <div className='customize-heading'>
        <h2>Customize</h2>
        <div className='customize-heading-actions'>
          <button
            type='button'
            className={`customize-heading-action customize-reset-action${canReset ? " is-visible" : ""}`}
            onClick={onReset}
            disabled={!canReset}
            aria-hidden={!canReset}
            tabIndex={canReset ? 0 : -1}
          >
            <RotateCcw size={14} aria-hidden='true' />
            <span>Reset</span>
          </button>
          <ThemeToggleAction />
        </div>
      </div>
      {children}
    </div>
  );
}

function ThemeToggleAction() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type='button'
      className='customize-heading-action'
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <MoonIcon size={14} /> : <SunIcon size={14} />}
      <span>{resolvedTheme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}

function StateChip({ label, text }: { label: string; text: string }) {
  return (
    <span className='flex items-center gap-2 rounded-md border border-(--border-primary) bg-(--surface-ghost-track) px-2.5 py-1'>
      <span className='text-[10px] font-medium tracking-wide uppercase text-(--text-muted)'>
        {label}
      </span>
      <code className='font-mono text-xs text-(--text-primary)'>{text}</code>
    </span>
  );
}

/* ===== list state machine ===== */

function useListSetup() {
  const [config, setConfig] = useState<ListConfig>(() => listPresetWith("basic").config);
  const [value, setValue] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CityRow | null>(null);
  const [pool, setPool] = useState<CityRow[]>(() => makeCities(12));
  const [serverPage, setServerPage] = useState(0);
  const [serverSearch, setServerSearch] = useState("");
  const [serverLoading, setServerLoading] = useState(false);

  const set = useCallback(
    <K extends keyof ListConfig>(key: K, next: ListConfig[K]) => {
      setConfig((current) => {
        if (key === "itemCount") {
          setPool(makeCities(next as unknown as number));
        }
        return { ...current, [key]: next };
      });
    },
    [],
  );

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

  const isDirty = useCallback(() => {
    const baseline = listPresetWith(config.preset).config;
    return (Object.keys(baseline) as (keyof ListConfig)[]).some(
      (key) => config[key] !== baseline[key],
    );
  }, [config]);

  const reset = useCallback(() => setPreset(config.preset), [config.preset, setPreset]);

  const usesTicking = listPresetUsesTickingRemote(config.preset);
  const remote: RemoteConfig<CityRow> | undefined = useMemo(() => {
    if (config.dataSource !== "remote") return undefined;
    if (usesTicking) return createTickingRemote(config.latency, config.failAfterCalls);
    return createCityRemote({
      searchOnInput: config.searchOnInput,
      refreshOnOpen: config.refreshOnOpen,
      latency: config.latency,
      failAfterCalls: config.failAfterCalls,
      count: config.itemCount,
    });
  }, [
    usesTicking,
    config.dataSource,
    config.searchOnInput,
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

  return {
    config,
    set,
    setPreset,
    value,
    setValue,
    selectedItem,
    setSelectedItem,
    remote,
    localItems: pool,
    server: { items: serverItems, machine: serverMachine },
    isDirty,
    reset,
  };
}

function ListPreview({ setup }: { setup: ReturnType<typeof useListSetup> }) {
  const { config } = setup;
  const isMulti = config.multiple;
  const [multiValue, setMultiValue] = useState<string[]>([]);

  const server = config.pagination === "server" ? setup.server.machine : undefined;
  const options = config.pagination === "server" ? setup.server.items : setup.localItems;

  const handleSingleChange = useCallback(
    (value: string | string[] | null | undefined, item: unknown) => {
      setup.setValue(typeof value === "string" ? value : null);
      setup.setSelectedItem(Array.isArray(value) ? null : ((item as CityRow | null) ?? null));
    },
    [setup],
  );

  const handleMultiChange = useCallback((next: unknown) => {
    setMultiValue((next ?? []) as string[]);
    setup.setSelectedItem(null);
  }, []);

  return (
    <Combobox
      label={config.label}
      placeholder={config.placeholder}
      searchPlaceholder={config.searchPlaceholder}
      emptyMessage={config.emptyMessage}
      loadingMessage={config.loadingMessage}
      remoteErrorMessage={config.remoteErrorMessage}
      emptyOptionLabel={config.emptyOptionLabel}
      clearButtonLabel={config.clearButtonLabel}
      required={config.required}
      multiple={config.multiple}
      fullWidth={config.fullWidth}
      disabled={config.disabled}
      error={config.error}
      searchInput={config.searchInput}
      showEmptyOption={config.showEmptyOption && !isMulti}
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

function TreePreview({
  config,
  value,
  onValueChange,
}: {
  config: TreeConfig;
  value: string | null;
  onValueChange: (value: string | null) => void;
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

  const isMulti = config.multiple;
  const [multiValue, setMultiValue] = useState<string[]>([]);

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
      data={remote ? undefined : config.shape === "flat" ? REGIONS_FLAT : REGIONS_NESTED}
      remote={remote}
      flatParentKey={config.shape === "flat" ? "parentCode" : undefined}
      value={isMulti ? multiValue : value}
      onChange={
        isMulti
          ? (next) => setMultiValue(((next ?? []) as unknown[]).map(String))
          : (next) => onValueChange(next == null ? null : String(next))
      }
      menuItemConfig={{ value: "code", label: ["name"] }}
    />
  );
}

function treeIsDirty(config: TreeConfig): boolean {
  const baseline = applyTreePreset(config.preset);
  return (Object.keys(baseline) as (keyof TreeConfig)[]).some(
    (key) => config[key] !== baseline[key],
  );
}

/* ===== page ===== */

export function PlaygroundPage() {
  const [variant, setVariant] = useState<Variant>("list");
  const [view, setView] = useState<View>("preview");
  const listSetup = useListSetup();
  const [treeConfig, setTreeConfig] = useState<TreeConfig>(() => applyTreePreset("tree-single"));
  const [treeValue, setTreeValue] = useState<string | null>(null);
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

  const activeCode = useMemo(
    () => (variant === "list" ? listConfigToCode(listSetup.config) : treeConfigToCode(treeConfig)),
    [variant, listSetup.config, treeConfig],
  );

  const copyActive = useCallback(() => {
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [activeCode]);

  return (
    <div className='docs-section'>
      <header className='docs-overview'>
        <h1 className='sub-category'>Advanced Combobox</h1>
        <p className='docs-overview-description'>
          List and tree combobox for the shadcn registry: remote options with a shared, deduplicated
          cache, client or server pagination and cascading trees.
        </p>
      </header>

      <DocsToolbar
        activeTab={view}
        onTabChange={(next) => setView(next)}
        previewWidth={null}
        onPreviewWidthChange={() => undefined}
        actions={
          <button type='button' className='docs-tool' onClick={copyActive} aria-label='Copy code'>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy code"}
          </button>
        }
        variantTabs={
          <div className='docs-track' role='group' aria-label='Component variant'>
            <button
              type='button'
              className='docs-segment'
              aria-pressed={variant === "list"}
              onClick={() => setVariant("list")}
            >
              Combobox
            </button>
            <button
              type='button'
              className='docs-segment'
              aria-pressed={variant === "tree"}
              onClick={() => setVariant("tree")}
            >
              ComboboxTree
            </button>
          </div>
        }
      />

      {view === "preview" ? (
        <div className='preview-panel'>
          <div className='demo-container h-[480px]'>
            {variant === "list" ? (
              <div className='w-full max-w-sm'>
                <ListPreview setup={listSetup} />
                <div className='mt-6 flex flex-wrap justify-center gap-2'>
                  <StateChip label='value' text={listSetup.value ?? "null"} />
                  {listSetup.selectedItem ? (
                    <StateChip label='item' text={listSetup.selectedItem.displayName} />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className='w-full max-w-sm'>
                <TreePreview config={treeConfig} value={treeValue} onValueChange={setTreeValue} />
                <div className='mt-6 flex flex-wrap justify-center gap-2'>
                  <StateChip label='value' text={treeValue ?? "null"} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className='rb-code'>
          <pre>{activeCode}</pre>
        </div>
      )}

      <CustomizeFrame
        canReset={variant === "list" ? listSetup.isDirty() : treeIsDirty(treeConfig)}
        onReset={() => {
          if (variant === "list") listSetup.reset();
          else setTreePreset(treeConfig.preset);
        }}
      >
        {variant === "list" ? (
          <ListCustomizePanel config={listSetup.config} set={listSetup.set} />
        ) : (
          <TreeCustomizePanel config={treeConfig} set={setTree} />
        )}
      </CustomizeFrame>

      <div className='customize-frame'>
        <div className='customize-heading'>
          <h2>Labels</h2>
        </div>
        {variant === "list" ? (
          <ListLabelsPanel config={listSetup.config} set={listSetup.set} />
        ) : (
          <TreeLabelsPanel config={treeConfig} set={setTree} />
        )}
      </div>
    </div>
  );
}