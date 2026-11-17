import { command, h3, image, p, printed } from "./blocks";
import type { AiUseSection } from "./types";

// Sections 13 to 17: stopping a model, the phone width, uninstalling, the known problems and what nobody has tested.

export const AI_USE_END: readonly AiUseSection[] = [
  {
    id: "stop-a-model",
    title: "Stop a model",
    blocks: [
      p(
        "On **Models**, press **Stop serving** on the model. The page asks first. The engine stops and requests for the model fail at once; its files stay on the computer, and **Serve here** starts it again."
      ),
      image(
        "80-stop-ask",
        "Stop serving gemma-4-26b-a4b? Its engine stops, and requests for gemma-4-26b-a4b fail at once. Its files stay on this computer. Keep serving or Stop serving."
      ),
      p("From the command line:"),
      command(
        "Terminal",
        "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai registry serve z-image-turbo --off"
      ),
      printed("z-image-turbo is no longer served here"),
    ],
  },
  {
    id: "on-a-phone-sized-screen",
    title: "On a phone-sized screen",
    blocks: [
      p(
        "The page fits a narrow window: the screens move to a bar at the bottom, and the chat list opens from a button beside the model menu."
      ),
      image(
        "98-phone-chat",
        "Chat at phone width: the picture, the question and the answer, with the screens in a bar at the bottom."
      ),
      image("98b-phone-chat-list", "The chat list open at phone width."),
      image(
        "98c-phone-start",
        "Start at phone width: gemma-4-26b-a4b is ready."
      ),
      image("98d-phone-image", "Image at phone width."),
      image(
        "98e-phone-speech",
        "Speech at phone width, with the text and Send to chat."
      ),
      image("98f-phone-keys", "Keys at phone width."),
      p(
        "The page is only for a browser on the same computer, since it answers on 127.0.0.1. These pictures are the desktop browser at a phone's width."
      ),
    ],
  },
  {
    id: "uninstall",
    title: "Uninstall",
    blocks: [
      h3("uninstall-mac", "Mac"),
      command(
        "Terminal",
        '"/Applications/6529 AI.app/Contents/Resources/uninstall.sh"'
      ),
      printed(`6529 AI: stopped the service and removed /Users/ec2-user/Library/LaunchAgents/io.6529.ai.plist
6529 AI: kept the data folder /Users/ec2-user/Library/Application Support/6529-ai
6529 AI: now drag 6529 AI from Applications to the Trash`),
      p(
        "Then drag 6529 AI from Applications to the Trash. `--data` deletes the data folder and the log too, with your models; that can't be undone."
      ),
      h3("uninstall-windows", "Windows"),
      p(
        "In Settings, Apps, choose **6529 AI** and **Uninstall**. It asks to confirm, removes the programs, the scheduled task and the Start menu entry, then asks whether to delete the data folder. **No** keeps your models for a later install."
      ),
      image(
        "28-win-uninstall-ask",
        "6529 AI Uninstall: Are you sure you want to completely remove 6529 AI and all of its components? Yes or No."
      ),
      image(
        "29-win-uninstall-data",
        "Uninstall: Delete the data folder too? It holds your models, your keys and your settings. This can't be undone. Yes or No."
      ),
      image(
        "29b-win-uninstall-done",
        "6529 AI was successfully removed from your computer."
      ),
      h3("uninstall-linux", "Linux"),
      p(
        "`apt remove` stops the service and removes the programs, and keeps the config, the data folder and the user:"
      ),
      command("Terminal", "sudo apt remove 6529-ai-cuda"),
      printed(`The following packages will be REMOVED:
  6529-ai-cuda
0 upgraded, 0 newly installed, 1 to remove and 6 not upgraded.
After this operation, 1719 MB disk space will be freed.
Do you want to continue? [Y/n] Y
(Reading database ... 165219 files and directories currently installed.)
Removing 6529-ai-cuda (<deb-version>) ...`),
      p(
        "`apt purge` deletes those too, with your models and keys; that can't be undone:"
      ),
      command("Terminal", "sudo apt purge 6529-ai-cuda"),
      printed(`The following packages will be REMOVED:
  6529-ai-cuda*
0 upgraded, 0 newly installed, 1 to remove and 6 not upgraded.
After this operation, 0 B of additional disk space will be used.
Do you want to continue? [Y/n] Y
(Reading database ... 165176 files and directories currently installed.)
Purging configuration files for 6529-ai-cuda (<deb-version>) ...`),
      p(
        "The package is `6529-ai` for the CPU `.deb`. apt leaves ffmpeg and the other packages it installed with 6529 AI; `sudo apt autoremove` removes them."
      ),
    ],
  },
];
