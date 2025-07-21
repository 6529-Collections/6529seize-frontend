# Stream Auction Components

This directory contains React component documentation for the stream auction feature. Components are organized by functionality and follow consistent patterns for state management, styling, and testing.

## Component Categories

### 📦 Auction Components
Core components for displaying and managing auctions:
- `StreamAuctionCard` - Auction preview in grids/lists
- `StreamAuctionDetail` - Full auction page view
- `StreamBidHistory` - List of bids with timestamps
- `StreamCountdown` - Real-time countdown timer

### 💰 Bidding Components
Handle bid placement and status:
- `StreamBidForm` - Main bidding interface
- `StreamQuickBid` - One-click bid from cards
- `StreamBidModal` - Confirmation dialog
- `StreamBidStatus` - Current winning bid display

### ✅ Eligibility Components
Manage meme-to-auction conversion:
- `StreamEligibilityBadge` - Visual eligibility indicator
- `StreamRedirectModal` - Conversion confirmation
- `StreamEligibilityTooltip` - Helpful information

### 🔧 Shared Components
Reusable utilities across features:
- `StreamPriceDisplay` - ETH/USD price formatting
- `StreamUserAvatar` - Consistent user display
- `StreamMediaPreview` - Image/video handling

## Component Standards

### TypeScript Interfaces
All components use strict TypeScript:
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  children?: React.ReactNode;
  className?: string;
}
```

### Styling Approach
- CSS-in-JS with styled-components
- Tailwind utilities for responsive design
- BEM naming for custom classes
- Dark mode support built-in

### State Management
- Zustand for global auction state
- React Query for server state
- Local state for UI interactions
- WebSocket subscriptions for real-time data

### Performance
- React.memo for expensive renders
- useMemo/useCallback where appropriate
- Lazy loading for route-based splits
- Virtual scrolling for long lists

## Using Components

### Installation
Components assume these dependencies:
```json
{
  "react": "^18.0.0",
  "zustand": "^4.0.0",
  "swr": "^2.0.0",
  "styled-components": "^6.0.0"
}
```

### Basic Usage
```typescript
import { StreamAuctionCard } from '@/components/stream-auction';

function MyComponent() {
  const auction = useStreamAuction('auction-id');
  
  return (
    <StreamAuctionCard
      auction={auction}
      variant="grid"
      showQuickBid
      onQuickBid={(amount) => placeBid(amount)}
    />
  );
}
```

### With Providers
```typescript
import { StreamAuctionProvider } from '@/providers';

function App() {
  return (
    <StreamAuctionProvider>
      <YourComponents />
    </StreamAuctionProvider>
  );
}
```

## Testing Components

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { StreamAuctionCard } from '../StreamAuctionCard';

test('displays auction information', () => {
  render(<StreamAuctionCard auction={mockAuction} />);
  expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
});
```

### Integration Tests
```typescript
import { renderWithProviders } from '@/test-utils';

test('bid updates auction state', async () => {
  const { user } = renderWithProviders(<StreamBidForm />);
  await user.type(screen.getByLabelText('Bid amount'), '2.0');
  await user.click(screen.getByText('Place Bid'));
  expect(mockApi.placeBid).toHaveBeenCalledWith('2.0');
});
```

## Component Development

### Creating New Components
1. Use the component generator: `npm run generate:component`
2. Follow the established file structure
3. Include TypeScript interfaces
4. Add unit tests
5. Document props with JSDoc

### Component Checklist
- [ ] TypeScript interfaces defined
- [ ] Props documented with JSDoc
- [ ] Unit tests written
- [ ] Responsive design tested
- [ ] Dark mode supported
- [ ] Accessibility verified
- [ ] Performance optimized

## Related Documentation

- [Component Structure](structure.md) - Detailed architecture
- [UI/UX Designs](../../03-user-experience/) - Visual specifications
- [API Integration](../api/) - Backend connections
- [Testing Strategy](../../06-implementation/testing-strategy.md) - Test approach

---

[View component structure →](structure.md)  
[Back to technical docs ←](../)