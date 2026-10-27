import { WithHint, PreviewInput, PreviewSelect, PreviewSlider, PreviewSwitch } from "@/preview";
import type { ListConfig } from "./config";
import { DATASETS, getDataset, getDatasetDisableRules } from "./datasets";
import { stylesFor } from "./node-styles";
import { LIST_PRESETS } from "./presets";

/*
  Customize panel: rows grouped into labeled sections (General / Menu items /
  Trigger / Labels). Every row carries a short `hint` rendered by the shadcn
  Tooltip when hovering anywhere on the row. Chips rows are our multi-select
  extension in the same visual language.
*/

const tickCatalog = (value: number, unit: string) => `${value}${unit}`;

/** Concise explanations shown when hovering a row. */
const HINTS = {
  preset: "Behavior bundle. Switching resets every control in this panel to its defaults.",
  dataset: "Fixture domain used as options: cities, people, plugins, cars or foods.",
  dataSource: "Local renders rows in memory; Remote simulates an API with a shared cache.",
  pagination: "Slices the option list. Server mode delegates search and next-page loading to you.",
  multiple: "Allow selecting more than one option (checkboxes in the menu).",
  searchInput: "Shows the search input inside the dropdown.",
  fullWidth: "Trigger stretches to its container instead of hugging the content.",
  disabled: "Disables the whole combobox.",
  required: "Adds a red asterisk next to the label.",
  error: "Marks the combobox as invalid (destructive styling).",
  showEmptyOption: "Prepends a selectable option that clears the current selection.",
  showClearButton: "Inline icon button on the trigger that clears the selection.",
  maxSelection: "Hard cap of selected items. 0 = unlimited.",
  maxVisibleItems: "Selected items shown on the trigger before the +N overflow.",
  searchOnInput: "Sends the typed text to optionsFn instead of filtering a page locally.",
  refreshOnOpen: "Revalidates the remote data on every open, ignoring the cache.",
  itemCount: "Fixture size for local options and the remote pool.",
  latency: "Simulated network delay per remote request.",
  failNext: "Simulates a 403 on the next remote call to show the error state.",
  pageSize: "Options rendered per page inside the dropdown.",
  menuLabelKeys: "Item keys joined by the separator to build each option label.",
  menuSeparator: "String between label parts, e.g. name - code.",
  disableSpaceBetween: "Renders the separator as-is, without surrounding spaces.",
  searchProperties: "Keys used for search filtering. Default: same as the label keys.",
  optionDisabled: "Rule that makes matching options visible but not selectable.",
  menuLabelStyle: "Custom ReactNode per item in the dropdown (badges, two lines).",
  menuStartNode: "ReactNode rendered before each dropdown option (avatars, icons).",
  triggerLabelKeys: "selectedItemConfig.label override. Empty = same as the menu.",
  triggerCustomLabel: "Custom ReactNode for the trigger when a selection exists.",
  triggerStartNode: "customStartNode of the trigger. Replaces the menu start node.",
  multipleSeparator: "Text between each selected item in the trigger (e.g. / or \" | \").",
  disableStartNode: "Hides the start node in the trigger (menu keeps it).",
  label: "Text bound to the trigger via htmlFor.",
  placeholder: "Text shown while nothing is selected.",
  searchPlaceholder: "Placeholder of the search input.",
  emptyMessage: "Shown when no option matches the search.",
  loadingMessage: "Shown while remote data is loading.",
  remoteErrorMessage: "Shown when the remote request fails.",
  emptyOptionLabel: "Text of the selectable clear option.",
  clearButtonLabel: "Accessible label of the trigger clear button.",
  loadMoreLabel: "Button that renders the next page.",
} as const;

const NONE = { value: "none", label: "None" };

/** Full-row heading that splits the customize grid into labeled groups. */
function PreviewSection({ title }: { title: string }) {
  return <div className='preview-section'>{title}</div>;
}

function PreviewChips({
  title,
  options,
  values,
  hint,
  onChange,
}: {
  title: string;
  options: string[];
  values: string[];
  hint?: string;
  onChange: (next: string[]) => void;
}) {
  const toggle = (option: string) => {
    onChange(
      values.includes(option)
        ? values.filter((value) => value !== option)
        : [...values, option],
    );
  };
  return (
    <WithHint hint={hint}>
      <div className='scrubber' data-chips=''>
        <span className='scrubber-label'>{title}</span>
        <span className='scrubber-chips'>
          {options.map((option) => {
            const isActive = values.includes(option);
            return (
              <button
                key={option}
                type='button'
                className={`scrubber-chip${isActive ? " scrubber-chip--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => toggle(option)}
              >
                {option}
              </button>
            );
          })}
        </span>
      </div>
    </WithHint>
  );
}

export function ListCustomizePanel({
  config,
  set,
  setPreset,
  onDatasetChange,
}: {
  config: ListConfig;
  set: <K extends keyof ListConfig>(key: K, value: ListConfig[K]) => void;
  setPreset: (name: string) => void;
  onDatasetChange: (key: string) => void;
}) {
  const isRemote = config.dataSource === "remote";
  const isMulti = config.multiple;
  const dataset = getDataset(config.dataset);
  const disableRules = getDatasetDisableRules(config.dataset);
  const usesBuiltinMenuLabel = config.menuLabelStyle === "none";
  const hasStartNode =
    config.menuStartNodeStyle !== "none" || config.selectedStartNodeStyle !== "none";
  return (
    <div className='preview-options'>
      <PreviewSection title='General' />
      <PreviewSelect
        title='Preset'
        value={config.preset}
        options={LIST_PRESETS.map((preset) => ({ value: preset.name, label: preset.label }))}
        hint={HINTS.preset}
        onChange={setPreset}
      />
      <PreviewSelect
        title='Dataset'
        value={config.dataset}
        options={DATASETS.map((spec) => ({ value: spec.key, label: spec.label }))}
        hint={HINTS.dataset}
        onChange={onDatasetChange}
      />
      <PreviewSelect
        title='Data source'
        value={config.dataSource}
        options={[
          { value: "local", label: "Local list" },
          { value: "remote", label: "Remote API" },
        ]}
        hint={HINTS.dataSource}
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
        hint={HINTS.pagination}
        onChange={(value) => set("pagination", value as ListConfig["pagination"])}
      />
      <PreviewSwitch
        title='multiple'
        isChecked={config.multiple}
        hint={HINTS.multiple}
        onChange={(checked) => set("multiple", checked)}
      />
      <PreviewSwitch
        title='searchInput'
        isChecked={config.searchInput}
        hint={HINTS.searchInput}
        onChange={(checked) => set("searchInput", checked)}
      />
      <PreviewSwitch
        title='fullWidth'
        isChecked={config.fullWidth}
        hint={HINTS.fullWidth}
        onChange={(checked) => set("fullWidth", checked)}
      />
      <PreviewSwitch
        title='disabled'
        isChecked={config.disabled}
        hint={HINTS.disabled}
        onChange={(checked) => set("disabled", checked)}
      />
      <PreviewSwitch
        title='required'
        isChecked={config.required}
        hint={HINTS.required}
        onChange={(checked) => set("required", checked)}
      />
      <PreviewSwitch
        title='error'
        isChecked={config.error}
        hint={HINTS.error}
        onChange={(checked) => set("error", checked)}
      />
      {!isMulti && (
        <PreviewSwitch
          title='showEmptyOption'
          isChecked={config.showEmptyOption}
          hint={HINTS.showEmptyOption}
          onChange={(checked) => set("showEmptyOption", checked)}
        />
      )}
      {!isMulti && (
        <PreviewSwitch
          title='showClearButton'
          isChecked={config.showClearButton}
          hint={HINTS.showClearButton}
          onChange={(checked) => set("showClearButton", checked)}
        />
      )}
      {isMulti && (
        <PreviewSlider
          title='maxSelection (0 = unlimited)'
          value={config.maxSelection === null ? 0 : config.maxSelection}
          min={0}
          max={20}
          hint={HINTS.maxSelection}
          onChange={(value) => set("maxSelection", value <= 0 ? null : value)}
        />
      )}
      {isMulti && (
        <PreviewSlider
          title='maxVisibleItems (0 = auto)'
          value={config.maxVisibleItems === null ? 0 : config.maxVisibleItems}
          min={0}
          max={10}
          hint={HINTS.maxVisibleItems}
          onChange={(value) => set("maxVisibleItems", value <= 0 ? null : value)}
        />
      )}
      {isRemote && (
        <PreviewSwitch
          title='searchOnInput'
          isChecked={config.searchOnInput}
          hint={HINTS.searchOnInput}
          onChange={(checked) => set("searchOnInput", checked)}
        />
      )}
      {isRemote && (
        <PreviewSwitch
          title='refreshOnOpen'
          isChecked={config.refreshOnOpen}
          hint={HINTS.refreshOnOpen}
          onChange={(checked) => set("refreshOnOpen", checked)}
        />
      )}
      <PreviewSlider
        title={isRemote ? "Latency" : "Items"}
        value={isRemote ? config.latency : config.itemCount}
        min={isRemote ? 0 : 1}
        max={isRemote ? 1500 : 120}
        step={isRemote ? 50 : 1}
        displayValue={(value) => (isRemote ? `${value}ms` : String(value))}
        hint={isRemote ? HINTS.latency : HINTS.itemCount}
        onChange={(value) => (isRemote ? set("latency", value) : set("itemCount", value))}
      />
      <PreviewSwitch
        title='Fail next request'
        isChecked={config.failAfterCalls === 1}
        hint={HINTS.failNext}
        onChange={(checked) => set("failAfterCalls", checked ? 1 : 0)}
      />
      {config.pagination !== "off" && (
        <PreviewSlider
          title='pageSize'
          value={config.pageSize}
          min={1}
          max={50}
          displayValue={(value) => tickCatalog(value, "")}
          hint={HINTS.pageSize}
          onChange={(value) => set("pageSize", value)}
        />
      )}

      {/* ===== menuItemConfig ===== */}
      <PreviewSection title='Menu items' />
      <PreviewChips
        title='Menu label keys'
        options={dataset.labelKeyOptions}
        values={config.menuLabelKeys}
        hint={HINTS.menuLabelKeys}
        onChange={(value) => set("menuLabelKeys", value)}
      />
      {usesBuiltinMenuLabel && (
        <PreviewInput
          title='separator'
          value={config.menuSeparator}
          hint={HINTS.menuSeparator}
          onChange={(value) => set("menuSeparator", value)}
        />
      )}
      {usesBuiltinMenuLabel && (
        <PreviewSwitch
          title='disableSpaceBetween'
          isChecked={config.disableSpaceBetween}
          hint={HINTS.disableSpaceBetween}
          onChange={(checked) => set("disableSpaceBetween", checked)}
        />
      )}
      <PreviewSelect
        title='searchProperties'
        value={config.searchRule}
        options={[
          { value: "label", label: "Follow label keys" },
          { value: "explicit", label: dataset.searchTextKeys.join(", ") },
        ]}
        hint={HINTS.searchProperties}
        onChange={(value) => set("searchRule", value as ListConfig["searchRule"])}
      />
      {disableRules.length > 0 && (
        <PreviewSelect
          title='isOptionDisabled'
          value={config.disableRule}
          options={[NONE, ...disableRules.map((rule) => ({ value: rule.key, label: rule.label }))]}
          hint={HINTS.optionDisabled}
          onChange={(value) => set("disableRule", value)}
        />
      )}
      <PreviewSelect
        title='Menu customLabel'
        value={config.menuLabelStyle}
        options={[
          NONE,
          ...stylesFor(config.dataset as never, "menuLabel").map((style) => ({
            value: style.key,
            label: style.label,
          })),
        ]}
        hint={HINTS.menuLabelStyle}
        onChange={(value) => set("menuLabelStyle", value)}
      />
      <PreviewSelect
        title='Menu startNode'
        value={config.menuStartNodeStyle}
        options={[
          NONE,
          ...stylesFor(config.dataset as never, "menuStart").map((style) => ({
            value: style.key,
            label: style.label,
          })),
        ]}
        hint={HINTS.menuStartNode}
        onChange={(value) => set("menuStartNodeStyle", value)}
      />

      {/* ===== selectedItemConfig ===== */}
      <PreviewSection title='Trigger (selected item)' />
      <PreviewChips
        title='Label keys'
        options={dataset.selectedLabelKeyOptions}
        values={config.selectedLabelKeys}
        hint={HINTS.triggerLabelKeys}
        onChange={(value) => set("selectedLabelKeys", value)}
      />
      <PreviewSelect
        title='Trigger customLabel'
        value={config.selectedLabelStyle}
        options={[
          NONE,
          ...stylesFor(config.dataset as never, "selectedLabel").map((style) => ({
            value: style.key,
            label: style.label,
          })),
        ]}
        hint={HINTS.triggerCustomLabel}
        onChange={(value) => set("selectedLabelStyle", value)}
      />
      <PreviewSelect
        title='Trigger startNode'
        value={config.selectedStartNodeStyle}
        options={[
          NONE,
          ...stylesFor(config.dataset as never, "selectedStart").map((style) => ({
            value: style.key,
            label: style.label,
          })),
        ]}
        hint={HINTS.triggerStartNode}
        onChange={(value) => set("selectedStartNodeStyle", value)}
      />
      {isMulti && (
        <PreviewInput
          title='multipleSeparator'
          value={config.multipleSeparator}
          hint={HINTS.multipleSeparator}
          onChange={(value) => set("multipleSeparator", value)}
        />
      )}
      {hasStartNode && (
        <PreviewSwitch
          title='disableStartNode'
          isChecked={config.selectedDisableStartNode}
          hint={HINTS.disableStartNode}
          onChange={(checked) => set("selectedDisableStartNode", checked)}
        />
      )}

      {/* ===== text labels ===== */}
      <PreviewSection title='Labels' />
      <PreviewInput
        title='label'
        value={config.label}
        hint={HINTS.label}
        onChange={(value) => set("label", value)}
      />
      <PreviewInput
        title='placeholder'
        value={config.placeholder}
        hint={HINTS.placeholder}
        onChange={(value) => set("placeholder", value)}
      />
      {config.searchInput && (
        <PreviewInput
          title='searchPlaceholder'
          value={config.searchPlaceholder}
          hint={HINTS.searchPlaceholder}
          onChange={(value) => set("searchPlaceholder", value)}
        />
      )}
      <PreviewInput
        title='emptyMessage'
        value={config.emptyMessage}
        hint={HINTS.emptyMessage}
        onChange={(value) => set("emptyMessage", value)}
      />
      {isRemote && (
        <PreviewInput
          title='loadingMessage'
          value={config.loadingMessage}
          hint={HINTS.loadingMessage}
          onChange={(value) => set("loadingMessage", value)}
        />
      )}
      {isRemote && (
        <PreviewInput
          title='remoteErrorMessage'
          value={config.remoteErrorMessage}
          hint={HINTS.remoteErrorMessage}
          onChange={(value) => set("remoteErrorMessage", value)}
        />
      )}
      {!isMulti && config.showEmptyOption && (
        <PreviewInput
          title='emptyOptionLabel'
          value={config.emptyOptionLabel}
          hint={HINTS.emptyOptionLabel}
          onChange={(value) => set("emptyOptionLabel", value)}
        />
      )}
      {!isMulti && config.showClearButton && (
        <PreviewInput
          title='clearButtonLabel'
          value={config.clearButtonLabel}
          hint={HINTS.clearButtonLabel}
          onChange={(value) => set("clearButtonLabel", value)}
        />
      )}
      {config.pagination !== "off" && (
        <PreviewInput
          title='loadMoreLabel'
          value={config.loadMoreLabel}
          hint={HINTS.loadMoreLabel}
          onChange={(value) => set("loadMoreLabel", value)}
        />
      )}
    </div>
  );
}
