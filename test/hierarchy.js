var assert = require('assert'),
	Root = require('../Root'),
	app = new Root();

app
	.addCommand('a')
		.getParent()
	.addCommand('b')
		.addCommand('ba')
			.addCommand('baa')
				.getParent()
			.getParent()
		.getParent()
	.addCommand('c')
		.addCommand('ca')
			.getParent()
		.addCommand('cb')
			.addCommand('cba');

describe('hierarchy', function () {
	it('can has subcommand', function () {
		assert.throws(function () {
			app.addCommand();
		}, 'throws when making wrongful use of helper method');

		assert.throws(function () {
			app.addCommand(new Root.Command());
		}, 'throws when an otherwise perfectly fine Command doesnt have a name');
	});

	it('root contains all the top-level commands and has no parent', function () {
		assert.strictEqual(
			app.listCommands().length,
			3
		);
		assert.strictEqual(
			app.getParent(),
			undefined
		);
	});

	it('has one 2nd-level commands', function () {
		assert.strictEqual(
			app.listCommands().reduce(function (childCommands, parentCommand) {
				return childCommands.concat(parentCommand.listCommands())
			}, []).length,
			3
		);
	});

	it('does not allow overwriting commands', function () {
		assert.throws(function () {
			app.addCommand('a');
		});
	});

	it('can be traversed with an array path and functions', function () {
		assert.strictEqual(
			app.request(['c', 'cb']).command
				.getParent()
				.getCommandByName('ca')
				.name,
			'ca'
		);
	});

	it('command serializes to route names', function () {
		assert.strictEqual(
			app.request(['b', 'ba', 'baa']).command.toJSON(),
				'b ba baa'
		);
	});

	it('has a lineage from root up to and including itself', function () {
		var command = app.request(['c', 'cb', 'cba']).command,
			lineage = command.getLineage();
		assert.strictEqual(lineage[0], app, 'Includes the root command as first array item');
		assert.strictEqual(lineage.indexOf(command), lineage.length - 1, 'Include itself at the end');
	});

	it('parent must be instanceof Command', function () {
		assert.throws(function () {
			new Root.Command('gets-a-parent-afterwards').setParent({});
		});
	});
});