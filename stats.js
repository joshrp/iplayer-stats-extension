window.statsHelpers = function () {
	var statsCache = {},
		cacheTime = 1000 * 60 * 60; // 1 hour cache

	var addToCache = function (url, data) {
		statsCache[url] = {
			fetched: new Date().getTime(),
			data: data
		};
	}

	var getFromCache = function (url) {
		if (url in statsCache) {
			stats = statsCache[url];
			if (stats.fetched > new Date().getTime() - cacheTime) {
				return stats.data;
			}
		}
		return false;
	}

	var getStatsUrlForPage = function(currentUrl) {
		currentPath = currentUrl.replace(/https?:\/\/[^\/]+/, '');
		categoryMatches = currentPath.match(/\/iplayer\/categories\/([\w\-]+)\/highlights/)
		channelMatches = currentPath.match(/\/((iplayer|tv)\/)?(cbbc|bbc\w+|cbeebies)$/)
		if (categoryMatches) {
			return 'category-stream-' + categoryMatches[1];
		} else if (channelMatches) {
			return 'channels-stream-' + (channelMatches.length == 4 ? channelMatches[3] : channelMatches[2]);
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
		    },
		    beforeSend: function (xhr) {
		    	user.username = 'josh'
		    	user.password = 'foo'
		    	auth = btoa(user.username + ':' + user.password);
			    xhr.setRequestHeader ("Authorization", "Basic " + auth);
			}
		}).fail(function (e) {
			console.log('Failed to fetch stats from', url)
			defer.reject(e);
		}).then(function (results, status, jqXHR) {
			if (jqXHR.status === 204) {
				defer.resolve({
					data: false
				})
			}

			addToCache(pageUrl, results);

			defer.resolve(results);

		});

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
			stats = getFromCache(url);
			if (stats) {
				console.log('Pulled from cache')
				result = processStats(stats)
				defer.resolve(result);
			} else {
				console.log('fetching new stats')
				return fetchStats(url, user).then(function (results) {
					return processStats(results);
				});
			}

			return defer;


		}
	}

}
