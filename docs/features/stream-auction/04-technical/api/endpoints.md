# API Endpoints

This document details all API endpoints for the stream auction feature.

## Eligibility Endpoints

### Check Drop Eligibility
```http
GET /api/waves/{waveId}/drops/{dropId}/stream-eligibility
```

**Response:**
```json
{
  "eligible": true,
  "eligibility_achieved_at": "2024-01-15T10:30:00Z",
  "votes_count": 150,
  "average_rating": 4.2,
  "thresholds": {
    "min_votes": 100,
    "min_rating": 3.5,
    "time_period_days": 7
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Drop not found
- `400` - Invalid wave/drop combination

### Get Eligible Drops for User
```http
GET /api/users/{userId}/eligible-stream-drops
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response:**
```json
{
  "drops": [
    {
      "drop_id": "123",
      "wave_id": "456",
      "title": "Meme Title",
      "eligibility_achieved_at": "2024-01-15T10:30:00Z",
      "votes_count": 150,
      "average_rating": 4.2,
      "already_redirected": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

## Redirect Endpoints

### Redirect Drop to Stream Auction
```http
POST /api/waves/{waveId}/drops/{dropId}/redirect-to-stream
```

**Request Body:**
```json
{
  // No parameters needed - values come from contract
}
```

**Response:**
```json
{
  "success": true,
  "redirect_id": "789",
  "status": "pending",
  "message": "Drop successfully redirected. You will be contacted via DM within 1-3 business days.",
  "removed_from_leaderboard": true,
  "votes_refunded": 150,
  "activity_post_id": "abc123"
}
```

**Status Codes:**
- `200` - Success
- `403` - Not authorized (not drop owner)
- `400` - Drop not eligible or already redirected
- `409` - Drop already in redirect process

### Get Redirect Status
```http
GET /api/waves/{waveId}/drops/{dropId}/redirect-status
```

**Response:**
```json
{
  "redirected": true,
  "redirect_id": "789",
  "status": "auction_active",
  "stream_token_id": 12345,
  "auction_url": "/collections/stream-auctions/12345",
  "redirected_at": "2024-01-15T11:00:00Z"
}
```

## Auction Browsing Endpoints

### List Stream Auctions
```http
GET /api/stream-auctions
```

**Query Parameters:**
- `status`: `active` | `upcoming` | `ended` | `all`
- `sort`: `ending_soon` | `price_low` | `price_high` | `newest`
- `page`: Page number
- `limit`: Items per page
- `creator`: Filter by creator ID
- `min_price`: Minimum current bid
- `max_price`: Maximum current bid

**Response:**
```json
{
  "auctions": [
    {
      "token_id": 12345,
      "title": "Meme Title",
      "creator": {
        "id": "user123",
        "username": "creator"
      },
      "current_bid": "1.5",
      "bid_count": 8,
      "ends_at": "2024-01-16T10:00:00Z",
      "is_active": true,
      "preview_url": "https://...",
      "user_is_highest_bidder": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156
  }
}
```

### Get Auction Details
```http
GET /api/stream-auctions/{tokenId}
```

**Response:**
```json
{
  "token_id": 12345,
  "title": "Meme Title",
  "description": "Original meme description",
  "creator": {
    "id": "user123",
    "username": "creator",
    "avatar_url": "https://..."
  },
  "current_bid": "2.5",
  "current_bidder": {
    "id": "user456",
    "username": "highbidder"
  },
  "bid_count": 12,
  "starting_price": "0.1",
  "started_at": "2024-01-15T10:00:00Z",
  "ends_at": "2024-01-16T10:00:00Z",
  "is_active": true,
  "original_metrics": {
    "votes": 150,
    "average_rating": 4.2,
    "wave_id": "456",
    "wave_name": "Memes Wave #42"
  },
  "recent_bids": [
    {
      "amount": "2.5",
      "bidder": "highbidder",
      "timestamp": "2024-01-15T15:30:00Z"
    },
    {
      "amount": "2.2",
      "bidder": "user789",
      "timestamp": "2024-01-15T15:25:00Z"
    }
  ],
  "user_status": {
    "is_creator": false,
    "is_highest_bidder": false,
    "last_bid_amount": "2.2",
    "can_bid": true
  }
}
```

## Bidding Endpoints

### Place Bid
```http
POST /api/stream-auctions/{tokenId}/bid
```

**Request Body:**
```json
{
  "amount": "2.75",
  "signature": "0x..." // Wallet signature
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0x...",
  "new_highest_bid": "2.75",
  "previous_bid_refunded": true,
  "outbid_user_notified": true
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid bid amount or auction ended
- `403` - Signature validation failed
- `409` - Bid too low or auction not active

### Get Bid Requirements
```http
GET /api/stream-auctions/{tokenId}/bid-requirements
```

**Response:**
```json
{
  "current_bid": "2.5",
  "minimum_bid": "2.75",
  "minimum_increment": "0.25",
  "increment_percentage": 10,
  "suggested_bids": ["2.75", "3.0", "3.5"],
  "user_balance": "5.2",
  "can_afford_minimum": true
}
```

## User Dashboard Endpoints

### Get My Bids
```http
GET /api/stream-auctions/my-bids
```

**Query Parameters:**
- `status`: `active` | `won` | `lost` | `all`
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "bids": [
    {
      "auction": {
        "token_id": 12345,
        "title": "Meme Title",
        "ends_at": "2024-01-16T10:00:00Z"
      },
      "my_bid": "2.2",
      "current_highest": "2.5",
      "am_highest_bidder": false,
      "status": "outbid",
      "can_rebid": true
    }
  ],
  "summary": {
    "active_bids": 3,
    "winning_bids": 1,
    "total_bid_value": "8.5",
    "auctions_won": 2
  }
}
```

### Get My Created Auctions
```http
GET /api/stream-auctions/my-auctions
```

**Response:**
```json
{
  "auctions": [
    {
      "token_id": 12345,
      "title": "Meme Title",
      "status": "active",
      "current_bid": "2.5",
      "bid_count": 12,
      "ends_at": "2024-01-16T10:00:00Z",
      "total_earned": null
    }
  ]
}
```

## Notification Endpoints

### Get Auction Notifications
```http
GET /api/notifications/auctions
```

**Query Parameters:**
- `unread_only`: Boolean, default false
- `limit`: Items per page

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "outbid",
      "auction_id": 12345,
      "message": "You've been outbid on 'Meme Title'",
      "data": {
        "new_bid": "2.5",
        "your_bid": "2.2"
      },
      "created_at": "2024-01-15T15:30:00Z",
      "read_at": null
    }
  ]
}
```

### Mark Notifications Read
```http
POST /api/notifications/auctions/mark-read
```

**Request Body:**
```json
{
  "notification_ids": ["notif123", "notif124"]
}
```

## WebSocket Events

### Connection
```javascript
ws://api.example.com/auctions/live
```

### Event Types

**Bid Update**
```json
{
  "type": "bid_update",
  "auction_id": 12345,
  "data": {
    "new_bid": "3.0",
    "bidder": "user789",
    "bid_count": 15,
    "timestamp": "2024-01-15T16:00:00Z"
  }
}
```

**Auction Ending**
```json
{
  "type": "auction_ending",
  "auction_id": 12345,
  "data": {
    "minutes_remaining": 60,
    "current_bid": "3.0"
  }
}
```

**Auction Ended**
```json
{
  "type": "auction_ended",
  "auction_id": 12345,
  "data": {
    "final_bid": "3.5",
    "winner": "user456",
    "total_bids": 23
  }
}
```

## Error Response Format

All endpoints use consistent error responses:

```json
{
  "error": {
    "code": "INVALID_BID_AMOUNT",
    "message": "Bid must be at least 10% higher than current bid",
    "details": {
      "current_bid": "2.5",
      "minimum_bid": "2.75"
    }
  }
}
```

## Rate Limiting

- Eligibility checks: 60 requests/minute
- Bid placement: 10 requests/minute
- General browsing: 120 requests/minute

Headers included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

[Next: Smart contract integration →](../smart-contracts/integration.md)  
[See webhook events →](webhooks.md)  
[Back to architecture →](../architecture.md)