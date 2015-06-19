var moment 			= require('moment');
var toolset 		= require('toolset');
var _ 				= require('underscore');
var path 			= require("path");
var fs 				= require("fs");
var PNG				= require('pngjs').PNG
var imgurUploader	= require('imgur-uploader');

var signalChart		= function(options) {
	
	this.options	= _.extend({
		width:				600,	// in Pixels
		height:				300,	// in Pixels
		candleWidth:		9,		// in Pixels
		marginPct:			20,		// % of a candle width
		marginWidth:		0,		// Will calculate after
		legPct:				5,		// % of a candle width
		legWidth:			0,		// Will calculate after
		candleWidthInner:	0,		// Will calculate after
	}, options);
	
	this.data			= {
		data:	{}
	};
	
	this.data.pixels	= new Uint32Array(this.options.width*this.options.height);
	
	this.color			= {
		background:		{
			r:	19,
			g:	19,
			b:	24,
			a:	255
		},
		up:		{
			r:	14,
			g:	150,
			b:	159,
			a:	255
		},
		down:		{
			r:	19,
			g:	75,
			b:	95,
			a:	255
		},
		mark:		{
			r:	255,
			g:	255,
			b:	255,
			a:	160
		},
		text:		{
			r:	197,
			g:	197,
			b:	198,
			a:	255
		},
		forecast:	{
			r:	255,
			g:	129,
			b:	45,
			a:	255
		},
		probability_range:	{
			r:	255,
			g:	255,
			b:	255,
			a:	20
		},
		frame:	{
			r:	255,
			g:	255,
			b:	255,
			a:	200
		},
		stopLoss:	{
			r:	238,
			g:	64,
			b:	53,
			a:	120
		},
		takeProfit:	{
			r:	255,
			g:	255,
			b:	255,
			a:	120
		},
		transform:	{
			r:	255,
			g:	255,
			b:	255,
			a:	100
		},
		profitText:	{
			r:	109,
			g:	217,
			b:	0,
			a:	255
		},
		lossText:	{
			r:	226,
			g:	72,
			b:	42,
			a:	255
		}
	};
	
	this.debugBuffer = [];
	
	
}

signalChart.prototype.dataset = function(name, dataset) {
	this.data.data[name] = dataset;
}

signalChart.prototype.getData = function(name) {
	if (this.data.data.hasOwnProperty(name)) {
		return this.data.data[name];
	} else {
		return [];
	}
}

signalChart.prototype.init = function() {
	var scope = this;
	
	// Calculate the display parameters
	this.computeDisplayParameters();
	
	// Recalculate the scale parameters
	this.computeScaleParameters();
	
	// Render the background
	this.rect(0,0,this.options.width,this.options.height,this.color.background);
	
	this.render = {
		candles:	 {
			regular: function(name) {
				_.each(scope.getData(name), function(candle, pos) {
					scope.drawCandle(candle, pos, true);
				});
			},
			heikinHashi: function(name) {
				var scope = this;
				var haCandles = [];
				_.each(scope.getData(name), function(candle, pos) {
					if (pos==0) {
						var haClose	= (candle.o + candle.h + candle.l + candle.c) / 4;
						var haOpen	= (candle.o + candle.c) / 2;
						var haHigh	= Math.max(candle.h, haOpen, haClose);
						var haLow	= Math.min(candle.l, haOpen, haClose);
					} else {
						var haClose	= (candle.o + candle.h + candle.l + candle.c) / 4;
						var haOpen	= (haCandles[pos-1].o + haCandles[pos-1].c) / 2;
						var haHigh	= Math.max(candle.h, haOpen, haClose);
						var haLow	= Math.min(candle.l, haOpen, haClose);
					}
					haCandles.push({
						d:	candle.d,
						o:	haOpen,
						h:	haHigh,
						l:	haLow,
						c:	haClose,
						v:	candle.v
					});
					scope.rect(( pos * scope.options.candleWidth ) + scope.options.marginWidth, scope.valueToY(candle.c), scope.options.candleWidthInner, 1, scope.color.mark);
				});
				_.each(haCandles, function(candle, pos) {
					scope.drawCandle(candle, pos, true);
				});
			}
		},
		chart: {
			line: function(name) {
				var i;
				var data	= scope.getData(name);
				var l		= data.length;
				var lineCoordinates	= [];
				for (i=0;i<l;i++) {
					if (transform[i] && transform[i].v > 0) {
						lineCoordinates.push([i*scope.options.candleWidth+scope.options.candleWidth/2, scope.valueToY(transform[i].v)]);
					}
				}
				scope.lines(lineCoordinates, scope.color.transform);
			}
		},
		asset:	function(name, position, callback) {
			scope.importAsset(name, position.x, position.y, callback);
		},
		geometry:	{
			line:	function(pos1, pos2, color) {
				scope.line(pos1.x, pos1.y, pos2.x, pos2.y, color);
			}
		}
	};
	
	signalChart.prototype.location = function(name) {
		var scope	= this;
		var data	= this.getData(name);
		return {
			position:	function(pos, v) {
				return {
					x:	(scope.options.candleWidth*pos+scope.options.candleWidth/2)^0,
					y:	scope.valueToY(data[pos][v])
				};
			}
		}
	}
	
	signalChart.prototype.importAsset = function(name, x, y, callback) {
		var scope = this;
		scope.assets.load(name, function(png) {
			var i,j, indexAsset, indexDest, xx, yy;
			for (j=0;j<png.asset.h;j++) {
				for (i=0;i<png.asset.w;i++) {
					xx								= x+i-png.asset.x;
					yy								= y+j-png.asset.y;
					if (xx<0||xx>scope.options.width||yy<0||yy>scope.options.height) {continue;}
					indexDest						= scope.index(xx, yy, scope.options.width);
					indexAsset						= scope.index(i, png.asset.h-j, png.asset.w);
					scope.setPixel(xx, yy, scope.rgba_decode(png.pixels[indexAsset]));
				}
			}
			callback();
		});
	}
	
	this.assets = new (function(){
		
		this.assetsDirectory = path.normalize(__dirname+'/assets/');
		
		this.assets = {
			/*sell:	{
				filename:	path.normalize(this.assetsDirectory+'forecast/sell.png'),
				x:			0,
				y:			38,
				w:			108,
				h:			38
			},
			buy:	{
				filename:	path.normalize(this.assetsDirectory+'forecast/buy.png'),
				x:			0,
				y:			38,
				w:			108,
				h:			38
			},*/
			stats:	{
				filename:	path.normalize(this.assetsDirectory+'forecast/stats.png'),
				x:			0,
				y:			65,
				w:			106,
				h:			65
			},
			logo:	{
				filename:	path.normalize(this.assetsDirectory+'forecast/logo.png'),
				x:			0,
				y:			85,
				w:			275,
				h:			85
			},
			logo_short:	{
				filename:	path.normalize(this.assetsDirectory+'forecast/logo_short.png'),
				x:			0,
				y:			38,
				w:			206,
				h:			38
			},
			buy:	{
				filename:	path.normalize(this.assetsDirectory+'position/buy.png'),
				x:			117,
				y:			100,
				w:			169,
				h:			150
			},
			sell:	{
				filename:	path.normalize(this.assetsDirectory+'position/sell.png'),
				x:			79,
				y:			52,
				w:			130,
				h:			151
			},
			target:	{
				filename:	path.normalize(this.assetsDirectory+'position/target.png'),
				x:			22,
				y:			0,
				w:			44,
				h:			19
			},
			stopLoss:	{
				filename:	path.normalize(this.assetsDirectory+'position/stop-loss.png'),
				x:			26,
				y:			0,
				w:			52,
				h:			47
			},
			loss:	{
				filename:	path.normalize(this.assetsDirectory+'position/loss.png'),
				x:			44,
				y:			23,
				w:			88,
				h:			23
			},
			profit:	{
				filename:	path.normalize(this.assetsDirectory+'position/profit.png'),
				x:			44,
				y:			23,
				w:			88,
				h:			23
			},
			exitProfit:	{
				filename:	path.normalize(this.assetsDirectory+'position/exit-profit.png'),
				x:			35,
				y:			35,
				w:			70,
				h:			70
			},
			exitLoss:	{
				filename:	path.normalize(this.assetsDirectory+'position/exit-loss.png'),
				x:			35,
				y:			35,
				w:			70,
				h:			70
			},
			positionStats:	{
				filename:	path.normalize(this.assetsDirectory+'position/stats.png'),
				x:			0,
				y:			55,
				w:			110,
				h:			55
			}
		};
		
		this.rgba_encode = function(color) {
			// We encode into a int a 255 buffer, probability, position and direction
			return (color.a << 24) | (color.b << 16) | (color.g << 8) | color.r;
		};
		
		this.index = function(x, y, w) {
			if (!w) {
				w = this.options.width;
			}
			return y * w + x;
		}
		
		this.load = function(name, callback) {
			
			var scope = this;
			
			if (!this.assets.hasOwnProperty(name)) {
				callback(false);
				return false;
			}
			fs.createReadStream(this.assets[name].filename).pipe(new PNG({
				filterType: 4
			})).on('parsed', function() {
				
				var output = new Uint32Array(scope.assets[name].w*scope.assets[name].h);
				
				for (var y = 0; y < this.height; y++) {
					for (var x = 0; x < this.width; x++) {
						var idx = (this.width * y + x) << 2;
						
						output[scope.index(x, y, scope.assets[name].w)] = scope.rgba_encode({
							a:	this.data[idx],
							b:	this.data[idx+1],
							g:	this.data[idx+2],
							r:	this.data[idx+3]
						});
					}
				}
				
				callback({
					pixels:		output,
					asset:		scope.assets[name]
				});
				
			});
		}
	})();
}


signalChart.prototype.toPNG = function(filename, callback) {
	
	var image = new PNG({
		width:	this.options.width,
		height:	this.options.height
	});
	
	// Now we convert the data
	var x,y,idx,idxpix;
	for (y = 0; y < this.options.height; y++) {
		for (x = 0; x < this.options.width; x++) {
			idx					= (this.options.width * (this.options.height-1-y) + x) << 2;
			idxpix				= this.index(x,y);
			color				= this.rgba_decode(this.data.pixels[idxpix]);
			image.data[idx]		= color.r;
			image.data[idx+1]	= color.g;
			image.data[idx+2]	= color.b;
			image.data[idx+3]	= color.a;
		}
	}
	
	var writeStream = fs.createWriteStream(filename);
	image.pack().pipe(writeStream);
	writeStream.on('finish', function() {
		callback(filename);
	});
	writeStream.on('error', function (err) {
		toolset.error("toPNG()", err);
	});
}

signalChart.prototype.toImgur = function(filename, callback) {
	imgurUploader(fs.readFileSync(filename), function (err, res) {
		if (err) {
			toolset.error("toImgur()", err);
		}
		callback(res);
	});
}


signalChart.prototype.computeDisplayParameters = function() {
	// The width of each margin in pixel
	this.options.marginWidth		= Math.round(this.options.candleWidth*this.options.marginPct/100);
	// The width of the inner candle (the candle body)
	this.options.candleWidthInner	= Math.round(this.options.candleWidth-this.options.marginWidth*2);
	// The width of the legs in pixel
	this.options.legWidth			= Math.ceil(this.options.candleWidth*this.options.legPct/100);

	return this;
}

signalChart.prototype.computeScaleParameters = function() {
	var scope = this;
	
	// Calculate how many candles we can display
	var candleCount = Math.ceil(this.options.width/this.options.candleWidth);
	
	// Stats
	this.stats		= {};
	this.stats.min	= Number.POSITIVE_INFINITY;
	this.stats.max	= Number.NEGATIVE_INFINITY;
	_.each(this.data.data, function(dataset, name) {
		// Crop the data
		dataset = dataset.slice(0,candleCount);
		
		_.each(dataset, function(candle) {
			if (!candle.c) {	// no candle data, forecasted value
				return false;
			}
			if (candle.h > scope.stats.max) {
				scope.stats.max = candle.h;
			}
			if (candle.l < scope.stats.min) {
				scope.stats.min = candle.l;
			}
		});
	});
	
	// Add 2% for the forecast
	this.stats.max += 	(this.stats.max-this.stats.min)*0.1;
	this.stats.min -= 	(this.stats.max-this.stats.min)*0.1;
	
	toolset.log("stats", this.stats);
	
	
	
	
	return this;
}


signalChart.prototype.drawCandle = function(candle, pos, faded) {
	if (!candle.c) {
		return this;
	}
	var scope = this;
	
	// Calculate the points in px
	var pxCandle = {
		o:		this.valueToY(candle.o),
		h:		this.valueToY(candle.h),
		l:		this.valueToY(candle.l),
		c:		this.valueToY(candle.c),
		v:		0
	};
	
	// Calculate the x position
	var x = ( pos * this.options.candleWidth ) + this.options.marginWidth;
	var w = this.options.candleWidthInner;
	
	// Calculate the body
	var color = (candle.o>candle.c)?this.color.down:this.color.up;
	if (faded) {
		color.a = 120;
	}
	var body = {
		x:		x,
		y:		(candle.o>candle.c)?pxCandle.c:pxCandle.o,
		w:		w,
		h:		Math.abs(pxCandle.o-pxCandle.c),
		color:	color,
	}
	
	// Calculate the legs
	var high = {
		x:		( pos * this.options.candleWidth ) + (this.options.candleWidth-this.options.legWidth)/2,
		y:		(candle.o>candle.c)?pxCandle.o:pxCandle.c,
		w:		this.options.legWidth,
		h:		(candle.o>candle.c)?pxCandle.h-pxCandle.o:pxCandle.h-pxCandle.c,
		color:	body.color
	}
	var low = {
		x:		high.x,
		y:		pxCandle.l,
		w:		high.w,
		h:		(candle.o>candle.c)?pxCandle.c-pxCandle.l:pxCandle.o-pxCandle.l,
		color:	body.color
	}
	
	this.rect(body.x, body.y, body.w, body.h, body.color);
	this.rect(high.x, high.y, high.w, high.h, high.color);
	this.rect(low.x, low.y, low.w, low.h, low.color);
	
	return this;
}

signalChart.prototype.valueToY = function(v) {
	return this.map(parseFloat(v), this.stats.min, this.stats.max, 0, this.options.height)^0;
}

signalChart.prototype.map = function(x,in_min,in_max,out_min,out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

signalChart.prototype.toRGB = function(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
};

signalChart.prototype.rect = function(x, y, w, h, color, pixelOverwride) {
	//this.debug("rect", [x, y, w, h, color]);
	/*
	y = this.options.height - y;*/
	x = Math.round(x);
	y = Math.round(y);
	
	var i,j;
	for (i=y;i<y+h;i++) {
		for (j=x;j<x+w;j++) {
			if (j<0||j>this.options.width||i<0||i>this.options.height) {continue;}
			this.setPixel(j, i, color, pixelOverwride);
		}
	}
}

signalChart.prototype.line = function(x1, y1, x2, y2, color) {
	
	x1 = Math.round(x1);
	y1 = Math.round(y1);
	x2 = Math.round(x2);
	y2 = Math.round(y2);
	
	var _y1 = Math.min(y1,y2);
	var _y2 = Math.max(y1,y2);
	
	var i,j,y,ya,yb,va,vb;
	for (i=x1;i<=x2;i++) {
		y	= y1+(((i-x1)*(y2-y1))/(x2-x1));
		ya	= Math.floor(y);
		yb	= Math.ceil(y);
		//va	= 
		this.setPixel(i, Math.round(y), color);
	}
}


signalChart.prototype.lines = function(coords, color) {
	var i;
	var l = coords.length-1;
	for (i=0;i<l;i++) {
		this.line(coords[i][0]^0, coords[i][1]^0, coords[i+1][0]^0, coords[i+1][1]^0, color);
	}
}

signalChart.prototype.setPixel = function(x, y, color, pixelOverwride) {
	var scope = this;
	x = Math.round(x);
	y = Math.round(y);
	if (x<0||x>this.options.width||y<0||y>this.options.height) {return this;}
	var index	= y * this.options.width + x;
	
	if (color === 0 ) {
		return false;
	}
	
	var index, pix, newpix;
	
	// Decode the current value
	if (this.data.pixels[index] === 0 || pixelOverwride) {
		this.data.pixels[index]	= scope.rgba_encode(color);
	} else {
		pix = this.rgba_decode(this.data.pixels[index]);
		
		
		newpix = {
			r:	(((color.r/255)*(color.a/255)) + ((pix.r/255)*(pix.a/255)) - ((pix.r/255)*(pix.a/255))*(color.a/255)) * (255/((color.a/255) + (pix.a/255) - (color.a/255)*(pix.a/255)))^0,
			g:	(((color.g/255)*(color.a/255)) + ((pix.g/255)*(pix.a/255)) - ((pix.g/255)*(pix.a/255))*(color.a/255)) * (255/((color.a/255) + (pix.a/255) - (color.a/255)*(pix.a/255)))^0,
			b:	(((color.b/255)*(color.a/255)) + ((pix.b/255)*(pix.a/255)) - ((pix.b/255)*(pix.a/255))*(color.a/255)) * (255/((color.a/255) + (pix.a/255) - (color.a/255)*(pix.a/255)))^0,
			a:	Math.abs(Math.min(255,pix.a+color.a))^0
		};
		
		this.data.pixels[index]	= scope.rgba_encode(newpix);
	}
	
	return this;
}






// Encode an rgba color into an int
signalChart.prototype.rgba_encode = function(color) {
	// We encode into a int a 255 buffer, probability, position and direction
	//return (color.a << 24) | (color.b << 16) | (color.g << 8) | color.r;
	return (color.r<<24|color.g<<16|color.b<<8|color.a);
}

// Decode an int into an rgba color
signalChart.prototype.rgba_decode = function(pixel) {
	// (color.a << 24) | (color.b << 16) | (color.g << 8) | color.r;
	// ((Math.abs(color.a) || 255) << 24) | (color.b << 16) | (color.g << 8) | color.r
	return {
		r:		0xFF & (pixel >> 24),
		g:		0xFF & (pixel >> 16),
		b:		0xFF & (pixel >> 8),
		a:		0xFF & pixel
	};
	/*return {
		r:		pixel&0x000000FF,
		g:		(pixel&0x0000FF00)>>8,
		b:		(pixel&0x00FF0000)>>16,
		a:		(pixel&0xFF000000)>>24
	};*/
}

signalChart.prototype.index = function(x, y, w) {
	if (!w) {
		w = this.options.width;
	}
	return y * w + x;
}

signalChart.prototype.inv_index = function(i, w) {
	/*
		y	= (i/w)^0
		x	= i-(y*w)
	*/
	if (!w) {
		w = this.options.width;
	}
	var y	= (i/w)^0;
	var x	= i-(y*w);
	return {
		x:	x,
		y:	y
	}
}


signalChart.prototype.write = function(x, y, input, color, minHeight, vertical) {
	if (!minHeight) {
		minHeight = 0;
	}
	if (y+minHeight>this.height) {
		y = this.height - minHeight;
	}
	if (y<0) {
		y = minHeight;
	}
	
	var font = {
		'null':	[[0,0,0],[0,0,0],[0,1,0],[0,0,0],[0,0,0]],
		'0':	[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
		'1':	[[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
		'2':	[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
		'3':	[[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
		'4':	[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
		'5':	[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
		'6':	[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
		'7':	[[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
		'8':	[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
		'9':	[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
		'%':	[[1,0,0],[0,0,1],[0,1,0],[1,0,0],[0,0,1]],
		'.':	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
		'.':	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
		':':	[[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
		'/':	[[0,0,0],[0,0,1],[0,1,0],[1,0,0],[0,0,0]],
		' ':	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
		'-':	[[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
		'+':	[[0,0,0],[0,1,0],[1,1,1],[0,1,0],[0,0,0]],
		'A':	[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
		'B':	[[1,1,1],[1,0,1],[1,1,0],[1,0,1],[1,1,1]],
		'C':	[[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
		'D':	[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
		'E':	[[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]],
		'F':	[[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,0,0]],
		'G':	[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
		'H':	[[1,0,1],[1,0,0],[1,1,1],[1,0,1],[1,0,1]],
		'I':	[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
		'J':	[[0,0,1],[0,0,1],[0,0,1],[1,0,1],[1,1,1]],
		'K':	[[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
		'N':	[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1]],
		'U':	[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
		'R':	[[1,1,1],[1,0,1],[1,1,1],[1,1,0],[1,0,1]],
		'S':	[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
		'P':	[[1,1,1],[1,0,1],[1,1,1],[1,0,0],[1,0,0]],
		'Y':	[[1,0,1],[1,0,1],[1,1,1],[0,1,0],[0,1,0]],
		'Z':	[[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
	};
	
	parts = input.split('');
	
	var l = parts.length;
	var i,j,xx,yy,dy;
	var char, cursor;
	cursor = {
		x:	0,
		y:	0
	};
	for (i=0;i<l;i++) {
		if (!font.hasOwnProperty(parts[i].toString())) {
			char	= font['null'];
		} else {
			char	= font[parts[i]];
		}
		if (vertical) {
			for (yy=0;yy<char.length;yy++) {
				for (xx=0;xx<char[yy].length;xx++) {
					if (char[yy][xx]==1) {
						this.setPixel(x+xx, y+(char.length-1-yy)+(l*6-cursor.y) + (this.options.height-l*6) - 6, color, true);
					}
				}
			}
			cursor.y += 6;
		} else {
			for (yy=0;yy<char.length;yy++) {
				for (xx=0;xx<char[yy].length;xx++) {
					if (char[yy][xx]==1) {
						this.setPixel(x+xx+cursor.x, y+(char.length-1-yy), color, true);
					}
				}
			}
			cursor.x += 4;
		}
		
	}
	
}
		
module.exports		= signalChart;