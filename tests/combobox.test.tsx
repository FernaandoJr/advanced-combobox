import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { Combobox } from "@/components/combobox";
import type { ComboboxProps } from "@/components/combobox/combobox-types";

interface TableOption {
  qualifiedName: string;
  owner: string;
  name: string;
}

const tables = Array.from({ length: 75 }, (_, index) => ({
  qualifiedName: `FURLAN.TABLE_${String(index).padStart(2, "0")}`,
  owner: "FURLAN",
  name: `TABLE_${String(index).padStart(2, "0")}`,
}));

describe("Combobox pagination", () => {
  function renderTableCombobox() {
    render(
      <Combobox
        label='Root table'
        options={tables}
        menuItemConfig={{
          value: "qualifiedName",
          label: ["qualifiedName"],
          searchProperties: ["qualifiedName", "owner", "name"],
        }}
        searchInput
        searchPlaceholder='Search table'
        pagination={{ pageSize: 50, loadMoreLabel: "Load more tables" }}
      />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Root table" }));
  }

  test("renders one page and loads the next page on demand", async () => {
    renderTableCombobox();

    expect(screen.getByText("FURLAN.TABLE_49")).toBeTruthy();
    expect(screen.queryByText("FURLAN.TABLE_50")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Load more tables" }));

    expect(await screen.findByText("FURLAN.TABLE_50")).toBeTruthy();
    expect(await screen.findByText("FURLAN.TABLE_74")).toBeTruthy();
  });

  test("searches the complete option list before applying pagination", () => {
    renderTableCombobox();

    fireEvent.change(screen.getByPlaceholderText("Search table"), {
      target: { value: "TABLE_74" },
    });

    expect(screen.getByText("FURLAN.TABLE_74")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load more tables" })).toBeNull();
  });

  test("delegates search and pagination when configured in server mode", () => {
    const onSearchChange = vi.fn();
    const onLoadMore = vi.fn();

    render(
      <Combobox
        label='Root table'
        options={tables.slice(0, 2)}
        menuItemConfig={{
          value: "qualifiedName",
          label: ["qualifiedName"],
        }}
        searchInput
        searchPlaceholder='Search table'
        pagination={{
          mode: "server",
          pageSize: 50,
          hasMore: true,
          loadMoreLabel: "Load more tables",
          onSearchChange,
          onLoadMore,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Root table" }));
    fireEvent.change(screen.getByPlaceholderText("Search table"), {
      target: { value: "physical-table-alias" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load more tables" }));

    expect(screen.getByText("FURLAN.TABLE_00")).toBeTruthy();
    expect(screen.getByText("FURLAN.TABLE_01")).toBeTruthy();

    fireEvent.click(screen.getByText("FURLAN.TABLE_01"));

    expect(onSearchChange).toHaveBeenCalledWith("physical-table-alias");
    expect(onSearchChange).toHaveBeenLastCalledWith("");
    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});

describe("Combobox remote search", () => {
  test("requests options with the current search text instead of filtering one remote page", async () => {
    const optionsFn = vi.fn(async (searchValue?: string) => [
      { code: "city-1", displayName: `${searchValue} - SP` },
    ]);

    render(
      <Combobox
        label='City'
        remote={{ identifier: "context-cities", optionsFn, searchOnInput: true }}
        menuItemConfig={{ value: "code", label: ["displayName"] }}
        searchInput
        searchPlaceholder='Search city'
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "City" }));
    expect(optionsFn).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Search city"), {
      target: { value: "MIGUELÓPOLIS" },
    });

    expect(await screen.findByText("MIGUELÓPOLIS - SP")).toBeTruthy();
    expect(optionsFn).toHaveBeenCalledWith("MIGUELÓPOLIS", expect.any(AbortSignal));
  });

  test("caches remote options per identifier so reopening does not fetch again", async () => {
    const optionsFn = vi.fn(async () => [{ code: "city-1", displayName: "Campinas - SP" }]);

    render(
      <Combobox
        label='City'
        remote={{ identifier: "cached-cities", optionsFn }}
        menuItemConfig={{ value: "code", label: ["displayName"] }}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "City" });
    fireEvent.click(trigger);
    expect(await screen.findByText("Campinas - SP")).toBeTruthy();
    expect(optionsFn).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(trigger, { key: "Escape" });
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    fireEvent.click(trigger);
    expect(await screen.findByText("Campinas - SP")).toBeTruthy();
    expect(optionsFn).toHaveBeenCalledTimes(1);
  });

  test("refreshes on open when configured and shows the remote error message", async () => {
    const optionsFn = vi
      .fn()
      .mockResolvedValueOnce([{ code: "reference", name: "Permitted reference" }])
      .mockRejectedValueOnce({ status: 403 });

    render(
      <Combobox
        label='Reference'
        remote={{ identifier: "reference", optionsFn, refreshOnOpen: true }}
        menuItemConfig={{ value: "code", label: ["name"] }}
        showClearOption
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Reference" });
    fireEvent.click(trigger);
    expect(await screen.findByText("Permitted reference")).toBeTruthy();
    fireEvent.keyDown(trigger, { key: "Escape" });
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    fireEvent.click(trigger);
    expect(
      await screen.findByText(/Could not load the options\. Close and reopen/),
    ).toBeTruthy();
    expect(screen.queryByText("Permitted reference")).toBeNull();
    expect(optionsFn).toHaveBeenCalledTimes(2);
  });
});

interface KindOption {
  value: number;
  label: string;
}

const kinds: KindOption[] = [
  { value: 1, label: "Venda" },
  { value: 2, label: "Bonificação" },
  { value: 3, label: "Devolução" },
];

describe("Combobox selection with mixed value types", () => {
  function renderKindCombobox(value: unknown, onChange = vi.fn()) {
    render(
      <Combobox
        label='Kind'
        options={kinds}
        menuItemConfig={{ value: "value", label: ["label"] }}
        multiple
        value={value as number[]}
        onChange={onChange}
      />,
    );
    return onChange;
  }

  test("marks numeric options as checked when the controlled value holds strings", () => {
    renderKindCombobox(["3", "2"]);

    const trigger = screen.getByRole("combobox", { name: "Kind" });
    expect(trigger.textContent).toContain("Devolução");
    expect(trigger.textContent).toContain("Bonificação");

    fireEvent.click(trigger);

    const checkboxes = [...document.querySelectorAll('[data-slot="checkbox"]')];
    expect(checkboxes.map((item) => item.getAttribute("data-state"))).toEqual([
      "unchecked",
      "checked",
      "checked",
    ]);
  });

  test("removes instead of duplicating when the selected value type differs", () => {
    const onChange = renderKindCombobox(["3", "2"]);

    fireEvent.click(screen.getByRole("combobox", { name: "Kind" }));
    fireEvent.click(screen.getByRole("option", { name: "Devolução" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual(["2"]);
  });

  test("keeps a single entry per option when adding a value", () => {
    const onChange = renderKindCombobox(["2"]);

    fireEvent.click(screen.getByRole("combobox", { name: "Kind" }));
    fireEvent.click(screen.getByRole("option", { name: "Venda" }));

    expect(onChange.mock.calls[0][0]).toEqual(["2", 1]);
  });

  test("keeps long multiple selections constrained to a full-width parent", () => {
    render(
      <div className='w-48'>
        <Combobox
          fullWidth
          multiple
          value={[1, 2, 3]}
          options={kinds}
          menuItemConfig={{ value: "value", label: ["label"] }}
        />
      </div>,
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger.className).toContain("max-w-full");
    expect(trigger.parentElement?.className).toContain("max-w-full");
    expect(trigger.firstElementChild?.className).toContain("max-w-full");
    expect(trigger.firstElementChild?.className).toContain("overflow-hidden");
  });
});

interface PermissionOption {
  code: string;
  name: string;
}

const permissions: PermissionOption[] = [{ code: "sale-order.edit", name: "Edit sale order" }];

describe("Combobox inline clear button", () => {
  function renderPermissionCombobox({
    value,
    disabled = false,
  }: {
    value?: string;
    disabled?: boolean;
  }) {
    const onChange = vi.fn<NonNullable<ComboboxProps<PermissionOption>["onChange"]>>();

    render(
      <Combobox
        label='Permission'
        options={permissions}
        menuItemConfig={{ value: "code", label: ["name"] }}
        value={value}
        disabled={disabled}
        showClearButton
        onChange={onChange}
      />,
    );

    return onChange;
  }

  test("clears a selected value without opening the options", async () => {
    const onChange = renderPermissionCombobox({ value: "sale-order.edit" });

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null, null));
    expect(screen.getByRole("combobox", { name: "Permission" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(screen.queryByRole("option")).toBeNull();
  });

  test("allows an unresolved persisted value to be cleared", () => {
    renderPermissionCombobox({ value: "persisted-permission" });

    expect(screen.getByRole("button", { name: "Clear selection" })).toBeTruthy();
  });

  test("does not show the clear button without a selection", () => {
    renderPermissionCombobox({});

    expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
  });

  test("does not show the clear button for a disabled selection", () => {
    renderPermissionCombobox({ value: "sale-order.edit", disabled: true });

    expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
  });
});
