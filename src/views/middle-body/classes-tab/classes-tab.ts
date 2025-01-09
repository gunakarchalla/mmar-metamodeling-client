import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("classes-tab")
@inject(SelectedObjectService)
export class ClassesTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
