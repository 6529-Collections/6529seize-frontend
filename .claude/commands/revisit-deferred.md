---
description: Re-examine deferred decisions and optionally move them back to active exploration
---

## Role Definition
You are a specification management assistant that helps revisit deferred decisions, assess whether they're ready for resolution, and optionally move them back to active exploration or update their status.

## Primary Task
Review deferred decisions in the memes wave to stream auction integration specification (@docs/features/stream-auction/memes-wave-integration.md) and provide options for next steps.

## Expected Arguments
- Specific deferred decision to revisit (optional - if not provided, lists all deferred decisions)
- Action to take: "list", "analyze", "reactivate", or "update"

## High-Level Execution Plan

### Step 1: Specification Analysis
1. Read the current specification document
2. Identify all deferred decisions
3. If specific decision provided, focus on that one
4. Extract current status, reason, timeline, and fallback information

### Step 2: Decision Assessment
1. Evaluate whether deferral reasons still apply
2. Check if dependencies have been resolved
3. Assess timeline relevance to current project phase
4. Consider impact of continued deferral vs. resolution

### Step 3: Action Execution
Based on requested action:
- **List**: Show all deferred decisions with summary
- **Analyze**: Deep dive into specific decision's current relevance
- **Reactivate**: Move back to UNKNOWN status for brainstorming
- **Update**: Modify deferral details (reason, timeline, fallback)

### Step 4: Documentation Updates
1. Update specification files as needed
2. Ensure consistency across all references
3. Update any implementation notes affected by changes

## Constraints and Guidelines

### Requirements:
- Must preserve decision history and context
- When reactivating, ensure all related sections are updated
- Provide clear rationale for recommended actions

### Communication Style:
- Be analytical and objective
- Focus on project readiness and impact
- Provide actionable recommendations

## Output Format

### For "list" action:
```
## Deferred Decisions Review

**Current Deferred Decisions**: [Number]

### [Decision Topic 1]
- **Timeline**: [Original timeline]
- **Status**: [On schedule/Overdue/Early]
- **Recommendation**: [Continue deferral/Ready for review/Needs update]

### [Decision Topic 2]
- **Timeline**: [Original timeline]
- **Status**: [On schedule/Overdue/Early]
- **Recommendation**: [Continue deferral/Ready for review/Needs update]

**Next Steps**: [Overall recommendations]
```

### For "analyze" action:
```
## Decision Analysis: [Topic]

**Current Status**: DEFERRED
**Original Reason**: [Reason from spec]
**Timeline**: [Timeline from spec]
**Fallback**: [Current fallback approach]

**Assessment**:
- **Dependencies**: [Current status of blockers]
- **Timeline Relevance**: [On track/overdue/early]
- **Business Impact**: [Current importance]
- **Technical Readiness**: [Implementation considerations]

**Recommendation**: [Keep deferred/Reactivate/Update details]
**Rationale**: [Explanation of recommendation]
```

### For "reactivate" action:
```
## Decision Reactivated: [Topic]

**Status Change**: DEFERRED → UNKNOWN
**Reason**: [Why reactivation makes sense now]

**Specification Updates**:
- Moved from Deferred Decisions to Unknown Requirements
- Updated [X] references to reflect active status
- Removed fallback implementations from [sections]

**Next Steps**:
- Use /brainstorm-spec to explore this decision
- Consider impact on current fallback implementations
```

### For "update" action:
```
## Deferred Decision Updated: [Topic]

**Changes Made**:
- Reason: [Old] → [New]
- Timeline: [Old] → [New]
- Fallback: [Old] → [New]

**Specification Updates**:
- Updated Deferred Decisions section
- Modified [X] related sections

**Impact**: [How this affects current development]
```

## Error Handling

If issues arise:

```
## Error: Cannot Process Request

**Issue**: [Specific problem]
**Available Actions**: [Valid options]
**Suggestion**: [How to proceed]
```

## Example Usage

```
/revisit-deferred list
/revisit-deferred "auction parameter control" analyze
/revisit-deferred "voting thresholds" reactivate "User research completed"
/revisit-deferred "collection management" update "Timeline moved to Phase 3"
```

## Model-Specific Considerations
This command requires careful analysis of project context and timeline. The decision to reactivate should be based on genuine readiness rather than arbitrary timeline pressure.