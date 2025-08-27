import { defineEnum } from "../../utils/enums";

export type Constraint = defineEnum<typeof Constraint>;
export const Constraint = defineEnum({
  MOVE_LIMIT_SIMPLE: "Move Limit (Simple)",
  MOVE_LIMIT_STRICT: "Move Limit (Strict)",
});
