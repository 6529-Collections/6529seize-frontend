import fs from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

/* eslint-disable @typescript-eslint/no-require-imports */
const babel = require("next/dist/compiled/babel/core");
const reactCompiler = require("babel-plugin-react-compiler");
/* eslint-enable @typescript-eslint/no-require-imports */

function createCompiledCleanupHook() {
  const source = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../hooks/useMarkWaveNotificationsRead.cache.ts"
    ),
    "utf8"
  );
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiled = babel.transformSync(javascript, {
    filename: "useMarkWaveNotificationsRead.cache.js",
    babelrc: false,
    configFile: false,
    plugins: [[reactCompiler.default ?? reactCompiler, {}]],
  }).code as string;
  const commonJs = ts.transpileModule(compiled, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const effects: (() => void | (() => void))[] = [];
  const clearPending = jest.fn();
  const clearAll = jest.fn();
  const cancelTimeout = jest.fn();
  const scheduleTimeout = jest.fn().mockReturnValue(1);
  const exported = {} as {
    useClearWaveReadStateOnLastUnmount: (address: string | null) => void;
  };
  runInNewContext(commonJs, {
    exports: exported,
    setTimeout: scheduleTimeout,
    clearTimeout: cancelTimeout,
    require: (name: string) => {
      if (name === "react") {
        return {
          useRef: (value: string | null) => ({ current: value }),
          useLayoutEffect: (effect: () => void | (() => void)) => {
            effects.push(effect);
          },
        };
      }
      if (name === "react/compiler-runtime") {
        return {
          c: (size: number) =>
            Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
        };
      }
      if (name === "@/hooks/useMarkWaveNotificationsRead.requests") {
        return {
          clearPendingWaveReadsForAddress: clearPending,
          clearAllWaveReadState: clearAll,
        };
      }
      if (name === "@/hooks/useMarkWaveNotificationsRead.identity") return {};
      throw new Error(`Unexpected compiled module: ${name}`);
    },
  });
  const mount = (address: string | null) => {
    exported.useClearWaveReadStateOnLastUnmount(address);
    const cleanups = effects.splice(0).map((effect) => effect());
    return () => cleanups.forEach((cleanup) => cleanup?.());
  };
  return { mount, clearPending, clearAll, cancelTimeout, scheduleTimeout };
}

// Jest's normal transform does not run React Compiler. Execute its output to
// cover the mount/unmount/remount sequence that previously crashed in-browser.
it.each([
  [null, null, false],
  ["0xaaa", "0xaaa", false],
  ["0xaaa", "0xbbb", true],
] as const)(
  "preserves deferred cleanup when compiled and remounting %s as %s",
  (previousAddress, nextAddress, shouldClearPrevious) => {
    const hook = createCompiledCleanupHook();
    hook.mount(previousAddress)();
    expect(hook.scheduleTimeout).toHaveBeenCalledTimes(1);
    const unmount = hook.mount(nextAddress);
    expect(hook.cancelTimeout).toHaveBeenCalledWith(1);
    expect(hook.clearPending).toHaveBeenCalledTimes(
      shouldClearPrevious ? 1 : 0
    );
    if (shouldClearPrevious) {
      expect(hook.clearPending).toHaveBeenCalledWith(previousAddress);
    }
    expect(hook.clearAll).not.toHaveBeenCalled();
    unmount();
  }
);
