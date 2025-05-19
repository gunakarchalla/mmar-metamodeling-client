import { inject, singleton } from "aurelia";
import { HttpClient } from "@aurelia/fetch-client";
import { SelectedObjectService } from "./selected-object";
import { Class } from "../../../../mmar-global-data-structure/models/meta/Metamodel_classes.structure";
import { SceneType } from "../../../../mmar-global-data-structure/models/meta/Metamodel_scenetypes.structure";
import { AttributeType } from "../../../../mmar-global-data-structure/models/meta/Metamodel_attributetypes.structure";
import { Attribute } from "../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";
import { Relationclass } from "../../../../mmar-global-data-structure/models/meta/Metamodel_relationclasses.structure";
import { Port } from "../../../../mmar-global-data-structure/models/meta/Metamodel_ports.structure";
import { File } from "../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure";
import { Usergroup } from "../../../../mmar-global-data-structure/models/meta/Metamodel_usergroups.structure";
import { User } from "../../../../mmar-global-data-structure/models/meta/Metamodel_users.structure";
import { v4 as uuidv4 } from "uuid";
import { Role } from "../../../../mmar-global-data-structure/models/meta/Metamodel_roles.structure";
import { MetaObject } from "../../../../mmar-global-data-structure/models/meta/Metamodel_metaobjects.structure";
import { Logger } from "./logger";
import { UserService } from "./user-service";
import { Procedure } from "../../../../mmar-global-data-structure";

singleton();

@inject(HttpClient)
@inject(SelectedObjectService)
@inject(Logger)
@inject(UserService)
export class BackendService {
  private baseUrl = process.env.API_URL + "/" || "http://localhost:8000/";

  constructor(
    private http: HttpClient,
    private selectedObjectService: SelectedObjectService,
    private logger: Logger,
    private userService: UserService,
  ) {
    this.http.configure((config) =>
      config.withBaseUrl(this.baseUrl).withDefaults({
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "Fetch",
        },
      }),
    );
  }

  // test if the server is running
  async ping(): Promise<boolean> {
    try {
      if (this.userService.checkTokenAndLogoutIfExpired()) {
        this.userService.logout();
        return;
      }
      return (await this.http.fetch("test")).ok;
    } catch (error) {
      this.logger.log(`Error testing server: ${error}`, "error");
    }
  }

  async getSceneTypes(): Promise<SceneType[]> {
    try {
      const sceneTypes: SceneType[] = [];
      //this.selectedObjectService.setSceneTypes([]);
      const token = localStorage.getItem("auth_token");
      if (!token) return [];
      const response = await this.http.fetch("metamodel/sceneTypes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        new Error("Failed to get scene types");
      } else {
        for (const sceneType of (await response.json()).sceneTypes) {
          //sceneType.type = "SceneType";
          sceneTypes.push(SceneType.fromJS(sceneType) as SceneType);
        }

        this.selectedObjectService.setSceneTypes(sceneTypes);
      }
      return this.selectedObjectService.getSceneTypes();
    } catch (error) {
      this.logger.log(`Error getting scene types: ${error}`, "error");
    }
  }

  async getUserGroups(): Promise<Usergroup[]> {
    return this.fetchData<Usergroup>("usergroups", "UserGroup");
  }

  async getUsers(): Promise<User[]> {
    return this.fetchData<User>("users", "User");
  }

  async getClasses(): Promise<Class[]> {
    return this.fetchData<Class>("metamodel/classes", "Class");
  }

  async getAttributeTypes(): Promise<AttributeType[]> {
    return this.fetchData<AttributeType>(
      "metamodel/attributeTypes",
      "AttributeType",
    );
  }

  async getAttributes(): Promise<Attribute[]> {
    return this.fetchData<Attribute>("metamodel/attributes", "Attribute");
  }

  async getRelationClasses(): Promise<Relationclass[]> {
    return this.fetchData<Relationclass>(
      "metamodel/relationclasses",
      "RelationClass",
    );
  }

  async getPorts(): Promise<Port[]> {
    return this.fetchData<Port>("metamodel/ports", "Port");
  }

  async getFiles(): Promise<File[]> {
    return this.fetchData<File>("metamodel/files", "File");
  }

  // async getFileByUUID(uuid: string): Promise<File> {
  //   try {
  //     const token = localStorage.getItem("auth_token");
  //     if (!token) return;
  //     const response = await this.http.fetch(`metamodel/files/${uuid}`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     if (!response.ok) {
  //       throw new Error(`Failed to get file`);
  //     }
  //     const returnedObject = await response.json();
  //     returnedObject.type = "File";
  //     // update the object if it appears in the selected object service list
  //     this.selectedObjectService.updateLocalObject(returnedObject);
  //     return returnedObject;
  //   } catch (error) {
  //     this.logger.log(`Error getting file: ${error}`, "error");
  //   }
  // }

  async getFileByUUID(uuid: string): Promise<globalThis.File> {
    try {
      const response = await this.http.fetch(`metamodel/files/${uuid}`);
      if (!response.ok) {
        throw new Error(`${response.statusText} - ${await response.json()}`);
      }
      const blob = await response.blob();
      const file = new globalThis.File([blob], uuid, { type: blob.type });
      return file;
    } catch (error) {
      this.logger.log(`Error fetching endpoint: ${error}`, "error");
    }
  }

  async patchFileByUUID(uuid: string, file: globalThis.File): Promise<string> {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const formData = new FormData();
      formData.append("file", file);
      const response = await this.http.fetch(`metamodel/files/${uuid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`${response.statusText} - ${await response.json()}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.log(`Error patching file: ${error}`, "error");
    }
  }

  async getProcedures(): Promise<Procedure[]> {
    return this.fetchData<Procedure>("metamodel/procedures", "Procedure");
  }

  async getIndependentProcedures(): Promise<Procedure[]> {
    return this.fetchData<Procedure>("metamodel/independent_procedures", "Procedure");
  }


  async getUsersByUserGroupUuid(uuid: string): Promise<User[]> {
    return this.fetchData<User>(`users/usergroups/${uuid}`, "User");
  }

  async createNewObject(type: string) {
    try {
      const initialType = type;
      type = this.getCorrectType(type);
      const token = localStorage.getItem("auth_token");
      const generatedUuid = uuidv4();

      const content = {
        uuid: generatedUuid,
        name: "New " + type,
      };

      if (type === "attributes") {
        content["attribute_type"] = {
          uuid: "85897325-c2b3-4ca7-8902-8120300a08dc",
        };
      }

      if (type === "relationclasses") {
        content["role_from"] = {
          uuid: uuidv4(),
        };
        content["role_to"] = {
          uuid: uuidv4(),
        };
      }

      let url = `metamodel/${type}/${generatedUuid}`;
      if (type === "userGroups") url = `${type}/${generatedUuid}`;
      const response = await this.http.fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });
      if (!response.ok) throw new Error(`Failed to create ${type}`);
      const toReturn = await response.json();
      toReturn.type = initialType;
      this.selectedObjectService.addObject(toReturn, initialType);
      return toReturn;
    } catch (error) {
      this.logger.log(`Error creating new object: ${error}`, "error");
    }
  }

  async saveSelectedObject() {
    try {
      const initialType = this.selectedObjectService.getType();
      const type = this.getCorrectType(initialType);
      const object = this.selectedObjectService.getSelectedObject();
      const token = localStorage.getItem("auth_token");
      let url = `metamodel/${type}/${object.uuid}?hardpatch=true`;
      if (type === "users") url = `${type}/${object.uuid}?hardpatch=true`;
      if (type === "userGroups") url = `${type}/${object.uuid}?hardpatch=true`;
      const response = await this.http.fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(object),
      });

      if (!response.ok) throw new Error(`Failed to get ${type}`);

      this.logger.log(`Object ${object.name} saved`, "info");
      const toReturn = await response.json();
      toReturn.type = initialType;
      this.selectedObjectService.updateLocalObject(toReturn);
      return toReturn;
    } catch (error) {
      this.logger.log(`Error saving object: ${error}`, "error");
    }
  }

  async postRole(): Promise<Role> {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await this.http.fetch(`metamodel/roles/${uuidv4()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to post role`);
      }
      return await response.json();
    } catch (error) {
      console.error("There was an error posting the role:", error);
    }
  }

  async getSpecificObject(
    uuid: string,
    type: string,
  ): Promise<{ MetaObject: MetaObject; Type: string }> {
    try {
      const initialType = type;
      type = this.getCorrectType(type);
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      let url = `metamodel/${type}/${uuid}`;
      if (type === "userGroups") url = `${type}/${uuid}`;
      if (type === "users") url = `${type}/uuid/${uuid}`;
      const response = await this.http.fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to get ${type}`);
      }
      const returnedObject = await response.json();
      returnedObject.type = initialType;
      // update the object if it appears in the selected object service list
      this.selectedObjectService.updateLocalObject(returnedObject);
      return { MetaObject: returnedObject, Type: initialType };
    } catch (error) {
      this.logger.log(`Error getting object: ${error}`, "error");
    }
  }

  async deleteObject(uuid: string, type: string) {
    try {
      type = this.getCorrectType(type);
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      let url = `metamodel/${type}/${uuid}`;
      if (type === "userGroups") url = `${type}/${uuid}`;
      if (type === "users") url = `${type}/uuid/${uuid}`;
      const response = await this.http.fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok)
        throw new Error(`${response.statusText} - ${await response.json()}`);
      this.selectedObjectService.removeObject(uuid);

      return await response.json();
    } catch (error) {
      this.logger.log(`Error deleting ${type}: ${error}`, "error");
    }
  }

  async getObjects(type: string) {
    try {
      switch (type) {
        case "SceneType":
          return this.getSceneTypes();
        case "Class":
          return this.getClasses();
        case "RelationClass":
          return this.getRelationClasses();
        case "AttributeType":
          return this.getAttributeTypes();
        case "Attribute":
          return this.getAttributes();
        case "Port":
          return this.getPorts();
        case "File":
          return this.getFiles();
        case "Procedure":
          return this.getProcedures();
        case "UserGroup":
          return this.getUserGroups();
        case "User":
          return this.getUsers();

        default:
          console.warn(`Unknown type: ${type}`);
      }
    } catch (error) {
      console.error("There was an error getting the objects:", error);
    }
  }

  getCorrectType(type: string) {
    switch (type) {
      case "SceneType":
        return "sceneTypes";
        break;
      case "Class":
        return "classes";
        break;
      case "RelationClass":
        return "relationclasses";
        break;
      case "AttributeType":
        return "attributeTypes";
        break;
      case "Attribute":
        return "attributes";
        break;
      case "Port":
        return "ports";
        break;
      case "File":
        return "files";
        break;
      case "Role":
        return "roles";
        break;
      case "Procedure":
        return "procedures";
        break;
      case "UserGroup":
        return "userGroups";
        break;
      case "User":
        return "users";
        break;
      default:
        console.warn(`Unknown type: ${type}`);
    }
  }

  private async fetchData<T>(
    endpoint: string,
    objectType: string,
  ): Promise<T[]> {
    try {
      const items: T[] = [];
      //this.selectedObjectService.setObjects([], objectType);
      const token = localStorage.getItem("auth_token");
      if (!token) return [];
      const response = await this.http.fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`${response.statusText} - ${await response.json()}`);
      }
      for (const item of await response.json()) {
        //item.type = objectType;
        items.push(item);
      }
      this.selectedObjectService.setObjects(items, objectType);
      return this.selectedObjectService.getObjects(objectType);
    } catch (error) {
      this.logger.log(
        `Error getting ${objectType.toLowerCase()}s: ${error}`,
        "error",
      );
      return [];
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T | undefined> {
    try {
      const response = await this.http.fetch(endpoint);
      if (!response.ok) {
        throw new Error(`${response.statusText} - ${await response.json()}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.log(`Error fetching ${endpoint}: ${error}`, "error");
    }
  }
}
