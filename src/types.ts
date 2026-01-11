import { defineEnum } from "./utils/enums";
import type { KittenId } from "./logic/data/catId";
import type { MoveLimit } from "./logic/config/move-limit";

export type Direction = defineEnum<typeof Direction>;
export const Direction = defineEnum({
  UP: 4,
  DOWN: 5,
  LEFT: 6,
  RIGHT: 7,
});

export type Tool = defineEnum<typeof Tool>;
export const Tool = defineEnum({
  MEOW: 8,
  WAIT: 9,
});

type RecoveryTurnCount = number;

export const RECOVERY_TIME_MAP: Record<Tool, RecoveryTurnCount> = {
  [Tool.MEOW]: 3,
  [Tool.WAIT]: 0,
};

export type TurnMove = Direction | Tool;

export const ALL_DIRECTIONS: Direction[] = Object.values(Direction);
export const ALL_TOOLS: Tool[] = Object.values(Tool);

export function isDirection(move: unknown): move is Direction {
  return ALL_DIRECTIONS.includes(move as Direction);
}

export function isTool(move: unknown): move is Tool {
  return ALL_TOOLS.includes(move as Tool);
}

export const ALL_TURN_MOVES = [...ALL_DIRECTIONS, ...ALL_TOOLS] as const;

export type OnboardingStep = defineEnum<typeof OnboardingStep>;
export const OnboardingStep = defineEnum({
  INTRO: 0,
  INTERMEDIATE_OBJECTS: 1,
  LAST_SETUP: 2,
});
export type ObjectId = defineEnum<typeof ObjectId>;
export const ObjectId = defineEnum({
  MOON: 4,
  TREE: 5,
  PUDDLE: 6,
});

export type ConfigItemId = KittenId | Tool | MoveLimit;

export type Difficulty = defineEnum<typeof Difficulty>;
export const Difficulty = defineEnum({
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
});

export type ComponentDefinition<UpdateOptions = unknown, R = void> = [
  hostElement: HTMLElement,
  updateFunction?: (options?: UpdateOptions) => R,
];
