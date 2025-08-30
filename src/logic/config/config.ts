import { ALL_KITTEN_IDS, CatId, type KittenId } from "../data/catId";
import { ObjectId, Tool } from "../../types";
import { GameSetup } from "../data/game-elements";
import { defineEnum } from "../../utils/enums";
import { Constraint } from "./constraint";
import { TranslationKey } from "../../translations/translationKey";
import { getArrayFromStorage, LocalStorageKey } from "../../utils/local-storage";
import { ALL_OBJECT_IDS } from "../data/objects";

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

export type ConfigItemId = KittenId | ObjectId | Tool | Constraint;
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
export const allConfigItems: ConfigItemId[] = [...ALL_KITTEN_IDS, ...ALL_OBJECT_IDS, ...Object.values(Tool), ...Object.values(Constraint)];

export function shouldApplyKittenBehavior(gameSetup: GameSetup, catId: CatId): boolean {
  return gameSetup.config[ConfigCategory.KITTEN_BEHAVIOR][catId];
}

export function hasMoveLimit(gameSetup: GameSetup): boolean {
  return Object.values(gameSetup.config[ConfigCategory.CONSTRAINTS]).some((enabled) => enabled);
}

export function copyConfig(config: Config): Config {
  return {
    [ConfigCategory.KITTEN_BEHAVIOR]: { ...config[ConfigCategory.KITTEN_BEHAVIOR] },
    [ConfigCategory.OBJECTS]: { ...config[ConfigCategory.OBJECTS] },
    [ConfigCategory.TOOLS]: { ...config[ConfigCategory.TOOLS] },
    [ConfigCategory.CONSTRAINTS]: { ...config[ConfigCategory.CONSTRAINTS] },
  };
}

export const explanationMap: Record<ConfigItemId, TranslationKey | undefined> = {
  [CatId.MOONY]: TranslationKey.EXPLANATION_MOONY,
  [CatId.IVY]: TranslationKey.EXPLANATION_IVY,
  [CatId.SPLASHY]: TranslationKey.EXPLANATION_SPLASHY,
  [Tool.MEOW]: TranslationKey.EXPLANATION_MEOW,
  [Constraint.MOVE_LIMIT_SIMPLE]: TranslationKey.EXPLANATION_MOVE_LIMIT_1,
  [ObjectId.TREE]: undefined,
  [ObjectId.MOON]: undefined,
  [ObjectId.PUDDLE]: undefined,
};

export const preconditions: Record<ConfigItemId, ConfigItemId[]> = {
  [CatId.MOONY]: [ObjectId.MOON],
  [CatId.IVY]: [ObjectId.TREE],
  [CatId.SPLASHY]: [ObjectId.PUDDLE],
  [Tool.MEOW]: [],
  [Constraint.MOVE_LIMIT_SIMPLE]: [ObjectId.MOON],
  [ObjectId.TREE]: [],
  [ObjectId.MOON]: [],
  [ObjectId.PUDDLE]: [],
};

export function getKnownConfigItems() {
  return [...getArrayFromStorage(LocalStorageKey.KNOWN_CONFIG_ELEMENTS), ...ALL_OBJECT_IDS];
}

export function getNextUnknownConfigItems() {
  const knownConfigItems = getKnownConfigItems();
  const unknownConfigItems = allConfigItems.filter((item) => !knownConfigItems.includes(item));

  return unknownConfigItems.filter((item) => preconditions[item].every((precondition) => knownConfigItems.includes(precondition)));
}

export function hasUnknownConfigItems() {
  return getNextUnknownConfigItems().length > 0;
}

export function getValidatedConfig(config: Config): Config {
  const knownConfigItems = getKnownConfigItems();

  const validatedConfig = copyConfig(emptyConfig);

  for (const category of allCategories) {
    for (const itemId of allConfigItems) {
      if (knownConfigItems.includes(itemId)) {
        validatedConfig[category][itemId] = config[category][itemId];
      }
    }
  }

  return validatedConfig;
}
