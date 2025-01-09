import {Logger} from "resources/services/logger";
import {BackendService} from "../../resources/services/backend-service";
import {SelectedObjectService} from "../../resources/services/selected-object";
import {EventAggregator, inject} from "aurelia";
import {UserService} from "../../resources/services/user-service";

@inject(EventAggregator)
export class ToolbarContainer {
    constructor(
        private logger: Logger,
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private userService: UserService,
        private eventAggregator: EventAggregator,
    ) {
    }

    attached() {
        window.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    detaching() {
        window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault(); // Prevents the default browser behavior for Ctrl+S
            this.save();
        }
    }

    undo() {
        this.logger.log("undo", "info");
    }

    redo() {
        this.logger.log("redo", "info");
    }

    async test() {
        console.log(
            "Currently selected object : ",
            this.selectedObjectService.selectedObject,
        );
    }

    refresh() {
        this.eventAggregator.publish("refresh", "Refresh button");
    }

    async save() {
        await this.backendService.saveSelectedObject();
        this.eventAggregator.publish("refresh", "Save");
    }
}
