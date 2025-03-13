import {bindable, customElement, EventAggregator, inject} from "aurelia";
import {MdcSnackbarService} from "@aurelia-mdc-web/snackbar";
import {MdcDialog} from "@aurelia-mdc-web/dialog";
import {UserService} from "../../resources/services/user-service";

@inject(MdcSnackbarService)
@inject(MdcDialog)
@customElement("signin-signup-window")
export class SigninSignupWindow {
    mode: "Sign In" | "Sign Out" = "Sign In";
    username: string = "";
    password: string = "";

    constructor(
        private snackbar: MdcSnackbarService,
        private dialog: MdcDialog,
        //private backendService: BackendService,
        private userService: UserService,
        private eventAggregator: EventAggregator,
    ) {
    }

    attached() {
        localStorage.getItem("auth_token") ? (this.mode = "Sign Out") : null;
        if (this.mode === "Sign In") {
            this.dialog.open();
        }
    }

    async action() {
        if (this.mode === "Sign In") {
            if (!this.username || !this.password) {
                this.openToast("Please enter username and password");
            }
            const loginSuccess = await this.userService.login(
                this.username,
                this.password,
            );
            if (loginSuccess) {
                this.eventAggregator.publish("refresh", "Refresh button");
                this.mode = "Sign Out";
                this.dialog.close();
            } else {
                this.openToast("Wrong username or password");
            }
        } else {
            await this.userService.logout();
            this.eventAggregator.publish("refresh", "Refresh button");
            this.mode = "Sign In";
            this.dialog.close();
        }
    }

    async signUp() {
        const response = await this.userService.signup(
            this.username,
            this.password,
        );
        if (response) {
            this.mode = "Sign Out";
        }
    }

    openToast(message: string) {
        this.snackbar.open(message);
    }
}
