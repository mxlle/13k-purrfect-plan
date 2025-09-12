import { createButton, createElement } from "../../utils/html-utils";

import styles from "./dialog.module.scss";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { CssClass } from "../../utils/css-class";

let zIndexCounter = 50; // start at 50 to be above regular content

export interface Dialog {
  open: (openImmediately?: boolean) => Promise<boolean>;
  close: (isSubmit?: boolean) => void;
  toggleSubmitDisabled: (isDisabled: boolean) => void;
  recreateDialogContent: (newInnerElement: HTMLElement) => void;
  changeSubmitText: (newText: string) => void;
  destroy: () => void;
}

export interface DialogOptions {
  submitButtonText?: string;
  cancelButtonText?: string;
  showCloseButton?: boolean;
}

export function createDialog(innerElement: HTMLElement, options: DialogOptions): Dialog {
  const dialog = createElement({
    cssClass: styles.dialog,
    onClick: (event) => event.stopPropagation(), // TODO - why?
  });

  const dialogContent = createElement({ cssClass: styles.content });
  dialogContent.appendChild(innerElement);
  dialog.appendChild(dialogContent);

  function closeDialog(confirm: boolean) {
    zIndexCounter--;
    dialog.classList.remove(styles.open);
    pubSubService.publish(PubSubEvent.CLOSE_DIALOG, confirm);
  }

  let buttons, cancelButton, submitButton;
  if (options.submitButtonText !== undefined) {
    buttons = createElement({ cssClass: styles.btns });

    if (options.cancelButtonText !== undefined) {
      cancelButton = createButton({
        text: options.cancelButtonText,
        onClick: () => closeDialog(false),
      });
      buttons.appendChild(cancelButton);
    }

    submitButton = createButton({
      text: options.submitButtonText,
      cssClass: CssClass.PRIMARY,
      onClick: () => closeDialog(true),
    });
    buttons.appendChild(submitButton);
    dialog.appendChild(buttons);
  }

  if (options.showCloseButton !== false) {
    const closeBtn = createButton({ text: "X", onClick: () => closeDialog(false), cssClass: CssClass.ICON_BTN });

    dialog.appendChild(closeBtn);
  }

  document.body.appendChild(dialog);

  return {
    open: (openImmediately) => {
      //document.body.appendChild(dialog);
      zIndexCounter++;
      dialog.style.zIndex = zIndexCounter.toString();
      if (openImmediately) {
        dialog.classList.add(styles.open);
      } else {
        setTimeout(() => dialog.classList.add(styles.open), 0);
      }

      dialogContent.classList.toggle(styles.ovrflw, dialogContent.scrollHeight > dialogContent.clientHeight);

      dialogContent.scrollTop = 0;

      return new Promise((resolve, _reject) => {
        pubSubService.subscribe(PubSubEvent.CLOSE_DIALOG, resolve);
      });
    },
    close: (isSubmit: boolean) => {
      closeDialog(isSubmit);
    },
    toggleSubmitDisabled: (isDisabled) => {
      if (submitButton) submitButton.disabled = isDisabled;
    },
    recreateDialogContent: (newInnerElement) => {
      dialogContent.innerHTML = "";
      dialogContent.appendChild(newInnerElement);
    },
    changeSubmitText: (newText: string) => {
      if (submitButton) submitButton.innerText = newText;
    },
    destroy: () => {
      dialog.remove();
    },
  };
}
