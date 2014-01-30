$(document).ready(function() {
    var solver = null;

    $('#init').bind('click', function() {
        var graph = eval($('#problem').val());
        console.log(JSON.stringify(graph));

        solver =new TravellingSalesmanSolver(
            [
                'http://localhost:20001'
            ], graph, 1
        );

        solver.init();
    });

    $('#proccess').bind('click', function() {

        solver.solve(
            function(){
                console.log(success)
            }
        );

    });

});
