import { bindable, customElement } from "aurelia";
import { MetaObject } from "../../../../mmar-global-data-structure/models/meta/Metamodel_metaobjects.structure";
import { SelectedObjectService } from "../../resources/services/selected-object";

@customElement("modal-object-select")
export class ModalObjectSelect {
  // attribute to be bound to the modal window
  @bindable objecttype: string;
  @bindable({
    set: (newValue) => {
      if (newValue === "true" || newValue === undefined || newValue === null) {
        return true;
      } else {
        return false;
      }
    },
  })
  ismultiselect: boolean;
  // search attribute
  currentSort: { column: string; direction: "asc" | "desc" };
  searchTerm: string = "";
  filteredItems: MetaObject[] = [];
  // eslint-disable-next-line @typescript-eslint/ban-types
  @bindable() closing: Function;
  private titleType: string;
  private items: MetaObject[] = [];
  private selecteditems: MetaObject[] = [];

  constructor(private selectedObjectService: SelectedObjectService) {}

  handleOpening() {
    this.selecteditems = [];
    this.addVisualSelectClass();
  }

  async attached() {
    this.titleType = this.objecttype === "Role" ? "reference" : this.objecttype;
    if (
      this.objecttype === "Source" ||
      this.objecttype === "Destination" ||
      this.objecttype === "Role"
    ) {
      this.items = this.selectedObjectService.getObjects("All");
    } else if (this.objecttype === "Column") {
      this.items = this.selectedObjectService.getObjects("Attribute");
    } else if (this.objecttype === "Bendpoint") {
      this.items = this.selectedObjectService.getObjects("Class");
    } else if (this.objecttype === "Procedure") { 
      this.items = this.selectedObjectService.getObjects("Procedure");
    } else {
      this.items = this.selectedObjectService.getObjects(this.objecttype);
    }
    this.currentSort = {
      column: "name",
      direction: "asc",
    };
    this.filteredItems = this.items;
  }

  addObjects() {
    // Create a set for quicker look-up
    const selectedUUIDs: Set<string> = new Set(
      this.selecteditems.map((item) => item.uuid),
    );

    for (const item of selectedUUIDs) {
      this.selectedObjectService.addChild(item, this.objecttype);
    }
    // Reset selected items
    this.selecteditems = [];
    this.addVisualSelectClass();
  }

  handleClosing(evt) {
    switch (evt.detail.action.toString()) {
      case "cancel":
        this.selecteditems = [];
        this.addVisualSelectClass();
        break;
      case "ok":
        this.addObjects();
        break;
    }
    if (this.closing) {
      this.closing(evt.detail.action);
    }
  }

  selectObject(objectUuid: string) {
    if (!this.ismultiselect) {
      this.selecteditems = [];
      this.addVisualSelectClass();
    }
    if (this.isSelected(objectUuid)) {
      this.selecteditems = this.selecteditems.filter(
        (item) => item.uuid !== objectUuid,
      );
    } else {
      this.selecteditems.push(
        this.items.find((item) => item.uuid === objectUuid),
      );
    }
    this.addVisualSelectClass(objectUuid);
  }

  addVisualSelectClass(uuid?: string) {
    if (uuid) {
      const row = document.getElementById(`${uuid}_${this.objecttype}`);
      if (this.isSelected(uuid)) {
        row.classList.add("selected");
      } else {
        row.classList.remove("selected");
      }
    } else {
      //deselect everything
      for (const item of this.items) {
        const row = document.getElementById(`${item.uuid}_${this.objecttype}`);
        if (this.isSelected(item.uuid)) {
          row.classList.add("selected");
        } else {
          row.classList.remove("selected");
        }
      }
    }
  }

  isSelected(objectUuid: string): boolean {
    return this.selecteditems.some((item) => item.uuid === objectUuid);
  }

  filterItems() {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredItems = this.items.filter((item) => {
        if (item.description) {
          return (
            item.name.toLowerCase().includes(searchTermLower) ||
            item.description.toLowerCase().includes(searchTermLower)
          );
        } else {
          return item.name.toLowerCase().includes(searchTermLower);
        }
      });
    } else {
      // If no search term, display all items
      this.filteredItems = this.items;
    }
  }

  sortList(column: string) {
    if (this.currentSort.column === column) {
      this.currentSort.direction =
        this.currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = "asc";
    }

    this.items.sort((a, b) => {
      let result = 0;
      if (a[column] < b[column]) result = -1;
      if (a[column] > b[column]) result = 1;

      return this.currentSort.direction === "asc" ? result : -result;
    });
    this.filteredItems.sort((a, b) => {
      let result = 0;
      if (a[column] < b[column]) result = -1;
      if (a[column] > b[column]) result = 1;

      return this.currentSort.direction === "asc" ? result : -result;
    });
  }
}
