var helpCommand = require('./command.help'),
	AskNicely = require('../AskNicely');

// Validators are expected to throw errors. The return value is ignored.
function azAZ09Validator (flightId) {
	if(/[^a-zA-Z0-9]/.test(flightId))
		throw new Error('Value can only consist of alphanumeric characters: a-z, A-Z and 0-9');
}

// The first argument to a command controller is always the Request object, followed by whatever other
// arguments Request.execute() is called with. If you controller is asynchronous it should return a Promise.
function dumpRequestCommand (req) {
	console.log(require('util').inspect(req, {
		depth: 4,
		colors: true
	}));
}

// Instantiate a new root Command:
// The name is not prominent, defaults to "root" for clarity. Also, if executed it would dump some help info
// about itself.
var root = new AskNicely(null, helpCommand);

// Add an option that exists across self and descendants:
// If someonethis "--help" or "-h" flag anywhere, the precontroller aborts the execution chain and dumps
// help info about whichever command was called originally.
root
	.addOption(new root.IsolatedOption('help')
		.setShort('h')
		.setDescription('Usage information, just try it')
	)
	.addPreController(function (req) {
		return req.options.help
			? helpCommand.apply(this, arguments)
			: true;
	});

// Add a sub command to root:
// Calling addCommand() would return the (chainable) subcommand that you just created. The validator on the {flightId}
// parameter makes sure it errors out pretty quick if a certain condition is not met. It's resolver is executed after
// that..
root
	.addCommand('flight', dumpRequestCommand)
	.setDescription('Aww yeah flight controller commands!')
	.addParameter(new root.Parameter('flightId')
		.isRequired(true)
		.addValidator(azAZ09Validator)
		.setResolver(function transformIntoLowercase (flightId) {
			return /* value or Promise */ flightId.toLowerCase();
		})
	)

	// Add a sub command to `root flight {flightId}`:
	// Calling addCommand() would return the (chainable) subcommand that you just created. The {airport} parameter
	// is defined in a more legible/less powerful syntax.
	.addCommand('towards', dumpRequestCommand)
		.addParameter('airport', 'Destination airport', true);


// Find the argv that matter to form the request
root.interpret(process.argv.slice(2))

	// At this point the Request object for the input is parsed out according to the configured
	// commands, options and parameters. Option/parameter resolvers have been fulfilled.
	.then(function(req) {
		// Execute all the ancestry's preControllers and one final controller.
		return req.execute();
	})

	// Determine for yourself how you would handle any errors along the way
	.catch(function (error) {
		console.log(error.stack || error.message || error);
	});

