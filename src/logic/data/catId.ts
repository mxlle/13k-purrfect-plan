import { defineEnum } from "../../utils/enums";

export type CatId = defineEnum<typeof CatId>;
export const CatId = defineEnum({
  MOTHER: 0,
  SPLASHY: 1,
  IVY: 2,
  MOONY: 3,
});

export const ALL_CAT_IDS = Object.values(CatId);

export type KittenId = Exclude<CatId, typeof CatId.MOTHER>;
export const ALL_KITTEN_IDS: KittenId[] = ALL_CAT_IDS.filter((id) => id !== CatId.MOTHER);

export function isKittenId(value: any): value is KittenId {
  return ALL_KITTEN_IDS.includes(value);
}
