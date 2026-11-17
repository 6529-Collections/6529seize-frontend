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
   * What a phone shows instead: a narrower crop of the same file that cuts
   * no line of text, faded at the right where it cuts a field or a box;
   * the app's own phone-width capture; or nothing, where neither reads.
   */
  readonly phone?:
    | { readonly crop: AiCrop; readonly fade: boolean }
    | { readonly image: string }
    | { readonly hidden: true };
  /**
   * Unset for a capture of the app's page, which the page draws in a
   * window frame with a title bar and a zoom. "dialog" is a system dialog
   * with a title bar of its own, and "plain" a picture the app made: both
   * show whole, in a border, with no zoom.
   */
  readonly frame?: "dialog" | "plain";
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
      crop: { x: 745, y: 800, width: 1040, height: 400 },
      fade: false,
    },
  },
  "32-fetching": {
    src: "/ai/use/32-fetching.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 150, y: 190, width: 1650, height: 840 },
    phone: {
      crop: { x: 740, y: 800, width: 1040, height: 220 },
      fade: false,
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
    crop: { x: 760, y: 262, width: 1570, height: 1068 },
    phone: { image: "98-phone-chat-answer" },
  },
  "41-chat-follow-up": {
    src: "/ai/use/41-chat-follow-up.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 755, y: 243, width: 1562, height: 1100 },
    phone: { hidden: true },
  },
  "43-vision-answer": {
    src: "/ai/use/43-vision-answer.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 742, y: 280, width: 1600, height: 1050 },
    phone: { image: "98-phone-chat-reply" },
  },
  "50-image-empty": {
    src: "/ai/use/50-image-empty.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 136, y: 176, width: 1600, height: 1236 },
    phone: { image: "98d-phone-image-form" },
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
    crop: { x: 136, y: 528, width: 1600, height: 1072 },
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
    crop: { x: 742, y: 627, width: 1620, height: 640 },
    phone: {
      crop: { x: 742, y: 627, width: 1080, height: 330 },
      fade: false,
    },
  },
  "71-key-form": {
    src: "/ai/use/71-key-form.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 161, y: 896, width: 1388, height: 704 },
    phone: {
      crop: { x: 161, y: 896, width: 1000, height: 460 },
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
      crop: { x: 174, y: 545, width: 1140, height: 492 },
      fade: false,
    },
  },
  "73-key-revoked": {
    src: "/ai/use/73-key-revoked.webp",
    width: 2560,
    height: 1600,
    scale: 2,
    crop: { x: 140, y: 300, width: 1470, height: 1000 },
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
    crop: { x: 742, y: 358, width: 1620, height: 615 },
    phone: {
      crop: { x: 900, y: 650, width: 1200, height: 320 },
      fade: false,
    },
  },
  "93b-api-python-image-output": {
    src: "/ai/use/93b-api-python-image-output.webp",
    width: 1024,
    height: 1024,
    scale: 2,
    crop: null,
    frame: "plain",
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
    frame: "dialog",
  },
  "29-win-uninstall-data": {
    src: "/ai/use/29-win-uninstall-data.webp",
    width: 414,
    height: 196,
    scale: 1,
    crop: null,
    frame: "dialog",
  },
  "29b-win-uninstall-done": {
    src: "/ai/use/29b-win-uninstall-done.webp",
    width: 384,
    height: 162,
    scale: 1,
    crop: null,
    frame: "dialog",
  },
  "14-mac-first-run": {
    src: "/ai/use/14-mac-first-run.webp",
    width: 904,
    height: 864,
    scale: 2,
    crop: { x: 20, y: 20, width: 864, height: 824 },
    frame: "dialog",
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
    crop: { x: 0, y: 270, width: 780, height: 1080 },
  },
  "98e-phone-speech-text": {
    src: "/ai/use/98e-phone-speech.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 430, width: 780, height: 550 },
  },
  "98-phone-chat-answer": {
    src: "/ai/use/98-phone-chat.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 840, width: 780, height: 520 },
  },
  "98d-phone-image-form": {
    src: "/ai/use/98d-phone-image.webp",
    width: 780,
    height: 1688,
    scale: 2,
    crop: { x: 0, y: 590, width: 780, height: 840 },
  },
} as const satisfies Record<string, AiUseImage>;

export type AiUseImageKey = keyof typeof AI_USE_IMAGES;
