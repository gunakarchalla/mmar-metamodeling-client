import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../resources/services/selected-object";

@customElement("table-tab")
@inject(SelectedObjectService)
export class TableTab {
  constructor(
      private selectedObjectService: SelectedObjectService
  ) {}

}
