var Root = require('../Root'),
	root = new Root();

// Register the "test" command, which dumps back the parsed request when called
// This allows you to inspect the results of different input syntaxes
root.addCommand('test', function (request) {
	return request;
})
	.isGreedy() // Command regards all latter route parts as undescribed parameters
	.isHungry(); // Command allows undescribed options

// Find the argv that matter to form the request
root.interpret(process.argv.slice(2))

	// and use it as input to execute
	.execute()

	// The good times:
	.then(function(response) {
		console.log(require('util').inspect(response, { depth: 2, colors: true}));
	})

	// And the bad times:
	.catch(function (error) {
		console.log(error.stack || error.message || error);
	});

