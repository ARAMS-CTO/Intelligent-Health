import re
import os
import subprocess
import sys

FILES = {
    "frontend": r"f:\PROJECTS\Inteligent Health\constants\index.tsx",
    "backend": r"f:\PROJECTS\Inteligent Health\server\config.py",
    "package": r"f:\PROJECTS\Inteligent Health\package.json"
}

def get_current_version(content):
    match = re.search(r'APP_VERSION\s*=\s*"([^"]+)"', content)
    if match: return match.group(1)
    match = re.search(r'"version":\s*"([^"]+)"', content)
    if match: return match.group(1)
    return None

def bump_version(version):
    # Remove -beta, -alpha
    base = version.split('-')[0]
    parts = list(map(int, base.split('.')))
    # Increment patch
    parts[-1] += 1
    new_ver = ".".join(map(str, parts))
    return new_ver

def update_file(path, new_ver, type):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        if type == "frontend":
            new_content = re.sub(r'APP_VERSION\s*=\s*"[^"]+"', f'APP_VERSION = "{new_ver}"', content)
        elif type == "backend":
            new_content = re.sub(r'APP_VERSION:\s*str\s*=\s*"[^"]+"', f'APP_VERSION: str = "{new_ver}"', content)
        elif type == "package":
            new_content = re.sub(r'"version":\s*"[^"]+"', f'"version": "{new_ver}"', content)
            
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Updated {os.path.basename(path)} to {new_ver}")
        else:
            print(f"⚠️ No changes needed for {os.path.basename(path)}")
            
    except Exception as e:
        print(f"❌ Failed to update {path}: {e}")

def main():
    print("🚀 Starting Release Manager...")
    
    # 1. Read Base Version
    try:
        with open(FILES["frontend"], 'r', encoding='utf-8') as f:
            current_ver = get_current_version(f.read())
    except FileNotFoundError:
        print("❌ Could not find frontend constants file.")
        return

    print(f"Current Version: {current_ver}")
    
    # 2. Bump Version
    new_ver = bump_version(current_ver)
    print(f"Target Version:  {new_ver}")
    
    # 3. Synchronize All Files
    for type, path in FILES.items():
        if os.path.exists(path):
            update_file(path, new_ver, type)
        else:
            print(f"⚠️ File not found: {path}")

    print(f"\n✅ Version bumped to {new_ver}. Ready for deployment.")

if __name__ == "__main__":
    main()
