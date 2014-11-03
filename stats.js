
window.statsHelpers = function () {
	var statsHost = 'https://dax-stats.iplayer.cloud.bbc.co.uk',
		statsCache = new Cache();

	function getPageInfo (currentUrl) {
		var currentPath = currentUrl.replace(/https?:\/\/[^\/]+/, ''),
			categoryMatches = currentPath.match(/\/iplayer\/categories\/([\w\-]+)\/highlights/),
			channelMatches = currentPath.match(/\/((iplayer|tv)\/)?(cbbc|bbc\w+|cbeebies)(\?.*)?$/),
			id;

		if (categoryMatches) {
			id = categoryMatches[1];
			return {
				id: id,
				type: 'category'
			}
		} else if (channelMatches) {
			id = (channelMatches.length == 5 ? channelMatches[3] : channelMatches[2]);
			return {
				id: id,
				type: 'channels'
			}
		} else {
			id = 'homepage';
			return {
				id: id,
				type: 'homepage'
			}
		}

	}

	var getStatsUrlForPage = function(currentUrl) {
		var info = getPageInfo(currentUrl);
		if (info.id !== 'homepage') {
			return info.type + '-stream-' + info.id;
		} else {
			return 'homepage-stream';
		}
	}

	var fetchStats = function (pageUrl, user) {
		var url = statsHost + '/stats/' + getStatsUrlForPage(pageUrl),
			defer = $.Deferred()

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
		}).fail(function (jqXHR) {
			console.log('Failed to fetch stats from', url)
		}).done();

		return defer;
	}

	var processStats = function (results) {
		var stats = [];

		$.each(results, function (i, stat) {
			var stat = stat.c,
				parts = stat[0].split(/[_\-]/),
				columnNum,
				rowNum

			if (stat[0] == 'Total') {
				return;
			}
			if (parts.length == 2) {
				columnNum = parts[0];
				rowNum = parts[1];
			} else if (parts.length == 3) {
				columnNum = parts[0]
				rowNum = parts[1] + '-' + parts[2];
			}

			column = stats[columnNum] || {};
			column[rowNum] = column[rowNum] || {};
			column[rowNum][stat[1]] = stat[2];
			stats[columnNum] = column;
		});

		return stats;
	}

	return {
		getStats: function (url, user) {
			var defer = $.Deferred();
			data = statsCache.get(url);
			if (data) {
				console.log('Pulled from cache')
				defer.resolve(data);
			} else {
				console.log('fetching new stats')
				return fetchStats(url, user).then(function (data) {
					data.stats = processStats(data.stats);
					return data
				})
			}

			return defer;
		},
		getPageInfo: getPageInfo,
		getStatus: function () {
			return $.getJSON(statsHost + '/status')
		}
	}

}

function Cache () {
	this.cache = {};
	this.cacheTime = 1000 * 60 * 60; // 1 hour cache
}

Cache.prototype.add = function (url, data) {
	this.cache[url] = {
		fetched: new Date().getTime(),
		data: data
	};
}
Cache.prototype.get = function (url) {
	if (url in this.cache) {
		stats = this.cache[url];
		if (stats.fetched > new Date().getTime() - this.cacheTime) {
			return stats.data;
		}
	}
	return false;
}
