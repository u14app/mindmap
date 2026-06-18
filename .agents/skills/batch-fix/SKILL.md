# Batch Fix Skill

1. Parse all numbered issues from the user's message
2. Create a TodoWrite checklist with each issue
3. For each issue:
   - Read relevant files first
   - Make the fix
   - Mark todo complete
4. Run `npm run build` after all fixes
5. Run `npx eslint . --quiet`
6. Report status of each issue
