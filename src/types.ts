import { defineEnum } from "./utils/enums";
import type { KittenId } from "./logic/data/catId";
import { MoveLimit } from "./logic/config/move-limit";

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

export function isTool(move: unknown): move is Tool {
  return Object.values(Tool).includes(move as Tool);
}

export function isSpecialAction(move: TurnMove): move is SpecialAction {
  return Object.values(SpecialAction).includes(move as SpecialAction);
}

export const ALL_TURN_MOVES = [...Object.values(Direction), ...Object.values(Tool)] as const;

export type OnboardingStep = defineEnum<typeof OnboardingStep>;
export const OnboardingStep = defineEnum({
  INTRO: 0,
  INTRO_SECOND_CAT: 1,
  INTERMEDIATE_OBJECTS: 2,
  LAST_SETUP: 3,
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
  CONSTRAINTS: "Constraints",
});
export type ConfigItemId = KittenId | ObjectId | Tool | MoveLimit;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
export const Difficulty = Object.freeze({
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXTREME: 4,
});
