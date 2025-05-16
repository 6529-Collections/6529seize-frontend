"use client";

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export default function ContextTestPage() {
  const { data: queryData, isLoading: isQueryLoading, error: queryError } = useQuery({
    queryKey: ['testQuery'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async fetch
      return 'React Query Test Data Loaded!';
    },
  });

  const { address, isConnected, isConnecting, status } = useAccount();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Context Test Page</h1>
      
      <h2>React Query Test:</h2>
      {isQueryLoading && <p>Loading query data...</p>}
      {queryError && <p>Error loading query data: {queryError.message}</p>}
      {queryData && <p>Data: {queryData}</p>}

      <h2>Wagmi useAccount Test:</h2>
      <p>Status: {status}</p>
      <p>Is Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Is Connecting: {isConnecting ? 'Yes' : 'No'}</p>
      <p>Address: {address ?? 'Not connected'}</p>
    </div>
  );
} 
