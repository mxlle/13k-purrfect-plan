import { BaseCat, Cat, Cell, CellType, GameFieldData, getInventory, PlacedCat } from "../types";
import { getOnboardingData, OnboardingData } from "./onboarding";
import { globals } from "../globals";
import { getRandomIntFromInterval, shuffleArray } from "../utils/random-utils";
import { getEmptyFields } from "./checks";
import { baseField } from "./base-field";
import { createCatElement } from "../components/game-field/cell-component";

export function placeCatsInitially(gameFieldData: GameFieldData): PlacedCat[] {
  let onboardingData: OnboardingData | undefined = getOnboardingData();

  let placedCats: PlacedCat[];

  if (onboardingData) {
    placedCats = applyPredefinedPositionsOfCharacters(onboardingData);
  } else {
    const charactersForGame = generateCatsForGame(gameFieldData);
    placedCats = randomlyApplyCharactersOnBoard(gameFieldData, charactersForGame);

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

export function getGameFieldData(): GameFieldData {
  let field = baseField;
  let onboardingData: OnboardingData | undefined = getOnboardingData();
  let tableHeight = 8;

  if (onboardingData) {
    field = onboardingData.field;
  }

  document.body.style.setProperty("--s-cnt", field.length.toString());
  document.body.style.setProperty("--table-height", tableHeight.toString());

  if (tableHeight % 2 === 0) {
    const topValue = (tableHeight / 2 - 1) * -100;
    document.body.style.setProperty("--table-top", topValue.toString() + "%");
  }

  const gameField: GameFieldData = [];
  for (let row = 0; row < field.length; row++) {
    const baseRow = field[row];
    const rowArray: Cell[] = [];
    for (let column = 0; column < baseRow.length; column++) {
      const baseCell = baseRow[column];

      rowArray.push(getGameFieldObject(baseCell, row, column));
    }
    gameField.push(rowArray);
  }

  return gameField;
}

function getGameFieldObject(type: CellType, row: number, column: number): Cell {
  const obj: Cell = {
    type,
    row,
    column,
  };

  return obj;
}

function generateCatsForGame(gameField: GameFieldData): Cat[] {
  const motherCat = globals.motherCat;
  const placedCats: PlacedCat[] = [motherCat];
  const { minAmount, maxAmount } = globals.settings;
  const amount = getRandomIntFromInterval(minAmount, maxAmount);
  const characters: Cat[] = [motherCat];

  while (characters.length < amount) {
    const wasMotherCreated = characters.some((cat) => cat.isMother);
    const newCat = generateCat(characters.length, !wasMotherCreated);
    const field = findValidField(gameField, placedCats, newCat);

    if (field) {
      characters.push(newCat);
      const { row, column } = field;
      placedCats.push({ ...newCat, row, column });
    }
  }

  return characters;
}

export function findValidField(gameFieldData: GameFieldData, placedCats: PlacedCat[], _cat: Cat): Cell | undefined {
  const emptyChairs = getEmptyFields(gameFieldData, placedCats);

  return emptyChairs[0];
}

function generateCat(id: number, isMother: boolean): Cat {
  const name = "🐈‍⬛";

  const baseCat: BaseCat = {
    id,
    name,
    size: isMother ? 3 : 1,
    awake: true,
    isMother,
  };

  return {
    ...baseCat,
    catElement: createCatElement(baseCat),
    inventory: getInventory(isMother ? 13 : baseCat.size),
  };
}

function randomlyApplyCharactersOnBoard(gameFieldData: GameFieldData, characters: Cat[], iteration: number = 0): PlacedCat[] {
  const placedCats: PlacedCat[] = [];
  const copyOfCharacters = [...characters];
  const allFields = gameFieldData.flat();
  const shuffledRequiredFields = shuffleArray(allFields).slice(0, copyOfCharacters.length);
  shuffledRequiredFields.forEach((cell: Cell) => {
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

    return randomlyApplyCharactersOnBoard(gameFieldData, characters, iteration + 1);
  }

  return placedCats;
}

function applyPredefinedPositionsOfCharacters(onboardingData: OnboardingData): PlacedCat[] {
  const { characters } = onboardingData;

  return characters.map((cat): PlacedCat => {
    return {
      ...cat,
      catElement: createCatElement(cat),
      inventory: getInventory(cat.size),
    };
  });
}
