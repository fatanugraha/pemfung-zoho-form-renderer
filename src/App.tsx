import React, { Component } from "react";

import Form from "./components/Form";
import activationMicroLayout from "./fixtures/layout.json";

class App extends Component {
  render() {
    return (
      <div style={{ width: 800, margin: "24px auto" }}>
        <Form layout={activationMicroLayout} />
      </div>
    );
  }
}

export default App;
