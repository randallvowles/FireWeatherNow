# encoding: utf-8
"""Tests ActiveFirePaser"""

def list_fires():
    """Main handler"""

    args = {
        "source": "../static_data/ActiveFirePerimeters.kml",
        "output_dir": "../output/",
        "output_file": "current.json"
    }
    AF = ActiveFiresKML.ActiveFiresKML(args)

    active_fires = AF.parser()
    for k in active_fires:
        print(k)


def save_parsed_file():
    args = {
        "source": "../static_data/ActiveFirePerimeters.kml",
        "output_dir": "../output/",
        "output_file": "current.json"
    }
    AF = ActiveFiresKML.ActiveFiresKML(args)
    AF.emitter(AF.parser())


if __name__ == '__main__':
    if __package__ is None:
        import sys
        from os import path
        sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
        from src import active_fires_kml_parser as ActiveFiresKML
    else:
        from ..src import active_fires_kml_parser as ActiveFiresKML

list_fires()
save_parsed_file()
