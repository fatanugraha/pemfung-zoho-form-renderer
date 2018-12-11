import { FormState, IPickListValues, IField, IFieldMaps } from "./types";
import { merge } from "./functools";

export const mapValues = (targetField: IField, map: IFieldMaps) => (prevState: FormState) => {
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

export const mapVisibility = (targetField: IField, map: IFieldMaps) => (prevState: FormState) => {
  if (map.visible === undefined) {
    return prevState;
  }

  return {
    ...prevState,
    map: {
      ...prevState.map,
      [targetField.id]: { ...prevState.map[targetField.id], visible: map.visible }
    }
  };
};
