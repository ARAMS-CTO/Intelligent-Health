import pytest
import sys

class MyPlugin:
    def pytest_runtest_logreport(self, report):
        if report.failed:
            print(f"FAILED: {report.nodeid}")
            print(report.longrepr)

if __name__ == "__main__":
    sys.exit(pytest.main(["tests/unit/test_cases.py", "tests/unit/test_nurse.py", "tests/unit/test_admin.py", "-v"], plugins=[MyPlugin()]))
