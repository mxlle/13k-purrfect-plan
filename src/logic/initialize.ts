import { getOnboardingData, OnboardingData } from "./onboarding";
import { globals } from "../globals";
import { getRandomIntFromInterval, shuffleArray } from "../utils/random-utils";
import { getAllCellPositions, getEmptyFields } from "./checks";
import { ALL_CAT_IDS, Cat, getCat, PlacedCat } from "./data/cats";
import { CellPosition } from "./data/cell";
import { shouldIncludeCat } from "./config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "./data/field-size";
import { PlacedObject } from "./data/objects";

export function placeCatsInitially(fieldSize: FieldSize): PlacedCat[] {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  let placedCats: PlacedCat[];

  if (onboardingData) {
    placedCats = applyPredefinedPositionsOfCats(onboardingData);
  } else {
    const charactersForGame = generateCatsForGame(fieldSize);
    placedCats = randomlyApplyCharactersOnBoard(fieldSize, charactersForGame);

    //const time = performance.now();
    const par = 42;
    // const par = calculatePar(gameFieldData, [...placedCats]);
    // console.info("PAR CALCULATION TOOK", performance.now() - time);
    console.info("FINAL PAR", par);

    globals.metaData = {
      minMoves: par,
      maxMoves: charactersForGame.length,
    };
  }

  return placedCats;
}

export function initializeGameField() {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  globals.fieldSize = onboardingData ? onboardingData.field : DEFAULT_FIELD_SIZE;

  document.body.style.setProperty("--s-cnt", globals.fieldSize.width.toString());
}

function generateCatsForGame(fieldSize: FieldSize): Cat[] {
  const placedCats: PlacedCat[] = [];
  const { minAmount, maxAmount } = globals.settings;
  const amount = getRandomIntFromInterval(minAmount, maxAmount);
  const characters: Cat[] = [];

  for (let catId of ALL_CAT_IDS.filter(shouldIncludeCat)) {
    const newCat = getCat(catId);
    const field = findValidField(fieldSize, placedCats, [], newCat);

    if (field) {
      characters.push(newCat);
      const { row, column } = field;
      placedCats.push({ ...newCat, row, column });
    }

    if (characters.length >= amount) {
      break;
    }
  }

  return characters;
}

export function findValidField(
  fieldSize: FieldSize,
  placedCats: PlacedCat[],
  placedObjects: PlacedObject[],
  _cat: Cat,
): CellPosition | undefined {
  const emptyFields = getEmptyFields(fieldSize, placedCats, placedObjects);

  return emptyFields[0];
}

function randomlyApplyCharactersOnBoard(fieldSize: FieldSize, characters: Cat[], iteration: number = 0): PlacedCat[] {
  const placedCats: PlacedCat[] = [];
  const copyOfCharacters = [...characters];
  const allFields = getAllCellPositions(fieldSize);
  const shuffledRequiredFields = shuffleArray(allFields).slice(0, copyOfCharacters.length);
  shuffledRequiredFields.forEach((cell: CellPosition) => {
    const cat = copyOfCharacters.pop();

    if (!cat) {
      return;
    }

    const { row, column } = cell;
    placedCats.push({ ...cat, row, column });
  });

  const shouldReshuffle = false;

  if (shouldReshuffle) {
    console.info("not a good setup");

    return randomlyApplyCharactersOnBoard(fieldSize, characters, iteration + 1);
  }

  return placedCats;
}

function applyPredefinedPositionsOfCats(onboardingData: OnboardingData): PlacedCat[] {
  const { cats } = onboardingData;

  return cats.filter(shouldIncludeCat);
}
