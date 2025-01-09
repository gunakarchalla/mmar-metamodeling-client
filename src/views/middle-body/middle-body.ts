import {IDisposable, inject} from "aurelia";
import {SelectedObjectService} from "../../resources/services/selected-object";
import {EventAggregator} from "@aurelia/kernel";

@inject(SelectedObjectService)
@inject(EventAggregator)
export class MiddleBody {
    //public selectedTab: string;
    private subscription: IDisposable;

    private tabDefinitions = [
        {
            label: "General",
            types: [
                "SceneType",
                "Class",
                "RelationClass",
                "Port",
                "Attribute",
                "AttributeType",
                "User",
                "UserGroup",
            ],
        },
        {
            label: "Attributes",
            types: ["SceneType", "Class", "RelationClass", "Port"],
        },
        {label: "Classes", types: ["SceneType"]},
        {label: "Relations", types: ["RelationClass"]},
        {label: "Ports", types: ["SceneType", "Class", "RelationClass"]},
        {label: "Reference", types: ["AttributeType"]},
        {label: "Table", types: ["AttributeType"]},
        {label: "RelationClasses", types: ["SceneType"]},
        {label: "Read Right", types: ["UserGroup"]},
        {label: "Write Right", types: ["UserGroup"]},
        {label: "Delete Right", types: ["UserGroup"]},
        {label: "Can Create Instance", types: ["UserGroup"]},
        {label: "User Groups", types: ["User"]},
    ];

    constructor(
        private selectedObjectService: SelectedObjectService,
        private eventAggregator: EventAggregator,
    ) {
    }

    get visibleTabs() {
        return this.tabDefinitions.filter((tab) =>
            tab.types.includes(this.selectedObjectService.type),
        );
    }

    binding() {
        this.subscription = this.eventAggregator.subscribe(
            "SelectedObjectChanged",
            () => {
                this.initialize()
            },
        );
    }

    attached() {
        this.initialize(); // Initial setup
    }

    clickedTab(tabName: string) {
        this.selectedObjectService.selectedTab = tabName;
    }

    detaching() {
        this.subscription.dispose();
    }

    private initialize() {
        if (this.selectedObjectService.selectedObject) {
            this.clickedTab("General");
        }
    }
}
