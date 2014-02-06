$(document).ready(function() {
    var solver = null;

    $('#init').bind('click', function() {
        var graph = eval($('#problem').val());
        console.log(JSON.stringify(graph));

        solver = new TravellingSalesmanSolver(
            [
                'http://localhost:20001'
                ,'http://localhost:20002'
                ,'http://localhost:20003'
                ,'http://localhost:20004'
            ], graph, 1
        );


        //$(this).prop('disabled', true);

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
