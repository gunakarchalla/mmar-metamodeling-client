import {bindable, customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../resources/services/selected-object";

@customElement("relationclasses-tab")
@inject(SelectedObjectService)
export class RelationClassesTab {
      constructor(
     private selectedObjectService: SelectedObjectService
      ) {}

}
