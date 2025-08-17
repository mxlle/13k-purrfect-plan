import { CssClass } from "./utils/css-class";

export interface GameMetaData {
  minMoves: number;
  maxMoves: number;
}

export interface Settings {
  minAmount: number;
  maxAmount: number;
}

export enum Direction {
  UP = CssClass.UP,
  DOWN = CssClass.DOWN,
  LEFT = CssClass.LEFT,
  RIGHT = CssClass.RIGHT,
}

export enum Tool {
  MEOW = "meow",
}

type RecoveryTurnCount = number;

export const RECOVERY_TIME_MAP: Record<Tool, RecoveryTurnCount> = {
  [Tool.MEOW]: 2,
};

export type TurnMove = Direction | Tool;

export function isTool(move: TurnMove): move is Tool {
  return Object.values(Tool).includes(move as Tool);
}
