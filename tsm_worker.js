var util = require('util');
var _    = require('lodash-node');

function V(name, edges)
{
    return {
        name: name         // Name of this Vertice
        ,edges: edges       // adjacent edges
        ,vertices: []       // adjacent vertices
        ,findEdgeTo: function(nodeB)
        {
            for(var edge_idx in this.edges)
            {
                var edge = this.edges[edge_idx];
                if(edge.between[1] === nodeB)
                    return edge;
            }

            return false;
        }
    }
}

function E(weight)
{
    return {
        weight: weight     // weight of edge
        ,between: []        // 2 vertices (the ones this edge connects)
    }
}

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
            edges.push(E(edgeValue));
        }
        verticeArray.push(V('Node' + (i + 1), edges));
    }

    // Wire the nodes
    for(var oV in verticeArray)
    {
        for(var iV in verticeArray)
        {
            verticeArray[oV].vertices.push(verticeArray[iV]);
        }
    }

    // wire edges
    for(var v in verticeArray)
    {
        for(e in verticeArray[v].edges)
        {
            verticeArray[v].edges[e].between = [
                verticeArray[v],
                verticeArray[e]
            ];
        }
    }

    // NOTE: weight Infinity indicates an edge to the vertice itself (loop in this "state")
    // which is, at least for TSM, is an invalid path, thats why its Infinitive...
    // so it will never be seen as possible way

    return verticeArray;
}

function calculatePathCosts(s)
{
    var cost = 0;
    for(var node_idx = 0; node_idx < s.length; node_idx++)
    {
        var node = s[node_idx];
        var nextNode = s[node_idx+1];

        if(nextNode !== undefined)
        {
            cost += node.findEdgeTo(nextNode).weight;
        }
    }
    return cost;
}

/**
 * Solve the TSM-Problem through an iterative backtracking.
 *
 * @param network
 * @param startKnoten
 */
function TSM(network, startKnoten)
{
    var currentNode = network[startKnoten];   // x = graph.length;
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
        _.forEach(currentNode.edges, function(edge){
            if(edge.weight === Infinity)
                return; // filter impossible edges (loop or cut)

            for(var visitedNode_idx in v[d])
                if(v[d][visitedNode_idx] === edge.between[1])
                    return; // it was already visited

            for(var currentPathNodes_idx in s)
                if(s[currentPathNodes_idx] === edge.between[1])
                    return; // they are our parents, so we visited them already

            u.push(edge.between[1]); // it is not visited
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
                printPath.push(node.name);
            });

            console.log('Found Path: ', printPath);
        }
    }
}

var bestCosts = {
    path: null,
    cost: Infinity
};

var G = createNetwork([
    Infinity, 906, 814, 30, 198,
    906, Infinity, 633, 225, 103,
    814, 633, Infinity, 462, 553,
    30, 225, 462, Infinity, 814,
    198, 103, 553, 814, Infinity
]);

// Init our TSM and solve it
TSM(G, 0);

// Print the solution
var printPath = [];
_.forEach(bestCosts.path, function(node){
    printPath.push(node.name);
});
console.log('bestCost: ', bestCosts);
console.log('bestPath: ', printPath);
