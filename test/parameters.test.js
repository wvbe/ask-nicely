'use strict';
/* eslint-disable no-undef */

const ask = require('../AskNicely');

function cannotContainXyz(errCode, value) {
	if (typeof value === 'string' && value.indexOf('xyz') >= 0) throw new Error(errCode);
}

const root = new ask.Command();
root.addCommand('a', req => req)
	.addParameter('param1', 'Parameter 1')

	.addCommand('aa', req => req)
	.addParameter('param2', 'Parameter 2')
	.addCommand('aaa', req => req)
	.addParameter('param3', 'Parameter 3')
	.parent.parent.parent.addCommand('b', req => req)
	.addParameter('derp', 'Required', cannotContainXyz.bind(null, 'parameter-validator'))
	.addCommand('ba', req => req)
	.addParameter('nerf', 'Also required', true)
	.addParameter('smack', 'Also required')
	.addParameter(new ask.Parameter('bam').setDefault('!!!'))
	.parent.parent.addCommand('c', req => req)
	.addParameter(new ask.DeepParameter('config'))
	.addParameter(
		new ask.DeepParameter('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		})
	)
	.addCommand('ca', req => req)
	.addParameter('st');

describe('Parameter', () => {
	it('include parent command parameters', async () => {
		const req = await root.execute('a param1value aa param2value aaa param3value');

		expect(req.parameters.param1).toBe('param1value');
	});

	it('can be configured with custom validators', async () => {
		expect(root.execute('b nerfxyz')).rejects.toThrow('parameter-validator');
	});

	it('may be required', async () => {
		expect(root.execute('b nerfxyz ba')).rejects.toThrow('undefined');
	});

	it('or not required', async () => {
		const req = await root.execute('a param1');
		expect(req.parameters.param1).toBe('param1');
		expect(req.parameters.param2).toBe(undefined);
	});

	it('handles default values for unspecified parameters', async () => {
		const req = await root.execute('b req ba something');
		expect(req.parameters.smack).toBe(undefined);
		expect(req.parameters.bam).toBe('!!!');
	});

	it('input "-" means default-or-undefined for this option', async () => {
		const req = await root.execute('b req ba something - -');

		expect(req.parameters.smack).toBe(undefined);
		expect(req.parameters.bam).toBe('!!!');
	});
});

describe('DeepParameter', () => {
	it('deep parameter is deep', async () => {
		const req = await root.execute(
			'c config.blaat test config.durka.nerf derp d.djoeken.shanken argewreg'
		);

		expect(req.parameters.config.blaat).toBe('test');
		expect(req.parameters.config.durka.nerf).toBe('derp');
		expect(
			req.command.parameters[req.command.parameters.length - 1].default.djoeken.shanken
		).toBe('tsjoepen');
	});
	it('handles default values for unspecified deep parameters', async () => {
		const req = await root.execute('c d.djoeken.shanken - d.yikes.argh eeks d.smack');

		expect(req.parameters.d.smack).toBe(true);
		expect(req.parameters.d.djoeken.shanken).toBe('tsjoepen');
		expect(req.parameters.d.yikes.argh).toBe('eeks');
	});

	it('deep parameters are order independent, and leak through to subcommands', async () => {
		const req = await root.execute('c ca what d.yikes.argh eeks');

		expect(req.parameters.d.yikes.argh).toBe('eeks');
		expect(req.parameters.st).toBe('what');
	});
});
