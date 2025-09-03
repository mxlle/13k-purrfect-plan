import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { globals } from "../../globals";

const XP_REP = "🧶";
const XP_FOR_UNION = 10;
const XP_FOR_RETRY = -1;
export const XP_FOR_HINT = -2;

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

export function getXPString(xp: number = getCurrentXP()): string {
  return `${xp !== 0 ? `${xp} ${XP_REP}` : ""}`;
}

export function calculateNewXP(): number {
  if (!globals.gameState) {
    return 0;
  }

  return XP_FOR_UNION + globals.failedAttempts * XP_FOR_RETRY;
}
