function PartialSumSolver(servers)
{
    this.lowerBound = parseInt($('#lowerBound').val());
    this.upperBound = parseInt($('#upperBound').val());
    this.formula    = $('#formula').val();
    this.servers    = servers;
}

PartialSumSolver.prototype.splitProblem = function()
{
    var self = this;

    var countOfSums                 = self.upperBound-self.lowerBound;
    var countOfServers              = self.servers.length;
    var countOfPartialSumsPerServer = countOfSums / countOfServers;

    console.log('Got '+ countOfSums + 'problems/sums to solve.');
    console.log('Got '+ countOfServers + ' servers to solve problems on.');
    console.log('Each server will solve around '+ Math.ceil(countOfPartialSumsPerServer) + ' problems.');

    var prevUpperBound = self.lowerBound;
    var partialSums    = [];

    for(var i = 0; i < countOfServers; i++)
    {
        var upperBound = prevUpperBound + Math.floor(countOfPartialSumsPerServer);
        var lowerBound = prevUpperBound;

        if(i != 0)
        { // Subsequent bounds should start after the prev upperbound
            lowerBound += 1;
        }

        if(i+1 == countOfServers)
        { // Last one should have upper limit
            upperBound = prevUpperBound + (self.upperBound - prevUpperBound);
        }


        partialSums.push({
            upperBound: upperBound,
            lowerBound: lowerBound
        });

        prevUpperBound = upperBound;
    }

    return partialSums;
};

// Linear if we specify just one server
PartialSumSolver.prototype.solve = function()
{
    var self = this;
    var partialSums = self.splitProblem();
    var processingCount = 0;
    var globalResult = 0;

    // TODO: do it as prototpye of io.Socket
    var sendProblem = function(socket, data)
    {
        var myPartialSum = data.pop();

        if(myPartialSum)
        {
            var emit_data = {
                formula: self.formula,
                lowerBound: myPartialSum.lowerBound,
                upperBound: myPartialSum.upperBound,
                array:{}
            };

            console.log('Emit: ', emit_data);
            socket.emit('calculate_formula', emit_data);

            processingCount++;
        }
    };

    var sockets = [];

    self.servers.forEach(function(server){
        console.log('Connect to ' + server);
        var socket = io.connect(server);
        sockets.push(socket);

        console.log('Send problem to server: '+server);
        sendProblem(socket, partialSums);

        socket.on('formula_result', function(data){
            console.log('Got partial sum from '+server+': '+data.result);

            globalResult += data.result;
            processingCount--;

            // Maybe we have more problems than servers. (e.g. connect failed)
            sendProblem(socket, partialSums);

            if(processingCount === 0 && partialSums.length === 0)
            {
                $('#receiver').append('<li>Result of given formula is: ' + globalResult + '</li>');

                // Teardown event listening (subsequent calls to solve would have multiple listeners...)
                sockets.forEach(function(_socket){
                    _socket.removeAllListeners('formula_result');
                });
            }
        });
    });

    /*sockets.forEach(function(socket){
        socket.removeAllListeners('forula_result');
        socket.disconnect();
    });*/

    // Allow chaining...
    return this;
};

// This may be overloaded from the outside
PartialSumSolver.prototype.onResult = function(){};

/**
 * TSP
 *
 * Wir halten unsere Städe als Graphen vor.
 * Dieser Graph bildet einen Baum
 * Dieser Baum wird traversiert und aufgeteitl
 * hat man in einem zweig eine lösung geunden und ist die lösung besser als bisherige wird diese global vorgehalten
 * entsprechend werden alle abgebrochen, die bereits schlechter sind. // Dadurch werden diese auch automatisch vom bestehenden baum abgetrennt, da man den pfad bereits verworfen hat ;)
 * neue neue aufgaben werden verteilt, das global beste ergebnis wird dabei immer mitgegeben, damit die nodes direkt wegbrechen können wenn sie zu teuer werden
 * gedanken über gute datenstruktur
 *
 * Komplett ungünstige Nodes werden ab der node ab der sie ungünstig sind markiert
 * damit sind alle subsequenten nodes (auf diesem pfad) auch ungünstig.
 *
 */
