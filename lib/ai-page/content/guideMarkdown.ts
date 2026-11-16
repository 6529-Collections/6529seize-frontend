import type { AiRelease, AiSystem } from "../releaseFeed";

// Built from 6529 AI's own install guides (its docs/install/macos.md,
// windows.md, linux.md and getting-started.md), cut to what a person needs
// to install it and chat. en-US only for now; see
// ops/docs/ai-download-page.md.

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

/**
 * The Windows installer's first step. Its publisher comes from the feed;
 * while there is no release, the step names none.
 */
function windowsOpenStep(
  release: AiRelease | undefined,
  setup: string
): string {
  const installer = release?.files.find((file) => file.name === setup);
  const open = `Open \`${setup}\`.`;
  if (!installer) {
    return `${open} Let it make changes to your computer.`;
  }
  if (installer.signed) {
    return `${open} Windows asks whether to let it make changes to your computer: check that it names the verified publisher **${installer.signed}**, then choose **Yes**.`;
  }
  return `${open} It isn't signed, so Windows SmartScreen says "Windows protected your PC". Choose **More info**, check that the file name is the one you checked, then **Run anyway**, and let it make changes to your computer.`;
}

/**
 * The guide: what you need, the install on each system, and the first
 * chat. Release candidate 1 runs models on the person's own computer only
 * and hides the network, so the guide leaves the network out. File names
 * come from the newest release, or read `<version>` while there is none.
 */
export function getAiGuideMarkdown(release: AiRelease | undefined): string {
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
  const deb = fileName(
    release,
    "linux-x86_64-cpu",
    "_amd64.deb",
    `6529-ai_${version}_amd64.deb`
  );
  const cudaDeb = fileName(
    release,
    "linux-x86_64-cuda",
    "_amd64.deb",
    `6529-ai-cuda_${version}_amd64.deb`
  );
  const armDeb = fileName(
    release,
    "linux-arm64-cpu",
    "_arm64.deb",
    `6529-ai_${version}_arm64.deb`
  );
  const tarball = (system: AiSystem) =>
    fileName(release, system, ".tar.gz", `6529-ai-${version}-${system}.tar.gz`);
  // Each Linux package, with the commands that install it.
  const linux = [
    {
      computer: "x86-64 with an NVIDIA GPU",
      deb: cudaDeb,
      tarball: tarball("linux-x86_64-cuda"),
    },
    {
      computer: "x86-64 without one",
      deb,
      tarball: tarball("linux-x86_64-cpu"),
    },
    {
      computer: "64-bit ARM",
      deb: armDeb,
      tarball: tarball("linux-arm64-cpu"),
    },
  ];
  const table = linux
    .map((row) => `| ${row.computer} | \`${row.deb}\` | \`${row.tarball}\` |`)
    .join("\n");
  const aptCommands = linux
    .map((row) => `# ${row.computer}\nsudo apt install ./${row.deb}`)
    .join("\n");
  const tarballCommands = linux
    .map((row) => {
      const folder = row.tarball.replace(/\.tar\.gz$/, "");
      return `# ${row.computer}\ntar -xzf ${row.tarball}\nsudo ./${folder}/install.sh`;
    })
    .join("\n");

  return `## What you need

- **Mac:** Apple silicon (M1 or later) and macOS 13.3 or later. Macs with Intel processors can't run it.
- **Windows:** Windows 10 version 1809 or later, or Windows 11, on a 64-bit Intel or AMD processor with AVX2 (Intel since 2013, AMD since 2015). Windows on ARM can't run it. A GPU needs its maker's current driver; without one, models run on the processor.
- **Linux:** systemd and glibc 2.34 or later (Ubuntu 22.04, Debian 12, Fedora 35, RHEL 9 or later), on x86-64 with AVX2, or on 64-bit ARM with ARMv8.2 (AWS Graviton 2 or later, Ampere Altra, Raspberry Pi 5). A Raspberry Pi 4 can't run it. An NVIDIA GPU needs driver 575 or later.
- **Disk:** under 2 GB for 6529 AI, and room for the models you run: from 0.6 GB for a small one to over 100 GB for the largest.

Download your system's file from the [download page](/ai), with \`SHA256SUMS\` from the same release, and check it as the page says before you open it.

## On a Mac

1. Open \`${dmg}\`. Its window shows **6529 AI** and **Applications**.
2. Drag **6529 AI** onto **Applications**, then eject the disk image.
3. Open **6529 AI** from Applications. macOS asks whether you are sure you want to open an app from the internet: choose **Open**.
4. 6529 AI asks whether a 6529 validator runs on this Mac too. Choose **Alone**, or **Beside a validator** if one does.
5. macOS says 6529 AI added items that can run in the background: that is its service. Your browser opens the 6529 AI page, signed in.

The service runs while you are logged in. To open the page again, open **6529 AI** from Applications.

To uninstall, run this in Terminal, then drag 6529 AI from Applications to the Trash:

\`\`\`bash
"/Applications/6529 AI.app/Contents/Resources/uninstall.sh"
\`\`\`

It keeps your models and settings for a later install; add \`--data\` to delete them too.

## On Windows

1. ${windowsOpenStep(release, setup)}
2. Keep the folder it suggests.
3. Answer whether a 6529 validator runs on this computer too.
4. Keep its choice of where models run: on the GPU through Vulkan, or on the CPU only.
5. Choose **Install**, leave **Open the 6529 AI page** ticked, and choose **Finish**. Your browser opens the page, signed in.

The service starts with the computer. To open the page again, choose **6529 AI** in the Start menu.

To uninstall, open Settings, Apps, choose **6529 AI** and **Uninstall**. It asks whether to delete your models and settings too.

## On Linux

Choose the package for your computer. \`uname -m\` prints \`x86_64\` or \`aarch64\`.

| Your computer | .deb | .tar.gz |
| --- | --- | --- |
${table}

The \`.deb\` is for Debian, Ubuntu and the systems built on them. In the folder you saved it to, run the one line for your package:

\`\`\`bash
${aptCommands}
\`\`\`

On another system with systemd, take the \`.tar.gz\` from **All files** on the download page, and run the two lines for it:

\`\`\`bash
${tarballCommands}
\`\`\`

Either asks whether a 6529 validator runs on this computer too, then starts the service and prints a sign-in link. Open it in a browser on the same computer. A link works once; for a new one:

\`\`\`bash
sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print
\`\`\`

The service starts with the computer. To uninstall the \`.deb\`, \`sudo apt remove 6529-ai\` (\`6529-ai-cuda\` for the CUDA package) keeps your models and settings, and \`sudo apt purge\` with the same name deletes them too. For the \`.tar.gz\`, run \`sudo /opt/6529-ai/share/uninstall.sh\`, with \`--purge\` to delete them.

## A validator on the same computer

We recommend a separate computer for a 6529 validator. On one computer, an attacker who exploits a flaw in a model's engine can reach the validator's keys, and a busy model can slow the validator's votes. If you run both, answer that a validator runs there: 6529 AI then runs below normal priority, so the validator's work goes first.

## Your first chat

1. On the page, press **Get started**. **Start** shows how big a model this computer can run, and models that fit.
2. Press **Fetch and serve** on a model. \`qwen3-4b-gguf\`, 2.5 GB, is a good first one. The row says **Serving** when it is ready.
3. Press **Open chat**, pick the model, type, and press **Send**. Chats stay in this browser only.

The page and its API listen on this computer only, on 127.0.0.1, so other computers can't reach them. Other programs on this computer can use your models through the OpenAI-compatible API at \`/v1\`, with an app key from **Keys**.
`;
}
