# Development Workflow

This document outlines key practices and steps for successful development and refactoring within this project. It's a living document, intended to be updated as new effective patterns emerge.

## I. Planning & Preparation

1.  **Define Clear Goals:**
    *   Start with a clear understanding of what needs to be achieved (e.g., refactor a specific component, implement a new feature).
    *   Document the "why" – the problems being solved or the benefits of the change.

2.  **Structured Task Breakdown (e.g., using a PRD or Task Management System):**
    *   Break down larger objectives into smaller, manageable tasks.
    *   For significant changes, consider creating a brief Product Requirements Document (PRD) outlining the scope, technical approach, and potential risks. A well-defined "Development Roadmap" section in the PRD is particularly useful.
    *   Each task should have a clear, actionable description.

3.  **Automated Task Generation with Taskmaster (MCP):**
    *   Once a PRD is created (e.g., `your_feature_prd.txt`), use Taskmaster's MCP tools to generate an initial `tasks.json`.
    *   **Tool:** `parse_prd`
    *   **Key Parameters:**
        *   `input`: Absolute path to your PRD file.
        *   `force: true`: To overwrite any existing `tasks.json`, ensuring a clean slate.
        *   `numTasks`: Specify the approximate number of top-level tasks to generate. Align this with major phases or sections in your PRD's "Development Roadmap".
        *   `projectRoot`: The absolute path to your project's root directory.
    *   **Example:** `mcp_task-master-ai_parse_prd(force = True, input = "/path/to/your_feature_prd.txt", numTasks = "5", projectRoot = "/path/to/project")`
    *   **Benefit:** Automates the initial task creation process, ensuring consistency with the PRD and saving manual effort. A detailed PRD leads to more relevant and actionable tasks.

## II. Implementation & Refactoring Process

1.  **Iterative Development:**
    *   Tackle tasks incrementally. Avoid trying to change too much at once.
    *   Make small, testable changes.
    *   Regularly review progress and be prepared to adjust the plan.

2.  **Focus on Type Safety (TypeScript):**
    *   Leverage TypeScript's features to ensure code robustness.
    *   Define clear interfaces and types for data structures and function signatures.
    *   Aim for strong typing and use features like string literal unions, `as const`, and discriminated unions where appropriate to improve type safety and developer experience.

3.  **Configuration-Driven Architecture (Where Applicable):**
    *   For components or systems that handle multiple variations of similar logic, consider a configuration-driven approach.
    *   Define clear configuration objects/arrays that declaratively describe behavior, rather than relying solely on imperative code (e.g., large switch statements).

4.  **Isolate Changes:**
    *   When refactoring, try to update one logical part of the system at a time.
    *   Ensure a section is stable before moving to refactor dependent parts. Temporary type casts (e.g., `as any`) can be acceptable for bridging to not-yet-refactored code, with a plan to address them.

5.  **Continuous Feedback & Communication:**
    *   If working with others (including AI assistants), maintain clear communication.
    *   Provide timely feedback on proposed changes.
    *   Ask clarifying questions early to avoid misunderstandings.

## III. Code Quality & Maintenance

1.  **Systematic Cleanup:**
    *   After major changes or feature completion, dedicate time to remove dead or obsolete code.
    *   Clean up unnecessary comments.

2.  **Documentation (JSDoc / Comments):**
    *   Ensure JSDoc comments for functions, interfaces, and complex logic are clear, accurate, and up-to-date.
    *   Explain the "why" behind complex decisions in comments if the code itself isn't self-explanatory.

3.  **Thorough Testing:**
    *   Manually test all affected paths and edge cases after changes.
    *   (Future consideration: Implement automated tests for critical components.)

4.  **Adherence to Project Guidelines & Conventions:**
    *   Follow established coding styles, naming conventions, and architectural patterns for consistency.

## IV. Learning & Improvement

*   After completing a significant task or refactor, reflect on the process.
*   Identify what worked well and what could be improved.
*   Update this workflow document with new learnings and effective practices.
*   **Key Takeaway:** A detailed PRD with a clear roadmap not only aids manual planning but also significantly enhances the quality of automated task generation when using tools like Taskmaster.

## V. Task Management with Taskmaster

This section outlines the general workflow for using Taskmaster (via MCP tools) to manage development tasks after initial generation. Refer to `.cursor/rules/dev_workflow.mdc` and `taskmaster.mdc` for comprehensive tool details.

1.  **View Current Tasks:**
    *   Use `get_tasks` to see the current list of tasks, their status, and IDs.
    *   Example: `mcp_task-master-ai_get_tasks(projectRoot = "/path/to/project", withSubtasks = True)`

2.  **Determine Next Task:**
    *   Use `next_task` to identify the next task to work on based on dependencies and priorities.
    *   Example: `mcp_task-master-ai_next_task(projectRoot = "/path/to/project")`

3.  **View Specific Task Details:**
    *   Use `get_task` to understand the requirements of a specific task.
    *   Example: `mcp_task-master-ai_get_task(id = "3", projectRoot = "/path/to/project")`

4.  **Update Task Status:**
    *   As work progresses, update task statuses using `set_task_status`.
    *   Example (mark task as done): `mcp_task-master-ai_set_task_status(id = "3", status = "done", projectRoot = "/path/to/project")`
    *   Example (mark task as in-progress): `mcp_task-master-ai_set_task_status(id = "3.1", status = "in-progress", projectRoot = "/path/to/project")`

5.  **Expand Complex Tasks:**
    *   If a task is too large, use `expand_task` to break it into subtasks. This can be informed by `analyze_project_complexity` and `complexity_report` if needed.
    *   Example: `mcp_task-master-ai_expand_task(id = "5", num = "3", projectRoot = "/path/to/project")`

6.  **Log Implementation Details/Progress (for Subtasks):**
    *   Use `update_subtask` to append notes, findings, or detailed plans to a subtask's details section. This creates a valuable log of the implementation journey.
    *   Example: `mcp_task-master-ai_update_subtask(id = "5.1", prompt = "Initial exploration complete. Identified files X and Y to be modified. Plan is to...", projectRoot = "/path/to/project")`

7.  **Handle Implementation Drift:**
    *   If the implementation plan changes, use `update_task` (for a single task) or `update` (for multiple future tasks) to reflect these changes.
    *   Example: `mcp_task-master-ai_update_task(id = "4", prompt = "Revised approach: now using library Z instead of A.", projectRoot = "/path/to/project")`

8.  **Add New Tasks/Subtasks:**
    *   If new work is identified, use `add_task` or `add_subtask`.
    *   Example: `mcp_task-master-ai_add_task(prompt = "Create a new utility function for...", projectRoot = "/path/to/project")`

9.  **Maintain Dependency Integrity:**
    *   Use `add_dependency`, `remove_dependency`, `validate_dependencies`, and `fix_dependencies` as needed.

**Takeaway:** Integrating a task management system like Taskmaster via its MCP tools directly into the development workflow streamlines planning, execution, and tracking, especially when combined with detailed PRDs.

---

*Add more specific processes, tools, or conventions relevant to this project below.* 
