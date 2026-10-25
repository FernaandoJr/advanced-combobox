import type { ListConfig, TreeConfig } from "./config";
import { LIST_PRESETS, TREE_PRESETS } from "./presets";
import {
  ConfigGroup,
  NumberRow,
  SelectRow,
  SliderRow,
  TextRow,
  ToggleRow,
} from "./controls";

const gridClass = "grid gap-x-6 gap-y-2 md:grid-cols-2 xl:grid-cols-3";

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
    <span>
      <ConfigGroup title='Preset'>
        <SelectRow
          label='Scene'
          value={config.preset}
          className='w-64'
          options={LIST_PRESETS.map((preset) => ({ value: preset.name, label: preset.label }))}
          onChange={(value) => set("preset", value)}
        />
      </ConfigGroup>
      <div className='mt-4 grid gap-4'>
        <ConfigGroup title='Runtime'>
          <SelectRow
            label='Data source'
            value={config.dataSource}
            className='w-32'
            options={[
              { value: "local", label: "Local list" },
              { value: "remote", label: "Remote API" },
            ]}
            onChange={(value) => set("dataSource", value as ListConfig["dataSource"])}
          />
          {!isRemote && (
            <SliderRow
              label='Items'
              value={config.itemCount}
              min={1}
              max={120}
              onChange={(value) => set("itemCount", value)}
            />
          )}
          {isRemote && (
            <SliderRow
              label='Latency'
              value={config.latency}
              min={0}
              max={1500}
              step={50}
              format={(value) => `${value}ms`}
              onChange={(value) => set("latency", value)}
            />
          )}
          <ToggleRow
            label='Fail next request'
            checked={config.failAfterCalls === 1}
            onChange={(checked) => set("failAfterCalls", checked ? 1 : 0)}
          />
        </ConfigGroup>

        <ConfigGroup title='Behavior'>
          <ToggleRow label='multiple' checked={config.multiple} onChange={(v) => set("multiple", v)} />
          <ToggleRow label='searchInput' checked={config.searchInput} onChange={(v) => set("searchInput", v)} />
          <ToggleRow label='fullWidth' checked={config.fullWidth} onChange={(v) => set("fullWidth", v)} />
          <ToggleRow label='disabled' checked={config.disabled} onChange={(v) => set("disabled", v)} />
          <ToggleRow label='required' checked={config.required} onChange={(v) => set("required", v)} />
          <ToggleRow label='error' checked={config.error} onChange={(v) => set("error", v)} />
        </ConfigGroup>

        {isMulti && (
          <ConfigGroup title='Multiple'>
            <NumberRow
              label='maxSelection'
              value={config.maxSelection === null ? 0 : config.maxSelection}
              min={0}
              max={20}
              onChange={(value) => set("maxSelection", value <= 0 ? null : value)}
            />
            <NumberRow
              label='maxVisibleItems (0 = auto)'
              value={config.maxVisibleItems === null ? 0 : config.maxVisibleItems}
              min={0}
              max={10}
              onChange={(value) => set("maxVisibleItems", value <= 0 ? null : value)}
            />
          </ConfigGroup>
        )}

        {!isMulti && (
          <ConfigGroup title='Clear'>
            <ToggleRow
              label='showClearOption'
              checked={config.showClearOption}
              onChange={(v) => set("showClearOption", v)}
            />
            <ToggleRow
              label='showClearButton'
              checked={config.showClearButton}
              onChange={(v) => set("showClearButton", v)}
            />
            {config.showClearOption && (
              <TextRow
                label='clearOptionLabel'
                value={config.clearOptionLabel}
                onChange={(v) => set("clearOptionLabel", v)}
              />
            )}
          </ConfigGroup>
        )}

        {isRemote && (
          <ConfigGroup title='Remote'>
            <ToggleRow
              label='searchOnInput'
              checked={config.searchOnInput}
              onChange={(v) => set("searchOnInput", v)}
            />
            <ToggleRow
              label='refreshOnOpen'
              checked={config.refreshOnOpen}
              onChange={(v) => set("refreshOnOpen", v)}
            />
            <NumberRow
              label='minimumSearchLength'
              value={config.minimumSearchLength}
              min={1}
              max={6}
              onChange={(v) => set("minimumSearchLength", v)}
            />
          </ConfigGroup>
        )}

        <ConfigGroup title='Pagination'>
          <SelectRow
            label='mode'
            value={config.pagination}
            className='w-28'
            options={[
              { value: "off", label: "off" },
              { value: "client", label: "client" },
              { value: "server", label: "server" },
            ]}
            onChange={(value) => set("pagination", value as ListConfig["pagination"])}
          />
          {config.pagination !== "off" && (
            <NumberRow
              label='pageSize'
              value={config.pageSize}
              min={1}
              max={50}
              onChange={(v) => set("pageSize", v)}
            />
          )}
          {config.pagination !== "off" && (
            <TextRow
              label='loadMoreLabel'
              value={config.loadMoreLabel}
              onChange={(v) => set("loadMoreLabel", v)}
            />
          )}
        </ConfigGroup>

        <ConfigGroup title='Labels'>
          <TextRow label='label' value={config.label} onChange={(v) => set("label", v)} />
          <TextRow label='placeholder' value={config.placeholder} onChange={(v) => set("placeholder", v)} />
          {config.searchInput && (
            <TextRow
              label='searchPlaceholder'
              value={config.searchPlaceholder}
              onChange={(v) => set("searchPlaceholder", v)}
            />
          )}
          <TextRow label='emptyMessage' value={config.emptyMessage} onChange={(v) => set("emptyMessage", v)} />
          {isRemote && (
            <TextRow
              label='loadingMessage'
              value={config.loadingMessage}
              onChange={(v) => set("loadingMessage", v)}
            />
          )}
          {isRemote && (
            <TextRow
              label='remoteErrorMessage'
              value={config.remoteErrorMessage}
              onChange={(v) => set("remoteErrorMessage", v)}
            />
          )}
          {isRemote && config.searchOnInput && (
            <TextRow
              label='minimumSearchMessage'
              value={config.minimumSearchMessage}
              onChange={(v) => set("minimumSearchMessage", v)}
            />
          )}
          {!isMulti && config.showClearButton && (
            <TextRow
              label='clearButtonLabel'
              value={config.clearButtonLabel}
              onChange={(v) => set("clearButtonLabel", v)}
            />
          )}
        </ConfigGroup>
      </div>
    </span>
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
    <span>
      <ConfigGroup title='Preset'>
        <SelectRow
          label='Scene'
          value={config.preset}
          className='w-64'
          options={TREE_PRESETS.map((preset) => ({ value: preset.name, label: preset.label }))}
          onChange={(value) => set("preset", value)}
        />
      </ConfigGroup>
      <div className='mt-4 grid gap-4'>
        <ConfigGroup title='Runtime'>
          <SelectRow
            label='Shape'
            value={config.shape}
            className='w-32'
            options={[
              { value: "flat", label: "Flat rows" },
              { value: "nested", label: "Nested rows" },
            ]}
            onChange={(value) => set("shape", value as TreeConfig["shape"])}
          />
          <ToggleRow label='remote' checked={config.remote} onChange={(v) => set("remote", v)} />
          {config.remote && (
            <SliderRow
              label='Latency'
              value={config.latency}
              min={0}
              max={1500}
              step={50}
              format={(value) => `${value}ms`}
              onChange={(value) => set("latency", value)}
            />
          )}
          <ToggleRow
            label='Fail next request'
            checked={config.failAfterCalls === 1}
            onChange={(checked) => set("failAfterCalls", checked ? 1 : 0)}
          />
          <ToggleRow
            label='refreshOnOpen'
            checked={config.refreshOnOpen}
            onChange={(v) => set("refreshOnOpen", v)}
          />
        </ConfigGroup>

        <ConfigGroup title='Behavior'>
          <ToggleRow label='multiple' checked={config.multiple} onChange={(v) => set("multiple", v)} />
          {config.multiple && (
            <NumberRow
              label='maxSelection (0 = unlimited)'
              value={config.maxSelection === null ? 0 : config.maxSelection}
              min={0}
              max={20}
              onChange={(value) => set("maxSelection", value <= 0 ? null : value)}
            />
          )}
          <ToggleRow label='fullWidth' checked={config.fullWidth} onChange={(v) => set("fullWidth", v)} />
          <ToggleRow label='disabled' checked={config.disabled} onChange={(v) => set("disabled", v)} />
          <ToggleRow label='required' checked={config.required} onChange={(v) => set("required", v)} />
          <ToggleRow label='error' checked={config.error} onChange={(v) => set("error", v)} />
        </ConfigGroup>

        <ConfigGroup title='Labels'>
          <TextRow label='label' value={config.label} onChange={(v) => set("label", v)} />
          <TextRow label='placeholder' value={config.placeholder} onChange={(v) => set("placeholder", v)} />
          <TextRow
            label='searchPlaceholder'
            value={config.searchPlaceholder}
            onChange={(v) => set("searchPlaceholder", v)}
          />
          <TextRow label='emptyMessage' value={config.emptyMessage} onChange={(v) => set("emptyMessage", v)} />
          {config.remote && (
            <TextRow
              label='loadingMessage'
              value={config.loadingMessage}
              onChange={(v) => set("loadingMessage", v)}
            />
          )}
          <TextRow
            label='expandAllLabel'
            value={config.expandAllLabel}
            onChange={(v) => set("expandAllLabel", v)}
          />
          <TextRow
            label='collapseAllLabel'
            value={config.collapseAllLabel}
            onChange={(v) => set("collapseAllLabel", v)}
          />
        </ConfigGroup>
      </div>
    </span>
  );
}

export { gridClass };
