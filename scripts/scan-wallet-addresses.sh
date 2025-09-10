#!/bin/bash
# scan-wallet-addresses.sh - Scan production build for wallet addresses

set -e

echo "🔍 Wallet Address Security Scan"
echo "================================"

# Check if Next.js build directory exists
if [ ! -d ".next" ]; then
    echo "❌ Next.js build directory (.next) not found"
    echo "   Run 'npm run build' first"
    exit 2
fi

# Determine scan directory
SCAN_DIR=".next"
echo "📂 Scanning directory: $SCAN_DIR"

# Whitelist file location
WHITELIST_FILE="whitelist-addresses.txt"

# Create empty whitelist if it doesn't exist
if [ ! -f "$WHITELIST_FILE" ]; then
    touch "$WHITELIST_FILE"
    echo "📝 Created empty whitelist file: $WHITELIST_FILE"
fi

# Count total files to scan (exclude only build cache)
TOTAL_FILES=$(find "$SCAN_DIR" -type f \
    -not -path "*/.next/cache/*" \
    -not -name "*.pack" | wc -l)
echo "Files to scan: $TOTAL_FILES (maximum security coverage)"

# Find all Ethereum addresses in scan directory
echo "🔍 Scanning for Ethereum addresses..."
TEMP_ADDRESSES=$(mktemp)
TEMP_LOCATIONS=$(mktemp)

# Scan all files for Ethereum addresses and save results
find "$SCAN_DIR" -type f -exec grep -l "0x[a-fA-F0-9]\{40\}" {} \; > "$TEMP_LOCATIONS" 2>/dev/null || true

if [ ! -s "$TEMP_LOCATIONS" ]; then
    echo "✅ No Ethereum addresses found in build"
    rm -f "$TEMP_ADDRESSES" "$TEMP_LOCATIONS"
    exit 0
fi

# Extract all unique addresses (security-focused but performant)
echo "📍 Extracting addresses from production files..."

# Scan key production directories only (skip cache but include everything else)
find "$SCAN_DIR" -type f \
    -not -path "*/.next/cache/*" \
    -not -name "*.pack" \
    2>/dev/null | \
    xargs grep -l "0x[a-fA-F0-9]\{40\}" 2>/dev/null | \
    head -200 > files_with_addresses.tmp

# Extract all addresses from these files
cat files_with_addresses.tmp | \
    xargs grep -oH "0x[a-fA-F0-9]\{40\}" 2>/dev/null > addresses_with_files.tmp

# Get unique addresses
grep -oE "0x[a-fA-F0-9]{40}" addresses_with_files.tmp | sort -u > "$TEMP_ADDRESSES"

# Count addresses
if [ -s "$TEMP_ADDRESSES" ]; then
    ADDRESS_COUNT=$(wc -l < "$TEMP_ADDRESSES")
    UNIQUE_ADDRESSES=$(cat "$TEMP_ADDRESSES")
else
    ADDRESS_COUNT=0
    UNIQUE_ADDRESSES=""
fi

echo "Ethereum addresses found: $ADDRESS_COUNT"
echo

# Load whitelist (remove empty lines and comments)
WHITELIST=""
if [ -s "$WHITELIST_FILE" ]; then
    WHITELIST=$(grep -v "^#" "$WHITELIST_FILE" | grep -v "^$" || true)
fi

# Check addresses against whitelist
UNAUTHORIZED_ADDRESSES=""
WHITELISTED_COUNT=0
UNAUTHORIZED_COUNT=0

echo "📍 Checking addresses against whitelist..."

# Create unauthorized addresses file
> unauthorized.tmp

if [ "$ADDRESS_COUNT" -gt 0 ]; then
    # Check which addresses are not whitelisted
    if [ -n "$WHITELIST" ]; then
        # Save whitelist to temp file for efficient processing
        echo "$WHITELIST" > whitelist.tmp
        # Find addresses not in whitelist
        comm -23 "$TEMP_ADDRESSES" whitelist.tmp > unauthorized.tmp
        rm -f whitelist.tmp
    else
        # No whitelist means all addresses are unauthorized
        cp "$TEMP_ADDRESSES" unauthorized.tmp
    fi
    
    # Count results
    if [ -s unauthorized.tmp ]; then
        UNAUTHORIZED_COUNT=$(wc -l < unauthorized.tmp)
        UNAUTHORIZED_ADDRESSES=$(cat unauthorized.tmp)
    else
        UNAUTHORIZED_COUNT=0
    fi
    
    WHITELISTED_COUNT=$((ADDRESS_COUNT - UNAUTHORIZED_COUNT))
    
    # Show first 10 addresses with their locations
    echo "📍 Sample of found addresses with locations (first 10):"
    head -10 "$TEMP_ADDRESSES" | while IFS= read -r address; do
        echo "  $address"
        # Show files where this address appears
        grep ":$address$" addresses_with_files.tmp | head -3 | sed "s/:$address$//" | sed 's/^/    found in: /'
        echo
    done
    
    if [ "$ADDRESS_COUNT" -gt 10 ]; then
        echo "  ... and $((ADDRESS_COUNT - 10)) more addresses"
    fi
fi

# Summary
echo "================================"
echo "📊 Scan Summary:"
echo "   Files scanned: $TOTAL_FILES"  
echo "   Addresses found: $ADDRESS_COUNT"
echo "   Whitelisted: $WHITELISTED_COUNT"
echo "   Unauthorized: $UNAUTHORIZED_COUNT"
echo

# Decision logic
if [ "$UNAUTHORIZED_COUNT" -gt 0 ]; then
    echo "❌ DEPLOYMENT BLOCKED"
    echo "================================"
    echo "🚨 UNAUTHORIZED ADDRESSES DETECTED"
    echo
    echo "The following addresses are NOT in whitelist:"
    echo "$UNAUTHORIZED_ADDRESSES" | sed 's/^/  • /'
    echo
    echo "🛡️  Security Actions Required:"
    echo "   1. Review each unauthorized address above"
    echo "   2. Verify if addresses are legitimate for your application"
    echo "   3. Add legitimate addresses to $WHITELIST_FILE"
    echo "   4. Investigate any suspicious or unknown addresses"
    echo
    echo "⚠️  DO NOT DEPLOY until all addresses are reviewed and whitelisted"
    
    # Cleanup
    rm -f "$TEMP_ADDRESSES" "$TEMP_LOCATIONS" files_with_addresses.tmp addresses_with_files.tmp unauthorized.tmp
    exit 1
else
    if [ "$ADDRESS_COUNT" -gt 0 ]; then
        echo "✅ ALL ADDRESSES WHITELISTED"
        echo "   All found addresses are in the whitelist"
    else
        echo "✅ NO ADDRESSES FOUND"
    fi
    echo "   Deployment security check: PASSED"
    
    # Cleanup
    rm -f "$TEMP_ADDRESSES" "$TEMP_LOCATIONS" files_with_addresses.tmp addresses_with_files.tmp unauthorized.tmp
    exit 0
fi