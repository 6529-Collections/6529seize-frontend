import React, { useEffect, useState } from 'react';
import { 
  WebSocketProvider, 
  useWebSocketMessage, 
  useWebSocket, 
  useWebSocketAuth,
  WebSocketStatus,
  DEFAULT_WEBSOCKET_CONFIG
} from '..';
import { WsMessageType } from '../../../helpers/Types';

/**
 * Example message types
 */
interface NotificationMessage {
  id: string;
  message: string;
  timestamp: number;
}

interface PriceUpdateMessage {
  symbol: string;
  price: number;
  change: number;
}

/**
 * Connection status display component
 */
function ConnectionStatus() {
  const { status } = useWebSocket();
  
  // Style based on connection status
  let statusColor = 'gray';
  if (status === WebSocketStatus.CONNECTED) {
    statusColor = 'green';
  } else if (status === WebSocketStatus.CONNECTING) {
    statusColor = 'orange';
  }
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <span>Connection Status: </span>
      <span style={{ 
        color: statusColor, 
        fontWeight: 'bold' 
      }}>
        {status}
      </span>
    </div>
  );
}

/**
 * Notification display component using single message subscription
 */
function NotificationListener() {
  const { data, isConnected } = useWebSocketMessage<any>(WsMessageType.DROP_UPDATE);

  useEffect(() => {
    console.log('data', data);
  }, [data]);
  
  if (!isConnected) {
    return <div>Waiting for connection...</div>;
  }
  
  if (!data) {
    return <div>No notifications yet</div>;
  }
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem'
    }}>
      <h3>Latest Notification</h3>
      <p><strong>ID:</strong> {data.id}</p>
      <p><strong>Message:</strong> {data.message}</p>
      <p><strong>Time:</strong> {new Date(data.timestamp).toLocaleTimeString()}</p>
    </div>
  );
}

/**
 * Price display component using single message subscription
 */
function PriceListener() {
  const { data, isConnected } = useWebSocketMessage<PriceUpdateMessage>('price-update');
  
  if (!isConnected) {
    return <div>Waiting for connection...</div>;
  }
  
  if (!data) {
    return <div>No price updates yet</div>;
  }
  
  // Determine if price went up or down
  const changeColor = data.change >= 0 ? 'green' : 'red';
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem'
    }}>
      <h3>Latest Price Update</h3>
      <p><strong>Symbol:</strong> {data.symbol}</p>
      <p><strong>Price:</strong> ${data.price.toFixed(2)}</p>
      <p>
        <strong>Change:</strong> 
        <span style={{ color: changeColor }}>
          {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
        </span>
      </p>
    </div>
  );
}

/**
 * Connection controls component
 */
function ConnectionControls() {
  const { connect, disconnect, status } = useWebSocket();
  const [token, setToken] = useState('');
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Auth token (optional)"
        style={{ marginRight: '0.5rem', padding: '0.5rem' }}
      />
      
      <button
        onClick={() => connect(token || undefined)}
        disabled={status === WebSocketStatus.CONNECTED || status === WebSocketStatus.CONNECTING}
        style={{ marginRight: '0.5rem', padding: '0.5rem' }}
      >
        Connect
      </button>
      
      <button
        onClick={() => disconnect()}
        disabled={status === WebSocketStatus.DISCONNECTED}
        style={{ padding: '0.5rem' }}
      >
        Disconnect
      </button>
    </div>
  );
}

/**
 * Message simulator component
 */
function MessageSimulator() {
  const { status } = useWebSocket();
  const isConnected = status === WebSocketStatus.CONNECTED;
  
  // Send a simulated notification message
  const sendNotification = () => {
    // This would normally come from the server
    // Here we're just logging what would be sent
    console.log('Simulated sending notification:', {
      type: 'notification',
      data: {
        id: `notif-${Date.now()}`,
        message: 'This is a test notification',
        timestamp: Date.now()
      }
    });
  };
  
  // Send a simulated price update message
  const sendPriceUpdate = () => {
    // This would normally come from the server
    // Here we're just logging what would be sent
    const randomChange = (Math.random() * 2 - 1).toFixed(2);
    console.log('Simulated sending price update:', {
      type: 'price-update',
      data: {
        symbol: 'ETH',
        price: 3500 + parseFloat(randomChange) * 50,
        change: parseFloat(randomChange)
      }
    });
  };
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3>Message Simulator</h3>
      <p>
        <small>
          Note: This only simulates what messages would look like.
          Check the console for the message format.
        </small>
      </p>
      <button
        onClick={sendNotification}
        disabled={!isConnected}
        style={{ marginRight: '0.5rem', padding: '0.5rem' }}
      >
        Simulate Notification
      </button>
      
      <button
        onClick={sendPriceUpdate}
        disabled={!isConnected}
        style={{ padding: '0.5rem' }}
      >
        Simulate Price Update
      </button>
    </div>
  );
}

/**
 * Authentication example component
 */
function AuthExample() {
  const { isAuthenticated, status, manualConnect, disconnect } = useWebSocketAuth();
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem'
    }}>
      <h3>Auth Integration Example</h3>
      <p>
        <strong>Status:</strong> {status}
      </p>
      <p>
        <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
      </p>
      <p>
        <small>
          This component uses useWebSocketAuth() which automatically connects
          with the auth token when available and reconnects if the token changes.
        </small>
      </p>
    </div>
  );
}

/**
 * Main WebSocket demo component 
 */
export function WebSocketDemoContent() {
  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>WebSocket Demo</h1>
      
      <ConnectionStatus />
      <ConnectionControls />
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <NotificationListener />
        </div>
        <div style={{ flex: 1 }}>
          <PriceListener />
        </div>
      </div>
      
      <MessageSimulator />
      <AuthExample />
    </div>
  );
}

/**
 * WebSocket demo with provider included
 * This is the component you would import and use directly
 */
export default function WebSocketDemo() {
  return (
    <WebSocketProvider config={DEFAULT_WEBSOCKET_CONFIG}>
      <WebSocketDemoContent />
    </WebSocketProvider>
  );
}
