/* eslint-disable no-undef */

const ask = require('../AskNicely');

function cannotContainXyz(errCode, value) {
	if (typeof value === 'string' && value.indexOf('xyz') >= 0) throw new Error(errCode);
}

const root = new ask.Command();
root.addCommand('a', req => req)
	.addOption('option1', 'a', 'Option 1/A (required)', true)
	.addOption(
		new ask.Option('option2')
			.setShort('b')
			.setDescription('Option 2/B (required)')
			.isRequired(true)
			.addValidator(cannotContainXyz.bind(null, 'option-validator-1'))
	)
	.addOption(
		new ask.Option('option3')
			.setShort('c')
			.setDescription('Option 3/C (not required)')
			.addValidator(cannotContainXyz.bind(null, 'option-validator-2'))
	)
	.addCommand('aa', req => req)
	.parent.parent.addCommand('b', req => req)
	.addOption('parent', 'p', 'Parent option', true)
	.addCommand('ba', req => req)
	.addOption('long', 's', 'LONG and Short option')
	.parent.parent.addCommand('c', req => req)
	.addOption(new ask.Option('a').setDefault('adefault'))
	.addOption(new ask.Option('x').setShort('x'))
	.addOption(new ask.Option('b').setDefault('bdefault').setShort('b'))
	.addOption(new ask.Option('c').setDefault('cdefault').setShort('c'))
	.addOption(new ask.DeepOption('config').isRequired(true))
	.addOption(
		new ask.DeepOption('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		})
	)
	.parent.addCommand('d', req => req)
	.addOption(
		new ask.Option('something').isRequired(cannotContainXyz.bind(null, 'option-validator-2'))
	)
	.addOption('else', null, null, true)
	.addOption(new ask.IsolatedOption('help'))
	.parent // 'e -l one --list two --list three four'
	.addCommand('e', req => req)
	.addOption(new ask.MultiOption('list').setShort('l'))
	.addOption(new ask.MultiOption('derp').setShort('d'))
	.addOption(new ask.MultiOption('eee').setShort('e').setDefault('abc'.split('')))
	.addOption(new ask.MultiOption('fff').setShort('f').setDefault('def'.split('')))
	.addOption(new ask.MultiOption('ggg').setShort('g').setDefault('ghi'.split('')));

describe('Option', () => {
	it('are renamed to their long names', async () => {
		const req = await root.execute('a -ab --option1 priority');

		expect(req.options.option1).toBe('priority'); // long name use has prio over short
		expect(req.options.option2).toBe(true);
		expect(req.options.a).toBe(undefined);
		expect(req.options.b).toBe(undefined);
	});

	it('throws an error if required option is undefined', () => {
		expect(root.execute('a')).rejects.toThrow('option1');
	});

	it('throws an error if a parent required option is undefined', () => {
		expect(root.execute('b ba -s value')).rejects.toThrow('"parent"');
	});

	it('merges with parent options', async () => {
		const req = await root.execute('b ba --long child --parent parent');

		expect(req.options.long).toBe('child');
		expect(req.options.parent).toBe('parent');
	});

	it('can be configured with custom validators', async () => {
		expect(root.execute('a --option1 whatever --option2 shouldnotcontainxyz')).rejects.toThrow(
			'option-validator-1'
		);
	});

	it('input "-" means default-or-true for this option', async () => {
		const req = await root.execute('a -ba - aa');
		expect(req.command.name).toBe('aa');
		expect(req.options.option1).toBe(true);
	});

	it('assign undefined if unspecified (Option only)', async () => {
		const req = await root.execute('c --config.hey -');
		expect(req.options.a).toBe(undefined);
		expect(req.options.b).toBe(undefined);
		expect(req.options.c).toBe(undefined);
		expect(req.options.x).toBe(undefined);
		expect(req.options.d.smack).toBe(req.command.options[5].default.smack);
	});

	it('assign default if specified but unspecific', async () => {
		const req = await root.execute('c --a -bx - --d.merve whut --d.paris --config.pft');
		expect(req.options.a).toBe('adefault');
		expect(req.options.d.smack).toBe(true);
		expect(req.options.d.merve).toBe('whut');
		expect(req.options.d.paris).toBe(true);
		expect(req.options.x).toBe(true);
		expect(req.options.b).toBe('bdefault');
	});
});

describe('DeepOption', () => {
	it('deep option is deep, and - is a valid default-or-true value', async () => {
		const req = await root.execute(
			'c --config.blaat --config.durka.durka --config.durka.nerf derp'
		);
		expect(req.options.config.blaat).toBe(true);
		expect(req.options.config.durka.durka).toBe(true);
		expect(req.options.config.durka.nerf).toBe('derp');
	});

	it('required deep options need to match one input part to be satisfied', () => {
		expect(root.execute('c')).rejects.toThrow('can not be undefined');
	});

	it('handles default values for unspecified (deep) options', async () => {
		const req = await root.execute(
			'c --d.yikes.argh eeks --config.something something --config.blaat something'
		);
		expect(req.options.d.smack).toBe(true);
		expect(req.options.d.djoeken.shanken).toBe('tsjoepen');
		expect(req.options.d.yikes.argh).toBe('eeks');
		expect(req.command.options[req.command.options.length - 1].default.yikes.argh).toBe('fabl');
	});

	it('input "-" means default-or-true for this option', async () => {
		const req = await root.execute(
			'c --d.yikes.argh --config.blaat - --config.alsotrue --d.djoeken.shanken -'
		);
		expect(req.options.d.yikes.argh).toBe('fabl');
		expect(req.options.config.blaat).toBe(true);
		expect(req.options.config.alsotrue).toBe(true);
		expect(req.options.d.djoeken.shanken).toBe('tsjoepen');
	});
});

describe('IsolatedOption', () => {
	it('rule out all other option parsing/validating', async () => {
		const req = await root.execute('d --something containsxyz --help please');
		expect(req.options.something).toBe(undefined);
		expect(req.options.else).toBe(undefined);
		expect(req.options.help).toBe('please');
	});

	it('do not occur when not used', async () => {
		const req = await root.execute('d --something --else');
		expect(req.options.help).toBe(undefined);
	});
});

describe('MultiOption', () => {
	it('may contain multiple values', async () => {
		const req = await root.execute('e -le -lf - -l one --list two --list three "almost four"');
		expect(req.options.list[0]).toBe('one');
		expect(req.options.list[1]).toBe('two');
		expect(req.options.list[2]).toBe('three');
		expect(req.options.list[3]).toBe('almost four');
	});

	it('assigns empty array if undefined, or default if unspecific', async () => {
		const req = await root.execute('e -le - -lf one -d');
		expect(Array.isArray(req.options.derp)).toBe(true);
		expect(req.options.eee.length).toBe(3);
		expect(req.options.fff.length).toBe(1);
		expect(req.options.ggg.length).toBe(0);
	});
});

describe('option inheritance', () => {
	it('commands and subcommands use the last value if the option is multiply defined', async () => {
		const r = new ask.Command('nerf', req => req);

		r.addOption(new ask.Option('foo'));
		expect((await r.execute('--foo 1')).options.foo).toBe('x1');

		r.addCommand('derp', req => req).addOption(new ask.Option('foo'));
		expect((await r.execute('derp --foo 2')).options.foo).toBe('2');
		expect((await r.execute('--foo 1 derp --foo 2')).options.foo).toBe('2');
	});

	it('commands and subcommands use the default if the option is singularly defined', async () => {
		const r = new ask.Command('nerf', req => req);
		r.addOption(new ask.Option('foo').setDefault('bar', true));

		expect((await r.execute('')).options.foo).toBe('bar');

		r.addCommand('derp', req => req);
		expect((await r.execute('derp')).options.foo).toBe('bar');
	});

	it('commands and subcommands use the default if the option is multiply defined', async () => {
		const r = new ask.Command('nerf', req => req);

		const mockResolver1 = jest.fn(x => x);
		r.addOption(new ask.Option('foo').setResolver(mockResolver1).setDefault('bar', true));
		expect((await r.execute('')).options.foo).toBe('bar');
		expect(mockResolver1).toHaveBeenCalledTimes(1);

		const mockResolver2 = jest.fn(x => x);
		r.addCommand('derp', req => req).addOption(
			new ask.Option('foo').setResolver(mockResolver2).setDefault('baz', true)
		);
		expect((await r.execute('derp')).options.foo).toBe('baz');

		// Current expected behaviour is that the resolver for the first --foo definition gets ran even if it is super-
		// seded by the more specific --foo definition later.
		// @TODO Not do that, have mockResolver1 be called only once in this test:
		expect(mockResolver1).toHaveBeenCalledTimes(2);
		expect(mockResolver2).toHaveBeenCalledTimes(1);
	});

	it('... also resolvers etc.', async () => {
		const r = new ask.Command('nerf', req => req);

		r.addOption(new ask.Option('foo').setResolver(() => 'bar'));
		expect((await r.execute('--foo x')).options.foo).toBe('bar');

		r.addCommand('derp', req => req).addOption(new ask.Option('foo').setResolver(() => 'baz'));
		expect((await r.execute('derp --foo x')).options.foo).toBe('baz');
	});
});
