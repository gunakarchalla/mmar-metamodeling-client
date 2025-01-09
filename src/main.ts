import {Aurelia, Registration} from "aurelia";
import {MyApp} from "./my-app";
import {EventAggregator} from "@aurelia/kernel";

import {AllConfiguration} from "@aurelia-mdc-web/all";
import {SelectedObjectService} from "./resources/services/selected-object";
import {BackendService} from "./resources/services/backend-service";
import {UserService} from "./resources/services/user-service";
//import bootstrap from 'bootstrap'
import * as bootstrap from 'bootstrap'

Aurelia.register(
    bootstrap,
    AllConfiguration,
    Registration.singleton(SelectedObjectService, SelectedObjectService),
    EventAggregator,
    BackendService,
    UserService,
)
    .app(MyApp)
    .start();
