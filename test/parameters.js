var assert = require('assert'),
	Root = require('../Root'),
	app = new Root();

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

app
	.addCommand('a', function () {
		return req.parameters;
	})
		.addParameter('param1', 'Parameter 1')

		.addCommand('aa')
			.isGreedy()
			.addParameter('param2', 'Parameter 2')
			.addCommand('aaa')
				.isGreedy()
				.addParameter('param3', 'Parameter 3')
				.getParent()
			.getParent()
		.getParent()
	.addCommand('b')
		.addParameter('derp', 'Required', cannotContainXyz.bind(null, 'parameter-validator'))
		.addCommand('2c')
			.addParameter('nerf', 'Also required', true)
;

describe('parameters', function () {
	var request = app.request(['a', 'param1value', 'aa', 'param2value', 'aaa', 'param3value', 'crap']);

	it('are serialized into route string', function () {
		assert.strictEqual(
			app.request(['a', 'param1value', 'aa', 'param2value']).command.toJSON(),
			'a {param1} aa {param2}'
		);
	});

	it('parses parameters up till and including the first greedy command', function () {
		assert.strictEqual(request.parameters.param2, 'param2value');
		assert.strictEqual(request.parameters.param3, undefined);
		assert.strictEqual(request.command.name, 'aa', 'aaa command should not be reachable');
	});

	// @TODO: Might have to do something about this
	it('greedy commands exclude reachable child commands', function () {
		assert.strictEqual(request.command.name, 'aa');
	});

	it('include parent command parameters', function () {
		// get the route back from the command and compare it to th
		assert.strictEqual(request.parameters.param1, 'param1value');
	});

	// a param1value aa param2value aaa param3value crap
	it('gathers greedy parameters', function () {
		assert.strictEqual(request.parameters._[0], 'aaa', 'param3value', 'crap');
	});

	it('can be configured with custom validators', function () {
		assert.throws(function () {
			app.request(['b', 'nerfxyz']).validate();
		}, function (err) { return err.message === 'parameter-validator'; });
	});
});