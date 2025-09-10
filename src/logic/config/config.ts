import { ALL_KITTEN_IDS, CatId, type KittenId } from "../data/catId";
import { ALL_TOOLS, ConfigCategory, ConfigItemId, ObjectId, Tool } from "../../types";
import { GameSetup } from "../data/game-elements";
import { getHighestMoveLimit, MoveLimit } from "./move-limit";
import { TranslationKey } from "../../translations/translationKey";
import { getArrayFromStorage, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { ALL_OBJECT_IDS } from "../data/objects";
import { getTranslation } from "../../translations/i18n";

export interface Config {
  [ConfigCategory.KITTEN_BEHAVIOR]: Record<KittenId, boolean>;
  [ConfigCategory.OBJECTS]: Record<ObjectId, boolean>;
  [ConfigCategory.TOOLS]: Record<Tool, boolean>;
  [ConfigCategory.RULES]: {
    moveLimit: MoveLimit;
  };
}

export const emptyConfig: Config = {
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, false])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(ALL_OBJECT_IDS.map((type) => [type, false])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(ALL_TOOLS.map((tool) => [tool, false])) as Record<Tool, boolean>,
  [ConfigCategory.RULES]: {
    moveLimit: MoveLimit.MOVE_LIMIT_NONE,
  },
};
export const allInConfig: Config = {
  [ConfigCategory.KITTEN_BEHAVIOR]: Object.fromEntries(ALL_KITTEN_IDS.map((catId) => [catId, true])) as Record<KittenId, boolean>,
  [ConfigCategory.OBJECTS]: Object.fromEntries(ALL_OBJECT_IDS.map((type) => [type, true])) as Record<ObjectId, boolean>,
  [ConfigCategory.TOOLS]: Object.fromEntries(ALL_TOOLS.map((tool) => [tool, true])) as Record<Tool, boolean>,
  [ConfigCategory.RULES]: {
    moveLimit: MoveLimit.MOVE_LIMIT_STRICT,
  },
};
export const allCategories: ConfigCategory[] = Object.values(ConfigCategory);
export const allConfigItems: ConfigItemId[] = [...ALL_KITTEN_IDS, ...ALL_OBJECT_IDS, ...Object.values(Tool), ...Object.values(MoveLimit)];

export function shouldApplyKittenBehavior(gameSetup: GameSetup, catId: CatId): boolean {
  return gameSetup.config[ConfigCategory.KITTEN_BEHAVIOR][catId];
}

export function showMovesInfo(config: Config): boolean {
  return config[ConfigCategory.RULES].moveLimit !== MoveLimit.MOVE_LIMIT_NONE;
}

export function showMoon(config: Config) {
  return config[ConfigCategory.OBJECTS][ObjectId.MOON] && showMovesInfo(config);
}

export function hasMoveLimit(config: Config): boolean {
  return config[ConfigCategory.RULES].moveLimit === MoveLimit.MOVE_LIMIT_STRICT;
}

export function copyConfig(config: Config): Config {
  return {
    [ConfigCategory.KITTEN_BEHAVIOR]: { ...config[ConfigCategory.KITTEN_BEHAVIOR] },
    [ConfigCategory.OBJECTS]: { ...config[ConfigCategory.OBJECTS] },
    [ConfigCategory.TOOLS]: { ...config[ConfigCategory.TOOLS] },
    [ConfigCategory.RULES]: { ...config[ConfigCategory.RULES] },
  };
}

export const explanationMap: Record<ConfigItemId, TranslationKey | undefined> = {
  [CatId.MOONY]: TranslationKey.EXPLANATION_MOONY,
  [CatId.IVY]: TranslationKey.EXPLANATION_IVY,
  [CatId.SPLASHY]: TranslationKey.EXPLANATION_SPLASHY,
  [Tool.MEOW]: TranslationKey.EXPLANATION_MEOW,
  [Tool.WAIT]: TranslationKey.EXPLANATION_WAIT,
  [MoveLimit.MOVE_LIMIT_NONE]: undefined,
  [MoveLimit.MOVE_LIMIT_SIMPLE]: TranslationKey.EXPLANATION_MOVE_LIMIT_1,
  [MoveLimit.MOVE_LIMIT_STRICT]: TranslationKey.EXPLANATION_MOVE_LIMIT_2,
  [ObjectId.TREE]: undefined,
  [ObjectId.MOON]: undefined,
  [ObjectId.PUDDLE]: undefined,
};

export const preconditions: Record<ConfigItemId, ConfigItemId[]> = {
  [CatId.MOONY]: [ObjectId.MOON, MoveLimit.MOVE_LIMIT_SIMPLE],
  [CatId.IVY]: [ObjectId.TREE],
  [CatId.SPLASHY]: [ObjectId.PUDDLE, Tool.MEOW],
  [Tool.MEOW]: [],
  [Tool.WAIT]: [Tool.MEOW, CatId.IVY],
  [MoveLimit.MOVE_LIMIT_NONE]: [],
  [MoveLimit.MOVE_LIMIT_SIMPLE]: [ObjectId.MOON],
  [MoveLimit.MOVE_LIMIT_STRICT]: [ObjectId.MOON, MoveLimit.MOVE_LIMIT_SIMPLE],
  [ObjectId.TREE]: [],
  [ObjectId.MOON]: [],
  [ObjectId.PUDDLE]: [],
};

export function getKnownConfigItems(): ConfigItemId[] {
  return [...getArrayFromStorage(LocalStorageKey.KNOWN_CONFIG_ELEMENTS), ...ALL_OBJECT_IDS, MoveLimit.MOVE_LIMIT_NONE] as ConfigItemId[];
}

export function getNextUnknownConfigItems() {
  const knownConfigItems = getKnownConfigItems();
  const unknownConfigItems = allConfigItems.filter((item) => !knownConfigItems.includes(item));

  return unknownConfigItems.filter((item) => preconditions[item].every((precondition) => knownConfigItems.includes(precondition)));
}

export function hasUnknownConfigItems() {
  return getNextUnknownConfigItems().length > 0;
}

export function updateKnownConfigItems(newConfigItems: ConfigItemId[]) {
  const knownConfigItems = getKnownConfigItems();
  const newKnownConfigItems = [...new Set([...knownConfigItems, ...newConfigItems])];
  setLocalStorageItem(LocalStorageKey.KNOWN_CONFIG_ELEMENTS, newKnownConfigItems.join(","));
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

    if (category === ConfigCategory.RULES) {
      validatedConfig[category].moveLimit = getHighestMoveLimit(knownConfigItems);
    }
  }

  return validatedConfig;
}

export function getToolText(tool: Tool) {
  return tool === Tool.MEOW ? `💬&nbsp;${getTranslation(TranslationKey.MEOW)}` : `💤&nbsp;${getTranslation(TranslationKey.WAIT)}`;
}
