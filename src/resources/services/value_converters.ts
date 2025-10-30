import { valueConverter } from 'aurelia';

@valueConverter('textify')
export class StringifyConverter {
    toView(value: any): string {
        return value == null || value == undefined || value == '' || value == 'null' || value == 'undefined' || value == 'not defined' ? 'text' : value.toString().toLowerCase();
    }
    fromView(value: any): string {
        return value ? value.toString().toLowerCase() : 'text';
    }
}