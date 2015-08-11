var assert = require('assert');

var Root = require('../Root'),
	app = new Root();

var command1a = app.addCommand('1a'),

	command1b = app.addCommand('1b', function () {

	}).isHungry(),

	command1c = app.addCommand('1c', function (req) {
		return req.options;
	})
		.addOption('option1', 'a', 'Option 1/A', true)
		.addOption('option2', 'b', 'Option 2/B (required)', true),

	command1d = app.addCommand('1d')
		.addOption('parent', 'p', 'Parent option', true),

	command1e = app.addCommand('1e', function () {
		return req.parameters;
	})
		.addParameter('param1', 'Parameter 1');

var command2a = command1d.addCommand('2a')
		.addOption('long', 's', 'LONG and Short option')
		.isHungry(),
	command2b = command1e.addCommand('2b')
		.addParameter('param2', 'Parameter 2')
		.isGreedy();

var command3a = command2b.addCommand('3a')
	.addParameter('param3', 'Parameter 3')
	.isGreedy();

describe('ask-nicely', function() {
	describe('hierarchy', function () {
		it('can add subcommands', function () {
			assert.throws(function () {
				app.addCommand();
			}, 'throws when making wrongful use of helper method');

			assert.throws(function () {
				app.addCommand(new Root.Command());
			}, 'throws when an otherwise perfectly fine Command doesnt have a name');
		});

		it('root contains all the top-level commands', function () {
			assert.strictEqual(
				app.listCommands().length,
				5
			);
		});

		it('has one 2nd-level commands', function () {
			assert.strictEqual(
				app.listCommands().reduce(function (childCommands, parentCommand) {
					return childCommands.concat(parentCommand.listCommands())
				}, []).length,
				2
			);
		});

		it('does not allow overwriting commands', function () {
			assert.throws(function () {
				app.addCommand('1a');
			});
		});

		it('can be traversed up and down', function () {
			assert.strictEqual(
				command1a
					.getParent()
					.getCommandByName('1b'),
				command1b
			);
		});

		it('can be traversed with an array path', function () {
			// Regular (from Root). Notice how Root is not named, which is why it doesnt need a name either
			assert.strictEqual(
				app.request(['1e', 'param1value', '2b', 'param2value', 'also', 'it', 'is', 'greedy']).command,
				command2b
			);
		});

		it('command serializes to route- and parameter names', function () {
			assert.strictEqual(
				app.request(
					['1e', 'param1value', '2b', 'param2value']).command.toJSON(),
					['1e', '{param1}', '2b', '{param2}'].join(' ')
			);
		});

		it('children have parents have parents', function () {
			var lineage = command2a.getLineage();
			assert.strictEqual(lineage[0], app, 'Includes the root command as first array item');
			assert.strictEqual(lineage.indexOf(command2a), lineage.length - 1, 'Include itself at the end');
		});

		it('parent must be instanceof Command', function () {
			assert.throws(function () {
				new Root.Command('gets-a-parent-afterwards').setParent({});
			});
		});

		it('throws if not found', function () {
			assert.throws(function () {
				app.request(['1a', 'nonexistant', 'blaat']);
			});
		});
	});

	describe('root', function () {
		var newRoot = new Root()
			.addParameter('rootparam');
		newRoot.addCommand('child');
		var newRequest = newRoot.request(['rootparamvalue', 'child']);

		it('would transclude parameters to every child command', function () {
			assert.strictEqual(newRequest.command.name, 'child'); // CHeck we did indeed find the right command
			assert.strictEqual(newRequest.parameters.rootparam, 'rootparamvalue'); // CHeck parameter value
		})
	});


	describe('options', function () {
		var requestOptions = app.request(['1c'], {
				a: true,
				b: true,
				c: true,
				'option1': 'priority'
			}).options,
			returnError;

		before(function (done) {
			app.request(['1c'], {
				'option1': null
			}).execute().catch(function (error) {
				returnError = error;
			}).finally(done);
		});

		it('are renamed to their long names', function () {
			assert.strictEqual(requestOptions['option1'], 'priority'); // long name use has prio over short
			assert.strictEqual(requestOptions['option2'], true);
		});

		it('short-hand notation is removed', function () {
			assert.strictEqual(requestOptions['a'], undefined);
			assert.strictEqual(requestOptions['b'], undefined);
		});

		it('throws an error if required option is undefined', function () {
			assert.strictEqual(returnError instanceof Error, true);
			assert.strictEqual(returnError.message.indexOf('option1') >= 0, false); // Error message is *not* about null value
			assert.strictEqual(returnError.message.indexOf('option2') >= 0, true); // Erorr message *is* about undefined value
		});

		it('throws an error if a parent required option is undefined', function () {
			var req = app.request(['1d', '2a'], {
				s: null
			});
			assert.throws(function () {
				req.command.validateOptions(req.options);
			});
		});

		it('forgets undescribed options if command is not hungry', function () {
			assert.strictEqual(Object.keys(requestOptions).length, 2);
		});


		it('merges with parent options', function () {
			var opts = app.request(['1d', '2a'], {
				s: 'child',
				p: 'parent'
			}).options;

			assert.strictEqual(opts.long, 'child');
			assert.strictEqual(opts.parent, 'parent');
		});

		it('merges with undescribed options if command is hungry', function () {
			var opts = app.request(['1d', '2a'], {
				s: 'underwrite',
				long: 'overwrite',
				random: 'kept'
			}).options;

			assert.strictEqual(opts.s, undefined);
			assert.strictEqual(opts.long, 'overwrite');
			assert.strictEqual(opts.random, 'kept');
		});

		it('can not redeclare options', function () {
			assert.throws(function () {
				command1c.addOption('option1', 'X');
			}, 'if longname is already in use');

			assert.throws(function () {
				command1c.addOption('unique', 'a');
			}, 'if shortname is already in use');

		});
	});

	describe('parameters', function () {
		var request = app.request(['1e', 'param1value', '2b', 'param2value', '3a', 'param3value', 'crap']);

		it('parses parameters up till and including the first greedy command', function () {
			assert.strictEqual(request.parameters.param2, 'param2value');
			assert.strictEqual(request.parameters.param3, undefined);
			assert.strictEqual(request.command, command2b, '3a command should not be reachable');
		});

		// @TODO: Might have to do something about this
		it('greedy commands exclude reachable child commands', function () {
			assert.strictEqual(request.command, command2b);
		});

		it('include parent command parameters', function () {
			// get the route back from the command and compare it to th
			assert.strictEqual(request.parameters.param1, 'param1value');
		});

		// 1e param1value 2b param2value 3a param3value crap
		it('gathers greedy parameters', function () {
			assert.strictEqual(request.parameters._[0], '3a', 'param3value', 'crap');
		});

	});

	describe('input()', function () {

		function compareInput(stringInput, route, options) {
				var inputRequest = app.interpret(stringInput);
				assert.deepEqual(
					inputRequest,
					app.request(route, options)
				);
		}

		// @TODO: To be expanded once parameters can be described with number of expected values, etc.
		it('parses the route like it normally would', function () {
			compareInput(
				'1e param1value 2b param2value 3a param3value crap',
				['1e', 'param1value', '2b', 'param2value', '3a', 'param3value', 'crap']
			);
		});

		it('if option is declared as TRUE multiple times, flatten', function () {
			compareInput(
				'1c -a -a -a',
				['1c'], { option1: true}
			);
		});

		it('otherwise, they would be accumulated', function () {
			compareInput(
				'1c -a value -a value -a value',
				['1c'], { option1: ['value', 'value', 'value'] }
			);
		});

		it('any TRUE values in between are ignored', function () {
			compareInput(
				'1c -a value -a -a',
				['1c'], {option1: 'value'}
			);
			compareInput(
				'1c -a value1 -a value2 -a',
				['1c'], { option1: ['value1', 'value2']}
			);
			compareInput(
				'1c -a value1 -a -a value2',
				['1c'], { option1: ['value1', 'value2']}
			);
		});

		it('using the long option name obsoletes the short option', function () {
			compareInput(
				'1c -a value1 --option1 value2 -a',
				['1c'], {option1: 'value2'}
			);
		});

		it('handles options enclosed by quotes which may contain spaces', function () {
			compareInput(
				'1c -a "value 1" "value 2" value 3',
				['1c'], {option1: ['value 1', 'value 2', 'value', '3']}
			);
		});
	});

	// execution
	// - returns promise
	// - no-controllers resolve to undefined
	// - controller gets all the arguments passed to Request.execute()
});