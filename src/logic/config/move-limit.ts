import { defineEnum } from "../../utils/enums";
import { CssClass } from "../../utils/css-class";

export type MoveLimit = defineEnum<typeof MoveLimit>;
export const MoveLimit = defineEnum({
  MOVE_LIMIT_SIMPLE: 4,
  MOVE_LIMIT_STRICT: 5,
});

export const moveLimitLabels = {
  [MoveLimit.MOVE_LIMIT_SIMPLE]: `<span class="${CssClass.EMOJI}">⏳🌜</span>`,
  [MoveLimit.MOVE_LIMIT_STRICT]: `<span class="${CssClass.EMOJI}">⏳</span>5!`,
};
