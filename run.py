import os
import sys
import subprocess

if __name__ == '__main__':
    # Install required packages if missing
    required = ['flask', 'flask-cors', 'requests', 'python-dotenv']
    for pkg in required:
        try:
            __import__(pkg.replace('-', '_'))
        except ImportError:
            print(f"[SETUP] Installing {pkg}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

    # Run the server
    os.system(f'"{sys.executable}" -u server.py')
