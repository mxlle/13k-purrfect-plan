import { createElement } from "../../../utils/html-utils";
import styles from "./component.module.scss";
import { ComponentDefinition } from "../../../types";

// Example usage:
// const instance = MyComponent();
// const toggleActive = instance[1];
// toggleActive(true);

export function MyComponentWithUpdater(children: (Node | string)[] = []): ComponentDefinition<boolean> {
  const childElement = createElement({ text: "Hello world!", cssClass: styles.child });
  const hostElement = createElement({ cssClass: styles.host }, [childElement, ...children]);

  const updateComponent = (isActive: boolean) => {
    childElement.classList.toggle(styles.active, isActive);
  };

  return [hostElement, updateComponent];
}

export function MySimpleComponent(children: (Node | string)[] = []): HTMLElement {
  const childElement = createElement({ text: "Hello world!", cssClass: styles.child });
  const hostElement = createElement({ cssClass: styles.host }, [childElement, ...children]);

  return hostElement;
}
