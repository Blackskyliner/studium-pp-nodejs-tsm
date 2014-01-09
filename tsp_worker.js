var util      = require('util');
var _         = require('lodash-node');
var tsplib    = require('./lib/tsplib.js');

var GN = new tsplib.GraphNetwork();
var Network = GN.createNetworkFromTSP(
"NAME: ulysses16.tsp\n\
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
EOF"
);
//*/

var x = new tsplib.TravellingSalesmanSolver(Network, 1);

x.setPartialProblem([1,14,13,12,7,6,15,5,11,9,10,16,3,2,4,8]);
x.toggleDebug();
//x.toggleCutting();
//x.toggleMinHeuristic();
x.solve();
console.log(tsplib.Util.nodePathToNamePath(x.getBestPath()), x.getBestCost(), '1,14,13,12,7,6,15,5,11,9,10,16,3,2,4,8');

/**
 * TODO
 * Split the Problem, so we can have multiple solver.
 * Create the real worker application.
 * Create the "master server" frontend.
 */
