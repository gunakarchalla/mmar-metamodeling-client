import { customElement, ICustomElementViewModel, inject } from "aurelia";
import { SelectedObjectService } from "../../../resources/services/selected-object";

@customElement("general-tab")
@inject(SelectedObjectService)
export class GeneralTab implements ICustomElementViewModel {
    constructor(private selectedObjectService: SelectedObjectService
    ) {
    }
}
