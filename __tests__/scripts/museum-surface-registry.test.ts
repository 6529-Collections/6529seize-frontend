import fs from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

type ImportGraph = {
  readonly forward: Map<string, Set<string>>;
  readonly reverse: Map<string, Set<string>>;
  readonly unresolved: readonly unknown[];
  readonly visited: readonly string[];
};

type RegistryScript = {
  readonly deletedEntriesFromGit: (
    root: string,
    base: string,
    head: string
  ) => readonly { file: string; surface_ids: string[] }[];
  readonly assertArguments: (argv: readonly string[]) => void;
  readonly buildReverseImportGraph: (
    root: string,
    options?: { readonly entryFiles?: readonly string[] }
  ) => ImportGraph;
  readonly mapChangedFilesToSurfaces: (
    changedFiles: readonly string[],
    options: {
      readonly root: string;
      readonly registry?: Record<string, unknown>;
      readonly graph?: ImportGraph;
      readonly deletedEntries?: readonly {
        file: string;
        surface_ids: string[];
      }[];
    }
  ) => {
    readonly affected_surfaces: readonly string[];
    readonly escalated_files: readonly string[];
    readonly unmapped_files: readonly string[];
    readonly graph: { readonly unresolved_import_count: number };
  };
  readonly validateRegistry: (
    root: string,
    registry?: Record<string, unknown>
  ) => {
    readonly inventory: {
      readonly routes: readonly string[];
      readonly supportFiles: readonly string[];
      readonly components: readonly string[];
      readonly e2eSpecs: readonly string[];
    };
  };
};

const registryScript =
  require("../../scripts/museum-surface-registry.cjs") as RegistryScript;

type FixtureRoot = {
  root: string;
  registry: Record<string, unknown>;
};

function write(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function ownedFile(file: string, surface_ids: string[]) {
  return { file, surface_ids };
}

function createFixtureRoot(): FixtureRoot {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "museum-surface-registry-")
  );
  write(
    root,
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        moduleResolution: "bundler",
        module: "esnext",
        target: "es2022",
        baseUrl: ".",
        paths: { "@/*": ["*"] },
      },
    })
  );
  write(
    root,
    "ops/testing-strategy/museum-surface-registry.v1.schema.json",
    JSON.stringify({
      type: "object",
      properties: {
        contract: { const: "museum-surface-registry-v1" },
        version: { const: 1 },
        routes: { $ref: "#/$defs/routeList" },
      },
      $defs: { routeList: { items: { $ref: "#/$defs/route" } } },
    })
  );
  write(
    root,
    "app/museum/network/page.tsx",
    'import Shared from "@/components/museum/shared"; export default function Home() { return <Shared />; }\n'
  );
  write(
    root,
    "app/museum/network/about/page.tsx",
    'import Shared from "../../../../components/museum/shared"; export default function About() { return <Shared />; }\n'
  );
  for (const file of [
    "error.tsx",
    "layout.tsx",
    "loading.tsx",
    "not-found.tsx",
  ]) {
    write(
      root,
      `app/museum/network/${file}`,
      "export default function Boundary() { return null; }\n"
    );
  }
  write(
    root,
    "components/museum/shared.tsx",
    "export default function Shared() { return <p>Shared</p>; }\n"
  );
  write(
    root,
    "tests/museum/about-readonly.spec.ts",
    'import { test } from "@playwright/test"; test("about", () => {});\n'
  );

  return {
    root,
    registry: {
      $schema: "./museum-surface-registry.v1.schema.json",
      contract: "museum-surface-registry-v1",
      version: 1,
      repository: "6529-Collections/6529seize-frontend",
      roots: {
        routes: "app/museum/network",
        components: "components/museum",
        e2e_specs: "tests/museum",
      },
      surfaces: [
        { id: "museum.shell", title: "Shell", kind: "shell" },
        { id: "museum.home", title: "Home", kind: "page" },
        {
          id: "museum.about.proposition",
          title: "About",
          kind: "page",
        },
      ],
      routes: [
        ownedFile("app/museum/network/about/page.tsx", [
          "museum.about.proposition",
        ]),
        ownedFile("app/museum/network/page.tsx", ["museum.home"]),
      ].map((entry) => ({
        ...entry,
        path:
          entry.file === "app/museum/network/page.tsx"
            ? "/museum/network"
            : "/museum/network/about",
      })),
      support_files: [
        "error.tsx",
        "layout.tsx",
        "loading.tsx",
        "not-found.tsx",
      ].map((file) =>
        ownedFile(`app/museum/network/${file}`, ["museum.shell"])
      ),
      components: [ownedFile("components/museum/shared.tsx", ["museum.home"])],
      e2e_specs: [
        ownedFile("tests/museum/about-readonly.spec.ts", [
          "museum.about.proposition",
        ]),
      ],
    },
  };
}

describe("Museum surface registry", () => {
  it("accepts the documented check flag and rejects mistyped options", () => {
    expect(() => registryScript.assertArguments(["--check"])).not.toThrow();
    expect(() =>
      registryScript.assertArguments([
        "--check",
        "--",
        "--changed-from",
        "a".repeat(40),
      ])
    ).not.toThrow();
    expect(() => registryScript.assertArguments(["--chek"])).toThrow(
      /unknown option/u
    );
    expect(() => registryScript.assertArguments(["--output"])).toThrow(
      /missing value/u
    );
  });

  it("validates complete ownership of the checked-in Museum inventory", () => {
    const result = registryScript.validateRegistry(process.cwd());
    expect(result.inventory.routes).toHaveLength(56);
    expect(result.inventory.supportFiles).toHaveLength(16);
    expect(result.inventory.components).toHaveLength(71);
    expect(result.inventory.e2eSpecs).toHaveLength(6);
  });

  it.each([
    ["page", "app/museum/network/unmapped/page.tsx"],
    ["component", "components/museum/unmapped.tsx"],
    ["spec", "tests/museum/unmapped.spec.ts"],
  ])("fails closed for a seeded unmapped Museum %s", (_label, file) => {
    const fixture = createFixtureRoot();
    try {
      write(
        fixture.root,
        file,
        "export default function Unmapped() { return null; }\n"
      );
      expect(() =>
        registryScript.validateRegistry(fixture.root, fixture.registry)
      ).toThrow(/inventory mismatch/u);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("escalates a shared dependency to every importing Museum surface", () => {
    const fixture = createFixtureRoot();
    try {
      const graph = registryScript.buildReverseImportGraph(fixture.root, {
        entryFiles: [
          "app/museum/network/page.tsx",
          "app/museum/network/about/page.tsx",
          "app/museum/network/error.tsx",
          "app/museum/network/layout.tsx",
          "app/museum/network/loading.tsx",
          "app/museum/network/not-found.tsx",
          "components/museum/shared.tsx",
          "tests/museum/about-readonly.spec.ts",
        ],
      });
      expect(graph.unresolved).toEqual([]);

      const report = registryScript.mapChangedFilesToSurfaces(
        ["components/museum/shared.tsx"],
        { root: fixture.root, registry: fixture.registry, graph }
      );
      expect(report.affected_surfaces).toEqual([
        "museum.about.proposition",
        "museum.home",
      ]);
      expect(report.escalated_files).toContain("components/museum/shared.tsx");
      expect(report.graph.unresolved_import_count).toBe(0);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("maps a changed page directly and leaves unrelated files unselected", () => {
    const fixture = createFixtureRoot();
    try {
      const about = registryScript.mapChangedFilesToSurfaces(
        ["app/museum/network/about/page.tsx"],
        { root: fixture.root, registry: fixture.registry }
      );
      expect(about.affected_surfaces).toEqual(["museum.about.proposition"]);

      const unrelated = registryScript.mapChangedFilesToSurfaces(
        ["components/header/AppHeader.tsx"],
        {
          root: fixture.root,
          registry: fixture.registry,
          graph: {
            reverse: new Map(),
            unresolved: [],
            visited: [],
            forward: new Map(),
          },
        }
      );
      expect(unrelated.affected_surfaces).toEqual([]);
      expect(unrelated.unmapped_files).toEqual([]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("fails closed when a reachable local import cannot be resolved", () => {
    const fixture = createFixtureRoot();
    try {
      write(
        fixture.root,
        "app/museum/network/about/page.tsx",
        'import Missing from "../../../../components/museum/missing"; export default function About() { return <Missing />; }\n'
      );
      expect(() =>
        registryScript.mapChangedFilesToSurfaces(
          ["app/museum/network/about/page.tsx"],
          { root: fixture.root, registry: fixture.registry }
        )
      ).toThrow(/unresolved local imports/u);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it.each([true, false])(
    "retains only registered deleted-path ownership (registered=%s)",
    (registered) => {
      const fixture = createFixtureRoot();
      const page = "app/museum/network/about/page.tsx";
      const handler = "app/museum/network/about/route.ts";
      const registryPath =
        "ops/testing-strategy/museum-surface-registry.v1.json";
      const git = (...args: string[]) =>
        execFileSync("git", args, {
          cwd: fixture.root,
          encoding: "utf8",
        }).trim();
      const commit = () => {
        git("add", ".");
        git(
          "-c",
          "user.name=Registry Test",
          "-c",
          "user.email=registry@example.invalid",
          "-c",
          "commit.gpgsign=false",
          "commit",
          "--no-verify",
          "-qm",
          "Fixture"
        );
        return git("rev-parse", "HEAD");
      };
      try {
        const remainingRoutes = (
          fixture.registry["routes"] as { file: string }[]
        ).filter((entry) => entry.file !== page);
        const baseRegistry = {
          ...fixture.registry,
          routes: registered ? fixture.registry["routes"] : remainingRoutes,
        };
        write(fixture.root, registryPath, JSON.stringify(baseRegistry));
        git("init", "-q");
        const base = commit();
        fs.unlinkSync(path.join(fixture.root, page));
        write(
          fixture.root,
          handler,
          "export function GET() { return new Response(null, { status: 308 }); }\n"
        );
        fixture.registry["routes"] = remainingRoutes;
        fixture.registry["support_files"] = [
          ...(fixture.registry["support_files"] as object[]),
          ownedFile(handler, ["museum.home"]),
        ];
        write(fixture.root, registryPath, JSON.stringify(fixture.registry));
        const head = commit();
        const deletedEntries = registryScript.deletedEntriesFromGit(
          fixture.root,
          base,
          head
        );
        expect(deletedEntries.map((entry) => entry.file)).toEqual(
          registered ? [page] : []
        );
        const map = () =>
          registryScript.mapChangedFilesToSurfaces([page, handler], {
            root: fixture.root,
            registry: fixture.registry,
            deletedEntries,
          });
        if (registered) {
          expect(map().affected_surfaces).toEqual([
            "museum.about.proposition",
            "museum.home",
          ]);
        } else {
          expect(map).toThrow(/changed Museum-owned paths are unmapped/u);
        }
      } finally {
        fs.rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  );
});
