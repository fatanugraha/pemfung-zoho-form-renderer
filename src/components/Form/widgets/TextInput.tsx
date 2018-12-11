import React, { PureComponent } from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";

import { some } from "../functools";
import { hasDataType } from "../helpers";
import { IWidgetProps } from "./types";

export default class TextInput extends PureComponent<IWidgetProps> {
  static canHandleField = some(
    hasDataType("text"),
    hasDataType("website"),
    hasDataType("phone"),
    hasDataType("integer"),
    hasDataType("email"),
    hasDataType("double"),
    hasDataType("bigint")
  );

  transformToExternalValue = (value: string) => {
    switch (this.props.json_type) {
      case "integer":
        return parseInt(value, 10);
      default:
        return value;
    }
  };

  getInputProps = () => {
    switch (this.props.json_type) {
      case "integer":
        return { type: "number" };
      case "double":
        return { type: "number", step: "any" };
      default:
        return { type: "text" };
    }
  };

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onChange(this.transformToExternalValue(event.target.value));
  };

  render() {
    const { field_label, value, required } = this.props;

    return (
      <FormGroup label={field_label} labelInfo={required ? "(required)" : ""}>
        <InputGroup
          value={value || ""}
          onChange={this.handleInputChange}
          {...this.getInputProps()}
        />
      </FormGroup>
    );
  }
}
