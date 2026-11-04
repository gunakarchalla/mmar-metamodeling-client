// @vitest-environment jsdom
//
// A child added through a structural tab has to show up at once. The store pushes it
// into the live list on the selected object, which keeps that list's identity, and
// the table memoises its rows on identity — so these lists used to show the new child
// only after the tab was switched away from and back.
import { describe, it, expect, beforeEach } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { SceneType } from "@gds/models/meta/Metamodel_scenetypes.structure";
import StructuralTab from "./StructuralTab";
import { TAB_DEFINITIONS } from "../tab-definitions";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";

const store = () => useSelectedObjectStore.getState();
const listsOf = (label: string) => TAB_DEFINITIONS.find((tab) => tab.label === label)!.lists;

beforeEach(() => {
  cleanup();
  store().resetObjects();
});

describe.each([
  ["Classes", "Class"],
  ["RelationClasses", "RelationClass"],
  ["Ports", "Port"],
  ["Procedures", "Procedure"],
])("the scene type's %s tab", (label, childType) => {
  beforeEach(() => {
    store().setObjects([SceneType.fromJS({ uuid: "parent", name: "Parent" }) as SceneType], "SceneType");
    store().setObjects(
      [
        { uuid: "child-1", name: "First", description: "" },
        { uuid: "child-2", name: "Second", description: "" },
      ],
      childType,
    );
    store().setSelectedObject("parent");
    render(<StructuralTab lists={listsOf(label)} />);
  });

  it("shows each added child immediately", () => {
    act(() => store().addChild("child-1", childType));
    expect(screen.queryByText("First")).not.toBeNull();

    act(() => store().addChild("child-2", childType));
    expect(screen.queryByText("Second")).not.toBeNull();
  });

  it("drops a removed child immediately", () => {
    act(() => store().addChild("child-1", childType));
    act(() => store().removeChild("child-1", childType));
    expect(screen.queryByText("First")).toBeNull();
  });

  it("shows the list again after an undo and a redo", () => {
    act(() => store().addChild("child-1", childType));
    act(() => store().undo());
    expect(screen.queryByText("First")).toBeNull();
    act(() => store().redo());
    expect(screen.queryByText("First")).not.toBeNull();
  });
});
