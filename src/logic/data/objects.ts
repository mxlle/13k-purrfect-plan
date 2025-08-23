import { CellPosition } from "./cell";
import { createObjectElement } from "../../components/object-component/object-component";

export enum ObjectId {
  MOON = "🌙",
  TREE = "🌳",
  PUDDLE = "💧",
}

export const ALL_OBJECT_IDS: ObjectId[] = [ObjectId.MOON, ObjectId.TREE, ObjectId.PUDDLE];

export const DEFAULT_MOON_POSITION: CellPosition = { row: 0, column: 0 };

const OBJECT_ELEMENTS: Record<ObjectId, HTMLElement> = {
  [ObjectId.MOON]: createObjectElement(ObjectId.MOON),
  [ObjectId.TREE]: createObjectElement(ObjectId.TREE),
  [ObjectId.PUDDLE]: createObjectElement(ObjectId.PUDDLE),
};

export function isObjectId(value: any): value is ObjectId {
  return ALL_OBJECT_IDS.includes(value);
}

export function getObjectElement(id: ObjectId): HTMLElement {
  return OBJECT_ELEMENTS[id];
}
