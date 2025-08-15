declare module "*.svg" {
  const content: () => SVGElement;
  export default content;
}

declare const process: {env: {[key: string]: string}};