import React, { PureComponent } from "react";
import { Checkbox, FormGroup } from "@blueprintjs/core";

import { merge } from "../functools";
import { hasDataType } from "../helpers";
import { AnyObject } from "../types";
import { IWidgetProps } from "./types";

export default class CheckBox extends PureComponent<IWidgetProps> {
  static canHandleField = hasDataType("multiselectpicklist");

  handleInputChange = (actualValue: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let nextValue = this.props.value || [];
    if (event.target.checked) {
      nextValue = [...nextValue, actualValue];
    } else {
      nextValue = nextValue.filter((item: string) => item !== actualValue);
    }
    this.props.onChange(nextValue);
  };

  renderChoices = () => {
    if (!this.props.pick_list_values) {
      return [];
    }

    const value = this.transformToInternalValue(this.props.value);

    return this.props.pick_list_values
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
      .map(choice => (
        <Checkbox
          key={choice.actual_value}
          label={choice.display_value}
          checked={value[choice.actual_value]}
          onChange={this.handleInputChange(choice.actual_value)}
        />
      ));
  };

  transformToInternalValue = (value: Array<any>): AnyObject => {
    console.log(value);
    return (value && merge(value.map(item => ({ [item]: true })))) || {};
  };

  render() {
    const { field_label, value, required } = this.props;

    return (
      <FormGroup label={field_label} labelInfo={required ? "(required)" : ""}>
        {this.renderChoices()}
      </FormGroup>
    );
  }
}
