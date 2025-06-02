## Enhanced Test Coverage Prompt

**Task:**
Iteratively enhance the project's test suite to achieve both quantitative coverage targets (+0.2% above baseline) and qualitative testing excellence through comprehensive real-world scenarios, within a time-boxed constraint.

**Time Management:**
- The coverage improvement task has a **20-minute time limit** (configurable via `TIME_LIMIT_MINUTES` environment variable)
- The task will complete successfully when either:
  - The coverage target is reached (+0.2% above baseline), OR
  - The time limit is reached
- This prevents endless iteration while encouraging focused, incremental improvements

**Testing Philosophy:**
- Coverage percentage is a metric, not the goal
- Each test should validate actual business requirements or prevent real bugs
- Tests should tell a story about how the system behaves under various conditions
- Quality over quantity - write meaningful tests within the time constraint

**Workflow:**

1. **Execute Script:** Run `npm run improve-coverage`
   - The script will use the environment variables you set up

2. **Parse Output:** Analyze the coverage report for:
   - Current coverage percentage vs. target
   - Time elapsed and remaining
   - Specific files needing coverage

3. **Time-Aware Test Strategy:**
   Given the time constraint, prioritize tests in this order:
   
   **First 5-7 minutes: High-Impact Tests**
   - Critical business logic paths
   - Known bug-prone areas
   - Most common user scenarios
   - Error handling for frequent failures
   
   **Next 5-7 minutes: Coverage Gaps**
   - Target specific uncovered lines
   - Add edge cases for covered functions
   - Integration points between components
   
   **Final 5-6 minutes: Polish & Verify**
   - Ensure all tests pass
   - Quick refactor for clarity
   - Add essential edge cases if time permits

4. **Strategic Test Planning:**
   When adding tests for `[FILENAME]`, follow this comprehensive approach:

   ### A. Scenario Analysis (Before Writing Tests)
   - **User Journey Mapping**: Identify all ways users interact with this component
   - **Integration Points**: Map dependencies and external service interactions
   - **State Variations**: List all possible component states and transitions
   - **Data Variations**: Consider edge cases in data (null, undefined, empty, massive datasets)

   ### B. Test Categories to Implement

   **With Time Constraints, Prioritize:**

   **1. Happy Path Tests** (20% of effort)
   - Basic functionality with valid inputs
   - Common user workflows
   - Expected successful outcomes

   **2. Error Handling Tests** (30% of effort)
   - Network failures and timeouts
   - Invalid user inputs
   - Missing required data
   - API error responses (400, 401, 403, 404, 500)
   - Most likely failure scenarios

   **3. Edge Case Tests** (25% of effort)
   - Boundary values (0, -1, MAX_INT, empty strings, etc.)
   - Unusual but valid input combinations
   - Focus on most probable edge cases first

   **4. Integration Tests** (15% of effort)
   - Component interaction flows
   - Data flow between parent/child components
   - Critical integration points only

   **5. Performance & Security Tests** (10% of effort)
   - Only if time permits
   - Focus on obvious security issues
   - Basic performance sanity checks

   **Time Management Tips:**
   - Start with the highest-risk areas
   - Write one complete test suite before moving to the next
   - If running low on time, focus on error handling over edge cases
   - Always leave 2-3 minutes for test cleanup and verification

   ### C. Test Quality Checklist
   For each test, ensure:
   - [ ] **Clear test name** describing the scenario and expected outcome
   - [ ] **Arrange-Act-Assert** structure
   - [ ] **Independent**: No dependency on other tests
   - [ ] **Deterministic**: Same result every time
   - [ ] **Fast**: Milliseconds, not seconds
   - [ ] **Focused**: Tests one behavior
   - [ ] **Realistic**: Uses production-like data/scenarios

5. **Implementation Guidelines:**

   ```typescript
   // Example structure for comprehensive testing
   describe('ComponentName', () => {
     describe('User Scenarios', () => {
       describe('when user performs common action', () => {
         it('should handle success case with visual feedback', () => {});
         it('should handle network failure gracefully', () => {});
         it('should prevent duplicate submissions', () => {});
         it('should maintain state during interruption', () => {});
       });
     });

     describe('Edge Cases', () => {
       it('should handle maximum allowed input length', () => {});
       it('should sanitize malicious input', () => {});
       it('should work across different timezones', () => {});
     });

     describe('Accessibility', () => {
       it('should announce changes to screen readers', () => {});
       it('should be keyboard navigable', () => {});
     });

     describe('Performance', () => {
       it('should render 1000 items without blocking UI', () => {});
       it('should debounce rapid user inputs', () => {});
     });
   });
   ```

6. **Specific Testing Patterns by File Type:**

   **For API Routes:**
   - Authentication/authorization scenarios
   - Rate limiting behavior
   - Request validation
   - Response format consistency
   - CORS handling
   - Concurrent request handling

   **For UI Components:**
   - User interaction flows
   - Loading/error/success states
   - Responsive behavior
   - Accessibility compliance
   - Browser compatibility issues

   **For Business Logic:**
   - All decision branches
   - State machines and transitions
   - Calculation accuracy
   - Data transformation edge cases
   - Async operation handling

7. **Real-World Scenario Examples:**

   ```typescript
   // Instead of just: "sorts items"
   it('should maintain user\'s custom sort preference after page refresh', () => {});
   
   // Instead of just: "handles errors"
   it('should retry failed requests 3 times with exponential backoff before showing error', () => {});
   
   // Instead of just: "validates input"
   it('should prevent SQL injection attempts in search field', () => {});
   ```

**Constraints:**
- Prioritize tests that would catch actual production bugs
- Include tests that verify fix for any previously reported issues
- Consider mobile/desktop differences
- Test with realistic data volumes
- Verify error messages are user-friendly
- Ensure tests document expected behavior

**Success Criteria:**
- Coverage target is met (+0.2%) OR time limit is reached
- No test is written solely for coverage
- Each test adds value by preventing a potential bug
- Test suite serves as living documentation
- Tests run quickly and reliably
- New developers can understand system behavior from tests

**Time-Based Completion:**
When the 20-minute limit is reached before the coverage target:
- The task is marked as complete (successful exit)
- Progress is preserved for the next session
- Focus on test quality over rushing to meet coverage
- Consider it a successful iteration of incremental improvement


**Example Output Scenarios:**

1. **Target Reached:**
   ```
   current: 75.20%
   Success: Current coverage has met or exceeded the target. Task completed.
   ```

2. **Time Limit Reached:**
   ```
   elapsed time: 20.1 minutes
   Success: Time limit of 20 minutes has been reached. Task completed due to time constraint.
   Final coverage: 75.15% (target was 75.20%)
   ```

3. **In Progress:**
   ```
   elapsed time: 12.3 minutes
   Time remaining: 7.7 minutes until automatic completion.
   Action: Add tests for src/utils/validation.js to improve coverage.
   ```

**Anti-Patterns to Avoid:**
- Testing implementation details instead of behavior
- Writing tests that mirror the code structure
- Over-mocking to the point tests don't reflect reality
- Ignoring flaky tests
- Testing framework code or third-party libraries
- Rushing to write low-quality tests just to beat the time limit
