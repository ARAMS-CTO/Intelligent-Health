import pytest
import sys

# Redirect stdout to a file to capture, but force utf-8
class Logger(object):
    def __init__(self, filename="Default.log"):
        self.terminal = sys.stdout
        self.log = open(filename, "w", encoding="utf-8")

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)

    def flush(self):
        #this flush method is needed for python 3 compatibility.
        #this handles the flush command by doing nothing.
        #you might want to specify some extra behavior here.
        pass

sys.stdout = Logger("pytest_output_clean.txt")
sys.stderr = sys.stdout

re = pytest.main(["tests/unit/test_nurse.py", "-v"])
print(f"Exit Code: {re}")
