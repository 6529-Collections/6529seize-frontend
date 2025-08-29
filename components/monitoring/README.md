# AWS RUM (Real User Monitoring) Integration

This directory contains the AWS RUM integration for monitoring real user performance and interactions.

## Setup

### 1. Create AWS RUM AppMonitor

1. Go to AWS CloudWatch Console
2. Navigate to RUM (Real User Monitoring)
3. Create a new AppMonitor with these settings:
   - **Name**: `6529seize-frontend`
   - **Application domain**: Your domain (e.g., `seize.io`)
   - **Enable X-Ray tracing**: Yes
   - **Session sample rate**: 100% (adjust for production)
   - **Telemetries**: Errors, Performance, HTTP, Interactions

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
- **User Interactions**: Clicks, form submissions, page navigation
- **Page Views**: SPA navigation tracking with hash and path changes

## Configuration Details

### Telemetry Types

- `errors`: JavaScript errors and exceptions
- `performance`: Page load times, Core Web Vitals
- `http`: Network requests and responses
- `interaction`: User clicks and interactions

### Session Management

- **Sample Rate**: 100% (configurable via `sessionSampleRate`)
- **Event Limit**: 200 events per session (cost control)
- **Session Length**: 30 minutes (AWS default)

### Page Tracking

- **Format**: `PATH_AND_HASH` for full SPA support
- **Excluded Pages**: Admin and internal pages are filtered out

## Production Considerations

1. **Adjust Sample Rate**: Consider reducing `sessionSampleRate` to 0.1 (10%) for high-traffic sites
2. **Cost Management**: Monitor your CloudWatch RUM costs and adjust `sessionEventLimit`
3. **Regional Deployment**: Ensure the RUM region matches your primary AWS region
4. **Privacy Compliance**: AWS RUM automatically handles PII scrubbing

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
const rumClient = (window as any).awsRum;

// Record custom events (if custom events are enabled in AppMonitor)
rumClient?.recordEvent('custom_event', { key: 'value' });

// Manual page view tracking
rumClient?.recordPageView('/custom-page');
```