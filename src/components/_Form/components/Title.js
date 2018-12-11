import React from "react";
import PropTypes from "prop-types";
import { Text, StyleSheet } from "react-native";

const Title = ({ children, required }) => (
  <Text style={styles.title}>
    {required && <Text style={styles.required}>{`* `}</Text>}
    {children}
  </Text>
);

Title.propTypes = {
  title: PropTypes.string,
  required: PropTypes.bool
};

Title.defaultProps = {
  required: false
};

export default Title;

const styles = StyleSheet.create({
  title: {
    height: 40,
    width: 100,
    fontSize: 9,
    paddingRight: 8,
    textAlign: "right",
    textAlignVertical: "center"
  },
  required: {
    color: "red"
  }
});
