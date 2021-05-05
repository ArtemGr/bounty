#  `wrap`

Wrap is a command line python wrapper, primarily 
supporting interpreted languages. 

## Installation

```bash
git clone https://github.com/ArtemyGr/bounty
cd bounty/wrap
pip3 install .
```

## Usage

To run a script from a script directory 
for the first time, you will have to initialize 
it first before running it. This is possible using 
the `init` command.

```bash
wrap init firefox
wrap run firefox
```

Subsequently, the `init` sub command would not longer 
be required. To run the `firefox` script, just

```bash
wrap run firefox 
```

To list the compatible scripts, just do
```bash
wrap list
```

## Features ✨

### Automatic Initializing Wizard

`wrap` features an automatic configuration wizard
which asks the user for the script directory, 
containing the script files.


### `wrap.ini`configuration wizard

A typical `wrap.ini` ini configuration file 
looks like:

```ini
[Wrap]
exec = node ./firefox.js

[Initialize]
exec = yarn install
```

The `[Initialize]` section provides an `exec` key to 
provide a command to be executed when `wrap init` is 
executed.

THe `[Wrap]` section also provides an `exec` key to 
provide a command which would be executed when `wrap run`
is executed
## License
See [LICENSE](./LICENSE) for more information
