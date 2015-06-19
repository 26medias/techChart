# TechChart #

Generates financial charts in PNG, serverside, without the help of Canvas or external dependencies outside of the NPM environment.

The theme is based on a commercial graphical kit.

If you're going to use the chart, you need to buy the license or delete the assets.

[http://graphicriver.net/item/quantum-hitech-hud-creator-kit/9020363](http://graphicriver.net/item/quantum-hitech-hud-creator-kit/9020363)

	var toolset 	= require('toolset');
	var _ 			= require('underscore');
	var techChart 	= require('techChart');
	
	toolset.file.toObject('./data-EUR-JPY-15M.json', function(data) {
		var chart = new techChart();
		chart.dataset("candles", data);
		chart.init();
		chart.render.candles.regular("candles");
		chart.render.geometry.line(chart.location("candles").position(19, 'o'), chart.location("candles").position(34, 'c'), chart.color.forecast);
		chart.render.asset("buy", chart.location("candles").position(19, 'o'), function() {
			chart.render.asset("exitProfit", chart.location("candles").position(34, 'c'), function() {
				chart.toPNG("render.png", function(response) {
					toolset.log("response", response);
				});
			});
		});
	});

