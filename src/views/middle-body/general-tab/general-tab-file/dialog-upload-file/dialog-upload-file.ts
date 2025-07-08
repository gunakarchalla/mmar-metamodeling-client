import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { AttributeInstance } from '../../../../../../../mmar-global-data-structure';
import { SelectedObjectService } from 'resources/services/selected-object';
import { bindable } from "aurelia";
import { validate as uuidValidate } from 'uuid';
import { BackendService } from 'resources/services/backend-service';
import { EventAggregator } from 'aurelia';
import { customElement, inject } from "aurelia";
import { File } from '../../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure';

@customElement("dialog-upload-file")
@inject(SelectedObjectService, BackendService, EventAggregator)
export class DialogUploadFile {

    // @bindable private attributeInstance: AttributeInstance;
    @bindable private fileDoc: File;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private backendService: BackendService,
        private eventAggregator: EventAggregator,
        private uppy: Uppy = new Uppy(),
    ) { }

    async attached() {

        // Configure Uppy instance
        this.uppy.use(Dashboard, { inline: true, target: '#forUpload', showProgressDetails: true, width: '100%', height: '200px', hideUploadButton: true });
    }

    load() {
        const files = this.uppy.getFiles();
        const reader = new FileReader();

        if (files) {
            for (const file of files) {
                // console.log("File to upload:", file);
                reader.readAsDataURL(file.data);
                reader.onload = async () => {
                    const dataURL = reader.result.toString();

                    // Extract base64 data
                    const base64Data = dataURL.split(',')[1];
                    const binaryString = window.atob(base64Data);
                    const byteArray = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        byteArray[i] = binaryString.charCodeAt(i);
                    }

                    // Create a proper binary File
                    const newFile = new globalThis.File([byteArray], file.name, { type: file.type });

                    this.selectedObjectService.selectedObject["data"]["data"] = Array.from(Buffer.from(byteArray));
                    this.selectedObjectService.selectedObject["type"] = newFile.type;
                    this.selectedObjectService.selectedObject["name"] = newFile.name;

                    this.eventAggregator.publish("SelectedObjectChanged", {
                        selectedObject: this.fileDoc,
                        type: 'File',
                    });
                }
                this.uppy.removeFile(file.id);
            }
        }
    }
}