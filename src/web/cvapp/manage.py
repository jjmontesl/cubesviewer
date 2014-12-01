#!/usr/bin/env python
import os
import sys
DIR_PATH = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
if not DIR_PATH in sys.path:
    sys.path.append(DIR_PATH)
parent_dir = os.path.abspath(os.path.join(DIR_PATH, '..'))
if not parent_dir in sys.path:
    sys.path.append(parent_dir)
NAME_FILE = os.path.relpath(__file__)
sys.path.append(DIR_PATH)



if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cvapp.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
