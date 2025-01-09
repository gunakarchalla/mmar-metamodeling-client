import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@inject(SelectedObjectService)
@customElement("reference-tab")
export class ReferenceTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
