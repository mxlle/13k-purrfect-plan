import { PlacedCat } from "./data/cats";
import { PlacedObject } from "./data/objects";
import { ALL_TURN_MOVES, TurnMove } from "../types";
import { calculateNewPositions, isValidMove, isWinConditionMet } from "./game-logic";
import { shuffleArray } from "../utils/random-utils";

interface ParInfo {
  par: number;
  moves: TurnMove[];
}

let iterationCount = 1;

export const MAX_PAR = 5;
export const MIN_PAR = 3;

export const FALLBACK_PAR = 42; // Fallback value for par when no solution is found

export function calculatePar(placedCats: PlacedCat[], placedObjects: PlacedObject[], previousMoves: TurnMove[]): ParInfo {
  if (previousMoves.length === 0) {
    iterationCount = 1; // Reset iteration count for a new calculation
  } else {
    iterationCount++;
  }

  if (isWinConditionMet(placedCats)) {
    return { par: 0, moves: previousMoves }; // Already won, no moves needed
  }

  if (previousMoves.length >= MAX_PAR) {
    // console.warn("Too many moves, returning -1 to indicate failure.");
    return { par: -1, moves: previousMoves }; // Limit the recursion depth to prevent excessive computation
  }

  let bestParInfo: ParInfo = { par: FALLBACK_PAR, moves: [] };

  const shuffledMoves = shuffleArray([...ALL_TURN_MOVES]);

  for (const move of shuffledMoves) {
    if (!isValidMove(move, placedCats, placedObjects, previousMoves)) {
      continue; // Tool is still in recovery, skip this move
    }

    const newMoves = [...previousMoves, move];
    const newPlacedCats = copyObjects(placedCats);
    const newPlacedObjects = copyObjects(placedObjects);

    calculateNewPositions(move, newPlacedCats, newPlacedObjects);

    // Recursively calculate par for the next moves
    const parInfo = calculatePar(newPlacedCats, newPlacedObjects, newMoves);
    const newPar = parInfo.par + 1;

    if (parInfo.par === 0) {
      return { ...parInfo, par: newPar }; // Found a winning move
    }

    if (parInfo.par > 0 && parInfo.par < bestParInfo.par) {
      bestParInfo = { ...parInfo, par: newPar }; // Increment the par count for this move
    }
  }

  if (previousMoves.length === 0) {
    console.debug(`Par calculation completed after ${iterationCount} iterations.`);
  }

  return bestParInfo;
}

export function copyObjects<T>(objects: T[]): T[] {
  return objects.map((obj) => ({ ...obj })); // Shallow copy for simplicity
}
