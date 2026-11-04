// @vitest-environment jsdom
//
// A table column's UI component belongs to the column (`has_table_attribute`), not to the
// attribute it shows. These pin that the list reads it from there and writes it back
// there: its rows are copies, so an edit made on a row would otherwise be lost. An
// attribute's UI component is on the attribute's own row.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import ParentChildSelect from "./ParentChildSelect";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";

function column(uiComponent: string, facets = "") {
  return {
    sequence: 1,
    ui_component: uiComponent,
    attribute: { uuid: "attribute-1", name: "Product", description: "", facets, ui_component: "text" },
  };
}

const commitSelected = vi.fn();

beforeEach(() => {
  cleanup();
  commitSelected.mockClear();
  useSelectedObjectStore.setState({ commitSelected } as never);
});

describe("ParentChildSelect with table columns", () => {
  it("shows the column's UI component, not the attribute's", () => {
    render(<ParentChildSelect childType="Column" items={[column("button")]} />);

    expect(screen.getByRole("combobox").textContent).toContain("Button");
  });

  it("writes a change to the column itself", () => {
    const columns = [column("text")];
    render(<ParentChildSelect childType="Column" items={columns} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Button" }));

    expect(columns[0].ui_component).toBe("button");
    expect(columns[0].attribute.ui_component).toBe("text");
    expect(commitSelected).toHaveBeenCalledTimes(1);
  });
});

describe("ParentChildSelect with attributes", () => {
  function attribute(uiComponent: string, facets = "") {
    return { uuid: "attribute-2", name: "onUpdate", description: "", facets, sequence: 1, ui_component: uiComponent };
  }

  it("offers Multi-line for an attribute without facets, and writes it to the attribute", () => {
    const attributes = [attribute("text")];
    render(<ParentChildSelect childType="Attribute" items={attributes} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Multi-line" }));

    expect(attributes[0].ui_component).toBe("multi-line");
    expect(commitSelected).toHaveBeenCalledTimes(1);
  });

  it("disables Multi-line for an attribute with facets, whose value comes from a fixed set", () => {
    render(<ParentChildSelect childType="Attribute" items={[attribute("dropdown", "a|b")]} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));

    expect(within(screen.getByRole("listbox")).getByRole("option", { name: "Multi-line" }).getAttribute("aria-disabled")).toBe("true");
  });

  // None and the read-only options let the user pick nothing, so facets do not matter.
  it.each([
    ["without facets", ""],
    ["with facets", "a|b"],
  ])("offers None and both read-only options for an attribute %s", (_label, facets) => {
    render(<ParentChildSelect childType="Attribute" items={[attribute(facets ? "dropdown" : "text", facets)]} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const listbox = within(screen.getByRole("listbox"));

    for (const name of ["None", "Text (read only)", "Multi-line (read only)"]) {
      expect(listbox.getByRole("option", { name }).getAttribute("aria-disabled")).not.toBe("true");
    }
  });

  it.each([
    ["None", "none"],
    ["Text (read only)", "text-readonly"],
    ["Multi-line (read only)", "multi-line-readonly"],
  ])("writes %s to the attribute as %s", (name, stored) => {
    const attributes = [attribute("text")];
    render(<ParentChildSelect childType="Attribute" items={attributes} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name }));

    expect(attributes[0].ui_component).toBe(stored);
    expect(commitSelected).toHaveBeenCalledTimes(1);
  });

  it("shows a stored read-only UI component by its label", () => {
    render(<ParentChildSelect childType="Attribute" items={[attribute("multi-line-readonly")]} />);

    expect(screen.getByRole("combobox").textContent).toContain("Multi-line (read only)");
  });
});

describe("ParentChildSelect with table columns and the new UI components", () => {
  it("writes None to the column, which hides it in the modelling client", () => {
    const columns = [column("text")];
    render(<ParentChildSelect childType="Column" items={columns} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "None" }));

    expect(columns[0].ui_component).toBe("none");
    expect(columns[0].attribute.ui_component).toBe("text");
  });
});
