import { defineEnum } from "../../utils/enums";

export type MoveLimit = defineEnum<typeof MoveLimit>;
export const MoveLimit = defineEnum({
  MOVE_LIMIT_SIMPLE: "⏳🌜",
  MOVE_LIMIT_STRICT: "⏳5!",
});
