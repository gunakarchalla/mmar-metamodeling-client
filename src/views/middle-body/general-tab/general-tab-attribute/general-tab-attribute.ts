import {customElement, inject} from "aurelia";
import {SelectedObjectService} from "../../../../resources/services/selected-object";
import {Attribute} from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";
import {Validation} from "../../../../resources/services/validation";

@customElement("general-tab-attribute")
@inject(SelectedObjectService)
@inject(Validation)
export class GeneralTabAttribute {
    private facetsList: string[] = [];

    constructor(
        private selectedObjectService: SelectedObjectService,
    ) {
    }

    handleItemsSelected(event) {
        (this.selectedObjectService.selectedObject as Attribute).attribute_type =
            event.detail[0];
    }

    attached() {
        this.populateFacetList();
    }

    getImage() {
        const geometry = (this.selectedObjectService.selectedObject as Attribute)
            .attribute_type.geometry;
        return this.selectedObjectService.getIcon(geometry?.toString());

    }

    isValid(value: string, regex: string | RegExp) {
        if (typeof regex === "string") regex = new RegExp(regex);
        if (regex) return regex.test(value);
    }

    populateFacetList() {
        const input = document.getElementById('facetInput') as HTMLInputElement;
        const regex = new RegExp('[^|]+');
        if (input.value === '') {
            this.facetsList = [];
            return;
        }

        if (this.isValid(input.value, regex)) {
            input.classList.remove('is-invalid');
            this.facetsList = input.value.split('|');
        } else {
            //should never happen
            input.classList.add('is-invalid');
        }


    }

    validateDefaultValue(event) {
        const regex = (this.selectedObjectService.selectedObject as Attribute).attribute_type.regex_value;
        const defaultValue = (this.selectedObjectService.selectedObject as Attribute).default_value;
        if (this.isValid(defaultValue, regex)) {
            event.target.classList.remove('is-invalid');
        } else {
            event.target.classList.add('is-invalid');
        }
    }
}
