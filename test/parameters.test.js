'use strict';

const assert = require('assert');
const ask = require('../dist/AskNicely');

const root = new ask.Command();

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

root
	.addCommand('a', req => req)
		.addParameter('param1', 'Parameter 1')

		.addCommand('aa', req => req)
			.addParameter('param2', 'Parameter 2')
			.addCommand('aaa', req => req)
				.addParameter('param3', 'Parameter 3')
				.parent
			.parent
		.parent
	.addCommand('b', req => req)
		.addParameter('derp', 'Required', cannotContainXyz.bind(null, 'parameter-validator'))
		.addCommand('ba', req => req)
			.addParameter('nerf', 'Also required', true)
			.addParameter('smack', 'Also required')
			.addParameter(new ask.Parameter('bam').setDefault('!!!'))
			.parent
		.parent
	.addCommand('c', req => req)
		.addParameter(new ask.DeepParameter('config'))
		.addParameter(new ask.DeepParameter('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		}))
		.addCommand('ca', req => req)
			.addParameter('st');

describe('Parameter', () => {
	it('include parent command parameters', () => root
		.execute('a param1value aa param2value aaa param3value')
		.then(req => {
			assert.strictEqual(req.parameters.param1, 'param1value');
		}));

	it('can be configured with custom validators', () => root
		.execute('b nerfxyz')
		.catch(err => {
			assert.strictEqual(err.message, 'parameter-validator');
		}));

	it('may be required', () => root
		.execute('b nerfxyz ba')
		.catch(err => {
			assert.ok(err.message.indexOf('nerf') >= 0 && err.message.indexOf('undefined') >= 0);
		}));

	it('or not required', () => root
		.execute('a param1')
		.then(res => {
			assert.strictEqual(res.parameters.param1, 'param1');
			assert.strictEqual(res.parameters.param2, undefined);
		}));

	it('handles default values for unspecified parameters', () => root
		.execute('b req ba something')
		.then(res => {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		}));

	it('input "-" means default-or-undefined for this option', () => root
		.execute('b req ba something - -')
		.then(res => {
			assert.strictEqual(res.parameters.smack, undefined);
			assert.strictEqual(res.parameters.bam, '!!!');
		}));
});

describe('DeepParameter', () => {
	it('deep parameter is deep', () => root
		.execute('c config.blaat test config.durka.nerf derp d.djoeken.shanken argewreg')
		.then(req => {
			assert.strictEqual(req.parameters.config.blaat, 'test');
			assert.strictEqual(req.parameters.config.durka.nerf, 'derp');
			assert.strictEqual(req.command.parameters[req.command.parameters.length - 1].default.djoeken.shanken, 'tsjoepen', 'Default value shoudl not be changed');
		}));
	it('handles default values for unspecified deep parameters', () => root
		.execute('c d.djoeken.shanken - d.yikes.argh eeks d.smack')
		.then(req => {
			assert.strictEqual(req.parameters.d.smack, true);
			assert.strictEqual(req.parameters.d.djoeken.shanken, 'tsjoepen');
			assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
		}));

	it('deep parameters are order independent, and leak through to subcommands', () => root
		.execute('c ca what d.yikes.argh eeks')
		.then(req => {
			assert.strictEqual(req.parameters.d.yikes.argh, 'eeks');
			assert.strictEqual(req.parameters.st, 'what');
		}));
});
