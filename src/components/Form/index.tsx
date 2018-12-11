import React from "react";

import {
  AnyObject,
  IRuleFunction,
  IRuleFunctionArg,
  IFieldMaps,
  FormProps,
  FormState,
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

import { Section } from "./components";
import { TextInput, Select, CheckBox } from "./widgets";
import { all, compose } from "./functools";
import { evaluateRule, shouldEvaluateConditions } from "./evaluators";
import { mapValues, mapVisibility } from "./mapfunctions";

export default class Form extends React.Component<FormProps, FormState> {
  fields: AnyObject;
  objects: AnyObject;

  constructor(props: FormProps) {
    super(props);

    this.objects = extractObjects(props.layout);
    this.fields = extractFields(props.layout);

    const initialState = {
      value: {},
      map: constructMaps(props.layout)
    };

    const initialValue = getInitialValue(props.layout, props.initialValue || {});
    console.log(initialValue);
    this.state = Object.keys(initialValue).reduce(
      (prevState, apiName) => this.applyNewValue(prevState, apiName, initialValue[apiName]),
      initialState
    );
  }

  isFieldRequired = (apiName: string) => this.fields[apiName].required;

  isFieldVisible = (apiName: string) => this.fields[apiName].visible;

  isFieldNotEmptyList = (apiName: string) => this.state.value[apiName] !== [];

  isFieldNotEmptyString = (apiName: string) => this.state.value[apiName] !== "";

  isFieldNotNull = (apiName: string) => !!this.state.value[apiName];

  isFieldFilled = all(this.isFieldNotEmptyList, this.isFieldNotEmptyString, this.isFieldNotNull);

  isFormValid = () => {
    return Object.keys(this.fields)
      .filter(this.isFieldRequired)
      .filter(this.isFieldVisible)
      .every(this.isFieldFilled);
  };

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

  getRuleMaps(state: FormState, updatedFields: Array<any>) {
    return this.props.layout.rules
      .filter(rule => shouldEvaluateConditions(rule.conditions, updatedFields))
      .reduce(
        (prevMaps, rule) => {
          const ruleMaps = evaluateRule(state, rule).map(effect => this.getRuleEffectMap(effect));
          return [...prevMaps, ...ruleMaps];
        },
        [] as Array<IFieldMaps>
      );
  }

  handleFieldChange = (apiName: string) => (value: any) => {
    this.setState(prevState => this.applyNewValue(prevState, apiName, value));
  };

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
