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

export type TurnMove = Direction | Tool;

export function isTool(move: TurnMove): move is Tool {
  return Object.values(Tool).includes(move as Tool);
}
