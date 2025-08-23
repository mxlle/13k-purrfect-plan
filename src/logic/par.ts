import { ALL_TURN_MOVES, TurnMove } from "../types";
import { calculateNewPositions, isValidMove, isWinConditionMet } from "./game-logic";
import { shuffleArray } from "../utils/random-utils";
import { copyGameState, GameSetup, GameState, getInitialGameState } from "./data/game-elements";

interface ParInfo {
  par: number;
  possibleSolutions: TurnMove[][];
}

let iterationCount = 1;

export const MAX_PAR = 5;
export const MIN_PAR = 3;

export const FALLBACK_PAR = 42; // Fallback value for par when no solution is found

export function calculatePar(gameSetup: GameSetup): ParInfo {
  const performanceStart = performance.now();
  const gameState = getInitialGameState(gameSetup);
  console.info("Starting par calculation...", gameSetup, gameState);
  const parInfo = calculateParInner(gameState);
  const performanceEnd = performance.now();
  const performanceTime = performanceEnd - performanceStart;
  console.info(
    "Calculated par:",
    parInfo.par,
    "Time taken:",
    Math.round(performanceTime),
    "ms",
    parInfo.possibleSolutions.length + " solutions: ",
    parInfo.possibleSolutions,
  );
  console.info("First solution:", parInfo.possibleSolutions[0]?.join(" > "));

  return parInfo;
}

function calculateParInner(gameState: GameState): ParInfo {
  const previousMoves = gameState.moves;

  if (previousMoves.length === 0) {
    iterationCount = 1; // Reset iteration count for a new calculation
  } else {
    iterationCount++;
  }

  if (isWinConditionMet(gameState)) {
    return { par: 0, possibleSolutions: [previousMoves] }; // Already won, no moves needed
  }

  if (previousMoves.length >= MAX_PAR) {
    // console.warn("Too many moves, returning -1 to indicate failure.");
    return { par: FALLBACK_PAR, possibleSolutions: [previousMoves] }; // Limit the recursion depth to prevent excessive computation
  }

  let bestParInfo: ParInfo = { par: FALLBACK_PAR, possibleSolutions: [] };

  const shuffledMoves = shuffleArray([...ALL_TURN_MOVES]);

  for (const move of shuffledMoves) {
    if (!isValidMove(gameState, move)) {
      continue; // Tool is still in recovery, skip this move
    }

    const copiedGameState = copyGameState(gameState);
    const newMoves = [...previousMoves, move];
    copiedGameState.moves = newMoves;

    calculateNewPositions(copiedGameState, move);

    // Recursively calculate par for the next moves
    const parInfo = calculateParInner(copiedGameState);
    const newPar = parInfo.par + 1;

    if (newPar < bestParInfo.par) {
      bestParInfo = { ...parInfo, par: newPar };
    } else if (newPar === bestParInfo.par) {
      bestParInfo = { par: newPar, possibleSolutions: [...bestParInfo.possibleSolutions, ...parInfo.possibleSolutions] }; // Increment the par count for this move
    }
  }

  if (previousMoves.length === 0) {
    console.info(`Par calculation completed after ${iterationCount} iterations.`);
  }

  return bestParInfo;
}
