# Eligibility Requirements

This document defines when a memes wave drop becomes eligible for stream auction redirect.

## Current Status: 🔄 DEFERRED

The specific voting thresholds are deferred pending analysis of historical memes wave data. We're using conservative fallback values for initial implementation.

## Fallback Thresholds (Temporary)

Until final thresholds are determined through data analysis:

- **Minimum Votes**: 100 votes
- **Time Period**: Over 7 days  
- **Average Rating**: 3.5 or higher
- **Eligibility Start**: 24 hours after submission

## Eligibility Rules

### When Eligibility is Checked
- System checks voting metrics every hour
- Checks begin 24 hours after initial submission
- Once eligible, status cannot be lost

### Eligibility Persistence
- **Permanent**: Once achieved, eligibility never expires
- **No Deadline**: Creators can redirect days, weeks, or months later
- **Visible Badge**: Eligibility indicator remains on drop indefinitely

### What Triggers Eligibility
The system evaluates:
1. Total number of votes received
2. Average rating across all votes
3. Time period over which votes were received
4. No penalization for controversial content (high variance in ratings)

## Future Threshold Determination

### Data Analysis Needed
- Historical voting patterns across all waves
- Correlation between votes and leaderboard success
- Optimal threshold for quality vs. accessibility
- User behavior studies on redirect decisions

### Considerations for Final Thresholds
- **Too Low**: Floods system with mediocre auctions
- **Too High**: Limits feature to only top content
- **Just Right**: Rewards quality while maintaining accessibility

### A/B Testing Plan
Once implemented, we'll test different thresholds:
- Group A: Conservative (current fallback)
- Group B: Moderate (75 votes, 3.0 rating)
- Group C: Aggressive (50 votes, 2.5 rating)

## Special Cases

### Edge Scenarios
1. **Rapid Viral Growth**: Meme gets 200 votes in first hour
   - Still must wait 24 hours for first eligibility check
   
2. **Slow Burn Success**: Meme gets 100th vote on day 30
   - Becomes eligible immediately upon hitting threshold

3. **Rating Fluctuation**: Average drops below threshold after eligibility
   - Eligibility retained (never lost once achieved)

### Excluded Scenarios
- Memes already in final leaderboard tallying
- Memes from waves that have ended
- Memes that violated content policies

## Technical Implementation

### Eligibility Tracking
```typescript
interface StreamAuctionEligibility {
  drop_id: string;
  wave_id: string;
  is_eligible: boolean;
  eligibility_achieved_at: Date | null;
  votes_count: number;
  average_rating: number;
  last_checked_at: Date;
}
```

### Checking Logic
1. Scheduled job runs hourly
2. Queries drops not yet eligible
3. Calculates current metrics
4. Updates eligibility if thresholds met
5. Triggers notification to creator

## User Communication

### Eligibility Achieved
- Push notification to creator
- Email notification (if enabled)
- Badge appears on drop card
- Celebration animation on first view

### Pre-Eligibility
- Progress indicators showing how close
- Encouraging messages about vote count
- No pressure or countdown timers

---

[See all decisions →](decisions.md)  
[Understand auction parameters →](auction-parameters.md)  
[Technical implementation →](../04-technical/database/schema.md#eligibility-tracking)