var microtime = require('microtime');
var _         = require('lodash-node');

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
                x: parseFloat(nodeTmp[1]),
                y: parseFloat(nodeTmp[2])
            })
        }

        _.forEach(nodes, function(outerNode){
            _.forEach(nodes, function(innerNode){
                var weight = 0;

                if(outerNode === innerNode)
                { // Loop => Inf
                    weight = Infinity;
                }else{
                    /*var lat1 = outerNode.x;
                    var lat2 = innerNode.x;
                    var lon1 = outerNode.y;
                    var lon2 = innerNode.y;
                    var R = 6371; // radius of earth

                    // Distance using the haversine formula
                    var dLat = (lat2-lat1) * Math.PI / 180;
                    var dLon = (lon2-lon1) * Math.PI / 180;
                    lat1 = lat1 * Math.PI / 180;
                    lat2 = lat2 * Math.PI / 180;

                    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    weight = Math.round(R * c);

                    //*/

                    // Spherical Law of Cosines
                    /*d = Math.acos(Math.sin(lat1) * Math.sin(lat2) +
                            Math.cos(lat1)           * Math.cos(lat2) *
                            Math.cos(lon2-lon1))     * R;
                    //*/

                    // TSPLIB
                    // I don't get the right values and don't know why...
                    // I also ported the implementation from http://metah-lib.googlecode.com/svn-history/trunk/src/br/unifor/metahlib/problems/tsp/TSPInstance.java
                    // At least for the GEO problems (try ulysses16 with .optimal path as partial problem)
                    // No luck so far...
                    var RRR = 6378.388;
                    var PI = 3.141592;

                    var degreeToRadian = function(coordinate){
                        var deg = Math.round(coordinate);
                        var min = coordinate - deg;
                        return (PI * (deg + (5 * min)/3)) / 180;
                    };

                    var q1 = Math.cos(degreeToRadian(outerNode.y) - degreeToRadian(innerNode.y));
                    var q2 = Math.cos(degreeToRadian(outerNode.x) - degreeToRadian(innerNode.x));
                    var q3 = Math.cos(degreeToRadian(outerNode.x) + degreeToRadian(innerNode.x));
                    weight = Math.round( RRR * Math.acos( 0.5*((1.0+q1)*q2 - (1.0-q1)*q3) ) + 1.0);
                    //*/
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
            name: name,
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
 * @param {number}       startNode where to start in the network
 * @returns {{solve: Function, getBestPath: Function, getBestCost: Function}}
 * @constructor
 */
function TravellingSalesmanSolver(network, startNode)
{
    /**
     * Will hold our best path state
     *
     * @type {{path: [], cost: Number}}
     */
    var _bestCost = {
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
     * Represents the node we are at the moment.
     *
     * @type {GraphNetwork.V}
     * @private
     */
    var _currentNode = network[startNode - 1];

    /**
     * Represents the current path we are at (including the currentNode at the end)
     * dimension: x
     *
     * @type {Array}
     * @private
     */
    var _s = [];

    /**
     * Represents the visited nodes for each layer
     * dimension: x * x
     *
     * @type {Array}
     * @private
     */
    var _v = [];

    /**
     * Represents the unvisited nodes on all depths
     * dimension: x
     *
     * While walking the tree the visited depths are not relevant, thus we reuse their index for the next depth.
     *
     * @type {Array}
     * @private
     */
    var _u = [];

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
     * Sets the node where to start.
     *
     * (Calling this is only reasonable before solving the problem)
     *
     * @param startNode the node inside the network where we want to start
     */
    function setStartNode(startNode)
    {
        _currentNode = network[startNode];
    }

    /**
     * This function is used to define a partial problem which then gets solved.
     * Every Path which would be some kind of parent will be marked as already solved.
     *
     * @param {Array} path The path where to start solving the problem.
     */
    function setPartialProblem(path)
    {
        if(path.length > network.length) throw "Path can not be longer than the network!";

        _.forEach(path, function(pathValue, idx){
            // Set the current path
            var currentDepthNode = network[pathValue - 1]; // get the corresponding node
            var nextNodeOnPath = network[path[idx + 1] - 1];

            _currentNode = currentDepthNode;
            _s.push(_currentNode);

            _v[_s.length - 1] = _.filter(currentDepthNode.getVertices(), function(child){
                return child != nextNodeOnPath && !_.contains(_s, child) && idx < path.length - 1;
            });
        });
    }

    /**
     * Gets all unvisited Nodes for the last (current) Node on the given path.
     *
     * @param s Path to get the unvisited Nodes from.
     */
    function getUnvisitedNodes(s)
    {
        var u = [];
        var currentNode = network[parseInt(s[s.length - 1].getName())-1];

        if(_cutting)
        {
            var currentPathCosts = calculatePathCosts(s);
        }

        _.forEach(currentNode.getEdges(), function(edge){
            if(edge.getWeight() === Infinity)
                return; // filter impossible edges (loop or cut)

            for(var visitedNode_idx in _v[s.length - 1])
                if(_v[s.length - 1][visitedNode_idx] === edge.getDestination())
                    return; // it was already visited

            for(var currentPathNodes_idx in s)
                if(s[currentPathNodes_idx] === edge.getDestination())
                    return; // they are our parents, so we visited them already

            var unvisited = true;

            if(_cutting)
            {
                if((currentPathCosts + edge.getWeight()) >= _bestCost.cost)
                {
                    _v[s.length - 1].push(edge.getDestination()); // cut suboptimal path
                    unvisited = false;
                }
            }

            if(unvisited)
            {
                u.push(edge.getDestination()); // it is not visited
            }
        });

        return u;
    }

    /**
     * Solve the TSM-Problem through an iterative backtracking.
     */
    function solve()
    {
        if(_debug){
            var startTime = microtime.nowStruct();
        }
        // Push our root path and its already visited nodes if we do not have some prepared path (sub-tree solving)
        if(_s.length === 0)
        {
            _s.push(_currentNode);
            _v.push([]);
        }

        while(_s.length > 0)
        {
            _u = getUnvisitedNodes(_s);

            if(_u.length > 0)
            { // traverse unvisited
                _v[_s.length] = []; // reset visited nodes for comming layer

                if(_min_heuristic)
                { // Sort by min path
                    _u = _.sortBy(_u, function(ou){
                        return ou.findEdgeTo(_currentNode).getWeight();
                    });
                }

                // get the first unvisited and push onto our path
                _currentNode = _u.shift();
                _s.push(_currentNode);
            }
            else
            { // no traversal possible
                // Calculate Pathcosts if we are in a complete path
                if(_s.length === network.length)
                {
                    var pathCost = calculatePathCosts(_s);
                    if(pathCost < _bestCost.cost)
                    {
                        _bestCost.cost = pathCost;
                        _bestCost.path = _.clone(_s);
                    }
                }

                if(_s.length > 1)
                {
                    _v[_s.length - 2].push(_s.pop());
                    _currentNode = _s[_s.length-1];
                }else{ // End of tree - finish.
                    _s.pop(); // we pop our root node, so we are done.
                }
            }

            if(_s.length === network.length)
            { // We got a complete path, print it.
                var printPath = [];
                _.forEach(_s, function(node){
                    printPath.push(node.getName());
                });

                if(_debug){
                    var endTime = microtime.nowStruct();
                    var calculated = [
                        endTime[0]-startTime[0]+((endTime[1]-startTime[1])/1000000) // seconds
                    ];
                    calculated.push(calculated[0]/60); // minutes
                    calculated.push(calculated[1]/60); // hours

                    console.log(
                        'Found Path: ', printPath,
                        'Cost: ', calculatePathCosts(_s),
                        'Time: ',
                            'hours', calculated[2].toFixed(8),
                            'minutes', calculated[1].toFixed(8),
                            'seconds', calculated[0].toFixed(8));
                }
            }
        }
    }

    return {
        setPartialProblem: setPartialProblem
        ,setStartNode: setStartNode
        ,solve: solve
        /**
         * Returns the best path found.
         * @returns {*[]}
         */
        ,getBestPath: function(){return _bestCost.path;}
        /**
         * Returns the cost of the best path found.
         * @returns {Number}
         */
        ,getBestCost: function(){return _bestCost.cost;}
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

// Our exports for files which require this Library.
exports.TravellingSalesmanSolver = TravellingSalesmanSolver;
exports.GraphNetwork             = GraphNetwork;
exports.Util = {
    nodePathToNamePath: function(s)
    {
        var path = [];
        _.forEach(s, function(si){
            if(si)
                path.push(si.getName());
        });
        return path;
    }
};
