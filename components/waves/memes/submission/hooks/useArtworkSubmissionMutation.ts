import { useState } from 'react';
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
 * Interface for tracking file upload progress
 */
export interface UploadingFile {
  file: File;
  isUploading: boolean;
  progress: number;
}

/**
 * Interface for the artwork submission data
 */
interface ArtworkSubmissionData {
  imageFile: File; // Changed from imageUrl to imageFile
  traits: TraitsData;
  waveId: string;
}

/**
 * Upload file with progress tracking
 */
const uploadFileWithProgress = async (
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      resolve(new Response(null, { 
        status: xhr.status,
        statusText: xhr.statusText
      }));
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
};

/**
 * Prepare and upload media file to get a media URL
 */
const uploadMediaFile = async (
  file: File,
  setUploadProgress: (progress: number) => void
): Promise<ApiDropMedia> => {
  try {
    // Step 1: Prepare the upload by getting URLs from the server
    const prep = await commonApiPost<
      {
        content_type: string;
        file_name: string;
        file_size: number;
      },
      {
        upload_url: string;
        content_type: string;
        media_url: string;
      }
    >({
      endpoint: "drop-media/prep",
      body: {
        content_type: file.type,
        file_name: file.name,
        file_size: file.size,
      },
    });

    // Step 2: Upload the file with progress tracking
    const response = await uploadFileWithProgress(
      prep.upload_url,
      file,
      prep.content_type,
      setUploadProgress
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    // Step 3: Return the media object with URL and mime type
    return {
      url: prep.media_url,
      mime_type: prep.content_type,
    };
  } catch (error) {
    throw new Error(
      `Error uploading ${file.name}: ${(error as Error).message}`
    );
  }
};

/**
 * Function to transform form data into API request format
 */
const transformToApiRequest = (
  data: { 
    waveId: string; 
    traits: TraitsData; 
    mediaUrl: string; 
    mimeType: string; 
  }
): ApiCreateDropRequest => {
  const { waveId, traits, mediaUrl, mimeType } = data;
  
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
            url: mediaUrl,
            mime_type: mimeType
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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mutation for the API submission
  const mutation = useMutation<
    ApiDrop, // Response type
    Error,   // Error type
    { // Variables type
      waveId: string;
      traits: TraitsData;
      mediaUrl: string;
      mimeType: string;
    }
  >({
    mutationFn: async (submissionData) => {
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
      console.log(error);
      setToast({
        message: `Submission failed: ${error.message}`,
        type: 'error'
      });
    }
  });

  // File upload mutation
  const uploadMutation = useMutation<
    ApiDropMedia, // Response type
    Error,       // Error type
    File         // Variables type
  >({
    mutationFn: async (file) => {
      return uploadMediaFile(file, (progress) => {
        setUploadProgress(progress);
      });
    }
  });

  /**
   * Submit the artwork with media upload
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
      if (!data.imageFile) {
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

      // Step 1: Upload the media file
      setToast({
        message: 'Uploading artwork...',
        type: 'info'
      });
      
      const media = await uploadMutation.mutateAsync(data.imageFile);
      
      // Step 2: Submit the drop with the media URL
      setToast({
        message: 'Submitting artwork data...',
        type: 'info'
      });
      
      const result = await mutation.mutateAsync({
        waveId: data.waveId,
        traits: data.traits,
        mediaUrl: media.url,
        mimeType: media.mime_type
      });
      
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
      // Show error toast
      setToast({
        message: `Submission failed: ${(error as Error).message}`,
        type: 'error'
      });
      
      // Call error callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
      
      return null;
    }
  };

  return {
    submitArtwork,
    isSubmitting: mutation.isPending || uploadMutation.isPending,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError || uploadMutation.isError,
    error: mutation.error || uploadMutation.error,
    reset: () => {
      mutation.reset();
      uploadMutation.reset();
      setUploadProgress(0);
    }
  };
}
