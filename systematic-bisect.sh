#!/bin/bash

# Systematic bisect to find when MetaMask mobile connection broke
# This script helps you test commits systematically

echo "================================================"
echo "  MetaMask Mobile Connection - Bisect Helper"
echo "================================================"
echo ""
echo "You are now on branch: metamask-bisect"
echo "Current commit: $(git log --oneline -1)"
echo ""

# Create a log file to track results
LOG_FILE="bisect-results.log"
echo "Test Results for MetaMask Mobile Connection" > $LOG_FILE
echo "===========================================" >> $LOG_FILE
echo "" >> $LOG_FILE

# Function to test a commit
test_commit() {
    local commits_back=$1
    local target="HEAD~$commits_back"
    
    echo ""
    echo "================================================"
    echo "Testing: $target ($commits_back commits back)"
    echo "================================================"
    
    git checkout $target 2>/dev/null
    
    local commit_hash=$(git rev-parse --short HEAD)
    local commit_msg=$(git log --oneline -1 --format="%s")
    local commit_date=$(git log -1 --format="%cd" --date=short)
    
    echo "Commit: $commit_hash"
    echo "Date: $commit_date"
    echo "Message: $commit_msg"
    echo ""
    echo "Files changed in this commit:"
    git diff --name-only HEAD~1 HEAD | grep -E "(wallet|metamask|wagmi|appkit|reown|provider|connector)" -i || echo "  (no wallet-related files)"
    
    echo ""
    echo "NOW YOU NEED TO:"
    echo "1. Run: npm install"
    echo "2. Run: npm run build"
    echo "3. Deploy to your mobile test environment"
    echo "4. Open on mobile and test MetaMask connection"
    echo ""
    echo "SPECIFIC TEST:"
    echo "- Click Connect"
    echo "- Select MetaMask"
    echo "- Does MetaMask app open? (y/n)"
    echo "- Does it show connection approval? (y/n)"
    echo ""
    
    read -p "Did MetaMask connection WORK properly? (y=YES works / n=NO broken / s=skip): " result
    
    # Log the result
    echo "$commits_back|$commit_hash|$result|$commit_date|$commit_msg" >> $LOG_FILE
    
    case $result in
        y|Y) 
            echo "✅ WORKING at $target"
            return 0
            ;;
        n|N) 
            echo "❌ BROKEN at $target"
            return 1
            ;;
        s|S) 
            echo "⏭️ SKIPPED $target"
            return 2
            ;;
        *)
            echo "Invalid input. Treating as broken."
            return 1
            ;;
    esac
}

# Start testing
echo "Let's start by testing some key points to find the range:"
echo ""

# Test current (should be broken based on your report)
echo "First, let's confirm current state is broken:"
test_commit 0
CURRENT_RESULT=$?

if [ $CURRENT_RESULT -eq 0 ]; then
    echo ""
    echo "🤔 Current commit works? That's unexpected."
    echo "Are you sure the issue exists in this branch?"
    read -p "Continue anyway? (y/n): " cont
    [ "$cont" != "y" ] && exit 1
fi

# Now test progressively older commits
echo ""
echo "Now let's find a working commit by going back..."
echo ""

# Test points - adjust based on your needs
test_points=(5 10 15 20 30 40 50)
good_commit=""
bad_commit="HEAD"

for point in "${test_points[@]}"; do
    echo ""
    read -p "Test $point commits back? (y/n): " should_test
    
    if [ "$should_test" = "y" ]; then
        test_commit $point
        result=$?
        
        if [ $result -eq 0 ]; then
            echo ""
            echo "🎯 Found a WORKING commit at HEAD~$point"
            good_commit="HEAD~$point"
            break
        elif [ $result -eq 1 ]; then
            bad_commit="HEAD~$point"
        fi
    fi
done

# If we found good and bad commits, offer to bisect
if [ -n "$good_commit" ]; then
    echo ""
    echo "================================================"
    echo "  READY TO BISECT"
    echo "================================================"
    echo "Bad (broken) commit: $bad_commit"
    echo "Good (working) commit: $good_commit"
    echo ""
    echo "Now we can use git bisect to find the EXACT breaking commit."
    echo ""
    read -p "Start automatic bisect? (y/n): " do_bisect
    
    if [ "$do_bisect" = "y" ]; then
        echo ""
        echo "Starting git bisect..."
        echo ""
        
        git bisect start
        git bisect bad $bad_commit
        git bisect good $good_commit
        
        echo ""
        echo "Git will now checkout commits for you to test."
        echo "After each test, run:"
        echo "  git bisect good  (if it works)"
        echo "  git bisect bad   (if it's broken)"
        echo ""
        echo "Git will automatically find the breaking commit!"
        echo ""
        echo "When done, run: git bisect reset"
    fi
else
    echo ""
    echo "❌ Couldn't find a working commit in the range tested."
    echo "You may need to go further back."
fi

echo ""
echo "================================================"
echo "  TEST RESULTS SAVED"
echo "================================================"
echo "Results saved in: $LOG_FILE"
echo ""
cat $LOG_FILE
echo ""
echo "To return to your mobile-1 branch:"
echo "  git checkout mobile-1"
echo ""
echo "To clean up this test branch:"
echo "  git branch -D metamask-bisect"