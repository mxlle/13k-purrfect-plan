import { defineEnum } from "../../utils/enums";
import { ConfigItemId } from "./config";

export type MoveLimit = defineEnum<typeof MoveLimit>;
export const MoveLimit = defineEnum({
  MOVE_LIMIT_NONE: "-",
  MOVE_LIMIT_SIMPLE: "⏳🌜",
  MOVE_LIMIT_STRICT: "⏳5!",
});

export function isMoveLimit(id: unknown) {
  return Object.values(MoveLimit).includes(id as MoveLimit);
}

export function getHighestMoveLimit(knownConfigItems: ConfigItemId[]): MoveLimit {
  const moveLimits = knownConfigItems.filter(isMoveLimit);
  if (moveLimits.includes(MoveLimit.MOVE_LIMIT_STRICT)) {
    return MoveLimit.MOVE_LIMIT_STRICT;
  }
  if (moveLimits.includes(MoveLimit.MOVE_LIMIT_SIMPLE)) {
    return MoveLimit.MOVE_LIMIT_SIMPLE;
  }
  return MoveLimit.MOVE_LIMIT_NONE;
}
