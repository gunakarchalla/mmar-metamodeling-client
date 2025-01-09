import { inject, singleton } from "aurelia";
import { MdcSnackbarService } from "@aurelia-mdc-web/snackbar";

singleton();

@inject(MdcSnackbarService)
export class Logger {
  logArray: { value: string; status: string }[] = [];

  constructor(private snackbar: MdcSnackbarService) {
    this.logArray = [];
    this.log("initializing logger", "info");
  }

  log(value: string, status: string) {
    if (status === "error") {
      console.error(value);
      this.snackbar.open(value, undefined, {
        timeout: 5000,
        dismissible: true,
        classes: "custom-snackbar--snackbar-error",
      });
    }
    this.logArray.unshift({
      value: value,
      status: status,
    });
  }

  attached() {
    this.log("initializing log window", "info");
  }
}
