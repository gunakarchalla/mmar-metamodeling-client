import {Logger} from "resources/services/logger";

export class MyApp {
    constructor(
        private logger: Logger,
    ) {
    }

    async attached() {
        this.logger.log("init app", "info");
    }
}
