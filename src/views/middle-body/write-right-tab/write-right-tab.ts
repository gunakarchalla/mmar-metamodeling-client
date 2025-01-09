import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("write-right-tab")
@inject(SelectedObjectService)
export class WriteRightTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
