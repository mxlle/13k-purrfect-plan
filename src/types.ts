import { defineEnum } from "./utils/enums";
import { styles as arrowStyles } from "./components/arrow-component/arrow-component";

export interface Settings {
  minAmount: number;
  maxAmount: number;
}

export type Direction = defineEnum<typeof Direction>;
export const Direction = defineEnum({
  UP: arrowStyles.up,
  DOWN: arrowStyles.down,
  LEFT: arrowStyles.left,
  RIGHT: arrowStyles.right,
});

export type Tool = defineEnum<typeof Tool>;
export const Tool = defineEnum({
  MEOW: "meow",
});

type RecoveryTurnCount = number;

export const RECOVERY_TIME_MAP: Record<Tool, RecoveryTurnCount> = {
  [Tool.MEOW]: 2,
};

export type TurnMove = Direction | Tool;

export function isTool(move: TurnMove): move is Tool {
  return Object.values(Tool).includes(move as Tool);
}

export const ALL_TURN_MOVES = [...Object.values(Direction), ...Object.values(Tool)] as const;
