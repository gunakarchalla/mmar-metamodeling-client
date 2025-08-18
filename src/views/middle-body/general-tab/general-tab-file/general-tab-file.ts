import { customElement, inject, EventAggregator, IDisposable } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";
import { File } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure";
import { HelperService } from "resources/services/helper-service";
@customElement("general-tab-file")
@inject(SelectedObjectService, EventAggregator)
export class GeneralTabFile {
    private subscription: IDisposable;
    private selectedObject: File | null = null;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private eventAggregator: EventAggregator,
        private helperService: HelperService,
    ) {
    }

    private file: globalThis.File | null = null;
    private imageString: string = '';

    binding() {
        this.subscription = this.eventAggregator.subscribe('SelectedObjectChanged', () => {
            // Updates whenever file changes
            if (this.selectedObjectService.type === 'File') {
                this.getFile();
            }
        });
        // For initial binding
        if (this.selectedObjectService.type === 'File') {
            this.getFile();
        }
    }

    detaching() {
        if (this.subscription) {
            this.subscription.dispose();
        }
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
        let base64 = await this.helperService.FiletoDataUrl(this.file);
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

    formatFileSize(length: number): string {
        if (length >= 1073741824) {
            return (length / 1073741824).toFixed(2) + " GB";
        } else if (length >= 1048576) {
            return (length / 1048576).toFixed(2) + " MB";
        } else if (length >= 1024) {
            return (length / 1024).toFixed(2) + " KB";
        } else {
            return length + " Bytes";
        }
    }
}
