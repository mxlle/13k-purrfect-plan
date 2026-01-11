import { createElement } from "../../../utils/html-utils";
import styles from "./header.module.scss";

export function HeaderComponent(title: string, endElements: (Node | string)[] = []): HTMLElement {
  const hostElement = createElement({ cssClass: styles.host }, [
    createElement({ cssClass: styles.title }, [title]),
    createElement({ cssClass: styles.endElements }, endElements),
  ]);

  return hostElement;
}
