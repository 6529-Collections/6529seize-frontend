import React from 'react';
import { ApiWave } from '../../../../../generated/models/ApiWave';

interface WaveDropCreateProps {
  readonly wave: ApiWave;
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
}

export const WaveDropCreate: React.FC<WaveDropCreateProps> = ({
  wave,
  onCancel,
  onSuccess,
}) => {
  return (
    <div className="tw-mt-6 tw-bg-iron-900 tw-rounded-lg tw-p-6">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h3 className="tw-text-xl tw-font-semibold tw-text-iron-200">Create New Drop</h3>
        <button
          onClick={onCancel}
          className="tw-text-iron-400 hover:tw-text-iron-200 tw-transition-colors"
        >
          <svg className="tw-w-5 tw-h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Add your form fields here */}
      <div className="tw-space-y-4">
        {/* Form implementation will go here */}
      </div>

      <div className="tw-flex tw-justify-end tw-gap-4 tw-mt-6">
        <button
          onClick={onCancel}
          className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-bg-iron-800 tw-rounded-lg hover:tw-bg-iron-700 tw-transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSuccess}
          className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-primary-500 tw-rounded-lg hover:tw-bg-primary-600 tw-transition-colors"
        >
          Create Drop
        </button>
      </div>
    </div>
  );
}; 