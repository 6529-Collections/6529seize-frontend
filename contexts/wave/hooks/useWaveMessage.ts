import { useState, useEffect } from 'react';
import { useWaveData } from '../MyStreamContext';
import { ApiDrop } from '../../../generated/models/ApiDrop';

/**
 * Hook to access a specific message within a wave
 * Components using this hook will only re-render when the specific message changes
 * 
 * @param waveId The ID of the wave
 * @param messageId The ID of the message within the wave
 * @returns The message data or undefined if not found
 */
export function useWaveMessage(waveId: string, messageId: string): ApiDrop | undefined {
  const waveData = useWaveData(waveId);
  const [message, setMessage] = useState<ApiDrop | undefined>(
    waveData?.messages[messageId]
  );
  
  useEffect(() => {
    if (waveData?.messages[messageId] !== message) {
      setMessage(waveData?.messages[messageId]);
    }
  }, [waveData, messageId, message]);
  
  return message;
}