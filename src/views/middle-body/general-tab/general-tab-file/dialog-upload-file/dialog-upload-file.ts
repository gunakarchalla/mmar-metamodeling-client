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
import { observable } from "aurelia";
import { isNumberObject } from 'util/types';

@customElement("dialog-upload-file")
@inject(SelectedObjectService, EventAggregator)
export class DialogUploadFile {

    // @bindable private attributeInstance: AttributeInstance;
    @bindable private fileDoc: File;

    @observable compress: boolean = false;
    @observable targetWidth: number = 100;
    @observable quality: number = 100;

    targetWidthError: string = '';
    qualityError: string = '';

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
                    this.selectedObjectService.selectedObject["compress"] = this.compress;
                    this.selectedObjectService.selectedObject["targetWidth"] = this.targetWidth;
                    this.selectedObjectService.selectedObject["quality"] = this.quality;

                    this.eventAggregator.publish("SelectedObjectChanged", {
                        selectedObject: this.fileDoc,
                        type: 'File',
                    });
                }
                this.uppy.removeFile(file.id);
            }
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
        // Reset errors and values when toggling compress
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