import os

EXTENSIONS = ('.js', '.jsx', '.py', '.css', '.html', '.json', '.toml', '.md', '.vue')
IGNORE_DIRS = {'node_modules', '.git', '.venv', 'uploads', '__pycache__', 'dist', 'build', 'models', 'local_storage', 'scripts'}

def export_code():
    with open('codebase_export.md', 'w', encoding='utf-8') as outfile:
        outfile.write('# AgroSentry Codebase Export\n\n')
        for root, dirs, files in os.walk('.'):
            # Mutate dirs in place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
            
            for file in files:
                if file.endswith(EXTENSIONS):
                    filepath = os.path.join(root, file)
                    # skip package-lock.json
                    if 'package-lock.json' in file: continue
                    outfile.write(f"\\n### File: {filepath}\\n\\n")
                    # Determine markdown code block language
                    ext = file.split('.')[-1]
                    lang = 'javascript' if ext in ['js', 'jsx'] else ext
                    outfile.write(f"`{lang}\\n")
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"// Error reading file: {e}")
                    outfile.write(f"\\n`\\n\\n")

if __name__ == '__main__':
    export_code()
