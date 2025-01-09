import {bindable, customElement, inject} from "aurelia";
import {MetaObject} from "../../../../mmar-global-data-structure";
import {SelectedObjectService} from "../../resources/services/selected-object";
import {BackendService} from "../../resources/services/backend-service";

@customElement("object-card")
@inject(SelectedObjectService)
export class objectCard {
    @bindable object: MetaObject;
    @bindable type: string;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
    ) {
    }

    get isSelected() {
        return (
            this.selectedObjectService.getSelectedObject()?.uuid === this.object.uuid
        );
    }

    async attached() {
    }

    async onButtonClicked() {
        if (this.selectedObjectService.getSelectedObject()) {
            // no async to prevent a blocking UI when changing the selected object
            this.backendService.saveSelectedObject();
        }
        this.selectedObjectService.setSelectedObject(this.object.uuid);
    }
}
