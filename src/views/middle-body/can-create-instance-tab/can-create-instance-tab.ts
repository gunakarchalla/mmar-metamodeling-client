import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("can-create-instance-tab")
@inject(SelectedObjectService)
export class CanCreateInstanceTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
