import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../../resources/services/selected-object";
import {
    Relationclass
} from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_relationclasses.structure";

@customElement("general-tab-relationclass")
@inject(SelectedObjectService)
export class GeneralTabRelationclass {
    constructor(private selectedObjectService: SelectedObjectService) {
    }

    getImage() {
        const geometry = this.selectedObjectService.getObjectFromUuid((this.selectedObjectService.selectedObject as Relationclass).bendpoint).geometry;
        return this.selectedObjectService.getIcon(geometry?.toString());
    }

    removeBendpoint() {
        (this.selectedObjectService.selectedObject as Relationclass).bendpoint = null;
    }
}
