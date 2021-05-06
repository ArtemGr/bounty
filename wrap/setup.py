from setuptools import setup, find_packages

setup(
    name='wrap',
    version='0.0.1',
    packages=find_packages(),
    url='https://github.com/ArtemGr/bounty',
    license='MIT',
    description='A python wrapper for executing interpreted scripts',
    install_requires=["click", "colorama", "inquirer"],
    entry_points={
        'console_scripts': ['wrap = wrap.cli:cli'],
    },
    classifiers=[
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Operating System :: POSIX',
    ],
)
