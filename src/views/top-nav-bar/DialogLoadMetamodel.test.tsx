// @vitest-environment jsdom
//
// File ▸ Load Metamodel, driven through the menu as a user reaches it. The
// backend call is stubbed — what it sends is pinned in
// backend-service.import-metamodel.test.ts — so these tests are about the
// dialog: what it lets through, what it says, and where it leaves the user.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { SceneType } from "@gds";

const mocks = vi.hoisted(() => ({ importMetamodel: vi.fn() }));
vi.mock("@/resources/services/backend-service", () => ({
  backendService: { importMetamodel: mocks.importMetamodel },
}));

import TopNavBar from "./TopNavBar";
import { useAuthStore } from "@/resources/store/authStore";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";

const store = () => useSelectedObjectStore.getState();

const UUID = "239c5597-6cc9-498a-bf61-432cf85b3835";
const METAMODEL = {
  uuid: UUID,
  name: "Statechange",
  description: "This is the SceneType for Statechanges",
  classes: [{ uuid: "ada138a9-646c-4df4-8622-fb79092a9ad0", name: "Reference" }],
  relationclasses: [],
  attributes: [],
  ports: [],
  procedures: [],
};

function renderSignedIn() {
  useAuthStore.setState({ currentUser: { username: "ann", isAdmin: false } });
  render(<TopNavBar onOpenLogin={vi.fn()} />);
}

const menuItem = () => screen.getByRole("menuitem", { name: /Load Metamodel/ });
const loadButton = () => screen.getByRole("button", { name: "Load" });

function openFileMenu() {
  fireEvent.click(screen.getByRole("button", { name: /File/ }));
}

function openDialog() {
  openFileMenu();
  fireEvent.click(menuItem());
}

/** Choose a file through the dialog's file input, as the browse button does. */
function choose(content: string, name = "statechange.json") {
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Metamodel file"]');
  if (!input) throw new Error("no file input");
  const file = new File([content], name, { type: "application/json" });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  store().resetObjects();
});

afterEach(cleanup);

describe("File ▸ Load Metamodel", () => {
  it("is disabled while signed out", () => {
    useAuthStore.setState({ currentUser: null });
    render(<TopNavBar onOpenLogin={vi.fn()} />);
    openFileMenu();

    expect(menuItem().getAttribute("aria-disabled")).toBe("true");
  });

  it("opens the dialog, with nothing to load until a file is chosen", () => {
    renderSignedIn();
    openDialog();

    expect(screen.getByRole("dialog", { name: "Load Metamodel" })).toBeTruthy();
    expect((loadButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("summarises the chosen file and enables Load", async () => {
    renderSignedIn();
    openDialog();
    choose(JSON.stringify(METAMODEL));

    expect(await screen.findByText("Statechange")).toBeTruthy();
    expect(screen.getByText("This is the SceneType for Statechanges")).toBeTruthy();
    expect(screen.getByText(UUID)).toBeTruthy();
    expect((loadButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("explains why a file is refused and keeps Load disabled", async () => {
    renderSignedIn();
    openDialog();
    choose("[]", "list.json");

    expect(await screen.findByText(/expected a single scene type object/)).toBeTruthy();
    expect((loadButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("stops a metamodel whose scene type is already loaded", async () => {
    store().setObjects([SceneType.fromJS({ uuid: UUID, name: "Statechange (loaded)" })], "SceneType");
    renderSignedIn();
    openDialog();
    choose(JSON.stringify(METAMODEL));

    expect(await screen.findByText(/already loaded as the scene type “Statechange \(loaded\)”/)).toBeTruthy();
    expect((loadButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it("imports the file, closes, and opens the new scene type in a tab", async () => {
    mocks.importMetamodel.mockImplementation(async () => {
      // What the service's reload leaves behind.
      store().setObjects([SceneType.fromJS({ uuid: UUID, name: "Statechange" })], "SceneType");
      return { ok: true, sceneType: { uuid: UUID, name: "Statechange" } };
    });
    renderSignedIn();
    openDialog();
    choose(JSON.stringify(METAMODEL));
    await screen.findByText("Statechange");
    fireEvent.click(loadButton());

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.importMetamodel).toHaveBeenCalledWith(METAMODEL);
    expect(store().activeTabUuid).toBe(UUID);
    expect(store().type).toBe("SceneType");
  });

  it("stays open with the server's reason when the import is refused", async () => {
    mocks.importMetamodel.mockResolvedValue({
      ok: false,
      error: "Forbidden - The user has no right to create the scene type",
    });
    renderSignedIn();
    openDialog();
    choose(JSON.stringify(METAMODEL));
    await screen.findByText("Statechange");
    fireEvent.click(loadButton());

    expect(
      await screen.findByText(
        "The metamodel was not loaded: Forbidden - The user has no right to create the scene type",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    // The file is still chosen, so it can be sent again.
    expect((loadButton() as HTMLButtonElement).disabled).toBe(false);
    expect(store().openTabs).toHaveLength(0);
  });

  it("cannot be cancelled while the import is in flight", async () => {
    let finish!: (value: unknown) => void;
    mocks.importMetamodel.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderSignedIn();
    openDialog();
    choose(JSON.stringify(METAMODEL));
    await screen.findByText("Statechange");
    fireEvent.click(loadButton());

    const cancel = screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
    expect(cancel.disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();

    finish({ ok: false, error: "Conflict" });
    await waitFor(() => expect(cancel.disabled).toBe(false));
  });
});
