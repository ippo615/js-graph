// ------------------------------------ [ Module: jQuery.changeStyleSheet ] -
// Changes the innerHTML of a style sheet (fixes IE<9 errors)
(function ($) {
   $.fn.styleSheet = function(cssCode){
     // note: `this` is actually a jQuery object NOT a dom node
     var ie;
     try {
       this.html(cssCode);
     }catch(ie){
       // Internet explorer < 9 does not let me set the innerHTML
       // of a style tag, so I need to do the following instead
       // (note: other browsers don't like this)
       this[0].styleSheet.cssText = cssCode;
     }
     return this;
   }  
})(jQuery);

function parseEquation(eq){
	// Cheap parser to handle sin -> Math.sin conversions
	eq = eq.toLowerCase()
		.replace(/\s+/g,'')
		.replace(/{/g,'{')
		.replace(/}/g,'}')
		.replace(/\[/g,'[')
		.replace(/\]/g,']')
		.replace(/and/g,'&&')
		.replace(/xor/g,'^')
		.replace(/or/g,'||')
		.replace(/pi/g,'Math.PI')
		.replace(/\be(?!xp)/g,'Math.E')
		.replace(/asin|arcsin/g,'Math.asin')
		.replace(/acos|arccos/g,'Math.acos')
		.replace(/atan|arctan/g,'Math.atan')
		.replace(/atan2|arctan2/g,'Math.atan2')
		.replace(/\bsin\b/g,'Math.sin')
		.replace(/\bcos\b/g,'Math.cos')
		.replace(/\btan\b/g,'Math.tan')
		.replace(/sqrt/g,'Math.sqrt')
		.replace(/abs/g,'Math.abs')
		.replace(/pow/g,'Math.pow')
		.replace(/exp/g,'Math.exp')
		.replace(/ln/g,'Math.log')
		.replace(/ceil|up/g,'Math.ceil')
		.replace(/floor|down/g,'Math.floor')
		.replace(/round/g,'Math.round')
		.replace(/<=|=</g,'LTE')
		.replace(/>=|=>/g,'GTE')
		.replace(/([^=]+)=+([^=]+)/g,'Math.abs(($1)-($2)) <= pxSize')
		.replace(/GTE/g,'>=')
		.replace(/LTE/g,'<=')
		.replace(/y/g,'-y') // invert for canvas - may want to move this
		;
	
	// Make function and return it
	var func;
	try{
		eval("func = function(x,y,pxSize){ return "+eq+"; };");
	}catch(e){
		console.info(eq);
		console.info(e);
		// Just return a function that does nothing
		func = function(x,y,pxSize){return 0;};
	}
	return func; 
}

function roundToSigFigs(num,nSigFigs){
	// We can't round 0
	if( num === 0 ){ return 0; }
	
	// Avoid negatives because log of a negative number is a complex number
	var isNeg = (num < 0);
	if( isNeg ){
		num = -num;
	}
	
	// We need to find the power of ten (10^X) that this number is closest to
	// note: 0.1 = 10^-1 ie numbers < 1, have negative powers
	var pow = Math.floor(Math.log(num)/Math.LN10);
	// Then use that power to compute an appropriate spot to round to
	var to = Math.pow(10, pow - nSigFigs + 1 );
	
	// Just round to that power, and correct the negative part
	if( isNeg ){
		return -Math.round( num/to )*to;
	}else{
		return Math.round( num/to )*to;
	}
}
/*
console.info(roundToSigFigs(999,1));
console.info(roundToSigFigs(0.0999,1));
console.info(roundToSigFigs(0.0988,2));
console.info(roundToSigFigs(0.0988,2));
console.info(roundToSigFigs(0.0500,2));
console.info(roundToSigFigs(0.0520,2));
console.info(roundToSigFigs(123456,2));
console.info(roundToSigFigs(123456,3));
console.info(roundToSigFigs(123456,4));
console.info(roundToSigFigs(123456,5));
console.info(roundToSigFigs(123456,6));
*/

function remap(fromValue,fromMin,fromMax,toMin,toMax){

	// Make sure min is less than max
	//var swap;
	//if( fromMin > fromMax ){ swap = fromMax; fromMin = fromMax; fromMin = swap; }
	//if( toMin > toMax ){ swap = toMax; toMin = toMax; toMin = swap; }
	
	// Compute the range of the data
	var fromRange = fromMax - fromMin;
	var toRange = toMax - toMin;

	// If either range is 0, then the value can only be mapped to 1 value
	if( fromRange === 0 ){ return toMin + toRange/2; }
	if( toRange === 0 ){ return toMin; }

	// (1) untranslate, (2) unscale, (3) rescale, (4) retranslate
	var toValue = (fromValue - fromMin) / fromRange;
	toValue = (toRange*toValue) + toMin;

	return toValue;
}
// alert( remap( 160, 0,320, 0,10 ) );
// alert( remap( 160, 0,320, 0,10000 ) );
// alert( remap( -40, 0,320, 0,10 ) );

function plotPartial(options){
	var xCanvasSize = options.canvas.width;
	var yCanvasSize = options.canvas.height;

	options.xCanvasSize = xCanvasSize;
	options.yCanvasSize = yCanvasSize;

	graphMakeSquare(options);

	// Define the region we are drawing
	var xStart = options.xStart || 0;
	var yStart = options.yStart || 0;
	var xSize = options.xSize || xCanvasSize;
	var ySize = options.ySize || yCanvasSize;
	var xEnd = xStart + xSize;
	var yEnd = yStart + ySize;

	// Make sure we stay in bounds of the image
	if( xEnd > xCanvasSize ){
		xEnd = xCanvasSize;
		xSize = xCanvasSize - xStart;
	}
	if( yEnd > yCanvasSize ){
		yEnd = yCanvasSize;
		ySize = yCanvasSize - yStart;
	}

	// Determine where in the function we are
	// Note: we have to use the `if` statement because 0 is a valid maximum
	var xMin = options.xMin || 0;
	var xMax = xCanvasSize;
	var yMin = options.yMin || 0;
	var yMax = yCanvasSize;
	if( options.hasOwnProperty('xMax') ){
		xMax = options.xMax;
	}
	if( options.hasOwnProperty('yMax') ){
		yMax = options.yMax;
	}

	// Compute the size of a pixel
	// This is important for determining "equality"
	// The exact value required for equality may not be in the pixel
	// grid SO we need to see if the difference between the
	// expressions is less than the pixel size
	// x = y become abs(x-y) <= pixelSize
	var xPixelSize = (xMax-xMin)/xCanvasSize;
	var yPixelSize = (yMax-yMin)/yCanvasSize;
	var pixelSize = (xPixelSize+yPixelSize);

	var context = options.canvas.getContext('2d');
	var imageData = context.getImageData(xStart,yStart,xSize,ySize);
	var pixels = imageData.data;

	var x,y, fx,fy, index, eq0, eq1, eq2, eq3, r,g,b;
	for( x=xStart; x<xEnd; x+=1 ){
		for( y=yStart; y<yEnd; y+=1 ){
			fx = remap(x,0,xCanvasSize,xMin,xMax);
			fy = remap(y,0,yCanvasSize,yMin,yMax);
			eq0 = options.functions[0](fx,fy,pixelSize) || 0;
			eq1 = options.functions[1](fx,fy,pixelSize) || 0;
			eq2 = options.functions[2](fx,fy,pixelSize) || 0;
			eq3 = options.functions[3](fx,fy,pixelSize) || 0;
			index = ((x-xStart)+(y-yStart)*xSize)*4;
			// If any are shown turn the alpha on
			if( eq0 || eq1 || eq2 || eq3 ){
				pixels[index+3] = 255;
			}else{
				pixels[index+3] = 0;
			}
			// merge color:
			r = 0;
			r += eq0 * options.colors[0].r;
			r += eq1 * options.colors[1].r;
			r += eq2 * options.colors[2].r;
			r += eq3 * options.colors[3].r;
			r /= (eq0+eq1+eq2+eq3);
			g = 0;
			g += eq0 * options.colors[0].g;
			g += eq1 * options.colors[1].g;
			g += eq2 * options.colors[2].g;
			g += eq3 * options.colors[3].g;
			g /= (eq0+eq1+eq2+eq3);
			b = 0;
			b += eq0 * options.colors[0].b;
			b += eq1 * options.colors[1].b;
			b += eq2 * options.colors[2].b;
			b += eq3 * options.colors[3].b;
			b /= (eq0+eq1+eq2+eq3);
			pixels[index+0] = r;
			pixels[index+1] = g;
			pixels[index+2] = b;
		}
	}

	context.putImageData(imageData,xStart,yStart);
}
function plotGrid(options){

	var xCanvasSize = options.canvas.width;
	var yCanvasSize = options.canvas.height;

	options.xCanvasSize = xCanvasSize;
	options.yCanvasSize = yCanvasSize;

	graphMakeSquare(options);

	// Define the region we are drawing
	var xStart = options.xStart || 0;
	var yStart = options.yStart || 0;
	var xSize = options.xSize || xCanvasSize;
	var ySize = options.ySize || yCanvasSize;
	var xEnd = xStart + xSize;
	var yEnd = yStart + ySize;

	// Make sure we stay in bounds of the image
	if( xEnd > xCanvasSize ){
		xEnd = xCanvasSize;
		xSize = xCanvasSize - xStart;
	}
	if( yEnd > yCanvasSize ){
		yEnd = yCanvasSize;
		ySize = yCanvasSize - yStart;
	}

	// Determine where in the function we are
	// Note: we have to use the `if` statement because 0 is a valid maximum
	var xMin = options.xMin || 0;
	var xMax = xCanvasSize;
	var yMin = options.yMin || 0;
	var yMax = yCanvasSize;
	if( options.hasOwnProperty('xMax') ){
		xMax = options.xMax;
	}
	if( options.hasOwnProperty('yMax') ){
		yMax = options.yMax;
	}

	// Compute the size of a pixel
	// This is important for determining "equality"
	// The exact value required for equality may not be in the pixel
	// grid SO we need to see if the difference between the
	// expressions is less than the pixel size
	// x = y become abs(x-y) <= pixelSize
	var xPixelSize = (xMax-xMin)/xCanvasSize;
	var yPixelSize = (yMax-yMin)/yCanvasSize;
	var pixelSize = (xPixelSize+yPixelSize);

	options.grid.height = yCanvasSize;
	options.grid.width = xCanvasSize;
	var context = options.grid.getContext('2d');

	// Get the grid parameters
	var nGridX = 10;
	var nGridY = 10;
	var gridStepX = (xMax - xMin)/nGridX;
	var gridStepY = (yMax - yMin)/nGridY;
	// Make sure the grid step is only 1 significant digit (ie 100 not 123)
	gridStepX = roundToSigFigs(gridStepX,1);
	gridStepY = roundToSigFigs(gridStepY,1);
	
	// Draw the grid (vertical lines then horizontal)
	var i, x, y, mid, xd, yd;
	context.globalAlpha = 0.25;
	context.strokeStyle = '#000';
	context.strokeSize = 1;
	context.textAlign = 'center';
	// mid = Math.floor(o.nGridX/2);
	mid = Math.floor((0 - xMin) / gridStepX);
	for( i=0; i<nGridX*2; i+=1 ){
		xd = (i-mid)*gridStepX;
		x = Math.round( remap( xd, xMin,xMax, 0,xCanvasSize ) );
		context.beginPath();
		context.moveTo( x+0.5 , Math.round(0)+0.5 );
		context.lineTo( x+0.5 , Math.round(yCanvasSize)+0.5 );
		context.stroke();
		// draw every other label:
		if( i%2 === 1 ){
			context.globalAlpha = 0.5;
			context.fillText(""+xd.toPrecision(2), x+0.5 ,yCanvasSize-12.5);
			context.globalAlpha = 0.25;
		}
	}
	// mid = Math.floor(o.nGridY/2);
	mid = Math.floor((0 - yMin) / gridStepY);
	for( i=0; i<nGridY*2; i+=1 ){
		yd = (i-mid)*gridStepY;
		y = Math.round( remap( yd, yMax,yMin, 0,yCanvasSize ) );
		context.beginPath();
		context.moveTo( Math.round(0)+0.5, yCanvasSize-y+0.5 );
		context.lineTo( Math.round(xCanvasSize)+0.5, yCanvasSize-y+0.5 );
		context.stroke();
		if( i%2 === 1 ){
			context.globalAlpha = 0.5;
			context.fillText(""+(-yd).toPrecision(2), xCanvasSize-32.5, yCanvasSize-y+0.5);
			context.globalAlpha = 0.25;
		}
	}

}

//console.info( (parseEquation('y=7*x'))(1,7) )
//console.info( (parseEquation('y=7+x'))(0,7) )
//console.info( (parseEquation('3*y=x'))(3,1) )

function graphMakeSquare(opts){
	if( opts.xCanvasSize === opts.yCanvasSize ){
		return opts;
	}
	var xSize = opts.xMax - opts.xMin;
	var ySize = opts.yMax - opts.yMin;
	var xMid = xSize/2 + opts.xMin;
	var yMid = ySize/2 + opts.yMin;
	var minSize = (xSize<ySize)?xSize:ySize;
	var minCanvas = (opts.xCanvasSize<opts.yCanvasSize)?opts.xCanvasSize:opts.yCanvasSize;
	xSize = opts.xCanvasSize * minSize / minCanvas;
	ySize = opts.yCanvasSize * minSize / minCanvas;

	opts.xMin = xMid - xSize/2;
	opts.yMin = yMid - ySize/2;
	opts.xMax = xMid + xSize/2;
	opts.yMax = yMid + ySize/2;

	return opts;
}
function graphPan(opts,dX,dY){
	// dX and dY should be in percent
	var xSize = opts.xMax - opts.xMin;
	var ySize = opts.yMax - opts.yMin;
	opts.xMax += dX * xSize;
	opts.xMin += dX * xSize;
	opts.yMax += dY * ySize;
	opts.yMin += dY * ySize;
	return opts;
}
function graphPanPx(opts,dX,dY){
	// dX and dY should be in pixels (of the canvas)
	dX /= opts.xCanvasSize;
	dY /= opts.yCanvasSize;
	var xSize = opts.xMax - opts.xMin;
	var ySize = opts.yMax - opts.yMin;
	opts.xMax += dX * xSize;
	opts.xMin += dX * xSize;
	opts.yMax += dY * ySize;
	opts.yMin += dY * ySize;
	return opts;
}
function graphZoom(opts,scale){
	var xSize = opts.xMax - opts.xMin;
	var ySize = opts.yMax - opts.yMin;
	var xMid = opts.xMin + xSize/2;
	var yMid = opts.yMin + ySize/2;
	var xZoomed = scale*xSize/2;
	var yZoomed = scale*ySize/2;
	opts.xMin = xMid - xZoomed;
	opts.yMin = yMid - yZoomed;
	opts.xMax = xMid + xZoomed;
	opts.yMax = yMid + yZoomed;
	return opts;
}

// ------------------------------------------------------- [Module: Overlay ] -
// Let's you draw (via mouse/touch) on a canvas
var setupOverlay = (function(){

	// My lazy excuse for jQuery:
	function $(id){
		// Allow '#id' or 'id'
		if( id.charAt(0) === '#' ){
			var element = document.getElementById(id.slice(1,id.length));
		}else{
			var element = document.getElementById(id);
		}
		var self = {}
		var on = function(eventStr,callback){
			var events = eventStr.split(' ');
			var i, l = events.length;
			for( i=0; i<l; i+=1 ){
				if( element.attachEvent ){
					element.attachEvent('on'+events[i], callback);
				}else{
					element.addEventListener(events[i], callback, false);
				}
			}
			return self;
		};

		self.on = on;
		self.element = element;

		return self;
	}

	var getPointerPositionsIn = function(e,target){
	/// Returns an array of {x: y:} objects that represent the x,y
	/// coordinates of the pointers relative to the top, left corner of the
	/// target object.
	/// Example:
	/// domNode.onclick = function(e){
	///   var positions = GetPointerPositionsInTarget(e);
	///   // Code that works with positions..
	/// }
	
		// Note that the target is the 'node on which the event occured'
		// not the 'node on which the event is registered'. For example:
		// <div id='parent'><div id='child'>BLAH</div></div>
		// If you regesiter the event on parent than target could be either
		// parent or child.
		var locations = [], // array of x,y pairs (finger locations)
		    nLocations = 0, // number of locations
		    nTouches, // number of touches to look through
		    mx = 0, // mouse position
		    my = 0,
		    baseX = 0, // Base object's position
		    baseY = 0,
		    baseObj,
		    i, iLocation, iTouch; // temp for iterating
	
		//get the original event (jQury changes e)
		//e = e.originalEvent;
		//we need an array of x,y pairs
		//if this is a touch event
		if(e.type === "touchstart"
		|| e.type === "touchmove"
		|| e.type === "touchend"){
			nTouches = e.touches.length;
			for(i=0; i<nTouches; i+= 1){
				iTouch = e.touches[i];
				locations[nLocations] = { x: iTouch.pageX, y: iTouch.pageY };
				nLocations += 1;
			}
			//could also use: (i haven't noticed a difference)
			//t = event.changedTouches[0];
			//get the mouse coordinates on the page
		}else{	
			//if we're actually given the page coordinates
			if(e.pageX || e.pageY){
				//use the page coordinates as the mouse coordinates
				mx = e.pageX;
				my = e.pageY;
			}else if(e.clientX || e.clientY){
				//compute the page corrdinates
				mx = e.clientX + document.body.scrollLeft +
					document.documentElement.scrollLeft;
				my = e.clientY + document.body.scrollTop  +
					document.documentElement.scrollTop;
			}
			locations[nLocations] = { x: mx, y: my };
			nLocations += 1;
		}
		//find the location of the base object
		baseObj = target;
		//as long as we haven't added all of the parents' offsets
		while(baseObj.offsetParent !== null){
			//add it's offset
			baseX += parseInt(baseObj.offsetLeft,10);
			baseY += parseInt(baseObj.offsetTop,10);
			//get the next parent
			baseObj = baseObj.offsetParent;
		}
		//the mouse position within the target object is:
		for(i=0; i<nLocations; i+=1){
			iLocation = locations[i];
			locations[i].x = iLocation.x - baseX;
			locations[i].y = iLocation.y - baseY;
		}
		return locations;
	};

	var lastPos = null;
	var currPos = null;
	var canvas = null;

	return function(id){
		canvas = $(id);
		canvas.on('touchstart mousedown',function(e){
			lastPos = getPointerPositionsIn(e,canvas.element);
			currPos = lastPos;
		}).on('touchmove mousemove',function(e){
			if( lastPos ){
				var tmp = lastPos;
				lastPos = currPos;
				currPos = getPointerPositionsIn(e,canvas.element);
	
				// Only draw a line if it's longer than 5 units
				//var dx = currPos[0].x - lastPos[0].x;
				//var dy = currPos[0].y - lastPos[0].y;
				//if( dx*dx + dy*dy < 32 ){
				//	currPos = lastPos;
				//	lastPos = tmp;
				//	return;
				//}
				
				// Draw this segment
				var ctx = canvas.element.getContext('2d');
				ctx.lineWidth = 4;
				ctx.lineCap = 'round';
				ctx.beginPath();
				ctx.moveTo(lastPos[0].x,lastPos[0].y);
				ctx.lineTo(currPos[0].x,currPos[0].y);
				ctx.stroke();
	
			}
			if( e.preventDefault ){
				e.preventDefault();
			}
		}).on('touchend mouseup mouseout',function(e){
			lastPos = null;
			currPos = lastPos;
		});
	};
})();

// ---------------------------------------------------- [ Module: Selection ] -
// Allows working with selections in input/textboxes
function backspaceSelected(node){
	var scrollPos = node.scrollTop;
	if(document.selection){
		if(!node.focus()){node.focus();}
		var text = document.selection.createRange().text;

		// If the user has text selected, delete it
		if( text.length !== 0 ){
			document.selection.createRange().text = '';
		}
		// Otherwise - remove the last character...
		else{
		}
	}else{
		// Determine the start/end of the selection
		var start = node.selectionStart;
		var newStart = start-1;
		var end = node.selectionEnd;
		var left = '';
		var right = node.value.substr(end);

		// If nothing is selected, delete the last character on the left
		// Otherwise, just delete the selection
		if( start === end ){
			newStart = start-1;
		}else{
			newStart = start;
		}
		left = node.value.substr(0,newStart);

		// Update the element
		node.value = left+right;

		// Set the right cursor position
		if( newStart < 0 ){ newStart = 0; }
		node.selectionStart = newStart;
		node.selectionEnd = newStart;
	}

	// scroll to the cursor (only if `node` is a textarea)
	node.scrollTop = scrollPos;
	node.focus();
}
function wrapSelected(node,leftText,rightText){
	// node = document.getElementById(id);
	var scrollPos = node.scrollTop;
	if(document.selection){
		// IE is surprisingly efficient in this one...
		if(!node.focus()){node.focus();}
		var sel = document.selection.createRange().text;
		var txt = document.selection.createRange();
		txt.text = leftText;
		if(rightText){
			txt.text += _sel;
			txt.text += rightText;
		}
	}else{
		
		// Get the locations of the start/end of the selection
		// Grab all of the text before the selection
		// Add the 'left' text to the start of the selection
		var start = node.selectionStart;
		var end = node.selectionEnd;
		var txt = node.value.substr(0,start);
		txt += leftText;

		// If we're also adding text to the right side
		// add the selected text PLUS the text we're adding on the right 
		if( rightText ){
			txt += node.value.substr(start,end-start);
			txt += rightText;
		}

		// Add the rest of the text and set it on the element
		txt += node.value.substr(end);
		node.value = txt;

		// Fix the selection so it is the same as it was before
		node.selectionStart = start + leftText.length;
		node.selectionEnd = start + leftText.length;
		if( rightText ){
			node.selectionEnd = end + leftText.length + rightText.length-1;
		}
	}
	// scroll to the cursor (only if `node` is a textarea)
	node.scrollTop = scrollPos;
	node.focus();
}
