import { defineEnum } from "../../utils/enums";

export type Constraint = defineEnum<typeof Constraint>;
export const Constraint = defineEnum({
  MOVE_LIMIT_SIMPLE: "⏳5",
  // MOVE_LIMIT_STRICT: "⏳3-5!",
});

export function isConstraintId(id: unknown) {
  return Object.values(Constraint).includes(id as Constraint);
}
