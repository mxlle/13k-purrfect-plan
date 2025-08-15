import { Cell, PlacedCat } from "../types";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";

export function newGame() {
  pubSubService.publish(PubSubEvent.NEW_GAME);
}

export function moveCat(cat: PlacedCat, toCell: Cell) {
  cat.column = toCell.column;
  cat.row = toCell.row;
}
