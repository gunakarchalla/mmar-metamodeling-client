import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("procedures-tab")
@inject(SelectedObjectService)
export class ProceduresTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
