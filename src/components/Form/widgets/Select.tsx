import React, { PureComponent } from "react";
import { HTMLSelect, FormGroup } from "@blueprintjs/core";

import { hasDataType } from "../helpers";
import { IWidgetProps } from "./types";

export default class TextInput extends PureComponent<IWidgetProps> {
  static canHandleField = hasDataType("picklist");

  handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.onChange(event.target.value);
  };

  getOptions = () => {
    if (!this.props.pick_list_values) {
      return [];
    }

    return this.props.pick_list_values
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
      .map(value => ({ value: value.actual_value, label: value.display_value }));
  };

  render() {
    const { field_label, value, required } = this.props;

    return (
      <FormGroup label={field_label} labelInfo={required ? "(required)" : ""}>
        <HTMLSelect
          options={this.getOptions()}
          value={value || ""}
          onChange={this.handleInputChange}
          fill
        />
      </FormGroup>
    );
  }
}
