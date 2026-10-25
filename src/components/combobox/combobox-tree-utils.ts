import { buildSearchableValue, getValueFromItem } from "./combobox-utils";

/** Internal synthetic children key after `buildNestedFromFlat` (not part of flat row shape). */
export const COMBOBOX_TREE_CHILDREN_KEY = "children";

function isRootParentString(parentStr: string, rootExtra: ReadonlySet<string>): boolean {
  return parentStr === "" || rootExtra.has(parentStr);
}

/** Walks flat parent links upward from `startId`; returns true if `childId` is reached (cycle / child is ancestor of proposed parent). */
function flatParentChainReaches<T>(
  itemsById: Map<string, T>,
  startId: string,
  childId: string,
  parentKey: keyof T,
  rootExtra: ReadonlySet<string>,
): boolean {
  let cur = startId;
  const visited = new Set<string>();
  while (true) {
    if (cur === childId) return true;
    if (visited.has(cur)) return true;
    visited.add(cur);
    const node = itemsById.get(cur);
    if (!node) return false;
    const p = getValueFromItem(node, parentKey);
    if (isRootParentString(p, rootExtra)) return false;
    cur = p;
  }
}

/**
 * Builds a nested tree from a flat list using `flatParentKey`. Ignores any existing `children` on rows.
 * Rows are shallow-copied with synthetic `children` arrays. `valueKey` values must be unique.
 * Roots and siblings keep the order rows first appear in `flat` (Map insertion order).
 */
export function buildNestedFromFlat<T>(
  flat: T[],
  valueKey: keyof T,
  flatParentKey: keyof T,
  rootParentValues?: readonly string[],
): T[] {
  const childrenKey = COMBOBOX_TREE_CHILDREN_KEY as keyof T;
  const rootExtra = new Set((rootParentValues ?? []).map(String));
  const itemsById = new Map<string, T>();
  let duplicateWarned = false;

  for (const item of flat) {
    const id = getValueFromItem(item, valueKey);
    if (itemsById.has(id)) {
      if (process.env.NODE_ENV !== "production" && !duplicateWarned) {
        console.warn(
          "[ComboboxTree] Duplicate valueKey in flat data; later rows are skipped.",
        );
        duplicateWarned = true;
      }
      continue;
    }
    itemsById.set(id, item);
  }

  type Node = T & Record<string, unknown>;

  const nodes = new Map<string, Node>();
  for (const id of itemsById.keys()) {
    const item = itemsById.get(id)!;
    const shell = { ...item } as Record<string, unknown>;
    shell[String(childrenKey)] = [] as Node[];
    nodes.set(id, shell as Node);
  }

  let orphanWarned = false;

  const effectiveParentId = (id: string): string | null => {
    const item = itemsById.get(id);
    if (!item) return null;
    const parentStr = getValueFromItem(item, flatParentKey);
    if (isRootParentString(parentStr, rootExtra)) return null;
    if (parentStr === id) {
      if (process.env.NODE_ENV !== "production" && !orphanWarned) {
        console.warn("[ComboboxTree] flat tree: self-parent row promoted to root.", id);
        orphanWarned = true;
      }
      return null;
    }
    if (!itemsById.has(parentStr)) {
      if (process.env.NODE_ENV !== "production" && !orphanWarned) {
        console.warn("[ComboboxTree] flat tree: missing parent; row promoted to root.", id);
        orphanWarned = true;
      }
      return null;
    }
    if (flatParentChainReaches(itemsById, parentStr, id, flatParentKey, rootExtra)) {
      if (process.env.NODE_ENV !== "production" && !orphanWarned) {
        console.warn("[ComboboxTree] flat tree: cycle prevented; row promoted to root.", id);
        orphanWarned = true;
      }
      return null;
    }
    return parentStr;
  };

  const rootIds: string[] = [];
  for (const id of itemsById.keys()) {
    if (effectiveParentId(id) === null) rootIds.push(id);
  }

  for (const id of itemsById.keys()) {
    const pid = effectiveParentId(id);
    if (pid === null) continue;
    const parentNode = nodes.get(pid);
    const childNode = nodes.get(id);
    if (parentNode && childNode) {
      (parentNode[childrenKey as string] as Node[]).push(childNode);
    }
  }

  // Sibling and root order follow `flat` / Map insertion order (no re-sort).
  const roots = rootIds.map((rid) => nodes.get(rid)!).filter(Boolean);
  return roots as T[];
}

export function getChildren<T>(item: T, childrenKey: keyof T): T[] | undefined {
  const children = (item as Record<keyof T, unknown>)[childrenKey];
  return Array.isArray(children) ? (children as T[]) : undefined;
}

export function getItemByValue<T>(
  items: T[],
  value: string,
  valueKey: keyof T,
  childrenKey: keyof T,
): T | null {
  for (const item of items) {
    if (getValueFromItem(item, valueKey) === value) return item;
    const children = getChildren(item, childrenKey);
    if (children?.length) {
      const found = getItemByValue(children, value, valueKey, childrenKey);
      if (found) return found;
    }
  }
  return null;
}

export function getItemsByValues<T>(
  items: T[],
  values: string[],
  valueKey: keyof T,
  childrenKey: keyof T,
): T[] {
  const result: T[] = [];
  for (const v of values) {
    const item = getItemByValue(items, v, valueKey, childrenKey);
    if (item) result.push(item);
  }
  return result;
}

export function buildItemMap<T>(
  items: T[],
  valueKey: keyof T,
  childrenKey: keyof T,
): Map<string, T> {
  const map = new Map<string, T>();
  const processItem = (item: T) => {
    map.set(getValueFromItem(item, valueKey), item);
    getChildren(item, childrenKey)?.forEach(processItem);
  };
  items.forEach(processItem);
  return map;
}

export function getAllFolderValues<T>(
  items: T[],
  valueKey: keyof T,
  childrenKey: keyof T,
): string[] {
  let ids: string[] = [];
  items.forEach((item) => {
    const children = getChildren(item, childrenKey);
    if (children?.length) {
      ids.push(getValueFromItem(item, valueKey));
      ids = [...ids, ...getAllFolderValues(children, valueKey, childrenKey)];
    }
  });
  return ids;
}

export function getSelfAndDescendantValues<T>(
  item: T,
  valueKey: keyof T,
  childrenKey: keyof T,
): string[] {
  const ids = [getValueFromItem(item, valueKey)];
  getChildren(item, childrenKey)?.forEach((child) => {
    ids.push(...getSelfAndDescendantValues(child, valueKey, childrenKey));
  });
  return ids;
}

export function getCheckState<T>(
  item: T,
  itemMap: Map<string, T>,
  selectedIds: Set<string>,
  valueKey: keyof T,
  childrenKey: keyof T,
): "checked" | "unchecked" | "indeterminate" {
  const itemValue = getValueFromItem(item, valueKey);
  const originalItem = itemMap.get(itemValue);
  if (!originalItem) return "unchecked";

  const children = getChildren(originalItem, childrenKey);
  if (!children?.length) {
    return selectedIds.has(itemValue) ? "checked" : "unchecked";
  }

  let checkedCount = 0;
  let indeterminateCount = 0;
  children.forEach((child) => {
    const childState = getCheckState(child, itemMap, selectedIds, valueKey, childrenKey);
    if (childState === "checked") checkedCount++;
    if (childState === "indeterminate") indeterminateCount++;
  });
  const total = children.length;
  if (checkedCount === total) return "checked";
  if (checkedCount > 0 || indeterminateCount > 0) return "indeterminate";
  return "unchecked";
}

export function filterTree<T>(
  items: T[],
  searchQuery: string,
  valueKey: keyof T,
  childrenKey: keyof T,
  searchKeys: (keyof T)[],
): { filteredData: T[]; searchExpandedIds: Set<string> } {
  if (!searchQuery.trim()) {
    return { filteredData: items, searchExpandedIds: new Set<string>() };
  }
  const searchLower = searchQuery.toLowerCase();
  const newExpandedIds = new Set<string>();

  const itemMatches = (item: T): boolean => {
    const searchable = buildSearchableValue(item, searchKeys);
    if (searchable.includes(searchLower)) return true;
    return getChildren(item, childrenKey)?.some(itemMatches) ?? false;
  };

  const filter = (list: T[]): T[] =>
    list
      .map((item) => {
        const children = getChildren(item, childrenKey);
        if (!children?.length) return itemMatches(item) ? item : null;
        const filteredChildren = filter(children);
        if (filteredChildren.length > 0 || itemMatches(item)) {
          newExpandedIds.add(getValueFromItem(item, valueKey));
          return { ...item, [childrenKey]: filteredChildren } as T;
        }
        return null;
      })
      .filter((x): x is T => x !== null);

  return { filteredData: filter(items), searchExpandedIds: newExpandedIds };
}
