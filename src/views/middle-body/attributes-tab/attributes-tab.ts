import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../resources/services/selected-object";

@customElement("attributes-tab")
@inject(SelectedObjectService)
export class AttributesTab {
  constructor(private selectedObjectService: SelectedObjectService) {
  }

  activate() {
  }

  attached() {
  }
}
