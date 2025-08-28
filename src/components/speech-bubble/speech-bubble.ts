import styles from "./speech-bubble.module.scss";
import { createElement } from "../../utils/html-utils";
export function createSpeechBubble() {
  return createElement({ cssClass: styles.bubble });
}
