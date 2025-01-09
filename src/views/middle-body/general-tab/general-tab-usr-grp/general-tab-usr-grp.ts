import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";

@customElement("general-tab-usr-grp")
@inject(SelectedObjectService)
export class GeneralTabUsrGrp {
  constructor(private selectedObjectService: SelectedObjectService) {}
}
