import React from "react";
import {
  ILayout,
  AnyObject,
  IRuleFunction,
  IRuleFunctionArg,
  IFieldMaps,
  IPickListValues,
  IField,
  ISection
} from "./types";
import {
  constructMaps,
  getInitialValue,
  extractFields,
  extractObjects,
  getFieldMapping
} from "./helpers";
import { all, merge } from "./functools";
import { Card, Elevation } from "@blueprintjs/core";
import { TextInput, Select, CheckBox } from "./widgets";

interface FormProps {
  layout: ILayout;
  initialValue: AnyObject;
}

interface FormState {
  map: AnyObject;
  value: AnyObject;
}

export default class Form extends React.Component<FormProps, FormState> {
  fields: AnyObject;
  objects: AnyObject;

  constructor(props: FormProps) {
    super(props);

    this.objects = extractObjects(props.layout);
    this.fields = extractFields(props.layout);

    const initialValue = getInitialValue(props.layout, props.initialValue || {});

    this.state = Object.keys(initialValue).reduce(
      (prevState, apiName) => this.applyNewValue(prevState, apiName, initialValue[apiName]),
      {
        value: {},
        map: constructMaps(props.layout)
      }
    );
  }

  getMapTargetObject = (map: IFieldMaps) => {
    if (map.api_name) return this.fields[map.api_name];

    if (map.id) return this.objects[map.id];

    return this.fields["default"];
  };

  mapPickListValues = (prevState: FormState, targetField: IField, map: IFieldMaps) => {
    if (!map.pick_list_values) {
      return prevState;
    }

    const prevPickListValues = targetField.pick_list_values || [];

    const nextPickListValues = map.pick_list_values || [];
    const filteredKeys = merge(
      nextPickListValues.map(value => ({ [value.actual_value]: value.display_value }))
    );

    return {
      ...prevState,
      map: {
        ...prevState.map,
        [targetField.id]: {
          ...prevState.map[targetField.id],
          pick_list_values: prevPickListValues.filter(
            (choice: IPickListValues) => !!filteredKeys[choice.actual_value]
          )
        }
      }
    };
  };

  mapVisibility = (prevState: FormState, targetField: IField, map: IFieldMaps) => {
    if (map.visible === undefined) {
      return prevState;
    }

    return {
      ...prevState,
      map: {
        ...prevState.map,
        [targetField.id]: {
          ...prevState.map[targetField.id],
          visible: map.visible
        }
      }
    };
  };

  applyObjectMapping = (prevState: FormState, map: IFieldMaps) => {
    const targetField = this.getMapTargetObject(map);
    const mapFunctions = [this.mapPickListValues, this.mapVisibility];

    return mapFunctions.reduce((prevState, func) => func(prevState, targetField, map), prevState);
  };

  applyNewValue = (prevState: FormState, apiName: string, value: any) => {
    const field = this.fields[apiName];
    const maps = getFieldMapping(field, value);

    return maps.reduce(
      (prevState, map) => this.applyObjectMapping(prevState, map),
      this.applyRules(
        {
          ...prevState,
          value: { ...prevState.value, [apiName]: value }
        },
        [apiName]
      )
    );
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

  evaluateConditions = (conditions: Array<IRuleFunction>, state: FormState) => {
    return this.evaluateCondition({ func: "and", args: conditions }, state);
  };

  applyEffect = (func: IRuleFunction, prevState: FormState) => {
    const effects: AnyObject = {
      show: (args: Array<IRuleFunctionArg>) => {
        const { section, field } = args[0];
        if (field) {
          return this.applyObjectMapping(prevState, {
            api_name: this.fields[field].api_name,
            visible: true
          });
        } else if (section) {
          return this.applyObjectMapping(prevState, {
            id: this.objects[section].id,
            visible: true
          });
        }
      },
      hide: (args: Array<IRuleFunctionArg>) => {
        const { section, field } = args[0];
        if (field) {
          return this.applyObjectMapping(prevState, {
            api_name: this.fields[field].api_name,
            visible: false
          });
        } else if (section) {
          return this.applyObjectMapping(prevState, {
            id: this.objects[section].id,
            visible: false
          });
        }
      }
    };

    return effects[func.func](func.args);
  };

  applyRules = (prevState: FormState, updatedFields: Array<any>) => {
    const { rules } = this.props.layout;

    let nextState = prevState;
    for (const { conditions, fulfilled, rejected } of rules) {
      if (this.shouldEvaluateConditions(conditions, updatedFields)) {
        if (this.evaluateConditions(conditions, prevState)) {
          fulfilled.forEach(effect => {
            nextState = this.applyEffect(effect, nextState);
          });
        } else {
          rejected.forEach(effect => {
            nextState = this.applyEffect(effect, nextState);
          });
        }
      }
    }

    return nextState;
  };

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
      <Card elevation={Elevation.TWO} style={{ marginBottom: 24 }} key={id}>
        <h4 className="bp3-heading">{name}</h4>
        {fields
          .filter(field => this.getObjectMap(field.id).visible)
          .map(field => this.renderField(field))}
      </Card>
    );
  }

  render() {
    const { sections } = this.props.layout;

    return sections
      .filter(section => this.getObjectMap(section.id).visible)
      .map(section => this.renderSection(section));
  }
}
