var util      = require('util');
var _         = require('lodash-node');
var Benchmark = require('benchmark');
var microtime = require('microtime');

var Inf = Infinity;

function nodePathToNamePath(s)
{
    var path = [];
    _.forEach(s, function(si){
        if(si)
            path.push(si.getName());
    });
    return path;
}

/**
 * This Parser can read in any .tsp file and output an graph for it.
 *
 * @param tspData
 * @returns {{parse: Function, getGraph: Function}}
 * @constructor
 */
function TSPParser(tspData)
{
    var graph = [];
    var metaData = {};

    function parse()
    {
        if((tspData.indexOf('EOF') <= -1 || tspData.indexOf('NODE_COORD_SECTION') <= -1))
            throw "Could not parse tsp data. Invalid format.";

        var nodes = [];
        var data  = tspData.split('\n');
        var i     = 0;

        while(data[i].trim() != 'NODE_COORD_SECTION')
        {
            var metaTmp = data[i++].trim().split(': ');
            metaData[metaTmp[0]] = metaTmp[1];
        }
        i++; // Skip NODE_COORD_SECTION

        while(data[i].trim() != 'EOF')
        {
            var nodeTmp = data[i++].trim().split(' ');
            nodes.push({
                longitude: nodeTmp[1],
                latitude: nodeTmp[2]
            })
        }

        _.forEach(nodes, function(outerNode){
            _.forEach(nodes, function(innerNode){
                var weight = 0;

                if(outerNode === innerNode)
                { // Loop => Inf
                    weight = Infinity;
                }else{
                    var lat1 = outerNode.latitude;
                    var lat2 = innerNode.latitude;
                    var lon1 = outerNode.longitude;
                    var lon2 = innerNode.longitude;
                    var R = 6371; // radius of earth

                    // Distance using the haversine formula
                    var dLat = (lat2-lat1) * Math.PI / 180;
                    var dLon = (lon2-lon1) * Math.PI / 180;
                    lat1 = lat1 * Math.PI / 180;
                    lat2 = lat2 * Math.PI / 180;

                    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    var d = (R * c);

                    // Spherical Law of Cosines
                    /*
                    var d = Math.acos(Math.sin(lat1) * Math.sin(lat2) +
                            Math.cos(lat1)           * Math.cos(lat2) *
                            Math.cos(lon2-lon1))     * R;
                    */

                    weight = parseInt(d);
                }
                graph.push(weight);
            });
        });

        return true;
    }

    return {
        parse: function(){ parse(); return this; }
        ,getGraph: function(){ return graph; }
        ,getMetadata: function(){ return metaData; }
    };
}

/**
 * Convert a graph representation to a Node-Edge-Node based Network.
 *
 * @constructor
 */
function GraphNetwork()
{
    /**
     * Representation of an Vertice/Node inside our graph.
     *
     * @param name name of the vertice
     * @param edges adjacent edges
     * @constructor
     */
    function V(name, edges)
    {
        var vertices = []; // adjacent vertices
        return {
            /**
             * Returns the name of the Vertice/Node.
             *
             * @returns {*}
             */
            getName: function(){ return name; }

            /**
             * Returns the requested edge.
             *
             * @param idx Index of the edge.
             * @returns {*}
             */
            ,getEdge: function(idx){ return edges[idx]; }

            /**
             * Returns all adjacent edges.
             *
             * @returns {*}
             */
            ,getEdges: function(){ return edges; }

            /**
             * Adds an adjacent Vertice/Node.
             *
             * Note: Should only be called if you know what you are doing.
             *       It's mainly used to generate the network.
             *       You will not be able to delete added Vertices/Nodes.
             *
             * @param vertice
             */
            ,addVertice: function(vertice){ vertices.push(vertice); }

            /**
             * Returns all adjacent Vertices/Nodes.
             *
             * @returns {Array}
             */
            ,getVertices: function(){ return vertices; }

            /**
             * Will return the edge to the requested Vertice/Node.
             *
             * If it do not find an corresponding edge it will return false
             *
             * @param destination
             * @returns {*}
             */
            ,findEdgeTo: function(destination)
            {
                for(var edge_idx in edges)
                {
                    var edge = edges[edge_idx];
                    if(edge.getDestination() === destination)
                        return edge;
                }

                return false;
            }
        }
    }

    /**
     * Representation of an edge between two Vertices/Nodes inside our graph
     *
     * @param weight
     * @returns {{createConnection: Function, getWeight: Function, getSource: Function, getDestination: Function}}
     * @constructor
     */
    function E(weight)
    {
        var between = [];

        return {
            /**
             * Creates the connection to the Vertices/Nodes for this edge.
             * @param source
             * @param destination
             */
            createConnection: function(source, destination) {
                between = [source, destination];
            }

            /**
             * Returns the weight of this edge
             * @returns {*}
             */
            ,getWeight: function(){ return weight; }

            /**
             * Returns the Source/From Vertice/Node of this Edge
             *
             * @returns {*}
             */
            , getSource: function(){ return between[0]; }

            /**
             * Returns the Destination/To Vertice/Node of this Edge
             * @returns {*}
             */
            , getDestination: function(){ return between[1]; }
        }
    }

    /**
     * Create the network as Vertices/Nodes with Edges between them form the given graph.
     *
     * Note: The first Node, of the returned network, will not have the name 0 but 1,
     *       the index is 0 based.
     *       (This is due to the fact that we'll never draw an 0-Node on paper)
     *
     * Example:
     *      network[0] => {name: '1', ...}
     *      network[1] => {name: '2', ...}
     *      ...
     *
     * @param graph
     * @returns {Array}
     */
    function createNetwork(graph)
    {
        var vertices = 0;

        // Autodetect number of nodes in our graph
        for(i in graph)
        {
            if(i != 0 && graph[i] == Infinity)
                break;

            if(graph[i] === Infinity) vertices = 0;
            else                vertices++
        }

        // Create those nodes
        var verticeArray = [];
        for(var i = 0; i < vertices; i++)
        {
            var edges = [];
            for(var j = 0; j < vertices; j++)
            {
                var edgeValue = graph.shift();
                edges.push(new E(edgeValue));
            }
            verticeArray.push(new V((i + 1), edges));
        }

        // Wire the nodes
        for(var oV in verticeArray)
        {
            for(var iV in verticeArray)
            {
                verticeArray[oV].addVertice(verticeArray[iV]);
            }
        }

        // wire edges
        for(var v in verticeArray)
        {
            for(var e in verticeArray[v].getEdges())
            {
                verticeArray[v].getEdge(e).createConnection(verticeArray[v], verticeArray[e])
            }
        }

        // NOTE: A weight of Infinity in our Network indicates an edge to any not reachable Node.
        //       Therefore in TSM, for example, loops on the Node itself will be Infinity.
        //       You may also be able split a Network and set all Edges between them to Infinity.

        return verticeArray;
    }

    //var network = createNetwork(graph);

    return {
        /**
         * Returns the network built from the given graph.
         *
         * @returns {*}
         */
        createNetworkFromGraph: function(graph) {
            return createNetwork(graph);
        }

        ,createNetworkFromTSP: function(tspData) {
            var parser = new TSPParser(tspData);
            var graph  = parser.parse().getGraph();

            return createNetwork(graph);
        }
    }
}

/**
 * This class can solve the TSM Problem.
 *
 * @param {GraphNetwork} network description of the problem
 * @returns {{solve: Function, getBestPath: Function, getBestCost: Function}}
 * @constructor
 */
function TSM(network)
{
    /**
     * Will hold our best path state
     *
     * @type {{path: [], cost: Number}}
     */
    var bestCosts = {
        path: null
        ,cost: Infinity
    };

    /**
     * Defines if we want to print debug messages.
     *
     * @type {boolean}
     * @private
     */
    var _debug = false;

    /**
     * Defines whether we want the best-cost cutting or not.
     *
     * @type {boolean}
     * @private
     */
    var _cutting = true;

    /**
     * Defines whether we want the min heuristic or not.
     *
     * @type {boolean}
     * @private
     */
    var _min_heuristic = true;

    /**
     * Calculates the cost for the given path through the edge weights.
     *
     * @param s path
     *
     * @returns {number} cost of the path
     */
    function calculatePathCosts(s)
    {
        var cost = 0;
        for(var node_idx = 0; node_idx < s.length; node_idx++)
        {
            var node = s[node_idx];
            var nextNode = s[node_idx+1];

            if(nextNode !== undefined)
            {
                cost += node.findEdgeTo(nextNode).getWeight();
            }
        }
        return cost;
    }

    /**
     * Solve the TSM-Problem through an iterative backtracking.
     *
     * @param start the node inside the network where we want to start
     */
    function solve(start)
    {
        var currentNode = network[start];       // x = network.length;
        var s = [];                             // current path                   ; dimension: x
        var v = [];                             // visited nodes for each layer   ; dimension: x * x
        var u = [];                             // unvisited nodes                ; dimension: x
        var d = 0;                              // current depth                  ; min: 0 ; max: x

        // Push our root path and its already visited nodes
        s.push(currentNode);
        v.push([]);

        while(s.length > 0)
        {
            //u = currentNode.edges - v;
            u = []; // empty unvisited nodes, as we generate them now
            if(_cutting)
            {
                var currentPathCosts = calculatePathCosts(s);
            }

            _.forEach(currentNode.getEdges(), function(edge){
                if(edge.getWeight() === Infinity)
                    return; // filter impossible edges (loop or cut)

                for(var visitedNode_idx in v[d])
                    if(v[d][visitedNode_idx] === edge.getDestination())
                        return; // it was already visited

                for(var currentPathNodes_idx in s)
                    if(s[currentPathNodes_idx] === edge.getDestination())
                        return; // they are our parents, so we visited them already

                if(_cutting)
                {
                    if((currentPathCosts + edge.getWeight()) >= bestCosts.cost)
                    {
                        v[d].push(edge.getDestination()); // cut suboptimal path
                    }else{
                        u.push(edge.getDestination()); // it is not visited
                    }
                }else{
                    u.push(edge.getDestination()); // it is not visited
                }
            });

            if(u.length > 0)
            { // traverse unvisited
                v[++d] = []; // reset visited nodes for comming layer

                if(_min_heuristic)
                { // Sort by min path
                    u = _.sortBy(u, function(ou){
                        return ou.findEdgeTo(currentNode).getWeight();
                    });
                    //console.log(nodePathToNamePath(u));
                }

                // get the first unvisited and push onto our path
                currentNode = u.shift();
                s.push(currentNode);
            }
            else
            { // no traversal possible
                // Calculate Pathcosts if we are in a complete path
                if(s.length === network.length)
                {
                    var pathCost = calculatePathCosts(s);
                    if(pathCost < bestCosts.cost)
                    {
                        bestCosts.cost = pathCost;
                        bestCosts.path = _.clone(s);
                    }
                }

                if(d > 0)
                {
                    v[--d].push(s.pop());
                    currentNode = s[s.length-1];
                }else{ // End of tree - finish.
                    s.pop(); // we pop our root node, so we are done.
                }
            }

            if(s.length === network.length)
            { // We got a complete path, print it.
                var printPath = [];
                _.forEach(s, function(node){
                    printPath.push(node.getName());
                });

                if(_debug)
                    console.log('Found Path: ', printPath, 'Cost: ', calculatePathCosts(s));
            }
        }
    }

    return {
        solve: solve
        /**
         * Returns the best path found.
         * @returns {*[]}
         */
        ,getBestPath: function(){return bestCosts.path;}
        /**
         * Returns the cost of the best path found.
         * @returns {Number}
         */
        ,getBestCost: function(){return bestCosts.cost;}
        /**
         * Will enable debugging output
         */
        ,toggleDebug: function(){_debug = !_debug; return _debug;}
        /**
         * Toggle cutting
         * @returns {boolean}
         */
        ,toggleCutting: function(){_cutting = !_cutting; return _cutting;}
        /**
         * Toggle min path descending heuristic
         * @returns {boolean}
         */
        ,toggleMinHeuristic: function(){_min_heuristic = !_min_heuristic; return _min_heuristic;}
    };
}

var GN = new GraphNetwork();

// Init our TSM and solve it
var Network = GN.createNetworkFromGraph([
    Inf, 906, 814,  30, 198,
    906, Inf, 633, 225, 103,
    814, 633, Inf, 462, 553,
    30, 225, 462, Inf, 814,
    198, 103, 553, 814, Inf
]);
//*/

/*var Network = GN.createNetworkFromTSP(
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

/*
var suite = new Benchmark.Suite;

suite.add('TSM Solver (cutting, min)', function(){
    var ProblemSolver = new TSM(Network);
    ProblemSolver.solve(0);
});

suite.add('TSM Solver (cutting)', function(){
    var ProblemSolver = new TSM(Network);
    ProblemSolver.toggleMinHeuristic();
    ProblemSolver.solve(0);
});

suite.add('TSM Solver (min)', function(){
    var ProblemSolver = new TSM(Network);
    ProblemSolver.toggleCutting();
    ProblemSolver.solve(0);
});

suite.add('TSM Solver', function(){
    var ProblemSolver = new TSM(Network);
    ProblemSolver.toggleCutting();
    ProblemSolver.toggleMinHeuristic();
    ProblemSolver.solve(0);
});

suite.on('cycle', function(event) {
    console.log(String(event.target));
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
});

suite.run({async: false});
//*/


var ProblemSolver = new TSM(Network);
ProblemSolver.toggleDebug();
ProblemSolver.solve(0);
//*/

// Print the solution
console.log('bestCost: ', ProblemSolver.getBestCost());
console.log('bestPath: ', nodePathToNamePath(ProblemSolver.getBestPath()));
//*/

/**
 * TODO
 * Split the Problem, so we can have multiple solver.
 * Create the real worker application.
 * Create the "master server" frontend.
 */
