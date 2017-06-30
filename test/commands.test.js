'use strict';

const assert = require('assert');
const ask = require('../dist/AskNicely');

const root = new ask.Command('root');

root
	.addCommand(new ask.Command('a', req => req))
		.addAlias('alias')
		.addPreController((req) => { req.firstPreController = true; })
		.setController(req => req)
		.addOption('z')
		.addCommand('aa', req => req)
			.addPreController((req) => { req.secondPreController = true; });
root
	.addCommand('b', req => req)
		.addPreController((req) => {
			Object.assign(req, { first: 'should-be-set' });
			return false;
		})
		.addPreController((req) => {
			req.second = 'should-not-be-set';
		});

describe('Command', () => {
	describe('execute()', () => {
		it('precontrollers are ran for all parents before the actual controller', () => root
			.execute('a aa', {})
			.then(req => {
				assert.strictEqual(req.firstPreController, true);
				assert.strictEqual(req.secondPreController, true);
			}));

		it('can use an alias command name', () => root
			.execute('alias', {})
			.then(req => {
				assert.strictEqual(req.firstPreController, true);
				assert.strictEqual(req.command.name, 'a');
			}));

		it('can parse relative from any depth in the command hierarchy', () => root.children[0]
			.execute('--z napoleon', {})
			.then(req => {
				assert.strictEqual(req.firstPreController, true);
				assert.strictEqual(req.options.z, 'napoleon');
				assert.strictEqual(req.command.name, 'a');
			}));

		it('returning FALSE prevents executing consecutive (pre) controllers', () => {
			const req = { myReq: true };
			return root
				.execute('b', req)
				.then(() => {
					assert.strictEqual(req.myReq, true);
					assert.strictEqual(req.first, 'should-be-set');
					assert.strictEqual(req.second, undefined);
				});
		});

		it('throws an error when a command does not exist', () => root
			.execute('non-existing-command', {})
			.then(req => {
				throw new Error('Should have thrown');
			})
			.catch(err => {
				assert.ok(err.message.includes('non-existing-command'));
			}));
	});
});
