"use client";

import Image from "next/image";
import {
  AN_ALTERATION_IMAGE,
  AN_ALTERATION_HEADER,
  AN_ALTERATION_SECTIONS,
  AN_ALTERATION_SUBHEADINGS,
} from "@/lib/artwork-documentation/an-alteration";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationExampleRecord() {
  const { msg } = useDocumentationMessages();
  return (
    <article className="tw-min-w-0">
      <header className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {msg("museum.sampleLabel")}
        </p>
        <h1 className="tw-mb-3 tw-mt-4 tw-font-serif tw-text-4xl tw-font-normal sm:tw-text-6xl">
          {AN_ALTERATION_HEADER[0]}
        </h1>
        <p className="tw-m-0 tw-text-lg tw-text-iron-200">
          {AN_ALTERATION_HEADER[1]}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
          {AN_ALTERATION_HEADER[2]}
        </p>
        <p className="tw-mb-0 tw-mt-6 tw-max-w-prose tw-text-base tw-leading-7 tw-text-iron-300">
          {msg("museum.sampleIntro")}
        </p>
      </header>
      <figure className="tw-mx-0 tw-my-10">
        <Image
          src={AN_ALTERATION_IMAGE}
          alt={msg("museum.sampleImageAlt")}
          width={1536}
          height={1024}
          sizes="(max-width: 800px) 100vw, 1100px"
          className="tw-block tw-h-auto tw-max-h-[80vh] tw-w-full tw-object-contain"
        />
      </figure>
      <div className="tw-grid tw-min-w-0 tw-gap-10 lg:tw-grid-cols-[14rem_minmax(0,1fr)] lg:tw-gap-16">
        <aside className="tw-min-w-0">
          <nav
            aria-label={msg("museum.sample")}
            className="lg:tw-sticky lg:tw-top-8"
          >
            <ol className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
              {AN_ALTERATION_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="tw-block tw-min-h-11 tw-py-3 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-primary-400"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div className="tw-min-w-0 tw-space-y-14">
          <section
            className="tw-max-w-prose tw-border-0 tw-border-y tw-border-solid tw-border-iron-700 tw-py-6"
            aria-labelledby="example-material-status"
          >
            <h2
              id="example-material-status"
              className="tw-m-0 tw-text-base tw-font-medium"
            >
              {msg("museum.sampleMaterials")}
            </h2>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-7 tw-text-iron-300">
              {msg("museum.sampleMaterialsHelp")}
            </p>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-7 tw-text-iron-300">
              {msg("museum.sampleCustody")}
            </p>
          </section>
          {AN_ALTERATION_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="tw-max-w-prose tw-scroll-mt-8"
              aria-labelledby={`${section.id}-title`}
            >
              <h2
                id={`${section.id}-title`}
                className="tw-mb-8 tw-mt-0 tw-font-serif tw-text-3xl tw-font-normal"
              >
                {section.title}
              </h2>
              <div className="tw-space-y-4" lang="en">
                {section.paragraphs.map((paragraph, index) =>
                  AN_ALTERATION_SUBHEADINGS.has(paragraph) ? (
                    <h3
                      key={index}
                      className="tw-mb-0 tw-pt-6 tw-text-base tw-font-medium tw-leading-7 tw-text-iron-100"
                    >
                      {paragraph}
                    </h3>
                  ) : (
                    <p
                      key={index}
                      className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-font-serif tw-text-lg tw-leading-8 tw-text-iron-200"
                    >
                      {paragraph}
                    </p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
