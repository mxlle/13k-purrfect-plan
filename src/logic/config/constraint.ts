import { defineEnum } from "../../utils/enums";

export type Constraint = defineEnum<typeof Constraint>;
export const Constraint = defineEnum({
  MOVE_LIMIT_SIMPLE: "⏳5",
  MOVE_LIMIT_STRICT: "⏳3-5!",
});
