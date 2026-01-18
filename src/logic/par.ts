import { ALL_TURN_MOVES, Difficulty, Direction, isDirection, Tool, TurnMove } from "../types";
import { shuffleArray } from "../utils/random-utils";
import { copyGameState, deepCopyElementsMap, GameSetup, GameState, getInitialGameState } from "./data/game-elements";
import { difficultyEmoji } from "./difficulty";
import { removeDuplicates } from "../utils/array-utils";
import { isValidMove } from "./gameplay/movement";
import { isMoveLimitExceeded, isWinConditionMet } from "./checks";
import { calculateNewPositions } from "./gameplay/calculate-new-positions";
import { HAS_GAMEPLAY_NICE_TO_HAVES, IS_DEV } from "../env-utils";

interface ParInfo {
  par: number;
  possibleSolutions: TurnMove[][];
  difficulty: Difficulty;
}

type ParInfoWithoutDifficulty = Omit<ParInfo, "difficulty">;

let iterationCount = 1;

export const MAX_PAR = 5;
export const MIN_PAR = 3;

export const FALLBACK_PAR = 42; // Fallback value for par when no solution is found

interface ParOptions {
  returnAllSolutions?: boolean;
}

function readableDirection(turnMove: TurnMove): string {
  switch (turnMove) {
    case Direction.UP:
      return "up";
    case Direction.DOWN:
      return "down";
    case Direction.LEFT:
      return "left";
    case Direction.RIGHT:
      return "right";
    case Tool.MEOW:
      return "meow";
    case Tool.WAIT:
      return "wait";
    default:
      return turnMove;
  }
}

export function calculatePar(gameSetup: GameSetup, options: ParOptions = {}): ParInfo {
  let performanceStart;
  if (IS_DEV) {
    performanceStart = performance.now();
  }
  const gameState = getInitialGameState(gameSetup);
  console.debug("Starting par calculation...");
  const parInfo = calculateParInner(gameState, options);
  const difficulty = calculateDifficulty(gameState, parInfo);
  let performanceTime;
  if (IS_DEV) {
    const performanceEnd = performance.now();
    performanceTime = performanceEnd - performanceStart;
  }
  console.info(
    "Calculated par:",
    parInfo.par,
    "Time taken:",
    Math.round(performanceTime),
    "ms",
    "Difficulty:",
    difficultyEmoji[difficulty],
    parInfo.possibleSolutions.length + " solutions: ",
    parInfo.possibleSolutions,
  );
  console.info("First solution:", parInfo.possibleSolutions[0]?.map(readableDirection).join(" > "));

  return { par: parInfo.par, possibleSolutions: shuffleArray(parInfo.possibleSolutions), difficulty };
}

function calculateDifficulty(gameState: GameState, parInfo: ParInfoWithoutDifficulty): Difficulty {
  const numberOfSolutions = parInfo.possibleSolutions.length;

  if (numberOfSolutions <= 1) {
    return Difficulty.HARD;
  }

  if (!HAS_GAMEPLAY_NICE_TO_HAVES) {
    return numberOfSolutions < 8 ? Difficulty.MEDIUM : Difficulty.EASY;
  }

  const containsSpecialMoves = parInfo.possibleSolutions.every((solution) => solution.some((move) => !isDirection(move)));
  const containsSpecialMovesInBeginning = parInfo.possibleSolutions.every((solution) =>
    solution.slice(0, 2).some((move) => !isDirection(move)),
  );

  if (numberOfSolutions < 5) {
    if (containsSpecialMovesInBeginning) {
      return Difficulty.HARD;
    }

    return Difficulty.MEDIUM;
  }

  const possibleStartMoves = getPossibleMoves(gameState, [...ALL_TURN_MOVES]);
  const startMovesThatAllowWin = removeDuplicates(parInfo.possibleSolutions.map((solution) => solution[0]));
  const probabilityToChooseCorrectStartMove = startMovesThatAllowWin.length / possibleStartMoves.length;

  if (probabilityToChooseCorrectStartMove < 0.5) {
    return Difficulty.MEDIUM;
  }

  if (containsSpecialMovesInBeginning) {
    return Difficulty.MEDIUM;
  }

  if (numberOfSolutions < 10 && containsSpecialMoves) {
    return Difficulty.MEDIUM;
  }

  return Difficulty.EASY;
}

function calculateParInner(gameState: GameState, options: ParOptions): ParInfoWithoutDifficulty {
  const previousMoves = gameState.moves;

  if (previousMoves.length === 0) {
    iterationCount = 1; // Reset iteration count for a new calculation
  } else {
    iterationCount++;
  }

  if (isWinConditionMet(gameState)) {
    return { par: 0, possibleSolutions: [previousMoves] }; // Already won, no moves needed
  }

  if (isMoveLimitExceeded(gameState) || previousMoves.length >= MAX_PAR) {
    return { par: FALLBACK_PAR, possibleSolutions: [previousMoves] };
  }

  let bestParInfo: ParInfoWithoutDifficulty = { par: FALLBACK_PAR, possibleSolutions: [] };

  for (const move of getPossibleMoves(gameState, [...ALL_TURN_MOVES])) {
    if (!isValidMove(gameState, move)) {
      continue; // Tool is still in recovery, skip this move
    }

    const copiedGameState = copyGameState(gameState);
    copiedGameState.moves = [...previousMoves, move];

    copiedGameState.currentPositions = deepCopyElementsMap(calculateNewPositions(copiedGameState, move));

    // Recursively calculate par for the next moves
    const parInfo = calculateParInner(copiedGameState, options);
    const potentialNewPar = parInfo.par + 1;
    bestParInfo.par = Math.min(potentialNewPar, bestParInfo.par);

    if (potentialNewPar < FALLBACK_PAR && (options.returnAllSolutions || potentialNewPar === bestParInfo.par)) {
      bestParInfo.possibleSolutions = [...bestParInfo.possibleSolutions, ...parInfo.possibleSolutions];
    } else if (potentialNewPar < FALLBACK_PAR) {
      bestParInfo.possibleSolutions = [...parInfo.possibleSolutions];
    }
  }

  if (previousMoves.length === 0) {
    console.info(`Par calculation completed after ${iterationCount} iterations.`);
  }

  return bestParInfo;
}

function getPossibleMoves(gameState: GameState, moves: TurnMove[]): TurnMove[] {
  return moves.filter((move) => isValidMove(gameState, move));
}
