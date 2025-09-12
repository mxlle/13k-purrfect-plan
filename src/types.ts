import { defineEnum } from "./utils/enums";
import type { KittenId } from "./logic/data/catId";
import { MoveLimit } from "./logic/config/move-limit";

export type Direction = defineEnum<typeof Direction>;
export const Direction = defineEnum({
  UP: "u",
  DOWN: "d",
  LEFT: "l",
  RIGHT: "r",
});

export type Tool = defineEnum<typeof Tool>;
export const Tool = defineEnum({
  MEOW: "m",
  WAIT: "w",
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
  MOON: "🌙",
  TREE: "🌳",
  PUDDLE: "💧",
});
export type ConfigCategory = defineEnum<typeof ConfigCategory>;
export const ConfigCategory = defineEnum({
  KITTEN_BEHAVIOR: "Kitten Behavior",
  OBJECTS: "Objects",
  TOOLS: "Tools",
  RULES: "Rules",
});
export type ConfigItemId = KittenId | Tool | MoveLimit;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
export const Difficulty = Object.freeze({
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXTREME: 4,
});
