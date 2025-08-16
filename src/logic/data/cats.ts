import { createCatElement } from "../../components/game-field/cell-component";

import { CellPosition } from "./cell";

export interface BaseCat {
  id: number;
  name: string; // todo tagged type
  size: number;
  awake: boolean;
  isMother?: boolean;
}

export interface Cat extends BaseCat {
  catElement: HTMLElement;
  inventory?: InventoryItem;
}

export interface PlacedCat extends Cat, CellPosition {}

export interface CatWithPosition extends BaseCat, CellPosition {}

export type InventoryItem = PlacedCat;

const BASE_MOTHER_CAT: BaseCat = {
  id: 0,
  name: "🐈‍⬛",
  size: 3,
  awake: true,
  isMother: true,
};

export const INITIAL_MOTHER_CAT: PlacedCat = {
  ...BASE_MOTHER_CAT,
  row: 0,
  column: 0,
  catElement: createCatElement(BASE_MOTHER_CAT),
};
