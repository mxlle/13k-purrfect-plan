import { createElement } from "../../utils/html-utils";

import styles from "./index.module.scss";

import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { globals } from "../../globals";

const EMPTY_STAR = "☆";
export const FULL_STAR = "★";
const zeroClass = styles.zero;
export const maxStars = 5;
let currentStars = maxStars;
let globalStars = 0;
let globalStarsElem;

export function createStarComponent(achievedStars) {
  const stars = createElement({
    cssClass: styles.stars,
  });

  for (let i = 0; i < maxStars; i++) {
    stars.appendChild(createElement({}));
  }
  updateStars(stars, achievedStars);

  return stars;
}

export function updateStars(stars, achievedStars) {
  stars.classList.toggle(zeroClass, achievedStars === 0);
  for (let i = 0; i < maxStars; i++) {
    stars.children[i].textContent = achievedStars > i ? FULL_STAR : EMPTY_STAR;
  }
}

export function getStarsForGameField() {
  const stars = createStarComponent(maxStars);

  pubSubService.subscribe(PubSubEvent.STARS_CHANGED, (gainedStars) => {
    console.log("Star update", gainedStars);
    currentStars = Math.max(Math.min(currentStars + gainedStars, maxStars), 0);
    updateStars(stars, currentStars);
    const starClass = gainedStars > 0 ? "new-star" : "lost-star";
    stars.classList.toggle(starClass, true);
    setTimeout(() => stars.classList.toggle(starClass, false), 300);
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    currentStars = maxStars;
    updateStars(stars, currentStars);
  });

  return stars;
}

export function createGlobalStarsComponent() {
  if (!globalStarsElem) {
    globalStarsElem = createElement({
      cssClass: styles.globalStars,
    });
    setCurrentGlobalStars();
  }

  return globalStarsElem;
}

export function createStarChartComponent() {
  const starChart = createElement();

  const notYetReachedNumbers = [];

  const starMap = getStarMap();
  for (let i = globals.minNum; i <= globals.maxNum; i++) {
    const achievedStars = starMap[i];

    const starContainer = createElement({
      cssClass: styles.starContainer,
    });
    starContainer.appendChild(createElement({ text: i }));
    starContainer.appendChild(createStarComponent(achievedStars ?? 0));

    if (achievedStars === undefined) {
      notYetReachedNumbers.push(starContainer);
    } else {
      starChart.appendChild(starContainer);
    }
  }

  for (const starContainer of notYetReachedNumbers) {
    starChart.appendChild(starContainer);
  }

  return starChart;
}

function getStarMapKey() {
  return `${LocalStorageKey.STAR_MAP}-${globals.minNum}-${globals.maxNum}`;
}

export function getStarMap() {
  const starMap = getLocalStorageItem(getStarMapKey());
  return starMap ? JSON.parse(starMap) : {};
}

export function updateStarMap() {
  const starMap = getStarMap();
  const currentStarValue = starMap[globals.x] ?? 0;
  if (currentStars > currentStarValue) {
    starMap[globals.x] = Math.min(currentStars, maxStars);
    setLocalStorageItem(getStarMapKey(), JSON.stringify(starMap));
    setCurrentGlobalStars();
    globalStarsElem.classList.toggle("new-star", true);
    setTimeout(() => globalStarsElem.classList.toggle("new-star", false), 1000);
  }
}

export function setCurrentGlobalStars() {
  const starMap = getStarMap();
  let tempStars = 0;
  for (let i = globals.minNum; i <= globals.maxNum; i++) {
    tempStars += starMap[i] ?? 0;
  }

  globalStars = tempStars;

  updateGlobalStarsElement();

  document.body.classList.toggle("has-stars", globalStars > 0);
}

function updateGlobalStarsElement() {
  const totalPossibleStars = (globals.maxNum - globals.minNum + 1) * maxStars;
  globalStarsElem.innerHTML = `⭐️ ${globalStars}/${totalPossibleStars} 🏆`;
}
