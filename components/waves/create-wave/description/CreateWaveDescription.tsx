"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";

import type { DropEditorHandles } from "@/components/drops/create/DropEditor";
import DropEditor from "@/components/drops/create/DropEditor";
import { CreateDropEmojiPickerLayerProvider } from "@/components/waves/CreateDropEmojiPickerLayerContext";
import { profileAndConsolidationsToProfileMin } from "@/helpers/ProfileHelpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CreateDropType } from "@/components/drops/create/types";
import { CreateDropScreenType } from "@/components/drops/create/utils/CreateDropWrapper";
export interface CreateWaveDescriptionHandles {
  requestDrop: () => CreateDropConfig | null;
  getDropSnapshot: () => CreateDropConfig | null;
}

interface CreateWaveDescriptionWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface CreateWaveDescriptionProps {
  readonly profile: ApiIdentity;
  readonly wave: CreateWaveDescriptionWaveProps;
  readonly submitting: boolean;
  readonly showDropError: boolean;
  readonly onHaveDropToSubmitChange: (canSubmit: boolean) => void;
}

const CreateWaveDescription = forwardRef<
  CreateWaveDescriptionHandles,
  CreateWaveDescriptionProps
>(
  (
    { profile, submitting, showDropError, wave, onHaveDropToSubmitChange },
    ref
  ) => {
    const dropEditorRef = useRef<DropEditorHandles | null>(null);
    const profileMin = profileAndConsolidationsToProfileMin({ profile });

    const requestDrop = (): CreateDropConfig | null =>
      dropEditorRef.current?.requestDrop() ?? null;
    const getDropSnapshot = (): CreateDropConfig | null =>
      dropEditorRef.current?.getDropSnapshot() ?? null;

    useImperativeHandle(ref, () => ({
      getDropSnapshot,
      requestDrop,
    }));

    if (!profileMin) {
      // A profile without an id/handle cannot author the description drop.
      // Say so instead of silently rendering a blank step with a dead
      // Complete button.
      return (
        <div>
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
            Description
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-normal tw-text-iron-400">
            A profile handle is required to create a wave. Set up your profile,
            then come back to finish this step.
          </p>
        </div>
      );
    }

    return (
      <div>
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
          Description
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-normal tw-text-iron-400">
          Give a good description of your wave so participants know what you
          expect in this wave. More information, including any content
          moderation parameters, is better than less.
        </p>
        <div className="tw-mt-6">
          <CreateDropEmojiPickerLayerProvider
            desktopZIndex={10000}
            mobileZIndexClassName="tw-z-[10000]"
          >
            <DropEditor
              ref={dropEditorRef}
              waveId={null}
              profile={profileMin}
              quotedDrop={null}
              // The step embeds the editor in the page flow; the MOBILE
              // branch is a modal sheet and must never be used here.
              forceScreenType={CreateDropScreenType.DESKTOP}
              type={CreateDropType.DROP}
              loading={submitting}
              showSubmit={false}
              submitOnEnter={false}
              dropEditorRefreshKey={1}
              showDropError={showDropError}
              wave={wave}
              onSubmitDrop={() => {}}
              onCanSubmitChange={onHaveDropToSubmitChange}
            />
          </CreateDropEmojiPickerLayerProvider>
        </div>
      </div>
    );
  }
);

CreateWaveDescription.displayName = "CreateWaveDescription";
export default CreateWaveDescription;
