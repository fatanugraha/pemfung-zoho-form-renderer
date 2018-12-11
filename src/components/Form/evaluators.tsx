import { FormState, IRuleFunctionArg, IRuleFunction, IRule, AnyObject } from "./types";

const shouldEvaluateCondition = (func: IRuleFunction, updatedFields: Array<any>) => {
  const evaluator: AnyObject = {
    is: (args: Array<IRuleFunctionArg>) =>
      args.filter(arg => arg.field).some(arg => updatedFields.indexOf(arg.field) >= 0),
    or: (args: Array<IRuleFunction>) =>
      args.some(arg => shouldEvaluateCondition(arg, updatedFields)),
    and: (args: Array<IRuleFunction>) =>
      args.every(arg => shouldEvaluateCondition(arg, updatedFields))
  };

  return evaluator[func.func](func.args);
};

export const shouldEvaluateConditions = (
  conditions: Array<IRuleFunction>,
  updatedFields: Array<any>
) => {
  return shouldEvaluateCondition({ func: "and", args: conditions }, updatedFields);
};

const getValueFromArgument = (state: FormState) => (arg: IRuleFunctionArg) => {
  if (arg.value) {
    return arg.value;
  } else if (arg.field) {
    return state.value[arg.field];
  }

  return undefined;
};

const evaluateCondition = (state: FormState, func: IRuleFunction) => {
  const getValue = getValueFromArgument(state);

  const evaluator: AnyObject = {
    is: (args: Array<IRuleFunctionArg>) => getValue(args[0]) === getValue(args[1]),
    or: (args: Array<IRuleFunction>) => args.some(arg => evaluateCondition(state, arg)),
    and: (args: Array<IRuleFunction>) => args.every(arg => evaluateCondition(state, arg))
  };

  return evaluator[func.func](func.args);
};

export const evaluateRule = (state: FormState, rule: IRule) => {
  if (evaluateCondition(state, { func: "and", args: rule.conditions })) {
    return rule.fulfilled;
  }

  return rule.rejected;
};
