import { createCatElement } from "../../components/cat-component/cat-component";
import { CatId } from "./catId";

export const CAT_NAMES: Record<CatId, string> = {
  [CatId.MOTHER]: "Amara",
  [CatId.MOONY]: "Moony",
  [CatId.IVY]: "Ivy",
  [CatId.SPLASHY]: "Splashy",
};

export const CAT_COLOR_IDS: Record<CatId, number> = {
  [CatId.MOTHER]: 0,
  [CatId.MOONY]: 1,
  [CatId.IVY]: 2,
  [CatId.SPLASHY]: 3,
};

const cachedCatElements: Record<CatId, HTMLElement> = {
  [CatId.MOTHER]: createCatElement(CatId.MOTHER),
  [CatId.MOONY]: createCatElement(CatId.MOONY),
  [CatId.IVY]: createCatElement(CatId.IVY),
  [CatId.SPLASHY]: createCatElement(CatId.SPLASHY),
};

export function getCatElement(id: CatId): HTMLElement {
  return cachedCatElements[id];
}

export function isMom(catId: CatId): boolean {
  return catId === CatId.MOTHER;
}

export function isCatId(value: any): value is CatId {
  return Object.values(CatId).includes(value);
}
