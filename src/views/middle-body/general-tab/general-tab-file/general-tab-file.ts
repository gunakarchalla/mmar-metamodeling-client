import { bindable, customElement, inject, EventAggregator, IDisposable } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";
import { Attribute } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";
import { File } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure";
import { BackendService } from "resources/services/backend-service";
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { HelperService } from "resources/services/helper-service";

@customElement("general-tab-file")
@inject(SelectedObjectService, BackendService, HelperService, EventAggregator)
export class GeneralTabFile {
    private subscription: IDisposable;
    private selectedObject: File | null = null;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private helperService: HelperService,
        private eventAggregator: EventAggregator,
    ) {
    }

    private file: globalThis.File | null = null;
    private imageString: string = '';

    binding() {
        this.selectedObject = this.selectedObjectService.selectedObject as File;
        this.subscription = this.eventAggregator.subscribe('SelectedObjectChanged', () => {
            // Check the type property instead of using instanceof
            if (this.selectedObjectService.type === 'File') {
                this.getFile();
            }
        });
        // Also check on initial binding
        if (this.selectedObjectService.type === 'File') {
            this.getFile();
        }
    }

    detaching() {
        this.subscription.dispose();
    }

    async getFile() {
        if (this.selectedObjectService.selectedObject) {
            this.selectedObject = this.selectedObjectService.selectedObject as File;
            const fileData = this.selectedObjectService.selectedObject["data"]["data"];
            const fileName = this.selectedObjectService.selectedObject.name;
            const mimeType = this.selectedObjectService.selectedObject["type"];
            const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
            this.file = new globalThis.File([blob], fileName, { type: mimeType });
            this.getImage(); // Call getImage to set the imageString
            return;
        }
        return null;
    }

    async getImage() {
        const fileContent = await this.file.arrayBuffer();
        let base64 = Buffer.from(new Uint8Array(fileContent)).toString('base64');
        this.imageString = `data:image/png;base64,${base64}`;
        return;
    }

    downloadFile() {
        if (this.selectedObjectService.selectedObject) {
            const url = URL.createObjectURL(this.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.file.name || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
}
