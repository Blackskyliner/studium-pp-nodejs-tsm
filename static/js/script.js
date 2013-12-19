$(document).ready(function() {
    $('#sender').bind('click', function() {
        var solver = new PartialSumSolver([
            'http://localhost:20001',
            //'http://localhost:20002',
            //'http://localhost:20003',
            //'http://localhost:20004',
        ]);
        solver.solve();
    });

});
