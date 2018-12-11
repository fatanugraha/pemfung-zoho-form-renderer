/**
 * Layout Types
 */

export interface ILayout {
  readonly id: string;
  readonly rules: Array<IRule>;
  readonly sections: Array<ISection>;
}

export interface ISection {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
  readonly sequence_number: number;
  readonly display_label: string;
  readonly fields: Array<IField>;
}

export interface IField {
  readonly field_label: string;
  readonly json_type: string;
  readonly visible: boolean;
  readonly default_value: any;
  readonly id: string;
  readonly pick_list_values?: Array<IPickListValues>;
  readonly data_type: string;
  readonly required: boolean;
  readonly api_name: string;
  readonly sequence_number: number;

  [key: string]: any;
}

export interface IPickListValues {
  maps?: Array<IFieldMaps>;
  actual_value: string;
  display_value: string;
  sequence_number?: number;
}

export interface IFieldMaps {
  api_name?: string;
  id?: string;
  pick_list_values?: Array<IPickListValues>;
  visible?: boolean;
}

export interface IRule {
  readonly conditions: Array<IRuleFunction>;
  readonly fulfilled: Array<IRuleFunction>;
  readonly rejected: Array<IRuleFunction>;
}

export interface IRuleFunction {
  readonly args: Array<IRuleFunctionArg | IRuleFunction>;
  readonly func: string;
}

export interface IRuleFunctionArg {
  readonly section?: string;
  readonly field?: string;
  readonly value?: string;
}

/**
 *
 */

export interface AnyObject {
  [propName: string]: any;
}

export interface FormProps {
  layout: ILayout;
  initialValue: AnyObject;
}

export interface FormState {
  map: AnyObject;
  value: AnyObject;
}
