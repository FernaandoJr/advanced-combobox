import type { ReactNode } from "react";
import type { MenuItemConfig, SelectedItemConfig } from "./types";

export interface BuildLabelOptions {
  separator?: string;
  disableSpaceBetween?: boolean;
}

export const DEFAULT_LABEL_SEPARATOR = " ";

/**
 * Obtém o valor de uma propriedade do item como string (para UI: Command, search, labels).
 * Se o valor for undefined ou null, retorna uma string vazia.
 */
export function getValueFromItem<T>(item: T, key: keyof T): string {
  const v = (item as Record<keyof T, unknown>)[key];
  return v !== undefined && v !== null ? String(v) : "";
}

/**
 * Obtém o valor bruto da propriedade do item (preserva tipo: number, string, etc.).
 * Usado para option.value no Combobox.
 */
export function getRawValueFromItem<T, K extends keyof T>(item: T, key: K): T[K] {
  return (item as Record<K, T[K]>)[key];
}

/**
 * Compara dois values de opção tolerando diferença de tipo (ex.: 3 vs "3").
 * Necessário porque o value controlado pode vir de um form/JSON como string
 * enquanto a opção mantém o tipo bruto (number, boolean, etc.).
 */
export function isSameComboboxValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

/**
 * Resolve o item T a partir do value selecionado (string vinda do Command).
 * Compara por String(o.value) === valueStr para suportar value tipado (number, string, etc.).
 */
export function getItemByValue<T, V>(
  valueStr: string,
  allOptions: { value: V }[],
  allItems: T[] | undefined,
): T | null {
  const idx = allOptions.findIndex((o) => String(o.value) === valueStr);
  if (idx < 0) return null;
  if (allItems) return allItems[idx] ?? null;
  return (allOptions[idx] as unknown as T) ?? null;
}

/**
 * Resolve itens T a partir de uma lista de values tipados. Mantém ordem de values.
 * Compara com isSameComboboxValue para suportar number, string, etc.
 */
export function getItemsByValues<T, V>(
  values: V[],
  allOptions: { value: V }[],
  allItems: T[] | undefined,
): T[] {
  const result: T[] = [];
  for (const v of values) {
    const idx = allOptions.findIndex((o) => isSameComboboxValue(o.value, v));
    if (idx >= 0 && allItems?.[idx] != null) result.push(allItems[idx]);
  }
  return result;
}

/**
 * Builds display label from item by joining values of the given keys.
 * By default separator is rendered with spaces (e.g. "-" becomes " - ").
 * Set disableSpaceBetween: true to use separator as-is (no spaces).
 */
export function buildLabelFromKeys<T>(
  item: T,
  keys: (keyof T)[],
  options: BuildLabelOptions = {},
): string {
  const { separator = DEFAULT_LABEL_SEPARATOR, disableSpaceBetween = false } = options;
  const parts = keys.map((key) => getValueFromItem(item, key));
  const joinStr = disableSpaceBetween
    ? separator
    : separator
      ? ` ${separator} `
      : DEFAULT_LABEL_SEPARATOR;
  return parts.join(joinStr);
}

/**
 * Builds a searchable string from item by joining values of the given keys.
 * Used for filtering/searching within the combobox.
 */
export function buildSearchableValue<T>(item: T, keys: (keyof T)[]): string {
  return keys
    .map((key) => getValueFromItem(item, key))
    .join(" ")
    .toLowerCase()
    .trim();
}

/**
 * Obtém o ReactNode do label para o botão quando um item está selecionado.
 * Prioridade:
 * 1. selectedItemConfig.customLabel
 * 2. selectedItemConfig.label (com buildLabelFromKeys)
 * 3. menuItemConfig.customLabel
 * 4. menuItemConfig.label (com buildLabelFromKeys)
 */
export function getButtonLabelNode<T>(
  item: T,
  menuConfig: MenuItemConfig<T>,
  selectedConfig?: SelectedItemConfig<T>,
): ReactNode {
  if (selectedConfig?.customLabel) {
    return selectedConfig.customLabel(item);
  }

  if (selectedConfig?.label) {
    return buildLabelFromKeys(item, selectedConfig.label, {
      separator: selectedConfig.separator ?? menuConfig.separator,
      disableSpaceBetween: selectedConfig.disableSpaceBetween ?? menuConfig.disableSpaceBetween,
    });
  }

  if (menuConfig.customLabel) {
    return menuConfig.customLabel(item);
  }

  return buildLabelFromKeys(item, menuConfig.label, {
    separator: menuConfig.separator,
    disableSpaceBetween: menuConfig.disableSpaceBetween,
  });
}

function getPlainTextFromNode(node: ReactNode): string | undefined {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  return undefined;
}

/**
 * Obtém o texto puro do label para uso em `title` no botão (tooltip nativo).
 * Mesma prioridade do getButtonLabelNode.
 */
export function getButtonLabelPlainText<T>(
  item: T,
  menuConfig: MenuItemConfig<T>,
  selectedConfig?: SelectedItemConfig<T>,
): string | undefined {
  if (selectedConfig?.customLabel) {
    return getPlainTextFromNode(selectedConfig.customLabel(item));
  }

  if (selectedConfig?.label) {
    return buildLabelFromKeys(item, selectedConfig.label, {
      separator: selectedConfig.separator ?? menuConfig.separator,
      disableSpaceBetween: selectedConfig.disableSpaceBetween ?? menuConfig.disableSpaceBetween,
    });
  }

  if (menuConfig.customLabel) {
    return getPlainTextFromNode(menuConfig.customLabel(item));
  }

  return buildLabelFromKeys(item, menuConfig.label, {
    separator: menuConfig.separator,
    disableSpaceBetween: menuConfig.disableSpaceBetween,
  });
}

/**
 * Obtém o ReactNode do startNode para o botão quando um item está selecionado.
 * Prioridade:
 * 1. selectedItemConfig.customStartNode (substitui o padrão)
 * 2. selectedItemConfig.disableStartNode === true → null
 * 3. menuItemConfig.customStartNode (padrão, se existir)
 */
export function getButtonStartNode<T>(
  item: T,
  menuConfig: MenuItemConfig<T>,
  selectedConfig?: SelectedItemConfig<T>,
): ReactNode | null {
  if (selectedConfig?.customStartNode) {
    return selectedConfig.customStartNode(item);
  }

  if (selectedConfig?.disableStartNode) {
    return null;
  }

  if (menuConfig.customStartNode) {
    return menuConfig.customStartNode(item);
  }

  return null;
}

/**
 * Obtém o ReactNode do label para o menu item.
 * Prioridade:
 * 1. itemConfig.customLabel
 * 2. itemConfig.label (com buildLabelFromKeys)
 */
export function getLabelNode<T>(item: T, itemConfig: MenuItemConfig<T>): ReactNode {
  if (itemConfig.customLabel) return itemConfig.customLabel(item);
  return buildLabelFromKeys(item, itemConfig.label, {
    separator: itemConfig.separator,
    disableSpaceBetween: itemConfig.disableSpaceBetween,
  });
}

