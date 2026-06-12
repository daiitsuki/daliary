# File Search & Context Gathering Rules

**CRITICAL: DO NOT MANUALLY SCAN THE ENTIRE FILE TREE**

To save tokens and execution time:
1. When you need to understand the project structure or find a specific component/file, **DO NOT** run `ls`, `tree`, or `find` commands on the whole workspace.
2. Instead, **ALWAYS read `PROJECT_MAP.md`** located in the root directory first.
3. Use the information in `PROJECT_MAP.md` to pinpoint the exact files you need, and open only those specific files.
4. If you add, delete, or rename files/directories significantly, run `tree -I 'node_modules|.git|dist|build|.vercel|.next|.gemini|.antigravitycli' --dirsfirst > PROJECT_MAP.md` to update the map.
