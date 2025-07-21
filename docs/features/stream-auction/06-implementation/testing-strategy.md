# Testing Strategy

This document outlines the comprehensive testing approach for the stream auction feature, covering unit tests, integration tests, E2E tests, and performance testing.

## Testing Principles

1. **Test Coverage**: Aim for 90%+ coverage on critical paths
2. **Test Pyramid**: More unit tests, fewer E2E tests
3. **Real-time Testing**: Special focus on WebSocket and live updates
4. **Contract Testing**: Thorough smart contract interaction tests

## Unit Tests

### Component Testing

**Eligibility Badge Tests**
```typescript
describe('StreamEligibilityBadge', () => {
  it('shows badge when drop is eligible', () => {
    render(<StreamEligibilityBadge isEligible={true} />);
    expect(screen.getByText('Stream Eligible')).toBeInTheDocument();
  });
  
  it('shows redirect option for authors', () => {
    render(<StreamEligibilityBadge isEligible={true} isAuthor={true} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('hides badge after redirect', () => {
    const { rerender } = render(<StreamEligibilityBadge isEligible={true} />);
    rerender(<StreamEligibilityBadge isEligible={true} isRedirected={true} />);
    expect(screen.queryByText('Stream Eligible')).not.toBeInTheDocument();
  });
});
```

**Auction Card Tests**
```typescript
describe('StreamAuctionCard', () => {
  it('displays current bid information', () => {
    const auction = mockAuction({ currentBid: 1.5 });
    render(<StreamAuctionCard auction={auction} />);
    expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
  });
  
  it('shows countdown timer', () => {
    jest.useFakeTimers();
    const auction = mockAuction({ endsAt: Date.now() + 3600000 });
    render(<StreamAuctionCard auction={auction} />);
    expect(screen.getByText(/59m/)).toBeInTheDocument();
    
    act(() => jest.advanceTimersByTime(60000));
    expect(screen.getByText(/58m/)).toBeInTheDocument();
  });
});
```

### Hook Testing

**Eligibility Hook Tests**
```typescript
describe('useStreamEligibility', () => {
  it('fetches eligibility on mount', async () => {
    const { result } = renderHook(() => 
      useStreamEligibility('drop123', 'wave456')
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.data).toEqual({
        isEligible: true,
        reason: 'Meets vote threshold'
      });
    });
  });
  
  it('refetches periodically', async () => {
    const spy = jest.spyOn(api, 'getStreamEligibility');
    renderHook(() => useStreamEligibility('drop123', 'wave456'));
    
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    
    act(() => jest.advanceTimersByTime(60000));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });
});
```

### Service Testing

**Redirect Service Tests**
```typescript
describe('StreamRedirectService', () => {
  it('processes redirect correctly', async () => {
    const service = new StreamRedirectService();
    const result = await service.redirectToAuction('drop123', 'wave456');
    
    expect(result).toMatchObject({
      success: true,
      auctionId: expect.any(String),
      refundedVoters: expect.any(Number)
    });
  });
  
  it('handles redirect failures', async () => {
    const service = new StreamRedirectService();
    mockApi.redirectToAuction.mockRejectedValue(new Error('Not eligible'));
    
    await expect(
      service.redirectToAuction('drop123', 'wave456')
    ).rejects.toThrow('Not eligible');
  });
});
```

## Integration Tests

### API Integration

**Auction Creation Flow**
```typescript
describe('Auction Creation Integration', () => {
  it('creates auction from eligible drop', async () => {
    // Setup
    const drop = await createTestDrop({ votes: 100 });
    await makeDropEligible(drop.id);
    
    // Execute redirect
    const response = await request(app)
      .post(`/api/drops/${drop.id}/redirect`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify auction created
    expect(response.body).toMatchObject({
      auctionId: expect.any(String),
      startTime: expect.any(String),
      endTime: expect.any(String)
    });
    
    // Verify drop marked as redirected
    const updatedDrop = await getDrop(drop.id);
    expect(updatedDrop.redirected).toBe(true);
    
    // Verify votes refunded
    const refunds = await getRefunds(drop.id);
    expect(refunds.length).toBe(drop.voter_count);
  });
});
```

**Bidding Flow Tests**
```typescript
describe('Bidding Integration', () => {
  it('processes bid and updates state', async () => {
    const auction = await createTestAuction();
    
    const bidResponse = await request(app)
      .post(`/api/auctions/${auction.id}/bid`)
      .send({ amount: '1.5' })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify bid recorded
    expect(bidResponse.body.bidId).toBeDefined();
    
    // Verify notifications sent
    const notifications = await getNotifications(auction.creator_id);
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: 'stream_auction_bid'
      })
    );
    
    // Verify WebSocket broadcast
    expect(mockWebSocket.broadcast).toHaveBeenCalledWith(
      'auction_update',
      expect.objectContaining({
        auctionId: auction.id,
        currentBid: '1.5'
      })
    );
  });
});
```

### Database Integration

**Transaction Tests**
```typescript
describe('Database Transactions', () => {
  it('rolls back on redirect failure', async () => {
    const drop = await createTestDrop();
    
    // Force transaction failure
    mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
    
    await expect(
      redirectService.redirectToAuction(drop.id)
    ).rejects.toThrow();
    
    // Verify nothing changed
    const checkDrop = await getDrop(drop.id);
    expect(checkDrop.redirected).toBe(false);
    
    const auctions = await getAuctions({ dropId: drop.id });
    expect(auctions).toHaveLength(0);
  });
});
```

## End-to-End Tests

### User Journey Tests

**Complete Auction Flow**
```typescript
describe('Stream Auction E2E', () => {
  it('completes full auction lifecycle', async () => {
    // Login as creator
    await loginAs('creator');
    
    // Submit meme to wave
    await page.goto('/waves/current');
    await page.click('[data-testid="submit-meme"]');
    await uploadMeme('test-meme.jpg');
    await page.click('[data-testid="submit"]');
    
    // Wait for eligibility
    await page.waitForSelector('[data-testid="stream-eligible-badge"]');
    
    // Redirect to auction
    await page.click('[data-testid="redirect-to-auction"]');
    await page.click('[data-testid="confirm-redirect"]');
    
    // Verify auction page
    await page.waitForNavigation();
    expect(page.url()).toContain('/stream/');
    
    // Login as bidder
    await loginAs('bidder');
    await page.goto(page.url());
    
    // Place bid
    await page.fill('[data-testid="bid-amount"]', '1.5');
    await page.click('[data-testid="place-bid"]');
    
    // Verify bid success
    await expect(page.locator('[data-testid="current-bid"]')).toHaveText('1.5 ETH');
  });
});
```

### Mobile E2E Tests

```typescript
describe('Mobile Stream Auction', () => {
  beforeEach(async () => {
    await device.launchApp();
  });
  
  it('allows quick bidding from collections', async () => {
    await element(by.id('collections-tab')).tap();
    await element(by.id('auction-filter')).tap();
    
    await element(by.id('auction-card-0')).tap();
    await element(by.id('quick-bid-button')).tap();
    
    await element(by.id('bid-amount')).typeText('2.0');
    await element(by.id('confirm-bid')).tap();
    
    await expect(element(by.text('Bid placed!'))).toBeVisible();
  });
});
```

## Performance Tests

### Load Testing

```typescript
describe('Auction Load Tests', () => {
  it('handles concurrent bids', async () => {
    const auction = await createTestAuction();
    
    // Simulate 100 concurrent bids
    const bidPromises = Array(100).fill(null).map((_, i) => 
      placeBid(auction.id, 1 + (i * 0.01), `user${i}`)
    );
    
    const results = await Promise.allSettled(bidPromises);
    const successful = results.filter(r => r.status === 'fulfilled');
    
    // At least one should succeed
    expect(successful.length).toBeGreaterThan(0);
    
    // Verify final state is consistent
    const finalAuction = await getAuction(auction.id);
    expect(finalAuction.bid_count).toBeLessThanOrEqual(100);
  });
});
```

### Real-time Performance

```typescript
describe('WebSocket Performance', () => {
  it('broadcasts updates within 100ms', async () => {
    const connections = await createWebSocketConnections(50);
    const receivedUpdates = [];
    
    connections.forEach(conn => {
      conn.on('auction_update', (data) => {
        receivedUpdates.push({
          timestamp: Date.now(),
          data
        });
      });
    });
    
    const startTime = Date.now();
    await placeBid('auction123', 5.0);
    
    await waitFor(() => {
      expect(receivedUpdates).toHaveLength(50);
    });
    
    const lastUpdate = Math.max(...receivedUpdates.map(u => u.timestamp));
    expect(lastUpdate - startTime).toBeLessThan(100);
  });
});
```

## Contract Testing

### Mock Contract Tests

```typescript
describe('Smart Contract Integration', () => {
  let mockContract: MockContract;
  
  beforeEach(() => {
    mockContract = await deployMockContract(StreamAuctionABI);
  });
  
  it('creates auction on chain', async () => {
    const tx = await auctionService.createOnChainAuction({
      tokenId: 123,
      startPrice: ethers.utils.parseEther('1'),
      duration: 86400
    });
    
    expect(tx.hash).toBeDefined();
    
    const auction = await mockContract.getAuction(123);
    expect(auction.active).toBe(true);
  });
});
```

## Test Data Management

### Test Fixtures

```typescript
// fixtures/auctions.ts
export const auctionFixtures = {
  activeAuction: {
    id: 'auction-001',
    title: 'Test Meme Auction',
    currentBid: 1.5,
    bidCount: 3,
    endsAt: Date.now() + 3600000
  },
  
  completedAuction: {
    id: 'auction-002',
    title: 'Completed Auction',
    finalBid: 10.5,
    winner: 'user123',
    completedAt: Date.now() - 86400000
  }
};
```

### Test Utilities

```typescript
// utils/test-helpers.ts
export async function createTestAuction(overrides = {}) {
  const drop = await createTestDrop({ votes: 100 });
  await makeDropEligible(drop.id);
  
  const auction = await redirectToAuction(drop.id);
  return { ...auction, ...overrides };
}

export async function simulateBidding(auctionId: string, bidCount: number) {
  for (let i = 0; i < bidCount; i++) {
    await placeBid(auctionId, 1 + (i * 0.5), `user${i}`);
    await wait(100); // Avoid rate limits
  }
}
```

## CI/CD Integration

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Stream Auction Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
      redis:
        image: redis:7
    steps:
      - name: Run integration tests
        run: npm run test:integration
        
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E tests
        run: npm run test:e2e
```

## Monitoring & Debugging

### Test Debugging

```typescript
// Enable detailed logging in tests
beforeEach(() => {
  if (process.env.DEBUG_TESTS) {
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      fs.appendFileSync('test.log', args.join(' ') + '\n');
    });
  }
});
```

### Performance Monitoring

```typescript
// Track test performance
afterEach(() => {
  const testName = expect.getState().currentTestName;
  const duration = Date.now() - testStartTime;
  
  if (duration > 1000) {
    console.warn(`Slow test detected: ${testName} took ${duration}ms`);
  }
});
```

---

[Next: Deployment plan →](deployment.md)  
[Back to Implementation phases ←](phases.md)  
[See technical architecture →](../04-technical/architecture.md)