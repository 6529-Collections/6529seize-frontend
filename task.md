Product Requirements Document (PRD)
Network Metrics Dashboard Modernization
Document Version: 1.0
Date: January 20, 2026
Product Owner: [Your Name]
Status: Draft for Review

1. Executive Summary
The Network Metrics Dashboard is a critical tool for community members, delegates, and stakeholders to understand the health and activity of the 6529 network. This PRD outlines improvements to modernize the UI/UX, increase engagement, and surface meaningful insights through network achievement badges and enhanced data visualization.
Current State: A functional but dense metrics dashboard displaying 12+ network KPIs with basic sparkline charts and percentage change indicators.
Target State: An engaging, modern dashboard with clear visual hierarchy, interactive elements, contextual insights, and network achievement badges that celebrate collective milestones and trends.

2. Goals & Success Metrics
Business Goals

Increase dashboard engagement (time on page, return visits)
Improve user understanding of network health
Create shareable moments through achievement badges
Establish the dashboard as a go-to resource for network insights

Success Metrics
MetricCurrent BaselineTargetTimeframeAvg. session durationTBD+40%3 months post-launchReturn visitor rateTBD+25%3 months post-launchSocial shares of badges050+/month3 months post-launchUser satisfaction (survey)TBD4.2+/5Post-launch survey

3. User Stories
Epic 1: Enhanced Visual Hierarchy & Layout
US-1.1: Dashboard Overview Section

As a network participant, I want to see a quick summary of network health at the top of the dashboard so I can understand the overall state without scrolling.

Acceptance Criteria:

 Add a "Network Pulse" hero section at the top showing 3 key headline metrics
 Include a one-sentence network health summary (e.g., "Network activity is strong. Voting up 43% this week.")
 Hero section is visually distinct with larger typography and subtle gradient background
 Responsive on mobile devices

US-1.2: Metric Card Grouping

As a user, I want metrics organized into logical sections so I can quickly find the data I'm looking for.

Acceptance Criteria:

 Group metrics into 3-4 collapsible sections:

Activity (Distinct Droppers, Drops Created, Submissions, Distinct Voters, Vote Volume)
Power & Governance (Voting Power, Network TDH, TDH Utilization %, xTDH Granted)
Community (Profile Count, Active Identities, Consolidations Formed)
Minting (Mint Stats - already exists as header card)


 Each section has a header with icon and expand/collapse toggle
 Sections remember collapsed state in local storage
 Default state: all sections expanded


Epic 2: Interactive Data Visualization
US-2.1: Interactive Sparkline Charts

As a user, I want to hover over sparkline charts to see exact values so I can understand specific data points.

Acceptance Criteria:

 Hovering over sparkline shows tooltip with date and exact value
 Tooltip follows cursor smoothly
 Highlight the specific bar/point being hovered
 Touch-friendly on mobile (tap to show tooltip)

US-2.2: Chart Animations

As a user, I want to see smooth animations when data loads so the experience feels polished and modern.

Acceptance Criteria:

 Numbers animate/count up when loading
 Sparkline bars animate in sequentially (left to right)
 Percentage badges fade in after numbers
 Skeleton loading states while data fetches
 Animations are subtle (< 500ms total)


Epic 3: Network Achievement Badges
US-3.1: Streak Badges

As a community member, I want to see when the network achieves consecutive positive days so I can celebrate our collective momentum.

Acceptance Criteria:

 Display streak badge when metric is positive for 3+ consecutive days
 Badge shows streak count with fire/flame icon: "🔥 7-day streak"
 Streak types to track:

TDH Utilization increasing
Vote Volume above threshold
Active Identities growing
Distinct Voters increasing


 Badge appears on relevant metric card
 Tooltip on hover explains: "TDH Utilization has increased for 7 consecutive days"
 Streak resets when metric goes negative

US-3.2: Milestone Badges

As a community member, I want to see when the network hits significant milestones so I can feel connected to our growth.

Acceptance Criteria:

 Display milestone badge when key thresholds are crossed:

Network TDH: 1B, 1.5B, 2B (show most recent)
Total Voting Power: 100M, 250M, 500M, 1B
Profile Count: 1K, 5K, 10K, 25K, 50K
Active Identities: 100, 250, 500, 1K, 5K


 Badge shows milestone with trophy/star icon: "⭐ 1B TDH Milestone"
 Badge remains visible until next milestone is reached
 Celebratory animation when milestone is first achieved (confetti optional)

US-3.3: Trend Badges

As a user, I want to quickly see notable trends so I can understand what's happening without analyzing numbers.

Acceptance Criteria:

 Display contextual badges for significant changes:

"📈 All-time high" - when metric reaches ATH
"🚀 Surge: +100%+" - when 24h change exceeds 100%
"💪 Strong week" - when 7d change exceeds 50%
"📉 Notable dip" - when negative change exceeds -30% (informational, not alarming)


 Badges are color-coded (green for positive, amber for notable dip)
 Only show most significant badge per card (priority: ATH > Surge > Strong week)


Epic 4: Contextual Information & Help
US-4.1: Metric Explanations

As a new user, I want to understand what each metric means so I can interpret the data correctly.

Acceptance Criteria:

 Add info icon (ℹ️) next to each metric title
 Clicking/hovering info icon shows tooltip with:

Brief explanation (1-2 sentences)
Why this metric matters
Example: "Distinct Voters: Unique wallets that cast votes. Higher numbers indicate broader participation in governance."


 Tooltips are consistent in style and dismissible

US-4.2: Comparison Context

As a user, I want to understand if current metrics are good or bad compared to historical norms so I can gauge network health.

Acceptance Criteria:

 Add contextual indicator comparing to historical average:

"Above average" / "Below average" / "Normal range"


 Based on comparison to rolling 30-day average
 Displayed subtly below main metric or in tooltip
 Color-coded dot or text (green/amber/gray)


Epic 5: UI Polish & Modern Aesthetics
US-5.1: Card Hover States

As a user, I want visual feedback when I interact with cards so the interface feels responsive.

Acceptance Criteria:

 Cards have subtle lift effect on hover (transform + shadow)
 Smooth transition (200ms ease)
 Cursor changes to pointer on interactive elements
 Focus states for keyboard navigation

US-5.2: Refreshed Visual Design

As a user, I want a modern, polished interface so the dashboard feels premium and trustworthy.

Acceptance Criteria:

 Increase whitespace/padding between cards (current feels dense)
 Slightly round card corners more (12-16px border-radius)
 Add subtle glassmorphism effect to section headers
 Improve typography hierarchy (larger headlines, better font weights)
 Ensure color contrast meets WCAG AA accessibility standards
 Add "Last updated: X minutes ago" timestamp in header

US-5.3: Responsive Design Improvements

As a mobile user, I want the dashboard to work well on my phone so I can check metrics on the go.

Acceptance Criteria:

 Cards stack to single column on mobile
 Touch-friendly tap targets (min 44px)
 Horizontal scroll for sparklines if needed
 Time period toggle accessible without scrolling
 Test on iOS Safari and Android Chrome


1. Network Achievement Badges - Detailed Specification
Badge Types Summary
Badge TypeIconTrigger ConditionDisplay LocationStreak🔥3+ consecutive positive daysOn metric cardMilestone⭐Threshold crossedOn metric cardAll-Time High📈Current value = ATHOn metric cardSurge🚀24h change > +100%On metric cardStrong Week💪7d change > +50%On metric cardNotable Dip📉Change < -30%On metric card (amber)
Badge Visual Design

Small pill-shaped badge (similar to current percentage badges)
Positioned below or beside the percentage change badge
Subtle animation on first appearance
Consistent color palette:

Streak: Orange/amber gradient
Milestone: Gold/yellow gradient
ATH/Surge/Strong: Green gradient
Notable Dip: Amber (not red - informational, not alarming)



Streak Calculation Logic
streak_count = 0
for each day in selected_period (newest to oldest):
  if daily_change > 0:
    streak_count += 1
  else:
    break
    
if streak_count >= 3:
  show_streak_badge(streak_count)

5. Technical Considerations
Data Requirements

Historical data storage for trend calculations (minimum 1 year)
Daily snapshot data for streak calculations
Milestone achievement log (date, metric, value)
All-time high tracking per metric

Performance

Lazy load expanded chart data (don't fetch until modal opens)
Cache badge calculations (recalculate daily, not per request)
Debounce hover tooltips (100ms delay)
Skeleton loading states to prevent layout shift



1. Appendix: Wireframe Concepts
Hero Section Concept
┌─────────────────────────────────────────────────────────────────┐
│  📊 Network Pulse                               │
│                                                                 │
│  "Strong network activity. Voting up 43%, TDH growing steadily" │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ 43.4M    │  │ 29.26%   │  │ 1.3B     │                      │
│  │ Vote Vol │  │ TDH Util │  │ Net TDH  │                      │
│  │ +170% ↑  │  │ 🔥 5-day │  │ ⭐ 1B    │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
Metric Card with Badges
┌─────────────────────────────────────────┐
│  TDH Utilization %              ℹ️  📊  │
│                                         │
│  TOTAL          CHANGES                 │
│  29.258         24H  +0.243  +0.8%     │
│  %              7D   +11.459 +64.4%    │
│                                         │
│  [+64.4%] [🔥 5-day streak] [💪 Strong] │
│                                         │
│  ▃▃▅▅▆▆▇▇███████ (sparkline)           │
└─────────────────────────────────────────┘
