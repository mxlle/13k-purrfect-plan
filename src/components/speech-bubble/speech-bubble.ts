import styles from "./speech-bubble.module.scss";
import { createElement } from "../../utils/html-utils";

let currentBubbles: Set<HTMLElement> = new Set();

export function createSpeechBubble(text?: string) {
  return createElement({ cssClass: [styles.bubble], text });
}

export function showSpeechBubble(element: HTMLElement, text: string, hideAfterMs?: number) {
  const bubble = createSpeechBubble(text);
  currentBubbles.add(bubble);
  const bubbleRect = element.getBoundingClientRect();
  bubble.style.left = `${bubbleRect.left + bubbleRect.width / 2}px`;
  bubble.style.top = `${bubbleRect.top - bubble.offsetHeight}px`;
  document.body.appendChild(bubble);
  setTimeout(() => bubble.classList.add(styles.show), 1);

  if (hideAfterMs) {
    setTimeout(() => removeSpeechBubble(bubble), hideAfterMs);
  }
}

export function removeAllSpeechBubbles() {
  for (const bubbleElement of currentBubbles) {
    removeSpeechBubble(bubbleElement as HTMLElement);
  }
}

export function removeSpeechBubble(bubbleElement: HTMLElement) {
  currentBubbles.delete(bubbleElement);
  bubbleElement.classList.remove(styles.show);
  bubbleElement.addEventListener("transitionend", () => {
    bubbleElement.remove();
  });
}
