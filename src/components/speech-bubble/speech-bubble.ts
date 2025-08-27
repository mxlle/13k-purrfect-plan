import styles from "./speech-bubble.module.scss";
import { createElement } from "../../utils/html-utils";

export function createSpeechBubble(text?: string) {
  return createElement({ cssClass: [styles.bubble], text });
}

export function showSpeechBubble(element: HTMLElement, text?: string) {
  const bubble = createSpeechBubble(text);
  element.appendChild(bubble);
  setTimeout(() => bubble.classList.add(styles.show), 1);
}

export function removeSpeechBubble(element: HTMLElement) {
  for (const bubbleElement of element.getElementsByClassName(styles.bubble)) {
    bubbleElement.classList.remove(styles.show);
    bubbleElement.addEventListener("transitionend", () => bubbleElement.remove());
  }
}
