var tsplib    = require('../lib/tsplib.js');
var microtime = require('microtime');
var _         = require('lodash-node');

function getTimeDifference(begin, end)
{
    var calculated = [
        end[0]-begin[0]+((end[1]-begin[1])/1000000) // seconds
    ];
    calculated.push(calculated[0]/60); // minutes
    calculated.push(calculated[1]/60); // hours

    return calculated;
}

// Init our Problem
var TestNetwork = tsplib.GraphNetwork().createNetworkFromGraph([
    Infinity, 906, 814,  30, 198,
    906, Infinity, 633, 225, 103,
    814, 633, Infinity, 462, 553,
    30, 225, 462, Infinity, 814,
    198, 103, 553, 814, Infinity
]);
var bestPath = [TestNetwork[1 - 1],TestNetwork[4 - 1],TestNetwork[2 - 1],TestNetwork[5 - 1],TestNetwork[3 - 1]];
var bestCost = 911;

// warm up the JavaScript JIT-Compiler optimisation for our class.
var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
ProblemSolver.solve();
ProblemSolver = null;

exports['Solving a Problem with (cutting,min)'] = function (test) {
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);

    var startTime = microtime.nowStruct();
    ProblemSolver.solve();
    var calculated = getTimeDifference(startTime, microtime.nowStruct());
    console.log(
        'Time taken: ',
        'hours', calculated[2].toFixed(8),
        'minutes', calculated[1].toFixed(8),
        'seconds', calculated[0].toFixed(8)
    );


    test.deepEqual(ProblemSolver.getBestPath(), bestPath);
    test.equal(ProblemSolver.getBestCost(), bestCost);

    test.done();
};
exports['Solving a Problem with (cutting)'] = function (test) {
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
    ProblemSolver.toggleMinHeuristic();

    var startTime = microtime.nowStruct();
    ProblemSolver.solve();
    var calculated = getTimeDifference(startTime, microtime.nowStruct());
    console.log(
        '\n\n',
        'Time taken: ',
        'hours', calculated[2].toFixed(8),
        'minutes', calculated[1].toFixed(8),
        'seconds', calculated[0].toFixed(8)
    );

    test.deepEqual(ProblemSolver.getBestPath(), bestPath);
    test.equal(ProblemSolver.getBestCost(), bestCost);

    test.done();
};
exports['Solving a Problem with (min)'] = function (test) {
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
    ProblemSolver.toggleCutting();

    var startTime = microtime.nowStruct();
    ProblemSolver.solve();
    var calculated = getTimeDifference(startTime, microtime.nowStruct());
    console.log(
        '\n\n',
        'Time taken: ',
        'hours', calculated[2].toFixed(8),
        'minutes', calculated[1].toFixed(8),
        'seconds', calculated[0].toFixed(8)
    );

    test.deepEqual(ProblemSolver.getBestPath(), bestPath);
    test.equal(ProblemSolver.getBestCost(), bestCost);

    test.done();
};

exports['Solving a Problem without (cutting,min)'] = function (test) {
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
    ProblemSolver.toggleMinHeuristic();
    ProblemSolver.toggleCutting();

    var startTime = microtime.nowStruct();
    ProblemSolver.solve();
    var calculated = getTimeDifference(startTime, microtime.nowStruct());
    console.log(
        '\n\n',
        'Time taken: ',
        'hours', calculated[2].toFixed(8),
        'minutes', calculated[1].toFixed(8),
        'seconds', calculated[0].toFixed(8)
    );

    test.deepEqual(ProblemSolver.getBestPath(), bestPath);
    test.equal(ProblemSolver.getBestCost(), bestCost);

    test.done();
};

exports['Solving the partial problem [1,5]'] = function (test) {
    var bestPath = [TestNetwork[1 - 1],TestNetwork[5 - 1],TestNetwork[2 - 1],TestNetwork[4 - 1],TestNetwork[3 - 1]];
    var bestCost = 988;

    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
    ProblemSolver.setPartialProblem([1,5]);

    var startTime = microtime.nowStruct();
    ProblemSolver.solve();
    var calculated = getTimeDifference(startTime, microtime.nowStruct());
    console.log(
        '\n\n',
        'Time taken: ',
        'hours', calculated[2].toFixed(8),
        'minutes', calculated[1].toFixed(8),
        'seconds', calculated[0].toFixed(8)
    );

    test.deepEqual(ProblemSolver.getBestPath(), bestPath);
    test.equal(ProblemSolver.getBestCost(), bestCost);

    test.done();
};

exports['Split problem and solve all trees'] = function (test) {
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
    ProblemSolver.toggleCutting();      // Disable Cutting
    ProblemSolver.toggleMinHeuristic(); // Disable MinHeuristic
    ProblemSolver.solve(5);             // go down a depth we know we can split some partial problems
    var partial_problems = {
        partial1: { // 1,5
            problem: ProblemSolver.getPartialProblem(1),
            assertProblemPath: [1,5],
            assertBestPath: [1,5,2,4,3],
            assertBestCost: 988
        },
        partial2: { // 1,4
            problem: ProblemSolver.getPartialProblem(1),
            assertProblemPath: [1,4],
            assertBestPath: [1,4,2,5,3],
            assertBestCost: 911
        },
        partial3: { // 1,3
            problem: ProblemSolver.getPartialProblem(1),
            assertProblemPath: [1,3],
            assertBestPath: [1,3,4,2,5],
            assertBestCost: 1604
        },
        partial4: { // []
            problem: ProblemSolver.getPartialProblem(1),
            assertProblemPath: null
        }
    };

    _.forEach(partial_problems, function(problem){
        if(problem.problem)
        {
            var ProblemSolver = new tsplib.TravellingSalesmanSolver(TestNetwork, 1);
            ProblemSolver.setPartialProblem(problem.problem);
            ProblemSolver.solve();

            test.deepEqual(tsplib.Util.nodePathToNamePath(ProblemSolver.getBestPath()), problem.assertBestPath);
            test.equal(ProblemSolver.getBestCost(), problem.assertBestCost);
        }

        test.deepEqual(problem.problem, problem.assertProblemPath);
    });

    ProblemSolver.toggleCutting();      // Enable Cutting
    ProblemSolver.toggleMinHeuristic(); // Enable MinHeuristic
    ProblemSolver.solve();              // solve the rest

    console.log('\n\n');
    test.done();
};
