#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Keep deploy-only files and generated virtual environments outside the Worker
# module root while preserving Django's conventional root-level manage.py.
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "inttegro_demo.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
