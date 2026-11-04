// @vitest-environment jsdom
//
// jsdom supplies the `localStorage` the bearer token is read from.
//
// Importing a metamodel creates objects across most collections at once, so
// afterwards every one of them is reloaded — but without the full refresh's
// store reset, which would close every open tab and lose its unsaved edits.
import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  errorMessageOf: vi.fn(),
  setObjects: vi.fn(),
  resetObjects: vi.fn(),
  log: vi.fn(),
}));
vi.mock("./api", () => ({ apiFetch: mocks.apiFetch, errorMessageOf: mocks.errorMessageOf }));
vi.mock("@/resources/store/selectedObjectStore", () => ({
  useSelectedObjectStore: {
    getState: () => ({
      setObjects: mocks.setObjects,
      resetObjects: mocks.resetObjects,
      getObjects: () => [],
    }),
  },
}));
vi.mock("@/resources/store/logStore", () => ({
  useLogStore: { getState: () => ({ log: mocks.log }) },
}));

import { backendService } from "./backend-service";

const METAMODEL = {
  uuid: "239c5597-6cc9-498a-bf61-432cf85b3835",
  name: "Statechange",
  classes: [{ uuid: "ada138a9-646c-4df4-8622-fb79092a9ad0", name: "Reference" }],
};

const okJson = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) });

/** Answers the import POST with `postResponse` and every collection GET with an empty list. */
function serve(postResponse: unknown) {
  mocks.apiFetch.mockImplementation((path: string, init: RequestInit = {}) => {
    if (init.method === "POST") return Promise.resolve(postResponse);
    return Promise.resolve(okJson(path === "metamodel/sceneTypes" ? { sceneTypes: [] } : []));
  });
}

const posts = () => mocks.apiFetch.mock.calls.filter(([, init]) => init?.method === "POST");
const reloadedPaths = () =>
  mocks.apiFetch.mock.calls.filter(([, init]) => init?.method === "GET").map(([path]) => path);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("auth_token", "tok");
});

describe("backendService.importMetamodel", () => {
  it("posts the whole metamodel to the scene type route", async () => {
    serve(okJson({ ...METAMODEL }));
    await backendService.importMetamodel(METAMODEL);

    expect(posts()).toHaveLength(1);
    const [path, init] = posts()[0];
    expect(path).toBe("metamodel/sceneTypes");
    expect(JSON.parse(init.body as string)).toEqual(METAMODEL);
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  it("reports the scene type the server created", async () => {
    // The uuid comes from the response: the server assigns one when the file has none.
    serve(okJson({ uuid: "f0d18a9a-656d-4ffd-b1e4-456175b10835", name: "Statechange" }));

    await expect(backendService.importMetamodel(METAMODEL)).resolves.toEqual({
      ok: true,
      sceneType: { uuid: "f0d18a9a-656d-4ffd-b1e4-456175b10835", name: "Statechange" },
    });
    expect(mocks.log).toHaveBeenCalledWith("Metamodel Statechange loaded", "info");
  });

  it("reloads every metamodel collection, but not users or user groups", async () => {
    serve(okJson({ ...METAMODEL }));
    await backendService.importMetamodel(METAMODEL);

    expect(reloadedPaths().sort()).toEqual(
      [
        "metamodel/sceneTypes",
        "metamodel/classes",
        "metamodel/relationclasses",
        "metamodel/attributes",
        "metamodel/attributeTypes",
        "metamodel/ports",
        "metamodel/files",
        "metamodel/procedures",
      ].sort(),
    );
  });

  it("does not reset the store, so open tabs and their edits survive", async () => {
    serve(okJson({ ...METAMODEL }));
    await backendService.importMetamodel(METAMODEL);

    expect(mocks.resetObjects).not.toHaveBeenCalled();
    expect(mocks.setObjects).toHaveBeenCalled();
  });

  it("returns the server's reason when the import is refused, and reloads nothing", async () => {
    serve({ ok: false, statusText: "Conflict" });
    mocks.errorMessageOf.mockResolvedValue(
      "The meta object with UUID 239c5597-6cc9-498a-bf61-432cf85b3835 already exists",
    );

    await expect(backendService.importMetamodel(METAMODEL)).resolves.toEqual({
      ok: false,
      error:
        "Conflict - The meta object with UUID 239c5597-6cc9-498a-bf61-432cf85b3835 already exists",
    });
    expect(reloadedPaths()).toEqual([]);
    expect(mocks.log).toHaveBeenCalledWith(expect.stringMatching(/^Error loading metamodel: /), "error");
  });

  it("sends nothing while signed out", async () => {
    localStorage.clear();
    serve(okJson({ ...METAMODEL }));

    const result = await backendService.importMetamodel(METAMODEL);

    expect(result.ok).toBe(false);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
