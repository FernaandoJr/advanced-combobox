"use client";

import { getLabelNode, getValueFromItem } from "./combobox-utils";
import type { MenuItemConfig } from "./combobox-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2 } from "lucide-react";
import { Fragment, useMemo } from "react";
import { getCheckState, getChildren } from "./combobox-tree-utils";

export interface TreeContentProps<T> {
  data: T[];
  itemMap: Map<string, T>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string, isOpen: boolean) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  multiple?: boolean;
  onCheckChange?: (id: string, checked: boolean) => void;
  emptyMessage: string;
  isLoading?: boolean;
  loadingMessage?: string;
  menuItemConfig: MenuItemConfig<T>;
  valueKey: keyof T;
  childrenKey: keyof T;
}

interface TreeItemProps<T> {
  item: T;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string, isOpen: boolean) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  multiple?: boolean;
  onCheckChange?: (id: string, checked: boolean) => void;
  itemMap: Map<string, T>;
  menuItemConfig: MenuItemConfig<T>;
  valueKey: keyof T;
  childrenKey: keyof T;
}

function TreeItem<T>({
  item,
  depth,
  expandedIds,
  onToggleExpand,
  selectedIds,
  onSelect,
  multiple,
  onCheckChange,
  itemMap,
  menuItemConfig,
  valueKey,
  childrenKey,
}: TreeItemProps<T>) {
  const itemValue = getValueFromItem(item, valueKey);
  const isOpen = expandedIds.has(itemValue);
  const children = getChildren(item, childrenKey);
  const isSelectable = !menuItemConfig.isOptionDisabled?.(item);

  const checkState = useMemo(
    () => (multiple ? getCheckState(item, itemMap, selectedIds, valueKey, childrenKey) : null),
    [item, itemMap, multiple, selectedIds, valueKey, childrenKey],
  );

  const hasChildren = (children?.length ?? 0) > 0;

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("[role='checkbox']")
    )
      return;
    if (!isSelectable) {
      if (hasChildren) onToggleExpand(itemValue, !isOpen);
      return;
    }
    if (multiple) {
      const newChecked = checkState !== "checked";
      onCheckChange?.(itemValue, newChecked);
    } else {
      onSelect(itemValue);
    }
  };

  const rowContent = (
    <div className='flex items-center gap-2 flex-1 min-w-0'>
      {hasChildren ? (
        <Fragment>
          <Collapsible open={isOpen} onOpenChange={(open) => onToggleExpand(itemValue, open)}>
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button type='button' variant='ghost' size='icon' className='h-6 w-6 shrink-0'>
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")}
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          {multiple && isSelectable && (
            <div onClick={(e) => e.stopPropagation()} className='shrink-0'>
              <Checkbox
                checked={
                  checkState === "checked"
                    ? true
                    : checkState === "indeterminate"
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(checked) => onCheckChange?.(itemValue, checked === true)}
              />
            </div>
          )}
        </Fragment>
      ) : (
        <span className='w-6 shrink-0' />
      )}
      {!hasChildren && multiple && isSelectable && (
        <div onClick={(e) => e.stopPropagation()} className='shrink-0'>
          <Checkbox
            checked={selectedIds.has(itemValue)}
            onCheckedChange={(checked) => onCheckChange?.(itemValue, checked === true)}
          />
        </div>
      )}
      {menuItemConfig.customStartNode && (
        <span className='shrink-0'>{menuItemConfig.customStartNode(item)}</span>
      )}
      <span className='truncate text-sm font-normal'>{getLabelNode(item, menuItemConfig)}</span>
    </div>
  );

  return (
    <div className='flex flex-col'>
      <div
        data-tree-item
        data-id={itemValue}
        data-depth={depth}
        className={cn("select-none cursor-pointer rounded px-1 flex items-center h-8")}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={handleRowClick}
      >
        {rowContent}
      </div>
      {hasChildren ? (
        <Collapsible open={isOpen} onOpenChange={(open) => onToggleExpand(itemValue, open)}>
          <CollapsibleContent>
            {children!.map((child) => (
              <TreeItem
                key={getValueFromItem(child, valueKey)}
                item={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                selectedIds={selectedIds}
                onSelect={onSelect}
                multiple={multiple}
                onCheckChange={onCheckChange}
                itemMap={itemMap}
                menuItemConfig={menuItemConfig}
                valueKey={valueKey}
                childrenKey={childrenKey}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

export function TreeContent<T>({
  data,
  itemMap,
  expandedIds,
  onToggleExpand,
  selectedIds,
  onSelect,
  multiple,
  onCheckChange,
  emptyMessage,
  isLoading,
  loadingMessage,
  menuItemConfig,
  valueKey,
  childrenKey,
}: TreeContentProps<T>) {
  if (data.length === 0) {
    const message = isLoading && loadingMessage ? loadingMessage : emptyMessage;
    return (
      <div
        className='flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground'
        role={isLoading ? "status" : undefined}
      >
        {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
        <span>{message}</span>
      </div>
    );
  }
  return (
    <div className='py-1'>
      {data.map((item) => (
        <TreeItem
          key={getValueFromItem(item, valueKey)}
          item={item}
          depth={0}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          selectedIds={selectedIds}
          onSelect={onSelect}
          multiple={multiple}
          onCheckChange={onCheckChange}
          itemMap={itemMap}
          menuItemConfig={menuItemConfig}
          valueKey={valueKey}
          childrenKey={childrenKey}
        />
      ))}
    </div>
  );
}
