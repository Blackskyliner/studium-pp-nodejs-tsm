var Benchmark = require('benchmark');
var tsplib    = require('./lib/tsplib.js');
var suite = new Benchmark.Suite;

var GN = new tsplib.GraphNetwork();
var Network = GN.createNetworkFromGraph([
    Infinity, 906, 814,  30, 198,
    906, Infinity, 633, 225, 103,
    814, 633, Infinity, 462, 553,
    30, 225, 462, Infinity, 814,
    198, 103, 553, 814, Infinity
]);

// warm up the JavaScript JIT-Compiler optimisation for our class.
var ProblemSolver = new tsplib.TravellingSalesmanSolver(Network, 1);
ProblemSolver.solve();
ProblemSolver = null;


suite.add('TSM Solver (cutting, min)', function(){
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(Network,1);
    ProblemSolver.solve();
});

suite.add('TSM Solver (cutting)', function(){
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(Network,1);
    ProblemSolver.toggleMinHeuristic();
    ProblemSolver.solve();
});

suite.add('TSM Solver (min)', function(){
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(Network,1);
    ProblemSolver.toggleCutting();
    ProblemSolver.solve();
});

suite.add('TSM Solver', function(){
    var ProblemSolver = new tsplib.TravellingSalesmanSolver(Network,1);
    ProblemSolver.toggleCutting();
    ProblemSolver.toggleMinHeuristic();
    ProblemSolver.solve();
});

suite.on('cycle', function(event) {
    console.log(String(event.target));
})
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
    });

suite.run({async: false});
