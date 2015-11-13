'use strict';

var assert = require('assert'),
	utils = require('./test-utils'),
	AskNicely = require('../AskNicely'),
	root = new AskNicely(),
	assertPromiseInterpretEqual = utils.assertPromiseInterpretEqual.bind(undefined, root);

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
			.addParameter('nerf', 'Also required', true)
			.addParameter('smack', 'Also required')
			.addParameter(new root.Parameter('bam').setDefault('!!!'))
			.parent
		.parent
	.addCommand('c')
		.addParameter(new root.DeepParameter('config'))
		.addParameter(new root.DeepParameter('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		}))
		.addCommand('ca')
			.addParameter('st');

describe('parameters', function () {

	it('include parent command parameters', function (done) {
		assertPromiseInterpretEqual(['a', 'param1value', 'aa', 'param2value', 'aaa', 'param3value'], done, function (req) {
			assert.strictEqual(req.parameters.param1, 'param1value');
		});
	});

	it('can be configured with custom validators', function (done) {
		assertPromiseInterpretEqual(['b', 'nerfxyz'], done, null, function (err) {
			assert.strictEqual(err.message, 'parameter-validator');
		});
	});
	it('may be required', function (done) {
		assertPromiseInterpretEqual(['b', 'nerfxyz', 'ba'], done, null, function (err) {
			assert.ok(err.message.indexOf('nerf') >= 0 && err.message.indexOf('undefined') >= 0);
		});
	});
	it('or not required', function (done) {
		assertPromiseInterpretEqual(['a', 'param1'], done, function (res) {
			assert.strictEqual(res.parameters.param1, 'param1');
			assert.strictEqual(res.parameters.param2, undefined);
		});
	});
	it('handles default values for unspecified parameters', function (done) {
		assertPromiseInterpretEqual('b req ba something', done, function (res) {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		});
	});

	it('input "-" means default-or-undefined for this option', function (done) {
		assertPromiseInterpretEqual('b req ba something - -', done, function (res) {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		});
	});
	describe('deep parameters are like options, but also like parameters', function () {
		it('deep parameter is deep', function (done) {
			assertPromiseInterpretEqual('c config.blaat test config.durka.nerf derp d.djoeken.shanken argewreg', done, function (req) {
				assert.strictEqual(req.parameters.config.blaat, 'test');
				assert.strictEqual(req.parameters.config.durka.nerf, 'derp');
				assert.strictEqual(req.command.parameters[req.command.parameters.length - 1].default.djoeken.shanken, 'tsjoepen', 'Default value shoudl not be changed');
			});
		});
		it('handles default values for unspecified deep parameters', function (done) {
			assertPromiseInterpretEqual('c d.djoeken.shanken - d.yikes.argh eeks d.smack', done, function (req) {
				assert.strictEqual(req.parameters.d.smack, true);
				assert.strictEqual(req.parameters.d.djoeken.shanken, 'tsjoepen');
				assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
			});
		});

		it('deep parameters are order independent, and leak through to subcommands', function (done) {
			assertPromiseInterpretEqual('c ca what d.yikes.argh eeks', done, function (req) {
				assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
				assert.strictEqual(req.parameters.st, 'what');
			});
		});
	});

});