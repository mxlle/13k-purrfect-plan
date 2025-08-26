import { defineConfig } from "vite";
import { viteAwesomeSvgLoader } from "vite-awesome-svg-loader";
import { createHtmlPlugin } from "vite-plugin-html";
import replace from "@rollup/plugin-replace";

import { TranslationKey } from "./src/translations/translationKey";
import { CssClass } from "./src/utils/css-class";
import { PubSubEvent } from "./src/utils/pub-sub-service";
import { LocalStorageKey } from "./src/utils/local-storage";
import { mapEntries, memoize } from "./src/utils/utils";

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

  const getCssIdentifier = memoize(idGenerator(), 2);

  return {
    envPrefix: ["GERMAN_ENABLED", "POKI_ENABLED"],
    define: {},
    build: {
      outDir: "dist",
      minify: production ? "terser" : false,
      cssMinify: production ? "lightningcss" : false,
      terserOptions: {
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
      },
    },
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
        generateScopedName: production ? getCssIdentifier : "[name]__[local]",
      },
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["\\b", "\\b"],
        ...replaceEnum("CssClass", CssClass),
        ...replaceEnum("TranslationKey", TranslationKey),
        ...replaceEnum("PubSubEvent", PubSubEvent),
        ...replaceEnum("LocalStorageKey", LocalStorageKey),
        // ...replaceEnum("ConfigCategory", ConfigCategory),
        // ...replaceEnum("Direction", Direction),
        // ...replaceEnum("Tool", Tool),
        ...(production && mapEntries(CssClass, ([, name]) => [name, getCssIdentifier(name)])),
      }),
      viteAwesomeSvgLoader(),
      createHtmlPlugin({
        minify: true,
        inject: {
          tags: js13k ? [] : [{ injectTo: "head", tag: "link", attrs: { rel: "manifest", href: "src/manifest.json" } }],
        },
      }),
    ],
  };
});
