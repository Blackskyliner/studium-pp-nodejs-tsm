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

io.sockets.on('connection', function (socket) {
    socket.on('calculate_formula', function(data){
        var sum = 0;
        var regexp = new RegExp('i', 'g');
        for(var i = data.lowerBound; i <= data.upperBound; i++)
        {
            var formula = data.formula;
            formula = formula.replace(regexp, i);
            // eval is evil!
            try{
                sum += eval(formula);
            }catch(e)
            {
                socket.emit('formula_result', {result: e.message});
                return;
            }
        }

        socket.emit('formula_result', {result: sum});
    });
});
