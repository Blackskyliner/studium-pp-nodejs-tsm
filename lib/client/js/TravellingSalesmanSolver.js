/**
 *
 * @param processingNodes
 * @param graph
 * @param startNode
 * @returns {{solve: solve}}
 * @constructor
 */
function TravellingSalesmanSolver(processingNodes, graph, startNode){
    "use strict";

    /**
     * @type {function}
     * @param {{cost: number, path:[]}} optimalPath
     */
    var successCallback = null;

    /**
     * Holds our initialized nodes
     * @type {solvingNode[]}
     */
    var initializedNodes = [];

    /**
     *
     * @param server
     * @returns {{name: *, socket: (io.Socket), currentProblem: []}}
     */
    function solvingNode(server)
    {
        var data = {
            name: server,               // the name (ip) of our server
            socket: io.connect(server), // the socket.io websocket
            currentProblem: null        // describes the problem it tries to solve, needed if the worker dies
        };

        initializedNodes.push(data);

        return data;
    }

    function init()
    {

        var actions = {
            /**
             *
             * @param {solvingNode} node
             */
            init: function(node) {
                for(var idx in graph)
                {
                    var value = graph[idx];
                    if(value !== Infinity)
                        graph[idx] = value;
                    else
                        graph[idx] = -1;
                }

                var data = {graph: graph, start: startNode};

                node.socket.emit('init', data);

                console.log('Action.init sent to ',node.name,'with', data);
            },
            /**
             * @param {solvingNode} node
             */
            problem: function(node) {
                var data = {problem: null};
                console.log('Action.problem sent to ',node.name,'with', data);
            },
            /**
             * Send the better solution to all worker
             *
             * @param {solvingNode} node
             */
            solution: function(node) {
                var data = {solution: null};
                console.log('Action.solution sent to ',node.name,'with', data);
            }
        };
        var events = {
            /**
             * Is called after successful initialisation
             * @param {solvingNode} node
             * @param {{done:boolean,optimalDepth:number}} data
             */
            init: function(node, data) {
                console.log('Event.init received from ',node.name,'with', data);

            },

            /**
             * Send a problem to the worker.
             *
             * @param {solvingNode} node
             */
            problem: function(node) {
                // node.name, node.socket, node.optimalDepth
                console.log('Event.problem received from ',server.name,'with', data);
            },

            /**
             * Found a better solution than the global path I had.
             *
             * @param {solvingNode} node
             * @param {{solution:*}} data
             */
            solution: function(node, data){
                // node.name, node.socket, node.optimalDepth
                // data.solution
                console.log('Event.solution received from ',server.name,'with', data);
            }
        };

        _.forEach(processingNodes,function(server){
            var node = solvingNode(server);

            _.forEach(events, function(eventFunc, eventName){
                node.socket.on(eventName, function(data){
                    eventFunc(node, data);
                });
            });

            actions.init(node);
        });
    }

    function solve(callback)
    {
        if(!_.isUndefined(callback)) successCallback = callback;

        // Start Solving
        _.forEach(processingNodes,function(server){
            server.socket.emit(
                'start'
            );
        });
    }

    return {
        solve: solve,
        init: init
    };
}
