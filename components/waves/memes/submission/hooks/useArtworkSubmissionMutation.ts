import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../../auth/Auth';
import { TypeOptions } from 'react-toastify';
import { ApiCreateDropRequest } from '../../../../../generated/models/ApiCreateDropRequest';
import { ApiDropType } from '../../../../../generated/models/ApiDropType';
import { ApiCreateDropPart } from '../../../../../generated/models/ApiCreateDropPart';
import { ApiDropMedia } from '../../../../../generated/models/ApiDropMedia';
import { ApiDrop } from '../../../../../generated/models/ApiDrop';
import { ApiDropMetadata } from '../../../../../generated/models/ApiDropMetadata';
import { commonApiPost } from '../../../../../services/api/common-api';
import { TraitsData } from '../types/TraitsData';

/**
 * Interface for the artwork submission data
 */
interface ArtworkSubmissionData {
  imageUrl: string;
  traits: TraitsData;
  waveId: string;
}

/**
 * Type for the toast notification callback
 */
type ToastNotification = (params: { message: string | React.ReactNode; type: TypeOptions }) => void;

/**
 * Function to transform form data into API request format
 */
const transformToApiRequest = (data: ArtworkSubmissionData): ApiCreateDropRequest => {
  const { imageUrl, traits, waveId } = data;
  
  // Create metadata array from trait data
  const metadata: ApiDropMetadata[] = Object.entries(traits).map(([key, value]) => ({
    data_key: key,
    data_value: value?.toString() || ''
  }));

  // Create the request object
  const request: ApiCreateDropRequest = {
    wave_id: waveId,
    drop_type: ApiDropType.Participatory,
    title: traits.title,
    parts: [
      {
        content: traits.description,
        media: [
          {
            url: imageUrl,
            mime_type: 'image/jpeg' // Detect MIME type based on image data in a real implementation
          }
        ]
      }
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata
  };

  return request;
};

/**
 * Hook for submitting artwork
 */
export function useArtworkSubmissionMutation() {
  const { setToast, requestAuth } = useAuth();

  const mutation = useMutation<
    ApiDrop, // Response type
    Error,   // Error type
    ArtworkSubmissionData // Variables type
  >({
    mutationFn: async (submissionData: ArtworkSubmissionData) => {
      // Ensure user is authenticated
      const { success } = await requestAuth();
      if (!success) {
        throw new Error('Authentication required');
      }

      // Transform data to API format
      const apiRequest = transformToApiRequest(submissionData);

      // Submit to API
      return commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: 'drops/',
        body: apiRequest
      });
    },
    onError: (error) => {
      console.log(error)
      setToast({
        message: `Submission failed: ${error.message}`,
        type: 'error'
      });
    }
  });

  /**
   * Submit the artwork
   */
  const submitArtwork = async (
    data: ArtworkSubmissionData,
    options?: {
      onSuccess?: (data: ApiDrop) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      // Validate required fields
      if (!data.imageUrl) {
        setToast({
          message: 'Please upload an artwork image',
          type: 'error'
        });
        return null;
      }

      if (!data.traits.title) {
        setToast({
          message: 'Please provide a title for your artwork',
          type: 'error'
        });
        return null;
      }

      // Submit the data
      const result = await mutation.mutateAsync(data);
      
      // Show success toast
      setToast({
        message: 'Artwork submitted successfully!',
        type: 'success'
      });
      
      // Call success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      // Call error callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
      return null;
    }
  };

  return {
    submitArtwork,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset
  };
}
