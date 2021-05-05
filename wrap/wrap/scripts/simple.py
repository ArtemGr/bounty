from .base import Script


class SimpleScript(Script):
    def __init__(self, commands: str = None):
        super().__init__(commands)

    def check(self):
        pass



