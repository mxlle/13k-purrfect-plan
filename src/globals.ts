import { GameElementPositions, GameState } from "./logic/data/game-elements";
import { isMoveLimitExceeded, isWinConditionMet } from "./logic/checks";

interface GameGlobals {
  gameState: GameState | undefined;
  nextPositionsIfWait: GameElementPositions | undefined;
  language: string;
  failedAttempts: number;
}

const defaultGlobals: GameGlobals = {
  gameState: undefined,
  nextPositionsIfWait: undefined,
  language: "en",
  failedAttempts: 0,
};

export const globals: GameGlobals = { ...defaultGlobals };

export function resetGlobals() {
  Object.assign(globals, defaultGlobals);
}

function getNumFromParam(param: string, fallback: number) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const valueParam = urlParams.get(param);
  let num = valueParam ? Number(valueParam) : fallback;
  num = isNaN(num) ? fallback : num;

  return num;
}

export function isGameInProgress(): boolean {
  return globals.gameState !== undefined && !isWinConditionMet(globals.gameState) && !isMoveLimitExceeded(globals.gameState);
}
