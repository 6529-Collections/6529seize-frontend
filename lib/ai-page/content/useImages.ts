// The pictures on the /ai pages, from 6529 AI's walk-through of release
// candidate 1. Each file is WebP at its own full size, which the zoom
// shows; `crop` is the part a page shows, in the file's pixels, and
// `scale` is how many file pixels make one CSS pixel (2 for the 2x
// captures, 1 for the Windows ones). See ops/docs/ai-download-page.md.

export type AiCrop = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type AiUseImage = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly scale: 1 | 2;
  readonly crop: AiCrop | null;
  /**
   * What a phone shows instead: a narrower crop of the same file, faded at
   * the right where it cuts text, or the app's own phone-width capture.
   */
  readonly phone?:
    | { readonly crop: AiCrop; readonly fade: boolean }
    | { readonly image: string };
};

export const AI_USE_IMAGES = {
  "30-signed-in": {
    src: "/ai/use/30-signed-in.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 740, y: 370, width: 1220, height: 420 },
    phone: {
      crop: { x: 760, y: 400, width: 1100, height: 360 },
      fade: false,
    },
  },
  "44-browser-and-theme": {
    src: "/ai/use/44-browser-and-theme.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 627, y: 154, width: 1267, height: 1285 },
    phone: {
      crop: { x: 640, y: 200, width: 900, height: 420 },
      fade: false,
    },
  },
  "31-start": {
    src: "/ai/use/31-start.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 713, y: 515, width: 1670, height: 1085 },
    phone: {
      crop: { x: 745, y: 800, width: 1000, height: 400 },
      fade: true,
    },
  },
  "32-fetching": {
    src: "/ai/use/32-fetching.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 150, y: 190, width: 1650, height: 840 },
    phone: {
      crop: { x: 740, y: 800, width: 1000, height: 220 },
      fade: true,
    },
  },
  "34-ready": {
    src: "/ai/use/34-ready.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 154, y: 179, width: 1638, height: 922 },
    phone: {
      crop: { x: 150, y: 260, width: 1150, height: 330 },
      fade: false,
    },
  },
  "40-chat": {
    src: "/ai/use/40-chat.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 760, y: 250, width: 1570, height: 1080 },
    phone: {
      crop: { x: 775, y: 560, width: 1000, height: 560 },
      fade: true,
    },
  },
  "41-chat-follow-up": {
    src: "/ai/use/41-chat-follow-up.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 755, y: 243, width: 1562, height: 1075 },
    phone: {
      crop: { x: 775, y: 780, width: 1000, height: 460 },
      fade: true,
    },
  },
  "43-vision-answer": {
    src: "/ai/use/43-vision-answer.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 742, y: 294, width: 1550, height: 1000 },
    phone: { image: "98-phone-chat-reply" },
  },
  "50-image-empty": {
    src: "/ai/use/50-image-empty.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 174, y: 205, width: 1516, height: 1165 },
    phone: {
      crop: { x: 200, y: 580, width: 1000, height: 760 },
      fade: true,
    },
  },
  "52-image-result": {
    src: "/ai/use/52-image-result.webp",
    width: 1520,
    height: 1714,
    scale: 2,
    crop: null,
  },
  "56-speech-text": {
    src: "/ai/use/56-speech-text.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 161, y: 589, width: 1516, height: 1011 },
    phone: { image: "98e-phone-speech-text" },
  },
  "62-provider-engines": {
    src: "/ai/use/62-provider-engines.webp",
    width: 1672,
    height: 522,
    scale: 2,
    crop: null,
  },
  "63-provider-this-computer": {
    src: "/ai/use/63-provider-this-computer.webp",
    width: 1672,
    height: 424,
    scale: 2,
    crop: null,
  },
  "64-models": {
    src: "/ai/use/64-models.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 713, y: 550, width: 1670, height: 1050 },
    phone: {
      crop: { x: 740, y: 820, width: 1000, height: 420 },
      fade: true,
    },
  },
  "66-models-serve-here": {
    src: "/ai/use/66-models-serve-here.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 742, y: 627, width: 1588, height: 640 },
    phone: {
      crop: { x: 742, y: 627, width: 1000, height: 330 },
      fade: true,
    },
  },
  "71-key-form": {
    src: "/ai/use/71-key-form.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 161, y: 896, width: 1388, height: 704 },
    phone: {
      crop: { x: 161, y: 896, width: 1000, height: 704 },
      fade: true,
    },
  },
  "72-key-made": {
    src: "/ai/use/72-key-made.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 174, y: 545, width: 1388, height: 492 },
    phone: {
      crop: { x: 174, y: 545, width: 1000, height: 492 },
      fade: true,
    },
  },
  "73-key-revoked": {
    src: "/ai/use/73-key-revoked.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 161, y: 384, width: 1388, height: 896 },
    phone: {
      crop: { x: 161, y: 640, width: 1000, height: 640 },
      fade: true,
    },
  },
  "80-stop-ask": {
    src: "/ai/use/80-stop-ask.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 742, y: 358, width: 1588, height: 615 },
    phone: {
      crop: { x: 930, y: 640, width: 1000, height: 330 },
      fade: true,
    },
  },
  "93b-api-python-image-output": {
    src: "/ai/use/93b-api-python-image-output.webp",
    width: 1024,
    height: 1024,
    scale: 2,
    crop: null,
  },
  "98-phone-chat": {
    src: "/ai/use/98-phone-chat.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "98b-phone-chat-list": {
    src: "/ai/use/98b-phone-chat-list.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "98c-phone-start": {
    src: "/ai/use/98c-phone-start.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "98d-phone-image": {
    src: "/ai/use/98d-phone-image.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "98e-phone-speech": {
    src: "/ai/use/98e-phone-speech.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "98f-phone-keys": {
    src: "/ai/use/98f-phone-keys.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: null,
  },
  "28-win-uninstall-ask": {
    src: "/ai/use/28-win-uninstall-ask.webp",
    width: 423,
    height: 162,
    scale: 1,
    crop: null,
  },
  "29-win-uninstall-data": {
    src: "/ai/use/29-win-uninstall-data.webp",
    width: 414,
    height: 196,
    scale: 1,
    crop: null,
  },
  "29b-win-uninstall-done": {
    src: "/ai/use/29b-win-uninstall-done.webp",
    width: 384,
    height: 162,
    scale: 1,
    crop: null,
  },
  "14-mac-first-run": {
    src: "/ai/use/14-mac-first-run.webp",
    width: 904,
    height: 864,
    scale: 2,
    crop: { x: 20, y: 20, width: 864, height: 824 },
  },
  "98c-phone-start-models": {
    src: "/ai/use/98c-phone-start.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 770, width: 780, height: 690 },
  },
  "98-phone-chat-reply": {
    src: "/ai/use/98-phone-chat.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 230, width: 780, height: 1110 },
  },
  "98e-phone-speech-text": {
    src: "/ai/use/98e-phone-speech.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 430, width: 780, height: 550 },
  },
} as const satisfies Record<string, AiUseImage>;

export type AiUseImageKey = keyof typeof AI_USE_IMAGES;
