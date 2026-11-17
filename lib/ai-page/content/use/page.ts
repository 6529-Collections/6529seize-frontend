import type { AiUseSection } from "./types";

// Sections 2 to 10: the page, from signing in to app keys.

export const AI_USE_PAGE: readonly AiUseSection[] = [
  {
    id: "sign-in-to-the-page",
    title: "Sign in to the page",
    blocks: [
      {
        kind: "p",
        text: "The page answers on 127.0.0.1 only, and signs a browser in with a one-time link. On a Mac, opening **6529 AI** from Applications makes a new link and opens it. The Windows guide says the Start menu's **6529 AI** does the same; we didn't try it. On Linux:",
      },
      {
        kind: "code",
        label: "Terminal",
        code: "sudo -u ai6529 6529-ai-cli --data /var/lib/6529-ai open --print",
      },
      {
        kind: "code",
        label: "Output",
        code: `http://127.0.0.1:43188/login?token=<hidden>
The page is at http://127.0.0.1:43188. This one-time link works once, within 24 hours.
Open it in the browser you use, on this computer.`,
        output: true,
      },
      {
        kind: "p",
        text: "The top bar then says **Signed in**. With no model yet, Chat says **No model to chat with yet.** Press **Get started**.",
      },
      {
        kind: "image",
        image: "30-signed-in-dark",
        alt: "The Chat screen, signed in: No model to chat with yet. Run one on this computer. A Get started button.",
      },
      {
        kind: "p",
        text: "**Signed in** opens this browser's sign-in, an app key for the page, and the theme: **Light**, **Dark**, or **Same as this device**.",
      },
      {
        kind: "image",
        image: "44-browser-and-theme-dark",
        alt: "The Sign-in and app key dialog: signed in, an app key field, the theme choice, and the models on this server.",
      },
      {
        kind: "p",
        text: "A restart of the service signs the browser out, though the dialog says the sign-in lasts 7 days. Make a new link then.",
      },
    ],
  },
  {
    id: "choose-a-model-on-start",
    title: "Choose a model on Start",
    blocks: [
      {
        kind: "p",
        text: 'Start says how big a model this computer can run, and lists up to five general chat models that fit, biggest first. On the L4 it said "NVIDIA L4, 24.2 GB: models up to about 20.5 GB". On the Mac it said "25.8 GB shared with the GPU: models up to about 16.4 GB".',
      },
      {
        kind: "image",
        image: "31-start-dark",
        alt: "Start: Choose a model to run here. NVIDIA L4, 24.2 GB: models up to about 20.5 GB. clef, gemma-4-31b, glm-4.7-flash, gemma-4-26b-a4b and devstral-small-2-24b, each with Fetch and serve.",
      },
      {
        kind: "image",
        image: "17-mac-start",
        alt: "Start on the Mac: 25.8 GB shared with the GPU, models up to about 16.4 GB.",
      },
      {
        kind: "p",
        text: "We chose `gemma-4-26b-a4b`: 15.6 GB, it reads images, and on the L4 it answered at about 73 tokens a second.",
      },
    ],
  },
  {
    id: "fetch-and-serve",
    title: "Fetch and serve",
    blocks: [
      {
        kind: "p",
        text: "Press **Fetch and serve**. The service downloads the model's files from the registry, checks each file's size and SHA-256 against the model's manifest, then starts its engine. The headline says how much has come.",
      },
      {
        kind: "image",
        image: "32-fetching-dark",
        alt: "Start while fetching: gemma-4-26b-a4b is getting ready. Downloading: 2.5 GB of 15.6 GB.",
      },
      {
        kind: "image",
        image: "33-starting-dark",
        alt: "Start while the engine loads: gemma-4-26b-a4b is getting ready. Its files are checked, then its engine starts.",
      },
      {
        kind: "p",
        text: "When the engine is up, the headline says the model **is ready**, and **Open chat** takes you to it. The service serves it again at every start.",
      },
      {
        kind: "image",
        image: "34-ready-dark",
        alt: "Start: gemma-4-26b-a4b is ready. Chat with it now. Open chat.",
      },
      {
        kind: "p",
        text: "On the L4, the 15.6 GB of files came and were checked in 3 minutes 18 seconds, and the engine loaded in 70 seconds from a local NVMe disk. A model close to the computer's memory in size can load much more slowly: see [Known problems](#known-problems).",
      },
      {
        kind: "p",
        text: "If the download fails, the row says **Download failed** with the reason. **Try again** serves it anew, and **Stop serving** drops it.",
      },
    ],
  },
  {
    id: "chat",
    title: "Chat",
    blocks: [
      {
        kind: "p",
        text: "Pick the model at the top, type, and press **Send**. The answer streams in. A model that thinks first shows its reasoning under **Thinking**, folded. Below each answer are the model, its speed and **Copy**.",
      },
      {
        kind: "image",
        image: "40-chat-dark",
        alt: "A chat with gemma-4-26b-a4b: a two-day plan for a weekend in Lisbon, as a list, at 73.1 tokens/s.",
      },
      {
        kind: "p",
        text: "The chat keeps its history, so a follow-up works:",
      },
      {
        kind: "image",
        image: "41-chat-follow-up-dark",
        alt: "The same chat, asked to make day two free: no tickets, no paid food. The model rewrites day two.",
      },
      {
        kind: "p",
        text: "Chats are kept in this browser only. **New chat** starts another, and **System prompt** sets one for this chat.",
      },
      {
        kind: "p",
        text: "On the Mac, the same model answered at 26.4 tokens a second on the M2:",
      },
      {
        kind: "image",
        image: "18-mac-chat",
        alt: "Safari on the Mac: a four-line poem from gemma-4-26b-a4b at 26.4 tokens/s.",
      },
    ],
  },
  {
    id: "ask-about-a-picture",
    title: "Ask about a picture",
    blocks: [
      {
        kind: "p",
        text: "A model marked **reads images** takes pictures in chat. Attach one with the clip, by pasting, or by dropping it on the chat, then ask about it.",
      },
      {
        kind: "image",
        image: "42-vision-attached-dark",
        alt: "A picture of the Earth rising over the Moon attached in chat, with the question: What is in this picture, and where was it taken from?",
      },
      {
        kind: "image",
        image: "43-vision-answer-dark",
        alt: "The answer: the Earth as a blue marble against space, the gray cratered surface of the Moon in front, taken from the Moon looking back.",
      },
      {
        kind: "p",
        text: "The picture is the Earthrise photograph from Apollo 8, by NASA. The page scales large photos down before it sends them.",
      },
    ],
  },
  {
    id: "make-an-image",
    title: "Make an image",
    blocks: [
      {
        kind: "p",
        text: "Image needs an image model. We served `z-image-turbo`, 20.7 GB, from **Models** (section 9). Its size is over the L4's estimate of 20.5 GB, and Models says so; it ran on the L4 with nothing else on the GPU but the speech model.",
      },
      {
        kind: "p",
        text: "Pick the model, describe the image, pick a size and press **Make the image**.",
      },
      {
        kind: "image",
        image: "50-image-empty-dark",
        alt: "The Image screen: Make an image from words. The z-image-turbo model, a description, and the size Square, 1024 x 1024.",
      },
      {
        kind: "image",
        image: "52-image-result-dark",
        alt: "A 1024 by 1024 photograph of a red fox asleep in fresh snow, with Download and Send to chat.",
      },
      {
        kind: "p",
        text: "The first image took 72 seconds, 32 of them to load the model. The next took 15 seconds. **Download** saves it, and **Send to chat** attaches it to a chat. Images stay until you leave the page.",
      },
    ],
  },
  {
    id: "turn-speech-into-text",
    title: "Turn speech into text",
    blocks: [
      {
        kind: "p",
        text: "Speech needs a speech model; we served `whisper-large-v3-turbo`, 0.6 GB. **Record** records from your microphone, and **Choose a file** takes an audio or video file. Then press **Transcribe**.",
      },
      {
        kind: "image",
        image: "55-speech-file-dark",
        alt: "The Speech screen with whisper-large-v3-turbo, an 11-second file loaded in the player, and Transcribe.",
      },
      {
        kind: "image",
        image: "56-speech-text-dark",
        alt: 'The text: "And so, my fellow Americans, ask not what your country can do for you, ask what you can do for your country."',
      },
      {
        kind: "p",
        text: "**Copy the text** copies it, and **Send to chat** puts it in a chat. Speech to text needs ffmpeg. apt installs it with the `.deb`; on a Mac or Windows you install it yourself.",
      },
    ],
  },
  {
    id: "see-what-runs-the-provider-screen",
    title: "See what runs: the Provider screen",
    blocks: [
      {
        kind: "p",
        text: "**Provider** shows what runs on this computer. **Engines** lists each served model and its state, and **This computer** lists what the service read about the machine.",
      },
      {
        kind: "image",
        image: "62-provider-engines-dark",
        alt: "Engines: whisper-large-v3-turbo and z-image-turbo, both Ready.",
      },
      {
        kind: "image",
        image: "63-provider-this-computer-dark",
        alt: "This computer: Linux, x86_64, an AMD EPYC processor, 16.1 GB of memory, an NVIDIA L4 with 24.2 GB.",
      },
      {
        kind: "p",
        text: "**Models** lists every model in the registry. The menu shows the models this install runs, every model, or the ones that make text, images or embeddings. Each row has **Fetch**, which downloads the files only, and **Serve here**, which downloads them and starts the engine. A model too big for the estimate, or one this install can't run, says so.",
      },
      {
        kind: "image",
        image: "64-models-dark",
        alt: "Models in the registry, showing Runs here, with Fetch and Serve here on each model.",
      },
      {
        kind: "image",
        image: "65-models-images-dark",
        alt: "Models showing Images: models that run on pytorch say they can't run here.",
      },
      {
        kind: "image",
        image: "66-models-serve-here-dark",
        alt: "z-image-turbo fetching from Models, with Stop serving, and z-image below it marked bigger than this computer's estimate of 20.5 GB.",
      },
    ],
  },
  {
    id: "make-an-app-key",
    title: "Make an app key",
    blocks: [
      {
        kind: "p",
        text: "Your own programs use the models through the API with an app key. On **Keys**, give the key a name, list the models it may use (empty for every model), the days it lasts (1 to 90), and the web origins that may use it. Press **Make the key**.",
      },
      {
        kind: "image",
        image: "70-keys-dark",
        alt: "Keys: No app keys yet. The Make a key form: Name, Models, Days, Web origins.",
      },
      {
        kind: "image",
        image: "71-key-form-dark",
        alt: "The form filled in: Scripts on this computer, every model, 30 days.",
      },
      {
        kind: "p",
        text: "The page shows the new key once; the service keeps only its SHA-256. Copy it then.",
      },
      {
        kind: "image",
        image: "72-key-made-dark",
        alt: 'Your new key, "Scripts on this computer", with Copy. The key is blurred here after its first characters.',
      },
      {
        kind: "p",
        text: '**Revoke** ends a key at once. The page asks first, in a browser dialog: "Revoke the key "Scripts on this computer"? Apps that use it lose access at once, and a revoked key can\'t be used again." A request with a revoked key gets HTTP 401.',
      },
      {
        kind: "image",
        image: "73-key-revoked-dark",
        alt: "Keys: No key can use this server. The key Scripts on this computer, revoked.",
      },
    ],
  },
];
