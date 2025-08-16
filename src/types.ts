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
