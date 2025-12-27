# Rule: Methodically Working Through a Task List with Verification

## Goal

To guide an AI assistant (or agent) to implement a feature by working through a task list, tackling one sub-task at a time, and pausing for user review at designated checkpoints. This ensures code quality, incremental delivery, and user control.

---

## Process

1. **Start with a task list** (e.g., `tasks-[feature-name].md` as produced by the generate-tasks.md agent).
2. **Work sequentially** through each parent task, completing and verifying each sub-task before moving to the next.
3. **After each sub-task is completed:**
   - Briefly summarize the change.
   - Provide the relevant code diff or new/modified file.
   - Ask for user review and explicit approval before proceeding.
4. **If tests are specified for the sub-task:**
   - Run the relevant tests.
   - Report and explain any failures and next steps.
5. **If the user requests changes:**  
   - Pause and await new instructions, then resume workflow accordingly.
6. **Continue until all tasks and sub-tasks are complete.**  
7. **When finished:**  
   - Summarize work completed.
   - List all affected files.
   - Suggest next steps (e.g., PR creation, final review, deployment).

---

## Output & Interaction Format

For each sub-task:

1. **Display Task & Context:**
   ```
   ### Working on: [Parent Task Number & Title] – Sub-task [#]: [Sub-task Description]
   ```
2. **Implementation:**
   - Make relevant code changes; show the diff or inserts inline in Markdown code blocks.
3. **Review Request:**
   ```
   Please review the above changes for [Sub-task Description].  
   Respond:  
   - "Approve" to proceed to the next sub-task  
   - "Revise" and give instructions if changes are needed
   ```
4. **Testing (if applicable):**
   - Run tests: 
     ```
     npx jest [relevant_file.test.ts]
     ```
   - Report results.
5. **Checkpoint Tracking:**  
   - At the end of each parent task, display a checklist:
     ```
     - [x] Parent Task 1 complete
     - [ ] Parent Task 2 in progress
     ```
6. **Final Output:**
   ```
   #### All tasks complete!
   **Summary:** [Brief summary]
   **Files changed:** [list]
   **Next steps:** [e.g., open a PR, deploy, or further review]
   ```

---

## Tips

- Only proceed once explicit approval is received for each sub-task.
- Pause if clarifications are needed at any point.
- Ensure code is well-commented and follows repository conventions.
- Always summarize changes in each round.

---

_Sample starting prompt for an agent:_

```
Use @process-task-list.md to methodically work through @tasks-[feature-name].md.
Start with the first sub-task. Complete it, then present your changes and await review.
```