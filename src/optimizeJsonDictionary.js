/*
    optimizeJsonDictionary.js

    Report and reduce collisions within the current dictionary

    Outline:
    0.) load common dictionary for reference
    1.) load .dict mappings
    2.) perform a reverse map and collect collisions
    3.) analyze collision:
        3.a) if not collided then it should be fine and exist in the file
        3.b) if it exists within the parent namespace then rename to exist within the parent namespace
        3.c) if it exists in multiple namespaces promote to common and update common dictionary
    4.) compare and reduce dynamic and static

 */