'use strict';

module.exports = function lazyLoadedCommand (req, res) {
	req.lazyLoaded = true;
	req.res = res;

	return {
		value: true
	};
};
