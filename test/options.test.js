'use strict';

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
	.addCommand('a', function (req) {
		return req.options;
	})
		.addOption('option1', 'a', 'Option 1/A (required)', true)
		.addOption(new root.Option('option2')
			.setShort('b')
			.setDescription('Option 2/B (required)')
			.isRequired(true)
			.addValidator(cannotContainXyz.bind(null, 'option-validator-1')))
		.addOption(new root.Option('option3')
			.setShort('c')
			.setDescription('Option 3/C (not required)')
			.addValidator(cannotContainXyz.bind(null, 'option-validator-2')))
		.addCommand('aa')
			.parent
		.parent
	.addCommand('b')
		.addOption('parent', 'p', 'Parent option', true)
		.addCommand('ba')
			.addOption('long', 's', 'LONG and Short option')
			.parent
		.parent
	.addCommand('c')
		.addOption(new root.Option('a').setDefault('adefault'))
		.addOption(new AskNicely.Option('x').setShort('x'))
		.addOption(new root.Option('b').setDefault('bdefault').setShort('b'))
		.addOption(new AskNicely.Option('c').setDefault('cdefault').setShort('c'))
		.addOption(new root.DeepOption('config').isRequired(true))
		.addOption(new root.DeepOption('d').setDefault({
			yikes: { argh: 'fabl' },
			djoeken: { shanken: 'tsjoepen' },
			smack: true
		}))
		.parent
	.addCommand('d')
		.addOption(new root.Option('something').isRequired(cannotContainXyz.bind(null, 'option-validator-2')))
		.addOption('else', null, null, true)
		.addOption(new root.IsolatedOption('help'));


describe('options', function () {
	it('are renamed to their long names', function (done) {
		assertPromiseEqual('a -ab --option1 priority', done, function (req) {
			assert.strictEqual(req.options.option1, 'priority'); // long name use has prio over short
			assert.strictEqual(req.options.option2, true);
			assert.strictEqual(req.options.a, undefined);
			assert.strictEqual(req.options.b, undefined);
		});
	});

	it('throws an error if required option is undefined', function (done) {
		assertPromiseEqual('a', done, null, function (err) {
			assert.strictEqual(err instanceof Error, true);
			assert.strictEqual(err.message.indexOf('option1') >= 0, true); // Error message is about the first to fail
			assert.strictEqual(err.message.indexOf('option2') >= 0, false);
		});
	});

	it('throws an error if a parent required option is undefined', function (done) {
		assertPromiseEqual('b ba -s value', done, null, function (err) {
			assert.ok(err.message.indexOf('"parent"') >= 0);
		});
	});

	it('merges with parent options', function (done) {
		assertPromiseEqual('b ba --long child --parent parent', done, function (req) {
			assert.strictEqual(req.options.long, 'child');
			assert.strictEqual(req.options.parent, 'parent');
		});
	});

	it('can be configured with custom validators', function (done) {
		assertPromiseEqual('a --option1 whatever --option2 shouldnotcontainxyz', done, null, function (err) {
			assert.strictEqual(err.message, 'option-validator-1');
		});
	});

	it('input "-" means default-or-true for this option', function (done) {
		assertPromiseEqual('a -ba - aa', done, function (req) {
			assert.strictEqual(req.command.name, 'aa');
			assert.strictEqual(req.options.option1, true);
		});
	});


	it('handles default values for unspecified (deep) options', function (done) {
		assertPromiseEqual('c -bx - --config.hey - -c nerf', done, function (req) {
			assert.strictEqual(req.options.a, 'adefault');
			assert.strictEqual(req.options.x, true);
			assert.strictEqual(req.options.b, 'bdefault');
			assert.strictEqual(req.options.c, 'nerf');
			assert.strictEqual(req.command.options[3].default, 'cdefault');
		});
	});

	describe('deep options', function () {


		it('deep option is deep, and - is a valid default-or-true value', function (done) {
			assertPromiseEqual('c --config.blaat --config.durka.durka --config.durka.nerf derp', done, function (req) {
				assert.strictEqual(req.options.config.blaat, true);
				assert.strictEqual(req.options.config.durka.durka, true);
				assert.strictEqual(req.options.config.durka.nerf, 'derp');
			});
		});
		it('required deep options need to match one input part to be satisfied', function (done) {
			assertPromiseEqual('c', done, null, function (error) {
				assert.strictEqual(error.message.indexOf('can not be undefined') >= 0, true);
			});
		});
		it('handles default values for unspecified (deep) options', function (done) {
			assertPromiseEqual('c --d.yikes.argh eeks --config.something something --config.blaat something', done, function (req) {
				assert.strictEqual(req.options.d.smack, true);
				assert.strictEqual(req.options.d.djoeken.shanken, 'tsjoepen');
				assert.strictEqual(req.options.d.yikes.argh, 'eeks');
				assert.strictEqual(req.command.options[req.command.options.length - 1].default.yikes.argh, 'fabl', 'Default value shoudl not be changed');
			});
		});
		it('input "-" means default-or-true for this option', function (done) {
			assertPromiseEqual('c --d.yikes.argh --config.blaat - --config.alsotrue --d.djoeken.shanken -', done, function (req) {
				//console.log(require('util').inspect(req, {depth: 4, colors: true}));
				assert.strictEqual(req.options.d.yikes.argh, 'fabl');
				assert.strictEqual(req.options.config.blaat, true);
				assert.strictEqual(req.options.config.alsotrue, true);
				assert.strictEqual(req.options.d.djoeken.shanken, 'tsjoepen');
			});
		});
	});
	describe('isolated options', function () {
		it('rule out all other option parsing/validating', function (done) {
			assertPromiseEqual('d --something containsxyz --help please', done, function (req) {
				assert.strictEqual(req.options.something, undefined);
				assert.strictEqual(req.options.else, undefined);
				assert.strictEqual(req.options.help, 'please');
			});
		});
	});
});