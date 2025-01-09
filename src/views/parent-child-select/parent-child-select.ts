import { bindable, customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../resources/services/selected-object";
import { Logger } from "../../resources/services/logger";
import { ColumnStructure } from "../../../../mmar-global-data-structure/models/meta/Metamodel_columns.structure";

@inject(SelectedObjectService)
@inject(Logger)
@customElement("parent-child-select")
export class ParentChildSelect {
  @bindable() objecttypetoadd: string = "object";
  @bindable() items;
  computedItems = [];
  @bindable() sortable: boolean = false;
  titleType: string;
  currentSort: { column: string; direction: "asc" | "desc" };
  selected: string = null;
  searchTerm: string = "";
  filteredItems = [];

  uiComponents = [
    { value: undefined, disabled: false },
    { value: "select", viewValue: "Select" },
    { value: "checkbox", viewValue: "Checkbox" },
    { value: "radio", viewValue: "Radio" },
    { value: "input", viewValue: "Input" },
    { value: "button", viewValue: "Button" },
  ];

  constructor(
    private selectedObjectService: SelectedObjectService,
    private logger: Logger,
  ) {}

  attached() {
    this.initializeItems();
  }

  initializeItems() {
    this.titleType =
      this.objecttypetoadd === "Role" ? "Reference" : this.objecttypetoadd;
    this.filteredItems = [];
    this.selected = null;
    this.computedItems = [];
    this.searchTerm = "";

    if (this.sortable) {
      // Initialize sorting and filtered items
      this.currentSort = {
        column: "name",
        direction: "asc",
      };
    } else {
      // sort by sequence
      this.items.sort((a, b) => a.sequence - b.sequence);
    }
    if (
      this.objecttypetoadd === "Role" ||
      this.objecttypetoadd === "Source" ||
      this.objecttypetoadd === "Destination"
    ) {
      if (!this.items) {
        this.items = [];
      }
      if (!Array.isArray(this.items)) this.items = [this.items];

      for (const item of this.items) {
        const objects = this.selectedObjectService.getObjectsFromRole(item);
        for (const object of objects) {
          // shallow copy of the object
          const newObject = { ...object };
          this.computedItems.push(newObject);
        }
      }
      this.filteredItems = this.computedItems;
    } else if (this.objecttypetoadd === "Column") {
      let id = 1;
      for (const item of this.items) {
        // this is ugly but it is the only way to set the sequence
        item.sequence = id;
        // set the sequence to the id in the table
        const newObject: ColumnStructure = new ColumnStructure(
          { ...item.attribute },
          id++,
        );
        this.computedItems.push(newObject.get_attribute());
      }
      this.filteredItems = this.computedItems;
    } else {
      this.filteredItems = this.items;
    }
  }

  filterItems() {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredItems = this.items.filter((item) => {
        // filter on name and description
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

  // arrow function to bind this to the parent to use "this"
  handleModalClose = () => {
    this.initializeItems();
  };

  removeObject(objectUuid: string = this.selected) {
    this.selectedObjectService.removeChild(objectUuid, this.objecttypetoadd);
    this.initializeItems();
  }

  //alias to removeObject for readability
  removeSelectedObject() {
    this.removeObject();
  }

  editObject() {
    this.selectedObjectService.setSelectedObject(this.selected);
  }

  selectObject(objectUuid: string) {
    this.selected = objectUuid;
  }

  getIndex(objectUuid: string) {
    let index = -1;
    if (this.objecttypetoadd === "Column") {
      index = this.items.findIndex(
        (item) => item.attribute.uuid === objectUuid,
      );
    } else {
      index = this.items.findIndex((item) => item.uuid === objectUuid);
    }
    return index;
  }

  isSelected(objectUuid: string) {
    return this.selected === objectUuid;
  }

  sortList(column: string) {
    if (this.sortable) {
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

  moveRow(uuid: string, direction: "up" | "down") {
    const index = this.getIndex(uuid);
    if (direction === "up" && index > 0) {
      const item = this.items[index];
      this.items.splice(index, 1); // Remove the item
      this.items.splice(index - 1, 0, item); // Insert at the new position
    } else if (direction === "down" && index < this.items.length - 1) {
      const item = this.items[index];
      this.items.splice(index, 1); // Remove the item
      this.items.splice(index + 1, 0, item); // Insert at the new position
    }
    // update the attribute "sequence" with the current id
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].sequence = i + 1;
    }
    if (this.objecttypetoadd === "Column") {
      this.filteredItems = [];
      this.computedItems = [];
      for (const item of this.items) {
        // set the sequence to the id in the table
        const newObject: ColumnStructure = new ColumnStructure(
          { ...item.attribute },
          item.sequence,
        );
        this.computedItems.push(newObject.get_attribute());
      }
      this.filteredItems = this.computedItems;
    }
  }

  validateMinMax(itemUuid: string, min: number, max: number) {
    if (min > max) {
      this.logger.log(
        "Minimum value cannot be greater than maximum value",
        "error",
      );
      return false;
    } else {
      this.selectedObjectService.updateMinMax(itemUuid, min, max);
      return true;
    }
  }
}
