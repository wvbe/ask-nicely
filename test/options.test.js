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
		.addOption(new root.DeepOption('config'));


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

	it('can be configured succeeded by non-related values by seperating with -', function (done) {
		assertPromiseEqual('a -ba - aa', done, function (req) {
			//console.log(req);
			assert.strictEqual(req.command.name, 'aa');
			assert.strictEqual(req.options.option1, true);
		});
	});
	it('deepoption is deep', function (done) {
		assertPromiseEqual('c --config.blaat --config.durka.durka --config.durka.nerf derp', done, function (req) {
			//console.log(req);
			assert.strictEqual(req.options.config.blaat, true);
			assert.strictEqual(req.options.config.durka.durka, true);
			assert.strictEqual(req.options.config.durka.nerf, 'derp');
		});
	});
});