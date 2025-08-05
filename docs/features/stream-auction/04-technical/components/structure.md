# Component Structure

This document outlines the React component architecture for the stream auction feature, including component hierarchy, shared components, and state management patterns.

## Component Hierarchy

```
StreamAuctionFeature/
├── pages/
│   ├── StreamAuctionPage.tsx         // Main auction detail page
│   ├── StreamAuctionCreatePage.tsx   // Redirect/creation flow
│   └── StreamAuctionResultsPage.tsx  // Completed auction view
│
├── components/
│   ├── auction/
│   │   ├── StreamAuctionCard.tsx    // Auction preview card
│   │   ├── StreamAuctionDetail.tsx  // Full auction view
│   │   ├── StreamBidHistory.tsx     // Bid list component
│   │   └── StreamCountdown.tsx      // Timer component
│   │
│   ├── bidding/
│   │   ├── StreamBidForm.tsx        // Bid placement form
│   │   ├── StreamQuickBid.tsx       // One-click bid button
│   │   ├── StreamBidModal.tsx       // Bid confirmation modal
│   │   └── StreamBidStatus.tsx      // Current bid display
│   │
│   ├── eligibility/
│   │   ├── StreamEligibilityBadge.tsx    // Visual indicator
│   │   ├── StreamRedirectModal.tsx       // Confirmation dialog
│   │   └── StreamEligibilityTooltip.tsx  // Info tooltip
│   │
│   └── shared/
│       ├── StreamPriceDisplay.tsx    // ETH price formatting
│       ├── StreamUserAvatar.tsx      // Bidder/creator avatar
│       └── StreamMediaPreview.tsx    // Image/video display
```

## Core Components

### StreamAuctionCard

Displays auction summary in grids and lists.

```typescript
interface StreamAuctionCardProps {
  auction: StreamAuction;
  variant?: 'grid' | 'list' | 'compact';
  showQuickBid?: boolean;
  onQuickBid?: (amount: number) => void;
  className?: string;
}

export function StreamAuctionCard({
  auction,
  variant = 'grid',
  showQuickBid = true,
  onQuickBid,
  className
}: StreamAuctionCardProps) {
  const { timeRemaining } = useCountdown(auction.endsAt);
  const { user } = useAuth();
  const isWinning = auction.currentBidder?.id === user?.id;

  return (
    <Card className={cn('stream-auction-card', className)}>
      <CardMedia>
        <StreamMediaPreview 
          url={auction.mediaUrl}
          type={auction.mediaType}
        />
        {isWinning && <WinningBadge />}
      </CardMedia>
      
      <CardContent>
        <AuctionTitle>{auction.title}</AuctionTitle>
        <CreatorInfo user={auction.creator} />
        
        <BidSection>
          <StreamPriceDisplay amount={auction.currentBid} />
          <BidCount>{auction.bidCount} bids</BidCount>
        </BidSection>
        
        <TimeSection>
          <StreamCountdown endTime={auction.endsAt} />
        </TimeSection>
        
        {showQuickBid && (
          <StreamQuickBid
            currentBid={auction.currentBid}
            onBid={onQuickBid}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

### StreamBidForm

Handles bid placement with validation.

```typescript
interface StreamBidFormProps {
  auction: StreamAuction;
  onSuccess?: (bid: Bid) => void;
  onError?: (error: Error) => void;
}

export function StreamBidForm({ 
  auction, 
  onSuccess, 
  onError 
}: StreamBidFormProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { placeBid } = useStreamAuction();
  
  const minimumBid = calculateMinimumBid(auction.currentBid);
  const isValidBid = parseFloat(amount) >= minimumBid;
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidBid) return;
    
    setIsSubmitting(true);
    try {
      const bid = await placeBid(auction.id, parseFloat(amount));
      onSuccess?.(bid);
      setAmount('');
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <BidInput
        value={amount}
        onChange={setAmount}
        minimum={minimumBid}
        disabled={isSubmitting}
      />
      
      <BidValidation>
        {!isValidBid && amount && (
          <ValidationError>
            Minimum bid: {minimumBid} ETH
          </ValidationError>
        )}
      </BidValidation>
      
      <BidButton
        type="submit"
        disabled={!isValidBid || isSubmitting}
        loading={isSubmitting}
      >
        Place Bid
      </BidButton>
    </form>
  );
}
```

### StreamEligibilityBadge

Shows eligibility status on meme cards.

```typescript
interface StreamEligibilityBadgeProps {
  dropId: string;
  waveId: string;
  isAuthor: boolean;
  onRedirect?: () => void;
}

export function StreamEligibilityBadge({
  dropId,
  waveId,
  isAuthor,
  onRedirect
}: StreamEligibilityBadgeProps) {
  const { data: eligibility, isLoading } = useStreamEligibility(dropId, waveId);
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (isLoading || !eligibility?.isEligible) {
    return null;
  }
  
  return (
    <BadgeContainer
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={isAuthor ? onRedirect : undefined}
      clickable={isAuthor}
    >
      <BadgeIcon>
        <Target size={16} />
      </BadgeIcon>
      
      <BadgeText>Stream Eligible</BadgeText>
      
      {isAuthor && (
        <BadgeAction>
          <ChevronRight size={14} />
        </BadgeAction>
      )}
      
      {showTooltip && (
        <StreamEligibilityTooltip
          eligibility={eligibility}
          isAuthor={isAuthor}
        />
      )}
    </BadgeContainer>
  );
}
```

## State Management

### Auction Store

```typescript
// stores/streamAuctionStore.ts
interface StreamAuctionState {
  auctions: Record<string, StreamAuction>;
  activeAuctions: string[];
  userBids: Record<string, Bid[]>;
  eligibilities: Record<string, StreamEligibility>;
  
  // Actions
  setAuction: (auction: StreamAuction) => void;
  updateBid: (auctionId: string, bid: Bid) => void;
  setEligibility: (dropId: string, eligibility: StreamEligibility) => void;
}

export const useStreamAuctionStore = create<StreamAuctionState>((set) => ({
  auctions: {},
  activeAuctions: [],
  userBids: {},
  eligibilities: {},
  
  setAuction: (auction) =>
    set((state) => ({
      auctions: { ...state.auctions, [auction.id]: auction }
    })),
    
  updateBid: (auctionId, bid) =>
    set((state) => ({
      auctions: {
        ...state.auctions,
        [auctionId]: {
          ...state.auctions[auctionId],
          currentBid: bid.amount,
          currentBidder: bid.bidder,
          bidCount: state.auctions[auctionId].bidCount + 1
        }
      }
    })),
    
  setEligibility: (dropId, eligibility) =>
    set((state) => ({
      eligibilities: { ...state.eligibilities, [dropId]: eligibility }
    }))
}));
```

### Custom Hooks

```typescript
// hooks/useStreamAuction.ts
export function useStreamAuction(auctionId: string) {
  const auction = useStreamAuctionStore((state) => state.auctions[auctionId]);
  const setAuction = useStreamAuctionStore((state) => state.setAuction);
  
  const { data, error } = useSWR(
    auctionId ? `/api/auctions/${auctionId}` : null,
    fetcher,
    {
      refreshInterval: 10000, // Poll every 10s
      onSuccess: (data) => setAuction(data)
    }
  );
  
  const placeBid = useCallback(async (amount: number) => {
    const response = await api.placeBid(auctionId, amount);
    setAuction(response.auction);
    return response.bid;
  }, [auctionId, setAuction]);
  
  return {
    auction: auction || data,
    isLoading: !auction && !data && !error,
    error,
    placeBid
  };
}

// hooks/useStreamEligibility.ts
export function useStreamEligibility(dropId: string, waveId: string) {
  const eligibility = useStreamAuctionStore(
    (state) => state.eligibilities[dropId]
  );
  const setEligibility = useStreamAuctionStore(
    (state) => state.setEligibility
  );
  
  const { data, error } = useSWR(
    dropId && waveId ? `/api/drops/${dropId}/stream-eligibility` : null,
    fetcher,
    {
      refreshInterval: 60000, // Check every minute
      onSuccess: (data) => setEligibility(dropId, data)
    }
  );
  
  return {
    data: eligibility || data,
    isLoading: !eligibility && !data && !error,
    error
  };
}
```

## Shared Components

### StreamPriceDisplay

Consistent price formatting across the app.

```typescript
interface StreamPriceDisplayProps {
  amount: number | string;
  showUSD?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreamPriceDisplay({
  amount,
  showUSD = false,
  size = 'md',
  className
}: StreamPriceDisplayProps) {
  const { data: ethPrice } = useETHPrice();
  const formatted = formatETH(amount);
  const usdValue = showUSD && ethPrice 
    ? parseFloat(amount.toString()) * ethPrice 
    : null;
  
  return (
    <PriceContainer className={cn('stream-price', size, className)}>
      <ETHAmount>{formatted} ETH</ETHAmount>
      {usdValue && (
        <USDAmount>${formatUSD(usdValue)}</USDAmount>
      )}
    </PriceContainer>
  );
}
```

### StreamCountdown

Real-time countdown timer.

```typescript
interface StreamCountdownProps {
  endTime: number | Date;
  onComplete?: () => void;
  format?: 'long' | 'short';
}

export function StreamCountdown({
  endTime,
  onComplete,
  format = 'short'
}: StreamCountdownProps) {
  const { timeRemaining, isComplete } = useCountdown(endTime);
  
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);
  
  if (isComplete) {
    return <CountdownComplete>Auction ended</CountdownComplete>;
  }
  
  const { days, hours, minutes, seconds } = timeRemaining;
  
  if (format === 'long') {
    return (
      <CountdownLong>
        {days > 0 && <span>{days}d </span>}
        {hours}h {minutes}m {seconds}s
      </CountdownLong>
    );
  }
  
  return (
    <CountdownShort>
      {days > 0 ? `${days}d ${hours}h` : `${hours}:${pad(minutes)}:${pad(seconds)}`}
    </CountdownShort>
  );
}
```

## Component Testing

### Test Utilities

```typescript
// test-utils/stream-auction.tsx
export function renderWithStreamAuction(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const mockAuction = {
    id: 'test-auction',
    title: 'Test Auction',
    currentBid: 1.5,
    bidCount: 3,
    endsAt: Date.now() + 3600000
  };
  
  return render(
    <StreamAuctionProvider initialAuctions={[mockAuction]}>
      {ui}
    </StreamAuctionProvider>,
    options
  );
}

export const mockStreamAuctionStore = {
  auctions: {},
  setAuction: jest.fn(),
  updateBid: jest.fn()
};
```

## Performance Optimization

### Component Memoization

```typescript
// Memoize expensive components
export const StreamAuctionCard = memo(_StreamAuctionCard, (prev, next) => {
  return (
    prev.auction.id === next.auction.id &&
    prev.auction.currentBid === next.auction.currentBid &&
    prev.auction.bidCount === next.auction.bidCount
  );
});

// Memoize expensive calculations
const minimumBid = useMemo(
  () => calculateMinimumBid(auction.currentBid),
  [auction.currentBid]
);
```

### Lazy Loading

```typescript
// Lazy load heavy components
const StreamAuctionDetail = lazy(() => 
  import('./components/auction/StreamAuctionDetail')
);

const StreamBidHistory = lazy(() => 
  import('./components/auction/StreamBidHistory')
);
```

---

[Next: Component README →](README.md)  
[Back to Technical architecture ←](../architecture.md)  
[See UI/UX documentation →](../../03-user-experience/desktop/)