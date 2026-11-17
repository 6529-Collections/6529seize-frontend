import type { AiRelease, AiSystem } from "../releaseFeed";

// The install guide, from 6529 AI's own guides (its docs/install/macos.md,
// windows.md, linux.md and getting-started.md), cut to what a person needs
// to install it and chat. Release candidate 1 runs models on the person's
// own computer only and hides the network, so the guide leaves it out.
// Text may hold **bold** for what the screen shows and `code`. en-US only
// for now; see ops/docs/ai-download-page.md.

export type AiGuideSystemKey = "mac" | "windows" | "linux";

export type AiCode = {
  /** Where it goes, or which computer it is for: "Terminal", "x86-64". */
  readonly label: string;
  readonly code: string;
};

export type AiGuideStep = {
  /** What to do. */
  readonly text: string;
  /** Commands for the step, each with a copy button. */
  readonly code?: readonly AiCode[] | undefined;
  /** What the person sees once it is done. */
  readonly result?: string | undefined;
  /** An example of what it prints, shown as code with no copy button. */
  readonly example?: string | undefined;
  /** A screenshot of what the person sees, by its slot name. */
  readonly screenshot?: "placement" | undefined;
};

export type AiGuideSystem = {
  readonly key: AiGuideSystemKey;
  readonly label: string;
  readonly needs: readonly string[];
  readonly steps: readonly AiGuideStep[];
  /** How to open the page again later. */
  readonly openAgain: AiGuideStep;
  /** Where its log is. */
  readonly log: AiCode;
  readonly uninstall: AiGuideStep;
  /** A closed section for what few people need. */
  readonly more?:
    | { readonly title: string; readonly step: AiGuideStep }
    | undefined;
};

/** A file's name in the release, or the name it has in every release. */
function fileName(
  release: AiRelease | undefined,
  system: AiSystem,
  ending: string,
  fallback: string
): string {
  return (
    release?.files.find(
      (file) => file.system === system && file.name.endsWith(ending)
    )?.name ?? fallback
  );
}

function windowsOpenStep(
  release: AiRelease | undefined,
  setup: string
): AiGuideStep {
  const signer = release?.files.find((file) => file.name === setup)?.signed;
  if (!release) {
    return { text: `Open \`${setup}\`.` };
  }
  if (signer) {
    return {
      text: `Open \`${setup}\`.`,
      result: `Windows asks whether to let it make changes, and names the verified publisher **${signer}**. Choose **Yes**. If it names anyone else, don't run it.`,
    };
  }
  return {
    text: `Open \`${setup}\`.`,
    result:
      'It isn\'t signed, so Windows SmartScreen says "Windows protected your PC". Choose **More info**, check the file name, then **Run anyway**.',
  };
}

/** "amd64.deb", or "cuda_amd64.deb": what tells the .deb files apart. */
function debTail(name: string): string {
  const tail = name.slice(name.lastIndexOf("_") + 1);
  return name.includes("-cuda_") ? `cuda_${tail}` : tail;
}

/** "x86_64-cpu.tar.gz": what tells the archives apart. */
function tarballTail(name: string): string {
  return name.split("-").slice(-2).join("-");
}

type AiLinuxPackage = {
  readonly label: string;
  readonly deb: string;
  readonly tarball: string;
};

function macGuide(dmg: string): AiGuideSystem {
  return {
    key: "mac",
    label: "Mac",
    needs: [
      "Apple silicon (M1 or later). Macs with Intel processors can't run it.",
      "macOS 13.3 or later.",
      "0.2 GB for the app, and room for models: 0.6 GB to over 100 GB each.",
    ],
    steps: [
      {
        text: `Open \`${dmg}\`.`,
        result: "A window shows **6529 AI** and **Applications**.",
      },
      {
        text: "Drag **6529 AI** onto **Applications**, then eject the disk image.",
      },
      {
        text: "Open **6529 AI** from Applications.",
        result:
          "macOS asks whether you're sure you want to open an app from the internet. Choose **Open**.",
      },
      {
        text: "Choose **Alone**. Pick *Beside a validator* only if this Mac runs a 6529 validator.",
        screenshot: "placement",
        result:
          "macOS says 6529 AI added a background item. Your browser opens the 6529 AI page, signed in.",
      },
    ],
    openAgain: {
      text: "Open **6529 AI** from Applications. It runs while you're logged in.",
    },
    log: { label: "Log file", code: "~/Library/Logs/6529-ai.log" },
    uninstall: {
      text: "Run this in Terminal, then drag 6529 AI to the Trash. Add `--data` to delete your models too.",
      code: [
        {
          label: "Terminal",
          code: '"/Applications/6529 AI.app/Contents/Resources/uninstall.sh"',
        },
      ],
    },
  };
}

function windowsGuide(
  release: AiRelease | undefined,
  setup: string
): AiGuideSystem {
  return {
    key: "windows",
    label: "Windows",
    needs: [
      "Windows 10 version 1809 or later, or Windows 11, 64-bit. Windows on ARM can't run it.",
      "An Intel or AMD processor with AVX2: Intel since 2013, AMD since 2015.",
      "0.4 GB for the app, and room for models: 0.6 GB to over 100 GB each.",
      "For the GPU, its maker's current driver. Without one, models run on the processor.",
    ],
    steps: [
      windowsOpenStep(release, setup),
      {
        text: "Keep the folder it suggests.",
        result: "`" + String.raw`C:\Program Files\6529 AI` + "`",
      },
      {
        text: "Choose **No: 6529 AI alone on this computer**. Pick *Yes* only if this computer runs a 6529 validator.",
      },
      {
        text: "Keep its choice of where models run.",
        result:
          "**On the GPU, through Vulkan** when your GPU's driver has Vulkan, otherwise **On the CPU only**.",
      },
      {
        text: "Choose **Install**, then **Finish** with **Open the 6529 AI page** ticked.",
        result:
          "It takes under a minute. Your browser opens the 6529 AI page, signed in.",
      },
    ],
    openAgain: {
      text: "Choose **6529 AI** in the Start menu. It runs whenever the computer is on.",
    },
    log: {
      label: "Log file",
      code: String.raw`%LOCALAPPDATA%\6529-ai\logs\6529-ai.log`,
    },
    uninstall: {
      text: "Open **Settings**, **Apps**, choose **6529 AI** and **Uninstall**. It asks whether to delete your models too.",
    },
  };
}

function linuxGuide(linux: readonly AiLinuxPackage[]): AiGuideSystem {
  return {
    key: "linux",
    label: "Linux",
    needs: [
      "systemd and glibc 2.34 or later: Ubuntu 22.04, Debian 12, Fedora 35, RHEL 9 or newer.",
      "x86-64 with AVX2, or 64-bit ARM with ARMv8.2: AWS Graviton 2 or later, Ampere Altra, Raspberry Pi 5.",
      "For the CUDA package, NVIDIA's driver 575 or later.",
      "0.3 GB for the app (1.7 GB with CUDA), and room for models.",
    ],
    steps: [
      {
        text: "In the folder you saved it to, install the package for your computer. `uname -m` prints `x86_64` or `aarch64`.",
        code: linux.map((row) => ({
          label: `${row.label} · ${debTail(row.deb)}`,
          code: `sudo apt install ./${row.deb}`,
        })),
        result:
          "apt asks whether a 6529 validator runs on this computer. Choose **alone**. Pick *validator* only if this computer runs one.",
      },
      {
        text: "Wait for the sign-in link.",
        result:
          "The install starts the service and prints a sign-in link, like this:",
        example: "http://127.0.0.1:<port>/login?token=…",
      },
      {
        text: "Open the link in a browser on this computer.",
        result:
          "The 6529 AI page, signed in. The link works once, within 24 hours.",
      },
    ],
    openAgain: {
      text: "For a new sign-in link:",
      code: [
        {
          label: "Terminal",
          code: "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print",
        },
      ],
    },
    log: { label: "Terminal", code: "journalctl -u 6529-ai" },
    uninstall: {
      text: "Remove keeps your models and settings; purge deletes them. Use `6529-ai-cuda` for the CUDA package.",
      code: [
        { label: "Keep models", code: "sudo apt remove 6529-ai" },
        { label: "Delete models", code: "sudo apt purge 6529-ai" },
      ],
    },
    more: {
      title: "Another distribution",
      step: {
        text: "The `.tar.gz` installs the same files on any Linux with systemd. Download it from **Downloads**, then:",
        code: linux.map((row) => ({
          label: `${row.label} · ${tarballTail(row.tarball)}`,
          code: `tar -xzf ${row.tarball}\nsudo ./${row.tarball.replace(/\.tar\.gz$/, "")}/install.sh`,
        })),
        result:
          "To uninstall, run `sudo /opt/6529-ai/share/uninstall.sh`, with `--purge` to delete your models.",
      },
    },
  };
}

/**
 * The guide for each system, with the newest release's file names, or
 * `<version>` in them while there is none.
 */
export function getAiGuideSystems(
  release: AiRelease | undefined
): readonly AiGuideSystem[] {
  const version = release?.version ?? "<version>";
  const dmg = fileName(
    release,
    "macos-arm64",
    ".dmg",
    `6529-ai-${version}-macos-arm64.dmg`
  );
  const setup = fileName(
    release,
    "windows-x64",
    "-setup.exe",
    `6529-ai-${version}-windows-x64-setup.exe`
  );
  const linux: readonly AiLinuxPackage[] = [
    {
      label: "x86-64",
      deb: fileName(
        release,
        "linux-x86_64-cpu",
        "_amd64.deb",
        `6529-ai_${version}_amd64.deb`
      ),
      tarball: fileName(
        release,
        "linux-x86_64-cpu",
        ".tar.gz",
        `6529-ai-${version}-linux-x86_64-cpu.tar.gz`
      ),
    },
    {
      label: "x86-64, NVIDIA GPU",
      deb: fileName(
        release,
        "linux-x86_64-cuda",
        "_amd64.deb",
        `6529-ai-cuda_${version}_amd64.deb`
      ),
      tarball: fileName(
        release,
        "linux-x86_64-cuda",
        ".tar.gz",
        `6529-ai-${version}-linux-x86_64-cuda.tar.gz`
      ),
    },
    {
      label: "ARM64",
      deb: fileName(
        release,
        "linux-arm64-cpu",
        "_arm64.deb",
        `6529-ai_${version}_arm64.deb`
      ),
      tarball: fileName(
        release,
        "linux-arm64-cpu",
        ".tar.gz",
        `6529-ai-${version}-linux-arm64-cpu.tar.gz`
      ),
    },
  ];

  return [macGuide(dmg), windowsGuide(release, setup), linuxGuide(linux)];
}

/** The first chat, the same on every system. */
export const AI_FIRST_CHAT: readonly AiGuideStep[] = [
  {
    text: "On the 6529 AI page, press **Get started**.",
    result:
      "The **Start** page shows how big a model this computer can run, and models that fit.",
  },
  {
    text: "Press **Fetch and serve** on a model.",
    result:
      "The row says **Fetching** while it downloads, then **Serving** when it's ready.",
  },
  {
    text: "Press **Open chat**, pick the model, and send a message.",
    result: "The model on this computer answers. Chats stay in this browser.",
  },
];
