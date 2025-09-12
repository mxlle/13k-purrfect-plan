import { defineEnum } from "../../utils/enums";

export type MoveLimit = defineEnum<typeof MoveLimit>;
export const MoveLimit = defineEnum({
  MOVE_LIMIT_SIMPLE: 4,
  MOVE_LIMIT_STRICT: 5,
});

export const moveLimitLabels = {
  [MoveLimit.MOVE_LIMIT_SIMPLE]: "⏳🌜",
  [MoveLimit.MOVE_LIMIT_STRICT]: "⏳5!",
};
