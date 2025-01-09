import {bindable, customElement, EventAggregator, IDisposable, inject,} from "aurelia";
import {SelectedObjectService} from "../../resources/services/selected-object";
import {BackendService} from "../../resources/services/backend-service";
import {MetaObject} from "../../../../mmar-global-data-structure/models/meta/Metamodel_metaobjects.structure";
import {UserService} from "../../resources/services/user-service";

@customElement("object-list")
@inject(EventAggregator)
@inject(SelectedObjectService)
export class objectList {
    @bindable objectList: MetaObject[] = [];
    @bindable type = "";
    selectedobject: MetaObject;
    searchTerm: string = "";
    filteredItems: MetaObject[] = [];
    private subscription: IDisposable;

    constructor(
        private eventAggregator: EventAggregator,
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private userService: UserService,
    ) {
    }

    async attached() {
        // sort the object alphabetically
        this.objectList.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredItems = this.objectList;
        this.subscription = this.eventAggregator.subscribe(
            "SelectedObjectChanged",
            (payload: { selectedObject: MetaObject; type: string }) => {
                this.selectedobject = payload.selectedObject;
            },
        );
    }

    activate() {
    }

    detaching() {
        this.subscription.dispose();
    }

    async addNewObject() {
        const retrivedObject = await this.backendService.createNewObject(this.type);
        this.selectedObjectService.setSelectedObject(
            retrivedObject.uuid
        );
    }

    async removeObject() {
        const res = await this.backendService.deleteObject(
            this.selectedobject.uuid,
            this.type,
        );
        if (res.length > 0) {
            this.filteredItems = this.objectList;
            this.selectedObjectService.deselectObject();
        }
    }

    filterItems() {
        if (this.searchTerm) {
            const searchTermLower = this.searchTerm.toLowerCase();
            this.filteredItems = this.objectList.filter((item) => {
                return item.name.toLowerCase().includes(searchTermLower);
            });
        } else {
            // If no search term, display all items
            this.filteredItems = this.objectList;
        }
    }
}
