var q = require('q'),
	Root = require('../Root'),
	root = new Root();

// Register the "test" command, which dumps back the parsed request when called
// This allows you to inspect the results of different input syntaxes
root.addCommand('test', function (req) {
		return { durkdurka: true, req: req};
	})
	.addParameter(new root.Parameter('nerf')
		.addValidator(function (rawVal) {
			if(rawVal.indexOf('e') >= 0)
				throw new Error('durka durka, bad!');
		})
		.setResolver(function (rawVal) {
			return { nice: rawVal};
		})
	)
	.addParameter(new root.Parameter('second').isRequired(true))
	.addCommand('test2');

// Find the argv that matter to form the request
root.interpret(process.argv.slice(2))

	// The good times:
	.then(function(response) {
		console.log('Queried/resolved:');
		//console.log(require('util').inspect(response, { depth: 4, colors: true}));

		return response.execute('shit');
	})
	.then(function(response) {
		console.log('Executed:');
		console.log(require('util').inspect(response, { depth: 4, colors: true}));
	})

	// And the bad times:
	.catch(function (error) {
		console.log(error.stack || error.message || error);
	});

