import React from "react";
import PropTypes from "prop-types";

export default class TextField extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    mode: PropTypes.oneOf([
      "text",
      "email",
      "website",
      "phone",
      "integer",
      "bigint",
      "double"
    ])
  };

  static defaultProps = {
    required: false,
    mode: "text",
    readOnly: false
  };

  transformToActualValue = value => {
    const { mode } = this.props;

    switch (mode) {
      case "text":
      case "email":
      case "website":
      case "phone":
        return value;
      case "integer":
      case "bigint":
        return parseInt(value);
      case "double":
        return parseFloat(value);
    }
  };

  render() {
    const { title, value, onChange, required, readOnly } = this.props;
    return (
      <div>
        <h3>{title}</h3>
        <input
          value={value}
          onChange={onChange}
          required={required}
          readOnly={readOnly}
        />
      </div>
    );
  }
}
