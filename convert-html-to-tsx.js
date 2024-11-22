const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const HTMLtoJSX = require("htmltojsx");

const converter = new HTMLtoJSX({
  createClass: false,
});

// Define directories
const exportedHtmlDir = path.join(__dirname, "../exported-site");
const pagesDir = path.join(__dirname, "pages");

// Define patterns to skip (e.g., 404.html, 404/ directory)
const skipPatterns = [
  /^404\.html$/,
  /^404\/$/,
  /^404\//,
  /^404\.htm$/,
  /^404\/.+/,
  /^studio\//,
  /^6529-dubai\//,
  /^6529-puerto-rico\//,
  /^bridge\//,
  /^abc1\//,
  /^abc2\//,
  /^collections\//,
  /^education\//,
  /^privacy-policy\//,
  /^the-hamily-wagmi-allowlist\//,
  /^about\//,
];

// Function to determine if a file or directory should be skipped
const shouldSkip = (relativePath) => {
  return skipPatterns.some((pattern) => pattern.test(relativePath));
};

const cleanStyleString = (styleString) => {
  const mappings = {
    "--awb-bg-size": "background-size",
    "--awb-width-large": "width",
    "--awb-margin-top-large": "margin-top",
    "--awb-spacing-right-large": "padding-right",
    "--awb-margin-bottom-large": "margin-bottom",
    "--awb-spacing-left-large": "padding-left",
    "--awb-border-radius-top-left": "border-top-left-radius",
    "--awb-border-radius-top-right": "border-top-right-radius",
    "--awb-border-radius-bottom-right": "border-bottom-right-radius",
    "--awb-border-radius-bottom-left": "border-bottom-left-radius",
    "--awb-padding-top": "padding-top",
    "--awb-padding-bottom": "padding-bottom",
    "--awb-background-color": "background-color",
    "--awb-flex-wrap": "flex-wrap",
    "-color": "color",
    "--awb-transition": "transition",
    "--awb-inner-bg-box-shadow": "box-shadow",
    "--awb-inner-border-color": "border-color",
    "--awb-inner-border-style": "border-style",
    "--awb-inner-border-width": "border-width",
    "--awb-inner-border-left": "border-left",
    "--awb-inner-border-right": "border-right",
    "--awb-inner-border-top": "border-top",
    "--awb-inner-border-bottom": "border-bottom",
    "--awb-inner-bg-color-hover": "background-color",
    "--awb-inner-border-color-hover": "border-color",
    "--awb-inner-border-style-hover": "border-style",
    "--awb-inner-border-color-hover": "border-color",
    "--awb-border-radius-top-left": "border-top-left-radius",
    "--awb-border-radius-top-right": "border-top-right-radius",
    "--awb-border-radius-bottom-right": "border-bottom-right-radius",
    "--awb-border-radius-bottom-left": "border-bottom-left-radius",
    "--awb-padding-top": "padding-top",
    "--awb-padding-bottom": "padding-bottom",
    "--awb-background-color": "background-color",
    "--awb-flex-wrap": "flex-wrap",
    "--awb-bg-size": "background-size",
    "--awb-width-large": "width",
    "--awb-margin-top-large": "margin-top",
    "--awb-spacing-right-large": "padding-right",
    "--awb-margin-bottom-large": "margin-bottom",
    "--awb-spacing-left-large": "padding-left",
    "--awb-width-medium": "width",
    "--awb-text-color": "color",
  };

  return styleString
    .split(";")
    .map((s) => s.trim())
    .map((s) => {
      const [property, ...valueParts] = s.split(":");
      if (!property || valueParts.length === 0) return "";
      const value = valueParts.join(":").trim();
      return `${mappings[property.trim()] ?? property.trim()}: ${value}`;
    })
    .filter((s) => !s.startsWith("-"))
    .filter(Boolean)
    .join("; ");
};

// Function to generate PascalCase component names
const generateComponentName = (fileName) => {
  return (
    fileName
      .replace(/\.html$/, "")
      .split(/[\s-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "Page"
  );
};

// Function to replace special characters in text nodes (only apostrophes)
const replaceApostrophesInTextNodes = ($) => {
  $("*")
    .contents()
    .each(function () {
      if (this.type === "text") {
        let text = $(this).text();
        text = text.replace(/'/g, "&#39;");
        text = text.replace(/’/g, "&apos;");

        $(this).replaceWith(text);
      }
    });
};

// Function to process HTML files
const processHtmlFiles = (dir, relativePath = "") => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const currentRelativePath = path.join(relativePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (shouldSkip(currentRelativePath)) {
        console.log(`Skipping directory: ${currentRelativePath}`);
        return;
      }
      processHtmlFiles(fullPath, currentRelativePath);
    } else if (file.endsWith(".html")) {
      if (relativePath === "" && file.toLowerCase() === "index.html") {
        console.log(`Skipping top-level index.html`);
        return;
      }

      if (shouldSkip(currentRelativePath)) {
        console.log(`Skipping file: ${currentRelativePath}`);
        return;
      }

      const componentName = generateComponentName(file);
      const tsxFilePath = path.join(
        pagesDir,
        relativePath,
        `${path.basename(file, ".html")}.tsx`
      );
      fs.mkdirSync(path.dirname(tsxFilePath), { recursive: true });

      let htmlContent = fs.readFileSync(fullPath, "utf8");
      const $ = cheerio.load(htmlContent);

      // Remove unwanted elements
      $("header").remove();
      $("footer").remove();
      $("div.fusion-footer").remove();
      $("nav.fusion-breadcrumbs").remove();

      $("main").attr("style", "min-height: 100vh;padding: 30px;");

      // Clean style attributes
      $("[style]").each((i, elem) => {
        const styleAttr = $(elem).attr("style");
        const cleanedStyle = cleanStyleString(styleAttr);
        if (cleanedStyle.length > 0) {
          $(elem).attr("style", cleanedStyle);
        } else {
          $(elem).removeAttr("style");
        }
      });

      $("[aria-required]").each((i, elem) => {
        $(elem).removeAttr("aria-required");
      });

      $("div").each((i, elem) => {
        $(elem).removeAttr("height");
        $(elem).removeAttr("width");
      });

      // Remove unwanted attributes
      $("[len]").each((i, elem) => {
        $(elem).removeAttr("len");
      });

      $("[alt]").each((i, elem) => {
        const altValue = $(elem).attr("alt");
        if (
          !altValue ||
          altValue === undefined ||
          altValue === null ||
          altValue === ""
        ) {
          $(elem).attr("alt", "6529.io");
        }
      });

      $("img").each((i, elem) => {
        if (!$(elem).attr("alt")) {
          $(elem).attr("alt", "6529.io");
        }
      });

      $("[frame]").each((i, elem) => {
        $(elem).removeAttr("frame");
      });

      $("*[crossorigin], *[crossOrigin]").each((i, elem) => {
        $(elem).removeAttr("crossorigin");
        $(elem).removeAttr("crossOrigin");
      });

      $("[align]").each((i, elem) => {
        const alignValue = $(elem).attr("align");
        if (alignValue) {
          $(elem).attr("align", alignValue.toLowerCase());
        }
      });

      $("[rules]").each((i, elem) => {
        const rulesValue = $(elem).attr("rules");
        if (rulesValue) {
          $(elem).attr("rules", rulesValue.toLowerCase());
        }
      });

      // Replace apostrophes in text nodes
      replaceApostrophesInTextNodes($);
      replaceVideoLinks($);

      let cleanedHtml = $.html();

      // Convert cleaned HTML to JSX
      let jsxContent = converter.convert(cleanedHtml);

      // Replace class with className and for with htmlFor
      jsxContent = jsxContent
        .replace(/class=/g, "className=")
        .replace(/for=/g, "htmlFor=")
        .replace(/<img /g, '<img loading="lazy" ');

      // Replace content={number} with content={"number"}
      jsxContent = jsxContent.replace(
        /content=\{(\d+)\}/g,
        (match, number) => `content={"${number}"}`
      );
      jsxContent = jsxContent.replace(
        /title=\{(\d+)\}/g,
        (match, number) => `title={"${number}"}`
      );

      jsxContent = jsxContent.replace(
        /allowFullScreen="true"/g,
        "allowFullScreen={true}"
      );
      jsxContent = jsxContent.replace(/required="true"/g, "required={true}");
      jsxContent = jsxContent.replace(/autoPlay="true"/g, "autoPlay={true}");
      jsxContent = jsxContent.replace(
        /playsInline="true"/g,
        "playsInline={true}"
      );
      jsxContent = jsxContent.replace(/loop="true"/g, "loop={true}");
      jsxContent = jsxContent.replace(/muted="true"/g, "muted={true}");
      jsxContent = jsxContent.replace(/ defaultValue /g, `defaultValue="true"`);
      jsxContent = jsxContent.replace(/\btabIndex(?=\s|>)/g, "tabIndex={0}");
      jsxContent = jsxContent.replace(/fetchpriority/g, "fetchPriority");
      jsxContent = jsxContent.replace(/controls=\{1\}/g, "controls={true}");
      jsxContent = jsxContent.replace(/controls=\{0\}/g, "controls={false}");
      jsxContent = jsxContent.replace(
        /controls="controls"/g,
        "controls={true}"
      );
      jsxContent = jsxContent.replace(/fontFace:/g, "fontFamily:");

      const componentContent = `
import React from 'react';

const ${componentName} = () => (
  <>
    <div className="tw-w-full tw-h-10 d-flex align-items-center justify-content-center">
      <a href="/" className="font-color decoration-hover-underline">
        Back to 6529.io
      </a>
    </div>
    ${jsxContent}
  </>
);

export default ${componentName};
`.trim();

      fs.writeFileSync(tsxFilePath, componentContent);
      console.log(`Created: ${path.relative(__dirname, tsxFilePath)}\n`);
    }
  });
};

const replaceVideoLinks = ($) => {
  $("a").each((i, elem) => {
    const href = $(elem).attr("href");

    // Check if href contains "videos.files"
    if (href && href.includes("videos.files")) {
      // Create a <video> tag with appropriate attributes
      const videoTag = `
        <video 
          src="${href}" 
          controls 
          autoplay 
          muted 
          playsinline 
          style="max-width: 300px;"
        >
          Your browser does not support the video tag.
        </video>
      `;

      // Replace the content of <a> with the <video> tag
      $(elem).html(videoTag);

      // Optionally remove unnecessary attributes from <a>
      $(elem).removeAttr("data-rel").removeAttr("data-caption");
    }
    $(elem).removeAttr("width").removeAttr("height");
  });
};

processHtmlFiles(exportedHtmlDir);
