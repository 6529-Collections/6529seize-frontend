"use strict";

/**
 * E2EE capability probe: records whether a real device's browser engine can
 * run end-to-end encrypted messages under the production Content-Security-
 * Policy. Safari stands in for the iOS app's WKWebView (same WebKit build per
 * iOS version) and Chrome for Android System WebView (same Chromium).
 *
 * This is a data collector, not a gate: every capability is recorded as a
 * result and a negative one never fails the run. Only infrastructure problems
 * (no session, page never loads) fail it.
 *
 * Read-only: loads the signed-out home page and evaluates in the page. The
 * only side effects are a throwaway IndexedDB database, a Web Lock and two
 * BroadcastChannels, all on the device and all removed before it returns.
 *
 * Output: one `E2EE_PROBE_RESULT {json}` line on stdout (test spec output)
 * and `e2ee-probe-result.json` in $DEVICEFARM_LOG_DIR (customer artifacts).
 *
 * Not wired into the QA workflow (it is a one-off investigation tool). To
 * run it, render a test spec from testspecs/web-<platform>.yml with
 * __TARGET_URL__ substituted and `npm run test:web` replaced by
 * `npm run test:e2ee-probe`, then schedule an APPIUM_WEB_NODE run with the
 * packaged bundle (see README "Packaging").
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  isIos,
  openPage,
  saveScreenshot,
  startWebSession,
  targetUrl,
} = require("../lib/driver.cjs");

const PAGE_LOAD_TIMEOUT_MS = 90000;
const HYDRATION_SETTLE_MS = 5000;
const PROBE_TIMEOUT_MS = 150000;

// lib/e2ee/wasm/manifest.ts at the time of writing. Override when the module
// is rebuilt: the probe only needs a URL the target serves.
const MLS_WASM = {
  path: process.env.E2EE_WASM_PATH || "/e2ee/mls-wasm-c5dc4d96a05d6406.wasm",
  sha256:
    process.env.E2EE_WASM_SHA256 ||
    "c5dc4d96a05d6406b85dfa8c6a5836a0727da067c437216502a93c783595f5c8",
  bytes: Number(process.env.E2EE_WASM_BYTES || 1804916),
};

/**
 * Runs in the page (serialized by WebDriver, so it must be self-contained).
 *
 * The work is deferred with setTimeout so it runs as an ordinary page task.
 * Code evaluated directly by a remote debugger can be exempt from the page's
 * CSP eval checks (WebKit's inspector relaxes them for console evaluation),
 * which would report WebAssembly as allowed when the page itself could not
 * compile it. The `direct` block records that difference for comparison; the
 * `cspControl` step confirms the deferred task really is under the CSP.
 */
function startProbe(config) {
  var MINIMAL = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
  // (module (func (export "add") (param i32 i32) (result i32)
  //   local.get 0 local.get 1 i32.add))
  var ADD = [
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60,
    0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01,
    0x03, 0x61, 0x64, 0x64, 0x00, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0x20,
    0x00, 0x20, 0x01, 0x6a, 0x0b,
  ];

  function describeError(error) {
    if (error === null || error === undefined) {
      return String(error);
    }
    var name = error.name || (error.constructor && error.constructor.name);
    var message = error.message !== undefined ? error.message : String(error);
    return (name ? name + ": " : "") + message;
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("TIMEOUT after " + ms + "ms (" + label + ")"));
      }, ms);
      Promise.resolve(promise).then(
        function (value) {
          clearTimeout(timer);
          resolve(value);
        },
        function (error) {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  var state = {
    done: false,
    current: null,
    direct: {},
    steps: {},
    violations: [],
  };
  window.__e2eeProbe = state;

  try {
    document.addEventListener("securitypolicyviolation", function (event) {
      if (state.violations.length < 20) {
        state.violations.push({
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          blockedURI: event.blockedURI,
          disposition: event.disposition,
          sample: event.sample,
        });
      }
    });
  } catch (error) {
    state.violationListenerError = describeError(error);
  }

  // Direct (debugger-evaluated) context, for comparison only.
  try {
    state.direct.functionConstructor = String(new Function("return 1")());
  } catch (error) {
    state.direct.functionConstructor = describeError(error);
  }
  try {
    new WebAssembly.Module(new Uint8Array(MINIMAL));
    state.direct.wasmModuleSync = "ok";
  } catch (error) {
    state.direct.wasmModuleSync = describeError(error);
  }

  async function step(name, timeoutMs, fn) {
    state.current = name;
    var started = Date.now();
    try {
      var value = await withTimeout(fn(), timeoutMs, name);
      state.steps[name] = { ok: true, value: value, ms: Date.now() - started };
    } catch (error) {
      state.steps[name] = {
        ok: false,
        error: describeError(error),
        ms: Date.now() - started,
      };
    }
    return state.steps[name];
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer), function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function idbRequest(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function idbOpen(name) {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(name, 1);
      request.onupgradeneeded = function () {
        request.result.createObjectStore("s");
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
      request.onblocked = function () {
        reject(new Error("open blocked"));
      };
    });
  }

  async function idbRoundTrip(value) {
    var name = "6529-e2ee-probe-" + Math.random().toString(36).slice(2);
    var db = await idbOpen(name);
    try {
      var write = db.transaction("s", "readwrite");
      await idbRequest(write.objectStore("s").put(value, "k"));
      var read = db.transaction("s", "readonly");
      return await idbRequest(read.objectStore("s").get("k"));
    } finally {
      db.close();
      await idbRequest(indexedDB.deleteDatabase(name));
    }
  }

  var ed25519Pair = null;

  async function run() {
    await step("env", 5000, async function () {
      return {
        userAgent: navigator.userAgent,
        href: location.href,
        isSecureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated,
        readyState: document.readyState,
        nextVersion: window.next ? window.next.version || "present" : null,
        bodyTextLength: (document.body.innerText || "").trim().length,
        bodyTextStart: (document.body.innerText || "").trim().slice(0, 40),
        pageOfDoom: (document.body.innerText || "").indexOf("Page of Doom") >= 0,
      };
    });

    // The page CSP has no 'unsafe-eval', so this must throw when the probe
    // really runs under the CSP. If it returns 1 the results below are not
    // CSP-faithful.
    await step("cspControl", 5000, async function () {
      try {
        return { functionConstructor: String(new Function("return 1")()) };
      } catch (error) {
        return { functionConstructor: describeError(error) };
      }
    });

    await step("wasmMinimal", 15000, async function () {
      var result = { typeofWebAssembly: typeof WebAssembly };
      if (typeof WebAssembly !== "object") {
        return result;
      }
      result.validate = WebAssembly.validate(new Uint8Array(MINIMAL));
      try {
        await WebAssembly.compile(new Uint8Array(MINIMAL));
        result.compile = "ok";
      } catch (error) {
        result.compile = describeError(error);
      }
      try {
        var out = await WebAssembly.instantiate(new Uint8Array(MINIMAL));
        result.instantiate = out && out.instance ? "ok" : "no instance";
      } catch (error) {
        result.instantiate = describeError(error);
      }
      try {
        var add = await WebAssembly.instantiate(new Uint8Array(ADD));
        result.addCall = add.instance.exports.add(2, 3);
      } catch (error) {
        result.addCall = describeError(error);
      }
      try {
        new WebAssembly.Module(new Uint8Array(MINIMAL));
        result.moduleSync = "ok";
      } catch (error) {
        result.moduleSync = describeError(error);
      }
      return result;
    });

    await step("openmls", 60000, async function () {
      var result = { url: config.wasmPath };
      var response = await fetch(config.wasmPath, {
        credentials: "same-origin",
      });
      result.status = response.status;
      result.contentType = response.headers.get("content-type");
      var bytes = new Uint8Array(await response.arrayBuffer());
      result.bytes = bytes.byteLength;
      result.sizeMatchesManifest = bytes.byteLength === config.wasmBytes;
      try {
        var digest = hex(await crypto.subtle.digest("SHA-256", bytes));
        result.sha256MatchesManifest = digest === config.wasmSha256;
      } catch (error) {
        result.sha256 = describeError(error);
      }
      if (typeof WebAssembly !== "object") {
        result.compile = "WebAssembly unavailable";
        return result;
      }
      try {
        result.validate = WebAssembly.validate(bytes);
      } catch (error) {
        result.validate = describeError(error);
      }
      var module = null;
      var compileStarted = Date.now();
      try {
        module = await WebAssembly.compile(bytes);
        result.compile = "ok";
        result.compileMs = Date.now() - compileStarted;
      } catch (error) {
        result.compile = describeError(error);
        return result;
      }
      var imports = WebAssembly.Module.imports(module);
      var exportsList = WebAssembly.Module.exports(module);
      result.importCount = imports.length;
      result.exportCount = exportsList.length;
      result.nonFunctionImports = imports
        .filter(function (entry) {
          return entry.kind !== "function";
        })
        .map(function (entry) {
          return entry.module + "." + entry.name + ":" + entry.kind;
        });
      // Instantiate with stubs (no glue): proves link + memory allocation.
      // A stub only runs if the module has a start function that calls it.
      var stubs = {};
      imports.forEach(function (entry) {
        if (entry.kind !== "function") {
          return;
        }
        stubs[entry.module] = stubs[entry.module] || {};
        stubs[entry.module][entry.name] = function () {
          throw new Error("probe stub import called: " + entry.name);
        };
      });
      try {
        var instance = await WebAssembly.instantiate(module, stubs);
        result.instantiate = "ok";
        var memory = instance.exports.memory;
        result.memoryBytes =
          memory && memory.buffer ? memory.buffer.byteLength : null;
      } catch (error) {
        result.instantiate = describeError(error);
      }
      return result;
    });

    await step("indexedDB", 20000, async function () {
      if (typeof indexedDB === "undefined") {
        return { typeofIndexedDB: "undefined" };
      }
      var payload = { n: 6529, bytes: new Uint8Array([1, 2, 3, 4]) };
      var back = await idbRoundTrip(payload);
      return {
        typeofIndexedDB: typeof indexedDB,
        roundTrip:
          back && back.n === 6529 && back.bytes && back.bytes[3] === 4
            ? "ok"
            : "mismatch",
        databasesApi: typeof indexedDB.databases,
      };
    });

    await step("webLocks", 10000, async function () {
      var locks = navigator.locks;
      var result = {
        present: Boolean(locks),
        typeofRequest: locks ? typeof locks.request : "n/a",
        typeofQuery: locks ? typeof locks.query : "n/a",
      };
      if (locks && typeof locks.request === "function") {
        result.requestResult = await locks.request(
          "6529-e2ee-probe",
          function () {
            return 1;
          }
        );
      }
      return result;
    });

    await step("broadcastChannel", 5000, async function () {
      var result = { typeofBroadcastChannel: typeof BroadcastChannel };
      if (typeof BroadcastChannel !== "function") {
        return result;
      }
      var sender = new BroadcastChannel("6529-e2ee-probe");
      var receiver = new BroadcastChannel("6529-e2ee-probe");
      try {
        result.delivered = await new Promise(function (resolve) {
          var timer = setTimeout(function () {
            resolve(false);
          }, 2000);
          receiver.onmessage = function (event) {
            clearTimeout(timer);
            resolve(event.data === "ping");
          };
          sender.postMessage("ping");
        });
      } finally {
        sender.close();
        receiver.close();
      }
      return result;
    });

    await step("ed25519", 15000, async function () {
      var subtle = window.crypto && window.crypto.subtle;
      var result = { subtle: Boolean(subtle) };
      if (!subtle) {
        return result;
      }
      // What the app does (lib/device-signing/ed25519.ts isEd25519Supported):
      // a non-extractable pair.
      try {
        ed25519Pair = await subtle.generateKey({ name: "Ed25519" }, false, [
          "sign",
          "verify",
        ]);
        result.generateNonExtractable = "ok";
      } catch (error) {
        result.generateNonExtractable = describeError(error);
      }
      try {
        await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
        result.generateExtractable = "ok";
      } catch (error) {
        result.generateExtractable = describeError(error);
      }
      if (ed25519Pair) {
        try {
          var data = new Uint8Array(32);
          crypto.getRandomValues(data);
          var signature = await subtle.sign(
            { name: "Ed25519" },
            ed25519Pair.privateKey,
            data
          );
          var raw = await subtle.exportKey("raw", ed25519Pair.publicKey);
          var imported = await subtle.importKey(
            "raw",
            raw,
            { name: "Ed25519" },
            false,
            ["verify"]
          );
          result.signVerify = (await subtle.verify(
            { name: "Ed25519" },
            imported,
            signature,
            data
          ))
            ? "ok"
            : "verify false";
          result.signatureBytes = signature.byteLength;
        } catch (error) {
          result.signVerify = describeError(error);
        }
      }
      return result;
    });

    // The app keeps its non-extractable signing key in IndexedDB.
    await step("indexedDBCryptoKey", 20000, async function () {
      if (!ed25519Pair) {
        return { skipped: "no Ed25519 key pair" };
      }
      if (typeof indexedDB === "undefined") {
        return { skipped: "no IndexedDB" };
      }
      var back = await idbRoundTrip({ pair: ed25519Pair });
      var signature = await crypto.subtle.sign(
        { name: "Ed25519" },
        back.pair.privateKey,
        new Uint8Array(32)
      );
      return { storedAndUsable: signature.byteLength === 64 };
    });

    await step("storage", 10000, async function () {
      var storage = navigator.storage;
      var result = {
        present: Boolean(storage),
        typeofPersist: storage ? typeof storage.persist : "n/a",
      };
      if (storage && typeof storage.persisted === "function") {
        result.persisted = await storage.persisted();
      }
      if (storage && typeof storage.estimate === "function") {
        var estimate = await storage.estimate();
        result.quotaMB = Math.round((estimate.quota || 0) / 1048576);
        result.usageMB = Math.round((estimate.usage || 0) / 1048576);
      }
      return result;
    });

    // Runtime APIs that E2EE code paths call without polyfills.
    await step("jsApis", 5000, async function () {
      return {
        structuredClone: typeof structuredClone,
        arrayToSorted: typeof Array.prototype.toSorted,
        arrayAt: typeof Array.prototype.at,
        arrayFindLast: typeof Array.prototype.findLast,
        objectHasOwn: typeof Object.hasOwn,
        randomUUID: typeof (crypto && crypto.randomUUID),
        promiseWithResolvers: typeof Promise.withResolvers,
        abortSignalAny: typeof AbortSignal.any,
        abortSignalTimeout: typeof AbortSignal.timeout,
        finalizationRegistry: typeof FinalizationRegistry,
        weakRef: typeof WeakRef,
        textDecoder: typeof TextDecoder,
        bigInt64Array: typeof BigInt64Array,
        setUnion: typeof Set.prototype.union,
        compressionStream: typeof CompressionStream,
        sharedArrayBuffer: typeof SharedArrayBuffer,
        instantiateStreaming: typeof WebAssembly === "object"
          ? typeof WebAssembly.instantiateStreaming
          : "n/a",
      };
    });
  }

  setTimeout(function () {
    run()
      .catch(function (error) {
        state.fatal = describeError(error);
      })
      .then(function () {
        state.current = null;
        state.done = true;
      });
  }, 50);
  return "started";
}

function deviceInfo() {
  return {
    name: process.env.DEVICEFARM_DEVICE_NAME || null,
    platform: process.env.DEVICEFARM_DEVICE_PLATFORM_NAME || null,
    os: process.env.DEVICEFARM_DEVICE_OS_VERSION || null,
  };
}

/**
 * openPage, falling back to in-page navigation. On a Device Farm iPhone 12 /
 * iOS 26.6 the XCUITest driver's WebDriver url() failed with "'Page.navigate'
 * was not found" from the Safari remote debugger, leaving about:blank.
 */
async function openPageWithFallback(driver, pageUrl) {
  try {
    await openPage(driver, pageUrl, PAGE_LOAD_TIMEOUT_MS);
    return "webdriver-url";
  } catch (error) {
    console.warn(`url() navigation failed (${error.message}); using location.assign`);
    await driver.execute((url) => {
      window.location.assign(url);
    }, pageUrl);
    await driver.waitUntil(
      async () =>
        (await driver.execute(() => window.location.href)).startsWith(pageUrl),
      {
        timeout: PAGE_LOAD_TIMEOUT_MS,
        interval: 2000,
        timeoutMsg: `location.assign never reached ${pageUrl}`,
      }
    );
    await driver.waitUntil(
      async () =>
        (await driver.execute(() => document.readyState)) === "complete",
      { timeout: PAGE_LOAD_TIMEOUT_MS, interval: 2000 }
    );
    return "location-assign";
  }
}

/**
 * Safari console errors since the session started (iOS only; needs
 * `appium:showSafariConsoleLog`). Explains a page that never hydrated.
 */
async function consoleErrors(driver) {
  if (!isIos()) {
    return null;
  }
  try {
    const entries = await driver.getLogs("safariConsole");
    return entries
      .filter((entry) =>
        /error|severe/i.test(`${entry.level} ${entry.message}`)
      )
      .slice(0, 10)
      .map((entry) => String(entry.message).slice(0, 400));
  } catch (error) {
    return [`getLogs failed: ${error.message}`];
  }
}

function writeArtifact(result) {
  try {
    const dir = process.env.DEVICEFARM_LOG_DIR || ".";
    fs.writeFileSync(
      path.join(dir, "e2ee-probe-result.json"),
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.warn(`Could not write the probe artifact: ${error.message}`);
  }
}

describe("E2EE capability probe (real device)", function () {
  let driver;

  before(async function () {
    driver = await startWebSession({
      extraCapabilities: isIos() ? { "appium:showSafariConsoleLog": true } : {},
    });
  });

  after(async function () {
    if (driver) {
      await driver.deleteSession().catch(() => {});
    }
  });

  it("records E2EE engine capabilities on the signed-out home page", async function () {
    const navigation = await openPageWithFallback(
      driver,
      new URL("/", targetUrl()).toString()
    );
    // Let hydration and client effects settle before probing.
    await driver.pause(HYDRATION_SETTLE_MS);

    await driver.execute(startProbe, {
      wasmPath: MLS_WASM.path,
      wasmSha256: MLS_WASM.sha256,
      wasmBytes: MLS_WASM.bytes,
    });

    const readProbe = () =>
      driver.execute(() =>
        window.__e2eeProbe ? JSON.stringify(window.__e2eeProbe) : null
      );

    let raw = null;
    let complete = true;
    try {
      await driver.waitUntil(
        async () => {
          raw = await readProbe();
          return raw !== null && JSON.parse(raw).done === true;
        },
        { timeout: PROBE_TIMEOUT_MS, interval: 2000 }
      );
    } catch {
      // Data over gates: record whatever finished (state.current names the
      // step that hung) instead of failing.
      complete = false;
      raw = await readProbe().catch(() => null);
    }

    const result = {
      device: deviceInfo(),
      target: targetUrl(),
      navigation,
      complete,
      probe: raw ? JSON.parse(raw) : null,
      consoleErrors: await consoleErrors(driver),
    };
    console.log(`E2EE_PROBE_RESULT ${JSON.stringify(result)}`);
    writeArtifact(result);
    await saveScreenshot(driver, "e2ee-probe-home");
  });
});
