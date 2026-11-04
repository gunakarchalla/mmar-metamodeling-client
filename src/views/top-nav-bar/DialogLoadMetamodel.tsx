import { useRef, useState, ChangeEvent, DragEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useSelectedObjectStore } from "@/resources/store/selectedObjectStore";
import { backendService } from "@/resources/services/backend-service";
import {
  METAMODEL_CHILD_LISTS,
  MetamodelChildList,
  MetamodelFile,
  readMetamodelFile,
} from "@/resources/services/metamodel-file";
import { describeError } from "@/resources/util/describe-error";

const CHILD_LABELS: Record<MetamodelChildList, string> = {
  classes: "Classes",
  relationclasses: "Relation classes",
  attributes: "Attributes",
  ports: "Ports",
  procedures: "Procedures",
};

/**
 * File ▸ Load Metamodel: choose a metamodel file, see what is in it, and import
 * it.
 *
 * The file is read and checked as soon as it is chosen, so the user confirms an
 * import knowing which scene type it creates and how much it holds. A file
 * whose scene type is already loaded is stopped here, since the server would
 * refuse to create it a second time.
 *
 * A successful import closes the dialog and opens the new scene type in a tab.
 * A refused one keeps the dialog open with the server's reason, and the chosen
 * file stays selected so it can be sent again. The dialog cannot be dismissed
 * while an import is in flight.
 */
export default function DialogLoadMetamodel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [metamodel, setMetamodel] = useState<MetamodelFile | null>(null);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // Reading a file is asynchronous, so a file chosen while an earlier one is
  // still being read must win over it, whichever finishes first.
  const latestRead = useRef(0);

  const sceneTypes = useSelectedObjectStore((s) => s.sceneTypes);
  const summary = metamodel?.ok ? metamodel.summary : undefined;
  const alreadyLoaded = summary?.uuid
    ? sceneTypes.find((st) => st.uuid === summary.uuid)
    : undefined;

  function resetState() {
    latestRead.current++;
    setFileName(null);
    setMetamodel(null);
    setReading(false);
    setImportError(null);
  }

  async function acceptFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const read = ++latestRead.current;

    setFileName(file.name);
    setMetamodel(null);
    setImportError(null);
    setReading(true);

    let result: MetamodelFile;
    try {
      result = readMetamodelFile(await file.text());
    } catch (error) {
      result = { ok: false, error: `The file could not be read: ${describeError(error)}` };
    }
    if (read !== latestRead.current) return;
    setMetamodel(result);
    setReading(false);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    void acceptFiles(e.target.files);
    // allow re-selecting the same file later
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (importing) return;
    void acceptFiles(e.dataTransfer.files);
  }

  function handleClose() {
    if (importing) return;
    resetState();
    onClose();
  }

  async function importMetamodel() {
    if (!metamodel?.ok || alreadyLoaded) return;
    setImporting(true);
    setImportError(null);
    const result = await backendService.importMetamodel(metamodel.body);
    setImporting(false);

    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    resetState();
    onClose();
    useSelectedObjectStore.getState().setSelectedObject(result.sceneType.uuid);
  }

  const canImport = !!metamodel?.ok && !alreadyLoaded && !importing;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Load Metamodel</DialogTitle>
      <DialogContent>
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            if (!importing) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => {
            if (!importing) inputRef.current?.click();
          }}
          sx={{
            mt: 1,
            p: 3,
            minHeight: 120,
            border: "2px dashed",
            borderColor: dragOver ? "primary.main" : "divider",
            borderRadius: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            cursor: importing ? "default" : "pointer",
            opacity: importing ? 0.5 : 1,
            bgcolor: dragOver ? "action.hover" : "transparent",
          }}
        >
          <UploadFileIcon fontSize="large" color="action" />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Drop a metamodel file (.json) here or click to browse
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            aria-label="Metamodel file"
            hidden
            onChange={onInputChange}
          />
        </Box>

        {fileName && (
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", mt: 1.5 }}
          >
            <Typography variant="body2" noWrap title={fileName}>
              {fileName}
            </Typography>
            <IconButton
              size="small"
              onClick={resetState}
              disabled={importing}
              aria-label="remove file"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}

        {reading && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5 }}>
            <CircularProgress size={16} />
            <Typography variant="body2">Reading file…</Typography>
          </Stack>
        )}

        {metamodel && !metamodel.ok && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {metamodel.error}
          </Alert>
        )}

        {summary && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="subtitle1">{summary.name}</Typography>
            {summary.description && (
              <Typography variant="body2" color="text.secondary">
                {summary.description}
              </Typography>
            )}
            {summary.uuid && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace", display: "block" }}
              >
                {summary.uuid}
              </Typography>
            )}
            <Box
              component="dl"
              sx={{
                display: "grid",
                gridTemplateColumns: "max-content max-content",
                columnGap: 2,
                rowGap: 0.25,
                m: 0,
                mt: 1,
                "& dd": { m: 0, textAlign: "right" },
              }}
            >
              {METAMODEL_CHILD_LISTS.map((key) => (
                <Box key={key} sx={{ display: "contents" }}>
                  <Typography component="dt" variant="body2">
                    {CHILD_LABELS[key]}
                  </Typography>
                  <Typography component="dd" variant="body2">
                    {summary.counts[key]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {alreadyLoaded && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            This metamodel is already loaded as the scene type “{alreadyLoaded.name}”,
            which has the same UUID. It cannot be created a second time.
          </Alert>
        )}

        {importError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            The metamodel was not loaded: {importError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3 }}>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={importMetamodel}
          disabled={!canImport}
          startIcon={importing ? <CircularProgress size={16} /> : undefined}
        >
          Load
        </Button>
      </DialogActions>
    </Dialog>
  );
}
