# Notifications Integration

This document details the notification system changes required for stream auction functionality.

## Overview

Stream auctions generate various notifications throughout their lifecycle. These integrate with the existing notification system while adding auction-specific alert types and delivery methods.

## Notification Types

### For Creators

**Eligibility Achieved**
```typescript
{
  type: 'stream_eligibility_achieved',
  title: 'Your meme is Stream eligible!',
  body: 'Your submission "{meme_title}" can now be converted to an auction',
  action: {
    label: 'View Options',
    url: '/waves/{wave_id}/drop/{drop_id}'
  }
}
```

**Auction Started**
```typescript
{
  type: 'stream_auction_started',
  title: 'Your auction is live!',
  body: 'Bidding has begun on "{meme_title}"',
  action: {
    label: 'View Auction',
    url: '/stream/{auction_id}'
  }
}
```

**New Bid Received**
```typescript
{
  type: 'stream_auction_bid',
  title: 'New bid on your auction',
  body: '{bidder_name} bid {amount} ETH',
  metadata: {
    current_bid: '1.5',
    bidder: '@username',
    time_left: '2h 15m'
  }
}
```

**Auction Ending Soon**
```typescript
{
  type: 'stream_auction_ending',
  title: 'Auction ending in 1 hour',
  body: 'Current bid: {amount} ETH',
  priority: 'high'
}
```

**Auction Completed**
```typescript
{
  type: 'stream_auction_completed',
  title: 'Auction ended!',
  body: 'Won by {winner} for {amount} ETH',
  action: {
    label: 'View Results',
    url: '/stream/{auction_id}/results'
  }
}
```

### For Bidders

**Outbid Alert**
```typescript
{
  type: 'stream_auction_outbid',
  title: 'You've been outbid',
  body: 'New bid: {amount} ETH on "{title}"',
  action: {
    label: 'Bid Again',
    url: '/stream/{auction_id}'
  },
  priority: 'high'
}
```

**Winning Bid**
```typescript
{
  type: 'stream_auction_won',
  title: 'Congratulations! You won the auction',
  body: '"{title}" for {amount} ETH',
  action: {
    label: 'Claim NFT',
    url: '/stream/{auction_id}/claim'
  }
}
```

**Watched Auction Updates**
```typescript
{
  type: 'stream_auction_watched',
  title: 'Auction update',
  body: 'New bid on watched auction "{title}"',
  priority: 'low'
}
```

### For Voters

**Drop Redirected**
```typescript
{
  type: 'stream_redirect_voter',
  title: 'Meme redirected to auction',
  body: 'Your votes on "{title}" have been refunded',
  metadata: {
    refunded_tdh: 1000,
    original_votes: 25
  }
}
```

## Notification Settings

### User Preferences

New settings in notification preferences:

```typescript
interface StreamAuctionNotificationSettings {
  // Creator settings
  eligibility_achieved: boolean;
  new_bids: boolean;
  auction_ending: boolean;
  auction_completed: boolean;
  
  // Bidder settings
  outbid_alerts: boolean;
  watched_auctions: boolean;
  
  // Delivery methods per type
  delivery: {
    [notificationType: string]: {
      in_app: boolean;
      email: boolean;
      push: boolean;
    }
  }
}
```

### Default Settings

```typescript
const DEFAULT_AUCTION_NOTIFICATIONS = {
  eligibility_achieved: { in_app: true, email: true, push: true },
  new_bids: { in_app: true, email: false, push: true },
  auction_ending: { in_app: true, email: true, push: true },
  outbid_alerts: { in_app: true, email: false, push: true }
};
```

## Implementation Details

### Notification Service Updates

```typescript
class StreamAuctionNotificationService {
  async notifyEligibility(dropId: string, userId: string) {
    const drop = await getDropDetails(dropId);
    const user = await getUserDetails(userId);
    
    await sendNotification({
      user_id: userId,
      type: 'stream_eligibility_achieved',
      data: {
        meme_title: drop.title,
        wave_id: drop.wave_id,
        drop_id: dropId
      },
      channels: user.getEnabledChannels('eligibility_achieved')
    });
  }
  
  async notifyBidUpdate(auctionId: string, bid: Bid) {
    // Notify creator
    await this.notifyCreator(auctionId, bid);
    
    // Notify previous bidder if outbid
    if (bid.previous_bidder_id) {
      await this.notifyOutbid(auctionId, bid);
    }
    
    // Notify watchers
    await this.notifyWatchers(auctionId, bid);
  }
}
```

### Real-time Notifications

WebSocket integration for instant alerts:

```typescript
// Client-side subscription
useEffect(() => {
  const ws = subscribeToNotifications(userId);
  
  ws.on('auction_notification', (notification) => {
    if (notification.priority === 'high') {
      showToast(notification);
    }
    addToNotificationCenter(notification);
  });
  
  return () => ws.close();
}, [userId]);
```

### Email Templates

**Bid Notification Email**
```html
Subject: New bid on your Stream auction!

Hi {creator_name},

Great news! {bidder_name} just bid {amount} ETH on "{auction_title}".

Current bid: {amount} ETH
Time remaining: {time_left}
Total bids: {bid_count}

[View Auction]

Best,
The 6529 Team
```

### Push Notifications

Mobile push notification payloads:

```typescript
{
  title: "You've been outbid!",
  body: "New bid: 2.5 ETH",
  data: {
    type: 'auction_outbid',
    auction_id: '123',
    deep_link: 'seize://stream/123'
  },
  badge: 1,
  sound: 'default'
}
```

## Notification Center Integration

### Grouped Notifications

Auction notifications group by auction:

```typescript
// Notification grouping logic
const groupAuctionNotifications = (notifications: Notification[]) => {
  return notifications.reduce((groups, notif) => {
    if (notif.type.startsWith('stream_auction_')) {
      const auctionId = notif.metadata.auction_id;
      groups[auctionId] = groups[auctionId] || [];
      groups[auctionId].push(notif);
    }
    return groups;
  }, {});
};
```

### Quick Actions

In-notification actions:

```typescript
<NotificationItem>
  <NotificationContent />
  <QuickActions>
    <Button size="sm" onClick={() => placeBid(auctionId)}>
      Bid Now
    </Button>
    <Button size="sm" variant="ghost" onClick={() => viewAuction(auctionId)}>
      View
    </Button>
  </QuickActions>
</NotificationItem>
```

## Analytics Integration

Track notification engagement:

```typescript
const trackNotificationEngagement = (notification: Notification, action: string) => {
  analytics.track('notification_engagement', {
    notification_type: notification.type,
    action: action,
    auction_id: notification.metadata?.auction_id,
    time_to_action: Date.now() - notification.created_at
  });
};
```

## Error Handling

### Delivery Failures

Retry logic for failed notifications:

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function sendWithRetry(notification: Notification) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await sendNotification(notification);
      return;
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY * Math.pow(2, i));
    }
  }
}
```

---

[Next: My Stream integration →](my-stream.md)  
[Back to Collections integration ←](collections.md)  
[See notification UI →](../03-user-experience/mobile/notifications.md)