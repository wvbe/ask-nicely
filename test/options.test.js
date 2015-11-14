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
		.addOption(new root.Option('x').setShort('x'))
		.addOption(new root.Option('b').setDefault('bdefault').setShort('b'))
		.addOption(new root.Option('c').setDefault('cdefault').setShort('c'))
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
		.addOption(new root.IsolatedOption('help'))
		.parent
	// 'e -l one --list two --list three four'
	.addCommand('e')
		.addOption(new root.MultiOption('list').setShort('l'))
		.addOption(new root.MultiOption('derp').setShort('d'))
		.addOption(new root.MultiOption('eee').setShort('e').setDefault('abc'.split('')))
		.addOption(new root.MultiOption('fff').setShort('f').setDefault('def'.split('')))
		.addOption(new root.MultiOption('ggg').setShort('g').setDefault('ghi'.split('')));


describe('options', function () {
	it('are renamed to their long names', function (done) {
		assertPromiseInterpretEqual('a -ab --option1 priority', done, function (req) {
			assert.strictEqual(req.options.option1, 'priority'); // long name use has prio over short
			assert.strictEqual(req.options.option2, true);
			assert.strictEqual(req.options.a, undefined);
			assert.strictEqual(req.options.b, undefined);
		});
	});

	it('throws an error if required option is undefined', function (done) {
		assertPromiseInterpretEqual('a', done, null, function (err) {
			assert.strictEqual(err instanceof Error, true);
			assert.strictEqual(err.message.indexOf('option1') >= 0, true); // Error message is about the first to fail
			assert.strictEqual(err.message.indexOf('option2') >= 0, false);
		});
	});

	it('throws an error if a parent required option is undefined', function (done) {
		assertPromiseInterpretEqual('b ba -s value', done, null, function (err) {
			assert.ok(err.message.indexOf('"parent"') >= 0);
		});
	});

	it('merges with parent options', function (done) {
		assertPromiseInterpretEqual('b ba --long child --parent parent', done, function (req) {
			assert.strictEqual(req.options.long, 'child');
			assert.strictEqual(req.options.parent, 'parent');
		});
	});

	it('can be configured with custom validators', function (done) {
		assertPromiseInterpretEqual('a --option1 whatever --option2 shouldnotcontainxyz', done, null, function (err) {
			assert.strictEqual(err.message, 'option-validator-1');
		});
	});

	it('input "-" means default-or-true for this option', function (done) {
		assertPromiseInterpretEqual('a -ba - aa', done, function (req) {
			assert.strictEqual(req.command.name, 'aa');
			assert.strictEqual(req.options.option1, true);
		});
	});

	it('assign undefined if unspecified (Option only)', function (done) {
		assertPromiseInterpretEqual('c --config.hey -', done, function (req) {
			assert.strictEqual(req.options.a, undefined, 'a');

			assert.strictEqual(req.options.b, undefined, 'b');

			assert.strictEqual(req.options.c, undefined, 'c');



			assert.strictEqual(req.options.x, undefined, 'x');

			// but not deepoptions
			assert.strictEqual(req.options.d.smack, req.command.options[5].default.smack, 'smack');
		});
	});

	it('assign default if specified but unspecific', function (done) {
		assertPromiseInterpretEqual('c --a -bx - --d.merve whut --d.paris --config.pft', done, function (req) {
			assert.strictEqual(req.options.a, 'adefault');

			assert.strictEqual(req.options.d.smack, true);
			assert.strictEqual(req.options.d.merve, 'whut');
			assert.strictEqual(req.options.d.paris, true);

			assert.strictEqual(req.options.x, true);
			assert.strictEqual(req.options.b, 'bdefault');
		});
	});

	describe('deep options', function () {


		it('deep option is deep, and - is a valid default-or-true value', function (done) {
			assertPromiseInterpretEqual('c --config.blaat --config.durka.durka --config.durka.nerf derp', done, function (req) {
				assert.strictEqual(req.options.config.blaat, true);
				assert.strictEqual(req.options.config.durka.durka, true);
				assert.strictEqual(req.options.config.durka.nerf, 'derp');
			});
		});
		it('required deep options need to match one input part to be satisfied', function (done) {
			assertPromiseInterpretEqual('c', done, null, function (error) {
				assert.strictEqual(error.message.indexOf('can not be undefined') >= 0, true);
			});
		});
		it('handles default values for unspecified (deep) options', function (done) {
			assertPromiseInterpretEqual('c --d.yikes.argh eeks --config.something something --config.blaat something', done, function (req) {
				assert.strictEqual(req.options.d.smack, true);
				assert.strictEqual(req.options.d.djoeken.shanken, 'tsjoepen');
				assert.strictEqual(req.options.d.yikes.argh, 'eeks');
				assert.strictEqual(req.command.options[req.command.options.length - 1].default.yikes.argh, 'fabl', 'Default value shoudl not be changed');
			});
		});
		it('input "-" means default-or-true for this option', function (done) {
			assertPromiseInterpretEqual('c --d.yikes.argh --config.blaat - --config.alsotrue --d.djoeken.shanken -', done, function (req) {
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
			assertPromiseInterpretEqual('d --something containsxyz --help please', done, function (req) {
				assert.strictEqual(req.options.something, undefined);
				assert.strictEqual(req.options.else, undefined);
				assert.strictEqual(req.options.help, 'please');
			});
		});
		it('derp', function (done) {
			assertPromiseInterpretEqual('d --something --else', done, function (req) {
				assert.strictEqual(req.options.help, undefined);
			});
		});
	});

	describe('multi options', function () {
		it('may contain multiple values', function (done) {
			assertPromiseInterpretEqual('e -le - -lf -l one --list two --list three "almost four"', done, function (req) {
				assert.strictEqual(req.options.list[0], 'one');
				assert.strictEqual(req.options.list[1], 'two');
				assert.strictEqual(req.options.list[2], 'three');
				assert.strictEqual(req.options.list[3], 'almost four');
			});
		});
		it('assigns default if undefined, or empty array if unspecific', function (done) {
			assertPromiseInterpretEqual('e -le - -lf one -d', done, function (req) {
				console.log(req.options)
				assert.strictEqual(Array.isArray(req.options.derp), true);
				assert.strictEqual(req.options.eee.length, 0, 'set to empty');
				assert.strictEqual(req.options.fff.length, 1, 'overwritten default');
				assert.strictEqual(req.options.ggg.length, 3, 'unset, using default');
			});
		});
	});
});