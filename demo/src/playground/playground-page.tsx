import { useCallback, useMemo, useState } from "react";
import { CheckIcon, CopyIcon, MoonIcon, RotateCcw, SunIcon } from "lucide-react";

import { Combobox } from "@/components/ui/combobox/combobox";
import { ComboboxTree } from "@/components/ui/combobox/combobox-tree";
import type {
  MenuItemConfig,
  RemoteConfig,
  SelectedItemConfig,
} from "@/components/ui/combobox/types";
import { useTheme } from "@/components/theme-provider";
import type { ListConfig, TreeConfig } from "@/playground/config";
import { listConfigToCode, treeConfigToCode } from "@/playground/codegen";
import { ListCustomizePanel, TreeCustomizePanel } from "@/playground/customize-panel";
import { getDataset, getDatasetDisableRules, datasetConfigDefaults, rowMatchesQuery } from "@/playground/datasets";
import { getNodeStyle, renderTreeStart } from "@/playground/node-styles";
import { applyTreePreset, listPresetUsesTickingRemote, listPresetWith } from "@/playground/presets";
import {
  createTickingRemote,
  delay,
  makeDatasetRemote,
  REGIONS_FLAT,
  REGIONS_NESTED,
  type PlaygroundRow,
  type RegionRow,
} from "@/playground/fixtures";
import { CodeBlock, DocsToolbar, JsonBlock } from "@/preview";

type Variant = "list" | "tree";
type View = "preview" | "code";

/* ===== Customize chrome ===== */

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
        </div>
      </div>
      {children}
    </div>
  );
}

/* ===== list state machine ===== */

function useListSetup() {
  const [config, setConfig] = useState<ListConfig>(() => listPresetWith("basic").config);
  const [value, setValue] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PlaygroundRow | null>(null);
  const [pool, setPool] = useState<PlaygroundRow[]>(() => getDataset("cities").make(12));
  const [serverPage, setServerPage] = useState(0);
  const [serverSearch, setServerSearch] = useState("");
  const [serverLoading, setServerLoading] = useState(false);

  const set = useCallback(
    <K extends keyof ListConfig>(key: K, next: ListConfig[K]) => {
      setConfig((current) => {
        if (key === "itemCount") {
          setPool(getDataset(current.dataset).make(next as unknown as number));
        }
        return { ...current, [key]: next };
      });
    },
    [],
  );

  /** Swaps the fixture domain: resets label sources, custom styles and selection state. */
  const setDataset = useCallback((key: string) => {
    setConfig((current) => {
      setPool(getDataset(key).make(current.itemCount));
      return { ...current, ...datasetConfigDefaults(key) };
    });
    setValue(null);
    setSelectedItem(null);
    setServerSearch("");
    setServerPage(0);
    setServerLoading(false);
  }, []);

  const setPreset = useCallback((presetName: string) => {
    const { config: nextConfig, persistedValue } = listPresetWith(presetName);
    setConfig(nextConfig);
    setPool(getDataset(nextConfig.dataset).make(nextConfig.itemCount));
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
  const dataset = getDataset(config.dataset);
  const remote: RemoteConfig<PlaygroundRow> | undefined = useMemo(() => {
    if (config.dataSource !== "remote") return undefined;
    if (usesTicking) return createTickingRemote(config.latency, config.failAfterCalls);
    return makeDatasetRemote(dataset.make, {
      identifier: `playground-${dataset.key}`,
      searchOnInput: config.searchOnInput,
      refreshOnOpen: config.refreshOnOpen,
      latency: config.latency,
      failAfterCalls: config.failAfterCalls,
      count: config.itemCount,
      searchTextKeys: dataset.searchTextKeys,
    });
  }, [
    usesTicking,
    dataset,
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
        ? pool.filter((row) => rowMatchesQuery(row, dataset.searchTextKeys, serverQuery))
        : pool.slice(0, (serverPage + 1) * config.pageSize),
    [pool, dataset.searchTextKeys, serverPage, config.pageSize, serverQuery],
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
    setDataset,
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

function ListPreview({
  setup,
  multiValue,
  onMultiChange,
}: {
  setup: ReturnType<typeof useListSetup>;
  multiValue: string[];
  onMultiChange: (values: string[]) => void;
}) {
  const { config } = setup;
  const isMulti = config.multiple;
  const dataset = getDataset(config.dataset);

  const server = config.pagination === "server" ? setup.server.machine : undefined;
  const options = config.pagination === "server" ? setup.server.items : setup.localItems;

  const handleSingleChange = useCallback(
    (value: unknown, item: unknown) => {
      const isList = Array.isArray(value);
      setup.setValue(!isList && value != null ? String(value) : null);
      setup.setSelectedItem(isList ? null : ((item as PlaygroundRow | null) ?? null));
    },
    [setup],
  );

  const handleMultiChange = useCallback(
    (next: unknown) => {
      onMultiChange((next ?? []) as string[]);
      setup.setSelectedItem(null);
    },
    [onMultiChange, setup],
  );

  const menuLabelStyle =
    config.menuLabelStyle === "none" ? null : getNodeStyle(config.menuLabelStyle);
  const menuStartStyle =
    config.menuStartNodeStyle === "none" ? null : getNodeStyle(config.menuStartNodeStyle);
  const selectedStyle =
    config.selectedLabelStyle === "none" ? null : getNodeStyle(config.selectedLabelStyle);
  const selectedStartStyle =
    config.selectedStartNodeStyle === "none" ? null : getNodeStyle(config.selectedStartNodeStyle);
  const disableRule = getDatasetDisableRules(config.dataset).find(
    (rule) => rule.key === config.disableRule,
  );

  const menuItemConfig: MenuItemConfig<PlaygroundRow> = {
    value: dataset.valueKey,
    label: config.menuLabelKeys as (keyof PlaygroundRow)[],
    separator: config.menuSeparator,
    disableSpaceBetween: config.disableSpaceBetween,
    customLabel: menuLabelStyle?.renderLabel,
    customStartNode: menuStartStyle?.renderStart,
    searchProperties:
      config.searchRule === "explicit"
        ? (dataset.searchTextKeys as (keyof PlaygroundRow)[])
        : undefined,
    isOptionDisabled: disableRule?.predicate,
  };

  const hasSelectedOverride =
    config.selectedLabelKeys.length > 0 ||
    config.selectedLabelStyle !== "none" ||
    config.selectedStartNodeStyle !== "none" ||
    (isMulti && config.multipleSeparator !== "") ||
    config.selectedDisableStartNode;

  const selectedItemConfig: SelectedItemConfig<PlaygroundRow> | undefined = hasSelectedOverride
    ? {
        label:
          config.selectedLabelKeys.length > 0
            ? (config.selectedLabelKeys as (keyof PlaygroundRow)[])
            : undefined,
        customLabel: selectedStyle?.renderLabel,
        customStartNode: selectedStartStyle?.renderStart,
        multipleSeparator:
          isMulti && config.multipleSeparator ? config.multipleSeparator : undefined,
        disableStartNode: config.selectedDisableStartNode || undefined,
      }
    : undefined;

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
      menuItemConfig={menuItemConfig}
      selectedItemConfig={selectedItemConfig}
    />
  );
}

function TreePreview({
  config,
  value,
  onValueChange,
  multiValue,
  onMultiChange,
}: {
  config: TreeConfig;
  value: string | null;
  onValueChange: (value: string | null) => void;
  multiValue: string[];
  onMultiChange: (values: string[]) => void;
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
          ? (next) => onMultiChange(((next ?? []) as unknown[]).map(String))
          : (next) => onValueChange(next == null ? null : String(next))
      }
      menuItemConfig={{
        value: "code",
        label: ["name"],
        customStartNode:
          config.startNodeStyle === "tree-kind-icons" ? renderTreeStart : undefined,
      }}
      selectedItemConfig={
        config.selectedLabelStyle !== "none" || (isMulti && config.multipleSeparator !== "")
          ? {
              customLabel:
                config.selectedLabelStyle === "none"
                  ? undefined
                  : getNodeStyle(config.selectedLabelStyle)?.renderLabel,
              multipleSeparator:
                isMulti && config.multipleSeparator ? config.multipleSeparator : undefined,
            }
          : undefined
      }
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
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const listSetup = useListSetup();
  const [treeConfig, setTreeConfig] = useState<TreeConfig>(() => applyTreePreset("tree-single"));
  const [treeValue, setTreeValue] = useState<string | null>(null);
  const [treeMulti, setTreeMulti] = useState<string[]>([]);
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
    setTreeMulti([]);
  }, []);

  /* Selected rows behind the multi-select state, so the JSON block shows the
     whole picture (values + resolved items) no matter which mode is active. */
  const listSelectedItems = useMemo(() => {
    if (variant !== "list" || !listSetup.config.multiple) return null;
    const valueKey = getDataset(listSetup.config.dataset).valueKey;
    const source =
      listSetup.config.pagination === "server" ? listSetup.server.items : listSetup.localItems;
    const ids = new Set(multiValue.map(String));
    return source.filter((row) => ids.has(String(row[valueKey])));
  }, [variant, listSetup.config, listSetup.server.items, listSetup.localItems, multiValue]);

  const treeSelectedItems = useMemo(() => {
    if (variant !== "tree" || !treeConfig.multiple) return null;
    const ids = new Set(treeMulti);
    const collect = (rows: RegionRow[]): RegionRow[] =>
      rows.flatMap((row) => [
        ...(ids.has(row.code) ? [row] : []),
        ...(row.children ? collect(row.children) : []),
      ]);
    return collect(treeConfig.shape === "flat" ? REGIONS_FLAT : REGIONS_NESTED);
  }, [variant, treeConfig.multiple, treeConfig.shape, treeMulti]);

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
          <div className='demo-container py-12 min-h-[180px]'>
            {variant === "list" ? (
              <div className='w-full max-w-[280px]'>
                <ListPreview
                  setup={listSetup}
                  multiValue={multiValue}
                  onMultiChange={setMultiValue}
                />
              </div>
            ) : (
              <div className='w-full max-w-[280px]'>
                <TreePreview
                  config={treeConfig}
                  value={treeValue}
                  onValueChange={setTreeValue}
                  multiValue={treeMulti}
                  onMultiChange={setTreeMulti}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className='code-view'>
          <pre>
            <CodeBlock code={activeCode} />
          </pre>
        </div>
      )}

      {view === "preview" ? (
        variant === "list" ? (
          listSetup.config.multiple ? (
            <JsonBlock
              data={{ value: multiValue, items: listSelectedItems ?? [] }}
              className='mt-6'
            />
          ) : (
            <JsonBlock
              data={{ value: listSetup.value, item: listSetup.selectedItem }}
              className='mt-6'
            />
          )
        ) : treeConfig.multiple ? (
          <JsonBlock data={{ value: treeMulti, items: treeSelectedItems ?? [] }} className='mt-6' />
        ) : (
          <JsonBlock data={{ value: treeValue }} className='mt-6' />
        )
      ) : null}

      <CustomizeFrame
        canReset={variant === "list" ? listSetup.isDirty() : treeIsDirty(treeConfig)}
        onReset={() => {
          if (variant === "list") {
            listSetup.reset();
            setMultiValue([]);
          } else {
            setTreePreset(treeConfig.preset);
          }
        }}
      >
        {variant === "list" ? (
          <ListCustomizePanel
            config={listSetup.config}
            set={listSetup.set}
            setPreset={listSetup.setPreset}
            onDatasetChange={listSetup.setDataset}
          />
        ) : (
          <TreeCustomizePanel config={treeConfig} set={setTree} setPreset={setTreePreset} />
        )}
      </CustomizeFrame>
    </div>
  );
}