import React from 'react';

export type SubmissionPhase = 'idle' | 'uploading' | 'signing' | 'processing' | 'success' | 'error';

interface SubmissionProgressProps {
  readonly phase: SubmissionPhase;
  readonly progress: number;
  readonly fileInfo?: {
    name: string;
    size: number;
  } | null;
  readonly error?: string;
}

/**
 * Formats file size in a human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Displays context-aware progress visualization for artwork submission
 * Follows a subtle, professional design that provides feedback without disruption
 */
const SubmissionProgress: React.FC<SubmissionProgressProps> = ({
  phase,
  progress,
  fileInfo,
  error
}) => {
  // Don't render anything in idle state
  if (phase === 'idle') return null;

  // Get phase-specific status message
  const getMessage = (): string => {
    switch (phase) {
      case 'uploading':
        if (fileInfo) {
          return `Uploading ${fileInfo.name} (${formatFileSize(fileInfo.size)})`;
        }
        return 'Uploading artwork...';
      case 'signing':
        return 'Signing submission...';
      case 'processing':
        return 'Processing submission...';
      case 'success':
        return 'Submission complete!';
      case 'error':
        return error || 'Submission failed';
      default:
        return '';
    }
  };

  // Get phase-specific styling
  const getProgressBarColor = (): string => {
    switch (phase) {
      case 'uploading':
        return 'tw-bg-blue-500';
      case 'signing':
        return 'tw-bg-yellow-500';
      case 'processing':
        return 'tw-bg-purple-500';
      case 'success':
        return 'tw-bg-green-500';
      case 'error':
        return 'tw-bg-red-500';
      default:
        return 'tw-bg-gray-500';
    }
  };

  // Calculate width based on progress and phase
  const getProgressWidth = (): string => {
    if (phase === 'signing') return '75%';
    if (phase === 'processing') return '90%';
    if (phase === 'success') return '100%';
    if (phase === 'error') return '100%';
    return `${Math.min(Math.max(progress, 0), 100)}%`;
  };

  return (
    <div 
      className="tw-w-full tw-my-4 tw-transition-all tw-duration-300 tw-ease-in-out"
      data-testid="submission-progress"
    >
      <div className="tw-text-sm tw-text-gray-300 tw-mb-1 tw-flex tw-justify-between tw-items-center">
        <span>{getMessage()}</span>
        {phase === 'uploading' && (
          <span className="tw-text-xs tw-text-gray-400">{progress}%</span>
        )}
      </div>
      
      <div className="tw-w-full tw-h-1 tw-bg-iron-800 tw-rounded-full tw-overflow-hidden">
        <div 
          className={`tw-h-full ${getProgressBarColor()} tw-transition-all tw-duration-300 tw-ease-in-out`}
          style={{ width: getProgressWidth() }}
        />
      </div>
    </div>
  );
};

export default React.memo(SubmissionProgress);