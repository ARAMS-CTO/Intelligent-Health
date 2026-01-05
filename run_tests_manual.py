import sys
import os
import pytest

# Ensure the CURRENT directory (root of the repo) is in sys.path
root_dir = os.getcwd()
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

print(f"Running tests from: {root_dir}")
# No print(sys.path) to avoid cluttering output unless debugging needed

# Running pytest as if 'python -m pytest' was called, but inside python
# Arguments: target dir, verbose
sys.exit(pytest.main(["server/tests", "-v"]))
