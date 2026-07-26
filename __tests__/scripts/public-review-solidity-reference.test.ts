// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  DEFINITION_SHARD_SCHEMA_VERSION,
  abiSurface,
  decodeUtf8,
  encodeSemanticKey,
  keccak256,
  reconcileDeclarationWithAbi,
  selectorForSignature,
  sha256Urn,
  stableJson,
  topicForSignature,
  validateDefinitionShards,
} = require("../../scripts/public-reviews/solidity-reference-lib.cjs") as {
  DEFINITION_SHARD_SCHEMA_VERSION: string;
  abiSurface: (
    definitions: Map<number, RawDefinition>,
    definition: RawDefinition,
    output: CompilerOutput
  ) => AbiSurface;
  decodeUtf8: (value: Buffer) => string;
  encodeSemanticKey: (value: string) => string;
  keccak256: (value: string) => string;
  reconcileDeclarationWithAbi: (
    definition: RawDefinition,
    declaration: Declaration,
    kind: "event" | "error",
    abiRecord: AbiRecord
  ) => Declaration;
  selectorForSignature: (value: string) => string;
  sha256Urn: (value: Buffer) => string;
  stableJson: (value: unknown) => string;
  topicForSignature: (value: string) => string;
  validateDefinitionShards: (
    bundle: unknown,
    shards: Map<string, unknown>
  ) => void;
};

type Declaration = {
  id: string;
  key: string;
  kind: "function" | "event" | "error";
  name: string;
  canonicalSignature: string | null;
  selector?: string;
  topic0?: string;
  syntheticGetter?: boolean;
};

type AbiRecord = {
  name: string;
  signature: string;
  selector?: string;
  topic0?: string;
};

type RawDefinition = {
  semanticId: string;
  sourcePath: string;
  name: string;
  node: { id: number; linearizedBaseContracts: number[] };
  members: {
    functions: Declaration[];
    events: Declaration[];
    errors: Declaration[];
    stateVariables: Array<{
      name: string;
      selector: string;
      natspec: null;
      range: { lineStart: number };
    }>;
  };
};

type CompilerOutput = {
  contracts: Record<
    string,
    Record<
      string,
      {
        abi: Array<Record<string, unknown>>;
      }
    >
  >;
};

type AbiSurface = {
  functions: Array<{
    signature: string;
    selector: string;
    declarationId: string;
  }>;
};

function declaration(
  kind: "event" | "error",
  name: string,
  hash: string
): Declaration {
  return {
    id: `contracts/T.sol:T#${kind}:display`,
    key: encodeSemanticKey(`contracts/T.sol:T#${kind}:display`),
    kind,
    name,
    canonicalSignature: null,
    ...(kind === "event" ? { topic0: hash } : { selector: hash }),
  };
}

describe("Solidity public-review reference generator", () => {
  it("uses Ethereum Keccak-256 and stable selectors", () => {
    expect(keccak256("")).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    );
    expect(selectorForSignature("transfer(address,uint256)")).toBe(
      "0xa9059cbb"
    );
  });

  it("encodes semantic keys losslessly as unpadded base64url", () => {
    const semanticId =
      "contracts/Ünicode.sol:流#event:Changed((uint256,address))";
    const key = encodeSemanticKey(semanticId);

    expect(key).not.toContain("=");
    expect(decodeUtf8(Buffer.from(key, "base64url"))).toBe(semanticId);
  });

  it("materializes a public state-variable getter as a declaration", () => {
    const selector = selectorForSignature("value()");
    const definition: RawDefinition = {
      semanticId: "contracts/T.sol:T",
      sourcePath: "contracts/T.sol",
      name: "T",
      node: { id: 1, linearizedBaseContracts: [1] },
      members: {
        functions: [],
        events: [],
        errors: [],
        stateVariables: [
          {
            name: "value",
            selector,
            natspec: null,
            range: { lineStart: 4 },
          },
        ],
      },
    };
    const output: CompilerOutput = {
      contracts: {
        "contracts/T.sol": {
          T: {
            abi: [
              {
                inputs: [],
                name: "value",
                outputs: [
                  {
                    internalType: "uint256",
                    name: "",
                    type: "uint256",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
            ],
          },
        },
      },
    };

    const surface = abiSurface(new Map([[1, definition]]), definition, output);
    const generatedGetter = definition.members.functions[0];
    if (!generatedGetter) {
      throw new Error("Expected the public state variable getter.");
    }

    expect(definition.members.functions).toHaveLength(1);
    expect(generatedGetter).toMatchObject({
      id: `contracts/T.sol:T#function:${selector}`,
      canonicalSignature: "value()",
      selector,
      syntheticGetter: true,
    });
    expect(surface.functions[0]).toMatchObject({
      declarationId: generatedGetter.id,
      selector,
      signature: "value()",
    });
  });

  it("reconciles user-defined event and tuple error types to compiler ABI signatures", () => {
    const definition = {
      semanticId: "contracts/T.sol:T",
    } as unknown as RawDefinition;
    const eventSignature = "ModeChanged(uint8)";
    const event = declaration(
      "event",
      "ModeChanged",
      topicForSignature(eventSignature)
    );
    const reconciledEvent = reconcileDeclarationWithAbi(
      definition,
      event,
      "event",
      {
        name: "ModeChanged",
        signature: eventSignature,
        topic0: topicForSignature(eventSignature),
      }
    );

    expect(reconciledEvent).toMatchObject({
      id: `contracts/T.sol:T#event:${eventSignature}`,
      canonicalSignature: eventSignature,
      topic0: topicForSignature(eventSignature),
    });

    const errorSignature = "BadConfig((uint256,address))";
    const errorSelector = selectorForSignature(errorSignature);
    const error = declaration("error", "BadConfig", errorSelector);
    error.id = `contracts/T.sol:T#error:${errorSelector}`;
    error.key = encodeSemanticKey(error.id);
    const reconciledError = reconcileDeclarationWithAbi(
      definition,
      error,
      "error",
      {
        name: "BadConfig",
        signature: errorSignature,
        selector: errorSelector,
      }
    );

    expect(reconciledError).toMatchObject({
      id: `contracts/T.sol:T#error:${errorSelector}`,
      canonicalSignature: errorSignature,
      selector: errorSelector,
    });
  });

  it("rejects missing, extra, or checksum-drifted definition shards", () => {
    const id = "contracts/T.sol:T";
    const key = encodeSemanticKey(id);
    const definition = {
      id,
      key,
      declarations: {
        functions: [],
        events: [],
        errors: [],
      },
      abiSurface: {
        functions: [],
        events: [],
        errors: [],
      },
    };
    const shard = {
      shardSchemaVersion: DEFINITION_SHARD_SCHEMA_VERSION,
      reviewId: "stream",
      reviewVersion: "v1",
      definition,
      warnings: [],
      warningSummary: {
        totalCount: 0,
        byCategory: {},
        byCode: {},
      },
    };
    const buffer = Buffer.from(stableJson(shard));
    const bundle = {
      reviewId: "stream",
      reviewVersion: "v1",
      summary: { warningCount: 0 },
      definitionIndex: [
        {
          id,
          key,
          name: undefined,
          sourcePath: undefined,
          scope: undefined,
          kind: undefined,
          classification: undefined,
          shardSha256: sha256Urn(buffer),
          warningSummary: shard.warningSummary,
        },
      ],
    };
    const validShards = new Map([[key, { buffer, shard }]]);

    expect(() => validateDefinitionShards(bundle, validShards)).not.toThrow();
    expect(() => validateDefinitionShards(bundle, new Map())).toThrow(
      "incomplete"
    );

    const drifted = Buffer.from(buffer);
    drifted[drifted.length - 2] = drifted[drifted.length - 2]! ^ 1;
    expect(() =>
      validateDefinitionShards(
        bundle,
        new Map([[key, { buffer: drifted, shard }]])
      )
    ).toThrow("checksum drifted");

    const extraId = "contracts/Extra.sol:Extra";
    const extraShard = {
      ...shard,
      definition: {
        ...definition,
        id: extraId,
        key: encodeSemanticKey(extraId),
      },
    };
    expect(() =>
      validateDefinitionShards(
        bundle,
        new Map([
          ...validShards,
          [
            "extra",
            {
              buffer: Buffer.from(stableJson(extraShard)),
              shard: extraShard,
            },
          ],
        ])
      )
    ).toThrow("not indexed");
  });
});
