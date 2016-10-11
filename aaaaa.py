# encoding: utf-8

thing = [
    {"a": 1, "b": 2},
    {"c": 1, "d": 2},
    {"e": 1, "f": 2}
]

idx = 0
print thing[idx]

if 'a' in thing[idx] and 'b' in thing[idx]:
    print "YES"
else:
    print "NOPE"
