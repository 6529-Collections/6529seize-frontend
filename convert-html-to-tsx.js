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
  /^about\//,
];

// Function to determine if a file or directory should be skipped
const shouldSkip = (relativePath) => {
  return skipPatterns.some((pattern) => pattern.test(relativePath));
};

// Define class mapping: Fusion class names to Tailwind class names
const classMapping = {
  "fusion-layout-column": "flex flex-col",
  fusion_builder_column: "flex flex-col",
  "fusion-builder-column-0": "flex flex-col",
  fusion_builder_column_1_1: "flex flex-col",
  "1_1": "flex flex-col",
  "fusion-flex-column": "flex flex-col",
  // Add more mappings as needed
};

// Function to map Fusion class names to Tailwind class names
const mapClassNames = (classAttr) => {
  if (!classAttr) return "";
  const classes = classAttr.split(/\s+/);
  const mappedClasses = classes.map((cls) => classMapping[cls] || cls);
  return mappedClasses.join(" ");
};

const cleanStyleString = (styleString) => {
  return styleString
    .split(";")
    .map((s) => s.trim())
    .filter((s) => !s.startsWith("-"))
    .map((s) => {
      const [property, ...valueParts] = s.split(":");
      if (!property || valueParts.length === 0) return "";
      const value = valueParts.join(":").trim();
      return `${property.trim()}: ${value}`;
    })
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

      // Map class names
      $("*[class]").each((i, elem) => {
        const classAttr = $(elem).attr("class");
        const mappedClasses = mapClassNames(classAttr);
        $(elem).attr("class", mappedClasses);
      });

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

processHtmlFiles(exportedHtmlDir);
