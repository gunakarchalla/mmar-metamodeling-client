import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("usergroup-tab")
@inject(SelectedObjectService)
export class UsergroupTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
