// What File ▸ Load Metamodel accepts. The file is checked before anything is
// sent, so a file that is not a scene type — an exported class, an instance, a
// broken download — is refused with a reason instead of being posted to the
// server as if it were one.
import { describe, it, expect } from "vitest";
import { readMetamodelFile } from "./metamodel-file";

/** The outline of the files under mmar-database/example_metamodels. */
const sceneType = (overrides: Record<string, unknown> = {}) => ({
  uuid: "239c5597-6cc9-498a-bf61-432cf85b3835",
  name: "Statechange",
  description: "This is the SceneType for Statechanges",
  classes: [{ uuid: "ada138a9-646c-4df4-8622-fb79092a9ad0", name: "Reference" }],
  relationclasses: [],
  attributes: [{ uuid: "8f2d4c55-3b1e-4b47-9b1f-0d6a2a1c9e10", name: "Owner" }],
  ports: [],
  procedures: [],
  ...overrides,
});

const read = (value: unknown) => readMetamodelFile(JSON.stringify(value));

/** The refusal message, failing the test if the file was accepted. */
function refusal(value: unknown, asText = false): string {
  const result = asText ? readMetamodelFile(value as string) : read(value);
  if (result.ok) throw new Error("expected the file to be refused");
  return result.error;
}

describe("readMetamodelFile", () => {
  it("accepts a scene type and summarises it", () => {
    const result = read(sceneType());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toEqual({
      uuid: "239c5597-6cc9-498a-bf61-432cf85b3835",
      name: "Statechange",
      description: "This is the SceneType for Statechanges",
      counts: { classes: 1, relationclasses: 0, attributes: 1, ports: 0, procedures: 0 },
    });
  });

  it("hands back the parsed body unchanged, to be posted as it is", () => {
    const value = sceneType({ rotation: { x: 0, y: 0, z: 0, w: 1 } });
    const result = read(value);

    expect(result.ok && result.body).toEqual(value);
  });

  it("accepts a scene type without a uuid, leaving the server to assign one", () => {
    const value = sceneType();
    delete (value as Record<string, unknown>).uuid;
    const result = read(value);

    expect(result.ok && result.summary.uuid).toBeUndefined();
  });

  it("counts a missing child list as empty", () => {
    const value = sceneType();
    delete (value as Record<string, unknown>).procedures;
    const result = read(value);

    expect(result.ok && result.summary.counts.procedures).toBe(0);
  });

  it("leaves out an empty description", () => {
    const result = read(sceneType({ description: "" }));

    expect(result.ok && result.summary.description).toBeUndefined();
  });

  it("refuses text that is not JSON", () => {
    expect(refusal("{ not json", true)).toMatch(/^The file is not valid JSON: /);
  });

  it.each([
    ["an array", [sceneType()]],
    ["null", null],
    ["a string", "Statechange"],
  ])("refuses %s", (_label, value) => {
    expect(refusal(value)).toMatch(/expected a single scene type object/);
  });

  it.each([
    ["missing", undefined],
    ["blank", "   "],
    ["not a string", 42],
  ])("refuses a scene type whose name is %s", (_label, name) => {
    expect(refusal(sceneType({ name }))).toMatch(/the scene type has no name/);
  });

  it("refuses a uuid that is not one", () => {
    expect(refusal(sceneType({ uuid: "not-a-uuid" }))).toMatch(/"not-a-uuid" is not a UUID/);
  });

  // An exported class has a name and a uuid too; without this it would be
  // imported as a scene type under the class's own uuid.
  it("refuses an object with no list of classes", () => {
    const exportedClass = { uuid: "ada138a9-646c-4df4-8622-fb79092a9ad0", name: "Reference", attributes: [] };

    expect(refusal(exportedClass)).toMatch(/the scene type has no list of classes/);
  });

  it("refuses a child list that is not a list", () => {
    expect(refusal(sceneType({ ports: {} }))).toMatch(/"ports" is not a list/);
  });
});
