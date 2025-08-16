import html from "@rollup/plugin-html";
import livereload from "rollup-plugin-livereload";
import nodeResolve from "@rollup/plugin-node-resolve";
import serve from "rollup-plugin-serve";
import styles from "rollup-styles";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import svg from "rollup-plugin-svg-import";
import dotenv from "rollup-plugin-dotenv";
// import manifestJSON from "rollup-plugin-manifest-json";
import clear from "rollup-plugin-clear";
import { minify as htmlMinifier } from "html-minifier";
import { transformAsset } from "./rollupTransformAsset.mjs";
import manifestJSON from "rollup-plugin-manifest-json";

const production = !process.env.ROLLUP_WATCH;
const poki = process.env.NODE_ENV === "poki";
const js13k = process.env.NODE_ENV === "js13k";
const outputDir = production ? "dist" : "out";

export default {
  input: "src/index.ts",
  output: {
    dir: outputDir,
    name: "FindX",
    format: "iife",
    entryFileNames: "[hash].js",
    assetFileNames: "[hash][extname]",
  },
  treeshake: {
    preset: "smallest",
  },
  plugins: [
    clear({ targets: [outputDir] }),
    dotenv(),
    svg(),
    typescript(),
    nodeResolve(),
    styles({
      mode: "extract",
      minimize: production,
      sourceMap: !production,
      use: ["sass"],
    }),
    production &&
      !poki &&
      terser({
        mangle: {
          properties: {
            keep_quoted: true,
          },
        },
        compress: {
          booleans_as_integers: true,
          // drop_console: true,
        },
      }),
    !js13k &&
      manifestJSON({
        input: "src/manifest.json",
        minify: production,
        output: "manifest.json",
      }),
    html({
      title: "Purrfect Plan 🐈‍⬛",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes",
        },
      ],
    }),
    transformAsset({
      "index.html": (html) => {
        // html = html.replace('</head>', '<link rel="manifest" href="manifest.json"/></head>')
        return htmlMinifier(html, {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
        });
      },
    }),
    !production && serve({ contentBase: outputDir, open: true }),
    !production && livereload(outputDir),
  ],
  watch: {
    exclude: ["node_modules/**"],
  },
};
