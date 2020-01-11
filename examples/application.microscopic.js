'use strict';

const ask = require('../dist/AskNicely'),
	root = new ask.Command(null, req => console.dir(req, { colors: true }));

root.addOption('alpha', 'a');

root.addCommand('subcommand', req => console.dir(req, { colors: true }))
	.addOption('beta', 'b', null, true)
	.addParameter('gamma');

root.execute(process.argv.slice(2)).catch(error => console.error(error.stack));
