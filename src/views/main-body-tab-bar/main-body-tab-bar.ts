import {bindable, inject} from "aurelia";
import {BackendService} from "../../resources/services/backend-service";

@inject(BackendService)
export class MainBodyTabBar {
    @bindable({
        set: (v) => v === "" || v === true || v === "true",
    })
    isConnected = false;

    constructor(
        private backendService: BackendService,
    ) {
    }

    async attached() {
        //wait 1 sec
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.checkConnection();
    }

    // Simulate connection status check
    async checkConnection() {
        this.isConnected = await this.backendService.ping();
    }
}
