var util = require('util');
var _    = require('lodash-node');

/**
 * Convert a graph representation to a Node-Edge-Node based Network.
 *
 * @param graph
 * @returns {{getNetwork: Function}}
 * @constructor
 */
function GraphNetwork(graph)
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

    var network = createNetwork(graph);

    return {
        /**
         * Returns the network built from the given graph.
         *
         * @returns {*}
         */
        getNetwork: function(){
            return network;
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

    var _debug = false;

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
        var v = [[]];                           // visited nodes for each layer   ; dimension: x * x
        var u = [];                             // unvisited nodes                ; dimension: x
        var d = 0;                              // current depth                  ; min: 0 ; max: x

        // Push our root path
        s.push(currentNode);

        while(s.length > 0)
        {
            //u = currentNode.edges - v;
            u = []; // empty unvisited nodes, as we generate them now
            _.forEach(currentNode.getEdges(), function(edge){
                if(edge.getWeight() === Infinity)
                    return; // filter impossible edges (loop or cut)

                for(var visitedNode_idx in v[d])
                    if(v[d][visitedNode_idx] === edge.getDestination())
                        return; // it was already visited

                for(var currentPathNodes_idx in s)
                    if(s[currentPathNodes_idx] === edge.getDestination())
                        return; // they are our parents, so we visited them already

                u.push(edge.getDestination()); // it is not visited
            });

            if(u.length > 0)
            { // traverse unvisited
                v[++d] = []; // reset visited nodes for comming layer

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
        ,toggleDebug: function(){_debug = !_debug;}
    };
}

var Problem = new GraphNetwork([
    Infinity, 906, 814, 30, 198,
    906, Infinity, 633, 225, 103,
    814, 633, Infinity, 462, 553,
    30, 225, 462, Infinity, 814,
    198, 103, 553, 814, Infinity
]);

// Init our TSM and solve it
var ProblemSolver = new TSM(Problem.getNetwork());
ProblemSolver.toggleDebug();
ProblemSolver.solve(0);

// Print the solution
var printPath = [];
_.forEach(ProblemSolver.getBestPath(), function(node){
    printPath.push(node.getName());
});
console.log('bestCost: ', ProblemSolver.getBestCost());
console.log('bestPath: ', printPath);
