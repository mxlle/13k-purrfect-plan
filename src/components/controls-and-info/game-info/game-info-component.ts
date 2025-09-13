import { createButton, createElement } from "../../../utils/html-utils";
import styles from "./game-info-component.module.scss";
import controlStyles from "../controls/controls-component.module.scss";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { CssClass } from "../../../utils/css-class";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { globals } from "../../../globals";
import { hasMoveLimit, showMovesInfo } from "../../../logic/config/config";
import { getParFromGameState } from "../../../logic/data/game-elements";
import { FALLBACK_PAR } from "../../../logic/par";
import { getDifficultyRepresentation } from "../../../logic/difficulty";
import { Difficulty } from "../../../types";

const turnMovesContainer: HTMLElement = createElement({ cssClass: styles.movesContainer });
const turnMovesComponent: HTMLElement = createElement({ cssClass: styles.moves });
const difficultyComponent: HTMLElement = createElement({ cssClass: styles.difficultyBox });
const retryInfo: HTMLElement = createElement({ cssClass: styles.retryInfo });
let redoButton: HTMLElement = createButton({
  text: getTranslation(TranslationKey.RESTART_GAME),
  cssClass: [CssClass.OPACITY_HIDDEN, CssClass.TERTIARY],
  onClick: () => {
    pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: true });
  },
});

export function getGameInfoComponent(): HTMLElement {
  turnMovesContainer.append(turnMovesComponent, difficultyComponent, retryInfo, redoButton);
  return turnMovesContainer;
}

export function toggleDoOverButtonVisibility(shouldShow: boolean) {
  redoButton.classList.toggle(CssClass.OPACITY_HIDDEN, !shouldShow);
  redoButton.classList.toggle(controlStyles.onboardingHighlight, shouldShow);

  if (shouldShow) {
    redoButton.focus();
  }
}

export function hideRetryInfo() {
  retryInfo.classList.toggle(CssClass.HIDDEN, true);
}

export function updateGameInfoComponent(isReset: boolean = false) {
  const showMoves = globals.gameState && showMovesInfo();
  const showMoveLimit = globals.gameState && hasMoveLimit();

  // console.debug("updateTurnMovesComponent", { showMoves, showMoveLimit, isReset, moves: globals.gameState?.moves });

  turnMovesContainer.classList.toggle(CssClass.HIDDEN, !showMoves);
  const par = getParFromGameState(globals.gameState);
  const parString = par && showMoveLimit ? ` / ${par < FALLBACK_PAR && !isReset ? par : "?"}` : "";
  turnMovesComponent.innerHTML = `${getTranslation(TranslationKey.MOVES)}: ${isReset ? 0 : (globals.gameState?.moves.length ?? 0)}${parString}`;

  const difficulty = globals.gameState?.setup.difficulty;
  difficultyComponent.classList.toggle(CssClass.HIDDEN, !showMoveLimit || !difficulty);
  difficultyComponent.innerHTML = `${getTranslation(TranslationKey.DIFFICULTY)}: `;
  difficultyComponent.append(
    isReset ? "?" : createElement({ cssClass: difficultyStyleMap[difficulty], text: getDifficultyRepresentation(difficulty) }),
  );

  retryInfo.classList.toggle(CssClass.HIDDEN, globals.failedAttempts === 0);
  retryInfo.innerHTML = `${getTranslation(TranslationKey.RETRIES)}: ${Array.from({ length: globals.failedAttempts }, () => "I").join("")}`;
}

const difficultyStyleMap: Record<Difficulty, string> = {
  [Difficulty.EASY]: styles.easy,
  [Difficulty.MEDIUM]: styles.medium,
  [Difficulty.HARD]: styles.hard,
};
