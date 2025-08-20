import { ALL_CAT_IDS, ALL_KITTEN_IDS, Cat, CatId, KittenId } from "./data/cats";
import { Tool } from "../types";
import { globals } from "../globals";
import { ObjectId } from "./data/objects";

export enum ConfigCategory {
  CATS = "Cats",
  KITTEN_BEHAVIOR = "Kitten Behavior",
  OBJECTS = "Objects",
  TOOLS = "Tools",
}

export interface Config {
  [ConfigCategory.CATS]: Record<CatId, boolean>;
  [ConfigCategory.KITTEN_BEHAVIOR]: Record<KittenId, boolean>;
  [ConfigCategory.OBJECTS]: Record<ObjectId, boolean>;
  [ConfigCategory.TOOLS]: Record<Tool, boolean>;
}

export type ConfigItemId = CatId | ObjectId | Tool;
export const emptyConfig: Config = {
  [ConfigCategory.CATS]: Object.fromEntries(ALL_CAT_IDS.map((catId, index) => [catId, true])) as Record<CatId, boolean>, // for now all cats are included by default
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, false])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(Object.values(ObjectId).map((type) => [type, false])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(Object.values(Tool).map((tool) => [tool, false])) as Record<Tool, boolean>,
};
export const allInConfig: Config = {
  [ConfigCategory.CATS]: Object.fromEntries(ALL_CAT_IDS.map((catId) => [catId, true])) as Record<CatId, boolean>,
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, true])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(Object.values(ObjectId).map((type) => [type, true])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(Object.values(Tool).map((tool) => [tool, true])) as Record<Tool, boolean>,
};
export const allCategories: ConfigCategory[] = Object.values(ConfigCategory);

export function shouldIncludeCat(catOrCatId: Cat | CatId): boolean {
  return globals.config[ConfigCategory.CATS][getCatId(catOrCatId)];
}

export function shouldApplyKittenBehavior(catOrCatId: Cat | CatId): boolean {
  return globals.config[ConfigCategory.KITTEN_BEHAVIOR][getCatId(catOrCatId)];
}

export function getCatId(catOrCatId: Cat | CatId): CatId {
  return typeof catOrCatId === "object" ? catOrCatId.id : catOrCatId;
}
