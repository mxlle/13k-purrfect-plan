import { defineConfig } from "vite";
import { viteAwesomeSvgLoader } from "vite-awesome-svg-loader";
import { createHtmlPlugin } from "vite-plugin-html";
import replace from "@rollup/plugin-replace";

import { TranslationKey } from "./src/translations/translationKey";
import { CssClass } from "./src/utils/css-class";
import { PubSubEvent } from "./src/utils/pub-sub-service";
import { LocalStorageKey } from "./src/utils/local-storage";
import { mapEntries, memoize } from "./src/utils/utils";
import { Direction, ObjectId, Tool } from "./src/types";
import { CatId } from "./src/logic/data/catId";
import { MoveLimit } from "./src/logic/config/move-limit";
import { visualizer } from "rollup-plugin-visualizer";

import AST from "unplugin-ast/vite";
import { Transformer } from "unplugin-ast";
import { Literal, NumericLiteral, ObjectExpression, ObjectProperty } from "@babel/types";

export default defineConfig(({ mode, command }) => {
  const production = command === "build";
  const poki = mode === "poki";
  const js13k = mode === "js13k";
  const analyze = true;
  const analyzeOutputJson = false;

  const getCssIdentifier = memoize(idGenerator(), 2);

  return {
    base: "",
    envPrefix: ["GERMAN_ENABLED", "POKI_ENABLED", "IS_JS13K"],
    build: {
      minify: production ? "terser" : false,
      cssMinify: production ? "lightningcss" : false,
      terserOptions: production &&
        !poki && {
          ecma: 2015,
          mangle: {
            properties: {
              keep_quoted: true,
            },
          },
          compress: {
            ecma: 2015,
            booleans_as_integers: true,
            drop_console: js13k,
            keep_fargs: false,
            passes: 3,
            unsafe: true,
          },
        },
      rollupOptions: {
        treeshake: {
          preset: "smallest",
        },
        output: {
          assetFileNames: "[hash][extname]",
          entryFileNames: "[hash].js",
        },
      },
      modulePreload: { polyfill: false }, // todo - check if this is fine
    },
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
        generateScopedName: production ? getCssIdentifier : "[name]__[local]",
      },
    },
    plugins: [
      production &&
        replace({
          preventAssignment: true,
          delimiters: ["\\b", "\\b"],
          ...replaceEnums({
            CssClass,
            TranslationKey,
            PubSubEvent,
            LocalStorageKey,
            Direction,
            Tool,
            CatId,
            ObjectId,
            MoveLimit,
          }),
          ...mapEntries(CssClass, ([, name]) => [name, getCssIdentifier(name)]),
        }),
      production &&
        AST({
          include: ["src/**/*.ts"],
          transformer: [replaceMapsTransformer],
        }),
      viteAwesomeSvgLoader(),
      createHtmlPlugin({
        minify: true,
        inject: {
          tags: js13k
            ? []
            : [
                { injectTo: "head", tag: "link", attrs: { rel: "manifest", href: "src/manifest.json" } },
                { injectTo: "head", tag: "meta", attrs: { name: "description", content: "Plan your route to collect all lost kittens" } },
              ],
        },
      }),
      analyze &&
        !analyzeOutputJson &&
        visualizer({
          filename: "dist-analyzation/stats.html",
          template: "treemap",
          gzipSize: true,
          brotliSize: true,
          open: false, // set to true to auto-open after build
        }),
      analyze &&
        analyzeOutputJson &&
        visualizer({
          filename: "dist-analyzation/stats.json",
          template: "raw-data",
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
    ],
  };
});

interface Obj<K, V> extends ObjectExpression {
  properties: (ObjectProperty & { key: K; value: V })[];
}
const replaceMapsTransformer: Transformer = {
  onNode: (node) =>
    node.type === "ObjectExpression" &&
    node.properties.length &&
    node.properties.every((p) => p.type === "ObjectProperty" && p.key.type === "NumericLiteral" && p.value.type.endsWith("Literal")),
  transform: (node: Obj<NumericLiteral, Literal>) => {
    let best = { value: node, length: node.end - node.start };
    function addCandidate(value) {
      if (value.length < best.length) best = { value, length: value.length };
    }

    // try ["a","b",,,"c"]
    const arr = node.properties.reduce((arr, p) => ((arr[p.key.value] = (p.value as any).value), arr), []);
    addCandidate(JSON.stringify(arr).replaceAll("null,", ","));

    // try "a|b|c".split("|")
    if (node.properties.every((p) => p.value.type === "StringLiteral")) {
      const str = arr.join("");
      const sep: any = [..."0123456789|,"].find((sep) => !str.includes(sep));
      if (sep !== undefined) {
        addCandidate(JSON.stringify(arr.join(sep)) + `.split(${sep == +sep ? +sep : JSON.stringify(sep)})`);
      }
    }
    return best.value;
  },
};

const replaceEnums = (enums: object) =>
  Object.fromEntries(
    Object.entries(enums).flatMap(([name, obj]) => Object.entries(obj).map(([key, value]) => [`${name}.${key}`, JSON.stringify(value)])),
  );

const idGenerator =
  (i = 0) =>
  () => {
    const dict = "1234567890-qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_";
    let str = "";
    if (i % dict.length === 0) i += 11;
    for (let x = i++; x > 0; x = Math.floor(x / dict.length)) {
      str += dict[x % dict.length];
    }
    return str;
  };
