var q = require('q'),
	Root = require('../Root'),
	root = new Root();

function dumpRequestCommand (req) {
	console.log(require('util').inspect(req, {
		depth: 4,
		colors: true
	}));
}

root.addCommand('flight', dumpRequestCommand)

	// First parameter for `flight` command, has some custom validation
	.addParameter(new root.Parameter('flightId')
		.isRequired(true)
		.addValidator(function (flightId) {
			if(/[^a-zA-Z0-9]/.test(flightId))
				throw new Error('Flight ID only be alphanumeric characters: a-z, A-Z and 0-9');
		})
		.setResolver(function (flightId) {
			return flightId.toLowerCase();
		}))

	// First sub-command of `flight`
	.addCommand('towards', dumpRequestCommand)

		// The second parameter, `flightId` parameter is not forgotten!
		.addParameter('airport', 'Destination airport', true);


// Find the argv that matter to form the request
root.interpret(process.argv.slice(2))

	// The good times:
	.then(function(req) {
		return req.execute();
	})

	// And the bad times:
	.catch(function (error) {
		console.log(error.stack || error.message || error);
	});

