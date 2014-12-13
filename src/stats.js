'use strict';
/* global $, console, window, document */
/* jshint globalstrict: true */
function Cache () {
	this.cache = {};
	this.cacheTime = 1000 * 60 * 60; // 1 hour cache
}

Cache.prototype.add = function (url, data) {
	this.cache[url] = {
		fetched: new Date().getTime(),
		data: data
	};
};

Cache.prototype.get = function (url) {
	if (url in this.cache) {
		var stats = this.cache[url];
		if (stats.fetched > new Date().getTime() - this.cacheTime) {
			return stats.data;
		}
	}
	return false;
};

window.statsHelpers = function () {
	var statsHost = 'https://dax-stats.iplayer.cloud.bbc.co.uk',
	statsCache = new Cache(),

	getPageInfo = function (currentUrl) {
		var currentPath = currentUrl.replace(/https?:\/\/[^\/]+/, ''),
			homepageMatch = currentPath.match(/^\/iplayer\/?$/),
			categoryMatches = currentPath.match(/\/iplayer\/categories\/([\w\-]+)\/highlights/),
			channelMatches = currentPath.match(/\/((iplayer|tv)\/)?(cbbc|bbc\w+|cbeebies|radio1)(\?.*)?$/),
			id;

		if (categoryMatches) {
			id = categoryMatches[1];
			return {
				id: id,
				type: 'category'
			};
		} else if (channelMatches) {
			id = (channelMatches.length == 5 ? channelMatches[3] : channelMatches[2]);
			return {
				id: id,
				type: 'channels'
			};
		} else if (homepageMatch) {
			id = 'homepage';
			return {
				id: id,
				type: 'homepage'
			};
		} else {
			return false;
		}

	},
	getStatsUrlForPage = function(currentUrl) {
		var info = getPageInfo(currentUrl);
		if (info === false) {
			return false;
		}
		if (info.id !== 'homepage') {
			return info.type + '-stream-' + info.id;
		} else {
			return 'homepage-stream';
		}
	},
	fetchStats = function (pageUrl) {
		var statsId = getStatsUrlForPage(pageUrl),
			url = statsHost + '/stats/' + statsId,
			defer = $.Deferred();

		if (statsId === false) {
			defer.reject(new Error('Current page is not known'));
		} else {

			$.ajax({
				method: 'get',
				dataType: 'json',
				url: url,
			    xhrFields: {
			       withCredentials: true
			    }
			}).statusCode({
				204: function (results) {
					defer.reject({
						data: false
					});
					statsCache.add(pageUrl, results);
				},
				202: function () {
					defer.reject({
						data: []
					});
				},
				200: function (results) {
					defer.resolve(results);
				}
			}).fail(function () {
				defer.reject(new Error('Request for stats failed'));
				console.log('Failed to fetch stats from', url);
			}).done();
		}

		return defer;
	},

	processStats = function (results) {
		var stats = {};

		$.each(results, function (i, stat) {
			stat = stat.c;

			if (stat[0] === 'Total') {
				return;
			}
			stats[stat[0]] = stats[stat[0]] || {};
			stats[stat[0]][stat[1]] = stat[2];
		});

		return stats;
	};

	return {
		getStats: function (url, user) {
			var defer = $.Deferred(),
				data = statsCache.get(url);

			if (data) {
				console.log('Pulled from cache');
				defer.resolve(data);
			} else {
				console.log('fetching new stats');
				return fetchStats(url, user).then(function (data) {
					data.stats = processStats(data.stats);
					return data;
				});
			}

			return defer;
		},
		getPageInfo: getPageInfo,
		getStatus: function () {
			return $.getJSON(statsHost + '/status');
		}
	};
};