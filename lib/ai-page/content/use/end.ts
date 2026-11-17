import type { AiUseSection } from "./types";

// Sections 13 to 17: stopping a model, the phone width, uninstalling, the known problems and what nobody has tested.

export const AI_USE_END: readonly AiUseSection[] = [
  {
    id: "stop-a-model",
    title: "Stop a model",
    blocks: [
      {
        kind: "p",
        text: "On **Models**, press **Stop serving** on the model. The page asks first. The engine stops and requests for the model fail at once; its files stay on the computer, and **Serve here** starts it again.",
      },
      {
        kind: "image",
        image: "80-stop-ask-dark",
        alt: "Stop serving gemma-4-26b-a4b? Its engine stops, and requests for gemma-4-26b-a4b fail at once. Its files stay on this computer. Keep serving or Stop serving.",
      },
      {
        kind: "image",
        image: "81-stopped-dark",
        alt: "gemma-4-26b-a4b after it stopped: On disk, with Serve here.",
      },
      {
        kind: "p",
        text: "From the command line:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai registry serve z-image-turbo --off",
      },
      {
        kind: "code",
        label: "Output",
        code: "z-image-turbo is no longer served here",
        output: true,
      },
    ],
  },
  {
    id: "on-a-phone-sized-screen",
    title: "On a phone-sized screen",
    blocks: [
      {
        kind: "p",
        text: "The page fits a narrow window: the screens move to a bar at the bottom, and the chat list opens from a button beside the model menu.",
      },
      {
        kind: "image",
        image: "98-phone-chat-dark",
        alt: "Chat at phone width: the picture, the question and the answer, with the screens in a bar at the bottom.",
      },
      {
        kind: "image",
        image: "98b-phone-chat-list-dark",
        alt: "The chat list open at phone width.",
      },
      {
        kind: "image",
        image: "98c-phone-start-dark",
        alt: "Start at phone width: gemma-4-26b-a4b is ready.",
      },
      {
        kind: "image",
        image: "98d-phone-image-dark",
        alt: "Image at phone width.",
      },
      {
        kind: "image",
        image: "98e-phone-speech-dark",
        alt: "Speech at phone width, with the text and Send to chat.",
      },
      {
        kind: "image",
        image: "98f-phone-keys-dark",
        alt: "Keys at phone width.",
      },
      {
        kind: "p",
        text: "The page is only for a browser on the same computer, since it answers on 127.0.0.1. These pictures are the desktop browser at a phone's width.",
      },
    ],
  },
  {
    id: "uninstall",
    title: "Uninstall",
    blocks: [
      {
        kind: "h3",
        id: "uninstall-mac",
        title: "Mac",
      },
      {
        kind: "code",
        label: "Terminal",
        code: '"/Applications/6529 AI.app/Contents/Resources/uninstall.sh"',
      },
      {
        kind: "code",
        label: "Output",
        code: `6529 AI: stopped the service and removed /Users/ec2-user/Library/LaunchAgents/io.6529.ai.plist
6529 AI: kept the data folder /Users/ec2-user/Library/Application Support/6529-ai
6529 AI: now drag 6529 AI from Applications to the Trash`,
        output: true,
      },
      {
        kind: "p",
        text: "Then drag 6529 AI from Applications to the Trash. `--data` deletes the data folder and the log too, with your models; that can't be undone.",
      },
      {
        kind: "h3",
        id: "uninstall-windows",
        title: "Windows",
      },
      {
        kind: "p",
        text: "In Settings, Apps, choose **6529 AI 0.1.0-rc.1** and **Uninstall**. It asks to confirm, removes the programs, the scheduled task and the Start menu entry, then asks whether to delete the data folder. **No** keeps your models for a later install. We ran the same uninstaller, `unins000.exe` in `C:\\Program Files\\6529 AI`, directly.",
      },
      {
        kind: "image",
        image: "28-win-uninstall-ask",
        alt: "6529 AI Uninstall: Are you sure you want to completely remove 6529 AI and all of its components? Yes or No.",
      },
      {
        kind: "image",
        image: "29-win-uninstall-data",
        alt: "Uninstall: Delete the data folder too? It holds your models, your keys and your settings. This can't be undone. Yes or No.",
      },
      {
        kind: "image",
        image: "29b-win-uninstall-done",
        alt: "6529 AI was successfully removed from your computer.",
      },
      {
        kind: "h3",
        id: "uninstall-linux",
        title: "Linux",
      },
      {
        kind: "p",
        text: "`apt remove` stops the service and removes the programs, and keeps the config, the data folder and the user:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "sudo apt remove 6529-ai-cuda",
      },
      {
        kind: "code",
        label: "Output",
        code: `The following packages will be REMOVED:
  6529-ai-cuda
0 upgraded, 0 newly installed, 1 to remove and 6 not upgraded.
After this operation, 1719 MB disk space will be freed.
Do you want to continue? [Y/n] Y
(Reading database ... 165219 files and directories currently installed.)
Removing 6529-ai-cuda (0.1.0~rc.1) ...`,
        output: true,
      },
      {
        kind: "p",
        text: "`apt purge` deletes those too, with your models and keys; that can't be undone:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "sudo apt purge 6529-ai-cuda",
      },
      {
        kind: "code",
        label: "Output",
        code: `The following packages will be REMOVED:
  6529-ai-cuda*
0 upgraded, 0 newly installed, 1 to remove and 6 not upgraded.
After this operation, 0 B of additional disk space will be used.
Do you want to continue? [Y/n] Y
(Reading database ... 165176 files and directories currently installed.)
Purging configuration files for 6529-ai-cuda (0.1.0~rc.1) ...`,
        output: true,
      },
      {
        kind: "p",
        text: "The package is `6529-ai` for the CPU `.deb`. apt leaves ffmpeg and the other packages it installed with 6529 AI; `sudo apt autoremove` removes them.",
      },
    ],
  },
  {
    id: "known-problems",
    title: "Known problems",
    blocks: [
      {
        kind: "p",
        text: "These came up while we made this page, on `0.1.0-rc.1`.",
      },
      {
        kind: "h3",
        id: "known-problems-windows-fetch-and-serve-can-fail-on-a-fresh-windows",
        title: "Windows: Fetch and serve can fail on a fresh Windows",
      },
      {
        kind: "p",
        text: "On two fresh Windows Server 2025 computers, every model failed right after the install with \"error sending request for url\", and the API answered HTTP 502. The registry's address has a Let's Encrypt certificate, and those computers didn't have its root, ISRG Root X1, yet. Windows adds a root only when its own TLS first needs it. The service reads the roots once, when it starts.",
      },
      {
        kind: "p",
        text: "A restart of the service alone didn't help. After PowerShell had reached the registry's address, which made Windows add the root, and the service had restarted, models fetched and served.",
      },
      {
        kind: "p",
        text: "**Workaround.** Open PowerShell as administrator and reach the two Let's Encrypt test sites, which makes Windows add their roots. Then restart the scheduled task **6529 AI**, or the computer. The next build fixes it.",
      },
      {
        kind: "code",
        label: "PowerShell, as administrator",
        code: `Invoke-WebRequest https://valid-isrgrootx1.letsencrypt.org -UseBasicParsing | Out-Null
Invoke-WebRequest https://valid-isrgrootx2.letsencrypt.org -UseBasicParsing | Out-Null
Stop-ScheduledTask -TaskName '6529 AI'
Start-ScheduledTask -TaskName '6529 AI'`,
      },
      {
        kind: "h3",
        id: "known-problems-windows-the-installer-picked-vulkan-on-a-computer-with-no-gpu",
        title: "Windows: the installer picked Vulkan on a computer with no GPU",
      },
      {
        kind: "p",
        text: "The installer picks Vulkan whenever Windows has the Vulkan loader, and Windows Server 2025 has it without a GPU. The models still ran, on the processor: `qwen3-0.6b` answered at 11 tokens a second on a computer with 2 processors.",
      },
      {
        kind: "h3",
        id: "known-problems-linux-a-model-near-the-memory-s-size-loaded-slowly",
        title: "Linux: a model near the memory's size loaded slowly",
      },
      {
        kind: "p",
        text: "The g6.xlarge has 16 GB of memory. There, `gemma-4-26b-a4b`, 15.6 GB, had not loaded after 13 minutes from the computer's network disk, which it read at 7 to 10 MB a second. From a local NVMe disk it loaded in 70 seconds.",
      },
      {
        kind: "h3",
        id: "known-problems-chat-a-long-title-hides-a-chat-s-buttons",
        title: "Chat: a long title hides a chat's buttons",
      },
      {
        kind: "p",
        text: "The first message names the chat. A name wider than the chat list pushes the chat's rename and delete buttons out of sight.",
      },
      {
        kind: "h3",
        id: "known-problems-the-sign-in-ends-when-the-service-restarts",
        title: "The sign-in ends when the service restarts",
      },
      {
        kind: "p",
        text: "The page's dialog says the sign-in lasts 7 days, or until you sign out. A restart of the service, or of the computer, also ends it.",
      },
    ],
  },
  {
    id: "what-nobody-has-tested-yet",
    title: "What nobody has tested yet",
    blocks: [
      {
        kind: "list",
        items: [
          "The Windows installer on Windows 10 or 11, or on a computer with a GPU.",
          "The page on a phone; it answers on 127.0.0.1 only. The phone-width pictures are a desktop browser made narrow.",
          "The Mac on any macOS but 15.8.2, or on any Mac but an M2.",
          "The CUDA packages on any GPU but an NVIDIA L4, and on any Linux but Ubuntu 22.04 and 24.04.",
          "Record, on the Speech screen; we used a file.",
        ],
      },
    ],
  },
];
