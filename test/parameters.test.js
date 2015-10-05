var assert = require('assert'),
	utils = require('./test-utils'),
	AskNicely = require('../AskNicely'),
	root = new AskNicely(),
	assertPromiseEqual = utils.assertPromiseEqual.bind(undefined, root);

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

root
	.addCommand('a', function () {
		return req.parameters;
	})
		.addParameter('param1', 'Parameter 1')

		.addCommand('aa')
			.addParameter('param2', 'Parameter 2')
			.addCommand('aaa')
				.addParameter('param3', 'Parameter 3')
				.parent
			.parent
		.parent
	.addCommand('b')
		.addParameter('derp', 'Required', cannotContainXyz.bind(null, 'parameter-validator'))
		.addCommand('ba')
			.addParameter('nerf', 'Also required', true);

describe('parameters', function () {
	var input = ['a', 'param1value', 'aa', 'param2value', 'aaa', 'param3value'].join(' ');

	//it('are serialized into route string', function (done) {
	//	assertPromiseEqual(input, done, function (req) {
	//		assert.strictEqual(req.command.toJSON(), 'a {param1} aa {param2} aaa {param3}');
	//	});
	//});

	it('include parent command parameters', function (done) {
		assertPromiseEqual(input, done, function (req) {
			assert.strictEqual(req.parameters.param1, 'param1value');
		});
	});

	it('can be configured with custom validators', function (done) {
		assertPromiseEqual(['b', 'nerfxyz'], done, null, function (err) {
			assert.strictEqual(err.message, 'parameter-validator');
		});
	});
	it('may be required', function (done) {
		assertPromiseEqual(['b', 'nerfxyz', 'ba'], done, null, function (err) {
			assert.ok(err.message.indexOf('nerf') >= 0 && err.message.indexOf('undefined') >= 0);
		});
	});
	it('or not required', function (done) {
		assertPromiseEqual(['a', 'param1'], done, function (res) {
			assert.strictEqual(res.parameters.param1, 'param1');
			assert.strictEqual(res.parameters.param2, undefined);
		});
	});
});