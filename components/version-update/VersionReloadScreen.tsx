import { VERSION_RELOAD_MESSAGES } from "@/i18n/messages/new-version-toast";
import { VERSION_RELOAD_SCREEN_ID } from "./versionReload";
import { VERSION_RELOAD_IMAGE_DATA } from "./versionReloadImage";

// Inline styles keep reload feedback independent of the incoming CSS/JS bundles.
export const VERSION_RELOAD_STYLES = `
#version-reload-screen{display:none}
html[data-version-reload] #version-reload-screen{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#080a09;color:#f1f2f2;font-family:Arial,sans-serif;text-align:center;padding:16px;box-sizing:border-box;outline:none}
html[data-version-reload] body>:not(#version-reload-screen){visibility:hidden}
#version-reload-screen img{width:60px;height:60px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(49,205,105,.18))}
#version-reload-screen p{margin:24px 0 20px;font-size:clamp(12px,4vw,16px);font-weight:500;line-height:1.5;white-space:nowrap;max-width:100%}
#version-reload-screen [data-reload-locale]{display:none}
${Object.keys(VERSION_RELOAD_MESSAGES)
  .map(
    (locale) =>
      `html[data-version-reload-locale="${locale}"] #version-reload-screen [data-reload-locale="${locale}"]{display:block}`
  )
  .join("\n")}
#version-reload-screen .version-reload-dots{display:flex;gap:9px}
#version-reload-screen .version-reload-dots span{width:6px;height:6px;border-radius:50%;background:#75c96c;opacity:.3;animation:version-reload-dot 1.4s ease-in-out infinite}
#version-reload-screen .version-reload-dots span:nth-child(2){animation-delay:.18s}
#version-reload-screen .version-reload-dots span:nth-child(3){animation-delay:.36s}
@keyframes version-reload-dot{0%,70%,100%{opacity:.3}35%{opacity:1}}
@media(prefers-reduced-motion:reduce){#version-reload-screen .version-reload-dots span{animation:none;opacity:.65}}
`;

export default function VersionReloadScreen() {
  return (
    <div
      id={VERSION_RELOAD_SCREEN_ID}
      role="status"
      aria-live="polite"
      tabIndex={-1}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Inline artwork must arrive with the cover HTML, without a separate request or client bundle. */}
      <img
        src={VERSION_RELOAD_IMAGE_DATA}
        alt=""
        width={60}
        height={60}
        loading="eager"
        decoding="sync"
      />
      {Object.entries(VERSION_RELOAD_MESSAGES).map(([locale, label]) => (
        <p key={locale} data-reload-locale={locale} lang={locale}>
          {label}
        </p>
      ))}
      <div className="version-reload-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
