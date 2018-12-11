import React from "react";
import PropTypes from "prop-types";
import { Text, View, StyleSheet, TouchableNativeFeedback } from "react-native";
import { Colors } from "../../../themes";
import { SelectModal } from "./SelectModal";
import { Title, WidgetContainer } from "../components";

export default class SelectField extends React.Component {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string
    ]).isRequired,
    onChange: PropTypes.func.isRequired,
    required: PropTypes.bool,
    readOnly: PropTypes.bool,
    title: PropTypes.string.isRequired,
    handleOpenModal: PropTypes.func.isRequired,
    handleCloseModal: PropTypes.func.isRequired,
    multiselect: PropTypes.bool,
    choices: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
        maps: PropTypes.array
      })
    ).isRequired
  };

  static defaultProps = {
    multiselect: false,
    required: false,
    readOnly: false
  };

  transformToDisplayValue = value => {
    return this.props.multiselect ? value.join(", ") : value;
  };

  transformToActualValue = value => {
    return this.props.multiselect ? value : value[0];
  };

  transformToInternalValue = value => {
    return this.props.multiselect ? value : [value];
  };

  getChoicesMaps = (choices, values) => {
    const choicesMaps = [];
    for (const { value, maps } of choices) {
      if (values.indexOf(value) >= 0) {
        choicesMaps.push(...maps);
      }
    }
    return choicesMaps;
  };

  openSelectorModal() {
    const {
      title,
      onChange,
      choices,
      handleOpenModal,
      handleCloseModal,
      multiselect,
      value
    } = this.props;

    handleOpenModal(
      title,
      <SelectModal
        choices={choices}
        values={this.transformToInternalValue(value)}
        multiselect={multiselect}
        onChange={values => {
          onChange(
            this.transformToActualValue(values),
            this.getChoicesMaps(choices, values)
          );
          if (!multiselect) {
            handleCloseModal();
          }
        }}
      />
    );
  }

  render() {
    const { value, title, required, readOnly } = this.props;
    return (
      <WidgetContainer>
        <Title required={required}>{title}</Title>
        <TouchableNativeFeedback
          onPress={() => !readOnly && this.openSelectorModal()}
        >
          <View style={styles.picker}>
            <Text style={styles.pickerItem}>
              {this.transformToDisplayValue(value)}
            </Text>
          </View>
        </TouchableNativeFeedback>
      </WidgetContainer>
    );
  }
}

const styles = StyleSheet.create({
  picker: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey3,
    flex: 1,
    height: 40,
    paddingLeft: 6,
    justifyContent: "center"
  },
  pickerItem: {
    fontFamily: "Lato-Regular",
    color: "black",
    fontSize: 12
  }
});
