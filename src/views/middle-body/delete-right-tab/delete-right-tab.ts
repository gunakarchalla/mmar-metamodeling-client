import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("delete-right-tab")
@inject(SelectedObjectService)
export class DeleteRightTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
