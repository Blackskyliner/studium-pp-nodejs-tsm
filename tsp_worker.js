var util      = require('util');
var _         = require('lodash-node');
var tsplib    = require('./lib/tsplib.js');

var args = process.argv.splice(2);

if(args.length <= 0 || args.length > 1)
{
    console.error('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' <port>');

    return -1;
}

// Cleanup
process.on('SIGINT', function(){
    console.log('Teardown connected clients...');
    io.sockets.clients().forEach(function(client){client.disconnect();});
    process.exit(-1);
});


var port = parseInt(args[0]);
var io = require('socket.io').listen(port);

var TSPSolver = null;
var Network   = null;
var isStarted = false;

io.sockets.on('connection', function (socket) {
    //socket.emit('get_problem');

    socket.on('init', function(data){
        // data.graph - Global Graph
        // data.start - Where to start our travel
        var graph = data.graph;
        for(var idx in graph)
        {
            var value = graph[idx];
            if(value !== -1)
                graph[idx] = value;
            else
                graph[idx] = Infinity;
        }

        console.log('Init: Got graph', graph);

        Network   = tsplib.GraphNetwork().createNetworkFromGraph(graph);
        TSPSolver = new tsplib.TravellingSalesmanSolver(Network, data.start);
        TSPSolver.toggleDebug();

        // TODO: optimalDepth should be generated through an plausible heuristic!
        socket.emit('init', {done: true, optimalDepth: 2});
    });
    socket.on('problem', function(data){
        // data.problem
        TSPSolver.setPartialProblem(data.problem);
        isStarted = true;
    });
    socket.on('solution', function(data){
        // data.path
        // data.cost
        TSPSolver.setBestCost(data.path, data.cost);
    });
});


var solveFunctionThread = function(){
    if(isStarted)
    {
        TSPSolver.solve(20);
    }

    setImmediate(
        solveFunctionThread
    );
};

setImmediate(
    solveFunctionThread
);

/**
 * TODO
 * Split the Problem, so we can have multiple solver.
 * Create the real worker application.
 * Create the "master server" frontend.
 */
