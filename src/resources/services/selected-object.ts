import {bindable, EventAggregator, inject, singleton} from "aurelia";
import {SceneType} from "../../../../mmar-global-data-structure/models/meta/Metamodel_scenetypes.structure";
import {Class} from "../../../../mmar-global-data-structure/models/meta/Metamodel_classes.structure";
import {Relationclass} from "../../../../mmar-global-data-structure/models/meta/Metamodel_relationclasses.structure";
import {Port} from "../../../../mmar-global-data-structure/models/meta/Metamodel_ports.structure";
import {AttributeType} from "../../../../mmar-global-data-structure/models/meta/Metamodel_attributetypes.structure";
import {Attribute} from "../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";
import {MetaObject, UUID,} from "../../../../mmar-global-data-structure/models/meta/Metamodel_metaobjects.structure";
import {
    AttributeReference,
    ClassReference,
    PortReference,
    RelationClassReference,
    SceneTypeReference,
} from "../../../../mmar-global-data-structure/models/meta/Metamodel_references.structure";
import {Role} from "../../../../mmar-global-data-structure/models/meta/Metamodel_roles.structure";
import {v4 as uuidv4} from "uuid";
import {Logger} from "./logger";
import {Usergroup} from "../../../../mmar-global-data-structure/models/meta/Metamodel_usergroups.structure";
import {User} from "../../../../mmar-global-data-structure/models/meta/Metamodel_users.structure";
import {ColumnStructure} from "../../../../mmar-global-data-structure/models/meta/Metamodel_columns.structure";
import { Procedure } from "../../../../mmar-global-data-structure";

singleton();

@inject(EventAggregator)
@inject(Logger)
export class SelectedObjectService {
    public sceneTypes: SceneType[] = [];
    public classes: Class[] = [];
    public relationClasses: Relationclass[] = [];
    public ports: Port[] = [];
    public attributeTypes: AttributeType[] = [];
    public attributes: Attribute[] = [];
    public roles: Role[] = [];
    public userGroups: Usergroup[] = [];
    public users: User[] = [];
    public procedures: Procedure[] = [];

    @bindable public selectedObject:
        | SceneType
        | Class
        | Relationclass
        | Port
        | AttributeType
        | Attribute
        | User
        | Procedure
        | Usergroup
        | undefined = undefined;
    public type: string | undefined = undefined;

    @bindable public selectedTab: string | undefined = undefined;

    constructor(
        private eventAggregator: EventAggregator,
        private logger: Logger,
    ) {
        this.sceneTypes = [];
        this.classes = [];
        this.relationClasses = [];
        this.ports = [];
        this.attributeTypes = [];
        this.attributes = [];
        this.roles = [];
        this.procedures = [];
        this.userGroups = [];
        this.users = [];
        this.selectedObject = undefined;
    }

    // Method to get the selected object
    getSelectedObject():
        | SceneType
        | Class
        | Relationclass
        | Port
        | Procedure
        | User
        | Usergroup
        | AttributeType
        | Attribute {
        return this.selectedObject;
    }

    getObjectFromUuid(uuid: UUID): SceneType
        | Class
        | Relationclass
        | Port
        | User
        | Procedure
        | Usergroup
        | AttributeType
        | Attribute | Role | null {
        if (!uuid) return null;
        const type = this.getTypeFromUuid(uuid);
        if (!type) return null;
        return this.getObjects(type).find((obj) => obj.uuid === uuid);
    }

    updateLocalObject(obj: MetaObject) {
        const type = this.getTypeFromUuid(obj.uuid);
        switch (type) {
            case "SceneType":
                this.sceneTypes = this.sceneTypes.map((sceneType) => {
                    if (sceneType.uuid === obj.uuid) {
                        return obj as SceneType;
                    }
                    return sceneType;
                });
                break;
            case "Class":
                this.classes = this.classes.map((class_) => {
                    if (class_.uuid === obj.uuid) {
                        return obj as Class;
                    }
                    return class_;
                });
                break;
            case "RelationClass":
                this.relationClasses = this.relationClasses.map((relationclass_) => {
                    if (relationclass_.uuid === obj.uuid) {
                        return obj as Relationclass;
                    }
                    return relationclass_;
                });
                break;
            case "Port":
                this.ports = this.ports.map((port) => {
                    if (port.uuid === obj.uuid) {
                        return obj as Port;
                    }
                    return port;
                });
                break;
            case "AttributeType":
                this.attributeTypes = this.attributeTypes.map((attributeType) => {
                    if (attributeType.uuid === obj.uuid) {
                        return obj as AttributeType;
                    }
                    return attributeType;
                });
                break;
            case "Attribute":
                this.attributes = this.attributes.map((attribute) => {
                    if (attribute.uuid === obj.uuid) {
                        return obj as Attribute;
                    }
                    return attribute;
                });
                break;
            case "Role":
                this.roles = this.roles.map((role) => {
                    if (role.uuid === obj.uuid) {
                        return obj as Role;
                    }
                    return role;
                });
                break;
            case "Procedure":
                this.procedures = this.procedures.map((procedure) => {
                    if (procedure.uuid === obj.uuid) {
                        return obj as Procedure;
                    }
                    return procedure;
                }
                );
            case "UserGroup":
                this.userGroups = this.userGroups.map((usergroup) => {
                    if (usergroup.uuid === obj.uuid) {
                        return obj as Usergroup;
                    }
                    return usergroup;
                });
                break;
            case "User":
                this.users = this.users.map((user) => {
                    if (user.uuid === obj.uuid) {
                        return obj as User;
                    }
                    return user;
                });
                break;
            default:
                console.warn(`Unknown type: ${type}`);
        }
    }

    // Method to set the selected object
    setSelectedObject(objUuid: string): void {
        const type = this.getTypeFromUuid(objUuid);
        //search for the object in the local storages and set the selected object to the found object
        switch (type) {
            case "SceneType":
                this.selectedObject = this.sceneTypes.find(
                    (sceneType) => sceneType.uuid === objUuid,
                );
                //this.selectedObject = SceneType.fromJS(this.selectedObject) as SceneType;
                break;
            case "Class":
                this.selectedObject = this.classes.find(
                    (class_) => class_.uuid === objUuid,
                );
                //this.selectedObject = Class.fromJS(this.selectedObject) as Class;
                break;
            case "RelationClass":
                this.selectedObject = this.relationClasses.find(
                    (relationClass) => relationClass.uuid === objUuid,
                );
                //this.selectedObject = Relationclass.fromJS(this.selectedObject) as Relationclass;
                break;
            case "Port":
                this.selectedObject = this.ports.find((port) => port.uuid === objUuid);
                //this.selectedObject = Port.fromJS(this.selectedObject) as Port;
                break;
            case "Procedure":
                this.selectedObject = this.procedures.find((procedure) => procedure.uuid === objUuid);
                //this.selectedObject = Procedure.fromJS(this.selectedObject) as Procedure;
                break;
            case "AttributeType":
                this.selectedObject = this.attributeTypes.find(
                    (attributeType) => attributeType.uuid === objUuid,
                );
                //this.selectedObject = AttributeType.fromJS(this.selectedObject) as AttributeType;
                break;
            case "Attribute":
                this.selectedObject = this.attributes.find(
                    (attribute) => attribute.uuid === objUuid,
                );
                //this.selectedObject = Attribute.fromJS(this.selectedObject) as Attribute;
                break;
            case "User":
                this.selectedObject = this.users.find((user) => user.uuid === objUuid);
                //this.selectedObject = User.fromJS(this.selectedObject) as User;
                break;
            case "UserGroup":
                this.selectedObject = this.userGroups.find(
                    (usergroup) => usergroup.uuid === objUuid,
                );
                //this.selectedObject = Usergroup.fromJS(this.selectedObject) as Usergroup;
                break;
            default:
                console.warn(`Unknown type: ${type}`);
        }

        this.type = type;
        const fullobj = this.getObjectFromUuid(objUuid);
        this.logger.log(`Selected object: ${fullobj.name}`, "info");
        this.eventAggregator.publish("SelectedObjectChanged", {
            selectedObject: fullobj,
            type,
        });
    }

    deselectObject() {
        this.selectedObject = null;
        this.type = null;
        this.eventAggregator.publish("SelectedObjectChanged", {
            selectedObject: null,
            type: null,
        });
    }

    resetObjects() {
        this.setSceneTypes([]);
        this.setClasses([]);
        this.setRelationClasses([]);
        this.setPorts([]);
        this.setAttributeTypes([]);
        this.setAttributes([]);
        this.setRoles([]);
        this.setProcedures([]);
        this.setUserGroups([]);
        this.setUsers([]);
        this.deselectObject();
    }

    getTypeFromUuid(uuid: UUID): string | null {
        const typeMappings = [
            {collection: this.getSceneTypes(), type: "SceneType"},
            {collection: this.getClasses(), type: "Class"},
            {collection: this.getRelationClasses(), type: "RelationClass"},
            {collection: this.getPorts(), type: "Port"},
            {collection: this.getAttributeTypes(), type: "AttributeType"},
            {collection: this.getAttributes(), type: "Attribute"},
            {collection: this.getRoles(), type: "Role"},
            {collection: this.getProcedures(), type: "Procedure"},
            {collection: this.getUserGroups(), type: "UserGroup"},
            {collection: this.getUsers(), type: "User"},
        ];
        for (const {collection, type} of typeMappings) {
            if (collection.some(item => item.uuid === uuid)) {
                return type;
            }
        }
        console.warn(`Unknown type for uuid: ${uuid}`);
        return null;
    }


    getObjectsFromRole(role: Role): PortReference[] | ClassReference[] | RelationClassReference[] | SceneTypeReference[] | AttributeReference[] {
        const toReturn: PortReference[] | ClassReference[] | RelationClassReference[] | SceneTypeReference[] | AttributeReference[] = [];
        const allReferences = [
            ...role.class_references,
            ...role.relationclass_references,
            ...role.port_references,
            ...role.scenetype_references,
            ...role.attribute_references,
        ];

        for (const reference of allReferences) {
            const obj: PortReference | ClassReference | RelationClassReference | SceneTypeReference | AttributeReference = this.getObjectFromUuid(reference.uuid) as PortReference | ClassReference | RelationClassReference | SceneTypeReference | AttributeReference;
            obj.min = reference.min;
            obj.max = reference.max;
            if (obj) toReturn.push(obj);
        }
        return toReturn;
    }

    removeChild(uuid: UUID, type?: string) {
        if (!type) {
            type = this.getTypeFromUuid(uuid);
        }
        switch (type) {
            case "SceneType":
                console.warn("SceneType cannot have children");
                break;
            case "Class":
                this.selectedObjectRemoveClass(uuid);
                break;
            case "RelationClass":
                this.selectedObjectRemoveRelationClass(uuid);
                break;
            case "Port":
                this.selectedObjectRemovePort(uuid);
                break;
            case "AttributeType":
                console.warn("Cannot remove attribute type");
                break;
            case "Attribute":
                this.selectedObjectRemoveAttribute(uuid);
                break;
            case "Source":
                this.selectedObjectRemoveRoleFrom(uuid);
                break;
            case "Destination":
                this.selectedObjectRemoveRoleTo(uuid);
                break;
            case "Role":
                this.selectedObjectRemoveReferenceRole(uuid);
                break;
            case "Column":
                this.attributeTypeRemoveColumn(uuid);
                break;
            case "UserGroup":
                this.selectedObjectRemoveUserGroup(uuid);
                break;
            case "Procedure":
                this.selectedObjectRemoveProcedure(uuid);
                break;

            //todo: add user
            default:
                if (this.getTypeFromUuid(uuid)) {
                    this.removeChild(uuid, this.getTypeFromUuid(uuid));
                }
                console.warn(`Unknown type: ${type}`);
        }
    }

    selectedObjectRemoveUserGroup(UserGroupUuid) {
        this.selectedObject = User.fromJS(this.selectedObject) as User;
        this.selectedObject.remove_has_user_group_by_uuid(UserGroupUuid);
    }

    selectedObjectRemoveReferenceRole(uuid: UUID) {
        const type = this.getTypeFromUuid(uuid);
        const referenceTypes = {
            "Class": "class_references",
            "RelationClass": "relationclass_references",
            "Port": "port_references",
            "SceneType": "scenetype_references",
            "Attribute": "attribute_references"
        };

        const referenceKey = referenceTypes[type];

        if (referenceKey) {
            (this.selectedObject as AttributeType).role[referenceKey] = (this.selectedObject as AttributeType).role[referenceKey].filter(
                (ref) => ref.uuid !== uuid
            );
        } else {
            console.warn(`Unknown type: ${type}`);
        }
    }

    selectedObjectRemoveRoleFrom(uuid: UUID) {
        switch (this.getTypeFromUuid(uuid)) {
            case "Class":
                (this.selectedObject as Relationclass).role_from.class_references = (
                    this.selectedObject as Relationclass
                ).role_from.class_references.filter((cr) => cr.uuid !== uuid);
                break;
            case "RelationClass":
                (
                    this.selectedObject as Relationclass
                ).role_from.relationclass_references = (
                    this.selectedObject as Relationclass
                ).role_from.relationclass_references.filter((rr) => rr.uuid !== uuid);
                break;
            case "Port":
                (this.selectedObject as Relationclass).role_from.port_references = (
                    this.selectedObject as Relationclass
                ).role_from.port_references.filter((pr) => pr.uuid !== uuid);
                break;
            case "SceneType":
                (this.selectedObject as Relationclass).role_from.scenetype_references =
                    (
                        this.selectedObject as Relationclass
                    ).role_from.scenetype_references.filter((sr) => sr.uuid !== uuid);
                break;
            case "Attribute":
                (this.selectedObject as Relationclass).role_from.attribute_references =
                    (
                        this.selectedObject as Relationclass
                    ).role_from.attribute_references.filter((ar) => ar.uuid !== uuid);
                break;
            default:
                console.warn(`Unknown type: ${this.getTypeFromUuid(uuid)}`);
        }
    }

    selectedObjectRemoveRoleTo(uuid: UUID) {
        switch (this.getTypeFromUuid(uuid)) {
            case "Class":
                (this.selectedObject as Relationclass).role_to.class_references = (
                    this.selectedObject as Relationclass
                ).role_to.class_references.filter((cr) => cr.uuid !== uuid);
                break;
            case "RelationClass":
                (
                    this.selectedObject as Relationclass
                ).role_to.relationclass_references = (
                    this.selectedObject as Relationclass
                ).role_to.relationclass_references.filter((rr) => rr.uuid !== uuid);
                break;
            case "Port":
                (this.selectedObject as Relationclass).role_to.port_references = (
                    this.selectedObject as Relationclass
                ).role_to.port_references.filter((pr) => pr.uuid !== uuid);
                break;
            case "SceneType":
                (this.selectedObject as Relationclass).role_to.scenetype_references = (
                    this.selectedObject as Relationclass
                ).role_to.scenetype_references.filter((sr) => sr.uuid !== uuid);
                break;
            case "Attribute":
                (this.selectedObject as Relationclass).role_to.attribute_references = (
                    this.selectedObject as Relationclass
                ).role_to.attribute_references.filter((ar) => ar.uuid !== uuid);
                break;
            default:
                console.warn(`Unknown type: ${this.getTypeFromUuid(uuid)}`);
        }
    }

    updateMinMax(uuid: UUID, min: number, max: number) {
        if (!this.selectedObject) {
            console.warn("No selected object to update");
            return;
        }


        const updateReferenceMinMax = (references: PortReference[] | ClassReference[] | RelationClassReference[] | SceneTypeReference[] | AttributeReference[]) => {
            for (const reference of references) {
                if (reference.uuid === uuid) {
                    reference.min = min;
                    reference.max = max;
                    return true;
                }
            }
            return false;
        };

        const relationClass = this.selectedObject as Relationclass;
        const role = (this.selectedObject as AttributeType).role;

        switch (this.type) {
            case "AttributeType":
            case "Role":
                if (
                    updateReferenceMinMax(role.class_references) ||
                    updateReferenceMinMax(role.relationclass_references) ||
                    updateReferenceMinMax(role.port_references) ||
                    updateReferenceMinMax(role.scenetype_references) ||
                    updateReferenceMinMax(role.attribute_references)
                ) {
                    this.logger.log(`Updated min/max for role reference ${uuid}, min: ${min}, max: ${max}`, "info");
                    return;
                }
                break;
            case "RelationClass":
                if (
                    updateReferenceMinMax(relationClass.role_from.class_references) ||
                    updateReferenceMinMax(relationClass.role_from.relationclass_references) ||
                    updateReferenceMinMax(relationClass.role_from.port_references) ||
                    updateReferenceMinMax(relationClass.role_from.scenetype_references) ||
                    updateReferenceMinMax(relationClass.role_from.attribute_references) ||
                    updateReferenceMinMax(relationClass.role_to.class_references) ||
                    updateReferenceMinMax(relationClass.role_to.relationclass_references) ||
                    updateReferenceMinMax(relationClass.role_to.port_references) ||
                    updateReferenceMinMax(relationClass.role_to.scenetype_references) ||
                    updateReferenceMinMax(relationClass.role_to.attribute_references)
                ) {
                    this.logger.log(`Updated min/max for relation class reference ${uuid}`, "info");
                    return;
                }
                break;
            default:
                console.warn(`Unsupported type for updateMinMax: ${this.type}`);
        }

        console.warn(`Reference with uuid ${uuid} not found`);
    }

    selectedObjectRemoveClass(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.logger.log(
            `Removed class ${uuid} from selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.classes = this.selectedObject.classes.filter(
            (class_) => class_.uuid !== uuid,
        );
    }

    selectedObjectRemoveRelationClass(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.logger.log(
            `Removed relation class ${uuid} from selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.relationclasses =
            this.selectedObject.relationclasses.filter(
                (relationclass_) => relationclass_.uuid !== uuid,
            );
    }

    selectedObjectRemovePort(uuid: UUID) {
        this.selectedObject = this.selectedObject as
            | SceneType
            | Class
            | Relationclass;
        this.logger.log(
            `Removed port ${uuid} from selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.ports = this.selectedObject.ports.filter(
            (port) => port.uuid !== uuid,
        );
    }

    selectedObjectRemoveAttribute(uuid: UUID) {
        this.selectedObject = this.selectedObject as
            | SceneType
            | Class
            | Relationclass
            | Port;
        this.logger.log(
            `Removed attribute ${uuid} from selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.attributes = this.selectedObject.attributes.filter(
            (attribute) => attribute.uuid !== uuid,
        );
    }

    addChild(uuid: UUID, type: string) {
        switch (type) {
            case "SceneType":
                console.warn("Cannot add scene type as a child of another object");
                break;
            case "Class":
                this.selectedObjectAddClass(uuid);
                break;
            case "RelationClass":
                this.selectedObjectAddRelationClass(uuid);
                break;
            case "Port":
                this.selectedObjectAddPort(uuid);
                break;
            case "Attribute Type":
                (this.selectedObject as Attribute).attribute_type = this.getObjectFromUuid(uuid) as AttributeType;
                break;
            case "Attribute":
                this.selectedObjectAddAttribute(uuid);
                break;
            case "Source":
                this.relationclassAddToRoleFrom(uuid);
                break;
            case "Destination":
                this.relationclassAddToRoleTo(uuid);
                break;
            case "Role":
                this.selectedObjectAddReferenceRole(uuid, 0, 1);
                break;
            case "Column":
                this.attributeTypeAddColumn(uuid, 1);
                break;
            case "Bendpoint":
                (this.selectedObject as Relationclass).bendpoint = uuid;
                break;
            case "UserGroup":
                this.selecedObjectAddUserGroup(uuid)
                break;
            case "Procedure":
                this.selectedObjectAddProcedure(uuid);
                break;
            default:
                console.warn(`Unknown type: ${type}`);
        }
    }


    selecedObjectAddUserGroup(uuid: UUID) {
        this.selectedObject = User.fromJS(this.selectedObject) as User;
        const usrgrp = this.getObjectFromUuid(uuid) as Usergroup;
        if (!usrgrp) {
            console.warn(`Usergroup with uuid ${uuid} not found`);
            return;
        }
        this.selectedObject.add_has_user_group(usrgrp);

    }

    selectedObjectAddProcedure(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.selectedObject.procedures.push(
            this.procedures.find((c) => c.uuid === uuid) as Procedure,
        );
        this.logger.log(
            `Added procedure ${uuid} to selected object ${this.selectedObject.uuid}`,
            "info",
        );
    }

    selectedObjectRemoveProcedure(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.logger.log(
            `Removed Procedure ${uuid} from selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.procedures = this.selectedObject.procedures.filter(
            (procedure_) => procedure_.uuid !== uuid,
        );
    }

    

    attributeTypeAddColumn(uuid: UUID, sequence: number) {
        const attribute = this.getObjectFromUuid(uuid) as Attribute;

        if (!attribute) {
            console.warn(`Attribute with uuid ${uuid} not found`);
            return;
        }

        this.selectedObject = this.selectedObject as AttributeType;
        /*
        this.selectedObject.has_table_attribute.push({
            attribute: attribute,
            sequence: sequence
        })
         */
        this.selectedObject.has_table_attribute.push(
            new ColumnStructure(attribute, sequence),
        )


    }

    attributeTypeRemoveColumn(uuid: UUID) {
        this.selectedObject = this.selectedObject as AttributeType;
        this.selectedObject.has_table_attribute = this.selectedObject.has_table_attribute.filter(
            (column) => column.attribute.uuid !== uuid,
        );
    }

    relationclassAddToRoleFrom(uuid: UUID) {
        const role = (this.selectedObject as Relationclass).role_from;

        switch (this.getTypeFromUuid(uuid)) {
            case "Class":
                role.class_references.push(new ClassReference(uuid, 0, 1));
                break;
            case "RelationClass":
                role.relationclass_references.push(
                    new RelationClassReference(uuid, 0, 1),
                );
                break;
            case "Port":
                role.port_references.push(new PortReference(uuid, 0, 1));
                break;
            case "SceneType":
                role.scenetype_references.push(new SceneTypeReference(uuid, 0, 1));
                break;
            case "Attribute":
                role.attribute_references.push(new AttributeReference(uuid, 0, 1));
                break;
            default:
                console.warn(`Unknown type: ${this.getTypeFromUuid(uuid)}`);
        }

    }

    relationclassAddToRoleTo(uuid: UUID) {
        const role = (this.selectedObject as Relationclass).role_to;

        switch (this.getTypeFromUuid(uuid)) {
            case "Class":
                role.class_references.push(new ClassReference(uuid, 0, 1));
                break;
            case "RelationClass":
                role.relationclass_references.push(
                    new RelationClassReference(uuid, 0, 1),
                );
                break;
            case "Port":
                role.port_references.push(new PortReference(uuid, 0, 1));
                break;
            case "SceneType":
                role.scenetype_references.push(new SceneTypeReference(uuid, 0, 1));
                break;
            case "Attribute":
                role.attribute_references.push(new AttributeReference(uuid, 0, 1));
                break;
            default:
                console.warn(`Unknown type: ${this.getTypeFromUuid(uuid)}`);
        }

    }

    selectedObjectAddReferenceRole(uuid: UUID, min: number, max: number) {
        // find the first role
        // if the role is not found create a new role and add the reference to the role
        // if the role is found add the reference to the role
        let role = (this.selectedObject as AttributeType).role;

        if (!role) {
            role = new Role(uuidv4(), `RoleRef_${uuid}`);
            (this.selectedObject as AttributeType).role = role;
        }

        switch (this.getTypeFromUuid(uuid)) {
            case "Class":
                role.class_references.push(new ClassReference(uuid, min, max));
                break;
            case "RelationClass":
                role.relationclass_references.push(
                    new RelationClassReference(uuid, min, max),
                );
                break;
            case "Port":
                role.port_references.push(new PortReference(uuid, min, max));
                break;
            case "SceneType":
                role.scenetype_references.push(new SceneTypeReference(uuid, min, max));
                break;
            case "Attribute":
                role.attribute_references.push(new AttributeReference(uuid, min, max));
                break;
            default:
                console.warn(`Unknown type: ${this.getTypeFromUuid(uuid)}`);
        }
    }

    selectedObjectAddClass(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.selectedObject.classes.push(
            this.classes.find((c) => c.uuid === uuid) as Class,
        );
        this.logger.log(
            `Added class ${uuid} to selected object ${this.selectedObject.uuid}`,
            "info",
        );
    }

    selectedObjectAddRelationClass(uuid: UUID) {
        this.selectedObject = this.selectedObject as SceneType;
        this.logger.log(
            `Added relation class ${uuid} to selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.relationclasses.push(
            this.relationClasses.find((rc) => rc.uuid === uuid) as Relationclass,
        );
    }

    selectedObjectAddPort(uuid: UUID) {
        this.selectedObject = this.selectedObject as
            | SceneType
            | Class
            | Relationclass;
        this.logger.log(
            `Added port ${uuid} to selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.ports.push(
            this.ports.find((p) => p.uuid === uuid) as Port,
        );
    }

    selectedObjectAddAttribute(uuid: UUID) {
        this.selectedObject = this.selectedObject as
            | SceneType
            | Class
            | Relationclass
            | Port;
        this.logger.log(
            `Added attribute ${uuid} to selected object ${this.selectedObject.uuid}`,
            "info",
        );
        this.selectedObject.attributes.push(
            this.attributes.find((a) => a.uuid === uuid) as Attribute,
        );
    }

    getAllObjects(): MetaObject[] {
        const toReturn: MetaObject[] = [];
        toReturn.push(...this.sceneTypes);
        toReturn.push(...this.classes);
        toReturn.push(...this.relationClasses);
        toReturn.push(...this.ports);
        toReturn.push(...this.attributeTypes);
        toReturn.push(...this.attributes);
        toReturn.push(...this.procedures);
        return toReturn;
    }

    setUsers(users: User[]) {
        this.users = users;
    }

    getUsers(): User[] {
        return this.users;
    }

    addUser(user: User) {
        this.users.push(user);
    }

    removeUser(userUuid: UUID) {
        this.users = this.users.filter((user) => user.uuid !== userUuid);
    }

    setUserGroups(userGroups: Usergroup[]) {
        this.userGroups = userGroups;
    }

    getUserGroups(): Usergroup[] {
        return this.userGroups;
    }

    addUserGroup(userGroup: Usergroup) {
        this.userGroups.push(userGroup);
    }

    removeUserGroup(userGroupUuid: UUID) {
        this.userGroups = this.userGroups.filter(
            (userGroup) => userGroup.uuid !== userGroupUuid,
        );
    }

    setRoles(roles: Role[]) {
        this.roles = roles;
    }

    getRoles(): Role[] {
        return this.roles;
    }

    addRole(role: Role) {
        this.roles.push(role);
    }

    removeRole(roleUuid: UUID) {
        this.roles = this.roles.filter((role) => role.uuid !== roleUuid);
    }

    setSceneTypes(sceneTypes: SceneType[]) {
        this.sceneTypes = sceneTypes;
    }

    getSceneTypes(): SceneType[] {
        return this.sceneTypes;
    }

    addSceneType(sceneType: SceneType) {
        this.sceneTypes.push(sceneType);
    }

    removeSceneType(sceneTypeUuid: UUID) {
        this.sceneTypes = this.sceneTypes.filter(
            (sceneType) => sceneType.uuid !== sceneTypeUuid,
        );
    }

    setClasses(classes: Class[]) {
        this.classes = classes;
    }

    getClasses(): Class[] {
        return this.classes;
    }

    addClass(class_: Class) {
        this.classes.push(class_);
    }

    removeClass(classUuid: UUID) {
        this.classes = this.classes.filter((class_) => class_.uuid !== classUuid);
    }

    setRelationClasses(relationClasses: Relationclass[]) {
        this.relationClasses = relationClasses;
    }

    getRelationClasses(): Relationclass[] {
        return this.relationClasses;
    }

    addRelationClass(relationClass: Relationclass) {
        this.relationClasses.push(relationClass);
    }

    removeRelationClass(relationClassUuid: UUID) {
        this.relationClasses = this.relationClasses.filter(
            (relationClass) => relationClass.uuid !== relationClassUuid,
        );
    }

    setPorts(ports: Port[]) {
        this.ports = ports;
    }

    getPorts(): Port[] {
        return this.ports;
    }

    addPort(port: Port) {
        this.ports.push(port);
    }

    removePort(portUuid: UUID) {
        this.ports = this.ports.filter((port) => port.uuid !== portUuid);
    }

    setProcedures(procedures: Procedure[]) {
        this.procedures = procedures;
    }

    getProcedures(): Procedure[] {
        return this.procedures;
    }

    addProcedure(procedure: Procedure) {
        this.procedures.push(procedure);
    }

    removeProcedure(procedureUuid: UUID) {
        this.procedures = this.procedures.filter(
            (procedure) => procedure.uuid !== procedureUuid,
        );
    }

    setAttributeTypes(attributeTypes: AttributeType[]) {
        this.attributeTypes = attributeTypes;
    }

    getAttributeTypes(): AttributeType[] {
        return this.attributeTypes;
    }

    addAttributeType(attributeType: AttributeType) {
        this.attributeTypes.push(attributeType);
    }

    removeAttributeType(attributeTypeUuid: UUID) {
        this.attributeTypes = this.attributeTypes.filter(
            (attributeType) => attributeType.uuid !== attributeTypeUuid,
        );
    }

    setAttributes(attributes: Attribute[]) {
        this.attributes = attributes;
    }

    getAttributes(): Attribute[] {
        return this.attributes;
    }

    addAttribute(attribute: Attribute) {
        this.attributes.push(attribute);
    }

    removeAttribute(attributeUuid: UUID) {
        this.attributes = this.attributes.filter(
            (attribute) => attribute.uuid !== attributeUuid,
        );
    }

    getType(): string | null {
        return this.type;
    }

    getObjects(type: string) {
        try {
            let toReturn = [];

            switch (type) {
                case "SceneType":
                    return this.getSceneTypes();
                case "Class":
                    return this.getClasses();
                case "RelationClass":
                    return this.getRelationClasses();
                case "Attribute Type":
                    return this.getAttributeTypes();
                case "AttributeType":
                    return this.getAttributeTypes();
                case "Attribute":
                    return this.getAttributes();
                case "Port":
                    return this.getPorts();
                case "Procedure":
                    return this.getProcedures();
                case "User":
                    return this.getUsers();
                case "UserGroup":
                    return this.getUserGroups();
                case "All":
                    toReturn = toReturn.concat(this.getSceneTypes());
                    toReturn = toReturn.concat(this.getClasses());
                    toReturn = toReturn.concat(this.getRelationClasses());
                    //toReturn = toReturn.concat(this.getAttributeTypes());
                    toReturn = toReturn.concat(this.getAttributes());
                    toReturn = toReturn.concat(this.getPorts());
                    toReturn = toReturn.concat(this.getProcedures());
                    return toReturn;
                default:
                    console.warn(`Unknown type: ${type}`);
            }
        } catch (error) {
            console.error("There was an error getting the objects:", error);
        }
    }


    setObjects<T>(objects: T[], type: string) {
        switch (type) {
            case "SceneType":
                this.setSceneTypes(objects as SceneType[]);
                break;
            case "Class":
                this.setClasses(objects as Class[]);
                break;
            case "RelationClass":
                this.setRelationClasses(objects as Relationclass[]);
                break;
            case "Port":
                this.setPorts(objects as Port[]);
                break;
            case "AttributeType":
                this.setAttributeTypes(objects as AttributeType[]);
                break;
            case "Attribute":
                this.setAttributes(objects as Attribute[]);
                break;
            case "UserGroup":
                this.setUserGroups(objects as Usergroup[]);
                break;
            case "User":
                this.setUsers(objects as User[]);
                break;
            case "Procedure":
                this.setProcedures(objects as Procedure[]);
                break;
            default:
                console.warn(`Unknown type: ${type}`);
        }
    }

    addObject<T>(objects: T[] | T, type: string) {
        if (!Array.isArray(objects)) {
            objects = [objects];
        }
        for (const object of objects) {
            switch (type) {
                case "SceneType":
                    this.addSceneType(object as SceneType);
                    break;
                case "Class":
                    this.addClass(object as Class);
                    break;
                case "RelationClass":
                    this.addRelationClass(object as Relationclass);
                    break;
                case "Port":
                    this.addPort(object as Port);
                    break;
                case "AttributeType":
                    this.addAttributeType(object as AttributeType);
                    break;
                case "Attribute":
                    this.addAttribute(object as Attribute);
                    break;
                case "UserGroup":
                    this.addUserGroup(object as Usergroup);
                    break;
                case "User":
                    this.addUser(object as User);
                    break;
                case "Procedure":
                    this.addProcedure(object as Procedure);
                    break;
                default:
                    console.warn(`Unknown type: ${type}`);
            }
        }
    }

    getIcon(wholeVizRep: string): string {
        let vizRep: string = wholeVizRep;
        let map = "";

        if (!vizRep) {
            // return a default image in base64

            const defaultImageBase64 =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAAAdElEQVRYw+2SwQ2AIBAEpwC6oSdqoii6oQD8+DHBAOdpNO7sCx7MbgII8SSBRKGQCP6PRzKVtqeSib69WycOW469ezFvOe/tsGXc27xlrffiFlvvhS3NORJIIMFbBLNIIMGfBKN7Ce4XfPcXzZ4luCYQwsoGpwTEXjWPD4EAAAAASUVORK5CYII=";
            return defaultImageBase64;
        }

        //if icon defined
        vizRep = wholeVizRep.split("let icon")[1];
        if (vizRep) {
            const arrStr: string[] = vizRep.split("'");
            for (const substring of arrStr) {
                const string: string = substring;
                if (string.startsWith("data")) {
                    map = string;
                }
            }
        }

        //if icon not defined try to take map
        if (map == "") {
            vizRep = wholeVizRep.split("let map")[1];
            if (vizRep) {
                const arrStr: string[] = vizRep.split("'");
                for (const substring of arrStr) {
                    const string: string = substring;
                    if (string.startsWith("data")) {
                        map = string;
                    }
                }
            }
        }

        return map;
    }

    removeObject(objectUuids: string | string[]) {
        if (!Array.isArray(objectUuids)) {
            objectUuids = [objectUuids];
        }
        for (const objectUuid of objectUuids) {
            const type = this.getTypeFromUuid(objectUuids[0]);
            const object = this.getObjectFromUuid(objectUuid);
            switch (type) {
                case "SceneType":
                    this.removeSceneType((object as SceneType).uuid);
                    break;
                case "Class":
                    this.removeClass((object as Class).uuid);
                    break;
                case "RelationClass":
                    this.removeRelationClass((object as Relationclass).uuid);
                    break;
                case "Port":
                    this.removePort((object as Port).uuid);
                    break;
                case "AttributeType":
                    this.removeAttributeType((object as AttributeType).uuid);
                    break;
                case "Attribute":
                    this.removeAttribute((object as Attribute).uuid);
                    break;
                case "UserGroup":
                    this.removeUserGroup((object as Usergroup).uuid);
                    break;
                case "User":
                    this.removeUser((object as User).uuid);
                    break;
                case "Procedure":
                    this.removeProcedure((object as Procedure).uuid);
                    break;
                default:
                    console.warn(`Unknown type: ${type}`);
            }
        }
    }
}
