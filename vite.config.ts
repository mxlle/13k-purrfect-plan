import { defineConfig } from "vite";
import { viteAwesomeSvgLoader } from "vite-awesome-svg-loader";
import { createHtmlPlugin } from "vite-plugin-html";
import replace from "@rollup/plugin-replace";

import { TranslationKey } from "./src/translations/translationKey";
import { CssClass } from "./src/utils/css-class";
import { PubSubEvent } from "./src/utils/pub-sub-service";
import { LocalStorageKey } from "./src/utils/local-storage";
import { mapEntries, memoize } from "./src/utils/utils";
import { ConfigCategory, Direction, ObjectId, OnboardingStep, Tool } from "./src/types";
import { CatId } from "./src/logic/data/catId";
import { MoveLimit } from "./src/logic/config/move-limit";
import { visualizer } from "rollup-plugin-visualizer";

const replaceEnum = (name: string, object: object) => mapEntries(object, ([key, value]) => [`${name}.${key}`, JSON.stringify(value)]);

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

export default defineConfig(({ mode, command }) => {
  const production = command === "build";
  const poki = mode === "poki";
  const js13k = mode === "js13k";
  const analyze = true;
  const analyzeOutputJson = false;

  const getCssIdentifier = memoize(idGenerator(), 2);

  return {
    base: "",
    envPrefix: ["GERMAN_ENABLED", "POKI_ENABLED"],
    build: {
      minify: production ? "terser" : false,
      cssMinify: production ? "lightningcss" : false,
      terserOptions: production &&
        !poki && {
          mangle: {
            properties: {
              keep_quoted: true,
            },
          },
          compress: {
            booleans_as_integers: true,
            drop_console: js13k,
            hoist_funs: true,
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
          ...replaceEnum("CssClass", CssClass),
          ...replaceEnum("TranslationKey", TranslationKey),
          ...replaceEnum("PubSubEvent", PubSubEvent),
          ...replaceEnum("LocalStorageKey", LocalStorageKey),
          ...replaceEnum("Direction", Direction),
          ...replaceEnum("Tool", Tool),
          ...replaceEnum("CatId", CatId),
          ...replaceEnum("ObjectId", ObjectId),
          ...replaceEnum("ConfigCategory", ConfigCategory),
          ...replaceEnum("OnboardingStep", OnboardingStep),
          ...replaceEnum("MoveLimit", MoveLimit),
          ...mapEntries(CssClass, ([, name]) => [name, getCssIdentifier(name)]),
        }),
      viteAwesomeSvgLoader(),
      createHtmlPlugin({
        minify: true,
        inject: {
          tags: js13k ? [] : [{ injectTo: "head", tag: "link", attrs: { rel: "manifest", href: "src/manifest.json" } }],
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
