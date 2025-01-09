export class Validation {
  isValid = true;
  message = "";

  constructor() {
    this.isValid = true;
    this.message = "";
  }

  /**
   * @param value - The value to be validated
   * @param regex - The regular expression to be used for validation
   * @param messageParam - The message to be displayed if the validation fails
   * @returns void
   * @description - This function validates the value against the regex and sets the isValid flag accordingly
   * @example
   *<div class.bind="validation.isValid ? 'validation-text-field--valid' : 'validation-text-field--invalid'">
   *    <mdc-text-field
   *        change.trigger="validation.validate(value, selectedObjectService.selectedObject.attribute_type.regex_value, 'The value does not match the regex of the attribute type')"
   *        label="Default value"
   *        outlined="On"
   *        ref="standard"
   *        type="text"
   *        value.bind="selectedObjectService.selectedObject.default_value"
   *    > </mdc-text-field>
   *    <mdc-text-field-helper-line if.bind="!(validation.isValid)">
   *        <mdc-text-field-helper-text persistent>${validation.message}</mdc-text-field-helper-text>
   *    </mdc-text-field-helper-line>
   *</div>
   **/
  validate(value: string, regex: string | RegExp, messageParam: string) {
    if (typeof regex === "string") {
      regex = new RegExp(regex);
    }
    if (regex) {
      if (!regex.test(value)) {
        this.isValid = false;
        this.message = messageParam;
      } else {
        this.isValid = true;
        this.message = "";
      }
    }
  }
}
