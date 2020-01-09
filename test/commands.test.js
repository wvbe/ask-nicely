/* eslint-disable no-undef */

const ask = require('../AskNicely');

const root = new ask.Command('root');
root.addCommand(new ask.Command('a', req => req))
	.addAlias('alias')
	.addPreController(req => {
		req.firstPreController = true;
	})
	.setController(req => req)
	.addOption('z')
	.addCommand('aa', req => req)
	.addPreController(req => {
		req.secondPreController = true;
	});
root.addCommand('b', req => req)
	.addPreController(req => {
		Object.assign(req, { first: 'should-be-set' });
		return false;
	})
	.addPreController(req => {
		req.second = 'should-not-be-set';
	});

describe('Command', () => {
	describe('execute()', () => {
		it('precontrollers are ran for all parents before the actual controller', async () => {
			const req = await root.execute('a aa', {});

			expect(req.firstPreController).toBe(true);
			expect(req.secondPreController).toBe(true);
		});

		it('can use an alias command name', async () => {
			const req = await root.execute('alias', {});

			expect(req.firstPreController).toBe(true);
			expect(req.command.name).toBe('a');
		});

		it('can parse relative from any depth in the command hierarchy', async () => {
			const req = await root.children[0].execute('--z napoleon', {});

			expect(req.firstPreController).toBe(true);
			expect(req.options.z).toBe('napoleon');
			expect(req.command.name).toBe('a');
		});

		it('returning FALSE prevents executing consecutive (pre) controllers', async () => {
			const req = { myReq: true };

			await root.execute('b', req);

			expect(req.myReq).toBe(true);
			expect(req.first).toBe('should-be-set');
			expect(req.second).toBe(undefined);
		});

		it('throws an error when a command does not exist', () => {
			expect(root.execute('non-existing-command')).rejects.toThrow('non-existing-command');
		});
	});
});
