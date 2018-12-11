import { AnyObject } from "./types";

export function merge(object: Array<AnyObject>): AnyObject {
  return object.reduce((prev, current) => ({ ...prev, ...current }), {});
}

export function all(...fn: Array<(...args: Array<any>) => any>) {
  return (...args: Array<any>) => fn.every(f => f(...args));
}

export function some(...fn: Array<(...args: Array<any>) => any>) {
  return (...args: Array<any>) => fn.some(f => f(...args));
}

export function compose<T>(...fn: Array<(arg: T) => T>) {
  return (arg: T) => fn.reduce((prevResult, f) => f(prevResult), arg);
}
