import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../resources/services/selected-object";

@inject(SelectedObjectService)
@customElement("ports-tab")
export class PortsTab {
    constructor(private selectedObjectService: SelectedObjectService) {
    }
}
