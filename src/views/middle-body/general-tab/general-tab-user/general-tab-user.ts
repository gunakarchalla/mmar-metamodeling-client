import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../../resources/services/selected-object";

@customElement("general-tab-user")
@inject(SelectedObjectService)
export class GeneralTabUser {
    constructor(
        private selectedObjectService: SelectedObjectService
    ) {
    }
}
