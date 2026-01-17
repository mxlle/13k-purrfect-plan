export function addCanvasToBody() {
  const canvas = createElement({
    tag: "canvas",
    onClick: function (e) {
      this;
    },
  });
  document.body.appendChild(canvas);
  return canvas;
}

type HTMLTagName = keyof HTMLElementTagNameMap | keyof HTMLElementDeprecatedTagNameMap | string;
type ElementByTag<TagName extends HTMLTagName> = TagName extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[TagName] : HTMLElement;

interface CreateElementOptions<TagName extends HTMLTagName = HTMLTagName> {
  tag?: TagName;
  cssClass?: string | string[];
  text?: string;
  // children?: (Node | string | CreateElementOptions)[];
  html?: string;
  onClick?: (this: ElementByTag<TagName>, evt: MouseEvent & { target: ElementByTag<TagName> }) => void;
}
export function createElement<TagName extends HTMLTagName = "div">(
  { tag, cssClass, text, html, onClick }: CreateElementOptions<TagName> = {},
  children: (Node | string)[] = [],
) {
  const elem = document.createElement(tag || "div") as ElementByTag<TagName>;
  if (cssClass) {
    if (!Array.isArray(cssClass)) cssClass = cssClass.split(" ");
    elem.classList.add(...cssClass.filter(Boolean));
  }
  for (let child of children) {
    if (child) elem.append(child);
  }
  if (html) elem.innerHTML += html;
  if (text) elem.append(text);
  if (onClick) elem.addEventListener("click", onClick as EventListener);
  return elem;
}

export function createElements<TagName extends HTMLTagName = "div">(
  options: CreateElementOptions<TagName>,
  amount: number,
  childCallback?: (index: number) => (Node | string)[],
) {
  const elements: ElementByTag<TagName>[] = [];
  for (let i = 0; i < amount; i++) {
    elements.push(createElement(options, childCallback ? childCallback(i) : []));
  }
  return elements;
}

export function createButton(props: Omit<CreateElementOptions<"button">, "tag">, children: (Node | string)[] = []) {
  return createElement({ tag: "button", ...props }, children);
}

export function addBodyClasses(...classes: string[]) {
  document.body.classList.add(...classes);
}

export function removeBodyClasses(...classes: string[]) {
  document.body.classList.remove(...classes);
}

export function setBodyStyleProperty(prop: string, value: string | null) {
  document.body.style.setProperty(prop, value);
}

export function resetTransform(element: HTMLElement) {
  element.style.transform = "";
}

export function setElementToWindowSize(element) {
  element.width = window.innerWidth;
  element.height = window.innerHeight;
}

export function getWidthHeightScale(baseResolution: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const resolution = width * height;
  // adapt object size based on screen size
  const scale = Math.sqrt(resolution) / Math.sqrt(baseResolution);
  return { width, height, scale };
}

export function getPositionFromEvent(event: TouchEvent | MouseEvent) {
  let { clientX: x, clientY: y } = "clientX" in event ? event : event.changedTouches[0];

  if (!x) {
    x = window.innerWidth / 2;
  }

  if (!y) {
    y = window.innerHeight / 2;
  }

  return { x, y };
}
