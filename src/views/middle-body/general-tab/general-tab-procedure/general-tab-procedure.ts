import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../../resources/services/selected-object";

@customElement("general-tab-procedure")
@inject(SelectedObjectService)
export class GeneralTabProcedure {
    constructor(private selectedObjectService: SelectedObjectService) {
    }
}
