import { createButton, createElement } from "../../../utils/html-utils";

import styles from "./dialog.module.scss";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { CssClass } from "../../../utils/css-class";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { sleep } from "../../../utils/promise-utils";

export interface Dialog {
  open: (openImmediately?: boolean) => Promise<boolean>;
  close: (isSubmit?: boolean) => void;
  submitButton: HTMLButtonElement;
  destroy: () => void;
}

export function createDialog(innerElement: HTMLElement): Dialog {
  const dialog = createElement({
    cssClass: styles.dialog,
    onClick: (event) => event.stopPropagation(), // TODO - why?
  });

  const dialogContent = createElement({ cssClass: styles.content }, [innerElement]);

  function closeDialog(confirm: boolean) {
    dialog.classList.remove(styles.open);
    pubSubService.publish(PubSubEvent.CLOSE_DIALOG, confirm);
  }

  const submitButton = createButton({
    text: getTranslation(TranslationKey.CONTINUE),
    cssClass: CssClass.PRIMARY,
    onClick: () => closeDialog(true),
  });

  dialog.append(dialogContent, createElement({ cssClass: styles.btns }, [submitButton]));

  document.body.appendChild(dialog);

  return {
    open: () => {
      sleep(0).then(() => dialog.classList.add(styles.open));
      dialogContent.classList.toggle(styles.overflow, dialogContent.scrollHeight > dialogContent.clientHeight);

      return new Promise((resolve, _reject) => {
        pubSubService.subscribe(PubSubEvent.CLOSE_DIALOG, resolve);
      });
    },
    close: (isSubmit: boolean) => {
      closeDialog(isSubmit);
    },
    submitButton,
    destroy: () => {
      dialog.remove();
    },
  };
}
