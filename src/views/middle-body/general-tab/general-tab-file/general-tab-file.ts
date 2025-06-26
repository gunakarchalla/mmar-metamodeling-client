import { bindable, customElement, inject } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";
import { Attribute } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_attributes.structure";
import { File } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure";
import { BackendService } from "resources/services/backend-service";
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

@customElement("general-tab-file")
@inject(SelectedObjectService)
export class GeneralTabFile {
    // private facetsList: string[] = [];
    // private fileInput: HTMLInputElement;


    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        // private uppy: Uppy,
    ) {
        if (this.selectedObjectService.selectedObject) {

            // console.log("selectedObjectService.selectedObject:", this.selectedObjectService.selectedObject);
            // console.log("selectedObjectService.selectedObject.data:", this.selectedObjectService.selectedObject["data"]);
            this.file = this.selectedObjectService.selectedObject["data"] as globalThis.File;
            // console.log("file:", this.file);
            this.imageString = "data:image/png;base64," + Buffer.from(this.file["data"]).toString('base64');
            // console.log("imageString:", this.imageString);
        }

        console.log("selectedObjectService.selectedObject:", this.selectedObjectService.selectedObject);
    }

    private file: globalThis.File | null = null;
    @bindable private imageString: string | null = null;

    downloadFile() {
        const url = URL.createObjectURL(this.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.file?.name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
