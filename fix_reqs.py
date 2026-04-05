import subprocess
import os

# Use the venv's pip to get the exact requirements
venv_pip = os.path.join('venv', 'Scripts', 'pip.exe')
try:
    # Run pip freeze and capture output
    output = subprocess.check_output([venv_pip, 'freeze'], text=True)
    
    # Save to requirements.txt with proper line endings for Linux
    with open('requirements.txt', 'w', encoding='utf-8', newline='\n') as f:
        f.write(output)
    print("Successfully updated requirements.txt with proper formatting.")
except Exception as e:
    print(f"Error: {e}")
