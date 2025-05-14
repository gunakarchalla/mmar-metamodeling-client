import { customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";
import { Attribute } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";

@customElement("general-tab-file")
@inject(SelectedObjectService)
export class GeneralTabFile {
    private facetsList: string[] = [];
    private fileInput: HTMLInputElement;

    constructor(
        private selectedObjectService: SelectedObjectService,
    ) { }

    printSelected() {
        console.log(this.selectedObjectService.selectedObject);
    }

}
