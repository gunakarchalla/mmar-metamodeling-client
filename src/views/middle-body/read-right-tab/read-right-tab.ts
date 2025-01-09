import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("read-right-tab")
@inject(SelectedObjectService)
export class ReadRightTab {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
