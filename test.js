var toolset 	= require('toolset');
var _ 			= require('underscore');
var techChart 	= require('./techChart');

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