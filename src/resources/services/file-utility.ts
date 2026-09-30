import { UUID } from "@gds/models/meta/Metamodel_metaobjects.structure";
import { globalObject, CachedFile } from "@/engine/global-definition";
import { logger } from "./logger";
import { backendService } from "./backend-service";

/**
 * A cache of the files a VizRep pulls in while drawing — 3D models and textures,
 * keyed by uuid.
 *
 * VizReps request the same file on every redraw, so fetching it once and keeping
 * it in memory is what makes the live preview usable.
 *
 * The file is kept as it came from the server and only converted on request, so
 * that a binary model (GLB, STL) reaches its loader byte for byte: decoding it as
 * text, which the cache used to do for every `application/octet-stream` file,
 * replaces each invalid UTF-8 sequence and corrupts it.
 */
export class FileUtility {
  private globalObjectInstance = globalObject;
  private logger = logger;

  /** The cache entry for `uuid`, fetching and caching the file on a miss. */
  private async getEntry(uuid: UUID): Promise<CachedFile | undefined> {
    const cached = this.globalObjectInstance.localFiles.get(uuid);
    if (cached !== undefined) return cached;

    this.logger.log(
      `File with UUID ${uuid} not found in local storage. Fetching from server...`,
      "warn",
    );
    const file = await backendService.getFileByUUID(uuid);
    if (!file) {
      this.logger.log(`File with UUID ${uuid} could not be fetched from server.`, "warn");
      return undefined;
    }

    const entry: CachedFile = { file };
    this.globalObjectInstance.localFiles.set(uuid, entry);
    this.logger.log(
      `File with UUID ${uuid} fetched from server and added to local storage.`,
      "info",
    );
    return entry;
  }

  /** The file as a data URL, which is what a texture or an icon is assigned from. */
  async getDataUrl(uuid: UUID): Promise<string | undefined> {
    const entry = await this.getEntry(uuid);
    if (!entry) return undefined;
    // Remembered, since a texture is re-read on every redraw of the preview.
    entry.dataUrl ??= await readAsDataUrl(entry.file);
    return entry.dataUrl;
  }

  /** The file as raw bytes, for the glTF and STL loaders. */
  async getArrayBuffer(uuid: UUID): Promise<ArrayBuffer | undefined> {
    const entry = await this.getEntry(uuid);
    return entry ? await entry.file.arrayBuffer() : undefined;
  }
}

function readAsDataUrl(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Application-wide cache; every VizRep draws from the same one. */
export const fileUtility = new FileUtility();
