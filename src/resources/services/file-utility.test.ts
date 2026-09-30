// @vitest-environment jsdom
// file-utility: the cache behind `gc.expression.getImageByUUID` / `getGltfByUUID`.
//
// The property worth pinning is that a binary file reaches the loaders byte for
// byte. The cache used to decode every `application/octet-stream` file as text,
// which replaces invalid UTF-8 sequences and silently corrupts a GLB or STL.
//
// `global-definition` is mocked so `three` never loads: importing it for real
// constructs a WebGLRenderer at module scope, which has no WebGL context in tests.
import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  globalObject: { localFiles: new Map<string, unknown>() },
  backendService: { getFileByUUID: vi.fn() },
}));

vi.mock("@/engine/global-definition", () => ({ globalObject: mocks.globalObject }));
vi.mock("./backend-service", () => ({ backendService: mocks.backendService }));
vi.mock("./logger", () => ({ logger: { log: vi.fn() } }));

import { fileUtility } from "./file-utility";

// Not valid UTF-8: a text round trip would turn these into U+FFFD.
const BINARY = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0xff, 0xfe, 0x80, 0x00]);

beforeEach(() => {
  mocks.globalObject.localFiles.clear();
  mocks.backendService.getFileByUUID.mockReset();
});

describe("fileUtility", () => {
  it("returns a binary file byte for byte", async () => {
    mocks.backendService.getFileByUUID.mockResolvedValue(
      new File([BINARY], "model", { type: "application/octet-stream" }),
    );

    const buffer = await fileUtility.getArrayBuffer("model");

    expect(new Uint8Array(buffer!)).toEqual(BINARY);
  });

  it("returns an image as a data URL", async () => {
    mocks.backendService.getFileByUUID.mockResolvedValue(
      new File([BINARY], "image", { type: "image/png" }),
    );

    const dataUrl = await fileUtility.getDataUrl("image");

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("fetches a file once and serves both forms from the cache", async () => {
    mocks.backendService.getFileByUUID.mockResolvedValue(
      new File([BINARY], "file", { type: "image/png" }),
    );

    await fileUtility.getDataUrl("file");
    await fileUtility.getDataUrl("file");
    await fileUtility.getArrayBuffer("file");

    expect(mocks.backendService.getFileByUUID).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when the server has no such file", async () => {
    mocks.backendService.getFileByUUID.mockResolvedValue(undefined);

    expect(await fileUtility.getDataUrl("missing")).toBeUndefined();
    expect(await fileUtility.getArrayBuffer("missing")).toBeUndefined();
  });
});
