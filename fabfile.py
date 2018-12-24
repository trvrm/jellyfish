from fabric.api import task, local
import os


def at_root():
    return ".git" in os.listdir(".")


@task
def test():
    assert at_root(), "must be at app root"
    local("python3 -m flake8")
