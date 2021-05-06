import os.path
import shutil
import subprocess
import sys

from wrap.scripts.base import Script
from wrap.utils.base import _, run_subprocess_sys


class YarnNodeJsScript(Script):
    def __init__(self, path: str = None):
        super().__init__(path=path, executable="yarn")

    def check(self):
        super().check()

    def initialize(self, cwd: str = None):
        print(f"Preparing the environment for node.js script '{self.path}'")
        _proc = run_subprocess_sys("{} install".format(self.executable), cwd=cwd)
        e_code = _proc.wait(9000)
        if e_code != 0:
            # something went wrong
            print("Something went wrong. This is likely not a bug in wrap, See ERR for more information.")
            return False

        return True

    def run(self, args, cwd: str = None):
        return run_subprocess_sys(args, cwd).wait()









