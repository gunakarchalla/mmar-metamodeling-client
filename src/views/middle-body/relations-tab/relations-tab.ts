import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../resources/services/selected-object";

@customElement("relations-tab")
@inject(SelectedObjectService)
export class RelationsTab {
    constructor(
        private selectedObjectService: SelectedObjectService) {
    }

}
