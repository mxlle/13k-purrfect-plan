import { getCellTypePlaceholders } from "./data/cell";

export const baseField = (() => {
  const { _ } = getCellTypePlaceholders();
  return [
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
    [_, _, _, _, _],
  ];
})();

export const baseField7 = (() => {
  const { _ } = getCellTypePlaceholders();
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
