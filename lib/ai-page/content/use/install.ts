import type { AiUseSection } from "./types";

// Section 1: the download and the install on each system.

export const AI_USE_INSTALL: readonly AiUseSection[] = [
  {
    id: "download-and-install",
    title: "Download and install",
    blocks: [
      {
        kind: "p",
        text: "The release is at [6529.io/ai](/ai). Download the package for your computer and `SHA256SUMS` from the same release, and check the package before you open it.",
      },
      {
        kind: "h3",
        id: "download-and-install-on-a-mac",
        title: "On a Mac",
      },
      {
        kind: "p",
        text: "You need a Mac with Apple silicon (M1 or later) and macOS 13.3 or later.",
      },
      {
        kind: "steps",
        items: [
          {
            text: "On 6529.io/ai, choose **Download for Mac**.",
            blocks: [
              {
                kind: "image",
                image: "10-mac-download-page",
                alt: "The 6529.io/ai download page in Safari, with the Download for Mac button.",
              },
            ],
          },
          {
            text: "The first time a site downloads a file, Safari asks whether to allow downloads from it. Choose **Allow**.",
            blocks: [
              {
                kind: "image",
                image: "11-mac-allow-downloads",
                alt: 'Safari asks: Do you want to allow downloads on "6529.io"? Cancel or Allow.',
              },
            ],
          },
          {
            text: "In Terminal, in your Downloads folder, check the disk image against `SHA256SUMS`, downloaded from the same release:",
            blocks: [
              {
                kind: "code",
                label: "Terminal",
                code: "shasum -a 256 -c SHA256SUMS --ignore-missing",
              },
              {
                kind: "code",
                label: "Output",
                code: "6529-ai-0.1.0-rc.1-macos-arm64.dmg: OK",
                output: true,
              },
            ],
          },
          {
            text: "Open the disk image and drag **6529 AI** onto **Applications**.",
            blocks: [
              {
                kind: "image",
                image: "12-mac-disk-image",
                alt: "The 6529 AI disk image window, with the 6529 AI app and a link to Applications.",
              },
            ],
          },
          {
            text: "Eject the disk image, then open **6529 AI** from Applications. macOS asks whether to open an app downloaded from the internet, and says Apple checked it for malicious software. Choose **Open**.",
            blocks: [
              {
                kind: "image",
                image: "13-mac-gatekeeper",
                alt: 'macOS asks: "6529 AI" is an app downloaded from the Internet. Are you sure you want to open it? Apple checked it for malicious software and none was detected. Cancel or Open.',
              },
            ],
          },
          {
            text: "6529 AI asks whether a 6529 validator runs on this Mac too. Choose **Alone** unless one does. **Beside a validator** runs 6529 AI below normal priority, and **Quit** sets nothing up.",
            blocks: [
              {
                kind: "image",
                image: "14-mac-first-run",
                alt: "The 6529 AI first-run dialog: does a 6529 validator run on this Mac too? Quit, Beside a validator, or Alone.",
              },
            ],
          },
          {
            text: "macOS says the app added an item that runs in the background: that is the 6529 AI service, which starts whenever you log in. Safari opens the page, signed in.",
            blocks: [
              {
                kind: "image",
                image: "15-mac-background-items",
                alt: 'macOS notification: Background Items Added. "6529 AI" added items that can run in the background.',
              },
              {
                kind: "image",
                image: "16-mac-page-signed-in",
                alt: "Safari showing the 6529 AI page at 127.0.0.1, signed in, beside the Background Items Added notification.",
              },
            ],
          },
        ],
      },
      {
        kind: "h3",
        id: "download-and-install-on-windows",
        title: "On Windows",
      },
      {
        kind: "p",
        text: "You need 64-bit Windows 10 version 1809 or later, Windows 11, or Windows Server 2019 or later, and an account that can install programs.",
      },
      {
        kind: "steps",
        items: [
          {
            text: "Download `6529-ai-0.1.0-rc.1-windows-x64-setup.exe` and `SHA256SUMS`. In PowerShell, in your Downloads folder, compare the two values:",
            blocks: [
              {
                kind: "code",
                label: "PowerShell",
                code: String.raw`Get-FileHash .\6529-ai-0.1.0-rc.1-windows-x64-setup.exe
Select-String windows-x64-setup SHA256SUMS`,
              },
              {
                kind: "code",
                label: "Output",
                code: String.raw`Algorithm Hash                                                             Path
--------- ----                                                             ----
SHA256    5752DA660F5070C2797BF9883370B50F7C6261492D8365FD58550D6953EF02FE C:\Users\demo\Downloads\6529-ai-0.1.0-rc.1-windows-x64-setup.exe

SHA256SUMS:5:5752da660f5070c2797bf9883370b50f7c6261492d8365fd58550d6953ef02fe  6529-ai-0.1.0-rc.1-windows-x64-setup.exe`,
                output: true,
              },
              {
                kind: "p",
                text: "The two values must be the same. If they differ, delete the file and don't run it.",
              },
            ],
          },
          {
            text: "Open the installer. On our test computer Windows first asked whether to run a file from the internet, and named the publisher, 6529 Collection LLC. Choose **Run**.",
            blocks: [
              {
                kind: "image",
                image: "20-win-security-warning",
                alt: "Open File - Security Warning: Do you want to run this file? Publisher: 6529 Collection LLC. Run or Cancel.",
              },
            ],
          },
          {
            text: 'Windows asks whether to let the app make changes. Check that it says **Verified publisher: 6529 Collection LLC**, then choose **Yes**. If it names another publisher, or "Unknown publisher", choose **No**.',
            blocks: [
              {
                kind: "image",
                image: "21-win-uac",
                alt: "User Account Control: 6529 AI Setup. Verified publisher: 6529 Collection LLC. File origin: Downloaded from the Internet. Yes or No.",
              },
            ],
          },
          {
            text: "Keep the folder it suggests, `C:\\Program Files\\6529 AI`, and choose **Next**.",
            blocks: [
              {
                kind: "image",
                image: "22-win-folder",
                alt: String.raw`Setup - 6529 AI 0.1.0-rc.1: Select Destination Location, C:\Program Files\6529 AI.`,
              },
            ],
          },
          {
            text: "**How this computer is used.** Choose whether a 6529 validator runs on this computer too. Keep **No: 6529 AI alone on this computer** unless one does.",
            blocks: [
              {
                kind: "image",
                image: "23-win-placement",
                alt: "Setup: How this computer is used. No: 6529 AI alone on this computer, selected. Yes: 6529 AI beside a validator.",
              },
            ],
          },
          {
            text: "**Where the models run.** Choose **On the GPU, through Vulkan** if your computer has an NVIDIA, AMD or Intel GPU with its maker's driver, and **On the CPU only** if it has none. The installer picks one for you, by whether Windows has the Vulkan loader. Our test computer had no GPU, and the installer still picked Vulkan: see [Known problems](#known-problems).",
            blocks: [
              {
                kind: "image",
                image: "24-win-engines",
                alt: "Setup: Where the models run. On the GPU, through Vulkan, selected. On the CPU only.",
              },
            ],
          },
          {
            text: "Choose **Install**. It took under two minutes on our test computer.",
            blocks: [
              {
                kind: "image",
                image: "25-win-ready",
                alt: String.raw`Setup: Ready to Install, destination C:\Program Files\6529 AI.`,
              },
              {
                kind: "image",
                image: "26-win-installing",
                alt: "Setup: Installing, extracting the files.",
              },
            ],
          },
          {
            text: "Leave **Open the 6529 AI page** ticked and choose **Finish**. Setup opens the page in your browser with a one-time sign-in link. On our fresh Windows, Edge showed its own first-run screens first, and we went no further there.",
            blocks: [
              {
                kind: "image",
                image: "27-win-finish",
                alt: "Setup: Completing the 6529 AI Setup Wizard, with Open the 6529 AI page ticked.",
              },
            ],
          },
        ],
      },
      {
        kind: "p",
        text: "Nobody has run the installer on Windows 10 or 11, or on a computer with a GPU.",
      },
      {
        kind: "h3",
        id: "download-and-install-on-linux",
        title: "On Linux",
      },
      {
        kind: "p",
        text: "The `.deb` is for Debian, Ubuntu and their derivatives. With an NVIDIA GPU on x86_64, use the CUDA package, `6529-ai-cuda_0.1.0-rc.1_amd64.deb`; it needs NVIDIA's driver 575 or later. Without one, use `6529-ai_0.1.0-rc.1_amd64.deb`, or the `arm64` package on 64-bit ARM.",
      },
      {
        kind: "steps",
        items: [
          {
            text: "Download the package and `SHA256SUMS`, and check the package:",
            blocks: [
              {
                kind: "code",
                label: "Terminal",
                code: `curl -LO https://6529.io/ai/download/0.1.0-rc.1/6529-ai-cuda_0.1.0-rc.1_amd64.deb
curl -LO https://6529.io/ai/download/0.1.0-rc.1/SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing`,
              },
              {
                kind: "code",
                label: "Output",
                code: "6529-ai-cuda_0.1.0-rc.1_amd64.deb: OK",
                output: true,
              },
              {
                kind: "image",
                image: "01-linux-download",
                alt: "A terminal: the two downloads, and sha256sum printing 6529-ai-cuda_0.1.0-rc.1_amd64.deb: OK.",
              },
            ],
          },
          {
            text: "For the CUDA package, check the driver:",
            blocks: [
              {
                kind: "code",
                label: "Terminal",
                code: "nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv",
              },
              {
                kind: "code",
                label: "Output",
                code: `name, memory.total [MiB], driver_version
NVIDIA L4, 23034 MiB, 595.112.07`,
                output: true,
              },
            ],
          },
          {
            text: "Install it:",
            blocks: [
              {
                kind: "code",
                label: "Terminal",
                code: "sudo apt install ./6529-ai-cuda_0.1.0-rc.1_amd64.deb",
              },
              {
                kind: "p",
                text: "apt lists what it installs with it, ffmpeg among them, and asks whether to continue. Then it asks whether a 6529 validator runs on this computer too. Keep **alone** unless one does, and press Enter.",
              },
              {
                kind: "image",
                image: "03-linux-apt-question",
                alt: "The package's question in the terminal: Configuring 6529-ai-cuda. alone, selected, or validator.",
              },
            ],
          },
          {
            text: "The install ends by starting the service and printing a one-time sign-in link. Open it in a browser on the same computer. It works once, within 24 hours.",
            blocks: [
              {
                kind: "code",
                label: "Output",
                code: `Setting up 6529-ai-cuda (0.1.0~rc.1) ...
6529 AI: made the system user ai6529
6529 AI: wrote /etc/6529-ai/6529-ai.toml for 6529 AI alone on this computer
6529 AI: started the service: systemctl status 6529-ai shows it, journalctl -u 6529-ai its log
6529 AI: open this link in a browser on this computer to sign in to the page:
http://127.0.0.1:43188/login?token=<hidden>
The page is at http://127.0.0.1:43188. This one-time link works once, within 24 hours.
Open it in the browser you use, on this computer.
6529 AI: for a new link later: sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print`,
                output: true,
              },
              {
                kind: "image",
                image: "04-linux-installed",
                alt: "The end of the install in the terminal, with the sign-in link; its token is hidden here.",
              },
            ],
          },
        ],
      },
    ],
  },
];
