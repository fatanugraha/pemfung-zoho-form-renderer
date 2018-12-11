export const extractSections = (layout, layoutId) => {
  const currentLayout = layout.layout[layoutId];
  const result = [];
  for (const section of currentLayout.sections) {
    result.push({ id: section, ...layout.section[section] });
  }
  return result;
};

export const extractFields = (layout, layoutId) => {
  const currentLayout = layout.layout[layoutId];
  const result = [];
  for (const section of currentLayout.sections) {
    const currentSection = layout.section[section];
    for (const field of currentSection.fields) {
      result.push(layout.field[field]);
    }
  }
  return result;
};

export const getDefaultValue = field => {
  if (field.default_value) {
    return field.default_value;
  }

  if (field.data_type === "text") {
    return null;
  }

  if (field.data_type === "picklist") {
    return field.pick_list_values[0].actual_value;
  }

  if (field.data_type === "multiselectpicklist") {
    return [field.pick_list_values[0].actual_value];
  }

  if (field.data_type === "integer" || field.data_type === "bigint") {
    return null;
  }

  return null;
};
