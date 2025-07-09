import { customElement, inject, EventAggregator, IDisposable } from "aurelia";
import { SelectedObjectService } from "../../../../resources/services/selected-object";
import { File } from "../../../../../../mmar-global-data-structure/models/meta/Metamodel_files.structure";
@customElement("general-tab-file")
@inject(SelectedObjectService, EventAggregator)
export class GeneralTabFile {
    private subscription: IDisposable;
    private selectedObject: File | null = null;

    constructor(
        private selectedObjectService: SelectedObjectService,
        private eventAggregator: EventAggregator,
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
