# Memes Wave Integration

This document details all changes required to integrate stream auction functionality into the existing memes wave system.

## Component Modifications

### WaveDropCard Component

**Location**: `components/waves/WaveDropCard.tsx`

**Changes Required**:
1. Add stream eligibility indicator
2. Show redirect status for redirected drops
3. Disable voting for redirected drops
4. Add redirect action for eligible drops

```typescript
// New props
interface WaveDropCardProps {
  // ... existing props
  streamEligibility?: StreamEligibility;
  streamRedirect?: StreamRedirect;
}

// Eligibility badge rendering
{streamEligibility?.isEligible && !streamRedirect && (
  <StreamEligibilityBadge
    isAuthor={drop.author_id === currentUser?.id}
    onRedirectClick={() => setShowRedirectModal(true)}
  />
)}

// Voting disabled for redirected drops
const canVote = !streamRedirect && wave.isActive;
```

### WaveDropActions Component

**Location**: `components/waves/WaveDropActions.tsx`

**New Action**: Redirect to Stream
```typescript
{isAuthor && streamEligibility?.isEligible && !streamRedirect && (
  <DropdownMenuItem onClick={handleRedirectToStream}>
    <Target className="mr-2 h-4 w-4" />
    Redirect to Stream Auction
  </DropdownMenuItem>
)}
```

### WaveLeaderboard Component

**Location**: `components/waves/WaveLeaderboard.tsx`

**Changes**:
- Filter out redirected drops from leaderboard calculations
- Add query to exclude redirected drops
- Update ranking logic

```typescript
// Modified query
const getLeaderboardDrops = async (waveId: string) => {
  const drops = await getWaveDrops(waveId);
  
  // Filter out redirected drops
  const redirects = await getStreamRedirects(waveId);
  const redirectedIds = new Set(redirects.map(r => r.drop_id));
  
  return drops.filter(drop => !redirectedIds.has(drop.id));
};
```

## New Components

### StreamEligibilityBadge

**Location**: `components/waves/StreamEligibilityBadge.tsx`

```typescript
interface StreamEligibilityBadgeProps {
  isAuthor: boolean;
  onRedirectClick?: () => void;
}

export function StreamEligibilityBadge({ 
  isAuthor, 
  onRedirectClick 
}: StreamEligibilityBadgeProps) {
  return (
    <div className={cn(
      "absolute top-2 right-2 flex items-center gap-1",
      "bg-stream-primary/10 px-3 py-1 rounded-full",
      isAuthor && "cursor-pointer hover:bg-stream-primary/20"
    )}>
      <Target className="h-4 w-4" />
      <span className="text-sm font-medium">Stream Eligible</span>
      {isAuthor && (
        <ChevronRight className="h-4 w-4 ml-1" />
      )}
    </div>
  );
}
```

### StreamRedirectModal

**Location**: `components/waves/StreamRedirectModal.tsx`

```typescript
interface StreamRedirectModalProps {
  drop: Drop;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function StreamRedirectModal({
  drop,
  onConfirm,
  onCancel
}: StreamRedirectModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const handleConfirm = async () => {
    setIsRedirecting(true);
    try {
      await onConfirm();
    } finally {
      setIsRedirecting(false);
    }
  };
  
  return (
    <Modal>
      {/* Modal content - see UX docs */}
    </Modal>
  );
}
```

## Hooks Integration

### useStreamEligibility Hook

```typescript
export function useStreamEligibility(dropId: string, waveId: string) {
  return useQuery({
    queryKey: ['stream-eligibility', dropId, waveId],
    queryFn: () => getStreamEligibility(dropId, waveId),
    refetchInterval: 60000, // Check every minute
    enabled: !!dropId && !!waveId
  });
}
```

### useStreamRedirect Hook

```typescript
export function useStreamRedirect() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dropId, waveId }: RedirectParams) => 
      redirectToStreamAuction(dropId, waveId),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['wave-drops', variables.waveId]);
      queryClient.invalidateQueries(['stream-eligibility']);
      queryClient.invalidateQueries(['leaderboard', variables.waveId]);
      
      // Show success notification
      toast.success('Drop redirected to stream auction!');
    }
  });
}
```

## Data Flow Changes

### Vote Refund Process

When a drop is redirected:
1. Remove drop from active voting
2. Calculate TDH to refund per voter
3. Process refunds in batch
4. Send notifications to voters

```typescript
async function processVoteRefunds(dropId: string) {
  const votes = await getDropVotes(dropId);
  
  const refunds = votes.map(vote => ({
    user_id: vote.user_id,
    amount: vote.tdh_spent,
    reason: 'Drop redirected to stream auction'
  }));
  
  await batchRefundTDH(refunds);
  await notifyVoters(dropId, 'redirect');
}
```

### Activity Feed Integration

Post to wave when redirect happens:
```typescript
async function postRedirectActivity(
  drop: Drop,
  waveId: string,
  auctionUrl: string
) {
  const content = `🎯 @${drop.author_handle} redirected "${drop.title}" to a 1/1 stream auction!\n\nOriginal support: ${drop.vote_count} votes`;
  
  await createWavePost({
    wave_id: waveId,
    content,
    media_url: drop.media_url,
    metadata: {
      type: 'stream_redirect',
      auction_url: auctionUrl,
      original_votes: drop.vote_count
    }
  });
}
```

## State Management

### Redux Integration

```typescript
// New slice for stream auction state
interface StreamAuctionState {
  eligibilities: Record<string, StreamEligibility>;
  redirects: Record<string, StreamRedirect>;
  redirecting: boolean;
}

const streamAuctionSlice = createSlice({
  name: 'streamAuction',
  initialState,
  reducers: {
    setEligibility: (state, action) => {
      state.eligibilities[action.payload.dropId] = action.payload.eligibility;
    },
    setRedirect: (state, action) => {
      state.redirects[action.payload.dropId] = action.payload.redirect;
    }
  }
});
```

## Testing Considerations

### Unit Tests
- Eligibility badge visibility logic
- Redirect modal behavior
- Voting disabled for redirected drops
- Leaderboard filtering

### Integration Tests
- Full redirect flow
- Vote refund process
- Activity post creation
- State updates

### E2E Tests
- User journey from eligibility to redirect
- Verify leaderboard updates
- Check notification delivery

## Migration Guide

### Database Migrations
1. Run eligibility table creation
2. Run redirect table creation
3. Backfill eligibility for existing drops (optional)

### Feature Flags
```typescript
const FEATURE_FLAGS = {
  STREAM_AUCTION_ENABLED: process.env.NEXT_PUBLIC_STREAM_AUCTION_ENABLED === 'true',
  STREAM_AUCTION_PHASE: process.env.NEXT_PUBLIC_STREAM_AUCTION_PHASE || 'beta'
};

// Usage
{FEATURE_FLAGS.STREAM_AUCTION_ENABLED && (
  <StreamEligibilityBadge />
)}
```

### Rollout Strategy
1. **Phase 1**: Enable eligibility checking only
2. **Phase 2**: Enable redirect for staff/beta users
3. **Phase 3**: Full rollout with monitoring

---

[Next: Collections integration →](collections.md)  
[Back to architecture →](../04-technical/architecture.md)  
[See UI changes →](../03-user-experience/desktop/memes-wave-changes.md)