const hasClass = (node: Element, className: string) => node.classList.contains(className);
const firstParent = (e: TouchEvent | MouseEvent, cssClass: string): HTMLElement | undefined => {
  let touchList = (e as TouchEvent).touches;
  if (!touchList?.length) {
    touchList = (e as TouchEvent).changedTouches;
  }

  let el: any = touchList ? document.elementFromPoint(touchList[0].pageX, touchList[0].pageY) : e.target;
  while (el !== document) {
    if (el === null) return;
    if (hasClass(el, cssClass)) return el;
    el = el.parentNode;
  }
};

const getOverlayPosition = (e: any, element?: HTMLElement) => {
  e = e.touches?.[0] ?? e;
  const referenceElement = element ?? e.target;
  return {
    left: `${e.pageX - referenceElement.offsetWidth / 4}px`,
    top: `${e.pageY - referenceElement.offsetHeight / 4}px`,
  };
};

export default (
  rootEl: HTMLElement,
  dragClass: string,
  dropClass: string,
  createOverlay: (dragEl: HTMLElement) => HTMLElement,
  onDrop: (dragEl: HTMLElement, dropEl: HTMLElement, isTouch: boolean) => void,
  onDragCancel: (dragEl: HTMLElement) => void,
) => {
  let dragTimeout, isDragging, dragEl, overlayEl, dropEl;
  const innerRoot = rootEl;
  const outerRoot = document.body;

  const pointerdown = (e) => {
    dragTimeout = setTimeout(() => {
      dragTimeout = undefined;
      startDragging(e);
    }, 200);
  };

  const pointerup = (e) => {
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = undefined;
    }

    dropping(e);
  };

  const startDragging = (e) => {
    if (isDragging) {
      return;
    }

    if (overlayEl) {
      overlayEl.remove();
      overlayEl = undefined;
    }

    isDragging = 1;
    dragEl = firstParent(e, dragClass);
    overlayEl = dragEl && createOverlay(dragEl);
    if (overlayEl) {
      e.preventDefault();
      innerRoot.appendChild(overlayEl);
      overlayEl.classList.add("drag-overlay");
      Object.assign(overlayEl.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "9999",
        ...getOverlayPosition(e),
      });
    }
  };
  const pointermove = (e) => {
    if (isDragging && overlayEl) {
      e.preventDefault();
      Object.assign(overlayEl.style, getOverlayPosition(e, dragEl));
    }
  };
  const dropping = (e) => {
    isDragging = 0;
    if (overlayEl) {
      e.preventDefault();
      overlayEl.remove();
      overlayEl = undefined;
      dropEl = firstParent(e, dropClass);
      if (dropEl) {
        const isTouch = e.type === "touchend";
        onDrop(dragEl, dropEl, isTouch);
      } else {
        onDragCancel(dragEl);
      }
    }
  };
  innerRoot.addEventListener("mousedown", pointerdown);
  innerRoot.addEventListener("touchstart", pointerdown);
  outerRoot.addEventListener("mousemove", pointermove);
  outerRoot.addEventListener("touchmove", pointermove, { passive: false });
  outerRoot.addEventListener("mouseup", pointerup);
  outerRoot.addEventListener("touchend", pointerup);
};
