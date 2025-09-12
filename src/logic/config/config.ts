import { ALL_KITTEN_IDS, CatId } from "../data/catId";
import { ALL_TOOLS, ConfigItemId, Tool } from "../../types";
import { MoveLimit } from "./move-limit";
import { TranslationKey } from "../../translations/translationKey";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { getTranslation } from "../../translations/i18n";

export const allConfigItems: ConfigItemId[] = [...ALL_KITTEN_IDS, ...ALL_TOOLS, ...Object.values(MoveLimit)];

export function isConfigItemEnabled(configItem: ConfigItemId): boolean {
  return getKnownConfigItems().includes(configItem);
}

export function showMovesInfo(): boolean {
  return isConfigItemEnabled(MoveLimit.MOVE_LIMIT_SIMPLE) /* || isConfigItemEnabled(MoveLimit.MOVE_LIMIT_STRICT)*/;
}

export function showMoon() {
  return showMovesInfo();
}

export function hasMoveLimit(): boolean {
  return isConfigItemEnabled(MoveLimit.MOVE_LIMIT_STRICT);
}

export const explanationMap: Record<ConfigItemId, TranslationKey | undefined> = {
  [CatId.MOONY]: TranslationKey.EXPLANATION_MOONY,
  [CatId.IVY]: TranslationKey.EXPLANATION_IVY,
  [CatId.SPLASHY]: TranslationKey.EXPLANATION_SPLASHY,
  [Tool.MEOW]: TranslationKey.EXPLANATION_MEOW,
  [Tool.WAIT]: TranslationKey.EXPLANATION_WAIT,
  [MoveLimit.MOVE_LIMIT_SIMPLE]: TranslationKey.EXPLANATION_MOVE_LIMIT_1,
  [MoveLimit.MOVE_LIMIT_STRICT]: TranslationKey.EXPLANATION_MOVE_LIMIT_2,
};

export const preconditions: Partial<Record<ConfigItemId, ConfigItemId[]>> = {
  [CatId.MOONY]: [MoveLimit.MOVE_LIMIT_SIMPLE],
  [CatId.SPLASHY]: [Tool.MEOW],
  [Tool.WAIT]: [CatId.IVY],
  [MoveLimit.MOVE_LIMIT_STRICT]: [MoveLimit.MOVE_LIMIT_SIMPLE, Tool.MEOW, Tool.WAIT],
};

// export const preconditions: Record<ConfigItemId, ConfigItemId[]> = {
//   [CatId.MOONY]: [ObjectId.MOON, MoveLimit.MOVE_LIMIT_SIMPLE],
//   [CatId.IVY]: [ObjectId.TREE],
//   [CatId.SPLASHY]: [ObjectId.PUDDLE, Tool.MEOW],
//   [Tool.MEOW]: [],
//   [Tool.WAIT]: [Tool.MEOW, CatId.IVY],
//   [MoveLimit.MOVE_LIMIT_SIMPLE]: [ObjectId.MOON],
//   [MoveLimit.MOVE_LIMIT_STRICT]: [ObjectId.MOON, MoveLimit.MOVE_LIMIT_SIMPLE],
// };

let knownConfigItems: ConfigItemId[] | undefined;
export function getKnownConfigItems(): ConfigItemId[] {
  if (knownConfigItems === undefined) {
    knownConfigItems = (getLocalStorageItem(LocalStorageKey.KNOWN_CONFIG_ELEMENTS)?.split(",").map(Number) ?? []) as ConfigItemId[];
  }

  return knownConfigItems;
}

export function getNextUnknownConfigItems() {
  const knownConfigItems = getKnownConfigItems();
  const unknownConfigItems = allConfigItems.filter((item) => !knownConfigItems.includes(item));

  return unknownConfigItems.filter(
    (item) => !preconditions[item] || preconditions[item].every((precondition) => knownConfigItems.includes(precondition)),
  );
}

export function hasUnknownConfigItems() {
  return getNextUnknownConfigItems().length > 0;
}

export function updateKnownConfigItems(newConfigItems: ConfigItemId[]) {
  const currentlyKnownConfigItems = getKnownConfigItems();
  const newKnownConfigItems = [...new Set([...currentlyKnownConfigItems, ...newConfigItems])];
  setLocalStorageItem(LocalStorageKey.KNOWN_CONFIG_ELEMENTS, newKnownConfigItems.join(","));
  knownConfigItems = newKnownConfigItems;
}

export function getToolText(tool: Tool) {
  return tool === Tool.MEOW ? `💬 ${getTranslation(TranslationKey.MEOW)}` : `💤 ${getTranslation(TranslationKey.WAIT)}`;
}
