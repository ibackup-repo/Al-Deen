import os

EXTENSIONS = (".ts", ".tsx", ".js", ".jsx")

# Exact string replacements (wrapped in single quotes)
REPLACEMENTS = {
    '["text"]': '["Text"]',
}

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", ".next"}

modified_count = 0

for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith(EXTENSIONS):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            new_content = content
            for old, new in REPLACEMENTS.items():
                new_content = new_content.replace(old, new)

            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated: {file_path}")
                modified_count += 1

print(f"\nFinished refactoring references in {modified_count} files.")