import { validate as isUuid } from "uuid";

/**
 * Reading a metamodel file the user has chosen, before anything is sent.
 *
 * A metamodel file is one scene type serialised as JSON with everything it
 * contains nested inside it — its classes, relation classes, attributes, ports
 * and procedures. It is the shape `GET metamodel/sceneTypes/:uuid` answers and
 * the files under `mmar-database/example_metamodels` hold, and posting it whole
 * to `metamodel/sceneTypes` is how the server imports a metamodel.
 *
 * Only the outline is checked here: enough to turn away a file that is plainly
 * not a metamodel, and to tell the user what is in one that is. Every rule about
 * the content is the server's, which refuses the import as a whole.
 */

/** The nested lists a scene type carries, in the order the summary lists them. */
export const METAMODEL_CHILD_LISTS = [
  "classes",
  "relationclasses",
  "attributes",
  "ports",
  "procedures",
] as const;

export type MetamodelChildList = (typeof METAMODEL_CHILD_LISTS)[number];

export interface MetamodelSummary {
  /** Absent when the file leaves it to the server to assign one. */
  uuid: string | undefined;
  name: string;
  description: string | undefined;
  /** How many of each kind of child the scene type holds directly. */
  counts: Record<MetamodelChildList, number>;
}

export type MetamodelFile =
  | { ok: true; body: Record<string, unknown>; summary: MetamodelSummary }
  | { ok: false; error: string };

const refuse = (error: string): MetamodelFile => ({ ok: false, error });

/**
 * Parse `text` as a metamodel file.
 *
 * A file is taken as a scene type when it is a JSON object with a name and a
 * list of classes. Requiring the list as well as the name is what tells a scene
 * type apart from an exported class or attribute, which have names too and would
 * otherwise be imported as a scene type of the same uuid.
 */
export function readMetamodelFile(text: string): MetamodelFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return refuse(`The file is not valid JSON: ${(error as Error).message}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return refuse("The file does not hold a metamodel: expected a single scene type object.");
  }
  const body = parsed as Record<string, unknown>;

  if (typeof body.name !== "string" || body.name.trim() === "") {
    return refuse("The file does not hold a metamodel: the scene type has no name.");
  }

  const uuid = body.uuid;
  if (uuid !== undefined && uuid !== null && (typeof uuid !== "string" || !isUuid(uuid))) {
    return refuse(`The file does not hold a metamodel: ${JSON.stringify(uuid)} is not a UUID.`);
  }

  if (!Array.isArray(body.classes)) {
    return refuse("The file does not hold a metamodel: the scene type has no list of classes.");
  }
  for (const key of METAMODEL_CHILD_LISTS) {
    const list = body[key];
    if (list !== undefined && list !== null && !Array.isArray(list)) {
      return refuse(`The file does not hold a metamodel: "${key}" is not a list.`);
    }
  }

  const counts = Object.fromEntries(
    METAMODEL_CHILD_LISTS.map((key) => {
      const list = body[key];
      return [key, Array.isArray(list) ? list.length : 0];
    }),
  ) as Record<MetamodelChildList, number>;

  return {
    ok: true,
    body,
    summary: {
      uuid: typeof uuid === "string" ? uuid : undefined,
      name: body.name,
      description:
        typeof body.description === "string" && body.description !== ""
          ? body.description
          : undefined,
      counts,
    },
  };
}
