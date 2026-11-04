/**
 * AttributeType "Mechanism". An attribute of this type holds a JavaScript function that
 * the modeling client's animator runs on every render tick while mechanisms are enabled
 * (see `MECHANISM_ATTRIBUTE_TYPE_UUID` in mmar-modeling-client/src/constants.ts, which
 * this must match). It is seeded by mmar-database/init.sql, so the uuid is stable
 * across installations, unlike the type's editable name.
 */
export const MECHANISM_ATTRIBUTE_TYPE_UUID = "a8e33bad-9eed-4a24-a4b2-406c5439d13a";
