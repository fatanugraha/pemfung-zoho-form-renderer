import React from "react";

import {
  AnyObject,
  IRuleFunction,
  IRuleFunctionArg,
  IFieldMaps,
  FormProps,
  FormState,
  IField,
  ISection,
  IRule
} from "./types";
import {
  constructMaps,
  getInitialValue,
  extractFields,
  extractObjects,
  getFieldMapping
} from "./helpers";
import { all, merge, compose } from "./functools";

import { mapValues, mapVisibility } from "./mapfunctions";
import { Section } from "./components";
import { TextInput, Select, CheckBox } from "./widgets";

export default class Form extends React.Component<FormProps, FormState> {
  fields: AnyObject;
  objects: AnyObject;

  constructor(props: FormProps) {
    super(props);

    this.objects = extractObjects(props.layout);
    this.fields = extractFields(props.layout);

    const initialValue = getInitialValue(props.layout, props.initialValue || {});

    const initialState = {
      value: {},
      map: constructMaps(props.layout)
    };
    this.state = Object.keys(initialValue).reduce(
      (prevState, apiName) => this.applyNewValue(prevState, apiName, initialValue[apiName]),
      initialState
    );
  }

  getMapTargetObject = (map: IFieldMaps) => {
    if (map.api_name) {
      return this.fields[map.api_name];
    }

    if (map.id) {
      return this.objects[map.id];
    }

    return this.fields["default"];
  };

  applyObjectMapping = (prevState: FormState, map: IFieldMaps) => {
    const targetField = this.getMapTargetObject(map);

    const applyObjectMap = compose(
      mapValues(targetField, map),
      mapVisibility(targetField, map)
    );

    return applyObjectMap(prevState);
  };

  applyNewValue = (prevState: FormState, apiName: string, value: any) => {
    const field = this.fields[apiName];
    const nextState = {
      ...prevState,
      value: {
        ...prevState.value,
        [apiName]: value
      }
    };

    const maps = [...getFieldMapping(field, value), ...this.getRuleMaps(nextState, [apiName])];
    return maps.reduce((prevState, map) => this.applyObjectMapping(prevState, map), nextState);
  };

  argValueGetter = (state: FormState) => (arg: IRuleFunctionArg) => {
    if (arg.value) {
      return arg.value;
    } else if (arg.field) {
      return state.value[arg.field];
    }

    return undefined;
  };

  shouldEvaluateConditions = (conditions: Array<IRuleFunction>, updatedFields: Array<any>) => {
    return this.shouldEvaluateCondition({ func: "and", args: conditions }, updatedFields);
  };

  shouldEvaluateCondition = (func: IRuleFunction, updatedFields: Array<any>) => {
    const evaluator: AnyObject = {
      is: (args: Array<IRuleFunctionArg>) =>
        args.filter(arg => arg.field).some(arg => updatedFields.indexOf(arg.field) >= 0),
      or: (args: Array<IRuleFunction>) =>
        args.some(arg => this.shouldEvaluateCondition(arg, updatedFields)),
      and: (args: Array<IRuleFunction>) =>
        args.every(arg => this.shouldEvaluateCondition(arg, updatedFields))
    };

    return evaluator[func.func](func.args);
  };

  evaluateCondition = (func: IRuleFunction, state: FormState) => {
    const getValue = this.argValueGetter(state);

    const evaluator: AnyObject = {
      is: (args: Array<IRuleFunctionArg>) => getValue(args[0]) === getValue(args[1]),
      or: (args: Array<IRuleFunction>) => args.some(arg => this.evaluateCondition(arg, state)),
      and: (args: Array<IRuleFunction>) => args.every(arg => this.evaluateCondition(arg, state))
    };

    return evaluator[func.func](func.args);
  };

  evaluateRule = (rule: IRule, state: FormState) => {
    if (this.evaluateCondition({ func: "and", args: rule.conditions }, state)) {
      console.log({ rule, rejected: false });
      return rule.fulfilled;
    } else {
      console.log({ rule, rejected: true });
      return rule.rejected;
    }
  };

  getRuleEffectMap = (func: IRuleFunction): IFieldMaps => {
    const effects: AnyObject = {
      show: (args: Array<IRuleFunctionArg>) => {
        const { section, field } = args[0];
        if (field) {
          return { api_name: this.fields[field].api_name, visible: true };
        } else if (section) {
          return { id: this.objects[section].id, visible: true };
        }
      },
      hide: (args: Array<IRuleFunctionArg>) => {
        const { section, field } = args[0];

        if (field) {
          return { api_name: this.fields[field].api_name, visible: false };
        } else if (section) {
          return { id: this.objects[section].id, visible: false };
        }
      }
    };

    return effects[func.func](func.args);
  };

  getRuleMaps = (prevState: FormState, updatedFields: Array<any>) =>
    this.props.layout.rules
      .filter(rule => this.shouldEvaluateConditions(rule.conditions, updatedFields))
      .reduce(
        (prevMaps, rule) => [
          ...prevMaps,
          ...this.evaluateRule(rule, prevState).map(effect => this.getRuleEffectMap(effect))
        ],
        [] as Array<IFieldMaps>
      );

  handleFieldChange = (apiName: string) => (value: any) => {
    this.setState(prevState => this.applyNewValue(prevState, apiName, value));
  };

  isFieldRequired = (apiName: string) => this.fields[apiName].required;

  isFieldVisible = (apiName: string) => this.fields[apiName].visible;

  isFieldNotEmptyList = (apiName: string) => this.state.value[apiName] !== [];

  isFieldNotEmptyString = (apiName: string) => this.state.value[apiName] !== "";

  isFieldNotNull = (apiName: string) => !!this.state.value[apiName];

  isFieldFilled = all(this.isFieldNotEmptyList, this.isFieldNotEmptyString, this.isFieldNotNull);

  isFormValid = () =>
    Object.keys(this.fields)
      .filter(this.isFieldRequired)
      .filter(this.isFieldVisible)
      .every(apiName => this.isFieldFilled(apiName));

  getObjectMap = (id: string) => {
    return { ...this.objects[id], ...this.state.map[id] };
  };

  renderField(field: IField) {
    let Component: any = null;

    if (TextInput.canHandleField(field)) {
      Component = TextInput;
    } else if (Select.canHandleField(field)) {
      Component = Select;
    } else if (CheckBox.canHandleField(field)) {
      Component = CheckBox;
    } else {
      return null;
    }

    const object = this.getObjectMap(field.id);
    return (
      <Component
        key={object.id}
        onChange={this.handleFieldChange(object.api_name)}
        json_type={object.json_type}
        field_label={object.field_label}
        value={this.state.value[object.api_name]}
        pick_list_values={object.pick_list_values}
        readonly={object.read_only}
        required={object.required}
      />
    );
  }

  renderSection(section: ISection) {
    const { id, name, fields } = section;

    return (
      <Section title={name} key={id}>
        {fields
          .filter(field => this.getObjectMap(field.id).visible)
          .map(field => this.renderField(field))}
      </Section>
    );
  }

  render() {
    const { sections } = this.props.layout;

    return sections
      .filter(section => this.getObjectMap(section.id).visible)
      .map(section => this.renderSection(section));
  }
}
