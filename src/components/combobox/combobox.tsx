"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment, useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  DEFAULT_CLEAR_BUTTON_LABEL,
  DEFAULT_CLEAR_OPTION_LABEL,
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_LOAD_MORE_LABEL,
  DEFAULT_LOADING_MESSAGE,
  DEFAULT_PLACEHOLDER,
  DEFAULT_REMOTE_ERROR_MESSAGE,
  DEFAULT_SEARCH_PLACEHOLDER,
} from "./combobox-defaults";
import { useRemoteItems } from "./combobox-remote";
import type {
  ComboboxOption,
  ComboboxProps,
  ComboboxValueType,
  MenuItemConfig,
  RemoteConfig,
  SelectedItemConfig,
} from "./combobox-types";
import {
  buildSearchableValue,
  getButtonLabelNode,
  getButtonLabelPlainText,
  getButtonStartNode,
  getLabelNode,
  getRawValueFromItem,
  isSameComboboxValue,
} from "./combobox-utils";

interface OptionEntry<T> {
  option: ComboboxOption<ComboboxValueType<T>>;
  item: T;
}

/** Trigger label layout shared by single and multi selection modes. */
function TriggerLabel({ label, startNode }: { label: ReactNode; startNode?: ReactNode | null }) {
  if (startNode) {
    return (
      <span className='flex min-w-0 items-center gap-2 py-0.5'>
        <span className='shrink-0 flex items-center'>{startNode}</span>
        <span className='min-w-0 truncate'>{label}</span>
      </span>
    );
  }
  return <span className='min-w-0 truncate block'>{label}</span>;
}

function hasSingleValue(value: unknown): boolean {
  return (
    value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "")
  );
}

function hasFallbackLabel(label: ReactNode): boolean {
  if (label === null || label === undefined) return false;
  if (typeof label === "string") return label.trim().length > 0;
  return true;
}

/**
 * Defers onChange so the popover unmounts before consumers re-render (e.g. a
 * react-hook-form validation state swap) — avoids a visible flicker/teardown race.
 */
function deferSingleSelectChange(callback: () => void) {
  window.setTimeout(callback, 0);
}

function FallbackLabel({ children }: { children: ReactNode }) {
  return <span className='min-w-0 truncate block'>{children}</span>;
}

export function Combobox<T>({
  placeholder: placeholderProp,
  showClearOption,
  showClearButton,
  clearOptionLabel,
  clearButtonLabel,
  searchPlaceholder,
  emptyMessage,
  loadingMessage,
  remoteErrorMessage,
  value: controlledValue,
  onChange,
  onSelectedItemResolved,
  onBlur,
  onKeyDown,
  className,
  disabled,
  fullWidth,
  searchInput,
  pagination,
  error,
  label: labelProp,
  remote,
  options,
  menuItemConfig,
  selectedItemConfig,
  selectedFallbackLabel,
  multiple,
  multipleConfig,
  required,
  onMaxSelectionReached,
  id: idProp,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: ComboboxProps<T>) {
  const placeholder = placeholderProp ?? DEFAULT_PLACEHOLDER;
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [internalSingle, setInternalSingle] = useState<ComboboxValueType<T> | null | undefined>(
    undefined,
  );
  const [internalMulti, setInternalMulti] = useState<ComboboxValueType<T>[]>([]);
  const { items: remoteItems, error: remoteError, isLoading } = useListRemoteItems(
    remote,
    searchValue,
    open,
  );

  const isMulti = multiple === true;
  const isControlled = controlledValue !== undefined;
  const itemConfig = menuItemConfig;
  const searchKeys = itemConfig.searchProperties || itemConfig.label;
  const searchText = searchPlaceholder ?? DEFAULT_SEARCH_PLACEHOLDER;
  const clearOptionText = clearOptionLabel ?? DEFAULT_CLEAR_OPTION_LABEL;
  const clearButtonText = clearButtonLabel ?? DEFAULT_CLEAR_BUTTON_LABEL;
  const emptyText = isLoading
    ? (loadingMessage ?? DEFAULT_LOADING_MESSAGE)
    : remoteError
      ? (remoteErrorMessage ?? DEFAULT_REMOTE_ERROR_MESSAGE)
      : (emptyMessage ?? DEFAULT_EMPTY_MESSAGE);

  const valueSingle = useMemo(() => {
    if (!isControlled) return internalSingle;
    return Array.isArray(controlledValue) ? undefined : (controlledValue ?? undefined);
  }, [isControlled, controlledValue, internalSingle]);

  // Option and its source item resolved together in one O(n) pass over the data.
  // options win over remote items when both are provided and non-empty.
  const optionEntries = useMemo(
    (): OptionEntry<T>[] =>
      (options && options.length > 0 ? options : remoteItems).map((item) => ({
        option: {
          value: getRawValueFromItem(item, itemConfig.value),
          label: getLabelNode(item, itemConfig),
          searchableValue: buildSearchableValue(item, searchKeys),
        },
        item,
      })),
    [options, remoteItems, itemConfig, searchKeys],
  );
  const isInitialRemoteLoading = Boolean(remote && isLoading && optionEntries.length === 0);
  const paginationEnabled = Boolean(pagination);
  const serverPaginationEnabled = pagination?.mode === "server";
  const controlledSearchEnabled = paginationEnabled || remote?.searchOnInput === true;
  const paginationPageSize = pagination ? Math.max(1, pagination.pageSize) : 0;
  const [visibleOptionCount, setVisibleOptionCount] = useState(paginationPageSize);
  const filteredEntries = useMemo(() => {
    if (!paginationEnabled || serverPaginationEnabled) return optionEntries;
    const query = searchValue.trim().toLowerCase();
    if (!query) return optionEntries;
    return optionEntries.filter((entry) =>
      `${String(entry.option.value)} ${entry.option.searchableValue ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [optionEntries, paginationEnabled, serverPaginationEnabled, searchValue]);
  const effectiveVisibleOptionCount = Math.max(paginationPageSize, visibleOptionCount);
  const visibleEntries =
    paginationEnabled && !serverPaginationEnabled
      ? filteredEntries.slice(0, effectiveVisibleOptionCount)
      : filteredEntries;
  const hasMoreOptions = serverPaginationEnabled
    ? Boolean(pagination?.hasMore)
    : paginationEnabled && effectiveVisibleOptionCount < filteredEntries.length;

  const selectedEntry = useMemo(
    () => optionEntries.find((entry) => isSameComboboxValue(entry.option.value, valueSingle)) ?? null,
    [optionEntries, valueSingle],
  );
  const selectedOption = isMulti ? null : selectedEntry?.option ?? null;

  useEffect(() => {
    if (isMulti || !hasSingleValue(valueSingle)) return;
    if (selectedEntry) onSelectedItemResolved?.(selectedEntry.item);
  }, [isMulti, onSelectedItemResolved, selectedEntry, valueSingle]);

  const selectedValues = useMemo((): ComboboxValueType<T>[] => {
    if (!isMulti) return [];
    return isControlled ? (Array.isArray(controlledValue) ? controlledValue : []) : internalMulti;
  }, [isMulti, isControlled, controlledValue, internalMulti]);
  // Entries in the same order as selectedValues (order the selection was built).
  const selectedEntries = useMemo(
    () =>
      selectedValues
        .map((value) => optionEntries.find((entry) => isSameComboboxValue(entry.option.value, value)))
        .filter((entry): entry is OptionEntry<T> => entry != null),
    [selectedValues, optionEntries],
  );
  const showInlineClearButton =
    showClearButton === true && !isMulti && !disabled && hasSingleValue(valueSingle);

  const resetSearchState = () => {
    if (!controlledSearchEnabled) return;
    setSearchValue("");
    if (paginationEnabled) {
      setVisibleOptionCount(paginationPageSize);
      pagination?.onSearchChange?.("");
    }
  };

  const resolveItems = (values: ComboboxValueType<T>[]): T[] =>
    values.flatMap((value) => {
      const entry = optionEntries.find((e) => isSameComboboxValue(e.option.value, value));
      return entry ? [entry.item] : [];
    });

  const handleChange = (option: ComboboxOption<ComboboxValueType<T>>, item: T) => {
    if (isMulti) {
      const withoutOption = selectedValues.filter((v) => !isSameComboboxValue(v, option.value));
      const isRemoving = withoutOption.length < selectedValues.length;
      if (!isRemoving) {
        const maxSelection = multipleConfig?.maxSelection;
        if (maxSelection && selectedValues.length >= maxSelection) {
          onMaxSelectionReached?.();
          return;
        }
      }
      const next = isRemoving ? withoutOption : [...withoutOption, option.value];
      if (!isControlled) setInternalMulti(next);
      onChange?.(next, resolveItems(next));
    } else {
      if (!isControlled) setInternalSingle(option.value);
      resetSearchState();
      setOpen(false);
      deferSingleSelectChange(() => {
        onChange?.(option.value, item);
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetSearchState();
      onBlur?.();
    }
  };

  const handleSearchValueChange = (nextValue: string) => {
    setSearchValue(nextValue);
    setVisibleOptionCount(paginationPageSize);
    pagination?.onSearchChange?.(nextValue);
  };

  const handleClearSelection = () => {
    if (isMulti) return;
    if (!isControlled) setInternalSingle(null);
    resetSearchState();
    setOpen(false);
    deferSingleSelectChange(() => {
      onChange?.(null, null);
    });
  };

  const handleTriggerContainerRef = useCallback((node: HTMLDivElement | null) => {
    const nextContainer = node?.closest<HTMLElement>("[data-slot='dialog-content']") ?? null;
    setPortalContainer((current) => (current === nextContainer ? current : nextContainer));
  }, []);

  const buttonContent = useMemo<ReactNode>(() => {
    if (isMulti) {
      if (selectedValues.length === 0) return placeholder || "";
      if (selectedEntries.length < selectedValues.length && hasFallbackLabel(selectedFallbackLabel)) {
        return <FallbackLabel>{selectedFallbackLabel}</FallbackLabel>;
      }
      if (selectedEntries.length === 1) {
        const { item } = selectedEntries[0];
        const buttonLabel = getButtonLabelNode(item, itemConfig, selectedItemConfig);
        const buttonStartNode = getButtonStartNode(item, itemConfig, selectedItemConfig);
        return <TriggerLabel label={buttonLabel} startNode={buttonStartNode} />;
      }
      const maxVisibleItems = multipleConfig?.maxVisibleItems;
      const entriesToShow = maxVisibleItems
        ? selectedEntries.slice(0, maxVisibleItems)
        : selectedEntries;
      const itemsSeparator = selectedItemConfig?.multipleSeparator;
      const overflowCount =
        maxVisibleItems && selectedEntries.length > maxVisibleItems
          ? selectedEntries.length - maxVisibleItems
          : 0;

      return (
        <span
          className={cn(
            "flex min-w-0 max-w-full items-center overflow-hidden",
            !itemsSeparator && "gap-1",
          )}
        >
          {entriesToShow.map(({ item, option }, index) => {
            const label = getButtonLabelNode(item, itemConfig, selectedItemConfig);
            return (
              <span key={String(option.value)} className='flex min-w-0 items-center'>
                {index > 0 && itemsSeparator && (
                  <span className='mx-1 text-muted-foreground'>{itemsSeparator}</span>
                )}
                <span className='truncate max-w-28'>{label}</span>
              </span>
            );
          })}
          {overflowCount > 0 && (
            <span className='text-muted-foreground ml-1'>+{overflowCount}</span>
          )}
        </span>
      );
    }
    if (!selectedEntry) {
      if (hasSingleValue(valueSingle) && hasFallbackLabel(selectedFallbackLabel)) {
        return <FallbackLabel>{selectedFallbackLabel}</FallbackLabel>;
      }
      return placeholder || "";
    }
    return (
      <TriggerLabel
        label={getButtonLabelNode(selectedEntry.item, itemConfig, selectedItemConfig)}
        startNode={getButtonStartNode(selectedEntry.item, itemConfig, selectedItemConfig)}
      />
    );
  }, [
    isMulti,
    selectedEntry,
    selectedValues,
    selectedEntries,
    optionEntries,
    itemConfig,
    selectedItemConfig,
    multipleConfig,
    placeholder,
    selectedFallbackLabel,
    valueSingle,
  ]);

  const buttonTitle = useMemo(() => {
    if (isMulti) {
      if (selectedValues.length > 0 && selectedEntries.length < selectedValues.length) {
        return typeof selectedFallbackLabel === "string" ? selectedFallbackLabel : undefined;
      }
      if (selectedEntries.length === 0) return undefined;
      const parts = selectedEntries
        .map(({ item }) => getButtonLabelPlainText(item, itemConfig, selectedItemConfig))
        .filter((value): value is string => Boolean(value));
      if (parts.length === 0) return undefined;
      return parts.join(selectedItemConfig?.multipleSeparator ?? ", ");
    }

    if (!selectedEntry) {
      if (hasSingleValue(valueSingle)) {
        return typeof selectedFallbackLabel === "string" ? selectedFallbackLabel : undefined;
      }
      return undefined;
    }
    return getButtonLabelPlainText(selectedEntry.item, itemConfig, selectedItemConfig);
  }, [
    isMulti,
    selectedEntries,
    selectedEntry,
    selectedValues,
    itemConfig,
    selectedItemConfig,
    selectedFallbackLabel,
    valueSingle,
  ]);

  return (
    <Fragment>
      {labelProp && (
        <Label htmlFor={id} className='flex items-center gap-2'>
          {labelProp}
          {required && <span className='text-destructive'>*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <div
          ref={handleTriggerContainerRef}
          className={cn("relative min-w-0 max-w-full", fullWidth ? "w-full" : "w-max")}
        >
          <PopoverTrigger asChild>
            <Button
              type='button'
              id={id}
              name={name}
              variant='outline'
              role='combobox'
              aria-expanded={open}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid ?? (error ? true : undefined)}
              disabled={disabled}
              aria-busy={isLoading || undefined}
              onKeyDown={onKeyDown}
              className={cn(
                "justify-start text-left select-none h-9 min-h-9 max-h-9 min-w-0 max-w-full overflow-hidden",
                fullWidth ? "w-full" : "min-w-70 w-max",
                showInlineClearButton && "pr-16",
                error && "text-destructive! border-destructive!",
                className,
              )}
            >
              <span
                className='flex min-w-0 max-w-full flex-1 items-center overflow-hidden font-normal'
                title={buttonTitle}
              >
                {buttonContent}
              </span>
              {isLoading ? (
                <Loader2 className='ml-2 h-4 w-4 shrink-0 animate-spin' />
              ) : (
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              )}
            </Button>
          </PopoverTrigger>
          {showInlineClearButton ? (
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              className='absolute top-1/2 right-8 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              aria-label={clearButtonText}
              title={clearButtonText}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleClearSelection();
              }}
            >
              <X aria-hidden='true' />
            </Button>
          ) : null}
        </div>
        <PopoverContent
          data-combobox-content=''
          className={cn("p-0", "w-(--radix-popover-trigger-width)")}
          align='start'
          container={portalContainer}
        >
          <Command shouldFilter={!paginationEnabled && remote?.searchOnInput !== true}>
            {searchInput ? (
              <CommandInput
                placeholder={searchText}
                value={controlledSearchEnabled ? searchValue : undefined}
                onValueChange={controlledSearchEnabled ? handleSearchValueChange : undefined}
              />
            ) : null}
            <CommandList
              className={cn(
                "min-h-0 max-h-[min(300px,var(--radix-popover-content-available-height,300px))] overflow-x-hidden overflow-y-auto scroll-py-1 pr-0.5",
              )}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {isInitialRemoteLoading ? (
                <div
                  className='flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground'
                  role='status'
                >
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>{emptyText}</span>
                </div>
              ) : (
                <>
                  {remoteError ? (
                    <div role='alert' className='px-3 py-4 text-sm text-muted-foreground'>
                      {remoteErrorMessage ?? DEFAULT_REMOTE_ERROR_MESSAGE}
                    </div>
                  ) : (
                    <CommandEmpty>{emptyText}</CommandEmpty>
                  )}
                  {!isMulti && showClearOption ? (
                    <CommandItem
                      value='__combobox-clear__'
                      keywords={[clearOptionText]}
                      className='min-w-0 cursor-pointer'
                      onSelect={() => handleClearSelection()}
                    >
                      <span className='min-w-0 flex-1 truncate'>{clearOptionText}</span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0",
                          !selectedOption ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ) : null}
                  {visibleEntries.map(({ option, item }) => {
                    const valueStr = String(option.value);
                    const optionDisabled = itemConfig.isOptionDisabled?.(item) ?? false;
                    const startNode = itemConfig.customStartNode?.(item) ?? null;

                    if (isMulti) {
                      const checked = selectedValues.some((v) =>
                        isSameComboboxValue(v, option.value),
                      );
                      return (
                        <CommandItem
                          key={valueStr}
                          value={valueStr}
                          keywords={option.searchableValue ? [option.searchableValue] : undefined}
                          disabled={optionDisabled}
                          className={cn(
                            "min-w-0 cursor-pointer",
                            optionDisabled && "cursor-not-allowed",
                          )}
                          onSelect={() => {
                            if (optionDisabled) return;
                            handleChange(option, item);
                          }}
                          aria-selected={checked}
                        >
                          <Checkbox
                            checked={checked}
                            className='mr-2 shrink-0 pointer-events-none'
                            aria-hidden
                          />
                          {startNode && <span className='mr-2 shrink-0'>{startNode}</span>}
                          <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                        </CommandItem>
                      );
                    }

                    return (
                      <CommandItem
                        key={valueStr}
                        value={valueStr}
                        keywords={option.searchableValue ? [option.searchableValue] : undefined}
                        disabled={optionDisabled}
                        className={cn(
                          "min-w-0 cursor-pointer",
                          optionDisabled && "cursor-not-allowed",
                        )}
                        onSelect={() => {
                          if (optionDisabled) return;
                          handleChange(option, item);
                        }}
                      >
                        {startNode && <span className='mr-2 shrink-0'>{startNode}</span>}
                        <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0",
                            isSameComboboxValue(valueSingle, option.value)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                  {hasMoreOptions ? (
                    <div className='border-t p-1'>
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        className='w-full'
                        disabled={pagination?.isLoadingMore}
                        onClick={() => {
                          if (serverPaginationEnabled) {
                            pagination?.onLoadMore?.();
                            return;
                          }
                          setVisibleOptionCount((current) => current + paginationPageSize);
                        }}
                      >
                        {pagination?.isLoadingMore ? (
                          <Loader2 className='mr-2 size-4 animate-spin' />
                        ) : null}
                        {pagination?.loadMoreLabel ?? DEFAULT_LOAD_MORE_LABEL}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Fragment>
  );
}

/**
 * Maps the declarative `remote` config onto the canonical remote engine:
 * key = identifier (+ search text with searchOnInput), enabled = open (or
 * eager on mount with disableLazyFetch), plus optional per-open revalidation.
 */
function useListRemoteItems<T>(
  remote: RemoteConfig<T> | undefined,
  searchValue: string,
  open: boolean,
) {
  const searchOnInput = remote?.searchOnInput === true;
  const minimumSearchLength = Math.max(1, remote?.minimumSearchLength ?? 1);
  const normalizedSearchValue = searchValue.trim();
  const canSearchRemotely = normalizedSearchValue.length >= minimumSearchLength;
  const cacheKey = remote
    ? searchOnInput
      ? `${remote.identifier}:${normalizedSearchValue}`
      : remote.identifier
    : null;
  const enabled =
    Boolean(remote) &&
    (searchOnInput ? open && canSearchRemotely : open || remote?.disableLazyFetch === true);
  return useRemoteItems<T>(
    remote
      ? (signal) => remote.optionsFn(searchOnInput ? normalizedSearchValue : undefined, signal)
      : undefined,
    cacheKey,
    { enabled, refreshOnOpen: remote?.refreshOnOpen === true },
  );
}
