export class TopNavBar {

   fileMenu: {} = {
      name: "File",
      icon: "folder",
      items: [
         {
            label: "Save SceneInstance",
            icon: "save",
            disabled:true
         },
         {
            label: "Save SceneInstance As",
            icon: "save_as",
            disabled:true
         },
         {
            label: "Export SceneInstance As",
            icon: "folder_special",
            disabled:true
         },
         {
            label: "Load SceneInstance",
            icon: "upload",
            disabled:true
         },
      ],
      open: true
   };

   viewMenu = {
      name: "View",
      icon: "visibility",
      items: [
         {
            label: "Zoom In",
            icon: "zoom_in",
            disabled:true
         },
         {
            label: "Zoom Out",
            icon: "zoom_out",
            disabled:true
         },
         {
            label: "Zoom to Fit",
            icon: "zoom_out_map",
            disabled:true
         },
         {
            label: "Zoom to Selection",
            icon: "center_focus_strong",
            disabled:true
         }
      ],
      open: false
   }


   editMenu =
      {
         name: "Edit",
         icon: "edit",
         items: [
            {
               label: "Undo",
               icon: "undo",
               disabled:true
            },
            {
               label: "Redo",
               icon: "redo",
               disabled:true
            },
            {
               label: "Copy",
               icon: "file_copy",
               disabled:true
            },
            {
               label: "Paste",
               icon: "content_paste",
               disabled:true
            },
            {
               label: "Cut",
               icon: "content_cut",
               disabled:true
            }
         ],
         open: false
      };

   diagramMenu = {
      name: "Diagram",
      icon: "schema",
      items: [
         {
            label: "Check Rule Current Object",
            icon: "rule",
            disabled:true
         },
         {
            label: "Check Rule For Model",
            icon: "rule_folder",
            disabled:true
         },
         {
            label: "...",
            icon: "folder",
            disabled:true
         },
      ],
      open: false
   };

   settingsMenu = {
      name: "Settings",
      icon: "settings",
      items: [
         {
            label: "Open Settings",
            icon: "toggle_on",
            disabled:true
         },
      ],
      open: false
   };

   algorithmMenu = {
      name: "Algorithms",
      icon: "functions",
      items: [
         {
            label: "Run Algorithm",
            icon: "play_arrow",
            disabled:true
         }
      ]
   };


   constructor() { }


}
