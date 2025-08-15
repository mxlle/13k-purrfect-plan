import { createButton, createElement } from "../../utils/html-utils";

import "./index.scss";
import { getTranslation, TranslationKey } from "../../translations/i18n";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";

let zIndexCounter = 50; // start at 50 to be above regular content

export interface Dialog {
  open: (openImmediately?: boolean) => Promise<boolean>;
  close: (isSubmit?: boolean) => void;
  toggleSubmitDisabled: (isDisabled: boolean) => void;
  recreateDialogContent: (newInnerElement: HTMLElement) => void;
  changeSubmitText: (newText: string) => void;
}

export function createDialog(innerElement: HTMLElement, submitButtonText?: string): Dialog {
  const dialog = createElement({
    cssClass: "dialog",
    onClick: (event) => event.stopPropagation(), // TODO - why?
  });

  const dialogContent = createElement({ cssClass: "content" });
  dialogContent.appendChild(innerElement);
  dialog.appendChild(dialogContent);

  function closeDialog(confirm: boolean) {
    zIndexCounter--;
    dialog.classList.remove("open");
    pubSubService.publish(PubSubEvent.CLOSE_DIALOG, confirm);
  }

  let buttons, cancelButton, submitButton;
  if (submitButtonText !== undefined) {
    buttons = createElement({ cssClass: "btns" });

    cancelButton = createButton({
      text: getTranslation(TranslationKey.BACK),
      onClick: () => closeDialog(false),
    });
    buttons.appendChild(cancelButton);
    submitButton = createButton({
      text: submitButtonText,
      onClick: () => closeDialog(true),
    });
    submitButton.classList.add("prm");
    buttons.appendChild(submitButton);
    dialog.appendChild(buttons);
  }

  const closeBtn = createButton({ text: "X", onClick: () => closeDialog(false), iconBtn: true });

  dialog.appendChild(closeBtn);

  document.body.appendChild(dialog);

  return {
    open: (openImmediately) => {
      //document.body.appendChild(dialog);
      zIndexCounter++;
      dialog.style.zIndex = zIndexCounter.toString();
      if (openImmediately) {
        dialog.classList.add("open");
      } else {
        setTimeout(() => dialog.classList.add("open"), 0);
      }

      dialogContent.classList.toggle("ovrflw", dialogContent.scrollHeight > dialogContent.clientHeight);

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
  };
}
