import { CellPosition } from "./cell";
import { createObjectElement } from "../../components/object-component/object-component";
import { ObjectId } from "../../types";

export const ALL_OBJECT_IDS: ObjectId[] = Object.values(ObjectId);

export const DEFAULT_MOON_POSITION: CellPosition = { row: 0, column: 0 };

export function isObjectId(value: any): value is ObjectId {
  return ALL_OBJECT_IDS.includes(value);
}

export function isMoon(id: any): boolean {
  return id === ObjectId.MOON;
}

const OBJECT_ELEMENTS: Partial<Record<ObjectId, HTMLElement>> = {};
export function getObjectElement(id: ObjectId): HTMLElement {
  return (OBJECT_ELEMENTS[id] ??= createObjectElement(id));
}
