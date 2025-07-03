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

    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private helperService: HelperService,
        private eventAggregator: EventAggregator,
    ) {
    }

    binding() {
        this.subscription = this.eventAggregator.subscribe('SelectedObjectChanged', () => {
            // Check the type property instead of using instanceof
            if (this.selectedObjectService.type === 'File') {
                this.getImage();
            }
        });
        // Also check on initial binding
        if (this.selectedObjectService.type === 'File') {
            this.getImage();
        }
    }

    detaching() {
        this.subscription.dispose();
    }

    async getImage() {
        let base64 = Buffer.from(this.selectedObjectService.getObjectFromUuid((this.selectedObjectService.selectedObject as File).uuid)["data"]).toString('base64');
        // let base64 = Buffer.from(this.selectedObjectService.selectedObject["data"]).toString('base64');
        let dataUrl = `data:image/png;base64,${base64}`;
        // console.log("dataUrl:", dataUrl);
        this.imageString = dataUrl;
        console.log("imageString:", this.imageString);
        return dataUrl;

    }

    private file: globalThis.File | null = null;
    @bindable private imageString: string = '';

    downloadFile() {
        if (this.selectedObjectService.selectedObject) {
            const fileData = this.selectedObjectService.selectedObject["data"]["data"];
            const fileName = this.selectedObjectService.selectedObject.name;
            const mimeType = this.selectedObjectService.selectedObject["type"];
            const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // async attached() {
    //     if (this.selectedObjectService.selectedObject) {
    //         this.file = await this.backendService.getFileByUUID(this.selectedObjectService.selectedObject.uuid);
    //         // this.file = await this.backendService.getSpecificObject(this.selectedObjectService.selectedObject.uuid, "File");
    //         console.log("file:", this.file);
    //         if (this.file) {
    //             if (this.file.type.includes('model/gltf+json') || this.file.type.includes('application/octet-stream')) {
    //                 this.imageString = await this.file.text();
    //             } else {
    //                 this.imageString = await new Promise((resolve, reject) => {
    //                     const reader = new FileReader();
    //                     reader.onloadend = () => {
    //                         const result = typeof reader.result === 'string' ? reader.result : '';
    //                         resolve(result);
    //                     };
    //                     reader.onerror = (error) => {
    //                         reject(error);
    //                     };
    //                     reader.readAsDataURL(this.file);
    //                 });
    //             }
    //         }
    //     }
    // }
}
