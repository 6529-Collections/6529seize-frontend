#!/bin/bash

# Script to test mobile wallet connections locally
# This script sets up a tunnel to your local development server

echo "🔄 Starting mobile wallet testing environment..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Installing..."
    
    # Check the OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "Please install ngrok manually from: https://ngrok.com/download"
            exit 1
        fi
    else
        echo "Please install ngrok from: https://ngrok.com/download"
        exit 1
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $NEXT_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start Next.js dev server in background
echo "🚀 Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 5

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server failed to start"
    exit 1
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to establish connection
sleep 3

# Extract the public URL from ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    echo "You can manually check: http://localhost:4040"
else
    echo "✅ Success! Your app is available at:"
    echo "📱 Mobile URL: $NGROK_URL"
    echo ""
    echo "📋 Instructions:"
    echo "1. Open this URL on your mobile device: $NGROK_URL"
    echo "2. Test MetaMask connection"
    echo "3. Check the console here for logs"
    echo ""
    echo "🔍 ngrok inspector: http://localhost:4040"
    echo ""
    
    # Generate QR code if qrencode is available
    if command -v qrencode &> /dev/null; then
        echo "📱 Scan this QR code with your mobile device:"
        qrencode -t UTF8 "$NGROK_URL"
    else
        echo "💡 Tip: Install qrencode to generate QR codes (brew install qrencode)"
    fi
fi

echo ""
echo "Press Ctrl+C to stop..."

# Keep script running
wait $NEXT_PID