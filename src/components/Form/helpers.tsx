import { ILayout, ISection, IField, AnyObject } from "./types";

import { merge, some } from "./functools";

function constructFieldMaps(section: ISection) {
  return merge(section.fields.map(field => ({ [field.id]: {} })));
}

export function constructMaps(layout: ILayout) {
  return merge(
    layout.sections.map(section => ({
      ...constructFieldMaps(section),
      [section.id]: {}
    }))
  );
}

export function extractObjects(layout: ILayout) {
  const sections = layout.sections.map(section => {
    const fields = section.fields.map(field => ({ [field.id]: field }));
    return merge([...fields, { [section.id]: section }]);
  });

  return merge(sections);
}

export function extractFields(layout: ILayout) {
  const sections = layout.sections.map(section => {
    const fields = section.fields.map(field => ({ [field.api_name]: field }));
    return merge(fields);
  });

  return merge(sections);
}

function getFieldInitialValue(section: ISection, initialValue: AnyObject) {
  return merge(
    section.fields.map(field => {
      if (!!field.pick_list_values && field.pick_list_values.length > 0) {
        if (field.json_type == "jsonarray")
          return {
            [field.api_name]: [field.pick_list_values[0].actual_value]
          };

        return {
          [field.api_name]: field.pick_list_values[0].actual_value
        };
      }
      return {
        [field.api_name]: initialValue[field.api_name] || field.default_value
      };
    })
  );
}

export function getInitialValue(layout: ILayout, initialValue: AnyObject) {
  return merge(
    layout.sections.map(section => ({
      ...getFieldInitialValue(section, initialValue)
    }))
  );
}

export const hasDataType = (dataType: string) => (field: IField) => field.data_type === dataType;

const hasPickListValues = hasDataType("picklist");

export function getFieldMapping(field: IField, value: any) {
  if (!hasPickListValues(field)) {
    return [];
  }

  if (!field.pick_list_values) {
    return [];
  }

  const filtered = field.pick_list_values.filter(choice => choice.actual_value === value);
  return filtered[0].maps || [];
}
