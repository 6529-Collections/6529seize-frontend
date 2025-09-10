#!/bin/bash
# scan-blockchain-functions.sh - Detect suspicious blockchain function calls in production build
# ZERO TOLERANCE: Any hardcoded blockchain operations = INVESTIGATE

set -e

echo "🔍 Blockchain Function Security Scan"
echo "===================================="

# Check if Next.js build directory exists
if [ ! -d ".next" ]; then
    echo "❌ Next.js build directory (.next) not found"
    echo "   Run 'npm run build' first"
    exit 2
fi

SCAN_DIR=".next"
echo "📂 Scanning directory: $SCAN_DIR"

# Focus on our own code, avoid heavily bundled dependencies
TOTAL_FILES=$(find "$SCAN_DIR" -type f \
    -not -path "*/.next/cache/*" \
    -not -path "*/.next/static/chunks/*" \
    -not -path "*/.next/server/chunks/*" \
    -not -name "*.pack" \
    \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.html" \) | wc -l)
echo "Files to scan: $TOTAL_FILES (focusing on application code)"

echo "🎯 Searching for suspicious blockchain function calls..."

DETECTIONS_FOUND=false

# Function to check for blockchain function patterns
check_blockchain_pattern() {
    local pattern_name="$1"
    local pattern="$2"
    local risk_level="$3"
    
    echo "🔍 Checking: $pattern_name"
    
    # Find files containing this pattern (focus on our code)
    FOUND_FILES=$(find "$SCAN_DIR" -type f \
        -not -path "*/.next/cache/*" \
        -not -path "*/.next/static/chunks/*" \
        -not -path "*/.next/server/chunks/*" \
        -not -name "*.pack" \
        \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.html" \) \
        -exec grep -l "$pattern" {} \; 2>/dev/null || true)
    
    if [ -n "$FOUND_FILES" ]; then
        case "$risk_level" in
            "CRITICAL") RISK_EMOJI="🚨" ;;
            "HIGH") RISK_EMOJI="⚠️" ;;
            *) RISK_EMOJI="🔍" ;;
        esac
        
        echo "$RISK_EMOJI PATTERN DETECTED: $pattern_name ($risk_level RISK)"
        echo "📁 Files:"
        echo "$FOUND_FILES" | sed 's/^/  • /'
        echo
        DETECTIONS_FOUND=true
    fi
}

# TIER 1: Direct Fund Transfer Functions (CRITICAL)
echo "🚨 TIER 1: Direct Fund Transfer Functions"
check_blockchain_pattern "ERC-20 transfer to hardcoded address" "\.transfer\s*\(.*0x[a-fA-F0-9]{40}" "CRITICAL"
check_blockchain_pattern "ERC-20 approve to hardcoded address" "\.approve\s*\(.*0x[a-fA-F0-9]{40}" "CRITICAL"
check_blockchain_pattern "ETH send to hardcoded address" "\.send\s*\(.*0x[a-fA-F0-9]{40}" "CRITICAL"
check_blockchain_pattern "sendTransaction to hardcoded address" "sendTransaction.*to.*0x[a-fA-F0-9]{40}" "CRITICAL"
check_blockchain_pattern "transferFrom with hardcoded recipient" "transferFrom.*0x[a-fA-F0-9]{40}.*0x[a-fA-F0-9]{40}" "CRITICAL"

# TIER 2: Contract Interaction Patterns (HIGH)
echo "⚠️ TIER 2: Contract Interaction Patterns"
check_blockchain_pattern "contract.transfer call" "contract\.transfer\s*\(" "HIGH"
check_blockchain_pattern "contract.approve call" "contract\.approve\s*\(" "HIGH"
check_blockchain_pattern "contract.methods.transfer" "contract\.methods\.transfer" "HIGH"
check_blockchain_pattern "contract.functions.transfer" "contract\.functions\.transfer" "HIGH"
check_blockchain_pattern "web3.eth.sendTransaction" "web3\.eth\.sendTransaction" "HIGH"
check_blockchain_pattern "signer.sendTransaction" "signer\.sendTransaction" "HIGH"

# TIER 3: Dangerous Permission Functions (CRITICAL)
echo "🚨 TIER 3: Dangerous Permission Functions"
check_blockchain_pattern "setApprovalForAll call" "setApprovalForAll\s*\(" "CRITICAL"
check_blockchain_pattern "unlimited approval (MAX_UINT256)" "MAX_UINT256" "CRITICAL"
check_blockchain_pattern "unlimited approval (type max)" "type\s*\(\s*uint256\s*\)\.max" "CRITICAL"
check_blockchain_pattern "permit function call" "permit\s*\(" "HIGH"
check_blockchain_pattern "multicall function" "multicall\s*\(" "HIGH"

# TIER 4: Low-Level Dangerous Functions (CRITICAL)
echo "🚨 TIER 4: Low-Level Functions"
check_blockchain_pattern "call with value" "call\s*\(.*value.*0x[a-fA-F0-9]{40}" "CRITICAL"
check_blockchain_pattern "delegatecall" "delegatecall\s*\(" "CRITICAL"
check_blockchain_pattern "execute function" "execute\s*\(" "HIGH"

# TIER 5: Batch/Mass Operations (HIGH)
echo "⚠️ TIER 5: Batch Operations"
check_blockchain_pattern "transferAll pattern" "transferAll\s*\(" "HIGH"
check_blockchain_pattern "withdrawAll pattern" "withdrawAll\s*\(" "HIGH"
check_blockchain_pattern "drainAll pattern" "drainAll\s*\(" "CRITICAL"
check_blockchain_pattern "sendAll pattern" "sendAll\s*\(" "HIGH"


if [ "$DETECTIONS_FOUND" = true ]; then
    echo "❌ SUSPICIOUS BLOCKCHAIN FUNCTIONS DETECTED"
    echo "==========================================="
    echo "🚨 DEPLOYMENT BLOCKED - POTENTIAL FUND THEFT RISK"
    echo
    echo "⚠️  CRITICAL SECURITY WARNING:"
    echo "The following blockchain functions were detected in your production build."
    echo "In frontend applications, these patterns are highly suspicious:"
    echo
    echo "🔍 INVESTIGATION REQUIRED:"
    echo "   • Review ALL flagged files above"
    echo "   • Verify if blockchain calls are legitimate user-initiated actions"  
    echo "   • Check if hardcoded addresses are your own legitimate addresses"
    echo "   • Investigate any unexpected or hidden blockchain operations"
    echo "   • Ensure all fund transfers are user-controlled, not automatic"
    echo
    echo "⚠️  RED FLAGS in frontend applications:"
    echo "   • Hardcoded recipient addresses in transfer functions"
    echo "   • Automatic blockchain operations without user confirmation"
    echo "   • Hidden or obfuscated fund transfer functions"
    echo "   • Unlimited approvals (MAX_UINT256) to unknown addresses"
    echo
    echo "⚠️  DO NOT DEPLOY until all patterns are verified as legitimate!"
    echo "⚠️  User funds could be at risk from these function calls!"
    exit 1
else
    echo "✅ No suspicious blockchain function patterns detected"
    echo "   Production build appears safe from hardcoded blockchain operations"
    echo "   All blockchain interactions appear to be user-controlled"
    exit 0
fi