
import os
import inquirer

from configparser import ConfigParser


class ConfigManager:
    def __init__(self):
        self._path = os.path.join(os.path.expanduser("~"), ".wraprc")
        if not os.path.exists(self._path):
            self.create()

        self.config = ConfigParser()
        self.config.read(self._path)

    def create(self):
        config = ConfigParser()
        print("Looks like this is the first time you are running wrap.")

        _continue = inquirer.confirm(
            "Would you like to go through an interactive configuration wizard?", default=True)

        if not _continue:
            print("The configuration is incomplete. Manually fill in the ~/.wraprc with the required values")
            return

        print("Please provide the path to the script folder:")
        script_folder_prompt = \
            inquirer.Path('script_folder', normalize_to_absolute_path=True,
                          path_type=inquirer.Path.DIRECTORY, exists=True)

        prompt = inquirer.prompt([script_folder_prompt])

        config["Main"] = {
            "ScriptFolder": prompt.get("script_folder")
        }
        with open(self._path, "w") as fp:
            config.write(fp)

        print("Configuration has been successfully created.")
