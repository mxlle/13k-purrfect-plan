import { createCatElement } from "../../components/game-elements/cat-component/cat-component";
import { ALL_CAT_IDS, CatId } from "./catId";

export const CAT_NAMES: Record<CatId, string> = {
  [CatId.MOTHER]: "Amara",
  [CatId.MOONY]: "Moony",
  [CatId.IVY]: "Ivy",
  [CatId.SPLASHY]: "Splashy",
};

const cachedCatElements: Partial<Record<CatId, HTMLElement>> = {};
export function getCatElement(id: CatId): HTMLElement {
  return (cachedCatElements[id] ??= createCatElement(id));
}

export function isMom(catId: CatId): boolean {
  return catId === CatId.MOTHER;
}

export function isCatId(value: any): value is CatId {
  return ALL_CAT_IDS.includes(value);
}
