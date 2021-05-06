import platform
import shlex
import subprocess
import sys


def _(args):
    """
    Safe shell splitting
    :param args:
    :type args:
    :return:
    :rtype:
    """
    if platform.system() == "Windows":
        return args
    else:
        return shlex.split(args)


def run_subprocess_sys(args, cwd: str = None):
    """
    Run a subprocess, but pipe the stdout, stderr of the process to
    the core terminal
    :param args:
    :type args:
    :return:
    :rtype:
    """
    _proc = subprocess.Popen(
        _(args),
        cwd=cwd,
        stderr=sys.stderr,
        stdout=sys.stdout,
        stdin=sys.stdin
    )
    return _proc
