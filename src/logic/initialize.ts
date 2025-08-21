import { getOnboardingData, OnboardingData } from "./onboarding";
import { globals } from "../globals";
import { shuffleArray } from "../utils/random-utils";
import { getEmptyFields } from "./checks";
import { ALL_CAT_IDS, Cat, getCat, PlacedCat } from "./data/cats";
import { CellPosition } from "./data/cell";
import { shouldIncludeCat } from "./config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "./data/field-size";
import { PlacedObject } from "./data/objects";
import { calculatePar, MAX_PAR, MIN_PAR } from "./par";

export function placeCatsInitially(fieldSize: FieldSize, placedObjects: PlacedObject[]): PlacedCat[] {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  let placedCats: PlacedCat[];

  if (onboardingData) {
    placedCats = applyPredefinedPositionsOfCats(onboardingData);
  } else {
    const time = performance.now();
    placedCats = randomlyApplyCatsOnBoard(fieldSize, ALL_CAT_IDS.map(getCat), placedObjects);
    console.info("Randomly applying cats took: ", Math.round(performance.now() - time) + "ms");
  }

  return placedCats;
}

export function initializeGameField() {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  globals.fieldSize = onboardingData ? onboardingData.field : DEFAULT_FIELD_SIZE;

  document.body.style.setProperty("--s-cnt", globals.fieldSize.width.toString());
}

function randomlyApplyCatsOnBoard(
  fieldSize: FieldSize,
  characters: Cat[],
  placedObjects: PlacedObject[],
  iteration: number = 0,
): PlacedCat[] {
  const placedCats: PlacedCat[] = [];
  const copyOfCharacters = [...characters];
  const emptyFields = getEmptyFields(fieldSize, [], placedObjects);
  const shuffledRequiredFields = shuffleArray(emptyFields).slice(0, copyOfCharacters.length);
  shuffledRequiredFields.forEach((cell: CellPosition) => {
    const cat = copyOfCharacters.pop();

    if (!cat) {
      return;
    }

    const { row, column } = cell;
    placedCats.push({ ...cat, row, column });
  });

  const parInfo = calculatePar(placedCats, placedObjects, []);

  if ((parInfo.par > MAX_PAR || parInfo.par < MIN_PAR) && iteration < 10) {
    console.info("not a good setup");

    return randomlyApplyCatsOnBoard(fieldSize, characters, placedObjects, iteration + 1);
  }

  if (iteration >= 10) {
    console.warn("Failed to find a good setup after 10 iterations, returning current setup");
  }

  return placedCats;
}

function applyPredefinedPositionsOfCats(onboardingData: OnboardingData): PlacedCat[] {
  const { cats } = onboardingData;

  return cats.filter(shouldIncludeCat);
}
