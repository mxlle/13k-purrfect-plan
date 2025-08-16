import { getCellTypesWithoutPrefix } from "./data/cell";

export const baseField = (() => {
  const { _ } = getCellTypesWithoutPrefix();
  return [
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
  ];
})();

export const baseField7 = (() => {
  const { _ } = getCellTypesWithoutPrefix();
  return [
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
    [_, _, _, _, _, _, _],
  ];
})();
