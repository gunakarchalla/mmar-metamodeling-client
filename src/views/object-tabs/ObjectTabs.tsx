import { useState } from "react";
import type { MouseEvent } from "react";
import {
  Box,
  Tabs,
  Tab,
  tabsClasses,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CircleIcon from "@mui/icons-material/Circle";
import { useSelectedObjectStore, OpenTab } from "@/resources/store/selectedObjectStore";
import { useUiStore } from "@/resources/store/uiStore";
import { backendService } from "@/resources/services/backend-service";
import { useTabDrag, slideOffset } from "./useTabDrag";

/**
 * The strip of open objects above the editor.
 *
 * Clicking an object in the left navigation opens a tab here, or focuses the one
 * it is already open in. Each tab keeps its own working copy, so unsaved edits
 * survive switching between them — which is why closing a tab with edits asks
 * first, and why dismissing that question leaves the tab exactly as it was.
 *
 * A tab with unsaved edits shows a filled dot where its close button goes; the
 * dot turns back into the ✕ while the pointer is over it. A middle click closes a
 * tab too (asking first in the same way), as in a browser.
 *
 * Tabs can be dragged into any order (see useTabDrag). A dropped tab becomes the
 * active one.
 */

/**
 * Width (px) of every tab. One fixed width, whatever the name, puts each close button
 * at a fixed spacing: close a tab and the next one slides into its place with its ✕
 * under the pointer, so a row of tabs closes with repeated clicks on one spot.
 */
export const TAB_WIDTH = 180;

const nameOf = (tab: OpenTab | null) => tab?.object?.name;

export default function ObjectTabs() {
  const openTabs = useSelectedObjectStore((s) => s.openTabs);
  const activeTabUuid = useSelectedObjectStore((s) => s.activeTabUuid);
  const activateTab = useSelectedObjectStore((s) => s.activateTab);
  const closeTab = useSelectedObjectStore((s) => s.closeTab);
  const triggerRefresh = useUiStore((s) => s.triggerRefresh);
  const theme = useTheme();
  const slideTransition = theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  });

  // The tab whose close was blocked by unsaved changes (null = no dialog).
  const [pendingClose, setPendingClose] = useState<OpenTab | null>(null);
  const [hoveredClose, setHoveredClose] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // `openTabs` is in strip order, so a tab's slot is its index there.
  const { drag, onPointerDown } = useTabDrag(openTabs.length, TAB_WIDTH, (uuid, slot) => {
    const store = useSelectedObjectStore.getState();
    store.moveTab(uuid, slot);
    if (store.activeTabUuid !== uuid) store.activateTab(uuid);
  });

  if (openTabs.length === 0) return null;

  function requestClose(tab: OpenTab) {
    if (tab.dirty) {
      setPendingClose(tab);
      return;
    }
    closeTab(tab.uuid);
  }

  function handleAuxClick(e: MouseEvent<HTMLElement>, tab: OpenTab) {
    if (e.button !== 1) return;
    e.preventDefault();
    requestClose(tab);
  }

  async function saveAndClose() {
    if (!pendingClose) return;
    setSaving(true);
    try {
      const saved = await backendService.saveObject(pendingClose.object, pendingClose.type);
      // A save can be refused — by the metamodel rules the client checks before sending,
      // or by the server — and `saveObject` answers with nothing when it was. Closing
      // anyway would throw the edits away on the one path that exists to keep them. The
      // dialog goes, since the field to fix is behind it and the refusal is already on
      // screen as the error snackbar; the tab stays open and stays dirty.
      if (!saved) {
        activateTab(pendingClose.uuid);
        setPendingClose(null);
        return;
      }
      closeTab(pendingClose.uuid);
      setPendingClose(null);
      triggerRefresh();
    } finally {
      setSaving(false);
    }
  }

  function discardAndClose() {
    if (!pendingClose) return;
    closeTab(pendingClose.uuid);
    setPendingClose(null);
  }

  return (
    <>
      <Tabs
        className="object-tab-bar"
        value={activeTabUuid ?? false}
        onChange={(_e, value) => activateTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          borderBottom: "1px solid #bdbdbd",
          // MUI's sliding indicator measures the active tab and animates to it, which
          // would trail behind a dragged tab. Each tab draws its own underline instead.
          [`& .${tabsClasses.indicator}`]: { display: "none" },
        }}
      >
        {openTabs.map((tab, slot) => {
          const isActive = tab.uuid === activeTabUuid;
          const isDragged = drag?.uuid === tab.uuid;
          const shift = !drag
            ? 0
            : isDragged
              ? drag.offset
              : slideOffset(slot, drag.from, drag.to, drag.pitch);
          return (
            <Tab
              key={tab.uuid}
              className="object-tab"
              value={tab.uuid}
              onPointerDown={(e) => onPointerDown(e, tab.uuid, slot)}
              onAuxClick={(e) => handleAuxClick(e, tab)}
              // Stop the middle button's autoscroll so its auxclick reaches the tab.
              onMouseDown={(e) => {
                if (e.button === 1) e.preventDefault();
              }}
              sx={{
                width: TAB_WIDTH,
                minWidth: TAB_WIDTH,
                maxWidth: TAB_WIDTH,
                minHeight: 36,
                p: 0,
                textTransform: "none",
                // MUI lays a Tab out as a column (room for an icon above the label), in
                // which "stretch" only widens the face. As a row, the face fills the tab
                // top to bottom, so its underline lands on the bottom edge of the strip.
                flexDirection: "row",
                alignItems: "stretch",
                // The face below is drawn outside the tab while it is dragged or sliding.
                overflow: "visible",
              }}
              label={
                // The tab's visible "face". Drags move the face, not the Tab itself, so
                // MUI's Tabs never sees the active tab move and never scrolls to chase it.
                <Box
                  // Per-frame drag values go inline: in `sx` every new pixel offset
                  // would mint (and keep) another Emotion class.
                  style={{
                    zIndex: isDragged ? 1 : undefined,
                    transform: shift ? `translateX(${shift}px)` : undefined,
                    // Neighbours slide aside; the dragged face tracks the pointer exactly.
                    // Off when no drag is running, so the drop's re-layout does not animate.
                    transition: drag && !isDragged ? slideTransition : undefined,
                  }}
                  sx={{
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    pl: 2,
                    pr: 1,
                    bgcolor: "background.paper",
                    borderRight: 1,
                    borderColor: "divider",
                    // The active tab's underline, plus a lift while it is being dragged.
                    boxShadow:
                      [
                        isActive ? `inset 0 -2px 0 ${theme.palette.primary.main}` : null,
                        isDragged ? theme.shadows[4] : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "none",
                  }}
                >
                  <Box
                    component="span"
                    title={nameOf(tab) || tab.type}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      fontStyle: tab.dirty ? "italic" : "normal",
                    }}
                  >
                    {nameOf(tab) || tab.type}
                  </Box>
                  <Tooltip
                    title={tab.dirty ? "Close (unsaved changes)" : "Close"}
                    arrow
                  >
                    <Box
                      component="span"
                      role="button"
                      data-tab-close=""
                      aria-label={`close ${nameOf(tab) ?? tab.uuid}`}
                      onMouseEnter={() => setHoveredClose(tab.uuid)}
                      onMouseLeave={() => setHoveredClose(null)}
                      // This sits inside the tab's own label, so the click has to
                      // be stopped before the tab reads it as "focus me".
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        requestClose(tab);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        flex: "0 0 auto",
                        "&:hover": { backgroundColor: "action.hover" },
                      }}
                    >
                      {tab.dirty && hoveredClose !== tab.uuid ? (
                        <CircleIcon
                          className="unsaved-indicator"
                          sx={{ fontSize: 10, color: "warning.main" }}
                        />
                      ) : (
                        <CloseIcon sx={{ fontSize: 14 }} />
                      )}
                    </Box>
                  </Tooltip>
                </Box>
              }
            />
          );
        })}
      </Tabs>

      {/* Dismissing this (Escape, or a click outside) deliberately does
          nothing: the tab stays open with its changes intact. */}
      <Dialog open={pendingClose !== null} onClose={() => setPendingClose(null)}>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to save the changes you made to “
            {nameOf(pendingClose) ?? "this object"}”?
            <br />
            Your changes will be lost if you don’t save them.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={discardAndClose} color="error" disabled={saving}>
            Discard changes
          </Button>
          <Button onClick={saveAndClose} variant="contained" disabled={saving}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
