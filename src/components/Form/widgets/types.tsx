import React from "react";
import { IField } from "../types";

export interface IWidgetProps {
  readonly: boolean;
  field_label: string;
  json_type: string;
  required: boolean;

  value: any;
  onChange: (value: any) => void;
  pick_list_values?: Array<IPickListValues>;
}

export interface IPickListValues {
  actual_value: string;
  display_value: string;
  sequence_number?: number;
}
