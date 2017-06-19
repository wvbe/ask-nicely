'use strict';

const assert = require('assert'),
	utils = require('./test-utils'),
	askNicely = require('../dist/AskNicely'),
	root = new askNicely.Root(),
	assertPromiseInterpretEqual = utils.assertPromiseInterpretEqual.bind(undefined, root);

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

root
	.addCommand('a', () => req.parameters)
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
			.addParameter(new askNicely.Parameter('bam').setDefault('!!!'))
			.parent
		.parent
	.addCommand('c')
		.addParameter(new askNicely.DeepParameter('config'))
		.addParameter(new askNicely.DeepParameter('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		}))
		.addCommand('ca')
			.addParameter('st');

describe('parameters', () => {

	it('include parent command parameters', done => {
		assertPromiseInterpretEqual(['a', 'param1value', 'aa', 'param2value', 'aaa', 'param3value'], done, req => {
			assert.strictEqual(req.parameters.param1, 'param1value');
		});
	});

	it('can be configured with custom validators', done => {
		assertPromiseInterpretEqual(['b', 'nerfxyz'], done, null, err => {
			assert.strictEqual(err.message, 'parameter-validator');
		});
	});
	it('may be required', done => {
		assertPromiseInterpretEqual(['b', 'nerfxyz', 'ba'], done, null, err => {
			assert.ok(err.message.indexOf('nerf') >= 0 && err.message.indexOf('undefined') >= 0);
		});
	});
	it('or not required', done => {
		assertPromiseInterpretEqual(['a', 'param1'], done, res => {
			assert.strictEqual(res.parameters.param1, 'param1');
			assert.strictEqual(res.parameters.param2, undefined);
		});
	});
	it('handles default values for unspecified parameters', done => {
		assertPromiseInterpretEqual('b req ba something', done, res => {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		});
	});

	it('input "-" means default-or-undefined for this option', done => {
		assertPromiseInterpretEqual('b req ba something - -', done, res => {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		});
	});
	describe('deep parameters are like options, but also like parameters', () => {
		it('deep parameter is deep', done => {
			assertPromiseInterpretEqual('c config.blaat test config.durka.nerf derp d.djoeken.shanken argewreg', done, req => {
				assert.strictEqual(req.parameters.config.blaat, 'test');
				assert.strictEqual(req.parameters.config.durka.nerf, 'derp');
				assert.strictEqual(req.command.parameters[req.command.parameters.length - 1].default.djoeken.shanken, 'tsjoepen', 'Default value shoudl not be changed');
			});
		});
		it('handles default values for unspecified deep parameters', done => {
			assertPromiseInterpretEqual('c d.djoeken.shanken - d.yikes.argh eeks d.smack', done, req => {
				assert.strictEqual(req.parameters.d.smack, true);
				assert.strictEqual(req.parameters.d.djoeken.shanken, 'tsjoepen');
				assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
			});
		});

		it('deep parameters are order independent, and leak through to subcommands', done => {
			assertPromiseInterpretEqual('c ca what d.yikes.argh eeks', done, req => {
				assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
				assert.strictEqual(req.parameters.st, 'what');
			});
		});
	});
});
