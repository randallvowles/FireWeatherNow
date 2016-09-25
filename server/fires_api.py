# encoding: utf-8
"""Provides the `Active Fires` API"""

def update_fires():

    # args = {
    #     "source": "..\static_data\ActiveFirePerimeters.kml",
    #     "output_file": "current.json",
    #     "output_dir": "..\output\\"
    # }
    args = {}
    AF = ActiveFires.ActiveFires(args)
    AF.emitter(AF.parser(AF.get_kml("")))


if __name__ == '__main__':
    if __package__ is None:
        import sys
        from os import path
        sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
        from src import ActiveFires as ActiveFires
    else:
        from ..src import ActiveFires as ActiveFires

# Init.
update_fires()

# put the code here to get the stations and serve the info back to the user.
# look at `Tornado` to do this.  It's the defacto standard.
