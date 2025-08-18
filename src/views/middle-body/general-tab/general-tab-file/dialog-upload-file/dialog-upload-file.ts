import Uppy, { UppyFile } from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { SelectedObjectService } from 'resources/services/selected-object';
import { bindable } from "aurelia";
import { EventAggregator } from 'aurelia';
import { customElement, inject } from "aurelia";
import { File } from '../../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure';
import { HelperService } from 'resources/services/helper-service';
import { observable } from "aurelia";
import { isNumberObject } from 'util/types';
import { BackendService } from 'resources/services/backend-service';

@customElement("dialog-upload-file")
@inject(SelectedObjectService, EventAggregator)
export class DialogUploadFile {

    // @bindable private attributeInstance: AttributeInstance;
    @bindable private fileDoc: File;

    @observable compress: boolean = false;
    @observable targetWidth: number = 100;
    @observable quality: number = 100;
    disableCompress: boolean = true;

    targetWidthError: string = '';
    qualityError: string = '';

    private uppy: Uppy;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private eventAggregator: EventAggregator,
        private helperService: HelperService,
        private backendService: BackendService,
    ) { }

    async attached() {

        this.uppy = new Uppy({ restrictions: { maxNumberOfFiles: 1 } });
        this.uppy.use(Dashboard, { inline: true, target: '#forUpload', showProgressDetails: true, width: '100%', height: '200px', hideUploadButton: true });
        this.uppy.on('file-added', (file) => {
            console.log("File added:", file);
            this.validateFile(file);
        });
        this.uppy.on('file-removed', (file) => {
            console.log("File removed:", file);
            this.disableCompress = true;
            this.targetWidthError = '';
            this.qualityError = '';
            this.compress = false;
        });
    }

    async detaching() {
        if (this.uppy) {
            this.uppy.destroy();
            this.uppy = null;
        }
    }

    upload() {
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
                    this.selectedObjectService.selectedObject["compress"] = this.compress;
                    this.selectedObjectService.selectedObject["targetWidth"] = this.targetWidth;
                    this.selectedObjectService.selectedObject["quality"] = this.quality;

                    this.backendService.saveSelectedObject().then(() => {
                        this.eventAggregator.publish("SelectedObjectChanged", {
                            selectedObject: this.fileDoc,
                            type: 'File',
                        });

                        this.uppy.removeFile(file.id);
                        this.disableCompress = true;
                        this.targetWidthError = '';
                        this.qualityError = '';
                        this.compress = false;
                    });
                }
            }
        }
    }

    validateFile(file) {
        const fileType = file.type;
        console.log("Validating file type:", fileType);
        if (fileType.startsWith('image/')) {
            this.disableCompress = false;
        } else {
            this.disableCompress = true;
        }
    }


    validateTargetWidth() {
        if (this.targetWidth === null || this.targetWidth === undefined || isNaN(Number(this.targetWidth))) {
            this.targetWidthError = 'Target width is required.';
        } else if (Number(this.targetWidth) <= 0) {
            this.targetWidthError = 'Must be a number greater than 0.';
        } else {
            this.targetWidthError = '';
        }
    }

    validateQuality() {
        if (this.quality === null || this.quality === undefined || isNaN(Number(this.quality))) {
            this.qualityError = 'Quality is required.';
        } else if (Number(this.quality) <= 0 || Number(this.quality) > 100) {
            this.qualityError = 'Must be a number between 1 and 100.';
        } else {
            this.qualityError = '';
        }
    }

    compressChanged() {
        // Reset errors when toggling compress
        if (!this.compress) {
            this.targetWidthError = '';
            this.qualityError = '';
        } else {
            this.validateTargetWidth();
            this.validateQuality();
        }
    }

    targetWidthChanged() {
        this.validateTargetWidth();
    }

    qualityChanged() {
        this.validateQuality();
    }
}