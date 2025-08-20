import { CellPosition } from "./cell";
import { createObjectElement } from "../../components/object-component/object-component";

export enum ObjectId {
  MOON = "🌙",
  TREE = "🌳",
  PUDDLE = "💧",
}

export interface BaseObject {
  id: ObjectId;
}

interface ObjectWithElement extends BaseObject {
  objectElement: HTMLElement;
}

export interface PlacedObject extends ObjectWithElement, CellPosition {}

export const OBJECTS: Record<ObjectId, ObjectWithElement> = {
  [ObjectId.MOON]: {
    id: ObjectId.MOON,
    objectElement: createObjectElement(ObjectId.MOON),
  },
  [ObjectId.TREE]: {
    id: ObjectId.TREE,
    objectElement: createObjectElement(ObjectId.TREE),
  },
  [ObjectId.PUDDLE]: {
    id: ObjectId.PUDDLE,
    objectElement: createObjectElement(ObjectId.PUDDLE),
  },
};

export function getObject(id: ObjectId): ObjectWithElement {
  return OBJECTS[id];
}

export function isMoon(object: BaseObject): boolean {
  return object.id === ObjectId.MOON;
}

export function isTree(object: BaseObject): boolean {
  return object.id === ObjectId.TREE;
}

export function isPuddle(object: BaseObject): boolean {
  return object.id === ObjectId.PUDDLE;
}
