import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { SelectedObjectService } from 'resources/services/selected-object';
import { bindable } from "aurelia";
import { EventAggregator } from 'aurelia';
import { customElement, inject } from "aurelia";
import { File } from '../../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure';
import { HelperService } from 'resources/services/helper-service';

@customElement("dialog-upload-file")
@inject(SelectedObjectService, EventAggregator)
export class DialogUploadFile {

    // @bindable private attributeInstance: AttributeInstance;
    @bindable private fileDoc: File;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private eventAggregator: EventAggregator,
        private helperService: HelperService,
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
                reader.readAsDataURL(file.data);
                reader.onload = async () => {
                    const dataURL = reader.result.toString();
                    const newFile = await this.helperService.DataUrltoFile(dataURL, file.name, file.type)
                    const arrayBuffer = await newFile.arrayBuffer();

                    this.selectedObjectService.selectedObject["data"]["data"] = Array.from(new Uint8Array(arrayBuffer));
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