#!/usr/bin/env python3
"""
Cleanup script to remove unnecessary files and old project structure
"""
import os
import shutil
from pathlib import Path

# Base directory
BASE_DIR = r"e:\D Drive\Semester-7\Advanced Topics in Machine Learning\Final Project"

# Files and folders to remove
OLD_PROJECT_DIR = os.path.join(BASE_DIR, "f1-dashboard")

def remove_directory_safely(dir_path):
    """Safely remove a directory and all its contents"""
    try:
        if os.path.exists(dir_path):
            print(f"🗑️  Removing: {os.path.basename(dir_path)}")
            shutil.rmtree(dir_path)
            print(f"✅ Successfully removed: {dir_path}")
            return True
        else:
            print(f"⚠️  Directory not found: {dir_path}")
            return False
    except Exception as e:
        print(f"❌ Error removing {dir_path}: {e}")
        return False

def list_directory_contents(dir_path, max_depth=2):
    """List contents of a directory for confirmation"""
    if not os.path.exists(dir_path):
        print(f"Directory not found: {dir_path}")
        return
        
    print(f"\n📁 Contents of {os.path.basename(dir_path)}:")
    for root, dirs, files in os.walk(dir_path):
        level = root.replace(dir_path, '').count(os.sep)
        if level >= max_depth:
            dirs[:] = []  # Don't go deeper
            continue
            
        indent = '  ' * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = '  ' * (level + 1)
        for file in files[:5]:  # Show max 5 files per directory
            print(f"{subindent}{file}")
        if len(files) > 5:
            print(f"{subindent}... and {len(files) - 5} more files")

def main():
    print("🧹 F1 Dashboard Cleanup Script")
    print("=" * 50)
    
    # Check what we're about to remove
    print("\n🔍 Analyzing old project structure...")
    list_directory_contents(OLD_PROJECT_DIR)
    
    # Confirm the new structure exists
    new_project_dir = os.path.join(BASE_DIR, "F1-Hyperspeed-Dashboard")
    if os.path.exists(new_project_dir):
        print(f"\n✅ New project structure confirmed at: {new_project_dir}")
        list_directory_contents(new_project_dir, 1)
    else:
        print(f"\n❌ ERROR: New project structure not found at: {new_project_dir}")
        print("❌ Aborting cleanup - new structure must exist before removing old one")
        return False
    
    # Ask for confirmation
    print(f"\n⚠️  About to remove old project: {OLD_PROJECT_DIR}")
    print("   This includes:")
    print("   - Old React source code (src/)")
    print("   - Old backend files (backend/)")  
    print("   - Node modules (node_modules/)")
    print("   - Package files (package.json, package-lock.json)")
    print("   - Public assets (public/)")
    
    response = input("\n🤔 Proceed with cleanup? [y/N]: ").lower().strip()
    
    if response in ['y', 'yes']:
        print("\n🗑️  Starting cleanup...")
        
        # Remove old project directory
        if remove_directory_safely(OLD_PROJECT_DIR):
            print("✅ Old project structure successfully removed!")
        else:
            print("❌ Failed to remove old project structure")
            return False
            
        # Check remaining structure
        print(f"\n📁 Remaining project structure:")
        remaining_items = os.listdir(BASE_DIR)
        for item in remaining_items:
            item_path = os.path.join(BASE_DIR, item)
            if os.path.isdir(item_path):
                print(f"  📁 {item}/")
            else:
                print(f"  📄 {item}")
        
        print(f"\n🎉 Cleanup complete!")
        print(f"📍 Your clean project is now at:")
        print(f"   {new_project_dir}")
        
        print(f"\n🚀 Next steps:")
        print(f"   cd 'F1-Hyperspeed-Dashboard'")
        print(f"   # Then follow README.md for setup instructions")
        
        return True
    else:
        print("\n❌ Cleanup cancelled by user")
        return False

if __name__ == "__main__":
    main()