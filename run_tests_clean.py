import sys
import os
import pytest
import io

# Capture stdout/stderr
class CatchOut:
    def __init__(self):
        self.value = ""
    def write(self, txt):
        self.value += txt
    def flush(self):
        pass
    def isatty(self):
        return False

sys.path.append(os.getcwd())
catcher = CatchOut()
old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = catcher
sys.stderr = catcher

try:
    exit_code = pytest.main(["server/tests", "-v"])
finally:
    sys.stdout = old_stdout
    sys.stderr = old_stderr

with open("test_results_clean.txt", "w", encoding="utf-8") as f:
    f.write(catcher.value)

print(f"Tests finished with code {exit_code}. Results saved to test_results_clean.txt")
sys.exit(exit_code)
