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
        image: "80-stop-ask",
        alt: "Stop serving gemma-4-26b-a4b? Its engine stops, and requests for gemma-4-26b-a4b fail at once. Its files stay on this computer. Keep serving or Stop serving.",
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
        image: "98-phone-chat",
        alt: "Chat at phone width: the picture, the question and the answer, with the screens in a bar at the bottom.",
      },
      {
        kind: "image",
        image: "98b-phone-chat-list",
        alt: "The chat list open at phone width.",
      },
      {
        kind: "image",
        image: "98c-phone-start",
        alt: "Start at phone width: gemma-4-26b-a4b is ready.",
      },
      {
        kind: "image",
        image: "98d-phone-image",
        alt: "Image at phone width.",
      },
      {
        kind: "image",
        image: "98e-phone-speech",
        alt: "Speech at phone width, with the text and Send to chat.",
      },
      {
        kind: "image",
        image: "98f-phone-keys",
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
        text: "In Settings, Apps, choose **6529 AI** and **Uninstall**. It asks to confirm, removes the programs, the scheduled task and the Start menu entry, then asks whether to delete the data folder. **No** keeps your models for a later install.",
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
Removing 6529-ai-cuda (<version>) ...`,
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
Purging configuration files for 6529-ai-cuda (<version>) ...`,
        output: true,
      },
      {
        kind: "p",
        text: "The package is `6529-ai` for the CPU `.deb`. apt leaves ffmpeg and the other packages it installed with 6529 AI; `sudo apt autoremove` removes them.",
      },
    ],
  },
];
