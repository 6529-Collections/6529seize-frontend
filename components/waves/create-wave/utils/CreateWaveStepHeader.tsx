import { CREATE_WAVE_FORM_STYLES } from "./createWaveFormStyles";

export default function CreateWaveStepHeader({
  title,
  description,
}: {
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <header className="tw-space-y-1">
      <h2 className={CREATE_WAVE_FORM_STYLES.stepTitle}>{title}</h2>
      {description ? (
        <p className={CREATE_WAVE_FORM_STYLES.stepDescription}>{description}</p>
      ) : null}
    </header>
  );
}
