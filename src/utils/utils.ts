import type { Entry } from "type-fest";

export const mapEntries = <I extends object, O extends object>(obj: I, fn: (p: Entry<I>) => Entry<O>) =>
  Object.fromEntries((Object.entries(obj) as Entry<I>[]).map(fn)) as O;

type AnyFunction = (...args: any[]) => any;
type TupleOptional<L extends number, T extends readonly unknown[] = []> = number extends L ? T : L extends T["length"] ? T : TupleOptional<L, [...T, unknown?]>;
type SetParameterLength<F extends AnyFunction, L extends number> = (...args: TupleOptional<L, Parameters<F>>) => ReturnType<F>;

export const memoize = <F extends AnyFunction, L extends number = Parameters<F>["length"]>(
  fn: F,
  length?: L,
): SetParameterLength<F, L> => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args.slice(0, length));
    return (cache[key] ??= fn(...args));
  };
};
