import { DEFAULT_FIELD_SIZE, FieldSize } from "./data/field-size";
import { getObject, isMoon, ObjectId, PlacedObject } from "./data/objects";
import { ALL_CAT_IDS, CAT_IDENTIFIER, CatId, getCat, PlacedCat } from "./data/cats";

interface GameSetup {
  fieldSize: FieldSize;
  placedObjects: PlacedObject[];
  placedCats: PlacedCat[];
}

export function serializeGame(gameSetup: GameSetup): string {
  const { placedObjects, placedCats } = gameSetup;

  const filteredObjects = placedObjects.filter((obj) => !isMoon(obj));
  const sortedCats = [...placedCats].sort((a, b) => a.id - b.id);

  // const serializedFieldSize = `${fieldSize.width}x${fieldSize.height}`;
  const serializedPlacedObjects = filteredObjects.map((obj) => `${obj.id}${obj.row}${obj.column}`).join("");
  const serializedPlacedCats = sortedCats.map((cat) => `${getCatIdentifier(cat.id)}${cat.row}${cat.column}`).join("");

  return `${serializedPlacedObjects}-${serializedPlacedCats}`;
}

function getCatIdentifier(catId: CatId): string {
  return CAT_IDENTIFIER[catId];
}

function getCatIdFromIdentifier(identifier: string): CatId {
  const catId = ALL_CAT_IDS.find((catId) => CAT_IDENTIFIER[catId] === identifier);
  if (catId === undefined) {
    throw new Error(`Invalid cat identifier: ${identifier}`);
  }

  return catId;
}

export function deserializeGame(serializedGame: string): GameSetup {
  console.debug("Deserializing game:", serializedGame);

  const [objectsPart, catsPart] = serializedGame.split("-");

  const placedObjects: PlacedObject[] = [{ ...getObject(ObjectId.MOON), row: 0, column: 0 }];
  const placedCats: PlacedCat[] = [];

  if (objectsPart) {
    for (let i = 0; i < objectsPart.length; i += 4) {
      const id = objectsPart.slice(i, i + 2) as ObjectId;
      const row = parseInt(objectsPart[i + 2], 10);
      const column = parseInt(objectsPart[i + 3], 10);
      const gameObject = getObject(id);
      placedObjects.push({ ...gameObject, row, column });
    }
  }

  if (catsPart) {
    for (let i = 0; i < catsPart.length; i += 4) {
      const identifier = catsPart.slice(i, i + 2);
      const row = parseInt(catsPart[i + 2], 10);
      const column = parseInt(catsPart[i + 3], 10);
      const catId = getCatIdFromIdentifier(identifier);
      const cat = getCat(catId);

      if (cat) {
        placedCats.push({ ...cat, row, column });
      } else {
        console.warn(`Cat with identifier ${identifier} not found.`);
      }
    }
  }

  return { fieldSize: DEFAULT_FIELD_SIZE, placedObjects, placedCats };
}
