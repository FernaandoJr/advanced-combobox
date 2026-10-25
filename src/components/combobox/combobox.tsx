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
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  ComboboxOption,
  ComboboxProps,
  ComboboxValueType,
  RemoteConfig,
} from "./combobox-types";
import {
  DEFAULT_REMOTE_ERROR_MESSAGE,
  getErrorStatusCode,
  MAX_ATTEMPTS,
  NON_RETRYABLE_STATUS,
} from "./combobox-remote-errors";
import {
  buildSearchableValue,
  getButtonLabelNode,
  getButtonLabelPlainText,
  getButtonStartNode,
  getItemByValue,
  getItemsByValues,
  getLabelNode,
  getRawValueFromItem,
  getValueFromItem,
  isSameComboboxValue,
} from "./combobox-utils";

const DEFAULT_PLACEHOLDER = "Select...";
const DEFAULT_SEARCH_PLACEHOLDER = "Search...";
const DEFAULT_EMPTY_MESSAGE = "No results found";
const DEFAULT_LOADING_MESSAGE = "Loading...";
const DEFAULT_CLEAR_OPTION_LABEL = "Clear";
const DEFAULT_CLEAR_BUTTON_LABEL = "Clear selection";
const DEFAULT_LOAD_MORE_LABEL = "Load more";

interface RemoteState<T> {
  items: T[];
  error: unknown | null;
  fetching: boolean;
}

/**
 * Lightweight remote options loader:
 * - cache-first (per remote identifier + search text) so reopening is instant;
 * - AbortController per request; new searches cancel the previous one;
 * - retries twice on transient failures (never on 401/403);
 * - errors clear the cache so the next open tries again.
 */
function useRemoteOptions<T>(
  remote: RemoteConfig<T> | undefined,
  searchValue: string,
  open: boolean,
) {
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  const [state, setState] = useState<RemoteState<T>>({ items: [], error: null, fetching: false });
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, T[]>());

  const searchOnInput = remote?.searchOnInput === true;
  const normalizedSearchValue = searchValue.trim();
  const minimumSearchLength = Math.max(1, remote?.minimumSearchLength ?? 1);
  const canSearchRemotely = normalizedSearchValue.length >= minimumSearchLength;
  const cacheKey = remote
    ? searchOnInput
      ? `${remote.identifier}:${normalizedSearchValue}`
      : remote.identifier
    : "";

  const fetchForKey = useCallback(
    async (key: string, searchText: string | undefined, force = false) => {
      const optionsFn = remoteRef.current?.optionsFn;
      if (!optionsFn) return;
      if (!force && cacheRef.current.has(key)) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ items: [], error: null, fetching: true });

      for (let attempt = 0; ; attempt++) {
        try {
          const items = await optionsFn(searchText, controller.signal);
          if (controller.signal.aborted) return;
          cacheRef.current.set(key, items);
          setState({ items, error: null, fetching: false });
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          const status = getErrorStatusCode(error);
          if (attempt < MAX_ATTEMPTS - 1 && !NON_RETRYABLE_STATUS.has(status ?? -1)) continue;
          cacheRef.current.delete(key);
          setState({ items: [], error, fetching: false });
          return;
        }
      }
    },
    [],
  );

  // Swap the displayed state when the cache key changes (new remote or new search text).
  useEffect(() => {
    if (!remoteRef.current) return;
    const cached = cacheRef.current.get(cacheKey);
    setState({ items: cached ?? [], error: null, fetching: false });
  }, [cacheKey]);

  useEffect(() => {
    const current = remoteRef.current;
    if (!current) return;
    if (current.disableLazyFetch && current.searchOnInput !== true) {
      if (!cacheRef.current.has(cacheKey)) {
        void fetchForKey(cacheKey, undefined);
      }
      return;
    }
    if (!open) return;
    if (searchOnInput && !canSearchRemotely) return;
    const searchText = searchOnInput ? normalizedSearchValue : undefined;
    if (current.refreshOnOpen) {
      void fetchForKey(cacheKey, searchText, true);
      return;
    }
    if (!cacheRef.current.has(cacheKey)) {
      void fetchForKey(cacheKey, searchText);
    }
  }, [
    open,
    cacheKey,
    canSearchRemotely,
    searchOnInput,
    normalizedSearchValue,
    fetchForKey,
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    items: state.fetching ? ([] as T[]) : state.items,
    error: state.error,
    isLoading: state.fetching,
  };
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
  const {
    items: remoteItems,
    error: remoteError,
    isLoading,
  } = useRemoteOptions<T>(remote, searchValue, open);

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

  const { allOptions, allItems } = useMemo(() => {
    let opts: ComboboxOption<ComboboxValueType<T>>[] = [];
    let items: T[] | undefined;
    if (options && options.length > 0) {
      const list = options as T[];
      opts = list.map((item) => ({
        value: getRawValueFromItem(item, itemConfig.value),
        label: getLabelNode(item, itemConfig),
        searchableValue: buildSearchableValue(item, searchKeys),
      }));
      items = list;
    }

    if (remote && remoteItems.length > 0) {
      const list = remoteItems as T[];
      opts = list.map((item) => ({
        value: getRawValueFromItem(item, itemConfig.value),
        label: getLabelNode(item, itemConfig),
        searchableValue: buildSearchableValue(item, searchKeys),
      }));
      items = list;
    }
    return { allOptions: opts, allItems: items };
  }, [options, remoteItems, remote, itemConfig, searchKeys]);
  const isInitialRemoteLoading = Boolean(remote && isLoading && allOptions.length === 0);
  const paginationEnabled = Boolean(pagination);
  const serverPaginationEnabled = pagination?.mode === "server";
  const controlledSearchEnabled = paginationEnabled || remote?.searchOnInput === true;
  const paginationPageSize = pagination ? Math.max(1, pagination.pageSize) : 0;
  const [visibleOptionCount, setVisibleOptionCount] = useState(paginationPageSize);
  const filteredOptions = useMemo(() => {
    if (!paginationEnabled) return allOptions;
    if (serverPaginationEnabled) return allOptions;
    const query = searchValue.trim().toLowerCase();
    if (!query) return allOptions;
    return allOptions.filter((option) =>
      `${String(option.value)} ${option.searchableValue ?? ""}`.toLowerCase().includes(query),
    );
  }, [allOptions, paginationEnabled, searchValue, serverPaginationEnabled]);
  const effectiveVisibleOptionCount = Math.max(paginationPageSize, visibleOptionCount);
  const visibleOptions =
    paginationEnabled && !serverPaginationEnabled
      ? filteredOptions.slice(0, effectiveVisibleOptionCount)
      : filteredOptions;
  const hasMoreOptions = serverPaginationEnabled
    ? Boolean(pagination?.hasMore)
    : paginationEnabled && effectiveVisibleOptionCount < filteredOptions.length;

  const selectedOption = useMemo(() => {
    if (!isMulti)
      return allOptions.find((opt) => isSameComboboxValue(opt.value, valueSingle)) ?? null;
    return null;
  }, [allOptions, valueSingle, isMulti]);
  const resolvedSingleItem = useMemo(
    () =>
      selectedOption ? getItemByValue(String(selectedOption.value), allOptions, allItems) : null,
    [allItems, allOptions, selectedOption],
  );

  useEffect(() => {
    if (isMulti || !hasSingleValue(valueSingle)) return;
    if (resolvedSingleItem) onSelectedItemResolved?.(resolvedSingleItem);
  }, [isMulti, onSelectedItemResolved, resolvedSingleItem, valueSingle]);

  const selectedValues = useMemo((): ComboboxValueType<T>[] => {
    if (!isMulti) return [];
    return isControlled ? (Array.isArray(controlledValue) ? controlledValue : []) : internalMulti;
  }, [isMulti, isControlled, controlledValue, internalMulti]);
  const selectedItems = useMemo(
    () => (isMulti ? getItemsByValues(selectedValues, allOptions, allItems) : []),
    [isMulti, selectedValues, allOptions, allItems],
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

  const handleChange = (valueStr: string) => {
    const option = allOptions.find((o) => String(o.value) === valueStr);
    if (!option) return;

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
      onChange?.(next, getItemsByValues(next, allOptions, allItems));
    } else {
      const newValue = option.value;
      if (!isControlled) setInternalSingle(newValue);
      resetSearchState();
      setOpen(false);
      const selectedItem = getItemByValue(valueStr, allOptions, allItems);
      deferSingleSelectChange(() => {
        onChange?.(newValue as ComboboxValueType<T>, selectedItem);
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
      if (selectedItems.length < selectedValues.length && hasFallbackLabel(selectedFallbackLabel)) {
        return <FallbackLabel>{selectedFallbackLabel}</FallbackLabel>;
      }
      if (selectedValues.length === 1) {
        const item = selectedItems[0];
        if (!item) {
          if (hasFallbackLabel(selectedFallbackLabel)) {
            return <FallbackLabel>{selectedFallbackLabel}</FallbackLabel>;
          }
          return placeholder || "";
        }
        const buttonLabel = getButtonLabelNode(item, itemConfig, selectedItemConfig);
        const buttonStartNode = getButtonStartNode(item, itemConfig, selectedItemConfig);
        if (buttonStartNode) {
          return (
            <span className='flex min-w-0 items-center gap-2 py-0.5'>
              <span className='shrink-0 flex items-center'>{buttonStartNode}</span>
              <span className='min-w-0 truncate'>{buttonLabel}</span>
            </span>
          );
        }
        return <span className='min-w-0 truncate block'>{buttonLabel}</span>;
      }
      const maxVisibleItems = multipleConfig?.maxVisibleItems;
      const itemsToShow = maxVisibleItems ? selectedItems.slice(0, maxVisibleItems) : selectedItems;
      const itemsSeparator = selectedItemConfig?.multipleSeparator;
      const overflowCount =
        maxVisibleItems && selectedItems.length > maxVisibleItems
          ? selectedItems.length - maxVisibleItems
          : 0;

      return (
        <span
          className={cn(
            "flex min-w-0 max-w-full items-center overflow-hidden",
            !itemsSeparator && "gap-1",
          )}
        >
          {itemsToShow.map((item, index) => {
            const label = getButtonLabelNode(item, itemConfig, selectedItemConfig);
            const value = getValueFromItem(item, itemConfig.value);
            return (
              <span key={value} className='flex min-w-0 items-center'>
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
    if (!selectedOption) {
      if (hasSingleValue(valueSingle) && hasFallbackLabel(selectedFallbackLabel)) {
        return <FallbackLabel>{selectedFallbackLabel}</FallbackLabel>;
      }
      return placeholder || "";
    }
    const selectedItem = getItemByValue(String(selectedOption.value), allOptions, allItems);
    if (!selectedItem)
      return <span className='min-w-0 truncate block'>{selectedOption.label}</span>;
    const buttonLabel = getButtonLabelNode(selectedItem, itemConfig, selectedItemConfig);
    const buttonStartNode = getButtonStartNode(selectedItem, itemConfig, selectedItemConfig);
    if (buttonStartNode) {
      return (
        <span className='flex min-w-0 items-center gap-2 py-0.5'>
          <span className='shrink-0 flex items-center'>{buttonStartNode}</span>
          <span className='min-w-0 truncate'>{buttonLabel}</span>
        </span>
      );
    }
    return <span className='min-w-0 truncate block'>{buttonLabel}</span>;
  }, [
    isMulti,
    selectedOption,
    selectedValues,
    selectedItems,
    allOptions,
    allItems,
    itemConfig,
    selectedItemConfig,
    multipleConfig,
    placeholder,
    selectedFallbackLabel,
    valueSingle,
  ]);

  const buttonTitle = useMemo(() => {
    if (isMulti) {
      if (selectedValues.length > 0 && selectedItems.length < selectedValues.length) {
        return typeof selectedFallbackLabel === "string" ? selectedFallbackLabel : undefined;
      }
      if (selectedItems.length === 0) return undefined;
      const parts = selectedItems
        .map((item) => getButtonLabelPlainText(item, itemConfig, selectedItemConfig))
        .filter((value): value is string => Boolean(value));
      if (parts.length === 0) return undefined;
      return parts.join(selectedItemConfig?.multipleSeparator ?? ", ");
    }

    if (!selectedOption) {
      if (hasSingleValue(valueSingle)) {
        return typeof selectedFallbackLabel === "string" ? selectedFallbackLabel : undefined;
      }
      return undefined;
    }
    const selectedItem = getItemByValue(String(selectedOption.value), allOptions, allItems);
    if (!selectedItem) return undefined;
    return getButtonLabelPlainText(selectedItem, itemConfig, selectedItemConfig);
  }, [
    isMulti,
    selectedItems,
    selectedOption,
    selectedValues,
    allOptions,
    allItems,
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
                      value={`__clear__|||${clearOptionText}`}
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
                  {visibleOptions.map((option) => {
                    const valueStr = String(option.value);
                    const item = getItemByValue(valueStr, allOptions, allItems);
                    const optionDisabled =
                      item && itemConfig.isOptionDisabled
                        ? itemConfig.isOptionDisabled(item)
                        : false;
                    const startNode =
                      item && itemConfig.customStartNode ? itemConfig.customStartNode(item) : null;
                    const searchableValue = option.searchableValue || "";
                    const commandValue = searchableValue
                      ? `${valueStr}|||${searchableValue}`
                      : valueStr;
                    const actualValue = (v: string) => (v.includes("|||") ? v.split("|||")[0] : v);

                    if (isMulti) {
                      const checked = selectedValues.some((v) =>
                        isSameComboboxValue(v, option.value),
                      );
                      return (
                        <CommandItem
                          key={valueStr}
                          value={commandValue}
                          disabled={optionDisabled}
                          className={cn(
                            "min-w-0 cursor-pointer",
                            optionDisabled && "cursor-not-allowed",
                          )}
                          onSelect={(currentValue) => {
                            if (optionDisabled) return;
                            handleChange(actualValue(currentValue));
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
                        value={commandValue}
                        disabled={optionDisabled}
                        className={cn(
                          "min-w-0 cursor-pointer",
                          optionDisabled && "cursor-not-allowed",
                        )}
                        onSelect={(currentValue) => {
                          if (optionDisabled) return;
                          handleChange(actualValue(currentValue));
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
