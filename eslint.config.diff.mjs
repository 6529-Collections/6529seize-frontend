import diff from "eslint-plugin-diff";
import tightConfig from "./eslint.config.tight.mjs";

export default [
  ...tightConfig,
  {
    plugins: { diff },
    processor: "diff/diff",
  },
];
