import {
  AttributeInstance,
  ClassInstance,
  ObjectInstance,
  RelationclassInstance,
  RoleInstance,
  UUID,
} from "@gds";
import { globalObject } from "@/engine/global-definition";
import { instanceUtility } from "./instance-utility";
import { eventBus } from "./event-bus";
import { fileUtility } from "./file-utility";

/**
 * Port of the old `expression_utility.ts` — the `gc.expression.*` API surface the
 * VizRep scripts call. DI stripped: globalObject / instanceUtility / eventBus
 * (was EventAggregator) / fileUtility become module-singleton imports. Bodies
 * unchanged (including the `readyForVizRepUpdate` lock + bus publishes that drive
 * the live-preview loop).
 */
/** What a role instance points at: a class, relation, port, scene or attribute instance. */
function referenceTarget(role: RoleInstance | null | undefined): UUID | undefined {
  if (!role) return undefined;
  return (
    role.uuid_has_reference_class_instance ??
    role.uuid_has_reference_relationclass_instance ??
    role.uuid_has_reference_port_instance ??
    role.uuid_has_reference_scene_instance ??
    role.uuid_has_reference_attribute_instance ??
    undefined
  );
}

export class ExpressionUtility {
  private globalObjectInstance = globalObject;
  private instanceUtility = instanceUtility;
  private eventAggregator = eventBus;

  /**
   * Calls the value of the attribute instance in the local client based on the UUID of the meta attribute.
   * The context is the current class instance.
   *
   * @param {string} UUID - The UUID of the meta attribute.
   * @returns {Promise<string>} - A promise resolving to the value of the attributInstance.
   */
  async attrval(attrUUID: string): Promise<string | undefined> {
    const current_class_instance = this.globalObjectInstance.current_class_instance;
    let attributeInstances = await this.instanceUtility.getAttributeInstanceFromClassInstance(
      attrUUID,
      current_class_instance?.uuid,
      "uuid",
    );
    // if not found in class, get from relationclassInstance
    if (!attributeInstances) {
      attributeInstances = await this.instanceUtility.getAttributeInstanceFromRelationClassInstance(
        attrUUID,
        current_class_instance?.uuid,
        "uuid",
      );
    }
    // if not found in relationclass, get from portInstance
    if (!attributeInstances && this.globalObjectInstance.current_port_instance) {
      attributeInstances = await this.instanceUtility.getAttributeInstanceFromPortInstance(
        attrUUID,
        this.globalObjectInstance.current_port_instance.uuid,
        "uuid",
      );
    }
    return attributeInstances?.value;
  }

  /**
   * Calls the value of the attribute instance in the local client based on the name of the meta attribute.
   * The context is the current class instance.
   *
   * @param {string} attributeName - The name of the meta attribute.
   * @returns {Promise<string>} - A promise resolving to the value of the attributInstance.
   */
  async attrvalByName(attrName: string): Promise<string | undefined> {
    let attributeInstances = await this.instanceUtility.getAttributeInstanceFromClassInstance(
      attrName,
      this.globalObjectInstance.current_class_instance?.uuid,
      "name",
    );
    // if not found in class, get from relationclassInstance
    if (!attributeInstances) {
      attributeInstances = await this.instanceUtility.getAttributeInstanceFromRelationClassInstance(
        attrName,
        this.globalObjectInstance.current_class_instance?.uuid,
        "name",
      );
    }
    // if not found in relationclass, get from portInstance
    if (!attributeInstances && this.globalObjectInstance.current_port_instance) {
      attributeInstances = await this.instanceUtility.getAttributeInstanceFromPortInstance(
        attrName,
        this.globalObjectInstance.current_port_instance.uuid,
        "name",
      );
    }
    return attributeInstances?.value;
  }

  /**
   * Calls the value of the attribute instance in the local client based on the UUID of any type of instance and the meta attribute UUID.
   *
   * @param {string} instUUID - The UUID of any type of instance.
   * @param {string} attrUUID - The UUID of the meta attribute.
   * @returns {Promise<string>} - A promise resolving to the value of the attributInstance.
   */
  async attrvalByInst(attrUUID: string, instUUID: string): Promise<string | undefined> {
    const instance = await this.instanceUtility.getAnyInstance(instUUID);
    const attributeInstances = await this.instanceUtility.getAttributeInstanceFromAnyInstance(
      attrUUID,
      instance!.uuid,
      "uuid",
    );
    return attributeInstances?.value;
  }

  /**
   * Retrieves the attribute instance in the local client based on the UUID of any type of instance and the meta attribute UUID.
   *
   * @param {string} instanceUUID - The UUID of any type of instance.
   * @param {string} metaAttributeUUID - The UUID of the meta attribute.
   * @returns {Promise<AttributeInstance>} - A promise resolving to the attribute instance.
   */
  async getAttrByInstanceUUID(
    instanceUUID: string,
    metaAttributeUUID: string,
  ): Promise<AttributeInstance | undefined> {
    const instance = await this.instanceUtility.getAnyInstance(instanceUUID);
    const attributeInstance = await this.instanceUtility.getAttributeInstanceFromAnyInstance(
      metaAttributeUUID,
      instance!.uuid,
      "uuid",
    );
    return attributeInstance;
  }

  /**
   * Updates the value of the attribute instance in the local client based on the UUID of any type of instance and the meta attribute UUID.
   *
   * @param {string} instanceUUID - The UUID of any type of instance.
   * @param {string} metaAttributeUUID - The UUID of the meta attribute.
   * @param {any} value - The new value of the attribute instance.
   */
  async setAttrvalByInstanceUUID(instanceUUID: string, metaAttributeUUID: string, value: any) {
    const instance = await this.instanceUtility.getAnyInstance(instanceUUID);
    const attributeInstance = await this.instanceUtility.getAttributeInstanceFromAnyInstance(
      metaAttributeUUID,
      instance!.uuid,
      "uuid",
    );
    attributeInstance!.value = value;
  }

  /**
   * Retrieves all class (and relation class) instances in the local client based on the UUID of the meta class.
   *
   * @param {string} metaClassUUID - The UUID of the meta class.
   * @returns {Promise<ClassInstance[]>} - A promise resolving to an array of the class (and relation class) instances.
   */
  async getClassInstancesByMetaUUID(metaClassUUID: string): Promise<ClassInstance[]> {
    const instances = await this.instanceUtility.getAllClassInstancesFromOpenSceneInstance();
    return instances.filter(
      (inst) =>
        (inst instanceof ClassInstance && inst.uuid_class === metaClassUUID) ||
        (inst instanceof RelationclassInstance && inst.uuid_relationclass === metaClassUUID),
    );
  }

  /**
   * Retrieves the source (origin) class instance in the local client based on the UUID of the relation class instance.
   *
   * @param {string} relInstanceUUID - The UUID of the relation class instance.
   * @returns {Promise<ClassInstance>} - A promise resolving to the source class instance.
   */
  async getSourceByRelInstanceUUID(relInstanceUUID: string): Promise<ClassInstance | undefined> {
    const relInstance = await this.instanceUtility.getAnyInstance(relInstanceUUID);
    if (relInstance instanceof RelationclassInstance) {
      const classUUID = relInstance.role_instance_from.uuid_has_reference_class_instance;
      const classInstance = await this.instanceUtility.getAnyInstance(classUUID);
      if (classInstance instanceof ClassInstance) {
        return classInstance;
      }
    }
  }

  /**
   * Retrieves the destination (target) class instance in the local client based on the UUID of the relation class instance.
   *
   * @param {string} relInstanceUUID - The UUID of the relation class instance.
   * @returns {Promise<ClassInstance>} - A promise resolving to the destination class instance.
   */
  async getDestinationByRelInstanceUUID(
    relInstanceUUID: string,
  ): Promise<ClassInstance | null | undefined> {
    const relInstance = await this.instanceUtility.getAnyInstance(relInstanceUUID);
    if (relInstance && relInstance instanceof RelationclassInstance) {
      const role_instance_to = relInstance.role_instance_to;
      if (role_instance_to) {
        const classUUID = relInstance.role_instance_to.uuid_has_reference_class_instance;
        const classInstance = await this.instanceUtility.getAnyInstance(classUUID);
        if (classInstance instanceof ClassInstance) {
          return classInstance;
        } else {
          return null;
        }
      }
    }
  }

  /**
   * Retrieves all relation class instances in the local client where the given instance is the destination (target) based on its UUID and optionally filters them by a specific relation type (metaClassUUID).
   * @param {string} instanceUUID - The UUID of any type of instance.
   * @param {string|null} [metaClassUUID=null] - Optional UUID of the relation class type to filter by.
   * @returns {Promise<RelationclassInstance[]>} - A promise resolving to an array of incoming relation class instances.
   */
  async getIncomingRelationsByInstanceUUID(
    instanceUUID: string,
    metaClassUUID: string | null = null,
  ): Promise<RelationclassInstance[]> {
    const relationClasses = await this.instanceUtility.getIncomingRelationsFromInstance(
      instanceUUID,
      metaClassUUID,
    );
    return relationClasses;
  }

  /**
   * Retrieves all relation class instances in the local client where the given instance is the source (origin) based on its UUID and optionally filters them by a specific relation type (metaClassUUID).
   *
   * @param {string} instanceUUID - The UUID of any type of instance.
   * @param {string|null} [metaClassUUID=null] - Optional UUID of the relation class type to filter by.
   * @returns {Promise<RelationclassInstance[]>} - A promise resolving to an array of outgoing relation class instances.
   */
  async getOutgoingRelationsByInstanceUUID(
    instanceUUID: string,
    metaClassUUID: string | null = null,
  ): Promise<RelationclassInstance[]> {
    const relationClasses = await this.instanceUtility.getOutgoingRelationsFromInstance(
      instanceUUID,
      metaClassUUID,
    );
    return relationClasses;
  }

  /**
   * Checks if any type of instance in the local client has both incoming and outgoing relations (i.e. is connected).
   *
   * @param {string} instanceUUID - The UUID of any type of instance.
   * @returns {Promise<boolean>} - A promise resolving to "true" if the instance is connected, or "false" otherwise.
   */
  async isConnected(instanceUUID: string): Promise<boolean> {
    const incomingRelations = await this.instanceUtility.getIncomingRelationsFromInstance(instanceUUID);
    const outgoingRelations = await this.instanceUtility.getOutgoingRelationsFromInstance(instanceUUID);
    return incomingRelations.length > 0 && outgoingRelations.length > 0;
  }

  // The helpers below match the modeling client's, so a vizRep previews here as it
  // draws there.

  /**
   * The instance whose vizRep is running — in the preview, the instance it shows.
   * Undefined outside a vizRep. Answered by the context `runVizRepFunction` hands the
   * vizRep; this is what any other caller gets.
   */
  async self(): Promise<ObjectInstance | undefined> {
    return undefined;
  }

  /** The value of an attribute of any instance, by the name of its meta attribute. */
  async attrvalByNameAndInst(attrName: string, instUUID: string): Promise<string | undefined> {
    const attributeInstance = await this.instanceUtility.getAttributeInstanceFromAnyInstance(attrName, instUUID, "name");
    return attributeInstance?.value;
  }

  /**
   * The instances at the far ends of the relations that END at the given instance (its
   * sources), each once, in the order of the relations; optionally only relations of the
   * given relation classes.
   */
  async getSourcesByInstanceUUID(instanceUUID: string, relationClassUUIDs: string | string[] | null = null): Promise<ObjectInstance[]> {
    return this.relatedInstances(instanceUUID, relationClassUUIDs, "to");
  }

  /**
   * The instances at the far ends of the relations that START at the given instance (its
   * destinations), each once, in the order of the relations; optionally only relations of
   * the given relation classes.
   */
  async getDestinationsByInstanceUUID(instanceUUID: string, relationClassUUIDs: string | string[] | null = null): Promise<ObjectInstance[]> {
    return this.relatedInstances(instanceUUID, relationClassUUIDs, "from");
  }

  private async relatedInstances(instanceUUID: UUID, relationClassUUIDs: string | string[] | null, end: "from" | "to"): Promise<ObjectInstance[]> {
    const relationClasses = relationClassUUIDs == null ? null : new Set(([] as string[]).concat(relationClassUUIDs));
    const related: ObjectInstance[] = [];
    const seen = new Set<UUID>();
    for (const relation of await this.instanceUtility.getAllRelationClassInstances()) {
      if (relationClasses && !relationClasses.has(relation.uuid_relationclass)) continue;
      const [near, far] = end === "from" ? [relation.role_instance_from, relation.role_instance_to] : [relation.role_instance_to, relation.role_instance_from];
      if (referenceTarget(near) !== instanceUUID) continue;
      const farUUID = referenceTarget(far);
      if (!farUUID || seen.has(farUUID)) continue;
      const instance = await this.instanceUtility.getAnyInstance(farUUID);
      if (!instance) continue;
      seen.add(farUUID);
      related.push(instance as ObjectInstance);
    }
    return related;
  }

  /**
   * The rows of a table attribute of any instance, top to bottom; each row maps its cells
   * under the column's meta attribute name and under its UUID.
   */
  async getTableRows(instanceUUID: string, tableAttrUUID: string): Promise<Record<string, AttributeInstance>[]> {
    const table = await this.instanceUtility.getAttributeInstanceFromAnyInstance(tableAttrUUID, instanceUUID, "uuid");
    const rows: Record<string, AttributeInstance>[] = [];
    for (const cell of table?.table_attributes ?? []) {
      if (!Number.isInteger(cell.table_row) || cell.table_row < 0) continue;
      while (rows.length <= cell.table_row) rows.push({});
      if (cell.name) rows[cell.table_row][cell.name] = cell;
      rows[cell.table_row][cell.uuid_attribute] = cell;
    }
    return rows;
  }

  /** The instance a reference attribute or reference cell points at, if it is in the local client. */
  async getReference(attributeInstance: AttributeInstance): Promise<ObjectInstance | undefined> {
    const target = referenceTarget(attributeInstance?.role_instance_from);
    if (!target) return undefined;
    return ((await this.instanceUtility.getAnyInstance(target)) ?? undefined) as ObjectInstance | undefined;
  }

  /**
   *  Checks if there is a visual update
   */
  async checkForVisualizationUpdate() {
    //wait while the vizrep update is not ready since it is running in another thread
    while (!this.globalObjectInstance.readyForVizRepUpdate) {
      // wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    this.globalObjectInstance.readyForVizRepUpdate = false;
    this.eventAggregator.publish("checkForVizRepUpdate");
  }

  /**
   *  Checks if there is a visual update regarding a specific AttributeInstance
   */
  async checkForVisualizationUpdateByAttributeUUID(instanceUUID: string, metaAttributeUUID: string) {
    const instance = await this.instanceUtility.getAnyInstance(instanceUUID);
    const attributeInstance = await this.instanceUtility.getAttributeInstanceFromAnyInstance(
      metaAttributeUUID,
      instance!.uuid,
      "uuid",
    );
    if (attributeInstance) {
      //wait while the vizrep update is not ready since it is running in another thread
      while (!this.globalObjectInstance.readyForVizRepUpdate) {
        // wait 100ms
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      this.globalObjectInstance.readyForVizRepUpdate = false;
      this.eventAggregator.publish("checkForVizRepUpdateByAttributeInstance", attributeInstance);
    }
  }

  /** A file as a data-URL, for image and icon vizReps. Same contract as the modeling client. */
  async getImageByUUID(fileUUID: UUID): Promise<string> {
    return (await fileUtility.getDataUrl(fileUUID)) ?? "";
  }

  /** A file as raw bytes, for the glTF and STL loaders. Same contract as the modeling client. */
  async getGltfByUUID(fileUUID: UUID): Promise<ArrayBuffer> {
    return (await fileUtility.getArrayBuffer(fileUUID)) ?? new ArrayBuffer(0);
  }
}

export const expressionUtility = new ExpressionUtility();
