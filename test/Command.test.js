var assert = require('assert');

var RootCommand = require('../RootCommand'),
	app = new RootCommand();

var command1a = app.addCommand('1a'),

	command1b = app.addCommand('1b', function () {

	}).isHungry(),

	command1c = app.addCommand('1c', function (req) {
		return req.options;
	})
		.addOption('option1', 'a', 'Option 1/A', true)
		.addOption('option2', 'b', 'Option 2/B (required)', true),

	command1d = app.addCommand('1d'),

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
				app.addCommand(new RootCommand.Command());
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

		it('can be traversed', function () {
			assert.strictEqual(
				command1a
					.getParent()
					.getCommandByName('1b'),
				command1b
			);
		});

		it('children have parents have parents', function () {
			var lineage = command2a.getLineage();
			assert.strictEqual(lineage[0], app, 'Includes the root command as first array item');
			assert.strictEqual(lineage.indexOf(command2a), lineage.length - 1, 'Include itself at the end');
		});

		it('parent must be instanceof Command', function () {
			assert.throws(function () {
				new RootCommand.Command('gets-a-parent-afterwards').setParent({});
			});
		});

		it('eats an array representing the hierarchical path', function () {
			assert.strictEqual(
				app.getCommandForRoute(['1d', '2a']),
				command2a
			);
			assert.strictEqual(
				app.getCommandForRoute(['1d', '2a']),
				app.getCommandForRoute([undefined, '1d', null, '2a', false]),
				'ignores empty route parts'
			);
		});

		it('throws if not found', function () {
			assert.throws(function () {
				app.request(['1a', 'nonexistant', 'blaat']);
			});
		});
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

		it('forgets undescribed options if command is not hungry', function () {
			assert.strictEqual(Object.keys(requestOptions).length, 2);
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
		});

		// @TODO: Might have to do something about this
		it('greedy commands exclude reachable child commands', function () {
			assert.strictEqual(request.command, command2b);
		});

		it('include parent command parameters', function () {
			// get the route back from the command and compare it to th
			assert.strictEqual(request.parameters.param1, 'param1value');
		});

		// @TODO: Oops! route is currently not stored with the request (because it can be reconstructed from
		// the Command), but indeed it's greedy remnants should
		//it('leaves all route and parameter parts intact', function () {
		//	// get the route back from the command and compare it to th
		//	assert.strictEqual(request.route.length, 7);
		//});
	});

	// execution
	// - returns promise
	// - no-controllers resolve to undefined
	// - controller gets all the arguments passed to Request.execute()
});