import { createCatElement } from "../../components/game-field/cell-component";

import { CellPosition } from "./cell";

export enum CatId {
  MOTHER,
  MOONY,
  IVY,
  SPLASHY,
}

export const ALL_CAT_IDS = Object.values(CatId).filter((id) => typeof id === "number") as CatId[];

export const CAT_NAMES: Record<CatId, string> = {
  [CatId.MOTHER]: "Amara",
  [CatId.MOONY]: "Moony",
  [CatId.IVY]: "Ivy",
  [CatId.SPLASHY]: "Splashy",
};

const cachedCats: Record<CatId, Cat> = {
  [CatId.MOTHER]: createCat(CatId.MOTHER),
  [CatId.MOONY]: createCat(CatId.MOONY),
  [CatId.IVY]: createCat(CatId.IVY),
  [CatId.SPLASHY]: createCat(CatId.SPLASHY),
};

type CatName = (typeof CAT_NAMES)[CatId];

export interface BaseCat {
  readonly id: CatId;
  readonly name: CatName;
  awake: boolean;
}

export interface Cat extends BaseCat {
  catElement: HTMLElement;
  inventory?: InventoryItem;
}

export interface PlacedCat extends Cat, CellPosition {}

export type InventoryItem = PlacedCat;

export const INITIAL_MOTHER_CAT: PlacedCat = {
  ...getCat(CatId.MOTHER),
  row: 0,
  column: 0,
};

function createCat(id: CatId): Cat {
  const name = CAT_NAMES[id];

  const baseCat: BaseCat = {
    id,
    name,
    awake: true,
  };

  return {
    ...baseCat,
    catElement: createCatElement(baseCat),
  };
}

export function getCat(id: CatId): Cat {
  return cachedCats[id];
}

export function isMother(cat: BaseCat): boolean {
  return cat.id === CatId.MOTHER;
}
