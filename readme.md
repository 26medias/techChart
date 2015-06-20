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
		chart.render.asset("buy", chart.location("candles").position(19, 'o'));
		chart.render.asset("exitProfit", chart.location("candles").position(34, 'c'));
		
		var statsGroup = new chart.group('horizontal', {
			x:	10,
			y:	10
		});
		statsGroup.add('vprogress', {
			value:	70
		});
		statsGroup.add('vprogress', {
			value:	50
		});
		statsGroup.add('vprogress', {
			value:	30
		});
		statsGroup.add('vprogress', {
			value:	10
		});
		statsGroup.add('vprogress', {
			value:	20
		});
		statsGroup.add('vprogress', {
			value:	35
		});
		statsGroup.add('text', {
			text:	'90%',
			y:		3,
			x:		1
		});
		statsGroup.add('hprogress', {
			value:	45,
			y:		2
		});
		
		var statsGroup2 = new chart.group('horizontal', {
			x:	10,
			y:	20
		});
		statsGroup2.add('text', {
			text:		'70%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		statsGroup2.add('text', {
			text:		'50%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		statsGroup2.add('text', {
			text:		'30%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		statsGroup2.add('text', {
			text:		'10%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		statsGroup2.add('text', {
			text:		'20%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		statsGroup2.add('text', {
			text:		'35%',
			vertical:	true,
			w:			5,
			y:			2,
			x:			1
		});
		
		
		var statsGroup3 = new chart.group('vertical', {
			x:	75,
			y:	10
		});
		statsGroup3.add('hprogress', {
			value:	70
		});
		statsGroup3.add('hprogress', {
			value:	50
		});
		statsGroup3.add('hprogress', {
			value:	30
		});
		statsGroup3.add('hprogress', {
			value:	10
		});
		statsGroup3.add('hprogress', {
			value:	20
		});
		statsGroup3.add('hprogress', {
			value:	35
		});
		
		
		
		var statsGroup4 = new chart.group('vertical', {
			x:	statsGroup3.x+statsGroup3.width+2,
			y:	11
		},0);
		statsGroup4.add('text', {
			text:		'MACD',
			y:			0,
			x:			0
		});
		statsGroup4.add('text', {
			text:		'Stochastic',
			y:			0,
			x:			0
		});
		statsGroup4.add('text', {
			text:		'Probability',
			y:			0,
			x:			0
		});
		statsGroup4.add('text', {
			text:		'Cross-over',
			y:			0,
			x:			0
		});
		statsGroup4.add('text', {
			text:		'hello world',
			y:			0,
			x:			0
		});
		statsGroup4.add('text', {
			text:		'EUR-USD',
			y:			0,
			x:			0
		});
		
		
		
		var statsGroup5 = new chart.group('vertical', {
			x:	statsGroup4.x+statsGroup4.width+2,
			y:	11
		},0);
		statsGroup5.add('text', {
			text:		'70%',
			y:			0,
			x:			0
		});
		statsGroup5.add('text', {
			text:		'50%',
			y:			0,
			x:			0
		});
		statsGroup5.add('text', {
			text:		'30%',
			y:			0,
			x:			0
		});
		statsGroup5.add('text', {
			text:		'10%',
			y:			0,
			x:			0
		});
		statsGroup5.add('text', {
			text:		'20%',
			y:			0,
			x:			0
		});
		statsGroup5.add('text', {
			text:		'35%',
			y:			0,
			x:			0
		});
		
		
		chart.toPNG("render.png", function(response) {
			toolset.log("response", response);
		});
	});
