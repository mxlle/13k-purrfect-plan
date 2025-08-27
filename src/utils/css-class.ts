import { defineEnum } from "./enums";

export type CssClass = defineEnum<typeof CssClass>;
export const CssClass = defineEnum({
  TITLE: "global__title",
  PRM: "global__prm",
  CELL: "global__cell",
  CAT_BOX: "global__cat-box",
  OBJECT_BOX: "global__object-box",
  DARKNESS: "global__darkness",
  WON: "global__won",
  TOUCHING: "global__touching",
  ICON_BTN: "global__icon-btn",
  HIDDEN: "global__hidden",
});
