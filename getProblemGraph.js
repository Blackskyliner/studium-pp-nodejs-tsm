var tsp = require('./lib/tsplib');
var tspData = 'NAME: ulysses16.tsp\n\
TYPE: TSP\n\
COMMENT: Odyssey of Ulysses (Groetschel/Padberg)\n\
DIMENSION: 16\n\
EDGE_WEIGHT_TYPE: GEO\n\
DISPLAY_DATA_TYPE: COORD_DISPLAY\n\
NODE_COORD_SECTION\n\
1 38.24 20.42\n\
2 39.57 26.15\n\
3 40.56 25.32\n\
4 36.26 23.12\n\
5 33.48 10.54\n\
6 37.56 12.19\n\
7 38.42 13.11\n\
8 37.52 20.44\n\
9 41.23 9.10\n\
10 41.17 13.05\n\
11 36.08 -5.21\n\
12 38.47 15.13\n\
13 38.15 15.35\n\
14 37.51 15.17\n\
15 35.49 14.32\n\
16 39.36 19.56\n\
EOF';

tspData = 'NAME: burma14\n\
TYPE: TSP\n\
COMMENT: 14-Staedte in Burma (Zaw Win)\n\
DIMENSION: 14\n\
EDGE_WEIGHT_TYPE: GEO\n\
EDGE_WEIGHT_FORMAT: FUNCTION\n\
DISPLAY_DATA_TYPE: COORD_DISPLAY\n\
NODE_COORD_SECTION\n\
1 16.47 96.10\n\
2 16.47 94.44\n\
3 20.09 92.54\n\
4 22.39 93.37\n\
5 25.23 97.24\n\
6 22.00 96.05\n\
7 20.47 97.02\n\
8 17.20 96.29\n\
9 16.30 97.38\n\
10 14.05 98.12\n\
11 16.53 97.38\n\
12 21.52 95.59\n\
13 19.41 97.13\n\
14 20.09 94.55\n\
EOF';

var parser = new tsp.TSPParser(tspData);
console.log(parser.parse().getGraph());

//var network = tsp.GraphNetwork().createNetworkFromTSP(tspData);

//var solver = tsp.TravellingSalesmanSolver(network, 1);
//solver.toggleDebug();
//solver.solve();
