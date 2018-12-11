import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
// import { ScrollView, Modal, View, Text } from "react-native";
// import { TextField, Section, SelectField } from "./widgets";
import { extractFields, extractSections, getDefaultValue } from "./utils";

class FormComponent extends React.Component {
  static propTypes = {
    layoutId: PropTypes.string.isRequired,
    value: PropTypes.shape(),
    readOnly: PropTypes.bool,
    navigation: PropTypes.any
  };

  static defaultProps = {
    value: {},
    readOnly: false
  };

  constructor(props) {
    super(props);

    const { layout, layoutId } = props;
    const value = {};
    const fieldMaps = {};
    const sectionMaps = {};

    extractSections(layout, layoutId).forEach(section => {
      sectionMaps[section.id] = {};
    });
    extractFields(layout, layoutId).forEach(field => {
      fieldMaps[field.api_name] = { id: field.id };
      value[field.api_name] = this.getDefaultValue(field);
    });
    this.state = { value, fieldMaps, sectionMaps };

    Object.keys(props.value).forEach(
      key => (this.state = this.updateValue(this.state)(key, props.value[key]))
    );
  }

  getDefaultValue = field => {
    const { value } = this.props;

    if (value[field.api_name]) {
      return value[field.api_name];
    }
    return getDefaultValue(field);
  };

  getFormData = () => this.state.value;

  isValid = () => {
    const { layout, layoutId } = this.props;

    return extractFields(layout, layoutId)
      .filter(field => field.required)
      .filter(field => this.getFieldProps(field.id).visible)
      .every(field => {
        const val = this.state.value[field.api_name];
        return !!val && val !== "" && val !== [];
      });
  };

  setValue = apiName => (value, maps) => {
    this.setState(prevState => this.updateValue(prevState)(apiName, value, maps));
  };

  updateValue = prevState => (apiName, value, maps) => {
    let nextState = {
      ...prevState,
      value: { ...prevState.value, [apiName]: value }
    };

    nextState = this.applyRules(nextState, [apiName]);
    if (maps) {
      nextState = this.applyfieldMaps(maps, nextState);
    }
    return nextState;
  };

  updateFieldMaps(field, value, prevState) {
    return {
      ...prevState,
      fieldMaps: {
        ...prevState.fieldMaps,
        [field]: { ...prevState.fieldMaps[field], ...value }
      }
    };
  }

  updateSectionMaps(field, value, prevState) {
    return {
      ...prevState,
      sectionMaps: {
        ...prevState.sectionMaps,
        [field]: { ...prevState.sectionMaps[field], ...value }
      }
    };
  }

  getFieldProps = fieldId => {
    const originalProps = this.props.layout.field[fieldId];
    return {
      ...originalProps,
      ...this.state.fieldMaps[originalProps.api_name]
    };
  };

  getSectionProps = sectionId => {
    const originalProps = this.props.layout.section[sectionId];
    return {
      ...originalProps,
      ...this.state.sectionMaps[sectionId]
    };
  };

  applyEffect = ({ func, args }, prevState) => {
    const effects = {
      show: args => {
        const { section, field } = args[0];
        if (field) {
          return this.updateFieldMaps(field, { visible: true }, prevState);
        } else if (section) {
          return this.updateSectionMaps(section, { visible: true }, prevState);
        }
      },
      hide: args => {
        const { section, field } = args[0];
        if (field) {
          return this.updateFieldMaps(field, { visible: false }, prevState);
        } else if (section) {
          return this.updateSectionMaps(section, { visible: false }, prevState);
        }
      }
    };

    return effects[func](args);
  };

  applyRules = (prevState, updatedFields) => {
    const { layout, layoutId } = this.props;
    const { rules } = layout.layout[layoutId];

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

  applyfieldMaps = (maps, prevState) => {
    const { layout } = this.props;

    let nextState = prevState;
    for (const map of maps) {
      const { api_name } = map;
      const currentMap = this.state.fieldMaps[api_name];

      for (const mapType of Object.keys(map)) {
        if (mapType === "pick_list_values") {
          const originalValues = layout.field[currentMap.id].pick_list_values;
          const flattened = map[mapType].map(item => item.actual_value);

          nextState = this.updateFieldMaps(
            api_name,
            {
              pick_list_values: originalValues.filter(
                ({ actual_value }) => flattened.indexOf(actual_value) >= 0
              )
            },
            nextState
          );
        }
      }
    }

    return nextState;
  };

  openModal = (title, child) => {
    this.props.navigation.push("Modal", {
      child,
      title,
      handlePressSave: this.closeModal
    });
  };

  closeModal = () => {
    this.props.navigation.goBack(null);
  };

  renderField = fieldId => {
    return null;

    const { data_type, required, api_name, field_label, pick_list_values } = this.getFieldProps(
      fieldId
    );
    const { value } = this.state;

    const textFieldDataTypes = ["text", "email", "website", "phone", "integer", "bigint", "double"];
    if (textFieldDataTypes.indexOf(data_type) >= 0) {
      return (
        <TextField
          key={api_name}
          value={value[api_name]}
          title={field_label}
          required={required}
          mode={data_type}
          onChange={this.setValue(api_name)}
          readOnly={this.props.readOnly}
        />
      );
    } else if (data_type === "picklist" || data_type === "multiselectpicklist") {
      return (
        <SelectField
          key={api_name}
          value={this.state.value[api_name]}
          title={field_label}
          required={required}
          readOnly={this.props.readOnly}
          onChange={this.setValue(api_name)}
          handleOpenModal={this.openModal}
          handleCloseModal={this.closeModal}
          choices={pick_list_values.map(value => ({
            label: value.display_value,
            value: value.actual_value,
            maps: value.maps
          }))}
          multiselect={data_type === "multiselectpicklist"}
        />
      );
    }
  };

  renderSection = sectionId => {
    const { layout } = this.props;
    const { fields, name } = layout.section[sectionId];

    return (
      <Section key={name} title={name}>
        {fields
          .filter(field => this.getFieldProps(field).visible)
          .map(field => this.renderField(field))}
      </Section>
    );
  };

  renderLayout = layoutId => {
    const { layout } = this.props;
    const { sections } = layout.layout[layoutId];

    return sections
      .filter(section => this.getSectionProps(section).visible)
      .map(section => this.renderSection(section));
  };

  render() {
    return <div>{this.renderLayout(this.props.layoutId)}</div>;
  }
}

const createContainer = () => {
  const mapStateToProps = state => ({ layout: state.layout });
  const mapDispatchToProps = {};
  return connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
  )(FormComponent);
};
export default createContainer();
