import { describe, it, expect, beforeEach } from "vitest";
import { selectCanRedo, selectCanUndo, useSelectedObjectStore } from "./selectedObjectStore";
import { SceneType } from "@gds/models/meta/Metamodel_scenetypes.structure";
import { Class } from "@gds/models/meta/Metamodel_classes.structure";
import { AttributeType } from "@gds/models/meta/Metamodel_attributetypes.structure";
import { Attribute } from "@gds/models/meta/Metamodel_attributes.structure";
import { Relationclass } from "@gds/models/meta/Metamodel_relationclasses.structure";
import { useEditorStore } from "./editorStore";

const reset = () => useSelectedObjectStore.getState().resetObjects();

describe("selectedObjectStore.getTypeFromUuid round-trip", () => {
  beforeEach(reset);

  it("resolves the type for a uuid present in a collection", () => {
    const store = useSelectedObjectStore.getState();
    const st = SceneType.fromJS({ uuid: "abc-123", name: "Test" }) as SceneType;
    store.setObjects([st], "SceneType");
    expect(store.getTypeFromUuid("abc-123")).toBe("SceneType");
    expect(store.getObjectFromUuid("abc-123")).toBe(st);
  });

  it("returns null for an unknown uuid", () => {
    expect(useSelectedObjectStore.getState().getTypeFromUuid("nope")).toBeNull();
  });
});

/**
 * `getTypeFromUuid` answers from a uuid → type index rather than by scanning
 * every collection, and that index is invalidated by comparing collection array
 * *identities*. That is sound only because every write replaces its collection
 * wholesale — so these cover each write path that has to invalidate it. A stale
 * index is not a slow answer, it is a wrong one.
 */
describe("selectedObjectStore.getTypeFromUuid stays in step with the collections", () => {
  const store = () => useSelectedObjectStore.getState();
  beforeEach(reset);

  it("sees objects added after the first lookup", () => {
    store().setObjects([SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType], "SceneType");
    expect(store().getTypeFromUuid("st-1")).toBe("SceneType");

    // The first lookup has now built and cached an index that knows nothing of this.
    store().addObject([new Class("cl-1", "A", "" as never, null as never)], "Class");
    expect(store().getTypeFromUuid("cl-1")).toBe("Class");
    expect(store().getTypeFromUuid("st-1")).toBe("SceneType");
  });

  it("forgets an object that was removed", () => {
    store().setObjects([SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType], "SceneType");
    expect(store().getTypeFromUuid("st-1")).toBe("SceneType");

    store().removeObject("st-1");
    expect(store().getTypeFromUuid("st-1")).toBeNull();
  });

  it("forgets everything after a full reset", () => {
    store().setObjects([SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType], "SceneType");
    expect(store().getTypeFromUuid("st-1")).toBe("SceneType");

    reset();
    expect(store().getTypeFromUuid("st-1")).toBeNull();
  });

  it("follows a collection that was replaced wholesale", () => {
    store().setObjects([SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType], "SceneType");
    expect(store().getTypeFromUuid("st-1")).toBe("SceneType");

    store().setObjects([SceneType.fromJS({ uuid: "st-2", name: "Two" }) as SceneType], "SceneType");
    expect(store().getTypeFromUuid("st-1")).toBeNull();
    expect(store().getTypeFromUuid("st-2")).toBe("SceneType");
  });
});

describe("selectedObjectStore open tabs", () => {
  const store = () => useSelectedObjectStore.getState();

  beforeEach(() => {
    reset();
    store().setObjects([
      SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType,
      SceneType.fromJS({ uuid: "st-2", name: "Two" }) as SceneType,
      SceneType.fromJS({ uuid: "st-3", name: "Three" }) as SceneType,
    ], "SceneType");
  });

  it("opens one tab per object and activates the newest", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1", "st-2"]);
    expect(store().activeTabUuid).toBe("st-2");
    expect(store().selectedObject?.uuid).toBe("st-2");
  });

  it("focuses an already-open tab instead of opening a duplicate", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().setSelectedObject("st-1");
    expect(store().openTabs).toHaveLength(2);
    expect(store().activeTabUuid).toBe("st-1");
  });

  it("keeps each tab's unsaved working copy when switching away and back", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "edited");
    store().setSelectedObject("st-2");
    // the other tab is untouched...
    expect(store().selectedObject?.name).toBe("Two");
    store().setSelectedObject("st-1");
    // ...and the edit survived the round trip
    expect(store().selectedObject?.name).toBe("edited");
    // the collection still holds the unedited object (working copy is decoupled)
    expect(store().getObjectFromUuid("st-1")?.name).toBe("One");
  });

  it("flags an edited tab dirty and markTabClean clears it", () => {
    store().setSelectedObject("st-1");
    expect(store().getTab("st-1")?.dirty).toBe(false);
    store().updateSelectedField("name", "edited");
    expect(store().getTab("st-1")?.dirty).toBe(true);
    store().markTabClean("st-1");
    expect(store().getTab("st-1")?.dirty).toBe(false);
  });

  it("only dirties the active tab", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().updateSelectedField("name", "edited");
    expect(store().getTab("st-1")?.dirty).toBe(false);
    expect(store().getTab("st-2")?.dirty).toBe(true);
  });

  it("remembers the sub-tab per open tab", () => {
    store().setSelectedObject("st-1");
    store().setSelectedTab("Classes");
    store().setSelectedObject("st-2");
    expect(store().selectedTab).toBe("General");
    store().setSelectedObject("st-1");
    expect(store().selectedTab).toBe("Classes");
  });

  it("closing the active tab focuses its right-hand neighbour", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().setSelectedObject("st-3");
    store().activateTab("st-2");
    store().closeTab("st-2");
    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1", "st-3"]);
    expect(store().activeTabUuid).toBe("st-3");
  });

  it("closing the last tab falls back to the tab on its left", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().closeTab("st-2");
    expect(store().activeTabUuid).toBe("st-1");
    expect(store().selectedObject?.uuid).toBe("st-1");
  });

  it("moveTab reorders the strip, clamped to its ends, and leaves the selection alone", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().setSelectedObject("st-3");
    store().moveTab("st-3", 0);
    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-3", "st-1", "st-2"]);
    expect(store().activeTabUuid).toBe("st-3");

    store().moveTab("st-3", 99);
    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1", "st-2", "st-3"]);
  });

  it("moveTab ignores an unknown uuid", () => {
    store().setSelectedObject("st-1");
    const before = store().openTabs;
    store().moveTab("nope", 0);
    expect(store().openTabs).toBe(before);
  });

  it("after a reorder, closing the active tab focuses its neighbour on the strip", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().setSelectedObject("st-3");
    store().moveTab("st-3", 0); // strip: 3 1 2
    store().closeTab("st-3");
    expect(store().activeTabUuid).toBe("st-1");
  });

  it("closing a background tab leaves the selection alone", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().closeTab("st-1");
    expect(store().activeTabUuid).toBe("st-2");
    expect(store().selectedObject?.uuid).toBe("st-2");
  });

  it("closing the only tab clears the selection", () => {
    store().setSelectedObject("st-1");
    store().closeTab("st-1");
    expect(store().openTabs).toHaveLength(0);
    expect(store().activeTabUuid).toBeNull();
    expect(store().selectedObject).toBeNull();
    expect(store().type).toBeNull();
  });

  it("removing an object closes its tab", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().removeObject("st-2");
    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1"]);
    expect(store().activeTabUuid).toBe("st-1");
  });

  it("hasUnsavedTabs reflects whether any open tab is dirty", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    expect(store().hasUnsavedTabs()).toBe(false);
    store().updateSelectedField("name", "edited");
    expect(store().hasUnsavedTabs()).toBe(true);
    store().markTabClean("st-2");
    expect(store().hasUnsavedTabs()).toBe(false);
  });

  it("a full reset closes every tab", () => {
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().resetObjects();
    expect(store().openTabs).toHaveLength(0);
    expect(store().selectedObject).toBeNull();
  });
});

/**
 * A tab's working copy is decoupled from the loaded collection all the way down, not
 * just at the top: the mutators edit nested lists in place, and a copy that shared them
 * with the collection entry carried every unsaved edit into it — where it survived
 * "Discard changes" and came back, clean, the next time the object was opened.
 */
describe("selectedObjectStore keeps unsaved edits in the working copy", () => {
  const store = () => useSelectedObjectStore.getState();
  const loaded = <T,>(uuid: string) => store().getObjectFromUuid(uuid) as unknown as T;

  beforeEach(() => {
    reset();
    store().setObjects([SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType], "SceneType");
    store().setObjects(
      [
        Class.fromJS({ uuid: "cl-1", name: "Owner" }) as Class,
        Class.fromJS({ uuid: "cl-2", name: "Other" }) as Class,
      ],
      "Class",
    );
    store().setObjects([Attribute.fromJS({ uuid: "at-1", name: "Value" }) as Attribute], "Attribute");
  });

  it("does not add an unsaved child to the loaded object, and discarding drops it", () => {
    store().setSelectedObject("st-1");
    store().addChild("cl-1", "Class");
    expect(loaded<SceneType>("st-1").classes).toHaveLength(0);

    store().closeTab("st-1");
    store().setSelectedObject("st-1");
    expect((store().selectedObject as SceneType).classes).toHaveLength(0);
    expect(store().getTab("st-1")?.dirty).toBe(false);
  });

  it("keeps an edit to an added child's row with that parent", () => {
    for (const owner of ["cl-1", "cl-2"]) {
      store().setSelectedObject(owner);
      store().addChild("at-1", "Attribute");
    }
    // Edit the row the way the Attributes tab does: in place, then commit.
    const row = (store().selectedObject as Class).attributes[0] as Attribute & { ui_component?: string };
    row.ui_component = "multi-line";
    store().commitSelected();

    expect((loaded<Attribute>("at-1") as Attribute & { ui_component?: string }).ui_component).toBeUndefined();
    store().setSelectedObject("cl-1");
    expect((store().selectedObject as Class).attributes[0]).not.toHaveProperty("ui_component", "multi-line");
  });

  it("keeps a relation end and its bounds out of the loaded relation class", () => {
    store().setObjects(
      [
        Relationclass.fromJS({
          uuid: "rc-1",
          name: "Link",
          role_from: { uuid: "role-from", name: "from" },
          role_to: { uuid: "role-to", name: "to" },
        }) as Relationclass,
      ],
      "RelationClass",
    );
    store().setSelectedObject("rc-1");
    store().addChild("cl-1", "Source");
    store().updateMinMax("cl-1", "Source", 1, 3);

    expect(loaded<Relationclass>("rc-1").role_from.class_references).toHaveLength(0);
  });

  it("keeps a nested field edit out of the loaded object", () => {
    store().setObjects(
      [SceneType.fromJS({ uuid: "st-2", name: "Two", coordinates_2d: { x: 1, y: 2 } }) as SceneType],
      "SceneType",
    );
    store().setSelectedObject("st-2");
    store().updateSelectedField("coordinates_2d.x", 5);

    expect(loaded<SceneType>("st-2").coordinates_2d.x).toBe(1);
  });
});

describe("selectedObjectStore undo/redo", () => {
  const store = () => useSelectedObjectStore.getState();
  const canUndo = () => selectCanUndo(useSelectedObjectStore.getState());
  const canRedo = () => selectCanRedo(useSelectedObjectStore.getState());

  beforeEach(() => {
    reset();
    store().setObjects([
      SceneType.fromJS({ uuid: "st-1", name: "One" }) as SceneType,
      SceneType.fromJS({ uuid: "st-2", name: "Two" }) as SceneType,
    ], "SceneType");
    store().setObjects([Class.fromJS({ uuid: "cl-1", name: "Klass" }) as Class], "Class");
  });

  it("has nothing to undo on a freshly opened tab", () => {
    store().setSelectedObject("st-1");
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
  });

  it("undoes a field edit and redoes it", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "edited");
    expect(canUndo()).toBe(true);

    store().undo();
    expect(store().selectedObject?.name).toBe("One");
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);

    store().redo();
    expect(store().selectedObject?.name).toBe("edited");
    expect(canRedo()).toBe(false);
  });

  it("collapses a run of keystrokes in one field into a single step", () => {
    store().setSelectedObject("st-1");
    for (const value of ["O", "On", "Onc", "Once"]) {
      store().updateSelectedField("name", value);
    }
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
    expect(canUndo()).toBe(false);
  });

  it("keeps edits to different fields as separate steps", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "renamed");
    store().updateSelectedField("description", "described");

    store().undo();
    expect(store().selectedObject?.description).not.toBe("described");
    expect(store().selectedObject?.name).toBe("renamed");
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
  });

  // The reason snapshots are deep clones: `classes` is mutated in place, so a
  // shallow snapshot would share the array being edited and restore nothing.
  it("undoes a structural child change", () => {
    store().setSelectedObject("st-1");
    store().addChild("cl-1", "Class");
    expect((store().selectedObject as SceneType).classes).toHaveLength(1);

    store().undo();
    expect((store().selectedObject as SceneType).classes).toHaveLength(0);
    store().redo();
    expect((store().selectedObject as SceneType).classes).toHaveLength(1);
  });

  it("keeps a separate history per tab and steps only the active one", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "one edited");
    store().setSelectedObject("st-2");
    store().updateSelectedField("name", "two edited");

    // undo on st-2 leaves st-1's edit alone
    store().undo();
    expect(store().selectedObject?.name).toBe("Two");
    expect(store().getTab("st-1")?.object.name).toBe("one edited");

    store().setSelectedObject("st-1");
    expect(canRedo()).toBe(false); // st-1 has its own, un-undone history
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
  });

  it("undoing back to the saved state makes the tab clean again", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "edited");
    expect(store().getTab("st-1")?.dirty).toBe(true);

    store().undo();
    expect(store().getTab("st-1")?.dirty).toBe(false);
    store().redo();
    expect(store().getTab("st-1")?.dirty).toBe(true);
  });

  it("treats the last save as the new clean point", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "saved name");
    store().markTabClean("st-1");
    store().updateSelectedField("description", "later edit");
    expect(store().getTab("st-1")?.dirty).toBe(true);

    store().undo();
    expect(store().selectedObject?.name).toBe("saved name");
    expect(store().getTab("st-1")?.dirty).toBe(false);
  });

  it("drops the redo branch once a new edit lands", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "first");
    store().undo();
    expect(canRedo()).toBe(true);

    store().updateSelectedField("name", "second");
    expect(canRedo()).toBe(false);
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
  });

  // A restored snapshot is handed out as a clone; if it were not, the next edit
  // would mutate the stored entry and undoing again would return the new value.
  it("does not let a post-undo edit corrupt the snapshot it came from", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "first");
    store().undo();
    store().updateSelectedField("description", "added later");
    store().undo();
    expect(store().selectedObject?.name).toBe("One");
    expect(store().selectedObject?.description).not.toBe("added later");
  });

  // The Monaco buffer is a second mirror of `geometry`, so a step that changes
  // the geometry has to move it too — and a step that does not must leave the
  // (beautified, D8) buffer exactly as the user sees it.
  it("pushes a restored geometry into the editor buffer, and only then", () => {
    store().setObjects([
      Class.fromJS({ uuid: "cl-2", name: "Drawn", geometry: "original()" }) as Class,
    ], "Class");
    store().setSelectedObject("cl-2");
    useEditorStore.getState().setCode("beautified original()");

    store().updateSelectedField("name", "renamed");
    store().undo();
    expect(useEditorStore.getState().codeEditorValue).toBe("beautified original()");

    store().updateSelectedField("geometry", "edited()");
    store().undo();
    expect(useEditorStore.getState().codeEditorValue).toBe("original()");
    store().redo();
    expect(useEditorStore.getState().codeEditorValue).toBe("edited()");
  });

  it("closing a tab discards its history", () => {
    store().setSelectedObject("st-1");
    store().updateSelectedField("name", "edited");
    store().closeTab("st-1");
    expect(canUndo()).toBe(false);

    store().setSelectedObject("st-1");
    expect(canUndo()).toBe(false);
  });
});

/**
 * A table's columns are numbered by `sequence` from 1 without gaps (gds Instance_tables;
 * the database refuses two columns at one position). The store keeps that numbering as
 * columns come and go, rather than relying on the column list to renumber when it renders.
 */
describe("selectedObjectStore table columns", () => {
  const store = () => useSelectedObjectStore.getState();
  const sequences = () =>
    (store().selectedObject as AttributeType).has_table_attribute.map((column) => [column.attribute.uuid, column.sequence]);

  beforeEach(() => {
    reset();
    store().setObjects([AttributeType.fromJS({ uuid: "at-table", name: "Table", has_table_attribute: [] }) as AttributeType], "AttributeType");
    store().setObjects(
      ["a", "b", "c"].map((uuid) => Attribute.fromJS({ uuid, name: uuid.toUpperCase() }) as Attribute),
      "Attribute",
    );
    store().setSelectedObject("at-table");
  });

  it("appends an added column after the last one", () => {
    for (const uuid of ["a", "b", "c"]) store().addChild(uuid, "Column");
    expect(sequences()).toEqual([["a", 1], ["b", 2], ["c", 3]]);
  });

  it("renumbers the columns after a removed one", () => {
    for (const uuid of ["a", "b", "c"]) store().addChild(uuid, "Column");
    store().removeChild("b", "Column");
    expect(sequences()).toEqual([["a", 1], ["c", 2]]);

    store().addChild("b", "Column");
    expect(sequences()).toEqual([["a", 1], ["c", 2], ["b", 3]]);
  });
});

/**
 * Each end of a relation class has its own role, and so its own min/max per referenced
 * object. A relation class may link a class to itself, which puts the same uuid in both
 * roles: an edit to one end must not land on the other.
 */
describe("selectedObjectStore relation class cardinality", () => {
  const store = () => useSelectedObjectStore.getState();
  const relationClass = () => store().selectedObject as Relationclass;
  const bounds = (end: "role_from" | "role_to") =>
    relationClass()[end].class_references.map((reference) => [reference.uuid, reference.min, reference.max]);

  beforeEach(() => {
    reset();
    store().setObjects([new Class("cl-node", "Node", "" as never, null as never)], "Class");
    store().setObjects(
      [
        Relationclass.fromJS({
          uuid: "rc-link",
          name: "Link",
          role_from: { uuid: "role-from", name: "from" },
          role_to: { uuid: "role-to", name: "to" },
        }) as Relationclass,
      ],
      "RelationClass",
    );
    store().setSelectedObject("rc-link");
    store().addChild("cl-node", "Source");
    store().addChild("cl-node", "Destination");
  });

  it("sets the destination's bounds when the class is also the source", () => {
    store().updateMinMax("cl-node", "Destination", 2, 5);
    expect(bounds("role_to")).toEqual([["cl-node", 2, 5]]);
    expect(bounds("role_from")).toEqual([["cl-node", 0, 1]]);
  });

  it("sets the source's bounds without touching the destination", () => {
    store().updateMinMax("cl-node", "Source", 1, 3);
    expect(bounds("role_from")).toEqual([["cl-node", 1, 3]]);
    expect(bounds("role_to")).toEqual([["cl-node", 0, 1]]);
  });
});
