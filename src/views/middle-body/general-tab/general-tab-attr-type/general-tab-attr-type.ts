import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../../resources/services/selected-object";

@customElement("general-tab-attr-type")
@inject(SelectedObjectService)
export class GeneralTabAttrType {
    constructor(private selectedObjectService: SelectedObjectService) {
    }
}
