"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";

import type { DropEditorHandles } from "@/components/drops/create/DropEditor";
import DropEditor from "@/components/drops/create/DropEditor";
import { CreateDropEmojiPickerLayerProvider } from "@/components/waves/CreateDropEmojiPickerLayerContext";
import { profileAndConsolidationsToProfileMin } from "@/helpers/ProfileHelpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CreateDropType } from "@/components/drops/create/types";
import { MentionSearchScopeProvider } from "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext";
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
  readonly visibilityGroupId: string | null;
  readonly onHaveDropToSubmitChange: (canSubmit: boolean) => void;
}

const CreateWaveDescription = forwardRef<
  CreateWaveDescriptionHandles,
  CreateWaveDescriptionProps
>(
  (
    {
      profile,
      submitting,
      showDropError,
      visibilityGroupId,
      wave,
      onHaveDropToSubmitChange,
    },
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
      return null;
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
            <MentionSearchScopeProvider visibilityGroupId={visibilityGroupId}>
              <DropEditor
                ref={dropEditorRef}
                waveId={null}
                profile={profileMin}
                quotedDrop={null}
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
            </MentionSearchScopeProvider>
          </CreateDropEmojiPickerLayerProvider>
        </div>
      </div>
    );
  }
);

CreateWaveDescription.displayName = "CreateWaveDescription";
export default CreateWaveDescription;
