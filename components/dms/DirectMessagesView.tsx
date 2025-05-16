import React from 'react';
import { useMyStream } from '../../contexts/wave/MyStreamContext'; // Adjusted import path
import { MinimalWave } from '../../contexts/wave/hooks/useEnhancedWavesList'; // Re-using MinimalWave for now

interface DirectMessagesViewProps {
  // Props if any will be added later
}

const DirectMessagesView: React.FC<DirectMessagesViewProps> = () => {
  const { directMessages } = useMyStream();

  if (directMessages.isFetching && directMessages.list.length === 0) {
    return (
      <div className="tw-p-4 tw-text-center">
        <p>Loading direct messages...</p>
      </div>
    );
  }

  return (
    <div className="tw-p-4">
      <h1 className="tw-text-xl tw-font-bold tw-mb-4">Direct Messages</h1>
      {directMessages.list.length === 0 && !directMessages.isFetching ? (
        <p>No direct messages found.</p>
      ) : (
        <ul className="tw-space-y-2">
          {directMessages.list.map((dm: MinimalWave) => (
            <li key={dm.id} className="tw-p-2 tw-border tw-border-gray-700 tw-rounded">
              <p className="tw-font-semibold">{dm.name}</p>
              {/* Display other DM details here if needed */}
            </li>
          ))}
        </ul>
      )}
      {directMessages.hasNextPage && (
        <button
          onClick={() => directMessages.fetchNextPage()}
          disabled={directMessages.isFetchingNextPage}
          className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700 disabled:tw-opacity-50"
        >
          {directMessages.isFetchingNextPage ? 'Loading more...' : 'Load More DMs'}
        </button>
      )}
    </div>
  );
};

export default DirectMessagesView; 