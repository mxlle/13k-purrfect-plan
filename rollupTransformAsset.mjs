/** @type {(replacers: Record<string, (content: string) => string>) => import('rollup').OutputPlugin} */
export function transformAsset(replacers) {
  return {
    name: "transform-asset",
    async generateBundle(_options, bundle, _isWrite) {
      for (const name in replacers) {
        if (!bundle[name]) return;
        bundle[name].source = await replacers[name](bundle[name].source.toString());
      }
    },
  };
}
