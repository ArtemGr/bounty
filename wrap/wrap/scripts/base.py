
import shutil
import os


from wrap.utils.base import run_subprocess_sys


class Script:
    def __init__(
        self,
        path: str = None,
        executable: str = None,
    ):

        self.path = path
        if executable is not None:
            self.executable = shutil.which(executable)

    def check(self):
        """
        Check if the pre-requisites to run the software is met
        :return:
        :rtype:
        """
        if not os.path.exists(self.path):
            raise FileNotFoundError("Couldn't find {}".format(self.path))
        elif self.executable is None:
            raise FileNotFoundError("{} was not found in PATH. Are you sure it's on PATH?".format(self.executable))
        elif not os.path.exists(self.executable):
            raise FileNotFoundError("Invalid executable selected to run the script file, {}".format(self.executable))

    def initialize(self, args: str, cwd: str = None):
        """
        Initialize the environment for the script
        :return:
        :rtype:
        """
        return run_subprocess_sys(args, cwd).wait()

    def run(self, args, cwd: str = None):
        """
        Run the program with args
        :param args:
        :type args:
        :param cwd:
        :type cwd:
        :return:
        :rtype:
        """
        return run_subprocess_sys(args, cwd).wait()
