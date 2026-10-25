import type { ListConfig, TreeConfig } from "./config";
import { LIST_PRESETS, TREE_PRESETS } from "./presets";
import { PreviewInput, PreviewSelect, PreviewSlider, PreviewSwitch } from "@/rb/chrome";

/*
  Customize panel: the copied `<Customize />` chrome renders our config as
  React Bits scrubber rows (Slider / Switch / Select / Input).
*/

const tickCatalog = (value: number, unit: string) => `${value}${unit}`;

export function ListCustomizePanel({
  config,
  set,
}: {
  config: ListConfig;
  set: <K extends keyof ListConfig>(key: K, value: ListConfig[K]) => void;
}) {
  const isRemote = config.dataSource === "remote";
  const isMulti = config.multiple;
  return (
    <div className='preview-options'>
      <PreviewSelect
        title='Preset'
        value={config.preset}
        options={LIST_PRESETS.map((preset) => ({ value: preset.name, label: preset.label }))}
        onChange={(value) => set("preset", value)}
      />
      <PreviewSelect
        title='Data source'
        value={config.dataSource}
        options={[
          { value: "local", label: "Local list" },
          { value: "remote", label: "Remote API" },
        ]}
        onChange={(value) => set("dataSource", value as ListConfig["dataSource"])}
      />
      <PreviewSelect
        title='Pagination'
        value={config.pagination}
        options={[
          { value: "off", label: "Off" },
          { value: "client", label: "Client" },
          { value: "server", label: "Server" },
        ]}
        onChange={(value) => set("pagination", value as ListConfig["pagination"])}
      />
      <PreviewSwitch
        title='multiple'
        isChecked={config.multiple}
        onChange={(checked) => set("multiple", checked)}
      />
      <PreviewSwitch
        title='searchInput'
        isChecked={config.searchInput}
        onChange={(checked) => set("searchInput", checked)}
      />
      <PreviewSwitch
        title='fullWidth'
        isChecked={config.fullWidth}
        onChange={(checked) => set("fullWidth", checked)}
      />
      <PreviewSwitch
        title='disabled'
        isChecked={config.disabled}
        onChange={(checked) => set("disabled", checked)}
      />
      <PreviewSwitch
        title='required'
        isChecked={config.required}
        onChange={(checked) => set("required", checked)}
      />
      <PreviewSwitch
        title='error'
        isChecked={config.error}
        onChange={(checked) => set("error", checked)}
      />
      {!isMulti && (
        <PreviewSwitch
          title='showClearOption'
          isChecked={config.showClearOption}
          onChange={(checked) => set("showClearOption", checked)}
        />
      )}
      {!isMulti && (
        <PreviewSwitch
          title='showClearButton'
          isChecked={config.showClearButton}
          onChange={(checked) => set("showClearButton", checked)}
        />
      )}
      {isMulti && (
        <PreviewSlider
          title='maxSelection (0 = unlimited)'
          value={config.maxSelection === null ? 0 : config.maxSelection}
          min={0}
          max={20}
          onChange={(value) => set("maxSelection", value <= 0 ? null : value)}
        />
      )}
      {isMulti && (
        <PreviewSlider
          title='maxVisibleItems (0 = auto)'
          value={config.maxVisibleItems === null ? 0 : config.maxVisibleItems}
          min={0}
          max={10}
          onChange={(value) => set("maxVisibleItems", value <= 0 ? null : value)}
        />
      )}
      {isRemote && (
        <PreviewSwitch
          title='searchOnInput'
          isChecked={config.searchOnInput}
          onChange={(checked) => set("searchOnInput", checked)}
        />
      )}
      {isRemote && (
        <PreviewSwitch
          title='refreshOnOpen'
          isChecked={config.refreshOnOpen}
          onChange={(checked) => set("refreshOnOpen", checked)}
        />
      )}
      {isRemote && (
        <PreviewSlider
          title='minimumSearchLength'
          value={config.minimumSearchLength}
          min={1}
          max={6}
          onChange={(value) => set("minimumSearchLength", value)}
        />
      )}
      <PreviewSlider
        title={isRemote ? "Latency" : "Items"}
        value={isRemote ? config.latency : config.itemCount}
        min={isRemote ? 0 : 1}
        max={isRemote ? 1500 : 120}
        step={isRemote ? 50 : 1}
        displayValue={(value) => (isRemote ? `${value}ms` : String(value))}
        onChange={(value) => (isRemote ? set("latency", value) : set("itemCount", value))}
      />
      <PreviewSwitch
        title='Fail next request'
        isChecked={config.failAfterCalls === 1}
        onChange={(checked) => set("failAfterCalls", checked ? 1 : 0)}
      />
      {config.pagination !== "off" && (
        <PreviewSlider
          title='pageSize'
          value={config.pageSize}
          min={1}
          max={50}
          displayValue={(value) => tickCatalog(value, "")}
          onChange={(value) => set("pageSize", value)}
        />
      )}
      {config.pagination !== "off" && (
        <PreviewInput
          title='loadMoreLabel'
          value={config.loadMoreLabel}
          onChange={(value) => set("loadMoreLabel", value)}
        />
      )}
      <PreviewInput title='label' value={config.label} onChange={(value) => set("label", value)} />
      <PreviewInput
        title='placeholder'
        value={config.placeholder}
        onChange={(value) => set("placeholder", value)}
      />
      {config.searchInput && (
        <PreviewInput
          title='searchPlaceholder'
          value={config.searchPlaceholder}
          onChange={(value) => set("searchPlaceholder", value)}
        />
      )}
      <PreviewInput
        title='emptyMessage'
        value={config.emptyMessage}
        onChange={(value) => set("emptyMessage", value)}
      />
      {isRemote && (
        <PreviewInput
          title='loadingMessage'
          value={config.loadingMessage}
          onChange={(value) => set("loadingMessage", value)}
        />
      )}
      {isRemote && (
        <PreviewInput
          title='remoteErrorMessage'
          value={config.remoteErrorMessage}
          onChange={(value) => set("remoteErrorMessage", value)}
        />
      )}
      {isRemote && config.searchOnInput && (
        <PreviewInput
          title='minimumSearchMessage'
          value={config.minimumSearchMessage}
          onChange={(value) => set("minimumSearchMessage", value)}
        />
      )}
      {!isMulti && config.showClearOption && (
        <PreviewInput
          title='clearOptionLabel'
          value={config.clearOptionLabel}
          onChange={(value) => set("clearOptionLabel", value)}
        />
      )}
      {!isMulti && config.showClearButton && (
        <PreviewInput
          title='clearButtonLabel'
          value={config.clearButtonLabel}
          onChange={(value) => set("clearButtonLabel", value)}
        />
      )}
    </div>
  );
}

export function TreeCustomizePanel({
  config,
  set,
}: {
  config: TreeConfig;
  set: <K extends keyof TreeConfig>(key: K, value: TreeConfig[K]) => void;
}) {
  return (
    <div className='preview-options'>
      <PreviewSelect
        title='Preset'
        value={config.preset}
        options={TREE_PRESETS.map((preset) => ({ value: preset.name, label: preset.label }))}
        onChange={(value) => set("preset", value)}
      />
      <PreviewSelect
        title='Shape'
        value={config.shape}
        options={[
          { value: "flat", label: "Flat rows" },
          { value: "nested", label: "Nested rows" },
        ]}
        onChange={(value) => set("shape", value as TreeConfig["shape"])}
      />
      <PreviewSwitch
        title='remote'
        isChecked={config.remote}
        onChange={(checked) => set("remote", checked)}
      />
      {config.remote && (
        <PreviewSlider
          title='Latency'
          value={config.latency}
          min={0}
          max={1500}
          step={50}
          displayValue={(value) => `${value}ms`}
          onChange={(value) => set("latency", value)}
        />
      )}
      <PreviewSwitch
        title='Fail next request'
        isChecked={config.failAfterCalls === 1}
        onChange={(checked) => set("failAfterCalls", checked ? 1 : 0)}
      />
      <PreviewSwitch
        title='refreshOnOpen'
        isChecked={config.refreshOnOpen}
        onChange={(checked) => set("refreshOnOpen", checked)}
      />
      <PreviewSwitch
        title='multiple'
        isChecked={config.multiple}
        onChange={(checked) => set("multiple", checked)}
      />
      {config.multiple && (
        <PreviewSlider
          title='maxSelection (0 = unlimited)'
          value={config.maxSelection === null ? 0 : config.maxSelection}
          min={0}
          max={20}
          onChange={(value) => set("maxSelection", value <= 0 ? null : value)}
        />
      )}
      <PreviewSwitch
        title='fullWidth'
        isChecked={config.fullWidth}
        onChange={(checked) => set("fullWidth", checked)}
      />
      <PreviewSwitch
        title='disabled'
        isChecked={config.disabled}
        onChange={(checked) => set("disabled", checked)}
      />
      <PreviewSwitch
        title='required'
        isChecked={config.required}
        onChange={(checked) => set("required", checked)}
      />
      <PreviewSwitch
        title='error'
        isChecked={config.error}
        onChange={(checked) => set("error", checked)}
      />
      <PreviewInput title='label' value={config.label} onChange={(value) => set("label", value)} />
      <PreviewInput
        title='placeholder'
        value={config.placeholder}
        onChange={(value) => set("placeholder", value)}
      />
      <PreviewInput
        title='searchPlaceholder'
        value={config.searchPlaceholder}
        onChange={(value) => set("searchPlaceholder", value)}
      />
      <PreviewInput
        title='emptyMessage'
        value={config.emptyMessage}
        onChange={(value) => set("emptyMessage", value)}
      />
      {config.remote && (
        <PreviewInput
          title='loadingMessage'
          value={config.loadingMessage}
          onChange={(value) => set("loadingMessage", value)}
        />
      )}
      <PreviewInput
        title='expandAllLabel'
        value={config.expandAllLabel}
        onChange={(value) => set("expandAllLabel", value)}
      />
      <PreviewInput
        title='collapseAllLabel'
        value={config.collapseAllLabel}
        onChange={(value) => set("collapseAllLabel", value)}
      />
    </div>
  );
}
