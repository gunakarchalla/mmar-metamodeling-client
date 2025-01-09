import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";

@customElement("general-tab-class")
@inject(SelectedObjectService)
export class GeneralTabClass {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
