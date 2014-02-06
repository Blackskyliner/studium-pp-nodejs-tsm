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
var ccSocket  = null;
var sendPartial = null;
var currentProblem = null;

io.sockets.on('connection', function (socket) {
    //socket.emit('get_problem');
    // TODO: theoretically we could cluster nodes therefore we would have to handle more sockets
    // But this may be some future. We could combine all local nodes to one.
    // Because of not too many time to finish this app we will just spawn n worker with seperate ports for each worker.
    // n will be the number of processors
    ccSocket = socket;

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
        isStarted = true;
        currentProblem = data.problem;
        TSPSolver.setPartialProblem(currentProblem);
        console.log('Event.problem: ',data);
    });
    socket.on('solution', function(data){
        // data.path
        // data.cost
        TSPSolver.setBestCost(data.path, data.cost);
        console.log('Event.solution: ',data);
    });
    socket.on('start', function(){
        isStarted = true;
        socket.emit('start', true);
        console.log('Event.start.');
    });
    socket.on('split', function(data){
        // data.depth
        sendPartial = data;
        console.log('Event.split: ',data);
    });
});


var solveFunctionThread = function(){
    if(isStarted)
    {
        if(currentProblem)
        {
            TSPSolver.solve(TSPSolver.getNetworkSize(), function(){
                ccSocket.emit('solution',{
                    path: tsplib.Util.nodePathToNamePath(TSPSolver.getBestPath()),
                    cost: TSPSolver.getBestCost()
                });
            });
        }else{
            ccSocket.emit('problem');
            isStarted = false;
        }

        if(TSPSolver.isFinished())
        {
            currentProblem = null;
        }else{
            if(!_.isNull(sendPartial))
            {
                ccSocket.emit('split', {
                    problem: TSPSolver.getPartialProblem(sendPartial.depth)
                });

                sendPartial = null;
            }
        }

        setImmediate(
            solveFunctionThread
        );
    }else{
        // Passively wait... else we burn our node to death with noop
        setTimeout(solveFunctionThread, 1000);
    }
};

setTimeout(solveFunctionThread, 1000);

/**
 * TODO
 * Split the Problem, so we can have multiple solver.
 * Create the real worker application.
 * Create the "master server" frontend.
 */
