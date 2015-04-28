var Ask = require('./RootCommand'),
	app = new Ask('root');

var command1a = app.addCommand('1a'),
	command1b = app.addCommand('1b'),
	command1c = app.addCommand('1c')
		.addOption('optiona', 'a', 'Option A')
		.addOption('optionb', 'b', 'Option B (required)', true),
	command1d = app.addCommand('1d')
		.addOption('fuck', 'f')
		//.addParameter('parama', 'Parameter A')
		.addCommand('2a')
	.addParameter('paramb', 'Parameter B');

app.
	// Return a Request object containing all the info to execute it
	request(['1d', '2a'], { f: 'Banana' })

	// Execute controller for found command (supplementing it with `whatever`)
	// and promise it's return value
	.execute();