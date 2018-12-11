import React from "react";
import { Card, Elevation } from "@blueprintjs/core";

const Section: React.SFC<{ title: string; children: React.ReactNodeArray }> = ({
  title,
  children
}) => (
  <Card elevation={Elevation.TWO} style={{ marginBottom: 24 }}>
    <h4 className="bp3-heading">{title}</h4>
    {children}
  </Card>
);

export default Section;
