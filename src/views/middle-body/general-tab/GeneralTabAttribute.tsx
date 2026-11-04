import { Suspense, lazy } from "react";
import {
  Typography,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  FormHelperText,
} from "@mui/material";
import { facets_not_matching_pattern, value_matches_pattern } from "@gds";
import { Attribute } from "@gds/models/meta/Metamodel_attributes.structure";
import { MECHANISM_ATTRIBUTE_TYPE_UUID } from "@/constants";
import FieldsetSection from "@/views/common/FieldsetSection";
import ObjectPreviewCard from "@/views/common/ObjectPreviewCard";
import ChunkFallback from "@/views/common/ChunkFallback";
import { BoundNumber } from "./fields";
import InlineObjectPicker from "./InlineObjectPicker";
import { useSelectedObjectForm } from "./useSelectedObjectForm";

// Monaco is only needed for mechanism attributes, so it is split out rather than
// riding along with every attribute (see the note on code-splitting in GeneralTab).
const BoundCodeEditor = lazy(() => import("@/views/code-editor/BoundCodeEditor"));

const MECHANISM_EDITOR_HEIGHT = 300;

const DEFAULT_VALUE_INVALID =
  "The default value must match the regular expression of the attribute type.";

/**
 * Attribute-only fields: which attribute type it has, how many values it may
 * hold, its facets, and its default value.
 *
 * Facets are a `|`-separated list of the values the attribute may take: the choices of
 * a dropdown, or the minimum, maximum and step of a slider. Whether they are present
 * decides how the default value is entered — picked from the facets, or typed freely.
 *
 * A typed-in default of a Mechanism attribute is JavaScript — the function the modeling
 * client's animator runs — so it is edited in a code editor rather than a text area.
 * With facets it is still picked from them: the facets are what the modeling client
 * offers, so a default outside them could never be chosen again once changed.
 *
 * The default value and every facet are checked against the attribute type's regular
 * expression as they are typed, and the attribute cannot be saved while one of them
 * fails. They are values of the attribute like any other: an instance starts out
 * holding the default, and a facet is what a user can put in it, so anything refused
 * here would be refused by the modeling client and by the server the moment it was
 * used — which costs the modeller the scene they were saving.
 *
 * An EMPTY default is checked like any other value rather than skipped, because it is
 * what an attribute holds until someone fills it in: whether an attribute may be left
 * unset is what its type's expression says, and an attribute type that refuses "" wants
 * a default here. The same goes for facets, so `"|||"` is four empty choices, which
 * such a type refuses, while no facets at all is not a value and is never refused.
 *
 * `value_matches_pattern` and `facets_not_matching_pattern` are the checks the modeling
 * client and the server apply to the same values (see mmar-global-data-structure).
 */
export default function GeneralTabAttribute() {
  const { object, update } = useSelectedObjectForm();
  const attribute = object as Attribute | null;
  if (!attribute) return null;

  const facets = attribute.facets ? attribute.facets.split("|") : [];
  const attributeType = attribute.attribute_type;
  const pattern = attributeType?.regex_value;
  const isMechanism = attributeType?.uuid === MECHANISM_ATTRIBUTE_TYPE_UUID;

  const defaultValueInvalid = !value_matches_pattern(attribute.default_value ?? "", pattern);
  const invalidFacets = facets_not_matching_pattern(attribute.facets, pattern);

  return (
    <FieldsetSection legend="Attribute">
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Typography>Attribute Type:</Typography>
          {attributeType && (
            <ObjectPreviewCard name={attributeType.name} geometry={attributeType.geometry} />
          )}
          <InlineObjectPicker childType="Attribute Type" />
        </Stack>

        <Stack direction="row" spacing={2}>
          <BoundNumber label="Minimum" path="min" obj={attribute} update={update} />
          <BoundNumber label="Maximum" path="max" obj={attribute} update={update} />
        </Stack>

        <TextField
          label="Facets"
          value={attribute.facets ?? ""}
          onChange={(event) => update("facets", event.target.value)}
          error={invalidFacets.length > 0}
          helperText={
            invalidFacets.length > 0
              ? `${invalidFacets.map((facet) => `"${facet}"`).join(", ")} ${
                  invalidFacets.length === 1 ? "does" : "do"
                } not match the regular expression of the attribute type.`
              : "The facets must be separated by a | character."
          }
          fullWidth
          size="small"
        />

        {facets.length === 0 && isMechanism ? (
          <FormControl error={defaultValueInvalid} fullWidth>
            <FormLabel sx={{ typography: "caption", mb: 0.5 }}>Default value</FormLabel>
            <Suspense fallback={<ChunkFallback height={MECHANISM_EDITOR_HEIGHT} />}>
              {/* Keyed by attribute: the tab is not remounted when the selection
                  changes, and a shared editor would let Ctrl+Z on one attribute
                  undo back into the code of the one selected before it. */}
              <BoundCodeEditor
                key={attribute.uuid}
                value={attribute.default_value ?? ""}
                onChange={(value) => update("default_value", value)}
                height={MECHANISM_EDITOR_HEIGHT}
                error={defaultValueInvalid}
                ariaLabel="Default value"
              />
            </Suspense>
            {defaultValueInvalid && <FormHelperText>{DEFAULT_VALUE_INVALID}</FormHelperText>}
          </FormControl>
        ) : facets.length === 0 ? (
          <TextField
            label="Default value"
            value={attribute.default_value ?? ""}
            onChange={(event) => update("default_value", event.target.value)}
            error={defaultValueInvalid}
            helperText={defaultValueInvalid ? DEFAULT_VALUE_INVALID : undefined}
            multiline
            rows={3}
            fullWidth
            size="small"
          />
        ) : (
          <TextField
            select
            label="Default value"
            value={attribute.default_value ?? ""}
            onChange={(event) => update("default_value", event.target.value)}
            error={defaultValueInvalid}
            helperText={defaultValueInvalid ? DEFAULT_VALUE_INVALID : undefined}
            fullWidth
            size="small"
          >
            <MenuItem value="">Select a default value</MenuItem>
            {facets.map((facet) => (
              <MenuItem key={facet} value={facet}>
                {facet}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
    </FieldsetSection>
  );
}
