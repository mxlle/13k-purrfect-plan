import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { globals } from "../../globals";
import { Difficulty } from "../../types";
import { hasMoveLimit } from "../config/config";
import { getParFromMoonPosition } from "./game-elements";

export const XP_REP = "🧶";
const XP_FOR_UNION = 10;
const XP_FOR_RETRY = -1;
export const XP_FOR_HINT = -5;

const difficultyBonusXPMap: Record<Difficulty, number> = {
  [Difficulty.EASY]: 0,
  [Difficulty.MEDIUM]: 1,
  [Difficulty.HARD]: 3,
  [Difficulty.EXTREME]: 5,
};

export function getCurrentXP(): number {
  const stringValue = getLocalStorageItem(LocalStorageKey.XP);
  return stringValue ? parseInt(stringValue) : 0;
}

export function changeXP(newXP: number) {
  const currentXP = getCurrentXP();
  const newTotalXP = currentXP + newXP;
  setLocalStorageItem(LocalStorageKey.XP, newTotalXP.toString());
  return newTotalXP;
}

export function getXpInnerHtml(xp: number = getCurrentXP()): string {
  return `${xp !== 0 ? `${xp}&nbsp;${XP_REP}` : ""}`;
}

export function calculateNewXP(): number {
  if (!globals.gameState) {
    return 0;
  }

  const difficulty = globals.gameState.setup.difficulty;
  const difficultyBonus = difficulty ? difficultyBonusXPMap[difficulty] : 0;
  const finishEarlierBonus = hasMoveLimit() ? getParFromMoonPosition(globals.gameState.setup) - globals.gameState.moves.length : 0;

  return XP_FOR_UNION + globals.failedAttempts * XP_FOR_RETRY + difficultyBonus + finishEarlierBonus;
}
