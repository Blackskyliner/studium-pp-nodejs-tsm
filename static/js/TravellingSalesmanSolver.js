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

    var statusHtml;

    /**
     * Period in seconds when the starvingWatchdog will run.
     *
     * @type {number}
     */
    var watchdogDelay = 3;

    /**
     *
     * @type {[number]}
     */
    var problemStack = [];

    /**
     * This will hold our solution.
     *
     * @type {{path: [number], cost: number}}
     */
    var solution = null;

    var watchdogActivated = false;

    /**
     * Just a little helper to iterate over worker nodes
     *
     * @param callback        function to be called on all worker
     * @param [isWorking]     only call on working nodes
     * @param [isInitialized] only call initialized nodes
     */
    function forEachNode(callback, isWorking, isInitialized)
    {
        if(isWorking === undefined) isWorking = null; // true = working, false = waiting, null = both
        if(isInitialized === undefined) isInitialized = true;

        _.forEach(initializedNodes,function(node){
            if(
                ((isInitialized && node.isInitialized()) || !isInitialized) // only initialized ones and
                && ((  isWorking === true  && !node.isWaiting())    // only working nodes or
                    || isWorking === false && node.isWaiting()      // only waiting nodes or
                    || isWorking === null)                          // both of 'em
            )
            {
                return callback(node);
            }

            return true;
        });
    }

    /**
     *
     * @param server
     * @returns {{name: *, socket: (io.Socket), currentProblem: [], optimalDepth: number, isInitialized: function, isWaiting: function}}
     */
    function solvingNode(server)
    {
        var data = {
            name: server,               // the name (ip) of our server
            socket: io.connect(server,{
                'force new connection': true
            }), // the socket.io websocket
            currentProblem: null,       // describes the problem it tries to solve, needed if the worker dies
            optimalDepth: null,          // we need this to request new problems for this node

            // If we don't know the depth it is not initialized
            isInitialized: function(){ return !_.isNull(this.optimalDepth); },

            // If we don't solve a problem atm, we are waiting for one.
            isWaiting: function (){ return _.isNull(this.currentProblem); }
        };

        initializedNodes.push(data);

        return data;
    }

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

            // TODO: add size check for optimal depth
            // TODO: add some ack mechanism and keep the problem on some kind of stack,
            //       else if the node dies the path would never get solved...
            data.problem = problemStack.shift();
            if(data.problem)
            {
                console.log(problemStack);
                node.socket.emit('problem', data);
                node.currentProblem = data.problem;
                console.log('Action.problem sent to ',node.name,'with', data);
                updateUi(node);
            }
        },
        /**
         * Send the better solution to all worker
         *
         * @param {solvingNode} node
         * @param path
         * @param cost
         */
        solution: function(node, path, cost) {
            var data = {path: path, cost: cost};

            node.socket.emit('solution', data);

            console.log('Action.solution sent to ',node.name,'with', data);
        },

        /**
         * Ask the node to split a problem for us with the given depth.
         * @param {solvingNode} node
         * @param {number} depth
         */
        split: function(node, depth){
            var data = {depth: depth};

            node.socket.emit('split', data);

            console.log('Action.split sent to ',node.name,'with', data);
        }

    };
    var events = {
        /**
         * Is called after successful initialisation
         * @param {solvingNode} node
         * @param {{optimalDepth:number}} data
         */
        init: function(node, data) {
            // data.optimalDepth
            node.optimalDepth = data.optimalDepth;

            var nodeHtmlContent = $('<div data-node="'+node.name+'"></div>');
            nodeHtmlContent.append($('<span class="name">Name: <span>'+node.name+'</span></span>'));
            nodeHtmlContent.append($('<span class="problem">Current Problem: <span>null</span></span>'));

            statusHtml.append(nodeHtmlContent);

            node.nodeHtmlContent = nodeHtmlContent;

            console.log('Event.init received from ',node.name,'with', data);
        },

        /**
         * The worker is asking for a problem, send him one
         *
         * @param {solvingNode} node
         */
        problem: function(node) {
            console.log('Event.problem received from ',node.name);

            node.currentProblem = null; // it finished its current problem

            var noNodeIsWorking = true;
            forEachNode(function(node){
                return noNodeIsWorking = !node.isWaiting();
            });

            if(noNodeIsWorking && problemStack.length === 0) {
                console.log('Solving finished, found Solution: ', solution);
                watchdogActivated = false;
            }else{
                // try to send him a new problem
                // if our problem stack is empty ask for new ones
                if(problemStack.length === 0)
                {
                    forEachNode(function(workingNode){
                        actions.split(workingNode, node.optimalDepth);
                    }, true);
                }else{
                    actions.problem(node);
                }

                // node.name, node.socket, node.optimalDepth

            }
        },

        /**
         * Found a better solution than the global path I had.
         *
         * @param {solvingNode} node
         * @param {{path:[number], cost: number}} data
         */
        solution: function(node, data){
            solution = data;
            updateUi();

            forEachNode(function(node){
                actions.solution(node, data.path, data.cost)
            }, null);

            console.log('Event.solution received from ',node.name,'with', data);
        },

        start: function(node, data){
            // data == true if server started
            console.log('Event.start received from ',node.name,'with',data);
        },

        /**
         * The worker replied to a split request
         *
         * @param node
         * @param {{requestedDepth: number, problem: [number]}} data
         */
        split: function(node, data){
            // data.problem
            if(data.problem)
                problemStack.push(data.problem);

            // The watchdog will keep track for us. So no need to send it here.
            // may lead to some delay but, meh...
        }
    };

    /**
     * This function will be called through some timer event and make sure that we won't have a starving worker.
     *
     * It will iterate over the waiting nodes and send split requests for their depth to working ones.
     *
     */
    function starvingWatchdog(){
        if(watchdogActivated)
        {
            console.log('[starvingWatchdog] check for starving workers...');
            forEachNode(function(node){
                if(problemStack.length !== 0)
                {
                    actions.problem(node);
                }else{
                    forEachNode(function(workingNode){
                        actions.split(workingNode, node.optimalDepth);
                    }, true);
                }
            }, false);

            updateUi();

        }

        setTimeout(starvingWatchdog, 1000 * watchdogDelay);
    }

    function updateUi(node){
        if(node === undefined)
        {
            var solutionHtml = statusHtml.find('.solution');
            solutionHtml.find('.path').text(JSON.stringifyOnce(solution.path));
            solutionHtml.find('.cost').text(solution.cost);

            forEachNode(function(node){
                updateUi(node);
            }, null);
        }else{
            if(node.nodeHtmlContent !== undefined)
            {
                node.nodeHtmlContent.find('.problem span').text(JSON.stringifyOnce(node.currentProblem));
            }
        }
    }

    function init()
    {
        problemStack.push([startNode]);

        statusHtml = $('#status');

        _.forEach(processingNodes,function(server){
            var node = solvingNode(server);

            _.forEach(events, function(eventFunc, eventName){
                node.socket.on(eventName, function(data){
                    eventFunc(node, data);
                });
            });

            actions.init(node);
        });

        if(statusHtml.find('.solution').length === 0)
            statusHtml.append($('<div class="solution">Best Solution so far: <span class="path">null</span> (<span class="cost">-1</span>)</div>'));
    }

    function solve(callback)
    {
        if(!_.isUndefined(callback)) successCallback = callback;

        console.log(initializedNodes);

        // Start Solving
        _.forEach(initializedNodes,function(node){
            node.socket.emit(
                'start'
            );
        });
        watchdogActivated = true;
    }

    // Start watchdog
    starvingWatchdog();

    return {
        solve: solve,
        init: init
    };
}
