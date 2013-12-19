NodeJS Parallel Travelling Salesman Solver
=====================

This is an repository documenting my progress ot develop an TSM solver on top of NodeJS and Websockets to create an parallel processing system with modern Webtechnologies.


Architecture
============

I use an server + worker approach to have a good scalability.

The server will serve the frontend the user can interact with and it will also print the optimal result of the given tsm-problem. It also acts as some kind of "Command and Control"-Server.

All worker on our list will now get the tsm-problem as graph or in the .tsp fileformat from TSPLIB. They will now generate a Network for the tsm-problem.

### "Feeding" our workers with some work
First we need to start up __one__ worker.

The server then waits to get the first 'bestCost' path. Now it will start up all other workers.

Those worker will ask the server if there is any work that can be done. The server then asks all other (initialised and working) workers, if they can cut out a part of their problem. 

This will be sent to the server and it will pick the first recieved problem and push it over to the idling worker. 

The worker whose problem got sent will also get an ACK so he may not analyze it by itself. 

The other workers whose problems did not got accepted won't get any response and therefore will analyze them by themselves.

### Workers algorithm
The worker got:
	- local state
	- global bestValue
	- global Network
	
The network will be generated out of the given tsm-problem and therefore should be equal on every worker

The bestCost value is shared among all worker through 


Installation
============

The installation consists of an server/worker setup.

### On all machines
- checkout the latest version
- `npm install`

### On the server side
- make server

#### On the worker(s) side
- make worker


