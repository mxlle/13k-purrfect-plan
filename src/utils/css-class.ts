import { defineEnum } from "./enums";

export type CssClass = defineEnum<typeof CssClass>;
export const CssClass = defineEnum({
  TITLE: "global__title",
  PRIMARY: "global__primary",
  SECONDARY: "global__secondary",
  CELL: "global__cell",
  CAT_BOX: "global__cat-box",
  OBJECT_BOX: "global__object-box",
  DARKNESS: "global__darkness",
  WON: "global__won",
  LOST: "global__lost",
  TOUCHING: "global__touching",
  ICON_BTN: "global__icon-btn",
  HIDDEN: "global__hidden",
  OPACITY_HIDDEN: "global__opacity_hidden",
  MEOW: "global__meow",
});
