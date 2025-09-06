import { isTool, SpecialAction, Tool, TurnMove } from "../../types";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { getKittensOnCell, isMoveLimitExceeded, isWinConditionMet } from "../checks";
import { ALL_KITTEN_IDS, CatId } from "../data/catId";
import { updateAllPositions } from "../../components/game-field/game-field";
import { sleep } from "../../utils/promise-utils";
import { GameState } from "../data/game-elements";

import { kittenMeows, meow } from "../../components/cat-component/cat-component";
import { globals, isGameInProgress } from "../../globals";
import { removeAllSpeechBubbles, showSpeechBubble } from "../../components/speech-bubble/speech-bubble";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { pokiSdk } from "../../poki-integration";
import { isValidMove } from "./movement";
import { calculateNewPositions } from "./calculate-new-positions";

let isPerformingMove = false;

const MEOW_TIME = 1500;

export async function performMove(gameState: GameState, turnMove: TurnMove) {
  console.debug(`Make move: ${turnMove}`);

  if (isPerformingMove) {
    console.warn("Already performing a move, ignoring this one.");
    return;
  }

  if (!isGameInProgress()) {
    console.warn("Game is not in progress, ignoring this move.");
    return;
  }

  if (!isValidMove(gameState, turnMove)) {
    console.warn(`Invalid move: ${turnMove}`);
    return;
  }

  if (import.meta.env.POKI_ENABLED === "true" && gameState.moves.length === 0) {
    pokiSdk.gameplayStart();
  }

  isPerformingMove = true;

  try {
    removeAllSpeechBubbles();

    gameState.moves.push(turnMove);

    const toolStartPromise = isTool(turnMove) ? preToolAction(gameState, turnMove) : Promise.resolve();

    const kittensOnCellBefore = getKittensOnCell(gameState, gameState.currentPositions[CatId.MOTHER]);
    gameState.currentPositions = calculateNewPositions(gameState, turnMove);
    const kittensOnCellAfter = getKittensOnCell(gameState, gameState.currentPositions[CatId.MOTHER]);

    await toolStartPromise;

    globals.nextPositionsIfWait = calculateNewPositions(gameState, SpecialAction.WAIT);

    const isWon = isWinConditionMet(gameState);
    const isLost = isMoveLimitExceeded(gameState);

    updateAllPositions(gameState, globals.nextPositionsIfWait, isWon);

    const newKittensOnCell = kittensOnCellAfter.filter((kitten) => !kittensOnCellBefore.includes(kitten));
    !isWon && (await kittenMeows(newKittensOnCell));

    if (isWon || isLost) {
      await sleep(300); // to finish moving
      showSpeechBubble(
        gameState.representations[CatId.MOTHER].htmlElement,
        getTranslation(isWon ? TranslationKey.UNITED : TranslationKey.LOST),
      );
      pubSubService.publish(PubSubEvent.GAME_END, { isWon });
      isWon && (await kittenMeows(ALL_KITTEN_IDS, true));
    }
  } catch (error) {
    console.error("Error performing move:", error);
  }

  isPerformingMove = false;
}

async function preToolAction(gameState: GameState, tool: Tool) {
  switch (tool) {
    case Tool.MEOW:
      showSpeechBubble(gameState.representations[CatId.MOTHER].htmlElement, getTranslation(TranslationKey.MEOW), MEOW_TIME);

      await Promise.all([meow(CatId.MOTHER), sleep(300)]); // Wait for meow speech bubble to appear

      break;
  }
}
