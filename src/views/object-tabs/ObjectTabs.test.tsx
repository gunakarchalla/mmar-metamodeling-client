// @vitest-environment jsdom
//
// The tab strip's three user-visible contracts: a dirty tab shows a coloured
// circle instead of the ✕, closing a dirty tab must ask first, and dismissing
// that prompt must do nothing at all (tab stays open, nothing saved).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import { SceneType } from "@gds";

vi.mock("@/resources/services/backend-service", () => ({
  backendService: { saveObject: vi.fn().mockResolvedValue({}) },
}));

import ObjectTabs, { TAB_WIDTH } from "./ObjectTabs";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";
import { backendService } from "@/resources/services/backend-service";

const store = () => useSelectedObjectStore.getState();

function openTwo() {
  store().setObjects([
    SceneType.fromJS({ uuid: "st-1", name: "Alpha" }) as SceneType,
    SceneType.fromJS({ uuid: "st-2", name: "Beta" }) as SceneType,
  ], "SceneType");
  store().setSelectedObject("st-1");
  store().setSelectedObject("st-2");
}

const closeButton = (name: string) => screen.getByRole("button", { name: `close ${name}` });
const dot = () => document.querySelector(".unsaved-indicator");

beforeEach(() => {
  vi.clearAllMocks();
  store().resetObjects();
});

afterEach(cleanup);

describe("ObjectTabs", () => {
  it("renders nothing when no object is open", () => {
    const { container } = render(<ObjectTabs />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one tab per open object", () => {
    openTwo();
    render(<ObjectTabs />);
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("clicking a tab activates it", () => {
    openTwo();
    render(<ObjectTabs />);
    fireEvent.click(screen.getByText("Alpha"));
    expect(store().activeTabUuid).toBe("st-1");
  });

  it("shows the unsaved circle only for a dirty tab", () => {
    openTwo();
    const { rerender } = render(<ObjectTabs />);
    expect(dot()).toBeNull();

    store().updateSelectedField("name", "Beta edited");
    rerender(<ObjectTabs />);
    expect(dot()).not.toBeNull();
  });

  it("closes a clean tab immediately, without prompting", () => {
    openTwo();
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Alpha"));

    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-2"]);
    expect(screen.queryByText("Unsaved changes")).toBeNull();
  });

  it("prompts instead of closing when the tab is dirty", () => {
    openTwo();
    store().updateSelectedField("name", "Beta edited");
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Beta edited"));

    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    expect(store().openTabs).toHaveLength(2);
  });

  it("'Discard changes' closes the tab without saving", () => {
    openTwo();
    store().updateSelectedField("name", "Beta edited");
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Beta edited"));
    fireEvent.click(screen.getByText("Discard changes"));

    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1"]);
    expect(backendService.saveObject).not.toHaveBeenCalled();
  });

  it("'Save changes' persists the tab's working copy, then closes it", async () => {
    openTwo();
    store().updateSelectedField("name", "Beta edited");
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Beta edited"));
    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-1"]));
    expect(backendService.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "st-2", name: "Beta edited" }),
      "SceneType",
    );
  });

  it("dismissing the prompt does nothing — the tab stays open and dirty", async () => {
    openTwo();
    store().updateSelectedField("name", "Beta edited");
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Beta edited"));

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(store().openTabs).toHaveLength(2);
    expect(store().getTab("st-2")?.dirty).toBe(true);
    expect(backendService.saveObject).not.toHaveBeenCalled();
  });

  it("can close a background tab while a dirty tab stays open", () => {
    openTwo();
    store().updateSelectedField("name", "Beta edited");
    render(<ObjectTabs />);
    fireEvent.click(closeButton("Alpha"));

    expect(store().openTabs.map((t) => t.uuid)).toEqual(["st-2"]);
    expect(store().activeTabUuid).toBe("st-2");
  });
});

// Equal widths, drag-to-reorder and middle-click close. jsdom has no layout, so the
// drag runs on TAB_WIDTH as its slot width (the hook's fallback when a tab measures 0
// wide) and on a stubbed strip rect wide enough to stay clear of the auto-scroll edges.
describe("ObjectTabs sizing and reordering", () => {
  const POINTER = { pointerId: 1, isPrimary: true, button: 0 };
  const START_X = 100;
  let rectSpy: { mockRestore: () => void };

  function openThree() {
    store().setObjects([
      SceneType.fromJS({ uuid: "st-1", name: "Alpha" }) as SceneType,
      SceneType.fromJS({ uuid: "st-2", name: "Beta" }) as SceneType,
      SceneType.fromJS({ uuid: "st-3", name: "A much longer scene type name than fits" }) as SceneType,
    ], "SceneType");
    store().setSelectedObject("st-1");
    store().setSelectedObject("st-2");
    store().setSelectedObject("st-3"); // st-3 is active
  }

  const order = () => store().openTabs.map((t) => t.uuid);
  const tab = (name: string) => screen.getByRole("tab", { name: new RegExp(`^${name}`) });
  /** The part of a tab that is drawn (and moved by a drag). */
  const face = (name: string) => tab(name).firstElementChild as HTMLElement;
  const press = (name: string) => fireEvent.pointerDown(tab(name), { ...POINTER, clientX: START_X });
  const moveBy = (dx: number) => fireEvent.pointerMove(document, { ...POINTER, clientX: START_X + dx });
  const release = (dx: number) => fireEvent.pointerUp(document, { ...POINTER, clientX: START_X + dx });
  const middleClick = (el: HTMLElement) =>
    fireEvent(el, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));

  beforeEach(() => {
    rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 2000, top: 0, bottom: 36, width: 2000, height: 36, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(async () => {
    rectSpy.mockRestore();
    // A drop arms a one-shot click swallower that a 0 ms timer disarms; let that timer
    // run so it cannot eat a click in the next test.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("gives every tab the same width, however long its name", () => {
    openThree();
    render(<ObjectTabs />);
    const widths = screen.getAllByRole("tab").map((el) => getComputedStyle(el).width);
    expect(widths).toEqual([`${TAB_WIDTH}px`, `${TAB_WIDTH}px`, `${TAB_WIDTH}px`]);
  });

  it("slides the tabs it passes aside while dragging, committing nothing yet", () => {
    openThree();
    render(<ObjectTabs />);

    press("Alpha");
    moveBy(TAB_WIDTH * 2 + 10);

    expect(face("Alpha").style.transform).toBe(`translateX(${TAB_WIDTH * 2}px)`);
    expect(face("Beta").style.transform).toBe(`translateX(${-TAB_WIDTH}px)`);
    expect(order()).toEqual(["st-1", "st-2", "st-3"]);
  });

  it("drops a tab into the slot it is over and activates it", () => {
    openThree();
    render(<ObjectTabs />);

    press("Alpha");
    moveBy(TAB_WIDTH * 2);
    release(TAB_WIDTH * 2);
    // The click the release would cause is swallowed; the drop already activated.
    fireEvent.click(tab("Alpha"));

    expect(order()).toEqual(["st-2", "st-3", "st-1"]);
    expect(store().activeTabUuid).toBe("st-1");
    expect(face("Alpha").style.transform).toBe("");
  });

  it("treats a press without travel as a plain click", () => {
    openThree();
    render(<ObjectTabs />);

    press("Alpha");
    moveBy(2); // under the drag threshold
    release(2);
    fireEvent.click(tab("Alpha"));

    expect(order()).toEqual(["st-1", "st-2", "st-3"]);
    expect(store().activeTabUuid).toBe("st-1");
  });

  it("Escape cancels the drag and puts the tab back", () => {
    openThree();
    render(<ObjectTabs />);

    press("Alpha");
    moveBy(TAB_WIDTH * 2);
    fireEvent.keyDown(document, { key: "Escape" });
    release(TAB_WIDTH * 2);

    expect(order()).toEqual(["st-1", "st-2", "st-3"]);
    expect(store().activeTabUuid).toBe("st-3");
    expect(face("Alpha").style.transform).toBe("");
  });

  it("never starts a drag from the close button", () => {
    openThree();
    render(<ObjectTabs />);

    fireEvent.pointerDown(closeButton("Alpha"), { ...POINTER, clientX: START_X });
    moveBy(TAB_WIDTH * 2);
    expect(face("Alpha").style.transform).toBe("");
    release(TAB_WIDTH * 2);

    expect(order()).toEqual(["st-1", "st-2", "st-3"]);
  });

  it("drops the drag if a tab closes underneath it", () => {
    openThree();
    render(<ObjectTabs />);

    press("Alpha");
    moveBy(TAB_WIDTH * 2);
    act(() => store().closeTab("st-2"));
    release(TAB_WIDTH * 2);

    expect(order()).toEqual(["st-1", "st-3"]);
    expect(store().activeTabUuid).toBe("st-3");
  });

  it("middle click closes a clean tab", () => {
    openThree();
    render(<ObjectTabs />);

    middleClick(tab("Alpha"));

    expect(order()).toEqual(["st-2", "st-3"]);
  });

  it("middle click on a dirty tab asks first, like the ✕", () => {
    openThree();
    store().updateSelectedField("name", "Edited");
    render(<ObjectTabs />);

    middleClick(tab("Edited"));

    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    expect(order()).toEqual(["st-1", "st-2", "st-3"]);
  });
});
