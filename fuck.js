'use strict';

var assert = require('assert'),
	AskNicely = require('./AskNicely'),
	root = new AskNicely();


root
	.addCommand('e')
	.addOption(new root.MultiOption('list').setShort('l'))
	.addOption(new root.MultiOption('derp').setShort('d'))
	.addOption(new root.MultiOption('eee').setShort('e').setDefault('abc'.split('')))
	.addOption(new root.MultiOption('fff').setShort('f').setDefault('def'.split('')))
	.addOption(new root.MultiOption('ggg').setShort('g').setDefault('ghi'.split('')));
root.interpret('e -lefd')
		.then(req => {
			console.log(req);
			return req;
		})
		.then(req => req.execute())
		.catch(e => console.error(e.stack));