# Database Schema

This document details all database tables and relationships for the stream auction feature.

## Table Definitions

### stream_auction_eligibility
Tracks which drops are eligible for stream auction redirect.

```sql
CREATE TABLE stream_auction_eligibility (
    id SERIAL PRIMARY KEY,
    drop_id VARCHAR(255) NOT NULL,
    wave_id VARCHAR(255) NOT NULL,
    is_eligible BOOLEAN DEFAULT FALSE,
    eligibility_achieved_at TIMESTAMP,
    votes_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_drop_wave (drop_id, wave_id),
    INDEX idx_eligible_drops (is_eligible, eligibility_achieved_at),
    INDEX idx_last_checked (last_checked_at),
    
    -- Constraints
    UNIQUE KEY unique_drop_wave (drop_id, wave_id),
    CONSTRAINT rating_range CHECK (average_rating >= 0 AND average_rating <= 5)
);
```

### stream_auction_redirections
Records all drops that have been redirected to stream auctions.

```sql
CREATE TABLE stream_auction_redirections (
    id SERIAL PRIMARY KEY,
    drop_id VARCHAR(255) NOT NULL,
    wave_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    redirected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stream_token_id INTEGER, -- NULL until minted on blockchain
    status VARCHAR(50) DEFAULT 'pending',
    -- Status values: pending, minted, auction_active, auction_ended, claimed
    metadata JSON, -- Store original drop metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_redirects (user_id, redirected_at),
    INDEX idx_status (status),
    INDEX idx_token (stream_token_id),
    
    -- Constraints
    UNIQUE KEY unique_redirect (drop_id, wave_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'minted', 'auction_active', 'auction_ended', 'claimed'))
);
```

### stream_auction_cache
Caches blockchain auction data for performance.

```sql
CREATE TABLE stream_auction_cache (
    id SERIAL PRIMARY KEY,
    stream_token_id INTEGER NOT NULL UNIQUE,
    redirect_id INTEGER NOT NULL,
    current_bid_amount DECIMAL(36,18) DEFAULT 0,
    current_bidder_address VARCHAR(42),
    bid_count INTEGER DEFAULT 0,
    auction_start_time TIMESTAMP,
    auction_end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    winner_address VARCHAR(42),
    final_price DECIMAL(36,18),
    claimed_at TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_active_auctions (is_active, auction_end_time),
    INDEX idx_user_bids (current_bidder_address),
    INDEX idx_sync_time (last_synced_at),
    
    -- Foreign Keys
    FOREIGN KEY (redirect_id) REFERENCES stream_auction_redirections(id)
);
```

### stream_auction_notifications
Tracks notification delivery for auction events.

```sql
CREATE TABLE stream_auction_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    auction_id INTEGER NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    -- Types: eligible, bid_received, outbid, ending_soon, won, new_auction
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSON, -- Additional context for the notification
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_notifications (user_id, sent_at DESC),
    INDEX idx_unread (user_id, read_at),
    INDEX idx_auction_notifications (auction_id, notification_type),
    
    -- Constraints
    CONSTRAINT valid_notification_type CHECK (notification_type IN (
        'eligible', 'bid_received', 'outbid', 'ending_soon', 'won', 'new_auction'
    ))
);
```

### stream_auction_activity
Records all auction events for the activity wave.

```sql
CREATE TABLE stream_auction_activity (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    -- Types: redirect, start, bid, milestone, ending, ended, claimed
    actor_user_id VARCHAR(255),
    activity_data JSON NOT NULL, -- Event-specific data
    posted_to_wave BOOLEAN DEFAULT FALSE,
    wave_post_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_auction_activity (auction_id, created_at),
    INDEX idx_wave_posts (posted_to_wave, created_at),
    INDEX idx_activity_type (activity_type, created_at)
);
```

## Migration Scripts

### Initial Migration
```sql
-- Run this migration to create all tables
BEGIN;

-- Create eligibility tracking table
CREATE TABLE stream_auction_eligibility (
    -- ... (full schema from above)
);

-- Create redirections table
CREATE TABLE stream_auction_redirections (
    -- ... (full schema from above)
);

-- Create cache table
CREATE TABLE stream_auction_cache (
    -- ... (full schema from above)
);

-- Create notifications table
CREATE TABLE stream_auction_notifications (
    -- ... (full schema from above)
);

-- Create activity table
CREATE TABLE stream_auction_activity (
    -- ... (full schema from above)
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_eligibility_updated_at 
    BEFORE UPDATE ON stream_auction_eligibility 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redirections_updated_at 
    BEFORE UPDATE ON stream_auction_redirections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_updated_at 
    BEFORE UPDATE ON stream_auction_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

## Data Relationships

### Entity Relationship Diagram
```
drops
  │
  ├─── stream_auction_eligibility (1:1)
  │     └─── determines eligibility status
  │
  └─── stream_auction_redirections (1:1)
        │
        ├─── stream_auction_cache (1:1)
        │     └─── caches blockchain data
        │
        ├─── stream_auction_notifications (1:many)
        │     └─── tracks sent notifications
        │
        └─── stream_auction_activity (1:many)
              └─── records all events
```

## Query Examples

### Check Drop Eligibility
```sql
SELECT 
    e.*,
    d.title,
    d.creator_id
FROM stream_auction_eligibility e
JOIN drops d ON e.drop_id = d.id
WHERE e.drop_id = ? 
  AND e.wave_id = ?;
```

### Get Active Auctions
```sql
SELECT 
    c.*,
    r.drop_id,
    r.user_id as creator_id,
    r.metadata
FROM stream_auction_cache c
JOIN stream_auction_redirections r ON c.redirect_id = r.id
WHERE c.is_active = true
  AND c.auction_end_time > CURRENT_TIMESTAMP
ORDER BY c.auction_end_time ASC;
```

### User's Bidding History
```sql
SELECT 
    c.*,
    r.metadata->>'title' as auction_title
FROM stream_auction_cache c
JOIN stream_auction_redirections r ON c.redirect_id = r.id
WHERE c.current_bidder_address = ?
   OR c.winner_address = ?
ORDER BY c.updated_at DESC;
```

### Pending Notifications
```sql
SELECT 
    n.*,
    u.username,
    u.email
FROM stream_auction_notifications n
JOIN users u ON n.user_id = u.id
WHERE n.read_at IS NULL
  AND n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;
```

## Performance Considerations

### Indexing Strategy
- Composite indexes on frequently joined columns
- Partial indexes for boolean flags with WHERE clauses
- Covering indexes for read-heavy queries

### Partitioning
Consider partitioning for high-volume tables:
- `stream_auction_activity` by created_at (monthly)
- `stream_auction_notifications` by created_at (monthly)

### Archival Strategy
- Move completed auctions to archive tables after 6 months
- Compress activity logs older than 1 year
- Maintain summary statistics for historical data

---

[Next: API endpoints →](../api/endpoints.md)  
[See migrations →](migrations.md)  
[Back to architecture →](../architecture.md)