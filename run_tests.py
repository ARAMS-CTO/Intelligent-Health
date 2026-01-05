import sys
import os
import pytest

# Add current directory to sys.path explicitly
sys.path.append(os.getcwd())

print(f"Running tests with sys.path: {sys.path}")

# Run pytest
exit_code = pytest.main(["server/tests", "-v"])
sys.exit(exit_code)
