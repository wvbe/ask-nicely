var Ask = require('./RootCommand'),
	api = new Ask('root');

api
	.addCommand('test', function (request, whatever) {
		/* controller logic */
	});

api.
	// Return a Request object containing all the info to execute it
	request(['test'], { f: 'Banana' })

	// Execute controller for found command (supplementing it with `whatever`)
	// and promise it's return value
	.execute();