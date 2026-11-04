import { Box, CircularProgress } from "@mui/material";

/**
 * Stands in while a lazily-loaded chunk downloads, reserving the height the real
 * block occupies so the surrounding form does not jump when it lands.
 */
export default function ChunkFallback({ height }: { height: number }) {
  return (
    <Box sx={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={24} />
    </Box>
  );
}
