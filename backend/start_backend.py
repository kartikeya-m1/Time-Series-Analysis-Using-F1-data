#!/usr/bin/env python3
"""
Startup script for F1 Dashboard Backend
Installs dependencies and starts the Flask server
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    return True

def start_server():
    """Start the Flask server"""
    print("Starting F1 Data API Backend...")
    try:
        subprocess.run([sys.executable, "f1_api.py"])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    print("🏎️  F1 Dashboard Backend Startup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("f1_api.py"):
        print("❌ f1_api.py not found. Please run this script from the backend directory.")
        sys.exit(1)
    
    # Install requirements
    if install_requirements():
        print("\n🚀 Starting server...")
        start_server()
    else:
        print("❌ Failed to install dependencies. Please check your Python environment.")
        sys.exit(1)