'use strict';

const util = require('util');

const helpCommand = require('./controller.help'),
	AskNicely = require('../AskNicely');

// Validators (set on a param/option through `addValidator`) are expected to throw errors. The return value is ignored.
function azAZ09Validator (flightId) {
	if(/[^a-zA-Z0-9]/.test(flightId))
		throw new Error('Value can only consist of alphanumeric characters: a-z, A-Z and 0-9');
}

// The first argument to a command controller is always the Request object, followed by whatever other
// arguments Request.execute() is called with. If you controller is asynchronous it should return a Promise.
function dumpRequestController (req) {
	console.log(util.inspect(req, {
		depth: 4,
		colors: true
	}));
}

// Instantiate a new root Command:
// The name is not prominent, defaults to "root" for clarity. Also, if executed it would dump some help info
// about itself. For production-quality applications I recommend some awesome ASCII.
const root = new AskNicely(null, helpCommand);

// Add an option that exists across self and descendants:
// If someone uses "--help" or "-h" flag anywhere, the precontroller aborts the execution chain and dumps
// help info about whichever command was called originally. Also, because -h is an IsolatedOption, other options
// and parameters would not be parsed.
root
	.addOption(new root.IsolatedOption('help')
		.setShort('h')
		.setDescription('Usage information, just try it')
	)
	.addPreController(req => req.options.help
		? helpCommand.call(this, req)
		: true
	);

// Add a sub command to root:
// Writing a command (called "flight" or "fly) for flight controllers that use CLI. The validator on the {flightId}
// parameter makes sure it errors out pretty quick if a certain condition is not met. Its resolver is executed after
// that, so that the controller function gets a nice and clean value.
root
	.addCommand('flight', dumpRequestController)
	.addAlias('fly')
	.setDescription('Aww yeah flight controller commands!')
	.addParameter(new root.Parameter('flightId')
		.isRequired(true)
		.addValidator(azAZ09Validator)
		.setResolver(flightId => /* value or Promise */ flightId.toLowerCase())
	)

	// Add a sub command to `root flight {flightId}`:
	// Calling addCommand() would return the (chainable) subcommand that you just created. The {airport} parameter
	// is defined in a more legible/less powerful syntax.
	.addCommand('towards', dumpRequestController)
		.addAlias('to')
		.addParameter('airport', 'Destination airport', true);

// Off to instantiate the whole lot from argv user input:
root.interpret(process.argv.slice(2))

	// At this point the Request object for the input is parsed out according to the configured
	// commands, options and parameters. Option/parameter resolvers have been fulfilled.
	// Continue to execute all the ancestry's preControllers and one final controller.
	.then(req => req.execute())

	// Yada yada yada

	// When the dust settles
	.then(req => {
		console.log('Request object: ', req);
	})

	// Determine for yourself how you would handle any errors along the way
	.catch(error => {
		console.log(error.stack || error.message || error);
	});

