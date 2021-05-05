import os
from configparser import ConfigParser

import click
import colorama
from colorama import Fore

from wrap.config import ConfigManager
from wrap.scripts.simple import SimpleScript


class WrapScriptNotFound(FileNotFoundError):
    pass


class WrapScriptConfigNotFound(FileNotFoundError):
    pass


def get_wrap_ini_file(script: str):
    cfgmgr = ConfigManager()
    script_folder = cfgmgr.config["Main"]["ScriptFolder"]

    if not os.path.exists(script_folder):
        raise FileNotFoundError(f"{script_folder} does not exist")
    elif not os.path.isdir(script_folder):
        raise NotADirectoryError(f"{script_folder} is not a directory")

    script_subdir = os.path.join(script_folder, script)

    if not os.path.exists(script_subdir):
        raise WrapScriptNotFound("'{}' script does not exist in {}".format(script, script_folder))

    elif not os.path.isdir(script_subdir):
        raise NotADirectoryError(f"{script_subdir} is not a directory")

    script_rc_file = os.path.join(script_subdir, "wrap.ini")
    if not os.path.exists(script_rc_file):
        raise WrapScriptConfigNotFound(f"{script} script directory does not support wrap yet.")

    config = ConfigParser()
    config.read(script_rc_file)
    return config, script_subdir


@click.group()
def cli():
    pass


@cli.command()
def list():
    cfgmgr = ConfigManager()
    script_folder = cfgmgr.config["Main"]["ScriptFolder"]

    scripts = [x for x in os.listdir(script_folder)]
    for script in scripts:
        if os.path.exists(os.path.join(script_folder, script, "wrap.ini")):
            print("{}".format(script))



@cli.command()
@click.argument("script")
@click.argument("args", nargs=-1)
def run(script, args):
    try:
        config, script_dir = get_wrap_ini_file(script)
    except (WrapScriptConfigNotFound, WrapScriptNotFound) as e:
        print(Fore.RED + e + Fore.RESET)
        return

    exec_ = config["Wrap"]["exec"]

    script = SimpleScript(script)
    script.run("{} {}".format(exec_, ' '.join(args)), cwd=script_dir)


@cli.command()
@click.argument("script")
@click.argument("args", nargs=-1)
def init(script, args):
    try:
        config, script_dir = get_wrap_ini_file(script)
    except (WrapScriptConfigNotFound, WrapScriptNotFound) as e:
        print(Fore.RED + e + Fore.RESET)
        return
    exec_ = config["Wrap"]["exec"]

    script = SimpleScript(script)
    script.initialize("{} {}".format(exec_, ' '.join(args)), cwd=script_dir)


if __name__ == '__main__':
    colorama.init()
    cli()



