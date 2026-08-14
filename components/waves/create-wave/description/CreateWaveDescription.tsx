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
import { MentionSearchScopeProvider } from "@/components/drops/create/lexical/plugins/mentions/MentionSearchScopeContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
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

const CREATE_WAVE_DESCRIPTION_EDITOR_CLASSES =
  "[&_.create-drop-composer-surface]:!tw-border-white/5 [&_.create-drop-composer-surface]:!tw-bg-iron-900 [&_.editor-input-one-liner]:!tw-bg-iron-950 [&_.editor-input-one-liner]:!tw-ring-white/10 desktop-hover:[&_.editor-input-one-liner:hover:not(:focus)]:!tw-ring-white/15 [&_.editor-input-one-liner:focus]:!tw-ring-primary-400 [&_.editor-input-multi-liner]:!tw-bg-iron-950 [&_.editor-input-multi-liner]:!tw-ring-white/10 desktop-hover:[&_.editor-input-multi-liner:hover:not(:focus)]:!tw-ring-white/15 [&_.editor-input-multi-liner:focus]:!tw-ring-primary-400 [&_input:not([type=file])]:!tw-h-11 [&_input:not([type=file])]:!tw-bg-iron-950 [&_input:not([type=file])]:!tw-text-base [&_input:not([type=file])]:!tw-ring-white/10 desktop-hover:[&_input:not([type=file]):hover:not(:focus)]:!tw-ring-white/15 [&_input:not([type=file]):focus]:!tw-ring-primary-400 sm:[&_input:not([type=file])]:!tw-text-sm";

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
    const locale = useBrowserLocale();
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
          <CreateWaveStepHeader
            title={t(locale, "waves.create.description.title")}
            description={t(locale, "waves.create.description.missingProfile")}
          />
        </div>
      );
    }

    return (
      <div>
        <CreateWaveStepHeader
          title={t(locale, "waves.create.description.title")}
          description={t(locale, "waves.create.description.description")}
        />
        <div className="tw-mt-6">
          <CreateDropEmojiPickerLayerProvider
            desktopZIndex={10000}
            mobileZIndexClassName="tw-z-[10000]"
          >
            <MentionSearchScopeProvider visibilityGroupId={visibilityGroupId}>
              <DropEditor
                ref={dropEditorRef}
                className={CREATE_WAVE_DESCRIPTION_EDITOR_CLASSES}
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
            </MentionSearchScopeProvider>
          </CreateDropEmojiPickerLayerProvider>
        </div>
      </div>
    );
  }
);

CreateWaveDescription.displayName = "CreateWaveDescription";
export default CreateWaveDescription;
