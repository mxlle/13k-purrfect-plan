import { defineEnum } from "./enums";

export type CssClass = defineEnum<typeof CssClass>;
export const CssClass = defineEnum({
  PRIMARY: "global__primary",
  SECONDARY: "global__secondary",
  TERTIARY: "global__tertiary",
  CELL: "global__cell",
  CAT_BOX: "global__cat-box",
  OBJECT_BOX: "global__object-box",
  DARKNESS: "global__darkness",
  WON: "global__won",
  ICON_BTN: "global__icon-btn",
  HIDDEN: "global__hidden",
  OPACITY_HIDDEN: "global__opacity_hidden",
  RECORD_BUTTON: "global__record_button",
  EMOJI: "global__emoji",
  ONE_LINER: "global__one_liner",
});
