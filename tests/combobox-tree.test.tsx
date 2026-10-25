import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ComboboxTree } from "@/components/combobox";
import { userClick } from "./helpers";

interface RegionRow {
  code: string;
  name: string;
  parentCode?: string;
}

const regions: RegionRow[] = [
  { code: "BR", name: "Brazil", parentCode: "" },
  { code: "SP", name: "São Paulo", parentCode: "BR" },
  { code: "PR", name: "Paraná", parentCode: "BR" },
  { code: "CUR", name: "Curitiba", parentCode: "PR" },
];

function renderRegions(
  props: Partial<Parameters<typeof ComboboxTree<RegionRow>>[0]> = {},
  onChange = vi.fn(),
) {
  render(
    <ComboboxTree<RegionRow>
      data={regions}
      flatParentKey='parentCode'
      menuItemConfig={{ value: "code", label: ["name"] }}
      searchPlaceholder='Search region'
      onChange={onChange}
      {...props}
    />,
  );
  return onChange;
}

function openTree(name = "Region") {
  fireEvent.click(screen.getByRole("combobox", { name }));
}

describe("ComboboxTree", () => {
  test("selects a leaf after expanding its ancestors", async () => {
    const onChange = renderRegions({ label: "Region" });
    openTree();

    expect(screen.queryByText("São Paulo")).toBeNull();

    fireEvent.click(document.querySelector('[data-tree-item][data-id="BR"] button')!);
    expect(screen.getByText("São Paulo")).toBeTruthy();

    fireEvent.click(screen.getByText("São Paulo"));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [value, items] = onChange.mock.calls[0];
    expect(value).toBe("SP");
    expect(items.map((item: RegionRow) => item.name)).toEqual(["São Paulo"]);
    expect(
      screen.getByRole("combobox", { name: "Region" }).textContent,
    ).toContain("São Paulo");
  });

  test("cascades parent selection to all descendants in multiple mode", async () => {
    const onChange = renderRegions({ label: "Region", multiple: true });
    openTree();

    await userClick(
      document.querySelector('[data-tree-item][data-id="BR"] [role="checkbox"]')!,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [value, items] = onChange.mock.calls[0];
    expect(value).toEqual(["BR", "SP", "PR", "CUR"]);
    expect(items.map((item: RegionRow) => item.name)).toEqual([
      "Brazil",
      "São Paulo",
      "Paraná",
      "Curitiba",
    ]);
  });

  test("search keeps only the matching branch and expands parents automatically", async () => {
    renderRegions({ label: "Region" });
    openTree();

    fireEvent.change(screen.getByPlaceholderText("Search region"), {
      target: { value: "São Paulo" },
    });

    expect(screen.getByText("São Paulo")).toBeTruthy();
    expect(screen.queryByText("Paraná")).toBeNull();
    expect(screen.queryByText("Curitiba")).toBeNull();
  });

  test("renders an already nested tree without flatParentKey", () => {
    const nested = [
      {
        code: "BR",
        name: "Brazil",
        children: [{ code: "SP", name: "São Paulo", children: [] }],
      },
    ];

    render(
      <ComboboxTree<{ code: string; name: string; children?: unknown[] }>
        label='Region'
        data={nested}
        menuItemConfig={{ value: "code", label: ["name"] }}
      />,
    );
    openTree("Region");

    expect(screen.getByText("Brazil")).toBeTruthy();
  });
});
