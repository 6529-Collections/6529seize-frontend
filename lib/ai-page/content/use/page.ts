import { command, image, note, p, printed } from "./blocks";
import type { AiUseSection } from "./types";

// Sections 2 to 10: the page, from signing in to app keys.

export const AI_USE_PAGE: readonly AiUseSection[] = [
  {
    id: "sign-in-to-the-page",
    title: "Sign in to the page",
    blocks: [
      p(
        "The page answers on 127.0.0.1 only, and signs a browser in with a one-time link. On a Mac, opening **6529 AI** from Applications makes a new link and opens it. On Windows, the Start menu's **6529 AI** does the same. On Linux:"
      ),
      command(
        "Terminal",
        "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print"
      ),
      printed(`http://127.0.0.1:43188/login?token=<hidden>
The page is at http://127.0.0.1:43188. This one-time link works once, within 24 hours.
Open it in the browser you use, on this computer.`),
      p(
        "The top bar then says **Signed in**. With no model yet, Chat says **No model to chat with yet.** Press **Get started**."
      ),
      image(
        "30-signed-in",
        "The Chat screen, signed in: No model to chat with yet. Run one on this computer. A Get started button."
      ),
      p(
        "**Signed in** opens this browser's sign-in, an app key for the page, and the theme: **Light**, **Dark**, or **Same as this device**."
      ),
      image(
        "44-browser-and-theme",
        "The Sign-in and app key dialog: signed in, an app key field, the theme choice, and the models on this server."
      ),
    ],
  },
  {
    id: "choose-a-model-on-start",
    title: "Choose a model on Start",
    blocks: [
      p(
        "Start says how big a model this computer can run, and lists up to five general chat models that fit, biggest first."
      ),
      note(
        "A computer with a 24 GB graphics card gets models up to about 20 GB; a Mac with 24 GB of memory, up to about 16 GB."
      ),
      image(
        "31-start",
        "Start: Choose a model to run here. NVIDIA L4, 24.2 GB: models up to about 20.5 GB. clef, gemma-4-31b, glm-4.7-flash, gemma-4-26b-a4b and devstral-small-2-24b, each with Fetch and serve."
      ),
      p(
        "The pictures here follow `gemma-4-26b-a4b`, a 15.6 GB model that reads images."
      ),
    ],
  },
  {
    id: "fetch-and-serve",
    title: "Fetch and serve",
    blocks: [
      p(
        "Press **Fetch and serve**. The service downloads the model's files from the registry, checks each file's size and SHA-256 against the model's manifest, then starts its engine. The headline says how much has come."
      ),
      image(
        "32-fetching",
        "Start while fetching: gemma-4-26b-a4b is getting ready. Downloading: 2.5 GB of 15.6 GB."
      ),
      p(
        "When the engine is up, the headline says the model **is ready**, and **Open chat** takes you to it. The service serves it again at every start."
      ),
      image(
        "34-ready",
        "Start: gemma-4-26b-a4b is ready. Chat with it now. Open chat."
      ),
      note(
        "A 16 GB model takes a few minutes to download and about a minute to load from a fast disk. A model about as big as the computer's memory can load much more slowly: see [Known issues](/ai/known-issues)."
      ),
      p(
        "If the download fails, the row says **Download failed** with the reason. **Try again** serves it anew, and **Stop serving** drops it."
      ),
    ],
  },
  {
    id: "chat",
    title: "Chat",
    blocks: [
      p(
        "Pick the model at the top, type, and press **Send**. The answer streams in. A model that thinks first shows its reasoning under **Thinking**, folded. Below each answer are the model, its speed and **Copy**."
      ),
      image(
        "40-chat",
        "A chat with gemma-4-26b-a4b: a two-day plan for a weekend in Lisbon, as a list, at 73.1 tokens/s.",
        "An answer at phone width: Thinking, folded, then three sentences about a photo of the Earth from the Moon, and under them gemma-4-26b-a4b, 70.7 tokens/s and Copy."
      ),
      p("The chat keeps its history, so a follow-up works."),
      image(
        "41-chat-follow-up",
        "The same chat, asked to make day two free: no tickets, no paid food. The model rewrites day two."
      ),
      p(
        "Chats are kept in this browser only. **New chat** starts another, and **System prompt** sets one for this chat."
      ),
      note(
        "On a 24 GB graphics card this model writes a few paragraphs in a few seconds; on an M2 Mac it takes about three times as long."
      ),
    ],
  },
  {
    id: "ask-about-a-picture",
    title: "Ask about a picture",
    blocks: [
      p(
        "A model marked **reads images** takes pictures in chat. Attach one with the clip, by pasting, or by dropping it on the chat, then ask about it."
      ),
      image(
        "43-vision-answer",
        "The answer: the Earth as a blue marble against space, the gray cratered surface of the Moon in front, taken from the Moon looking back."
      ),
      p(
        "The picture is the Earthrise photograph from Apollo 8, by NASA. The page scales large photos down before it sends them."
      ),
    ],
  },
  {
    id: "make-an-image",
    title: "Make an image",
    blocks: [
      p(
        "Image needs an image model, such as `z-image-turbo` (20.7 GB), which you serve from **Models** on the Provider screen ([section 8](#see-what-runs-the-provider-screen))."
      ),
      p(
        "Pick the model, describe the image, pick a size and press **Make the image**."
      ),
      image(
        "50-image-empty",
        "The Image screen: Make an image from words. The z-image-turbo model, a description, and the size Square, 1024 x 1024."
      ),
      image(
        "52-image-result",
        "A 1024 by 1024 photograph of a red fox asleep in fresh snow, with Download and Send to chat."
      ),
      p(
        "**Download** saves it, and **Send to chat** attaches it to a chat. Images stay until you leave the page."
      ),
      note(
        "The first image waits while the model loads, about a minute in all; each one after it takes about 15 seconds."
      ),
    ],
  },
  {
    id: "turn-speech-into-text",
    title: "Turn speech into text",
    blocks: [
      p(
        "Speech needs a speech model, such as `whisper-large-v3-turbo` (0.6 GB). **Record** records from your microphone, and **Choose a file** takes an audio or video file. Then press **Transcribe**."
      ),
      image(
        "56-speech-text",
        'The text: "And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country."'
      ),
      p(
        "**Copy the text** copies it, and **Send to chat** puts it in a chat. Speech to text needs ffmpeg. apt installs it with the `.deb`; on a Mac or Windows you install it yourself."
      ),
    ],
  },
  {
    id: "see-what-runs-the-provider-screen",
    title: "See what runs: the Provider screen",
    blocks: [
      p(
        "**Provider** shows what runs on this computer. **Engines** lists each served model and its state, and **This computer** lists what the service read about the machine."
      ),
      image(
        "62-provider-engines",
        "Engines: whisper-large-v3-turbo and z-image-turbo, both Ready."
      ),
      image(
        "63-provider-this-computer",
        "This computer: Linux, x86_64, an AMD EPYC processor, 16.1 GB of memory, an NVIDIA L4 with 24.2 GB."
      ),
      p(
        "**Models** lists every model in the registry. The menu shows the models this install runs, every model, or the ones that make text, images or embeddings. Each row has **Fetch**, which downloads the files only, and **Serve here**, which downloads them and starts the engine. A model too big for the estimate, or one this install can't run, says so."
      ),
      image(
        "64-models",
        "Models in the registry, showing Runs here, with Fetch and Serve here on each model."
      ),
      image(
        "66-models-serve-here",
        "z-image-turbo fetching from Models, with Stop serving, and z-image below it marked bigger than this computer's estimate of 20.5 GB."
      ),
    ],
  },
  {
    id: "make-an-app-key",
    title: "Make an app key",
    blocks: [
      p(
        "Your own programs use the models through the API with an app key. On **Keys**, give the key a name, list the models it may use (empty for every model), the days it lasts (1 to 90), and the web origins that may use it. Press **Make the key**."
      ),
      image(
        "71-key-form",
        "The form filled in: Scripts on this computer, every model, 30 days."
      ),
      p(
        "The page shows the new key once; the service keeps only its SHA-256. Copy it then."
      ),
      image(
        "72-key-made",
        'Your new key, "Scripts on this computer", with Copy. The key is blurred here after its first characters.'
      ),
      p(
        '**Revoke** ends a key at once. The page asks first, in a browser dialog: "Revoke the key "Scripts on this computer"? Apps that use it lose access at once, and a revoked key can\'t be used again." A request with a revoked key gets HTTP 401.'
      ),
      image(
        "73-key-revoked",
        "Keys: No key can use this server. The key Scripts on this computer, revoked."
      ),
    ],
  },
];
