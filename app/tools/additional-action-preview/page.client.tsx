"use client";

import ArtworkDetails from "@/components/waves/memes/submission/details/ArtworkDetails";
import { AdditionalActionSummary } from "@/components/waves/memes/submission/components/AdditionalActionSummary";
import { useState } from "react";
import { useHasHydrated } from "@/hooks/useHasHydrated";

/** Render the real artwork controls with page-local draft state and no submission side effects. */
export default function AdditionalActionPreview() {
  const hasHydrated = useHasHydrated();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [additionalActionPlan, setAdditionalActionPlan] = useState("");
  const [isAdditionalActionPromised, setIsAdditionalActionPromised] =
    useState(false);

  return (
    <section
      aria-labelledby="additional-action-preview-title"
      className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-3xl tw-px-4 tw-py-8 md:tw-px-8"
    >
      <h1
        id="additional-action-preview-title"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100"
      >
        Additional Action — current implementation
      </h1>
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        This local view renders the existing Artwork Details component. Changes
        here stay in this page.
      </p>
      <div className="tw-mt-6 tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-ring-1 tw-ring-iron-800 md:tw-p-6">
        <fieldset
          disabled={!hasHydrated}
          className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
        >
          <ArtworkDetails
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            showRequiredMarkers={true}
            size="sm"
            showAdditionalActionPromised={true}
            isAdditionalActionPromised={isAdditionalActionPromised}
            onAdditionalActionPromisedChange={setIsAdditionalActionPromised}
            additionalActionPlan={additionalActionPlan}
            onAdditionalActionPlanChange={setAdditionalActionPlan}
          />
        </fieldset>
      </div>
      <div className="tw-mt-6">
        <AdditionalActionSummary
          isAdditionalActionPromised={isAdditionalActionPromised}
          plan={additionalActionPlan}
        />
      </div>
    </section>
  );
}
