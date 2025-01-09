import { bindable , customElement} from 'aurelia';

@customElement('menu-entry')
export class MenuEntry {


   marginTop: string = '0';
   marginBottom: string = '0';
   marginLeft: string = '0';
   marginRight: string = '0';
   anchorCorner = 'BOTTOM_LEFT';
   anchorCorner2 = 'BOTTOM_LEFT';
   anchorCorner3 = 'BOTTOM_LEFT';
   anchorCorner4 = 'BOTTOM_LEFT';
   anchorCorner5 = 'BOTTOM_LEFT';

   lastSelection: number;

   @bindable menuEntry : {} = {};




   constructor() {
   }


   onMenuSelect(event: { index: number; item: string }) {
      this.lastSelection = event.index;
      console.log('onMenuSelect', this.lastSelection);
   }

   menuButtonClicked(item) {
      item.open = !item.open;
      this.menuEntry["open"] = item.open;
      console.log('menuButtonClicked', item);
   }
}