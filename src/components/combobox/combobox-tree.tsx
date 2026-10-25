"use client";

import {
  buildItemMap,
  buildNestedFromFlat,
  COMBOBOX_TREE_CHILDREN_KEY,
  filterTree,
  getAllFolderValues,
  getItemByValue,
  getItemsByValues,
  getSelfAndDescendantValues,
} from "./combobox-tree-utils";
import {
  getButtonLabelNode,
  getRawValueFromItem,
  getValueFromItem,
} from "./combobox-utils";
import type { ComboboxTreeProps, ComboboxValueType, RemoteConfigTree } from "./combobox-types";
import {
  DEFAULT_REMOTE_ERROR_MESSAGE,
  MAX_ATTEMPTS,
  NON_RETRYABLE_STATUS,
  getErrorStatusCode,
} from "./combobox-remote-errors";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Loader2,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { TreeContent } from "./tree-content";

const DEFAULT_PLACEHOLDER = "Select...";
const DEFAULT_SEARCH_PLACEHOLDER = "Search...";
const DEFAULT_EMPTY_MESSAGE = "No results found";
const DEFAULT_LOADING_MESSAGE = "Loading...";
const DEFAULT_EXPAND_ALL_LABEL = "Expand all";
const DEFAULT_COLLAPSE_ALL_LABEL = "Collapse all";

interface RemoteState<T> {
  items: T[];
  error: unknown | null;
  fetching: boolean;
}

function useRemoteTreeOptions<T>(remote: RemoteConfigTree<T> | undefined, open: boolean) {
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  const [state, setState] = useState<RemoteState<T>>({ items: [], error: null, fetching: false });
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef(new Map<string, T[]>());

  const cacheKey = remote ? remote.identifier : "";
  const fetchRef = useCallback(async (force = false) => {
    const optionsFn = remoteRef.current?.optionsFn;
    const identifier = remoteRef.current?.identifier;
    if (!optionsFn || !identifier) return;
    if (!force && cacheRef.current.has(identifier)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ items: [], error: null, fetching: true });

    for (let attempt = 0; ; attempt++) {
      try {
        const items = await optionsFn(controller.signal);
        if (controller.signal.aborted) return;
        cacheRef.current.set(identifier, items);
        setState({ items, error: null, fetching: false });
        return;
      } catch (error) {
        if (controller.signal.aborted) return;
        const status = getErrorStatusCode(error);
        if (attempt < MAX_ATTEMPTS - 1 && !NON_RETRYABLE_STATUS.has(status ?? -1)) continue;
        cacheRef.current.delete(identifier);
        setState({ items: [], error, fetching: false });
        return;
      }
    }
  }, []);

  useEffect(() => {
    const current = remoteRef.current;
    if (!current) return;
    if (current.disableLazyFetch) {
      if (!cacheRef.current.has(cacheKey)) void fetchRef();
      return;
    }
    if (!open) return;
    if (current.refreshOnOpen) {
      void fetchRef(true);
      return;
    }
    if (!cacheRef.current.has(cacheKey)) void fetchRef();
  }, [open, cacheKey, fetchRef]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    items: state.fetching ? ([] as T[]) : state.items,
    error: state.error,
    isLoading: state.fetching,
  };
}

export function ComboboxTree<T>({
  value: controlledValue,
  onChange,
  data: dataProp,
  remote,
  menuItemConfig,
  selectedItemConfig,
  flatParentKey,
  rootParentValues,
  multiple,
  multipleConfig,
  placeholder: placeholderProp,
  searchPlaceholder: searchPlaceholderProp,
  emptyMessage: emptyMessageProp,
  loadingMessage: loadingMessageProp,
  remoteErrorMessage: remoteErrorMessageProp,
  label: labelProp,
  disabled,
  fullWidth,
  error,
  required,
  expandAllLabel: expandAllLabelProp,
  collapseAllLabel: collapseAllLabelProp,
  className,
  onBlur,
  onMaxSelectionReached,
}: ComboboxTreeProps<T>) {
  const placeholder = placeholderProp ?? DEFAULT_PLACEHOLDER;
  const searchPlaceholder = searchPlaceholderProp ?? DEFAULT_SEARCH_PLACEHOLDER;
  const emptyMessage = emptyMessageProp ?? DEFAULT_EMPTY_MESSAGE;
  const loadingMessage = loadingMessageProp ?? DEFAULT_LOADING_MESSAGE;
  const remoteErrorMessage = remoteErrorMessageProp ?? DEFAULT_REMOTE_ERROR_MESSAGE;
  const expandAllLabel = expandAllLabelProp ?? DEFAULT_EXPAND_ALL_LABEL;
  const collapseAllLabel = collapseAllLabelProp ?? DEFAULT_COLLAPSE_ALL_LABEL;

  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const [internalSingle, setInternalSingle] = useState("");
  const [internalMulti, setInternalMulti] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const { items: remoteItems, error: remoteError, isLoading } = useRemoteTreeOptions(remote, open);

  const data = useMemo(() => {
    if (remote) return remoteItems ?? [];
    return dataProp ?? [];
  }, [remote, remoteItems, dataProp]) as T[];

  const valueKey = menuItemConfig.value;
  const treeChildrenKey = COMBOBOX_TREE_CHILDREN_KEY as keyof T;
  const treeData = useMemo(() => {
    if (!flatParentKey) return data;
    return buildNestedFromFlat(data, valueKey, flatParentKey, rootParentValues);
  }, [data, valueKey, flatParentKey, rootParentValues]);
  const searchKeys = menuItemConfig.searchProperties ?? menuItemConfig.label;

  const isMulti = multiple === true;
  const isControlled = controlledValue !== undefined;

  const valueSingle = useMemo((): ComboboxValueType<T> | undefined => {
    if (isControlled)
      return Array.isArray(controlledValue) ? undefined : (controlledValue ?? undefined);

    if (internalSingle === "") return undefined;
    const item = getItemByValue(treeData, internalSingle, valueKey, treeChildrenKey);
    return item ? getRawValueFromItem(item, valueKey) : undefined;
  }, [isControlled, controlledValue, internalSingle, treeData, valueKey, treeChildrenKey]);

  const valueMulti = useMemo((): ComboboxValueType<T>[] => {
    if (isControlled) return Array.isArray(controlledValue) ? controlledValue : [];

    const items = getItemsByValues(treeData, internalMulti, valueKey, treeChildrenKey);
    return items.map((i) => getRawValueFromItem(i, valueKey));
  }, [isControlled, controlledValue, internalMulti, treeData, valueKey, treeChildrenKey]);

  const selectedIds = useMemo(() => {
    const ids = isMulti ? valueMulti.map(String) : valueSingle != null ? [String(valueSingle)] : [];
    return new Set(ids);
  }, [isMulti, valueSingle, valueMulti]);

  const itemMap = useMemo(
    () => buildItemMap(treeData, valueKey, treeChildrenKey),
    [treeData, valueKey, treeChildrenKey],
  );
  const { filteredData, searchExpandedIds } = useMemo(
    () => filterTree(treeData, searchQuery, valueKey, treeChildrenKey, searchKeys),
    [treeData, searchQuery, valueKey, treeChildrenKey, searchKeys],
  );

  const expandedIdsForRender = useMemo(
    () => (searchQuery.trim() ? new Set([...expandedIds, ...searchExpandedIds]) : expandedIds),
    [expandedIds, searchQuery, searchExpandedIds],
  );

  const selectedItems = useMemo(
    () =>
      isMulti
        ? getItemsByValues(treeData, valueMulti.map(String), valueKey, treeChildrenKey)
        : valueSingle != null
          ? ([getItemByValue(treeData, String(valueSingle), valueKey, treeChildrenKey)].filter(
              Boolean,
            ) as T[])
          : [],
    [treeData, isMulti, valueSingle, valueMulti, valueKey, treeChildrenKey],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (!isMulti) {
        if (!isControlled) setInternalSingle(id);
        const item = getItemByValue(treeData, id, valueKey, treeChildrenKey);
        const rawValue = item != null ? getRawValueFromItem(item, valueKey) : null;
        onChange?.(rawValue, item ? [item] : []);
        setOpen(false);
      }
    },
    [treeData, isControlled, isMulti, onChange, valueKey, treeChildrenKey],
  );

  const handleCheckChange = useCallback(
    (id: string, checked: boolean) => {
      if (!isMulti) return;
      const maxSelection = multipleConfig?.maxSelection;
      const current = valueMulti.map(String);
      const item = itemMap.get(id);
      const idsToApply = item ? getSelfAndDescendantValues(item, valueKey, treeChildrenKey) : [id];
      if (checked) {
        const toAdd = idsToApply.filter((x) => !current.includes(x));
        if (maxSelection != null && current.length + toAdd.length > maxSelection) {
          onMaxSelectionReached?.();
          return;
        }
      }
      const toRemove = new Set(idsToApply);
      const next = checked
        ? [...new Set([...current, ...idsToApply])]
        : current.filter((v) => !toRemove.has(v));
      if (!isControlled) setInternalMulti(next);
      const items = getItemsByValues(treeData, next, valueKey, treeChildrenKey);
      const typedNext = items.map((i) => getRawValueFromItem(i, valueKey));
      onChange?.(typedNext, items);
    },
    [
      treeData,
      isControlled,
      isMulti,
      itemMap,
      multipleConfig?.maxSelection,
      onChange,
      onMaxSelectionReached,
      valueKey,
      treeChildrenKey,
      valueMulti,
    ],
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setPortalContainer(
        triggerRef.current?.closest<HTMLElement>(
          '[data-slot="dialog-content"], [data-slot="sheet-content"]',
        ) ?? null,
      );
    }
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
      onBlur?.();
    }
  };

  const allFolderValues = useMemo(
    () => getAllFolderValues(treeData, valueKey, treeChildrenKey),
    [treeData, valueKey, treeChildrenKey],
  );

  const isAllExpanded =
    allFolderValues.length > 0 && expandedIdsForRender.size >= allFolderValues.length;
  const toggleExpandCollapse = () => {
    setExpandedIds(isAllExpanded ? new Set() : new Set(allFolderValues));
  };

  const handleToggleExpand = useCallback((nodeId: string, isOpen: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(nodeId);
      else next.delete(nodeId);
      return next;
    });
  }, []);

  const buttonContent = useMemo<ReactNode>(() => {
    if (selectedItems.length === 0) return placeholder;
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      return item ? getButtonLabelNode(item, menuItemConfig, selectedItemConfig) : placeholder;
    }
    const maxVisible = multipleConfig?.maxVisibleItems;
    const toShow = maxVisible ? selectedItems.slice(0, maxVisible) : selectedItems;
    const overflow =
      maxVisible && selectedItems.length > maxVisible ? selectedItems.length - maxVisible : 0;
    const itemsSeparator = selectedItemConfig?.multipleSeparator;
    return (
      <span className={cn("flex items-center flex-wrap", !itemsSeparator && "gap-1")}>
        {toShow.map((item, index) => (
          <span key={getValueFromItem(item, valueKey)} className='flex items-center'>
            {index > 0 && itemsSeparator != null && (
              <span className='mx-1 text-muted-foreground'>{itemsSeparator}</span>
            )}
            <span className='truncate max-w-28'>
              {getButtonLabelNode(item, menuItemConfig, selectedItemConfig)}
            </span>
          </span>
        ))}
        {overflow > 0 && <span className='text-muted-foreground ml-1'>+{overflow}</span>}
      </span>
    );
  }, [
    placeholder,
    selectedItems,
    multipleConfig?.maxVisibleItems,
    menuItemConfig,
    selectedItemConfig,
    valueKey,
  ]);

  return (
    <Fragment>
      {labelProp && (
        <Label htmlFor={generatedId} className='flex items-center gap-2'>
          {labelProp}
          {required && <span className='text-destructive'>*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type='button'
            id={generatedId}
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-invalid={error ? true : undefined}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            className={cn(
              "justify-between select-none h-9 min-h-9 max-h-9",
              fullWidth ? "w-full" : "min-w-70 w-max",
              error && "text-destructive! border-destructive!",
              className,
            )}
          >
            {buttonContent}
            {isLoading ? (
              <Loader2 className='ml-2 h-4 w-4 shrink-0 animate-spin' />
            ) : (
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          container={portalContainer}
          className={cn("p-0 w-(--radix-popover-trigger-width)")}
          align='start'
        >
          <div className='flex flex-col gap-2 p-2 border-b'>
            <div className='flex items-center gap-2'>
              <InputGroup className='flex-1 min-w-0'>
                <InputGroupInput
                  type='text'
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <InputGroupAddon align='inline-start'>
                  <Search />
                </InputGroupAddon>
                <InputGroupAddon align='inline-end' className='h-9 w-9 shrink-0'>
                  {allFolderValues.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type='button'
                          variant='link'
                          size='icon'
                          className=' text-muted-foreground'
                          onClick={toggleExpandCollapse}
                          aria-label={isAllExpanded ? collapseAllLabel : expandAllLabel}
                        >
                          {isAllExpanded ? (
                            <ListChevronsDownUp className='h-4 w-4' />
                          ) : (
                            <ListChevronsUpDown className='h-4 w-4' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAllExpanded ? collapseAllLabel : expandAllLabel}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <ScrollArea
            type='scroll'
            className='min-h-0 max-h-80 shrink-0 overflow-auto overscroll-contain'
            onWheel={(event) => event.stopPropagation()}
          >
            <TreeContent
              data={filteredData}
              itemMap={itemMap}
              expandedIds={expandedIdsForRender}
              onToggleExpand={handleToggleExpand}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              multiple={isMulti}
              onCheckChange={isMulti ? handleCheckChange : undefined}
              emptyMessage={
                isLoading ? loadingMessage : remoteError ? remoteErrorMessage : emptyMessage
              }
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              menuItemConfig={menuItemConfig}
              valueKey={valueKey}
              childrenKey={treeChildrenKey}
            />
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </Fragment>
  );
}
