import { defineEnum } from "./utils/enums";

export interface Settings {
  minAmount: number;
  maxAmount: number;
}

export type Direction = defineEnum<typeof Direction>;
export const Direction = defineEnum({
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
});

export type Tool = defineEnum<typeof Tool>;
export const Tool = defineEnum({
  MEOW: "meow",
});

type RecoveryTurnCount = number;

export const RECOVERY_TIME_MAP: Record<Tool, RecoveryTurnCount> = {
  [Tool.MEOW]: 2,
};

export type SpecialAction = defineEnum<typeof SpecialAction>;
export const SpecialAction = defineEnum({
  WAIT: "wait",
});

export type TurnMove = Direction | Tool | SpecialAction;

export function isDirection(move: TurnMove): move is Direction {
  return Object.values(Direction).includes(move as Direction);
}

export function isTool(move: TurnMove): move is Tool {
  return Object.values(Tool).includes(move as Tool);
}

export function isSpecialAction(move: TurnMove): move is SpecialAction {
  return Object.values(SpecialAction).includes(move as SpecialAction);
}

export const ALL_TURN_MOVES = [...Object.values(Direction), ...Object.values(Tool)] as const;
