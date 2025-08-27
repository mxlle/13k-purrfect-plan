import { ALL_KITTEN_IDS, CatId, type KittenId } from "../data/catId";
import { Tool } from "../../types";
import { ObjectId } from "../data/objects";
import { GameSetup } from "../data/game-elements";
import { defineEnum } from "../../utils/enums";
import { Constraint } from "./constraint";

export type ConfigCategory = defineEnum<typeof ConfigCategory>;
export const ConfigCategory = defineEnum({
  KITTEN_BEHAVIOR: "Kitten Behavior",
  OBJECTS: "Objects",
  TOOLS: "Tools",
  CONSTRAINTS: "Constraints",
});

export interface Config {
  [ConfigCategory.KITTEN_BEHAVIOR]: Record<KittenId, boolean>;
  [ConfigCategory.OBJECTS]: Record<ObjectId, boolean>;
  [ConfigCategory.TOOLS]: Record<Tool, boolean>;
  [ConfigCategory.CONSTRAINTS]: Record<Constraint, boolean>;
}

export type ConfigItemId = CatId | ObjectId | Tool | Constraint;
export const emptyConfig: Config = {
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, false])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(Object.values(ObjectId).map((type) => [type, false])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(Object.values(Tool).map((tool) => [tool, false])) as Record<Tool, boolean>,
  [ConfigCategory.CONSTRAINTS]: Object.fromEntries(Object.values(Constraint).map((constraint) => [constraint, false])) as Record<
    Constraint,
    boolean
  >,
};
export const allInConfig: Config = {
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, true])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(Object.values(ObjectId).map((type) => [type, true])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(Object.values(Tool).map((tool) => [tool, true])) as Record<Tool, boolean>,
  [ConfigCategory.CONSTRAINTS]: Object.fromEntries(Object.values(Constraint).map((constraint) => [constraint, true])) as Record<
    Constraint,
    boolean
  >,
};
export const allCategories: ConfigCategory[] = Object.values(ConfigCategory);

export function shouldApplyKittenBehavior(gameSetup: GameSetup, catId: CatId): boolean {
  return gameSetup.config[ConfigCategory.KITTEN_BEHAVIOR][catId];
}

export function hasMoveLimit(gameSetup: GameSetup): boolean {
  return Object.values(gameSetup.config[ConfigCategory.CONSTRAINTS]).some((enabled) => enabled);
}
