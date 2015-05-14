/*
    # Example terminal application
    Demonstrates a small CLI application that uses ask-nicely to configure, look-up and execute any command that's
    parsed from STDIN using minimist.

    1.  Declare a new DemoApp, which inherits from Root because it's just a simple little thing that we want to
        use the same methods on.
        - Inherits from the Root class
        - Sets its own listeners using readline
        - Does it's own parsing of text input using minimist
        - Uses inherited methods to find and execute congruent command
    2.  Instantiates a new DemoApp
        - Configures it with a "test" route (for inspecting received Request data)
*/

var Root = require('../Root'), // is 'ask-nicely' when installed through NPM
	minimist = require('minimist'),
	os = require('os'),
	util = require('util'),
	q = require('q'),
	readline = require('readline');

// A few shitty helper functions for basic formatting of stuff that is dumped to console
function inspect (data, depth) {
	console.log(indent(util.inspect(data, { depth: depth || 3, colors: true })));
}
function indent(string) {
	return '    ' + string.split('\n').join(os.EOL + '    ');
}

// The demo application #yolo
function DemoApp () {
	// Inherit from Root, so call it's constructor
	Root.call(this);

	// We'll call ourselves "root" for now, so you can easily tell what's been inherited
	var root = this;

	// Prompt user for text input
	function prompt () {
		return new q.Promise(function(resolve, reject) {
			repl.question('beta > ', function (input) {
				if(!input || !(input + '').trim())
					return resolve();
				try {
					return resolve(parse(input).execute());
				} catch(e) {
					return reject(e);
				}
			});
		})
			// Happy times, nothing broke. Dump the result
			.then(function(response) {
				inspect(response);
			})
			// On any error, dump
			.catch(function (error) {
				// Prefer to echo the error stack back to user for this app
				console.log(indent(error.stack || error.message || error));
			})
			// Always prompt again
			.finally(prompt);
	}

	// Parse a string into a Request object
	function parse (str) {
		var minimized = minimist((str || '').split(' ')),
			route = [], // The path it would take to find a Command
			options = {}; // Named options to pass to the Command

		// Convert minimist output to ask-nicely input (route and options)
		Object.keys(minimized).forEach(function (key) {
			if (key === '_')
				route = minimized[key].map(function (val) {
					return ('' + val).trim();
				});
			else
				options[key] = minimized[key];
		});

		// Use ask-nicely to produce an executable Request based on parsed info
		return root.request(route, options);
	}

	// Start listening to STDIN using readline
	var repl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	// When application closes, echo a goodbye and exit
	repl.on('close', function () {
		console.log('quit');
		process.exit();
	});

	// Ask for input for the first time
	prompt();
}

// DemoApp inherits from Root
DemoApp.prototype = Object.create(Root.prototype);
DemoApp.prototype.constructor = DemoApp;

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 

// Create a new (customized) Root application
var app = new DemoApp();

// Register the "test" command, which dumps back the parsed request when called
// This allows you to inspect the results of different input syntaxes
app.addCommand('test', function (request) {
	return request;
})
	.isGreedy() // Command regards all latter route parts as undescribed parameters
	.isHungry(); // Command allows undescribed options
