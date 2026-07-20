# AWS RUM (Real User Monitoring) Integration

This directory contains the AWS RUM integration for monitoring real user performance and interactions.

## Setup

### 1. Create AWS RUM AppMonitor

1. Go to AWS CloudWatch Console
2. Navigate to RUM (Real User Monitoring)
3. Create a new AppMonitor with these settings:
   - **Name**: `6529seize-frontend`
   - **Application domain**: Your domain (e.g., `seize.io`)
   - **Enable X-Ray tracing**: No
   - **Session sample rate**: Match `AWS_RUM_SAMPLE_RATE` (default 20%)
   - **Telemetries**: Errors, Performance, HTTP

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# AWS RUM Configuration
NEXT_PUBLIC_AWS_RUM_APP_ID=your-app-monitor-id-here
NEXT_PUBLIC_AWS_RUM_REGION=us-east-1
NEXT_PUBLIC_AWS_RUM_IDENTITY_POOL_ID=your-cognito-identity-pool-id
```

### 3. AWS IAM Setup

The AWS RUM service will automatically create:
- A Cognito Identity Pool
- An IAM role with `rum:PutRumEvents` permissions

**Important**: Make sure the IAM role has the correct trust relationship for Cognito.

## Features Monitored

- **JavaScript Errors**: Unhandled exceptions and error boundaries
- **Performance Metrics**: Core Web Vitals (LCP, FID, CLS)
- **HTTP Requests**: API calls and resource loading
- **Page Views**: initial and client-side navigation grouped by stable App
  Router families

## Configuration Details

### Telemetry Types

- `errors`: JavaScript errors and exceptions
- `performance`: Page load times, Core Web Vitals
- `http`: Network requests and responses. Product-owned API routes remain
  visible; low-signal third-party telemetry/provider endpoints such as AWS RUM
  service traffic, Google Analytics collect, Coinbase telemetry, Mixpanel
  track/engage, and WalletConnect RPC/identity requests are excluded from HTTP
  telemetry. The provider's `urlsToExclude` list is the source of truth for the
  exact URL patterns. The provider uses the SDK's official fetch and XHR
  plugins behind a narrow record filter that drops only `AbortError`,
  `signal is aborted without reason`, and `Fetch is aborted` cancellation
  failures. Successful responses, non-2xx responses, timeouts, and other
  network failures remain visible.
- Custom-event ownership and compatibility status are catalogued in
  `ops/telemetry/registry.json`.

### Session Management

- **Sample Rate**: configurable via `AWS_RUM_SAMPLE_RATE` (default 20%)
- **Event Limit**: 200 events per session (cost control)
- **Session Length**: 30 minutes (AWS default)

### Page Tracking

- The SDK's automatic page-view plugin is disabled because it derives page IDs
  from raw browser paths. `AwsRumProvider` records the initial page and later
  Next.js client navigations with allowlisted route families such as `/waves`
  and `/waves/[wave]`.
- Query strings, hashes, profile/wallet values, UUIDs, and other dynamic route
  parameters are never included in the page ID. Unknown subroutes collapse to a
  known top-level family, profile CMS paths use `/[user]/[...cmsPath]`, and
  non-page roots use `/unknown`.
- Consecutive navigations with the same normalized family are deduplicated.

## Production Considerations

1. **Adjust Sample Rate**: Consider reducing `sessionSampleRate` to 0.1 (10%) for high-traffic sites
2. **Cost Management**: Monitor your CloudWatch RUM costs and adjust `sessionEventLimit`
3. **Regional Deployment**: Ensure the RUM region matches your primary AWS region
4. **Privacy Compliance**: Keep page IDs and custom-event attributes bounded in
   application code; do not rely on provider-side scrubbing for route values

## Troubleshooting

### RUM Not Initializing

- Check browser console for initialization messages
- Verify environment variables are set correctly
- Ensure CSP allows AWS RUM domains (already configured)

### Missing Data

- Check AWS IAM permissions
- Verify Cognito Identity Pool configuration
- Check network requests to `dataplane.rum.*.amazonaws.com`

### Development Mode

RUM is automatically disabled in development mode to avoid noise. Set `NODE_ENV=production` to test.

## Manual Event Tracking

Access the RUM client globally for custom tracking:

```typescript
// Available globally after initialization
const rumClient = window.awsRum;

// Record custom events (if custom events are enabled in AppMonitor)
rumClient?.recordEvent('custom_event', { key: 'value' });

```

Page views are owned centrally by `AwsRumProvider`. Do not call
`recordPageView` with a raw URL or route parameter from feature code.
