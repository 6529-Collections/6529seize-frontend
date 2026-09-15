/** Proposal frame v1. Shared verbatim with the backend publisher. */
export type ProposalCardLayout = "portrait" | "landscape";

export interface ProposalCardDocumentInput {
  readonly mediaUrl: string;
  readonly mimeType: string;
  readonly title: string;
  readonly layout: ProposalCardLayout;
}

// Exact paths from public/6529-black.svg, with an explicit black-and-white ground.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="38.3 38.3 115.4 115.4" aria-hidden="true"><rect x="38.3" y="38.3" width="115.4" height="115.4" fill="#fff"/><g fill="#000"><polygon points="38.3 99.4 85.82 99.4 85.82 106.18 38.3 106.18 38.3 112.97 92.6 112.97 92.6 92.6 45.09 92.6 45.09 85.82 146.91 85.82 146.91 92.6 99.4 92.6 99.4 112.97 153.69 112.97 153.69 106.18 106.18 106.18 106.18 99.4 153.69 99.4 153.69 79.03 38.3 79.03 38.3 99.4"/><path d="M38.3,140.12H146.91v6.79H38.3v6.79H153.7V119.76H38.3Zm6.79-13.57H146.91v6.78H45.09Z"/><path d="M153.7,45.09V38.3H38.3V72.24H153.7V51.88H45.09V45.09Zm-6.79,13.58v6.78H45.09V58.67Z"/></g></svg>`;

export const getProposalCardLogoSvg = (): string => LOGO;

export const PROPOSAL_CARD_LABELS = {
  top: "THIS IS A PROPOSAL TO DO SOMETHING.",
  right: "PLEASE JUDGE THE PLAN.",
  bottom: "ARTWORK MAY CHANGE.",
  left: "CECI N’EST PAS UNE CARTE MÈME.",
} as const;

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });

function mediaElement(input: ProposalCardDocumentInput): string {
  const src = escapeHtml(input.mediaUrl);
  const title = escapeHtml(input.title || "Proposal artwork");
  if (input.mimeType.startsWith("image/")) {
    return `<img src="${src}" alt="${title}" decoding="async"/>`;
  }
  if (input.mimeType.startsWith("video/")) {
    return `<video src="${src}" aria-label="${title}" controls playsinline loop preload="metadata"></video>`;
  }
  if (["text/html", "application/xhtml+xml"].includes(input.mimeType)) {
    return `<iframe src="${src}" title="${title}" sandbox="allow-scripts" allow="fullscreen" allowfullscreen credentialless referrerpolicy="no-referrer"></iframe>`;
  }
  throw new Error(
    "Proposal frames support images, videos, and interactive HTML."
  );
}

const edge = (side: string, text: string, language = "en"): string => {
  const message = `<span lang="${language}">${text}<span class="separator" aria-hidden="true"> · </span></span>`;
  return `<div class="edge ${side}" aria-hidden="true"><div class="crawl"><div>${message}${message}</div><div>${message}${message}</div></div></div>`;
};

export function buildProposalCardDocument(
  input: ProposalCardDocumentInput,
  options: { readonly localPreview?: boolean } = {}
): string {
  const url = new URL(input.mediaUrl);
  const isLocalPreview =
    options.localPreview &&
    (url.protocol === "blob:" ||
      /^data:(image|video)\/[a-z0-9.+-]+;base64,/i.test(input.mediaUrl));
  if (
    (!isLocalPreview && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new Error("Proposal artwork must use a secure media URL.");
  }
  if (!["portrait", "landscape"].includes(input.layout)) {
    throw new Error("Choose portrait or landscape.");
  }
  const ratio = input.layout === "portrait" ? "5 / 7" : "7 / 5";
  const width = input.layout === "portrait" ? "71.428571" : "140";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="referrer" content="no-referrer"/>
<meta name="6529-proposal-frame" content="1"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data: blob:; media-src https: data: blob:; frame-src https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"/>
<title>${escapeHtml(input.title)} — proposal card</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#111;color:#111}body{display:grid;place-items:center;overflow:hidden}
.frame{--edge:clamp(20px,3vmin,36px);position:relative;width:min(100vw,${width}vh);width:min(100vw,${width}dvh);aspect-ratio:${ratio};background:#fff;border:1px solid #111;overflow:hidden}
.media{position:absolute;inset:var(--edge);background:#111;overflow:hidden}.media>img,.media>video,.media>iframe{display:block;width:100%;height:100%;border:0;object-fit:contain}
.edge{position:absolute;overflow:hidden;background:#fff;font:600 clamp(10px,1.55vmin,17px)/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em;white-space:nowrap}
.top,.bottom{left:var(--edge);right:var(--edge);height:var(--edge);display:flex;align-items:center}.top{top:0}.bottom{bottom:0}.bottom .crawl{animation-direction:reverse}
.left,.right{top:var(--edge);bottom:var(--edge);width:var(--edge);display:flex;align-items:center;writing-mode:vertical-rl}.left{left:0;transform:rotate(180deg)}.right{right:0}
.crawl{display:flex;width:max-content;animation:travel-x 42s linear infinite}.crawl>div{flex:none;display:flex;align-items:center}.separator{display:inline-block;padding:0 2em}
.left .crawl,.right .crawl{width:auto;height:max-content;animation-name:travel-y}.left .separator,.right .separator{padding:2em 0}
.corner{position:absolute;z-index:2;width:var(--edge);height:var(--edge);padding:3px;border:1px solid #111;background:#fff}.corner svg{display:block;width:100%;height:100%}.tl{top:0;left:0}.tr{top:0;right:0}.bl{bottom:0;left:0}.br{bottom:0;right:0}
button.corner{cursor:pointer;min-width:24px;min-height:24px}button:focus-visible{outline:3px solid #111;outline-offset:-4px}button:hover{background:#ddd}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.paused .crawl{animation-play-state:paused}
@keyframes travel-x{to{transform:translateX(-50%)}}@keyframes travel-y{to{transform:translateY(-50%)}}
@media(prefers-reduced-motion:reduce){.crawl{animation:none}}
</style></head><body><main class="frame" id="frame" aria-label="Proposal card">
<p class="sr-only">This is a proposal to do something. Artwork may change. Please judge the plan. <span lang="fr">Ceci n’est pas une carte mème.</span></p>
<div class="media">${mediaElement(input)}</div>
${edge("top", PROPOSAL_CARD_LABELS.top)}
${edge("right", PROPOSAL_CARD_LABELS.right)}
${edge("bottom", PROPOSAL_CARD_LABELS.bottom)}
${edge("left", PROPOSAL_CARD_LABELS.left, "fr")}
<div class="corner tl">${LOGO}</div><button class="corner tr" type="button" id="motion" aria-label="Pause frame animation" aria-pressed="false" title="Pause frame animation">${LOGO}</button><div class="corner bl">${LOGO}</div><div class="corner br">${LOGO}</div>
</main><script>
const frame=document.getElementById('frame');const motion=document.getElementById('motion');
motion.addEventListener('click',function(){const paused=frame.classList.toggle('paused');motion.setAttribute('aria-pressed',String(paused));const label=paused?'Play frame animation':'Pause frame animation';motion.setAttribute('aria-label',label);motion.title=label;});
</script></body></html>`;
}
