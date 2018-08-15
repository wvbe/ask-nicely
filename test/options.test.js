'use strict';

const assert = require('assert');
const ask = require('../AskNicely');

const root = new ask.Command();

function cannotContainXyz(errCode, value) {
	if(typeof value === 'string' && value.indexOf('xyz') >= 0)
		throw new Error(errCode);
}

root
	.addCommand('a', req => req)
		.addOption('option1', 'a', 'Option 1/A (required)', true)
		.addOption(new ask.Option('option2')
			.setShort('b')
			.setDescription('Option 2/B (required)')
			.isRequired(true)
			.addValidator(cannotContainXyz.bind(null, 'option-validator-1')))
		.addOption(new ask.Option('option3')
			.setShort('c')
			.setDescription('Option 3/C (not required)')
			.addValidator(cannotContainXyz.bind(null, 'option-validator-2')))
		.addCommand('aa', req => req)
			.parent
		.parent
	.addCommand('b', req => req)
		.addOption('parent', 'p', 'Parent option', true)
		.addCommand('ba', req => req)
			.addOption('long', 's', 'LONG and Short option')
			.parent
		.parent
	.addCommand('c', req => req)
		.addOption(new ask.Option('a').setDefault('adefault'))
		.addOption(new ask.Option('x').setShort('x'))
		.addOption(new ask.Option('b').setDefault('bdefault').setShort('b'))
		.addOption(new ask.Option('c').setDefault('cdefault').setShort('c'))
		.addOption(new ask.DeepOption('config').isRequired(true))
		.addOption(new ask.DeepOption('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		}))
		.parent
	.addCommand('d', req => req)
		.addOption(new ask.Option('something').isRequired(cannotContainXyz.bind(null, 'option-validator-2')))
		.addOption('else', null, null, true)
		.addOption(new ask.IsolatedOption('help'))
		.parent
	// 'e -l one --list two --list three four'
	.addCommand('e', req => req)
		.addOption(new ask.MultiOption('list').setShort('l'))
		.addOption(new ask.MultiOption('derp').setShort('d'))
		.addOption(new ask.MultiOption('eee').setShort('e').setDefault('abc'.split('')))
		.addOption(new ask.MultiOption('fff').setShort('f').setDefault('def'.split('')))
		.addOption(new ask.MultiOption('ggg').setShort('g').setDefault('ghi'.split('')));


describe('Option', () => {
	it('are renamed to their long names', () => root
		.execute('a -ab --option1 priority')
		.then(req => {
			assert.strictEqual(req.options.option1, 'priority'); // long name use has prio over short
			assert.strictEqual(req.options.option2, true);
			assert.strictEqual(req.options.a, undefined);
			assert.strictEqual(req.options.b, undefined);
		}));

	it('throws an error if required option is undefined', () => root
		.execute('a')
		.then(req => {
			throw new Error('Should have thrown');
		})
		.catch(err => {
			assert.strictEqual(err.message.includes('option1'), true); // Error message is about the first to fail
			assert.strictEqual(err.message.includes('option2'), false);
		}));

	it('throws an error if a parent required option is undefined', () => root
		.execute('b ba -s value')
		.then(req => {
			throw new Error('Should have thrown');
		})
		.catch(err => {
			assert.ok(err.message.indexOf('"parent"') >= 0);
		}));

	it('merges with parent options', () => root
		.execute('b ba --long child --parent parent')
		.then(req => {
			assert.strictEqual(req.options.long, 'child');
			assert.strictEqual(req.options.parent, 'parent');
		}));

	it('can be configured with custom validators', () => root
		.execute('a --option1 whatever --option2 shouldnotcontainxyz')
		.then(req => {
			throw new Error('Should have thrown');
		})
		.catch(err => {
			assert.strictEqual(err.message, 'option-validator-1');
		}));

	it('input "-" means default-or-true for this option', () => root
		.execute('a -ba - aa')
		.then(req => {
			assert.strictEqual(req.command.name, 'aa');
			assert.strictEqual(req.options.option1, true);
		}));

	it('assign undefined if unspecified (Option only)', () => root
		.execute('c --config.hey -')
		.then(req => {
			assert.strictEqual(req.options.a, undefined, 'a');
			assert.strictEqual(req.options.b, undefined, 'b');
			assert.strictEqual(req.options.c, undefined, 'c');
			assert.strictEqual(req.options.x, undefined, 'x');
			assert.strictEqual(req.options.d.smack, req.command.options[5].default.smack, 'smack');
		}));

	it('assign default if specified but unspecific', () => root
		.execute('c --a -bx - --d.merve whut --d.paris --config.pft')
		.then(req => {
			assert.strictEqual(req.options.a, 'adefault');
			assert.strictEqual(req.options.d.smack, true);
			assert.strictEqual(req.options.d.merve, 'whut');
			assert.strictEqual(req.options.d.paris, true);
			assert.strictEqual(req.options.x, true);
			assert.strictEqual(req.options.b, 'bdefault');
		}));

});

describe('DeepOption', () => {
	it('deep option is deep, and - is a valid default-or-true value', () => root
		.execute('c --config.blaat --config.durka.durka --config.durka.nerf derp')
		.then(req => {
			assert.strictEqual(req.options.config.blaat, true);
			assert.strictEqual(req.options.config.durka.durka, true);
			assert.strictEqual(req.options.config.durka.nerf, 'derp');
		}));

	it('required deep options need to match one input part to be satisfied', () => root
		.execute('c')
		.then(req => {
			throw new Error('Should have thrown');
		})
		.catch(err => {
			assert.strictEqual(err.message.indexOf('can not be undefined') >= 0, true);
		}));

	it('handles default values for unspecified (deep) options', () => root
		.execute('c --d.yikes.argh eeks --config.something something --config.blaat something')
		.then(req => {
			assert.strictEqual(req.options.d.smack, true);
			assert.strictEqual(req.options.d.djoeken.shanken, 'tsjoepen');
			assert.strictEqual(req.options.d.yikes.argh, 'eeks');
			assert.strictEqual(req.command.options[req.command.options.length - 1].default.yikes.argh, 'fabl', 'Default value shoudl not be changed');
		}));

	it('input "-" means default-or-true for this option', () => root
		.execute('c --d.yikes.argh --config.blaat - --config.alsotrue --d.djoeken.shanken -')
		.then(req => {
			//console.log(require('util').inspect(req, {depth: 4, colors: true}));
			assert.strictEqual(req.options.d.yikes.argh, 'fabl');
			assert.strictEqual(req.options.config.blaat, true);
			assert.strictEqual(req.options.config.alsotrue, true);
			assert.strictEqual(req.options.d.djoeken.shanken, 'tsjoepen');
		}));
});

describe('IsolatedOption', () => {
	it('rule out all other option parsing/validating', () => root
		.execute('d --something containsxyz --help please')
		.then(req => {
			assert.strictEqual(req.options.something, undefined);
			assert.strictEqual(req.options.else, undefined);
			assert.strictEqual(req.options.help, 'please');
		}));

	it('do not occur when not used', () => root
		.execute('d --something --else')
		.then(req => {
			assert.strictEqual(req.options.help, undefined);
		}));
});

describe('MultiOption', () => {
	it('may contain multiple values', () => root
		.execute('e -le -lf - -l one --list two --list three "almost four"')
		.then(req => {
			assert.strictEqual(req.options.list[0], 'one');
			assert.strictEqual(req.options.list[1], 'two');
			assert.strictEqual(req.options.list[2], 'three');
			assert.strictEqual(req.options.list[3], 'almost four');
		}));

	it('assigns empty array if undefined, or default if unspecific', () => root
		.execute('e -le - -lf one -d')
		.then(req => {
			assert.strictEqual(Array.isArray(req.options.derp), true);
			assert.strictEqual(req.options.eee.length, 3, 'set to empty');
			assert.strictEqual(req.options.fff.length, 1, 'overwritten default');
			assert.strictEqual(req.options.ggg.length, 0, 'unset, using default');
		}));
});
