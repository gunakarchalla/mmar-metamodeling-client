import {BackendService} from "../../resources/services/backend-service";
import {EventAggregator, IDisposable, inject, observable} from "aurelia";
import {SelectedObjectService} from "../../resources/services/selected-object";
import {UserService} from "../../resources/services/user-service";

@inject(SelectedObjectService)
@inject(EventAggregator)
@inject(BackendService)
export class LeftNav {
    @observable isLoadingSceneTypes = true;
    @observable isLoadingClasses = true;
    @observable isLoadingRelationClasses = true;
    @observable isLoadingPorts = true;
    @observable isLoadingAttributeTypes = true;
    @observable isLoadingAttributes = true;
    @observable isLoadingUsergroups = true;
    @observable isLoadingUsers = true;
    @observable isLoadingProcedures = true;
    private isAdmin = false;
    private subscription: IDisposable;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private eventAggregator: EventAggregator,
        private userService: UserService,
    ) {
        this.eventAggregator = eventAggregator;
    }


    async refresh(refreshType: string = undefined) {
        //const currentSelectedUuid = this.selectedObjectService.selectedObject?.uuid;
        //const currentSelectedTab = this.selectedObjectService.selectedTab;

        let currentType: string;

        // if refreshType is not defined, use the current selected object type
        if (!refreshType) currentType = this.selectedObjectService.type

        this.isAdmin = this.userService.isAdmin();
        //this.selectedObjectService.deselectObject();

        switch (currentType) {
            case "SceneType":
                this.isLoadingSceneTypes = true;
                await this.backendService.getSceneTypes();
                this.isLoadingSceneTypes = false;
                break;

            case "Class":
                this.isLoadingClasses = true;
                await this.backendService.getClasses();
                this.isLoadingClasses = false;
                break;

            case "RelationClass":
                this.isLoadingRelationClasses = true;
                await this.backendService.getRelationClasses();
                this.isLoadingRelationClasses = false;
                break;

            case "Attribute":
                this.isLoadingAttributes = true;
                await this.backendService.getAttributes();
                this.isLoadingAttributes = false;
                break;

            case "AttributeType":
                this.isLoadingAttributeTypes = true;
                await this.backendService.getAttributeTypes();
                this.isLoadingAttributeTypes = false;
                break;

            case "Role":
                break;

            case "Port":
                this.isLoadingPorts = true;
                await this.backendService.getPorts();
                this.isLoadingPorts = false;
                break;

            case "Procedure":
                this.isLoadingProcedures = true;
                await this.backendService.getProcedures();
                this.isLoadingProcedures = false;
                break;

            case "User":
                this.isLoadingUsers = true;
                await this.backendService.getUsers();
                this.isLoadingUsers = false;
                break;

            case "UserGroup":
                this.isLoadingUsergroups = true;
                await this.backendService.getUserGroups();
                this.isLoadingUsergroups = false;
                break;

            default:
                this.selectedObjectService.resetObjects();

                this.isLoadingClasses = true;
                this.isLoadingSceneTypes = true;
                this.isLoadingRelationClasses = true;
                this.isLoadingPorts = true;
                this.isLoadingAttributeTypes = true;
                this.isLoadingAttributes = true;
                this.isLoadingProcedures = true;
                this.isLoadingUsergroups = true;
                this.isLoadingUsers = true;


                await this.backendService.getSceneTypes();
                this.isLoadingSceneTypes = false;

                await this.backendService.getClasses();
                this.isLoadingClasses = false;

                await this.backendService.getRelationClasses();
                this.isLoadingRelationClasses = false;

                await this.backendService.getAttributes();
                this.isLoadingAttributes = false;

                await this.backendService.getAttributeTypes();
                this.isLoadingAttributeTypes = false;

                await this.backendService.getPorts();
                this.isLoadingPorts = false;

                await this.backendService.getProcedures();
                this.isLoadingProcedures = false;

                await this.backendService.getUserGroups();
                this.isLoadingUsergroups = false;

                await this.backendService.getUsers();
                this.isLoadingUsers = false;

                break;
        }
        /*
                if (currentSelectedUuid) {
                    this.selectedObjectService.setSelectedObject(currentSelectedUuid);
                    this.selectedObjectService.selectedTab = currentSelectedTab;
                }
        */

    }

    binding() {
        this.subscription = this.eventAggregator.subscribe("refresh", async (message) => {
            if (message === "Refresh button") {
                await this.refresh("Refresh button");
            } else {
                //else refresh only the current selected object
                await this.refresh();
            }
        });
    }

    async attached() {
        await this.refresh();
    }

    detaching() {
        // Clean up the subscription when the view-model is detached
        this.subscription.dispose();
    }
}
