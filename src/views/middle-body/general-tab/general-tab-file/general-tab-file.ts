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
    ) { }

    private image: globalThis.File | null = null;
    @bindable private imageString: string | null = null;

    downloadFile() {
        const url = URL.createObjectURL(this.image);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.image?.name || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async attached() {
        if (this.selectedObjectService.selectedObject) {
            this.image = await this.backendService.getFileByUUID(this.selectedObjectService.selectedObject.uuid);
            // this.image = await this.backendService.getSpecificObject(this.selectedObjectService.selectedObject.uuid, "File");
            console.log("image:", this.image);
            if (this.image) {
                if (this.image.type.includes('model/gltf+json') || this.image.type.includes('application/octet-stream')) {
                    this.imageString = await this.image.text();
                } else {
                    this.imageString = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = typeof reader.result === 'string' ? reader.result : '';
                            resolve(result);
                        };
                        reader.onerror = (error) => {
                            reject(error);
                        };
                        reader.readAsDataURL(this.image);
                    });
                }
            }
        }

        // this.uppy = new Uppy({});
        // this.uppy.use(Dashboard);
    }

    // load() {
    //     const files = this.uppy.getFiles();
    //     const reader = new FileReader();

    //     if (files) {
    //         for (const file of files) {
    //             reader.readAsDataURL(file.data);
    //             reader.onload = async () => {
    //                 const dataURL = reader.result.toString();

    //                 // Extract base64 data
    //                 const base64Data = dataURL.split(',')[1];
    //                 const binaryString = window.atob(base64Data);
    //                 const byteArray = new Uint8Array(binaryString.length);
    //                 for (let i = 0; i < binaryString.length; i++) {
    //                     byteArray[i] = binaryString.charCodeAt(i);
    //                 }

    //                 // Create a proper binary File
    //                 const newFile = new globalThis.File([byteArray], file.name, { type: file.type });

    //                 const response = await this.backendService.patchFileByUUID(this.selectedObjectService.selectedObject.uuid, newFile);

    //                 if (response) {
    //                     // this.eventAggregator.publish('fileUploaded', this.attributeInstance);
    //                     // this.attributeInstance.value = response.uuid;
    //                 }
    //             }
    //         }
    //     }
    // }

}
