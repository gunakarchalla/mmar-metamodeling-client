import {Logger} from "resources/services/logger";

export class LogWindow {
    constructor(private logger: Logger) {
    }

    getTime() {
        return new Date().toDateString();
    }

    //scrolls to bottom of log window
    updateScroll(element) {
        element.scrollTop = 100000;
        return "";
    }
}
