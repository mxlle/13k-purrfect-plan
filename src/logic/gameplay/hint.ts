import { GameState } from "../data/game-elements";
import { TurnMove } from "../../types";
import { removeDuplicates } from "../../utils/array-utils";

export function getRemainingSolutions(gameState: GameState): TurnMove[][] {
  return gameState.setup.possibleSolutions
    .filter((solution) => gameState.moves.every((move, index) => solution[index] === move))
    .map((solution) => solution.slice(gameState.moves.length));
}

export function getBestNextMove(gameState: GameState): TurnMove | undefined {
  const remainingSolutions = getRemainingSolutions(gameState);
  const firstSteps = remainingSolutions.map((solution) => solution[0]);
  const countPerTurnMove: { [key in TurnMove]?: number } = {};
  firstSteps.forEach((move) => {
    countPerTurnMove[move] = (countPerTurnMove[move] || 0) + 1;
  });
  const sortedMoves = removeDuplicates(firstSteps).sort((a, b) => countPerTurnMove[b] - countPerTurnMove[a]);
  console.debug("Getting best next move: ", countPerTurnMove, remainingSolutions);

  return sortedMoves[0];
}
