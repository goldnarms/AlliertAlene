(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function corslite(url, callback, cors) {
    var sent = false;

    if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
    }

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain +
                (location.port ? ':' + location.port : ''));
    }

    var x = new window.XMLHttpRequest();

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    if (cors && !('withCredentials' in x)) {
        // IE8-9
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
            if (sent) {
                original.apply(this, arguments);
            } else {
                var that = this, args = arguments;
                setTimeout(function() {
                    original.apply(that, args);
                }, 0);
            }
        }
    }

    function loaded() {
        if (
            // XDomainRequest
            x.status === undefined ||
            // modern browsers
            isSuccessful(x.status)) callback.call(x, null, x);
        else callback.call(x, x, null);
    }

    // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
    // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
    if ('onload' in x) {
        x.onload = loaded;
    } else {
        x.onreadystatechange = function readystate() {
            if (x.readyState === 4) {
                loaded();
            }
        };
    }

    // Call the callback with the XMLHttpRequest object as an error and prevent
    // it from ever being called again by reassigning it to `noop`
    x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() { };
    };

    // IE9 must have onprogress be set to a unique function.
    x.onprogress = function() { };

    x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    // GET is the only supported HTTP Verb by XDomainRequest and is the
    // only one supported here.
    x.open('GET', url, true);

    // Send the request. Sending data is not supported.
    x.send(null);
    sent = true;

    return x;
}

if (typeof module !== 'undefined') module.exports = corslite;

},{}],2:[function(require,module,exports){
/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/
(function (window, document, undefined) {
var oldL = window.L,
    L = {};

L.version = '0.7.2';

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = L;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(L);
}

// define Leaflet as a global L variable, saving the original L to restore later if needed

L.noConflict = function () {
	window.L = oldL;
	return this;
};

window.L = L;


/*
 * L.Util contains various utility functions used throughout Leaflet code.
 */

L.Util = {
	extend: function (dest) { // (Object[, Object, ...]) ->
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	bind: function (fn, obj) { // (Function, Object) -> Function
		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
		return function () {
			return fn.apply(obj, args || arguments);
		};
	},

	stamp: (function () {
		var lastId = 0,
		    key = '_leaflet_id';
		return function (obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),

	invokeEach: function (obj, method, context) {
		var i, args;

		if (typeof obj === 'object') {
			args = Array.prototype.slice.call(arguments, 3);

			for (i in obj) {
				method.apply(context, [i, obj[i]].concat(args));
			}
			return true;
		}

		return false;
	},

	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;

		return function wrapperFn() {
			var args = arguments;

			if (lock) {
				execOnUnlock = true;
				return;
			}

			lock = true;

			setTimeout(function () {
				lock = false;

				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);

			fn.apply(context, args);
		};
	},

	falseFn: function () {
		return false;
	},

	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	splitWords: function (str) {
		return L.Util.trim(str).split(/\s+/);
	},

	setOptions: function (obj, options) {
		obj.options = L.extend({}, obj.options, options);
		return obj.options;
	},

	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {

	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		var i, fn,
		    prefixes = ['webkit', 'moz', 'o', 'ms'];

		for (i = 0; i < prefixes.length && !fn; i++) {
			fn = window[prefixes[i] + name];
		}

		return fn;
	}

	var lastTime = 0;

	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame ||
	        getPrefixed('RequestAnimationFrame') || timeoutDefer;

	var cancelFn = window.cancelAnimationFrame ||
	        getPrefixed('CancelAnimationFrame') ||
	        getPrefixed('CancelRequestAnimationFrame') ||
	        function (id) { window.clearTimeout(id); };


	L.Util.requestAnimFrame = function (fn, context, immediate, element) {
		fn = L.bind(fn, context);

		if (immediate && requestFn === timeoutDefer) {
			fn();
		} else {
			return requestFn.call(window, fn, element);
		}
	};

	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};

}());

// shortcuts for most used utility functions
L.extend = L.Util.extend;
L.bind = L.Util.bind;
L.stamp = L.Util.stamp;
L.setOptions = L.Util.setOptions;


/*
 * L.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

L.Class = function () {};

L.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks) {
			this.callInitHooks();
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;

	var proto = new F();
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		L.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = L.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	L.extend(proto, props);

	proto._initHooks = [];

	var parent = this;
	// jshint camelcase: false
	NewClass.__super__ = parent.prototype;

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parent.prototype.callInitHooks) {
			parent.prototype.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// method for adding properties to prototype
L.Class.include = function (props) {
	L.extend(this.prototype, props);
};

// merge new default options to the Class
L.Class.mergeOptions = function (options) {
	L.extend(this.prototype.options, options);
};

// add a constructor hook
L.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};


/*
 * L.Mixin.Events is used to add custom events functionality to Leaflet classes.
 */

var eventsKey = '_leaflet_events';

L.Mixin = {};

L.Mixin.Events = {

	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])

		// types can be a map of types/handlers
		if (L.Util.invokeEach(types, this.addEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey] = this[eventsKey] || {},
		    contextId = context && context !== this && L.stamp(context),
		    i, len, event, type, indexKey, indexLenKey, typeIndex;

		// types can be a string of space-separated words
		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			event = {
				action: fn,
				context: context || this
			};
			type = types[i];

			if (contextId) {
				// store listeners of a particular context in a separate hash (if it has an id)
				// gives a major performance boost when removing thousands of map layers

				indexKey = type + '_idx';
				indexLenKey = indexKey + '_len';

				typeIndex = events[indexKey] = events[indexKey] || {};

				if (!typeIndex[contextId]) {
					typeIndex[contextId] = [];

					// keep track of the number of keys in the index to quickly check if it's empty
					events[indexLenKey] = (events[indexLenKey] || 0) + 1;
				}

				typeIndex[contextId].push(event);


			} else {
				events[type] = events[type] || [];
				events[type].push(event);
			}
		}

		return this;
	},

	hasEventListeners: function (type) { // (String) -> Boolean
		var events = this[eventsKey];
		return !!events && ((type in events && events[type].length > 0) ||
		                    (type + '_idx' in events && events[type + '_idx_len'] > 0));
	},

	removeEventListener: function (types, fn, context) { // ([String, Function, Object]) or (Object[, Object])

		if (!this[eventsKey]) {
			return this;
		}

		if (!types) {
			return this.clearAllEventListeners();
		}

		if (L.Util.invokeEach(types, this.removeEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey],
		    contextId = context && context !== this && L.stamp(context),
		    i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;

		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			type = types[i];
			indexKey = type + '_idx';
			indexLenKey = indexKey + '_len';

			typeIndex = events[indexKey];

			if (!fn) {
				// clear all listeners for a type if function isn't specified
				delete events[type];
				delete events[indexKey];
				delete events[indexLenKey];

			} else {
				listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];

				if (listeners) {
					for (j = listeners.length - 1; j >= 0; j--) {
						if ((listeners[j].action === fn) && (!context || (listeners[j].context === context))) {
							removed = listeners.splice(j, 1);
							// set the old action to a no-op, because it is possible
							// that the listener is being iterated over as part of a dispatch
							removed[0].action = L.Util.falseFn;
						}
					}

					if (context && typeIndex && (listeners.length === 0)) {
						delete typeIndex[contextId];
						events[indexLenKey]--;
					}
				}
			}
		}

		return this;
	},

	clearAllEventListeners: function () {
		delete this[eventsKey];
		return this;
	},

	fireEvent: function (type, data) { // (String[, Object])
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = L.Util.extend({}, data, { type: type, target: this });

		var events = this[eventsKey],
		    listeners, i, len, typeIndex, contextId;

		if (events[type]) {
			// make sure adding/removing listeners inside other listeners won't cause infinite loop
			listeners = events[type].slice();

			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].action.call(listeners[i].context, event);
			}
		}

		// fire event for the context-indexed listeners as well
		typeIndex = events[type + '_idx'];

		for (contextId in typeIndex) {
			listeners = typeIndex[contextId].slice();

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].action.call(listeners[i].context, event);
				}
			}
		}

		return this;
	},

	addOneTimeEventListener: function (types, fn, context) {

		if (L.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) { return this; }

		var handler = L.bind(function () {
			this
			    .removeEventListener(types, fn, context)
			    .removeEventListener(types, handler, context);
		}, this);

		return this
		    .addEventListener(types, fn, context)
		    .addEventListener(types, handler, context);
	}
};

L.Mixin.Events.on = L.Mixin.Events.addEventListener;
L.Mixin.Events.off = L.Mixin.Events.removeEventListener;
L.Mixin.Events.once = L.Mixin.Events.addOneTimeEventListener;
L.Mixin.Events.fire = L.Mixin.Events.fireEvent;


/*
 * L.Browser handles different browser and feature detections for internal Leaflet use.
 */

(function () {

	var ie = 'ActiveXObject' in window,
		ielt9 = ie && !document.addEventListener,

	    // terrible browser detection to work around Safari / iOS / Android browser bugs
	    ua = navigator.userAgent.toLowerCase(),
	    webkit = ua.indexOf('webkit') !== -1,
	    chrome = ua.indexOf('chrome') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android = ua.indexOf('android') !== -1,
	    android23 = ua.search('android [23]') !== -1,
		gecko = ua.indexOf('gecko') !== -1,

	    mobile = typeof orientation !== undefined + '',
	    msPointer = window.navigator && window.navigator.msPointerEnabled &&
	              window.navigator.msMaxTouchPoints && !window.PointerEvent,
		pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
				  msPointer,
	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
	              window.matchMedia('(min-resolution:144dpi)').matches),

	    doc = document.documentElement,
	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera3d = 'OTransition' in doc.style,
	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


	// PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
	// https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

	var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

		var startName = 'ontouchstart';

		// IE10+ (We simulate these into touch* events in L.DomEvent and L.DomEvent.Pointer) or WebKit, etc.
		if (pointer || (startName in doc)) {
			return true;
		}

		// Firefox/Gecko
		var div = document.createElement('div'),
		    supported = false;

		if (!div.setAttribute) {
			return false;
		}
		div.setAttribute(startName, 'return;');

		if (typeof div[startName] === 'function') {
			supported = true;
		}

		div.removeAttribute(startName);
		div = null;

		return supported;
	}());


	L.Browser = {
		ie: ie,
		ielt9: ielt9,
		webkit: webkit,
		gecko: gecko && !webkit && !window.opera && !ie,

		android: android,
		android23: android23,

		chrome: chrome,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera3d: opera3d,
		any3d: any3d,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,

		touch: touch,
		msPointer: msPointer,
		pointer: pointer,

		retina: retina
	};

}());


/*
 * L.Point represents a point with x and y coordinates.
 */

L.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

L.Point.prototype = {

	clone: function () {
		return new L.Point(this.x, this.y);
	},

	// non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(L.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	subtract: function (point) {
		return this.clone()._subtract(L.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	distanceTo: function (point) {
		point = L.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	equals: function (point) {
		point = L.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	contains: function (point) {
		point = L.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	toString: function () {
		return 'Point(' +
		        L.Util.formatNum(this.x) + ', ' +
		        L.Util.formatNum(this.y) + ')';
	}
};

L.point = function (x, y, round) {
	if (x instanceof L.Point) {
		return x;
	}
	if (L.Util.isArray(x)) {
		return new L.Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new L.Point(x, y, round);
};


/*
 * L.Bounds represents a rectangular area on the screen in pixel coordinates.
 */

L.Bounds = function (a, b) { //(Point, Point) or Point[]
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

L.Bounds.prototype = {
	// extend the bounds to contain the given point
	extend: function (point) { // (Point)
		point = L.point(point);

		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	getCenter: function (round) { // (Boolean) -> Point
		return new L.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	getBottomLeft: function () { // -> Point
		return new L.Point(this.min.x, this.max.y);
	},

	getTopRight: function () { // -> Point
		return new L.Point(this.max.x, this.min.y);
	},

	getSize: function () {
		return this.max.subtract(this.min);
	},

	contains: function (obj) { // (Bounds) or (Point) -> Boolean
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof L.Point) {
			obj = L.point(obj);
		} else {
			obj = L.bounds(obj);
		}

		if (obj instanceof L.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};

L.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
	if (!a || a instanceof L.Bounds) {
		return a;
	}
	return new L.Bounds(a, b);
};


/*
 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};


/*
 * L.DomUtil contains various utility functions for working with DOM.
 */

L.DomUtil = {
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},

	getStyle: function (el, style) {

		var value = el.style[style];

		if (!value && el.currentStyle) {
			value = el.currentStyle[style];
		}

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	getViewportOffset: function (element) {

		var top = 0,
		    left = 0,
		    el = element,
		    docBody = document.body,
		    docEl = document.documentElement,
		    pos;

		do {
			top  += el.offsetTop  || 0;
			left += el.offsetLeft || 0;

			//add borders
			top += parseInt(L.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
			left += parseInt(L.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

			pos = L.DomUtil.getStyle(el, 'position');

			if (el.offsetParent === docBody && pos === 'absolute') { break; }

			if (pos === 'fixed') {
				top  += docBody.scrollTop  || docEl.scrollTop  || 0;
				left += docBody.scrollLeft || docEl.scrollLeft || 0;
				break;
			}

			if (pos === 'relative' && !el.offsetLeft) {
				var width = L.DomUtil.getStyle(el, 'width'),
				    maxWidth = L.DomUtil.getStyle(el, 'max-width'),
				    r = el.getBoundingClientRect();

				if (width !== 'none' || maxWidth !== 'none') {
					left += r.left + el.clientLeft;
				}

				//calculate full y offset since we're breaking out of the loop
				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);

				break;
			}

			el = el.offsetParent;

		} while (el);

		el = element;

		do {
			if (el === docBody) { break; }

			top  -= el.scrollTop  || 0;
			left -= el.scrollLeft || 0;

			el = el.parentNode;
		} while (el);

		return new L.Point(left, top);
	},

	documentIsLtr: function () {
		if (!L.DomUtil._docIsLtrCached) {
			L.DomUtil._docIsLtrCached = true;
			L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, 'direction') === 'ltr';
		}
		return L.DomUtil._docIsLtr;
	},

	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = L.DomUtil._getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = L.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!L.DomUtil.hasClass(el, name)) {
			var className = L.DomUtil._getClass(el);
			L.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			L.DomUtil._setClass(el, L.Util.trim((' ' + L.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	_setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	_getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {

			var filter = false,
			    filterName = 'DXImageTransform.Microsoft.Alpha';

			// filters collection throws an error if we try to retrieve a filter that doesn't exist
			try {
				filter = el.filters.item(filterName);
			} catch (e) {
				// don't set opacity to 1 if we haven't already set an opacity,
				// it isn't needed and breaks transparent pngs.
				if (value === 1) { return; }
			}

			value = Math.round(value * 100);

			if (filter) {
				filter.Enabled = (value !== 100);
				filter.Opacity = value;
			} else {
				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
			}
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	getTranslateString: function (point) {
		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
		// (same speed either way), Opera 12 doesn't support translate3d

		var is3d = L.Browser.webkit3d,
		    open = 'translate' + (is3d ? '3d' : '') + '(',
		    close = (is3d ? ',0' : '') + ')';

		return open + point.x + 'px,' + point.y + 'px' + close;
	},

	getScaleString: function (scale, origin) {

		var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
		    scaleStr = ' scale(' + scale + ') ';

		return preTranslateStr + scaleStr;
	},

	setPosition: function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])

		// jshint camelcase: false
		el._leaflet_pos = point;

		if (!disable3D && L.Browser.any3d) {
			el.style[L.DomUtil.TRANSFORM] =  L.DomUtil.getTranslateString(point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		// jshint camelcase: false
		return el._leaflet_pos;
	}
};


// prefix style property names

L.DomUtil.TRANSFORM = L.DomUtil.testProp(
        ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

// webkitTransition comes first because some browser versions that drop vendor prefix don't do
// the same for the transitionend event, in particular the Android 4.1 stock browser

L.DomUtil.TRANSITION = L.DomUtil.testProp(
        ['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

L.DomUtil.TRANSITION_END =
        L.DomUtil.TRANSITION === 'webkitTransition' || L.DomUtil.TRANSITION === 'OTransition' ?
        L.DomUtil.TRANSITION + 'End' : 'transitionend';

(function () {
    if ('onselectstart' in document) {
        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);
            },

            enableTextSelection: function () {
                L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);
            }
        });
    } else {
        var userSelectProperty = L.DomUtil.testProp(
            ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                if (userSelectProperty) {
                    var style = document.documentElement.style;
                    this._userSelect = style[userSelectProperty];
                    style[userSelectProperty] = 'none';
                }
            },

            enableTextSelection: function () {
                if (userSelectProperty) {
                    document.documentElement.style[userSelectProperty] = this._userSelect;
                    delete this._userSelect;
                }
            }
        });
    }

	L.extend(L.DomUtil, {
		disableImageDrag: function () {
			L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);
		},

		enableImageDrag: function () {
			L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);
		}
	});
})();


/*
 * L.LatLng represents a geographical point with latitude and longitude coordinates.
 */

L.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
	lat = parseFloat(lat);
	lng = parseFloat(lng);

	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	this.lat = lat;
	this.lng = lng;

	if (alt !== undefined) {
		this.alt = parseFloat(alt);
	}
};

L.extend(L.LatLng, {
	DEG_TO_RAD: Math.PI / 180,
	RAD_TO_DEG: 180 / Math.PI,
	MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check
});

L.LatLng.prototype = {
	equals: function (obj) { // (LatLng) -> Boolean
		if (!obj) { return false; }

		obj = L.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= L.LatLng.MAX_MARGIN;
	},

	toString: function (precision) { // (Number) -> String
		return 'LatLng(' +
		        L.Util.formatNum(this.lat, precision) + ', ' +
		        L.Util.formatNum(this.lng, precision) + ')';
	},

	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
	// TODO move to projection code, LatLng shouldn't know about Earth
	distanceTo: function (other) { // (LatLng) -> Number
		other = L.latLng(other);

		var R = 6378137, // earth radius in meters
		    d2r = L.LatLng.DEG_TO_RAD,
		    dLat = (other.lat - this.lat) * d2r,
		    dLon = (other.lng - this.lng) * d2r,
		    lat1 = this.lat * d2r,
		    lat2 = other.lat * d2r,
		    sin1 = Math.sin(dLat / 2),
		    sin2 = Math.sin(dLon / 2);

		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	},

	wrap: function (a, b) { // (Number, Number) -> LatLng
		var lng = this.lng;

		a = a || -180;
		b = b ||  180;

		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

		return new L.LatLng(this.lat, lng);
	}
};

L.latLng = function (a, b) { // (LatLng) or ([Number, Number]) or (Number, Number)
	if (a instanceof L.LatLng) {
		return a;
	}
	if (L.Util.isArray(a)) {
		if (typeof a[0] === 'number' || typeof a[0] === 'string') {
			return new L.LatLng(a[0], a[1], a[2]);
		} else {
			return null;
		}
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);
	}
	if (b === undefined) {
		return null;
	}
	return new L.LatLng(a, b);
};



/*
 * L.LatLngBounds represents a rectangular area on the map in geographical coordinates.
 */

L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

L.LatLngBounds.prototype = {
	// extend the bounds to contain the given point or bounds
	extend: function (obj) { // (LatLng) or (LatLngBounds)
		if (!obj) { return this; }

		var latLng = L.latLng(obj);
		if (latLng !== null) {
			obj = latLng;
		} else {
			obj = L.latLngBounds(obj);
		}

		if (obj instanceof L.LatLng) {
			if (!this._southWest && !this._northEast) {
				this._southWest = new L.LatLng(obj.lat, obj.lng);
				this._northEast = new L.LatLng(obj.lat, obj.lng);
			} else {
				this._southWest.lat = Math.min(obj.lat, this._southWest.lat);
				this._southWest.lng = Math.min(obj.lng, this._southWest.lng);

				this._northEast.lat = Math.max(obj.lat, this._northEast.lat);
				this._northEast.lng = Math.max(obj.lng, this._northEast.lng);
			}
		} else if (obj instanceof L.LatLngBounds) {
			this.extend(obj._southWest);
			this.extend(obj._northEast);
		}
		return this;
	},

	// extend the bounds by a percentage
	pad: function (bufferRatio) { // (Number) -> LatLngBounds
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new L.LatLngBounds(
		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	getCenter: function () { // -> LatLng
		return new L.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	getSouthWest: function () {
		return this._southWest;
	},

	getNorthEast: function () {
		return this._northEast;
	},

	getNorthWest: function () {
		return new L.LatLng(this.getNorth(), this.getWest());
	},

	getSouthEast: function () {
		return new L.LatLng(this.getSouth(), this.getEast());
	},

	getWest: function () {
		return this._southWest.lng;
	},

	getSouth: function () {
		return this._southWest.lat;
	},

	getEast: function () {
		return this._northEast.lng;
	},

	getNorth: function () {
		return this._northEast.lat;
	},

	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {
			obj = L.latLng(obj);
		} else {
			obj = L.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	intersects: function (bounds) { // (LatLngBounds)
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	equals: function (bounds) { // (LatLngBounds)
		if (!bounds) { return false; }

		bounds = L.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

//TODO International date line?

L.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)
	if (!a || a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
};


/*
 * L.Projection contains various geographical projections used by CRS classes.
 */

L.Projection = {};


/*
 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.
 */

L.Projection.SphericalMercator = {
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    x = latlng.lng * d,
		    y = lat * d;

		y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    lng = point.x * d,
		    lat = (2 * Math.atan(Math.exp(point.y)) - (Math.PI / 2)) * d;

		return new L.LatLng(lat, lng);
	}
};


/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

L.Projection.LonLat = {
	project: function (latlng) {
		return new L.Point(latlng.lng, latlng.lat);
	},

	unproject: function (point) {
		return new L.LatLng(point.y, point.x);
	}
};


/*
 * L.CRS is a base object for all defined CRS (Coordinate Reference Systems) in Leaflet.
 */

L.CRS = {
	latLngToPoint: function (latlng, zoom) { // (LatLng, Number) -> Point
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	pointToLatLng: function (point, zoom) { // (Point, Number[, Boolean]) -> LatLng
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	project: function (latlng) {
		return this.projection.project(latlng);
	},

	scale: function (zoom) {
		return 256 * Math.pow(2, zoom);
	},

	getSize: function (zoom) {
		var s = this.scale(zoom);
		return L.point(s, s);
	}
};


/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	}
});


/*
 * L.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping
 * and is used by Leaflet by default.
 */

L.CRS.EPSG3857 = L.extend({}, L.CRS, {
	code: 'EPSG:3857',

	projection: L.Projection.SphericalMercator,
	transformation: new L.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5),

	project: function (latlng) { // (LatLng) -> Point
		var projectedPoint = this.projection.project(latlng),
		    earthRadius = 6378137;
		return projectedPoint.multiplyBy(earthRadius);
	}
});

L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
	code: 'EPSG:900913'
});


/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.EPSG4326 = L.extend({}, L.CRS, {
	code: 'EPSG:4326',

	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1 / 360, 0.5, -1 / 360, 0.5)
});


/*
 * L.Map is the central class of the API - it is used to create a map.
 */

L.Map = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		crs: L.CRS.EPSG3857,

		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,
		trackResize: true,
		markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.setOptions(this, options);


		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = L.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];

		this._layers = {};
		this._zoomBoundLayers = {};
		this._tileLayersNum = 0;

		this.callInitHooks();

		this._addLayers(options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	setView: function (center, zoom) {
		zoom = zoom === undefined ? this.getZoom() : zoom;
		this._resetView(L.latLng(center), this._limitZoom(zoom));
		return this;
	},

	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = this._limitZoom(zoom);
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	zoomIn: function (delta, options) {
		return this.setZoom(this._zoom + (delta || 1), options);
	},

	zoomOut: function (delta, options) {
		return this.setZoom(this._zoom - (delta || 1), options);
	},

	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	fitBounds: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR)),
		    paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		zoom = options && options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;

		return this.setView(center, zoom, options);
	},

	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.PanAnimation.js
		this.fire('movestart');

		this._rawPanBy(L.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},

	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		this.options.maxBounds = bounds;

		if (!bounds) {
			return this.off('moveend', this._panInsideMaxBounds, this);
		}

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds, this);
	},

	panInsideBounds: function (bounds, options) {
		var center = this.getCenter(),
			newCenter = this._limitCenter(center, this._zoom, bounds);

		if (center.equals(newCenter)) { return this; }

		return this.panTo(newCenter, options);
	},

	addLayer: function (layer) {
		// TODO method is too big, refactor

		var id = L.stamp(layer);

		if (this._layers[id]) { return this; }

		this._layers[id] = layer;

		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)
		if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {
			this._zoomBoundLayers[id] = layer;
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor!!!
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum++;
			this._tileLayersToLoad++;
			layer.on('load', this._onTileLayerLoad, this);
		}

		if (this._loaded) {
			this._layerAdd(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
		}

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum--;
			this._tileLayersToLoad--;
			layer.off('load', this._onTileLayerLoad, this);
		}

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (L.stamp(layer) in this._layers);
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = L.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._initialCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	// TODO handler.addTo
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	remove: function () {
		if (this._loaded) {
			this.fire('unload');
		}

		this._initEvents('off');

		try {
			// throws error in IE6-8
			delete this._container._leaflet;
		} catch (e) {
			this._container._leaflet = undefined;
		}

		this._clearPanes();
		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		return this;
	},


	// public methods for getting map state

	getCenter: function () { // (Boolean) -> LatLng
		this._checkIfLoaded();

		if (this._initialCenter && !this._moved()) {
			return this._initialCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		return this.options.minZoom === undefined ?
			(this._layersMinZoom === undefined ? 0 : this._layersMinZoom) :
			this.options.minZoom;
	},

	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = L.latLngBounds(bounds);

		var zoom = this.getMinZoom() - (inside ? 1 : 0),
		    maxZoom = this.getMaxZoom(),
		    size = this.getSize(),

		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),

		    zoomNotFound = true,
		    boundsSize;

		padding = L.point(padding || [0, 0]);

		do {
			zoom++;
			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	getPixelBounds: function () {
		var topLeftPoint = this._getTopLeftPoint();
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._initialTopLeftPoint;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom) {
		var crs = this.options.crs;
		return crs.scale(toZoom) / crs.scale(this._zoom);
	},

	getScaleZoom: function (scale) {
		return this._zoom + (Math.log(scale) / Math.LN2);
	},


	// conversion methods

	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},

	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		var projectedPoint = L.point(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return L.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet) {
			throw new Error('Map container is already initialized.');
		}

		container._leaflet = true;
	},

	_initLayout: function () {
		var container = this._container;

		L.DomUtil.addClass(container, 'leaflet-container' +
			(L.Browser.touch ? ' leaflet-touch' : '') +
			(L.Browser.retina ? ' leaflet-retina' : '') +
			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(this.options.fadeAnimation ? ' leaflet-fade-anim' : ''));

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};

		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);

		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);
		panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);
		panes.shadowPane = this._createPane('leaflet-shadow-pane');
		panes.overlayPane = this._createPane('leaflet-overlay-pane');
		panes.markerPane = this._createPane('leaflet-marker-pane');
		panes.popupPane = this._createPane('leaflet-popup-pane');

		var zoomHide = ' leaflet-zoom-hide';

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, zoomHide);
			L.DomUtil.addClass(panes.shadowPane, zoomHide);
			L.DomUtil.addClass(panes.popupPane, zoomHide);
		}
	},

	_createPane: function (className, container) {
		return L.DomUtil.create('div', className, container || this._panes.objectsPane);
	},

	_clearPanes: function () {
		this._container.removeChild(this._mapPane);
	},

	_addLayers: function (layers) {
		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},


	// private methods that modify map state

	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {

		var zoomChanged = (this._zoom !== zoom);

		if (!afterZoomAnim) {
			this.fire('movestart');

			if (zoomChanged) {
				this.fire('zoomstart');
			}
		}

		this._zoom = zoom;
		this._initialCenter = center;

		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);

		if (!preserveMapOffset) {
			L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
		} else {
			this._initialTopLeftPoint._add(this._getMapPanePos());
		}

		this._tileLayersToLoad = this._tileLayersNum;

		var loading = !this._loaded;
		this._loaded = true;

		this.fire('viewreset', {hard: !preserveMapOffset});

		if (loading) {
			this.fire('load');
			this.eachLayer(this._layerAdd, this);
		}

		this.fire('move');

		if (zoomChanged || afterZoomAnim) {
			this.fire('zoomend');
		}

		this.fire('moveend', {hard: !preserveMapOffset});
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_updateZoomLevels: function () {
		var i,
			minZoom = Infinity,
			maxZoom = -Infinity,
			oldZoomSpan = this._getZoomSpan();

		for (i in this._zoomBoundLayers) {
			var layer = this._zoomBoundLayers[i];
			if (!isNaN(layer.options.minZoom)) {
				minZoom = Math.min(minZoom, layer.options.minZoom);
			}
			if (!isNaN(layer.options.maxZoom)) {
				maxZoom = Math.max(maxZoom, layer.options.maxZoom);
			}
		}

		if (i === undefined) { // we have no tilelayers
			this._layersMaxZoom = this._layersMinZoom = undefined;
		} else {
			this._layersMaxZoom = maxZoom;
			this._layersMinZoom = minZoom;
		}

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	},

	_panInsideMaxBounds: function () {
		this.panInsideBounds(this.options.maxBounds);
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// map events

	_initEvents: function (onOff) {
		if (!L.DomEvent) { return; }

		onOff = onOff || 'on';

		L.DomEvent[onOff](this._container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter',
		              'mouseleave', 'mousemove', 'contextmenu'],
		    i, len;

		for (i = 0, len = events.length; i < len; i++) {
			L.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			L.DomEvent[onOff](window, 'resize', this._onResize, this);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this, false, this._container);
	},

	_onMouseClick: function (e) {
		if (!this._loaded || (!e._simulated &&
		        ((this.dragging && this.dragging.moved()) ||
		         (this.boxZoom  && this.boxZoom.moved()))) ||
		            L.DomEvent._skipped(e)) { return; }

		this.fire('preclick');
		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this._loaded || L.DomEvent._skipped(e)) { return; }

		var type = e.type;

		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) { return; }

		if (type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}

		var containerPoint = this.mouseEventToContainerPoint(e),
		    layerPoint = this.containerPointToLayerPoint(containerPoint),
		    latlng = this.layerPointToLatLng(layerPoint);

		this.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});
	},

	_onTileLayerLoad: function () {
		this._tileLayersToLoad--;
		if (this._tileLayersNum && !this._tileLayersToLoad) {
			this.fire('tilelayersload');
		}
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, this);
		} else {
			this.on('load', callback, context);
		}
		return this;
	},

	_layerAdd: function (layer) {
		layer.onAdd(this);
		this.fire('layeradd', {layer: layer});
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function () {
		return this.getPixelOrigin().subtract(this._getMapPanePos());
	},

	_getNewTopLeftPoint: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		// TODO round on display, not calculation to increase precision?
		return this.project(center, zoom)._subtract(viewHalf)._round();
	},

	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
		return this.project(latlng, newZoom)._subtract(topLeft);
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),

		    dx = this._rebound(nwOffset.x, -seOffset.x),
		    dy = this._rebound(nwOffset.y, -seOffset.y);

		return new L.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom();

		return Math.max(min, Math.min(max, zoom));
	}
});

L.map = function (id, options) {
	return new L.Map(id, options);
};


/*
 * Mercator projection that takes into account that the Earth is not a perfect sphere.
 * Less popular than spherical mercator; used by projections like EPSG:3395.
 */

L.Projection.Mercator = {
	MAX_LATITUDE: 85.0840591556,

	R_MINOR: 6356752.314245179,
	R_MAJOR: 6378137,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    x = latlng.lng * d * r,
		    y = lat * d,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1.0 - tmp * tmp),
		    con = eccent * Math.sin(y);

		con = Math.pow((1 - con) / (1 + con), eccent * 0.5);

		var ts = Math.tan(0.5 * ((Math.PI * 0.5) - y)) / con;
		y = -r * Math.log(ts);

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    lng = point.x * d / r,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1 - (tmp * tmp)),
		    ts = Math.exp(- point.y / r),
		    phi = (Math.PI / 2) - 2 * Math.atan(ts),
		    numIter = 15,
		    tol = 1e-7,
		    i = numIter,
		    dphi = 0.1,
		    con;

		while ((Math.abs(dphi) > tol) && (--i > 0)) {
			con = eccent * Math.sin(phi);
			dphi = (Math.PI / 2) - 2 * Math.atan(ts *
			            Math.pow((1.0 - con) / (1.0 + con), 0.5 * eccent)) - phi;
			phi += dphi;
		}

		return new L.LatLng(phi * d, lng);
	}
};



L.CRS.EPSG3395 = L.extend({}, L.CRS, {
	code: 'EPSG:3395',

	projection: L.Projection.Mercator,

	transformation: (function () {
		var m = L.Projection.Mercator,
		    r = m.R_MAJOR,
		    scale = 0.5 / (Math.PI * r);

		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});


/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.TileLayer = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: L.Browser.mobile,
		updateWhenIdle: L.Browser.mobile
	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = L.latLngBounds(options.bounds);
		}

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		this._container.parentNode.removeChild(this._container);

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (L.Browser.ielt9) {
			for (i in tiles) {
				L.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			L.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_initContainer: function () {
		var tilePane = this._map._panes.tilePane;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-layer');

			this._updateZIndex();

			if (this._animated) {
				var className = 'leaflet-tile-container';

				this._bgBuffer = L.DomUtil.create('div', className, this._container);
				this._tileContainer = L.DomUtil.create('div', className, this._container);

			} else {
				this._tileContainer = this._container;
			}

			tilePane.appendChild(this._container);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_reset: function (e) {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = L.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new L.Point(i, j);

				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (!options.continuousWorld) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			L.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!L.Browser.android) {
			tile.onload = null;
			tile.src = L.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		return tilePoint.multiplyBy(tileSize).subtract(origin);
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (tilePoint) {
		return L.Util.template(this._url, L.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = L.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		if (L.Browser.ielt9 && this.options.opacity !== undefined) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(tilePoint);

		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			L.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== L.Util.emptyImageUrl) {
			L.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	}
});

L.tileLayer = function (url, options) {
	return new L.TileLayer(url, options);
};


/*
 * L.TileLayer.WMS is used for putting WMS tile layers on the map.
 */

L.TileLayer.WMS = L.TileLayer.extend({

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/jpeg',
		transparent: false
	},

	initialize: function (url, options) { // (String, Object)

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams),
		    tileSize = options.tileSize || this.options.tileSize;

		if (options.detectRetina && L.Browser.retina) {
			wmsParams.width = wmsParams.height = tileSize * 2;
		} else {
			wmsParams.width = wmsParams.height = tileSize;
		}

		for (var i in options) {
			// all keys that are not TileLayer options go to WMS params
			if (!this.options.hasOwnProperty(i) && i !== 'crs') {
				wmsParams[i] = options[i];
			}
		}

		this.wmsParams = wmsParams;

		L.setOptions(this, options);
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;

		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (tilePoint) { // (Point, Number) -> String

		var map = this._map,
		    tileSize = this.options.tileSize,

		    nwPoint = tilePoint.multiplyBy(tileSize),
		    sePoint = nwPoint.add([tileSize, tileSize]),

		    nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),
		    se = this._crs.project(map.unproject(sePoint, tilePoint.z)),
		    bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
		        [se.y, nw.x, nw.y, se.x].join(',') :
		        [nw.x, se.y, se.x, nw.y].join(','),

		    url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

		return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
	},

	setParams: function (params, noRedraw) {

		L.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});

L.tileLayer.wms = function (url, options) {
	return new L.TileLayer.WMS(url, options);
};


/*
 * L.TileLayer.Canvas is a class that you can use as a base for creating
 * dynamically drawn Canvas-based tile layers.
 */

L.TileLayer.Canvas = L.TileLayer.extend({
	options: {
		async: false
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}

		for (var i in this._tiles) {
			this._redrawTile(this._tiles[i]);
		}
		return this;
	},

	_redrawTile: function (tile) {
		this.drawTile(tile, tile._tilePoint, this._map._zoom);
	},

	_createTile: function () {
		var tile = L.DomUtil.create('canvas', 'leaflet-tile');
		tile.width = tile.height = this.options.tileSize;
		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	drawTile: function (/*tile, tilePoint*/) {
		// override with rendering code
	},

	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	}
});


L.tileLayer.canvas = function (options) {
	return new L.TileLayer.Canvas(options);
};


/*
 * L.ImageOverlay is used to overlay images over the map (to specific geographical bounds).
 */

L.ImageOverlay = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		opacity: 1
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._image) {
			this._initImage();
		}

		map._panes.overlayPane.appendChild(this._image);

		map.on('viewreset', this._reset, this);

		if (map.options.zoomAnimation && L.Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._reset();
	},

	onRemove: function (map) {
		map.getPanes().overlayPane.removeChild(this._image);

		map.off('viewreset', this._reset, this);

		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path
	bringToFront: function () {
		if (this._image) {
			this._map._panes.overlayPane.appendChild(this._image);
		}
		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.overlayPane;
		if (this._image) {
			pane.insertBefore(this._image, pane.firstChild);
		}
		return this;
	},

	setUrl: function (url) {
		this._url = url;
		this._image.src = this._url;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	_initImage: function () {
		this._image = L.DomUtil.create('img', 'leaflet-image-layer');

		if (this._map.options.zoomAnimation && L.Browser.any3d) {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		L.extend(this._image, {
			galleryimg: 'no',
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onImageLoad, this),
			src: this._url
		});
	},

	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

		image.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},

	_reset: function () {
		var image   = this._image,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);

		L.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_onImageLoad: function () {
		this.fire('load');
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

L.imageOverlay = function (url, bounds, options) {
	return new L.ImageOverlay(url, bounds, options);
};


/*
 * L.Icon is an image-based icon class that you can use with L.Marker for custom markers.
 */

L.Icon = L.Class.extend({
	options: {
		/*
		iconUrl: (String) (required)
		iconRetinaUrl: (String) (optional, used for retina devices if detected)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowRetinaUrl: (String) (optional, used for retina devices if detected)
		shadowSize: (Point)
		shadowAnchor: (Point)
		*/
		className: ''
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img;
		if (!oldIcon || oldIcon.tagName !== 'IMG') {
			img = this._createImg(src);
		} else {
			img = this._createImg(src, oldIcon);
		}
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options,
		    size = L.point(options[name + 'Size']),
		    anchor;

		if (name === 'shadow') {
			anchor = L.point(options.shadowAnchor || options.iconAnchor);
		} else {
			anchor = L.point(options.iconAnchor);
		}

		if (!anchor && size) {
			anchor = size.divideBy(2, true);
		}

		img.className = 'leaflet-marker-' + name + ' ' + options.className;

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		if (L.Browser.retina && this.options[name + 'RetinaUrl']) {
			return this.options[name + 'RetinaUrl'];
		}
		return this.options[name + 'Url'];
	}
});

L.icon = function (options) {
	return new L.Icon(options);
};


/*
 * L.Icon.Default is the blue marker icon used by default in Leaflet.
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (L.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = L.Icon.Default.imagePath;

		if (!path) {
			throw new Error('Couldn\'t autodetect L.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

L.Icon.Default.imagePath = (function () {
	var scripts = document.getElementsByTagName('script'),
	    leafletRe = /[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}());


/*
 * L.Marker is used to display clickable/draggable icons on the map.
 */

L.Marker = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		icon: new L.Icon.Default(),
		title: '',
		alt: '',
		clickable: true,
		draggable: false,
		keyboard: true,
		zIndexOffset: 0,
		opacity: 1,
		riseOnHover: false,
		riseOffset: 250
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	onAdd: function (map) {
		this._map = map;

		map.on('viewreset', this.update, this);

		this._initIcon();
		this.update();
		this.fire('add');

		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		if (this.dragging) {
			this.dragging.disable();
		}

		this._removeIcon();
		this._removeShadow();

		this.fire('remove');

		map.off({
			'viewreset': this.update,
			'zoomanim': this._animateZoom
		}, this);

		this._map = null;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);

		this.update();

		return this.fire('move', { latlng: this._latlng });
	},

	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		this.update();

		return this;
	},

	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup);
		}

		return this;
	},

	update: function () {
		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    map = this._map,
		    animation = (map.options.zoomAnimation && map.options.markerZoomAnimation),
		    classToAdd = animation ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide';

		var icon = options.icon.createIcon(this._icon),
			addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		this._initInteraction();

		if (options.riseOnHover) {
			L.DomEvent
				.on(icon, 'mouseover', this._bringToFront, this)
				.on(icon, 'mouseout', this._resetZIndex, this);
		}

		var newShadow = options.icon.createShadow(this._shadow),
			addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		var panes = this._map._panes;

		if (addIcon) {
			panes.markerPane.appendChild(this._icon);
		}

		if (newShadow && addShadow) {
			panes.shadowPane.appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			L.DomEvent
			    .off(this._icon, 'mouseover', this._bringToFront)
			    .off(this._icon, 'mouseout', this._resetZIndex);
		}

		this._map._panes.markerPane.removeChild(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			this._map._panes.shadowPane.removeChild(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.clickable) { return; }

		// TODO refactor into something shared with Map/Path/etc. to DRY it up

		var icon = this._icon,
		    events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.addClass(icon, 'leaflet-clickable');
		L.DomEvent.on(icon, 'click', this._onMouseClick, this);
		L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		}

		if (L.Handler.MarkerDrag) {
			this.dragging = new L.Handler.MarkerDrag(this);

			if (this.options.draggable) {
				this.dragging.enable();
			}
		}
	},

	_onMouseClick: function (e) {
		var wasDragged = this.dragging && this.dragging.moved();

		if (this.hasEventListeners(e.type) || wasDragged) {
			L.DomEvent.stopPropagation(e);
		}

		if (wasDragged) { return; }

		if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) { return; }

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});
	},

	_onKeyPress: function (e) {
		if (e.keyCode === 13) {
			this.fire('click', {
				originalEvent: e,
				latlng: this._latlng
			});
		}
	},

	_fireMouseEvent: function (e) {

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._icon, this.options.opacity);
		if (this._shadow) {
			L.DomUtil.setOpacity(this._shadow, this.options.opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	}
});

L.marker = function (latlng, options) {
	return new L.Marker(latlng, options);
};


/*
 * L.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based L.Icon)
 * to use with L.Marker.
 */

L.DivIcon = L.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		if (options.html !== false) {
			div.innerHTML = options.html;
		} else {
			div.innerHTML = '';
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
			        (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};


/*
 * L.Popup is used for displaying popups on the map.
 */

L.Map.mergeOptions({
	closePopupOnClick: true
});

L.Popup = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minWidth: 50,
		maxWidth: 300,
		// maxHeight: null,
		autoPan: true,
		closeButton: true,
		offset: [0, 7],
		autoPanPadding: [5, 5],
		// autoPanPaddingTopLeft: null,
		// autoPanPaddingBottomRight: null,
		keepInView: false,
		className: '',
		zoomAnimation: true
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
		this._animated = L.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initLayout();
		}

		var animFade = map.options.fadeAnimation;

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 0);
		}
		map._panes.popupPane.appendChild(this._container);

		map.on(this._getEvents(), this);

		this.update();

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 1);
		}

		this.fire('open');

		map.fire('popupopen', {popup: this});

		if (this._source) {
			this._source.fire('popupopen', {popup: this});
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onRemove: function (map) {
		map._panes.popupPane.removeChild(this._container);

		L.Util.falseFn(this._container.offsetWidth); // force reflow

		map.off(this._getEvents(), this);

		if (map.options.fadeAnimation) {
			L.DomUtil.setOpacity(this._container, 0);
		}

		this._map = null;

		this.fire('close');

		map.fire('popupclose', {popup: this});

		if (this._source) {
			this._source.fire('popupclose', {popup: this});
		}
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	getContent: function () {
		return this._content;
	},

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	_getEvents: function () {
		var events = {
			viewreset: this._updatePosition
		};

		if (this._animated) {
			events.zoomanim = this._zoomAnimation;
		}
		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +
			        (this._animated ? 'animated' : 'hide'),
			container = this._container = L.DomUtil.create('div', containerClass),
			closeButton;

		if (this.options.closeButton) {
			closeButton = this._closeButton =
			        L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';
			L.DomEvent.disableClickPropagation(closeButton);

			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper =
		        L.DomUtil.create('div', prefix + '-content-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);

		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);

		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateContent: function () {
		if (!this._content) { return; }

		if (typeof this._content === 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			while (this._contentNode.hasChildNodes()) {
				this._contentNode.removeChild(this._contentNode.firstChild);
			}
			this._contentNode.appendChild(this._content);
		}
		this.fire('contentupdate');
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    animated = this._animated,
		    offset = L.point(this.options.offset);

		if (animated) {
			L.DomUtil.setPosition(this._container, pos);
		}

		this._containerBottom = -offset.y - (animated ? 0 : pos.y);
		this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = this._containerBottom + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);

		L.DomUtil.setPosition(this._container, pos);
	},

	_adjustPan: function () {
		if (!this.options.autoPan) { return; }

		var map = this._map,
		    containerHeight = this._container.offsetHeight,
		    containerWidth = this._containerWidth,

		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

		if (this._animated) {
			layerPos._add(L.DomUtil.getPosition(this._container));
		}

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = L.point(this.options.autoPanPadding),
		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		L.DomEvent.stop(e);
	}
});

L.popup = function (options, source) {
	return new L.Popup(options, source);
};


L.Map.include({
	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])
		this.closePopup();

		if (!(popup instanceof L.Popup)) {
			var content = popup;

			popup = new L.Popup(options)
			    .setLatLng(latlng)
			    .setContent(content);
		}
		popup._isOpen = true;

		this._popup = popup;
		return this.addLayer(popup);
	},

	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
			popup._isOpen = false;
		}
		return this;
	}
});


/*
 * Popup extension to L.Marker, adding popup-related methods.
 */

L.Marker.include({
	openPopup: function () {
		if (this._popup && this._map && !this._map.hasLayer(this._popup)) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	togglePopup: function () {
		if (this._popup) {
			if (this._popup._isOpen) {
				this.closePopup();
			} else {
				this.openPopup();
			}
		}
		return this;
	},

	bindPopup: function (content, options) {
		var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]);

		anchor = anchor.add(L.Popup.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = L.extend({offset: anchor}, options);

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this.togglePopup, this)
			    .on('remove', this.closePopup, this)
			    .on('move', this._movePopup, this);
			this._popupHandlersAdded = true;
		}

		if (content instanceof L.Popup) {
			L.setOptions(content, options);
			this._popup = content;
		} else {
			this._popup = new L.Popup(options, this)
				.setContent(content);
		}

		return this;
	},

	setPopupContent: function (content) {
		if (this._popup) {
			this._popup.setContent(content);
		}
		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this.togglePopup, this)
			    .off('remove', this.closePopup, this)
			    .off('move', this._movePopup, this);
			this._popupHandlersAdded = false;
		}
		return this;
	},

	getPopup: function () {
		return this._popup;
	},

	_movePopup: function (e) {
		this._popup.setLatLng(e.latlng);
	}
});


/*
 * L.LayerGroup is a class to combine several layers into one so that
 * you can manipulate the group (e.g. add/remove it) as one layer.
 */

L.LayerGroup = L.Class.extend({
	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	clearLayers: function () {
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		this._map = map;
		this.eachLayer(map.addLayer, map);
	},

	onRemove: function (map) {
		this.eachLayer(map.removeLayer, map);
		this._map = null;
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	getLayer: function (id) {
		return this._layers[id];
	},

	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	getLayerId: function (layer) {
		return L.stamp(layer);
	}
});

L.layerGroup = function (layers) {
	return new L.LayerGroup(layers);
};


/*
 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and additional methods
 * shared between a group of interactive layers (like vectors or markers).
 */

L.FeatureGroup = L.LayerGroup.extend({
	includes: L.Mixin.Events,

	statics: {
		EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose'
	},

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		if ('on' in layer) {
			layer.on(L.FeatureGroup.EVENTS, this._propagateEvent, this);
		}

		L.LayerGroup.prototype.addLayer.call(this, layer);

		if (this._popupContent && layer.bindPopup) {
			layer.bindPopup(this._popupContent, this._popupOptions);
		}

		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.off(L.FeatureGroup.EVENTS, this._propagateEvent, this);

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		if (this._popupContent) {
			this.invoke('unbindPopup');
		}

		return this.fire('layerremove', {layer: layer});
	},

	bindPopup: function (content, options) {
		this._popupContent = content;
		this._popupOptions = options;
		return this.invoke('bindPopup', content, options);
	},

	openPopup: function (latlng) {
		// open popup on the first layer
		for (var id in this._layers) {
			this._layers[id].openPopup(latlng);
			break;
		}
		return this;
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new L.LatLngBounds();

		this.eachLayer(function (layer) {
			bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());
		});

		return bounds;
	},

	_propagateEvent: function (e) {
		e = L.extend({
			layer: e.target,
			target: this
		}, e);
		this.fire(e.type, e);
	}
});

L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};


/*
 * L.Path is a base class for rendering vector paths on a map. Inherited by Polyline, Circle, etc.
 */

L.Path = L.Class.extend({
	includes: [L.Mixin.Events],

	statics: {
		// how much to extend the clip area around the map view
		// (relative to its size, e.g. 0.5 is half the screen in each direction)
		// set it so that SVG element doesn't exceed 1280px (vectors flicker on dragend if it is)
		CLIP_PADDING: (function () {
			var max = L.Browser.mobile ? 1280 : 2000,
			    target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;
			return Math.max(0, Math.min(0.5, target));
		})()
	},

	options: {
		stroke: true,
		color: '#0033ff',
		dashArray: null,
		lineCap: null,
		lineJoin: null,
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2,

		clickable: true
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initElements();
			this._initEvents();
		}

		this.projectLatlngs();
		this._updatePath();

		if (this._container) {
			this._map._pathRoot.appendChild(this._container);
		}

		this.fire('add');

		map.on({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		map._pathRoot.removeChild(this._container);

		// Need to fire remove event before we set _map to null as the event hooks might need the object
		this.fire('remove');
		this._map = null;

		if (L.Browser.vml) {
			this._container = null;
			this._stroke = null;
			this._fill = null;
		}

		map.off({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	projectLatlngs: function () {
		// do all projection stuff here
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._container) {
			this._updateStyle();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._updatePath();
		}
		return this;
	}
});

L.Map.include({
	_updatePathViewport: function () {
		var p = L.Path.CLIP_PADDING,
		    size = this.getSize(),
		    panePos = L.DomUtil.getPosition(this._mapPane),
		    min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()),
		    max = min.add(size.multiplyBy(1 + p * 2)._round());

		this._pathViewport = new L.Bounds(min, max);
	}
});


/*
 * Extends L.Path with SVG-specific rendering code.
 */

L.Path.SVG_NS = 'http://www.w3.org/2000/svg';

L.Browser.svg = !!(document.createElementNS && document.createElementNS(L.Path.SVG_NS, 'svg').createSVGRect);

L.Path = L.Path.extend({
	statics: {
		SVG: L.Browser.svg
	},

	bringToFront: function () {
		var root = this._map._pathRoot,
		    path = this._container;

		if (path && root.lastChild !== path) {
			root.appendChild(path);
		}
		return this;
	},

	bringToBack: function () {
		var root = this._map._pathRoot,
		    path = this._container,
		    first = root.firstChild;

		if (path && first !== path) {
			root.insertBefore(path, first);
		}
		return this;
	},

	getPathString: function () {
		// form path string here
	},

	_createElement: function (name) {
		return document.createElementNS(L.Path.SVG_NS, name);
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._initPath();
		this._initStyle();
	},

	_initPath: function () {
		this._container = this._createElement('g');

		this._path = this._createElement('path');

		if (this.options.className) {
			L.DomUtil.addClass(this._path, this.options.className);
		}

		this._container.appendChild(this._path);
	},

	_initStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke-linejoin', 'round');
			this._path.setAttribute('stroke-linecap', 'round');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill-rule', 'evenodd');
		}
		if (this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', this.options.pointerEvents);
		}
		if (!this.options.clickable && !this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', 'none');
		}
		this._updateStyle();
	},

	_updateStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke', this.options.color);
			this._path.setAttribute('stroke-opacity', this.options.opacity);
			this._path.setAttribute('stroke-width', this.options.weight);
			if (this.options.dashArray) {
				this._path.setAttribute('stroke-dasharray', this.options.dashArray);
			} else {
				this._path.removeAttribute('stroke-dasharray');
			}
			if (this.options.lineCap) {
				this._path.setAttribute('stroke-linecap', this.options.lineCap);
			}
			if (this.options.lineJoin) {
				this._path.setAttribute('stroke-linejoin', this.options.lineJoin);
			}
		} else {
			this._path.setAttribute('stroke', 'none');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill', this.options.fillColor || this.options.color);
			this._path.setAttribute('fill-opacity', this.options.fillOpacity);
		} else {
			this._path.setAttribute('fill', 'none');
		}
	},

	_updatePath: function () {
		var str = this.getPathString();
		if (!str) {
			// fix webkit empty string parsing bug
			str = 'M0 0';
		}
		this._path.setAttribute('d', str);
	},

	// TODO remove duplication with L.Map
	_initEvents: function () {
		if (this.options.clickable) {
			if (L.Browser.svg || !L.Browser.vml) {
				L.DomUtil.addClass(this._path, 'leaflet-clickable');
			}

			L.DomEvent.on(this._container, 'click', this._onMouseClick, this);

			var events = ['dblclick', 'mousedown', 'mouseover',
			              'mouseout', 'mousemove', 'contextmenu'];
			for (var i = 0; i < events.length; i++) {
				L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
			}
		}
	},

	_onMouseClick: function (e) {
		if (this._map.dragging && this._map.dragging.moved()) { return; }

		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this.hasEventListeners(e.type)) { return; }

		var map = this._map,
		    containerPoint = map.mouseEventToContainerPoint(e),
		    layerPoint = map.containerPointToLayerPoint(containerPoint),
		    latlng = map.layerPointToLatLng(layerPoint);

		this.fire(e.type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});

		if (e.type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousemove') {
			L.DomEvent.stopPropagation(e);
		}
	}
});

L.Map.include({
	_initPathRoot: function () {
		if (!this._pathRoot) {
			this._pathRoot = L.Path.prototype._createElement('svg');
			this._panes.overlayPane.appendChild(this._pathRoot);

			if (this.options.zoomAnimation && L.Browser.any3d) {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-animated');

				this.on({
					'zoomanim': this._animatePathZoom,
					'zoomend': this._endPathZoom
				});
			} else {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-hide');
			}

			this.on('moveend', this._updateSvgViewport);
			this._updateSvgViewport();
		}
	},

	_animatePathZoom: function (e) {
		var scale = this.getZoomScale(e.zoom),
		    offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);

		this._pathRoot.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';

		this._pathZooming = true;
	},

	_endPathZoom: function () {
		this._pathZooming = false;
	},

	_updateSvgViewport: function () {

		if (this._pathZooming) {
			// Do not update SVGs while a zoom animation is going on otherwise the animation will break.
			// When the zoom animation ends we will be updated again anyway
			// This fixes the case where you do a momentum move and zoom while the move is still ongoing.
			return;
		}

		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    max = vp.max,
		    width = max.x - min.x,
		    height = max.y - min.y,
		    root = this._pathRoot,
		    pane = this._panes.overlayPane;

		// Hack to make flicker on drag end on mobile webkit less irritating
		if (L.Browser.mobileWebkit) {
			pane.removeChild(root);
		}

		L.DomUtil.setPosition(root, min);
		root.setAttribute('width', width);
		root.setAttribute('height', height);
		root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));

		if (L.Browser.mobileWebkit) {
			pane.appendChild(root);
		}
	}
});


/*
 * Popup extension to L.Path (polylines, polygons, circles), adding popup-related methods.
 */

L.Path.include({

	bindPopup: function (content, options) {

		if (content instanceof L.Popup) {
			this._popup = content;
		} else {
			if (!this._popup || options) {
				this._popup = new L.Popup(options, this);
			}
			this._popup.setContent(content);
		}

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this._openPopup, this)
			    .on('remove', this.closePopup, this);

			this._popupHandlersAdded = true;
		}

		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this._openPopup)
			    .off('remove', this.closePopup);

			this._popupHandlersAdded = false;
		}
		return this;
	},

	openPopup: function (latlng) {

		if (this._popup) {
			// open the popup from one of the path's points if not specified
			latlng = latlng || this._latlng ||
			         this._latlngs[Math.floor(this._latlngs.length / 2)];

			this._openPopup({latlng: latlng});
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	_openPopup: function (e) {
		this._popup.setLatLng(e.latlng);
		this._map.openPopup(this._popup);
	}
});


/*
 * Vector rendering for IE6-8 through VML.
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

L.Browser.vml = !L.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

L.Path = L.Browser.svg || !L.Browser.vml ? L.Path : L.Path.extend({
	statics: {
		VML: true,
		CLIP_PADDING: 0.02
	},

	_createElement: (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement(
				        '<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	}()),

	_initPath: function () {
		var container = this._container = this._createElement('shape');

		L.DomUtil.addClass(container, 'leaflet-vml-shape' +
			(this.options.className ? ' ' + this.options.className : ''));

		if (this.options.clickable) {
			L.DomUtil.addClass(container, 'leaflet-clickable');
		}

		container.coordsize = '1 1';

		this._path = this._createElement('path');
		container.appendChild(this._path);

		this._map._pathRoot.appendChild(container);
	},

	_initStyle: function () {
		this._updateStyle();
	},

	_updateStyle: function () {
		var stroke = this._stroke,
		    fill = this._fill,
		    options = this.options,
		    container = this._container;

		container.stroked = options.stroke;
		container.filled = options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = this._stroke = this._createElement('stroke');
				stroke.endcap = 'round';
				container.appendChild(stroke);
			}
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = L.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			if (options.lineCap) {
				stroke.endcap = options.lineCap.replace('butt', 'flat');
			}
			if (options.lineJoin) {
				stroke.joinstyle = options.lineJoin;
			}

		} else if (stroke) {
			container.removeChild(stroke);
			this._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = this._fill = this._createElement('fill');
				container.appendChild(fill);
			}
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			this._fill = null;
		}
	},

	_updatePath: function () {
		var style = this._container.style;

		style.display = 'none';
		this._path.v = this.getPathString() + ' '; // the space fixes IE empty path string bug
		style.display = '';
	}
});

L.Map.include(L.Browser.svg || !L.Browser.vml ? {} : {
	_initPathRoot: function () {
		if (this._pathRoot) { return; }

		var root = this._pathRoot = document.createElement('div');
		root.className = 'leaflet-vml-container';
		this._panes.overlayPane.appendChild(root);

		this.on('moveend', this._updatePathViewport);
		this._updatePathViewport();
	}
});


/*
 * Vector rendering for all browsers that support canvas.
 */

L.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

L.Path = (L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? L.Path : L.Path.extend({
	statics: {
		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value
		CANVAS: true,
		SVG: false
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._requestUpdate();
		}
		return this;
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._map) {
			this._updateStyle();
			this._requestUpdate();
		}
		return this;
	},

	onRemove: function (map) {
		map
		    .off('viewreset', this.projectLatlngs, this)
		    .off('moveend', this._updatePath, this);

		if (this.options.clickable) {
			this._map.off('click', this._onClick, this);
			this._map.off('mousemove', this._onMouseMove, this);
		}

		this._requestUpdate();
		
		this.fire('remove');
		this._map = null;
	},

	_requestUpdate: function () {
		if (this._map && !L.Path._updateRequest) {
			L.Path._updateRequest = L.Util.requestAnimFrame(this._fireMapMoveEnd, this._map);
		}
	},

	_fireMapMoveEnd: function () {
		L.Path._updateRequest = null;
		this.fire('moveend');
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._ctx = this._map._canvasCtx;
	},

	_updateStyle: function () {
		var options = this.options;

		if (options.stroke) {
			this._ctx.lineWidth = options.weight;
			this._ctx.strokeStyle = options.color;
		}
		if (options.fill) {
			this._ctx.fillStyle = options.fillColor || options.color;
		}
	},

	_drawPath: function () {
		var i, j, len, len2, point, drawMethod;

		this._ctx.beginPath();

		for (i = 0, len = this._parts.length; i < len; i++) {
			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
				point = this._parts[i][j];
				drawMethod = (j === 0 ? 'move' : 'line') + 'To';

				this._ctx[drawMethod](point.x, point.y);
			}
			// TODO refactor ugly hack
			if (this instanceof L.Polygon) {
				this._ctx.closePath();
			}
		}
	},

	_checkIfEmpty: function () {
		return !this._parts.length;
	},

	_updatePath: function () {
		if (this._checkIfEmpty()) { return; }

		var ctx = this._ctx,
		    options = this.options;

		this._drawPath();
		ctx.save();
		this._updateStyle();

		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fill();
		}

		if (options.stroke) {
			ctx.globalAlpha = options.opacity;
			ctx.stroke();
		}

		ctx.restore();

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_initEvents: function () {
		if (this.options.clickable) {
			// TODO dblclick
			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onClick, this);
		}
	},

	_onClick: function (e) {
		if (this._containsPoint(e.layerPoint)) {
			this.fire('click', e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) { return; }

		// TODO don't do on each move
		if (this._containsPoint(e.layerPoint)) {
			this._ctx.canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);

		} else if (this._mouseInside) {
			this._ctx.canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	}
});

L.Map.include((L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? {} : {
	_initPathRoot: function () {
		var root = this._pathRoot,
		    ctx;

		if (!root) {
			root = this._pathRoot = document.createElement('canvas');
			root.style.position = 'absolute';
			ctx = this._canvasCtx = root.getContext('2d');

			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			this._panes.overlayPane.appendChild(root);

			if (this.options.zoomAnimation) {
				this._pathRoot.className = 'leaflet-zoom-animated';
				this.on('zoomanim', this._animatePathZoom);
				this.on('zoomend', this._endPathZoom);
			}
			this.on('moveend', this._updateCanvasViewport);
			this._updateCanvasViewport();
		}
	},

	_updateCanvasViewport: function () {
		// don't redraw while zooming. See _updateSvgViewport for more details
		if (this._pathZooming) { return; }
		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    size = vp.max.subtract(min),
		    root = this._pathRoot;

		//TODO check if this works properly on mobile webkit
		L.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	}
});


/*
 * L.LineUtil contains different utility functions for line segments
 * and polylines (clipping, simplification, distances, etc.)
 */

/*jshint bitwise:false */ // allow bitwise operations for this file

L.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	simplify: function (/*Point[]*/ points, /*Number*/ tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// distance from a point to a segment between two points
	pointToSegmentDistance:  function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	closestPointOnSegment: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},

	// Cohen-Sutherland line clipping algorithm.
	// Used to avoid rendering parts of a polyline that are not currently visible.

	clipSegment: function (a, b, bounds, useLastCode) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			// if a,b is outside the clip window (trivial reject)
			} else if (codeA & codeB) {
				return false;
			// other cases
			} else {
				codeOut = codeA || codeB;
				p = this._getEdgeIntersection(a, b, codeOut, bounds);
				newCode = this._getBitCode(p, bounds);

				if (codeOut === codeA) {
					a = p;
					codeA = newCode;
				} else {
					b = p;
					codeB = newCode;
				}
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max;

		if (code & 8) { // top
			return new L.Point(a.x + dx * (max.y - a.y) / dy, max.y);
		} else if (code & 4) { // bottom
			return new L.Point(a.x + dx * (min.y - a.y) / dy, min.y);
		} else if (code & 2) { // right
			return new L.Point(max.x, a.y + dy * (max.x - a.x) / dx);
		} else if (code & 1) { // left
			return new L.Point(min.x, a.y + dy * (min.x - a.x) / dx);
		}
	},

	_getBitCode: function (/*Point*/ p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}
		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
	}
};


/*
 * L.Polyline is used to display polylines on a map.
 */

L.Polyline = L.Path.extend({
	initialize: function (latlngs, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlngs = this._convertLatLngs(latlngs);
	},

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0,
		noClip: false
	},

	projectLatlngs: function () {
		this._originalPoints = [];

		for (var i = 0, len = this._latlngs.length; i < len; i++) {
			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
		}
	},

	getPathString: function () {
		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
			str += this._getPathPartStr(this._parts[i]);
		}
		return str;
	},

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._latlngs = this._convertLatLngs(latlngs);
		return this.redraw();
	},

	addLatLng: function (latlng) {
		this._latlngs.push(L.latLng(latlng));
		return this.redraw();
	},

	spliceLatLngs: function () { // (Number index, Number howMany)
		var removed = [].splice.apply(this._latlngs, arguments);
		this._convertLatLngs(this._latlngs, true);
		this.redraw();
		return removed;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;

		for (var j = 0, jLen = parts.length; j < jLen; j++) {
			var points = parts[j];
			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];
				var sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = L.LineUtil._sqClosestPointOnSegment(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	getBounds: function () {
		return new L.LatLngBounds(this.getLatLngs());
	},

	_convertLatLngs: function (latlngs, overwrite) {
		var i, len, target = overwrite ? latlngs : [];

		for (i = 0, len = latlngs.length; i < len; i++) {
			if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
				return;
			}
			target[i] = L.latLng(latlngs[i]);
		}
		return target;
	},

	_initEvents: function () {
		L.Path.prototype._initEvents.call(this);
	},

	_getPathPartStr: function (points) {
		var round = L.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
		}
		return str;
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    len = points.length,
		    i, k, segment;

		if (this.options.noClip) {
			this._parts = [points];
			return;
		}

		this._parts = [];

		var parts = this._parts,
		    vp = this._map._pathViewport,
		    lu = L.LineUtil;

		for (i = 0, k = 0; i < len - 1; i++) {
			segment = lu.clipSegment(points[i], points[i + 1], vp, i);
			if (!segment) {
				continue;
			}

			parts[k] = parts[k] || [];
			parts[k].push(segment[0]);

			// if segment goes out of screen, or it's the last one, it's the end of the line part
			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {
				parts[k].push(segment[1]);
				k++;
			}
		}
	},

	// simplify each clipped part of the polyline
	_simplifyPoints: function () {
		var parts = this._parts,
		    lu = L.LineUtil;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = lu.simplify(parts[i], this.options.smoothFactor);
		}
	},

	_updatePath: function () {
		if (!this._map) { return; }

		this._clipPoints();
		this._simplifyPoints();

		L.Path.prototype._updatePath.call(this);
	}
});

L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};


/*
 * L.PolyUtil contains utility functions for polygons (clipping, etc.).
 */

/*jshint bitwise:false */ // allow bitwise operations here

L.PolyUtil = {};

/*
 * Sutherland-Hodgeman polygon clipping algorithm.
 * Used to avoid rendering parts of a polygon that are not currently visible.
 */
L.PolyUtil.clipPolygon = function (points, bounds) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = L.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};


/*
 * L.Polygon is used to display polygons on a map.
 */

L.Polygon = L.Polyline.extend({
	options: {
		fill: true
	},

	initialize: function (latlngs, options) {
		L.Polyline.prototype.initialize.call(this, latlngs, options);
		this._initWithHoles(latlngs);
	},

	_initWithHoles: function (latlngs) {
		var i, len, hole;
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._latlngs = this._convertLatLngs(latlngs[0]);
			this._holes = latlngs.slice(1);

			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
				if (hole[0].equals(hole[hole.length - 1])) {
					hole.pop();
				}
			}
		}

		// filter out last point if its equal to the first one
		latlngs = this._latlngs;

		if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {
			latlngs.pop();
		}
	},

	projectLatlngs: function () {
		L.Polyline.prototype.projectLatlngs.call(this);

		// project polygon holes points
		// TODO move this logic to Polyline to get rid of duplication
		this._holePoints = [];

		if (!this._holes) { return; }

		var i, j, len, len2;

		for (i = 0, len = this._holes.length; i < len; i++) {
			this._holePoints[i] = [];

			for (j = 0, len2 = this._holes[i].length; j < len2; j++) {
				this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
			}
		}
	},

	setLatLngs: function (latlngs) {
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._initWithHoles(latlngs);
			return this.redraw();
		} else {
			return L.Polyline.prototype.setLatLngs.call(this, latlngs);
		}
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    newParts = [];

		this._parts = [points].concat(this._holePoints);

		if (this.options.noClip) { return; }

		for (var i = 0, len = this._parts.length; i < len; i++) {
			var clipped = L.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);
			if (clipped.length) {
				newParts.push(clipped);
			}
		}

		this._parts = newParts;
	},

	_getPathPartStr: function (points) {
		var str = L.Polyline.prototype._getPathPartStr.call(this, points);
		return str + (L.Browser.svg ? 'z' : 'x');
	}
});

L.polygon = function (latlngs, options) {
	return new L.Polygon(latlngs, options);
};


/*
 * Contains L.MultiPolyline and L.MultiPolygon layers.
 */

(function () {
	function createMulti(Klass) {

		return L.FeatureGroup.extend({

			initialize: function (latlngs, options) {
				this._layers = {};
				this._options = options;
				this.setLatLngs(latlngs);
			},

			setLatLngs: function (latlngs) {
				var i = 0,
				    len = latlngs.length;

				this.eachLayer(function (layer) {
					if (i < len) {
						layer.setLatLngs(latlngs[i++]);
					} else {
						this.removeLayer(layer);
					}
				}, this);

				while (i < len) {
					this.addLayer(new Klass(latlngs[i++], this._options));
				}

				return this;
			},

			getLatLngs: function () {
				var latlngs = [];

				this.eachLayer(function (layer) {
					latlngs.push(layer.getLatLngs());
				});

				return latlngs;
			}
		});
	}

	L.MultiPolyline = createMulti(L.Polyline);
	L.MultiPolygon = createMulti(L.Polygon);

	L.multiPolyline = function (latlngs, options) {
		return new L.MultiPolyline(latlngs, options);
	};

	L.multiPolygon = function (latlngs, options) {
		return new L.MultiPolygon(latlngs, options);
	};
}());


/*
 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

L.Rectangle = L.Polygon.extend({
	initialize: function (latLngBounds, options) {
		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	setBounds: function (latLngBounds) {
		this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = L.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});

L.rectangle = function (latLngBounds, options) {
	return new L.Rectangle(latLngBounds, options);
};


/*
 * L.Circle is a circle overlay (with a certain radius in meters).
 */

L.Circle = L.Path.extend({
	initialize: function (latlng, radius, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlng = L.latLng(latlng);
		this._mRadius = radius;
	},

	options: {
		fill: true
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		return this.redraw();
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	projectLatlngs: function () {
		var lngRadius = this._getLngRadius(),
		    latlng = this._latlng,
		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);

		this._point = this._map.latLngToLayerPoint(latlng);
		this._radius = Math.max(this._point.x - pointLeft.x, 1);
	},

	getBounds: function () {
		var lngRadius = this._getLngRadius(),
		    latRadius = (this._mRadius / 40075017) * 360,
		    latlng = this._latlng;

		return new L.LatLngBounds(
		        [latlng.lat - latRadius, latlng.lng - lngRadius],
		        [latlng.lat + latRadius, latlng.lng + lngRadius]);
	},

	getLatLng: function () {
		return this._latlng;
	},

	getPathString: function () {
		var p = this._point,
		    r = this._radius;

		if (this._checkIfEmpty()) {
			return '';
		}

		if (L.Browser.svg) {
			return 'M' + p.x + ',' + (p.y - r) +
			       'A' + r + ',' + r + ',0,1,1,' +
			       (p.x - 0.1) + ',' + (p.y - r) + ' z';
		} else {
			p._round();
			r = Math.round(r);
			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);
		}
	},

	getRadius: function () {
		return this._mRadius;
	},

	// TODO Earth hardcoded, move into projection code!

	_getLatRadius: function () {
		return (this._mRadius / 40075017) * 360;
	},

	_getLngRadius: function () {
		return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);
	},

	_checkIfEmpty: function () {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	}
});

L.circle = function (latlng, radius, options) {
	return new L.Circle(latlng, radius, options);
};


/*
 * L.CircleMarker is a circle overlay with a permanent pixel radius.
 */

L.CircleMarker = L.Circle.extend({
	options: {
		radius: 10,
		weight: 2
	},

	initialize: function (latlng, options) {
		L.Circle.prototype.initialize.call(this, latlng, null, options);
		this._radius = this.options.radius;
	},

	projectLatlngs: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
	},

	_updateStyle : function () {
		L.Circle.prototype._updateStyle.call(this);
		this.setRadius(this.options.radius);
	},

	setLatLng: function (latlng) {
		L.Circle.prototype.setLatLng.call(this, latlng);
		if (this._popup && this._popup._isOpen) {
			this._popup.setLatLng(latlng);
		}
		return this;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	}
});

L.circleMarker = function (latlng, options) {
	return new L.CircleMarker(latlng, options);
};


/*
 * Extends L.Polyline to be able to manually detect clicks on Canvas-rendered polylines.
 */

L.Polyline.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p, closed) {
		var i, j, k, len, len2, dist, part,
		    w = this.options.weight / 2;

		if (L.Browser.touch) {
			w += 10; // polyline click tolerance on touch devices
		}

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				if (!closed && (j === 0)) {
					continue;
				}

				dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);

				if (dist <= w) {
					return true;
				}
			}
		}
		return false;
	}
});


/*
 * Extends L.Polygon to be able to manually detect clicks on Canvas-rendered polygons.
 */

L.Polygon.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p) {
		var inside = false,
		    part, p1, p2,
		    i, j, k,
		    len, len2;

		// TODO optimization: check if within bounds first

		if (L.Polyline.prototype._containsPoint.call(this, p, true)) {
			// click on polygon border
			return true;
		}

		// ray casting algorithm for detecting if point is in polygon

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];

			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				p1 = part[j];
				p2 = part[k];

				if (((p1.y > p.y) !== (p2.y > p.y)) &&
						(p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
					inside = !inside;
				}
			}
		}

		return inside;
	}
});


/*
 * Extends L.Circle with Canvas-specific code.
 */

L.Circle.include(!L.Path.CANVAS ? {} : {
	_drawPath: function () {
		var p = this._point;
		this._ctx.beginPath();
		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
	},

	_containsPoint: function (p) {
		var center = this._point,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;

		return (p.distanceTo(center) <= this._radius + w2);
	}
});


/*
 * CircleMarker canvas specific drawing parts.
 */

L.CircleMarker.include(!L.Path.CANVAS ? {} : {
	_updateStyle: function () {
		L.Path.prototype._updateStyle.call(this);
	}
});


/*
 * L.GeoJSON turns any GeoJSON data into a Leaflet layer.
 */

L.GeoJSON = L.FeatureGroup.extend({

	initialize: function (geojson, options) {
		L.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// Only add this if geometry or geometries are set and not null
				feature = features[i];
				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
					this.addData(features[i]);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return; }

		var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);
		layer.feature = L.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	resetStyle: function (layer) {
		var style = this.options.style;
		if (style) {
			// reset any custom styles
			L.Util.extend(layer.options, layer.defaultOptions);

			this._setLayerStyle(layer, style);
		}
	},

	setStyle: function (style) {
		this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

L.extend(L.GeoJSON, {
	geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry.coordinates,
		    layers = [],
		    latlng, latlngs, i, len;

		coordsToLatLng = coordsToLatLng || this.coordsToLatLng;

		switch (geometry.type) {
		case 'Point':
			latlng = coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = coordsToLatLng(coords[i]);
				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
			}
			return new L.FeatureGroup(layers);

		case 'LineString':
			latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
			return new L.Polyline(latlngs, vectorOptions);

		case 'Polygon':
			if (coords.length === 2 && !coords[1].length) {
				throw new Error('Invalid GeoJSON object.');
			}
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.Polygon(latlngs, vectorOptions);

		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.MultiPolyline(latlngs, vectorOptions);

		case 'MultiPolygon':
			latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
			return new L.MultiPolygon(latlngs, vectorOptions);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {

				layers.push(this.geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, pointToLayer, coordsToLatLng, vectorOptions));
			}
			return new L.FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng
		return new L.LatLng(coords[1], coords[0], coords[2]);
	},

	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) { // (Array[, Number, Function]) -> Array
		var latlng, i, len,
		    latlngs = [];

		for (i = 0, len = coords.length; i < len; i++) {
			latlng = levelsDeep ?
			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	},

	latLngToCoords: function (latlng) {
		var coords = [latlng.lng, latlng.lat];

		if (latlng.alt !== undefined) {
			coords.push(latlng.alt);
		}
		return coords;
	},

	latLngsToCoords: function (latLngs) {
		var coords = [];

		for (var i = 0, len = latLngs.length; i < len; i++) {
			coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));
		}

		return coords;
	},

	getFeature: function (layer, newGeometry) {
		return layer.feature ? L.extend({}, layer.feature, {geometry: newGeometry}) : L.GeoJSON.asFeature(newGeometry);
	},

	asFeature: function (geoJSON) {
		if (geoJSON.type === 'Feature') {
			return geoJSON;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geoJSON
		};
	}
});

var PointToGeoJSON = {
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'Point',
			coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
		});
	}
};

L.Marker.include(PointToGeoJSON);
L.Circle.include(PointToGeoJSON);
L.CircleMarker.include(PointToGeoJSON);

L.Polyline.include({
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'LineString',
			coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())
		});
	}
});

L.Polygon.include({
	toGeoJSON: function () {
		var coords = [L.GeoJSON.latLngsToCoords(this.getLatLngs())],
		    i, len, hole;

		coords[0].push(coords[0][0]);

		if (this._holes) {
			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = L.GeoJSON.latLngsToCoords(this._holes[i]);
				hole.push(hole[0]);
				coords.push(hole);
			}
		}

		return L.GeoJSON.getFeature(this, {
			type: 'Polygon',
			coordinates: coords
		});
	}
});

(function () {
	function multiToGeoJSON(type) {
		return function () {
			var coords = [];

			this.eachLayer(function (layer) {
				coords.push(layer.toGeoJSON().geometry.coordinates);
			});

			return L.GeoJSON.getFeature(this, {
				type: type,
				coordinates: coords
			});
		};
	}

	L.MultiPolyline.include({toGeoJSON: multiToGeoJSON('MultiLineString')});
	L.MultiPolygon.include({toGeoJSON: multiToGeoJSON('MultiPolygon')});

	L.LayerGroup.include({
		toGeoJSON: function () {

			var geometry = this.feature && this.feature.geometry,
				jsons = [],
				json;

			if (geometry && geometry.type === 'MultiPoint') {
				return multiToGeoJSON('MultiPoint').call(this);
			}

			var isGeometryCollection = geometry && geometry.type === 'GeometryCollection';

			this.eachLayer(function (layer) {
				if (layer.toGeoJSON) {
					json = layer.toGeoJSON();
					jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
				}
			});

			if (isGeometryCollection) {
				return L.GeoJSON.getFeature(this, {
					geometries: jsons,
					type: 'GeometryCollection'
				});
			}

			return {
				type: 'FeatureCollection',
				features: jsons
			};
		}
	});
}());

L.geoJson = function (geojson, options) {
	return new L.GeoJSON(geojson, options);
};


/*
 * L.DomEvent contains functions for working with DOM events.
 */

L.DomEvent = {
	/* inspired by John Resig, Dean Edwards and YUI addEvent implementations */
	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler, originalHandler, newType;

		if (obj[key]) { return this; }

		handler = function (e) {
			return fn.call(context || obj, e || L.DomEvent._getEvent());
		};

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			return this.addPointerListener(obj, type, handler, id);
		}
		if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);
		}

		if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				originalHandler = handler;
				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

				handler = function (e) {
					if (!L.DomEvent._checkMouse(obj, e)) { return; }
					return originalHandler(e);
				};

				obj.addEventListener(newType, handler, false);

			} else if (type === 'click' && L.Browser.android) {
				originalHandler = handler;
				handler = function (e) {
					return L.DomEvent._filterClick(e, originalHandler);
				};

				obj.addEventListener(type, handler, false);
			} else {
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[key] = handler;

		return this;
	},

	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler = obj[key];

		if (!handler) { return this; }

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);
		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
			} else {
				obj.removeEventListener(type, handler, false);
			}
		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[key] = null;

		return this;
	},

	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
		L.DomEvent._skipped(e);

		return this;
	},

	disableScrollPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		return L.DomEvent
			.on(el, 'mousewheel', stop)
			.on(el, 'MozMousePixelScroll', stop);
	},

	disableClickPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(el, L.Draggable.START[i], stop);
		}

		return L.DomEvent
			.on(el, 'click', L.DomEvent._fakeStop)
			.on(el, 'dblclick', stop);
	},

	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	stop: function (e) {
		return L.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	getMousePosition: function (e, container) {
		if (!container) {
			return new L.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new L.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
		L.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_checkMouse: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	_getEvent: function () { // evil magic for IE
		/*jshint noarg:false */
		var e = window.event;
		if (!e) {
			var caller = arguments.callee.caller;
			while (caller) {
				e = caller['arguments'][0];
				if (e && window.Event === e.constructor) {
					break;
				}
				caller = caller.caller;
			}
		}
		return e;
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
			elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			return;
		}
		L.DomEvent._lastClick = timeStamp;

		return handler(e);
	}
};

L.DomEvent.on = L.DomEvent.addListener;
L.DomEvent.off = L.DomEvent.removeListener;


/*
 * L.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
 */

L.Draggable = L.Class.extend({
	includes: L.Mixin.Events,

	statics: {
		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	initialize: function (element, dragStartTarget) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
	},

	enable: function () {
		if (this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.off(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		this._moved = false;

		if (e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }

		L.DomEvent.stopPropagation(e);

		if (L.Draggable._disabled) { return; }

		L.DomUtil.disableImageDrag();
		L.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new L.Point(first.clientX, first.clientY);
		this._startPos = this._newPos = L.DomUtil.getPosition(this._element);

		L.DomEvent
		    .on(document, L.Draggable.MOVE[e.type], this._onMove, this)
		    .on(document, L.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new L.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }
		if (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

		L.DomEvent.preventDefault(e);

		if (!this._moved) {
			this.fire('dragstart');

			this._moved = true;
			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

			L.DomUtil.addClass(document.body, 'leaflet-dragging');
			this._lastTarget = e.target || e.srcElement;
			L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
	},

	_updatePosition: function () {
		this.fire('predrag');
		L.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag');
	},

	_onUp: function () {
		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		if (this._lastTarget) {
			L.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');
			this._lastTarget = null;
		}

		for (var i in L.Draggable.MOVE) {
			L.DomEvent
			    .off(document, L.Draggable.MOVE[i], this._onMove)
			    .off(document, L.Draggable.END[i], this._onUp);
		}

		L.DomUtil.enableImageDrag();
		L.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			L.Util.cancelAnimFrame(this._animRequest);

			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
	}
});


/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});


/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

L.Map.mergeOptions({
	dragging: true,

	inertia: !L.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	inertiaThreshold: L.Browser.touch ? 32 : 18, // ms
	easeLinearity: 0.25,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				'dragstart': this._onDragStart,
				'drag': this._onDrag,
				'dragend': this._onDragEnd
			}, this);

			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDrag, this);
				map.on('viewreset', this._onViewReset, this);

				map.whenReady(this._onViewReset, this);
			}
		}
		this._draggable.enable();
	},

	removeHooks: function () {
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		var map = this._map;

		if (map._panAnim) {
			map._panAnim.stop();
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function () {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 200) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move')
		    .fire('drag');
	},

	_onViewReset: function () {
		// TODO fix hardcoded Earth values
		var pxCenter = this._map.getSize()._divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.project([0, 180]).x;
	},

	_onPreDrag: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,
		    delay = +new Date() - this._lastTime,

		    noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime + delay - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x || !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true
					});
				});
			}
		}
	}
});

L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);


/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

L.Map.mergeOptions({
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);


/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

L.Map.mergeOptions({
	scrollWheelZoom: true
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);
		L.DomEvent.on(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll);
		L.DomEvent.off(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(40 - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.preventDefault(e);
		L.DomEvent.stopPropagation(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);


/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

L.extend(L.DomEvent, {

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last,
		    doubleTap = false,
		    delay = 250,
		    touch,
		    pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend,
		    trackedTouches = [];

		function onTouchStart(e) {
			var count;

			if (L.Browser.pointer) {
				trackedTouches.push(e.pointerId);
				count = trackedTouches.length;
			} else {
				count = e.touches.length;
			}
			if (count > 1) {
				return;
			}

			var now = Date.now(),
				delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd(e) {
			if (L.Browser.pointer) {
				var idx = trackedTouches.indexOf(e.pointerId);
				if (idx === -1) {
					return;
				}
				trackedTouches.splice(idx, 1);
			}

			if (doubleTap) {
				if (L.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = { },
						prop;

					// jshint forin:false
					for (var i in touch) {
						prop = touch[i];
						if (typeof prop === 'function') {
							newTouch[i] = prop.bind(touch);
						} else {
							newTouch[i] = prop;
						}
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}
		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;

		// on pointer we need to listen on the document, otherwise a drag starting on the map and moving off screen
		// will not come through to us, so we will lose track of how many touches are ongoing
		var endElement = L.Browser.pointer ? document.documentElement : obj;

		obj.addEventListener(touchstart, onTouchStart, false);
		endElement.addEventListener(touchend, onTouchEnd, false);

		if (L.Browser.pointer) {
			endElement.addEventListener(L.DomEvent.POINTER_CANCEL, onTouchEnd, false);
		}

		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_';

		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
		(L.Browser.pointer ? document.documentElement : obj).removeEventListener(
		        this._touchend, obj[pre + this._touchend + id], false);

		if (L.Browser.pointer) {
			document.documentElement.removeEventListener(L.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id],
				false);
		}

		return this;
	}
});


/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	//static
	POINTER_DOWN: L.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: L.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: L.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {

			L.DomEvent.preventDefault(e);

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

L.Map.mergeOptions({
	touchZoom: L.Browser.touch && !L.Browser.android23,
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]),
		    viewCenter = map._getCenterLayerPoint();

		this._startCenter = p1.add(p2)._divideBy(2);
		this._startDist = p1.distanceTo(p2);

		this._moved = false;
		this._zooming = true;

		this._centerOffset = viewCenter.subtract(this._startCenter);

		if (map._panAnim) {
			map._panAnim.stop();
		}

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]);

		this._scale = p1.distanceTo(p2) / this._startDist;
		this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);

		if (this._scale === 1) { return; }

		if (!map.options.bounceAtZoomLimits) {
			if ((map.getZoom() === map.getMinZoom() && this._scale < 1) ||
			    (map.getZoom() === map.getMaxZoom() && this._scale > 1)) { return; }
		}

		if (!this._moved) {
			L.DomUtil.addClass(map._mapPane, 'leaflet-touching');

			map
			    .fire('movestart')
			    .fire('zoomstart');

			this._moved = true;
		}

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(
		        this._updateOnMove, this, true, this._map._container);

		L.DomEvent.preventDefault(e);
	},

	_updateOnMove: function () {
		var map = this._map,
		    origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),
		    zoom = map.getScaleZoom(this._scale);

		map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta, false, true);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		var map = this._map;

		this._zooming = false;
		L.DomUtil.removeClass(map._mapPane, 'leaflet-touching');
		L.Util.cancelAnimFrame(this._animRequest);

		L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		var origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),

		    oldZoom = map.getZoom(),
		    floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom,
		    roundZoomDelta = (floatZoomDelta > 0 ?
		            Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta)),

		    zoom = map._limitZoom(oldZoom + roundZoomDelta),
		    scale = map.getZoomScale(zoom) / this._scale;

		map._animateZoom(center, zoom, origin, scale);
	},

	_getScaleOrigin: function () {
		var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
		return this._startCenter.add(centerOffset);
	}
});

L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);


/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

L.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		L.DomEvent
			.on(document, 'touchmove', this._onMove, this)
			.on(document, 'touchend', this._onUp, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent
			.off(document, 'touchmove', this._onMove, this)
			.off(document, 'touchend', this._onUp, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}


/*
 * L.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

L.Map.mergeOptions({
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._moved = false;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown);
		this._moved = false;
	},

	moved: function () {
		return this._moved;
	},

	_onMouseDown: function (e) {
		this._moved = false;

		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		L.DomEvent
		    .on(document, 'mousemove', this._onMouseMove, this)
		    .on(document, 'mouseup', this._onMouseUp, this)
		    .on(document, 'keydown', this._onKeyDown, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
			L.DomUtil.setPosition(this._box, this._startLayerPoint);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';
			this._map.fire('boxzoomstart');
		}

		var startPoint = this._startLayerPoint,
		    box = this._box,

		    layerPoint = this._map.mouseEventToLayerPoint(e),
		    offset = layerPoint.subtract(startPoint),

		    newPos = new L.Point(
		        Math.min(layerPoint.x, startPoint.x),
		        Math.min(layerPoint.y, startPoint.y));

		L.DomUtil.setPosition(box, newPos);

		this._moved = true;

		// TODO refactor: remove hardcoded 4 pixels
		box.style.width  = (Math.max(0, Math.abs(offset.x) - 4)) + 'px';
		box.style.height = (Math.max(0, Math.abs(offset.y) - 4)) + 'px';
	},

	_finish: function () {
		if (this._moved) {
			this._pane.removeChild(this._box);
			this._container.style.cursor = '';
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent
		    .off(document, 'mousemove', this._onMouseMove)
		    .off(document, 'mouseup', this._onMouseUp)
		    .off(document, 'keydown', this._onKeyDown);
	},

	_onMouseUp: function (e) {

		this._finish();

		var map = this._map,
		    layerPoint = map.mouseEventToLayerPoint(e);

		if (this._startLayerPoint.equals(layerPoint)) { return; }

		var bounds = new L.LatLngBounds(
		        map.layerPointToLatLng(this._startLayerPoint),
		        map.layerPointToLatLng(layerPoint));

		map.fitBounds(bounds);

		map.fire('boxzoomend', {
			boxZoomBounds: bounds
		});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);


/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

L.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex === -1) {
			container.tabIndex = '0';
		}

		L.DomEvent
		    .on(container, 'focus', this._onFocus, this)
		    .on(container, 'blur', this._onBlur, this)
		    .on(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .on('focus', this._addHooks, this)
		    .on('blur', this._removeHooks, this);
	},

	removeHooks: function () {
		this._removeHooks();

		var container = this._map._container;

		L.DomEvent
		    .off(container, 'focus', this._onFocus, this)
		    .off(container, 'blur', this._onBlur, this)
		    .off(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .off('focus', this._addHooks, this)
		    .off('blur', this._removeHooks, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		var key = e.keyCode,
		    map = this._map;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			map.panBy(this._panKeys[key]);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + this._zoomKeys[key]);

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);


/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon);
		}

		this._draggable
			.on('dragstart', this._onDragStart, this)
			.on('drag', this._onDrag, this)
			.on('dragend', this._onDragEnd, this);
		this._draggable.enable();
		L.DomUtil.addClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable
			.off('dragstart', this._onDragStart, this)
			.off('drag', this._onDrag, this)
			.off('dragend', this._onDragEnd, this);

		this._draggable.disable();
		L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function () {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;

		marker
		    .fire('move', {latlng: latlng})
		    .fire('drag');
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});


/*
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

L.Control = L.Class.extend({
	options: {
		position: 'topright'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	getPosition: function () {
		return this.options.position;
	},

	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	getContainer: function () {
		return this._container;
	},

	addTo: function (map) {
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	removeFrom: function (map) {
		var pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		corner.removeChild(this._container);
		this._map = null;

		if (this.onRemove) {
			this.onRemove(map);
		}

		return this;
	},

	_refocusOnMap: function () {
		if (this._map) {
			this._map.getContainer().focus();
		}
	}
});

L.control = function (options) {
	return new L.Control(options);
};


// adds control-related methods to L.Map

L.Map.include({
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	removeControl: function (control) {
		control.removeFrom(this);
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		this._container.removeChild(this._controlContainer);
	}
});


/*
 * L.Control.Zoom is used for the default zoom buttons on the map.
 */

L.Control.Zoom = L.Control.extend({
	options: {
		position: 'topleft',
		zoomInText: '+',
		zoomInTitle: 'Zoom in',
		zoomOutText: '-',
		zoomOutTitle: 'Zoom out'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar');

		this._map = map;

		this._zoomInButton  = this._createButton(
		        this.options.zoomInText, this.options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn,  this);
		this._zoomOutButton = this._createButton(
		        this.options.zoomOutText, this.options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut, this);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	_zoomIn: function (e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function (e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = L.DomEvent.stopPropagation;

		L.DomEvent
		    .on(link, 'click', stop)
		    .on(link, 'mousedown', stop)
		    .on(link, 'dblclick', stop)
		    .on(link, 'click', L.DomEvent.preventDefault)
		    .on(link, 'click', fn, context)
		    .on(link, 'click', this._refocusOnMap, context);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
			className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

L.Map.mergeOptions({
	zoomControl: true
});

L.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new L.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

L.control.zoom = function (options) {
	return new L.Control.Zoom(options);
};



/*
 * L.Control.Attribution is used for displaying attribution on the map (added by default).
 */

L.Control.Attribution = L.Control.extend({
	options: {
		position: 'bottomright',
		prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
		L.DomEvent.disableClickPropagation(this._container);

		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}
		
		map
		    .on('layeradd', this._onLayerAdd, this)
		    .on('layerremove', this._onLayerRemove, this);

		this._update();

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerAdd)
		    .off('layerremove', this._onLayerRemove);

	},

	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	addAttribution: function (text) {
		if (!text) { return; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	removeAttribution: function (text) {
		if (!text) { return; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	},

	_onLayerAdd: function (e) {
		if (e.layer.getAttribution) {
			this.addAttribution(e.layer.getAttribution());
		}
	},

	_onLayerRemove: function (e) {
		if (e.layer.getAttribution) {
			this.removeAttribution(e.layer.getAttribution());
		}
	}
});

L.Map.mergeOptions({
	attributionControl: true
});

L.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		this.attributionControl = (new L.Control.Attribution()).addTo(this);
	}
});

L.control.attribution = function (options) {
	return new L.Control.Attribution(options);
};


/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.Scale = L.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className, container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className + '-line', container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className + '-line', container);
		}
	},

	_update: function () {
		var bounds = this._map.getBounds(),
		    centerLat = bounds.getCenter().lat,
		    halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
		    dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

		    size = this._map.getSize(),
		    options = this.options,
		    maxMeters = 0;

		if (size.x > 0) {
			maxMeters = dist * (options.maxWidth / size.x);
		}

		this._updateScales(options, maxMeters);
	},

	_updateScales: function (options, maxMeters) {
		if (options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}

		if (options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters);

		this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
		this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    scale = this._iScale,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);

			scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
			scale.innerHTML = miles + ' mi';

		} else {
			feet = this._getRoundNum(maxFeet);

			scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
			scale.innerHTML = feet + ' ft';
		}
	},

	_getScaleWidth: function (ratio) {
		return Math.round(this.options.maxWidth * ratio) - 10;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

L.control.scale = function (options) {
	return new L.Control.Scale(options);
};


/*
 * L.Control.Layers is a control to allow users to switch between different layers on the map.
 */

L.Control.Layers = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (baseLayers, overlays, options) {
		L.setOptions(this, options);

		this._layers = {};
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		map
		    .on('layeradd', this._onLayerChange, this)
		    .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerChange, this)
		    .off('layerremove', this._onLayerChange, this);
	},

	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		this._update();
		return this;
	},

	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		this._update();
		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);
		delete this._layers[id];
		this._update();
		return this;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (layer, name, overlay) {
		var id = L.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._baseLayersList.innerHTML = '';
		this._overlaysList.innerHTML = '';

		var baseLayersPresent = false,
		    overlaysPresent = false,
		    i, obj;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
	},

	_onLayerChange: function (e) {
		var obj = this._layers[L.stamp(e.layer)];

		if (!obj) { return; }

		if (!this._handlingClick) {
			this._update();
		}

		var type = obj.overlay ?
			(e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'layeradd' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
		if (checked) {
			radioHtml += ' checked="checked"';
		}
		radioHtml += '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    input,
		    checked = this._map.hasLayer(obj.layer);

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = L.stamp(obj.layer);

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		label.appendChild(input);
		label.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			obj = this._layers[input.layerId];

			if (input.checked && !this._map.hasLayer(obj.layer)) {
				this._map.addLayer(obj.layer);

			} else if (!input.checked && this._map.hasLayer(obj.layer)) {
				this._map.removeLayer(obj.layer);
			}
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

L.control.layers = function (baseLayers, overlays, options) {
	return new L.Control.Layers(baseLayers, overlays, options);
};


/*
 * L.PosAnimation is used by Leaflet internally for pan animations.
 */

L.PosAnimation = L.Class.extend({
	includes: L.Mixin.Events,

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._newPos = newPos;

		this.fire('start');

		el.style[L.DomUtil.TRANSITION] = 'all ' + (duration || 0.25) +
		        's cubic-bezier(0,0,' + (easeLinearity || 0.5) + ',1)';

		L.DomEvent.on(el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
		L.DomUtil.setPosition(el, newPos);

		// toggle reflow, Chrome flickers for some reason if you don't do this
		L.Util.falseFn(el.offsetWidth);

		// there's no native way to track value updates of transitioned properties, so we imitate this
		this._stepTimer = setInterval(L.bind(this._onStep, this), 50);
	},

	stop: function () {
		if (!this._inProgress) { return; }

		// if we just removed the transition property, the element would jump to its final position,
		// so we need to make it stay at the current position

		L.DomUtil.setPosition(this._el, this._getPos());
		this._onTransitionEnd();
		L.Util.falseFn(this._el.offsetWidth); // force reflow in case we are about to start a new animation
	},

	_onStep: function () {
		var stepPos = this._getPos();
		if (!stepPos) {
			this._onTransitionEnd();
			return;
		}
		// jshint camelcase: false
		// make L.DomUtil.getPosition return intermediate position value during animation
		this._el._leaflet_pos = stepPos;

		this.fire('step');
	},

	// you can't easily get intermediate values of properties animated with CSS3 Transitions,
	// we need to parse computed style (in case of transform it returns matrix string)

	_transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,

	_getPos: function () {
		var left, top, matches,
		    el = this._el,
		    style = window.getComputedStyle(el);

		if (L.Browser.any3d) {
			matches = style[L.DomUtil.TRANSFORM].match(this._transformRe);
			if (!matches) { return; }
			left = parseFloat(matches[1]);
			top  = parseFloat(matches[2]);
		} else {
			left = parseFloat(style.left);
			top  = parseFloat(style.top);
		}

		return new L.Point(left, top, true);
	},

	_onTransitionEnd: function () {
		L.DomEvent.off(this._el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);

		if (!this._inProgress) { return; }
		this._inProgress = false;

		this._el.style[L.DomUtil.TRANSITION] = '';

		// jshint camelcase: false
		// make sure L.DomUtil.getPosition returns the final position value after animation
		this._el._leaflet_pos = this._newPos;

		clearInterval(this._stepTimer);

		this.fire('step').fire('end');
	}

});


/*
 * Extends L.Map to handle panning animations.
 */

L.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		if (this._panAnim) {
			this._panAnim.stop();
		}

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate}, options.pan);
			}

			// try animating pan or zoom
			var animated = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (animated) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});


/*
 * L.PosAnimation fallback implementation that powers Leaflet pan animations
 * in browsers that don't support CSS3 Transitions.
 */

L.PosAnimation = L.DomUtil.TRANSITION ? L.PosAnimation : L.PosAnimation.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step();
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function () {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		L.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});


/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

if (L.DomUtil.TRANSITION) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation && L.DomUtil.TRANSITION &&
				L.Browser.any3d && !L.Browser.android23 && !L.Browser.mobileOpera;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!L.DomUtil.TRANSITION ? {} : {

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	},

	_animateZoom: function (center, zoom, origin, scale, delta, backwards, forTouchZoom) {

		if (!forTouchZoom) {
			this._animatingZoom = true;
		}

		// put transform transition on all layers with leaflet-zoom-animated class
		L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');

		// remember what center/zoom to set after animation
		this._animateToCenter = center;
		this._animateToZoom = zoom;

		// disable any dragging during animation
		if (L.Draggable) {
			L.Draggable._disabled = true;
		}

		L.Util.requestAnimFrame(function () {
			this.fire('zoomanim', {
				center: center,
				zoom: zoom,
				origin: origin,
				scale: scale,
				delta: delta,
				backwards: backwards
			});
		}, this);
	},

	_onZoomTransitionEnd: function () {

		this._animatingZoom = false;

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._resetView(this._animateToCenter, this._animateToZoom, true, true);

		if (L.Draggable) {
			L.Draggable._disabled = false;
		}
	}
});


/*
	Zoom animation logic for L.TileLayer.
*/

L.TileLayer.include({
	_animateZoom: function (e) {
		if (!this._animating) {
			this._animating = true;
			this._prepareBgBuffer();
		}

		var bg = this._bgBuffer,
		    transform = L.DomUtil.TRANSFORM,
		    initialTransform = e.delta ? L.DomUtil.getTranslateString(e.delta) : bg.style[transform],
		    scaleStr = L.DomUtil.getScaleString(e.scale, e.origin);

		bg.style[transform] = e.backwards ?
				scaleStr + ' ' + initialTransform :
				initialTransform + ' ' + scaleStr;
	},

	_endZoomAnim: function () {
		var front = this._tileContainer,
		    bg = this._bgBuffer;

		front.style.visibility = '';
		front.parentNode.appendChild(front); // Bring to fore

		// force reflow
		L.Util.falseFn(bg.offsetWidth);

		this._animating = false;
	},

	_clearBgBuffer: function () {
		var map = this._map;

		if (map && !map._animatingZoom && !map.touchZoom._zooming) {
			this._bgBuffer.innerHTML = '';
			this._bgBuffer.style[L.DomUtil.TRANSFORM] = '';
		}
	},

	_prepareBgBuffer: function () {

		var front = this._tileContainer,
		    bg = this._bgBuffer;

		// if foreground layer doesn't have many tiles but bg layer does,
		// keep the existing bg layer and just zoom it some more

		var bgLoaded = this._getLoadedTilesPercentage(bg),
		    frontLoaded = this._getLoadedTilesPercentage(front);

		if (bg && bgLoaded > 0.5 && frontLoaded < 0.5) {

			front.style.visibility = 'hidden';
			this._stopLoadingImages(front);
			return;
		}

		// prepare the buffer to become the front tile pane
		bg.style.visibility = 'hidden';
		bg.style[L.DomUtil.TRANSFORM] = '';

		// switch out the current layer to be the new bg layer (and vice-versa)
		this._tileContainer = bg;
		bg = this._bgBuffer = front;

		this._stopLoadingImages(bg);

		//prevent bg buffer from clearing right after zoom
		clearTimeout(this._clearBgBufferTimer);
	},

	_getLoadedTilesPercentage: function (container) {
		var tiles = container.getElementsByTagName('img'),
		    i, len, count = 0;

		for (i = 0, len = tiles.length; i < len; i++) {
			if (tiles[i].complete) {
				count++;
			}
		}
		return count / len;
	},

	// stops loading all tiles in the background layer
	_stopLoadingImages: function (container) {
		var tiles = Array.prototype.slice.call(container.getElementsByTagName('img')),
		    i, len, tile;

		for (i = 0, len = tiles.length; i < len; i++) {
			tile = tiles[i];

			if (!tile.complete) {
				tile.onload = L.Util.falseFn;
				tile.onerror = L.Util.falseFn;
				tile.src = L.Util.emptyImageUrl;

				tile.parentNode.removeChild(tile);
			}
		}
	}
});


/*
 * Provides L.Map with convenient shortcuts for using browser geolocation features.
 */

L.Map.include({
	_defaultLocateOptions: {
		watch: false,
		setView: false,
		maxZoom: Infinity,
		timeout: 10000,
		maximumAge: 0,
		enableHighAccuracy: false
	},

	locate: function (/*Object*/ options) {

		options = this._locateOptions = L.extend(this._defaultLocateOptions, options);

		if (!navigator.geolocation) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
			onError = L.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	stopLocate: function () {
		if (navigator.geolocation) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new L.LatLng(lat, lng),

		    latAccuracy = 180 * pos.coords.accuracy / 40075017,
		    lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat),

		    bounds = L.latLngBounds(
		            [lat - latAccuracy, lng - lngAccuracy],
		            [lat + latAccuracy, lng + lngAccuracy]),

		    options = this._locateOptions;

		if (options.setView) {
			var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
			this.setView(latlng, zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}
});


}(window, document));
},{}],3:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  function Context(view, parent) {
    this.view = view == null ? {} : view;
    this.parent = parent;
    this._cache = { '.': this.view };
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value;
    if (name in this._cache) {
      value = this._cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this._cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  function Writer() {
    this.clearCache();
  }

  Writer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Writer.prototype.compile = function (template, tags) {
    var fn = this._cache[template];

    if (!fn) {
      var tokens = mustache.parse(template, tags);
      fn = this._cache[template] = this.compileTokens(tokens, template);
    }

    return fn;
  };

  Writer.prototype.compilePartial = function (name, template, tags) {
    var fn = this.compile(template, tags);
    this._partialCache[name] = fn;
    return fn;
  };

  Writer.prototype.getPartial = function (name) {
    if (!(name in this._partialCache) && this._loadPartial) {
      this.compilePartial(name, this._loadPartial(name));
    }

    return this._partialCache[name];
  };

  Writer.prototype.compileTokens = function (tokens, template) {
    var self = this;
    return function (view, partials) {
      if (partials) {
        if (isFunction(partials)) {
          self._loadPartial = partials;
        } else {
          for (var name in partials) {
            self.compilePartial(name, partials[name]);
          }
        }
      }

      return renderTokens(tokens, self, Context.make(view), template);
    };
  };

  Writer.prototype.render = function (template, view, partials) {
    return this.compile(template)(view, partials);
  };

  /**
   * Low-level function that renders the given `tokens` using the given `writer`
   * and `context`. The `template` string is only needed for templates that use
   * higher-order sections to extract the portion of the original template that
   * was contained in that section.
   */
  function renderTokens(tokens, writer, context, template) {
    var buffer = '';

    // This function is used to render an artbitrary template
    // in the current context by higher-order functions.
    function subRender(template) {
      return writer.render(template, context);
    }

    var token, tokenValue, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      tokenValue = token[1];

      switch (token[0]) {
      case '#':
        value = context.lookup(tokenValue);

        if (typeof value === 'object' || typeof value === 'string') {
          if (isArray(value)) {
            for (var j = 0, jlen = value.length; j < jlen; ++j) {
              buffer += renderTokens(token[4], writer, context.push(value[j]), template);
            }
          } else if (value) {
            buffer += renderTokens(token[4], writer, context.push(value), template);
          }
        } else if (isFunction(value)) {
          var text = template == null ? null : template.slice(token[3], token[5]);
          value = value.call(context.view, text, subRender);
          if (value != null) buffer += value;
        } else if (value) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '^':
        value = context.lookup(tokenValue);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '>':
        value = writer.getPartial(tokenValue);
        if (isFunction(value)) buffer += value(context);
        break;
      case '&':
        value = context.lookup(tokenValue);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(tokenValue);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += tokenValue;
        break;
      }
    }

    return buffer;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];

    var token;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      switch (token[0]) {
      case '#':
      case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;
      case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;
      default:
        collector.push(token);
      }
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          lastToken = token;
          squashedTokens.push(token);
        }
      }
    }

    return squashedTokens;
  }

  function escapeTags(tags) {
    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  function parseTemplate(template, tags) {
    template = template || '';
    tags = tags || mustache.tags;

    if (typeof tags === 'string') tags = tags.split(spaceRe);
    if (tags.length !== 2) throw new Error('Invalid tags: ' + tags.join(', '));

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr == '\n') stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) throw new Error('Unclosed tag at ' + scanner.pos);

      token = [type, value, start, scanner.pos];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();
        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tags = value.split(spaceRe);
        if (tags.length !== 2) {
          throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
        }
        tagRes = escapeTags(tags);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  mustache.name = "mustache.js";
  mustache.version = "0.7.3";
  mustache.tags = ["{{", "}}"];

  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  mustache.parse = parseTemplate;

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // All Mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates and partials in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Compiles the given `template` to a reusable function using the default
   * writer.
   */
  mustache.compile = function (template, tags) {
    return defaultWriter.compile(template, tags);
  };

  /**
   * Compiles the partial with the given `name` and `template` to a reusable
   * function using the default writer.
   */
  mustache.compilePartial = function (name, template, tags) {
    return defaultWriter.compilePartial(name, template, tags);
  };

  /**
   * Compiles the given array of tokens (the output of a parse) to a reusable
   * function using the default writer.
   */
  mustache.compileTokens = function (tokens, template) {
    return defaultWriter.compileTokens(tokens, template);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

}));

},{}],4:[function(require,module,exports){
var html_sanitize = require('./sanitizer-bundle.js');

module.exports = function(_) {
    if (!_) return '';
    return html_sanitize(_, cleanUrl, cleanId);
};

// https://bugzilla.mozilla.org/show_bug.cgi?id=255107
function cleanUrl(url) {
    'use strict';
    if (/^https?/.test(url.getScheme())) return url.toString();
    if (/^mailto?/.test(url.getScheme())) return url.toString();
    if ('data' == url.getScheme() && /^image/.test(url.getPath())) {
        return url.toString();
    }
}

function cleanId(id) { return id; }

},{"./sanitizer-bundle.js":5}],5:[function(require,module,exports){

// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 * Implements RFC 3986 for parsing/formatting URIs.
 *
 * @author mikesamuel@gmail.com
 * \@provides URI
 * \@overrides window
 */

var URI = (function () {

/**
 * creates a uri from the string form.  The parser is relaxed, so special
 * characters that aren't escaped but don't cause ambiguities will not cause
 * parse failures.
 *
 * @return {URI|null}
 */
function parse(uriStr) {
  var m = ('' + uriStr).match(URI_RE_);
  if (!m) { return null; }
  return new URI(
      nullIfAbsent(m[1]),
      nullIfAbsent(m[2]),
      nullIfAbsent(m[3]),
      nullIfAbsent(m[4]),
      nullIfAbsent(m[5]),
      nullIfAbsent(m[6]),
      nullIfAbsent(m[7]));
}


/**
 * creates a uri from the given parts.
 *
 * @param scheme {string} an unencoded scheme such as "http" or null
 * @param credentials {string} unencoded user credentials or null
 * @param domain {string} an unencoded domain name or null
 * @param port {number} a port number in [1, 32768].
 *    -1 indicates no port, as does null.
 * @param path {string} an unencoded path
 * @param query {Array.<string>|string|null} a list of unencoded cgi
 *   parameters where even values are keys and odds the corresponding values
 *   or an unencoded query.
 * @param fragment {string} an unencoded fragment without the "#" or null.
 * @return {URI}
 */
function create(scheme, credentials, domain, port, path, query, fragment) {
  var uri = new URI(
      encodeIfExists2(scheme, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_),
      encodeIfExists2(
          credentials, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_),
      encodeIfExists(domain),
      port > 0 ? port.toString() : null,
      encodeIfExists2(path, URI_DISALLOWED_IN_PATH_),
      null,
      encodeIfExists(fragment));
  if (query) {
    if ('string' === typeof query) {
      uri.setRawQuery(query.replace(/[^?&=0-9A-Za-z_\-~.%]/g, encodeOne));
    } else {
      uri.setAllParameters(query);
    }
  }
  return uri;
}
function encodeIfExists(unescapedPart) {
  if ('string' == typeof unescapedPart) {
    return encodeURIComponent(unescapedPart);
  }
  return null;
};
/**
 * if unescapedPart is non null, then escapes any characters in it that aren't
 * valid characters in a url and also escapes any special characters that
 * appear in extra.
 *
 * @param unescapedPart {string}
 * @param extra {RegExp} a character set of characters in [\01-\177].
 * @return {string|null} null iff unescapedPart == null.
 */
function encodeIfExists2(unescapedPart, extra) {
  if ('string' == typeof unescapedPart) {
    return encodeURI(unescapedPart).replace(extra, encodeOne);
  }
  return null;
};
/** converts a character in [\01-\177] to its url encoded equivalent. */
function encodeOne(ch) {
  var n = ch.charCodeAt(0);
  return '%' + '0123456789ABCDEF'.charAt((n >> 4) & 0xf) +
      '0123456789ABCDEF'.charAt(n & 0xf);
}

/**
 * {@updoc
 *  $ normPath('foo/./bar')
 *  # 'foo/bar'
 *  $ normPath('./foo')
 *  # 'foo'
 *  $ normPath('foo/.')
 *  # 'foo'
 *  $ normPath('foo//bar')
 *  # 'foo/bar'
 * }
 */
function normPath(path) {
  return path.replace(/(^|\/)\.(?:\/|$)/g, '$1').replace(/\/{2,}/g, '/');
}

var PARENT_DIRECTORY_HANDLER = new RegExp(
    ''
    // A path break
    + '(/|^)'
    // followed by a non .. path element
    // (cannot be . because normPath is used prior to this RegExp)
    + '(?:[^./][^/]*|\\.{2,}(?:[^./][^/]*)|\\.{3,}[^/]*)'
    // followed by .. followed by a path break.
    + '/\\.\\.(?:/|$)');

var PARENT_DIRECTORY_HANDLER_RE = new RegExp(PARENT_DIRECTORY_HANDLER);

var EXTRA_PARENT_PATHS_RE = /^(?:\.\.\/)*(?:\.\.$)?/;

/**
 * Normalizes its input path and collapses all . and .. sequences except for
 * .. sequences that would take it above the root of the current parent
 * directory.
 * {@updoc
 *  $ collapse_dots('foo/../bar')
 *  # 'bar'
 *  $ collapse_dots('foo/./bar')
 *  # 'foo/bar'
 *  $ collapse_dots('foo/../bar/./../../baz')
 *  # 'baz'
 *  $ collapse_dots('../foo')
 *  # '../foo'
 *  $ collapse_dots('../foo').replace(EXTRA_PARENT_PATHS_RE, '')
 *  # 'foo'
 * }
 */
function collapse_dots(path) {
  if (path === null) { return null; }
  var p = normPath(path);
  // Only /../ left to flatten
  var r = PARENT_DIRECTORY_HANDLER_RE;
  // We replace with $1 which matches a / before the .. because this
  // guarantees that:
  // (1) we have at most 1 / between the adjacent place,
  // (2) always have a slash if there is a preceding path section, and
  // (3) we never turn a relative path into an absolute path.
  for (var q; (q = p.replace(r, '$1')) != p; p = q) {};
  return p;
}

/**
 * resolves a relative url string to a base uri.
 * @return {URI}
 */
function resolve(baseUri, relativeUri) {
  // there are several kinds of relative urls:
  // 1. //foo - replaces everything from the domain on.  foo is a domain name
  // 2. foo - replaces the last part of the path, the whole query and fragment
  // 3. /foo - replaces the the path, the query and fragment
  // 4. ?foo - replace the query and fragment
  // 5. #foo - replace the fragment only

  var absoluteUri = baseUri.clone();
  // we satisfy these conditions by looking for the first part of relativeUri
  // that is not blank and applying defaults to the rest

  var overridden = relativeUri.hasScheme();

  if (overridden) {
    absoluteUri.setRawScheme(relativeUri.getRawScheme());
  } else {
    overridden = relativeUri.hasCredentials();
  }

  if (overridden) {
    absoluteUri.setRawCredentials(relativeUri.getRawCredentials());
  } else {
    overridden = relativeUri.hasDomain();
  }

  if (overridden) {
    absoluteUri.setRawDomain(relativeUri.getRawDomain());
  } else {
    overridden = relativeUri.hasPort();
  }

  var rawPath = relativeUri.getRawPath();
  var simplifiedPath = collapse_dots(rawPath);
  if (overridden) {
    absoluteUri.setPort(relativeUri.getPort());
    simplifiedPath = simplifiedPath
        && simplifiedPath.replace(EXTRA_PARENT_PATHS_RE, '');
  } else {
    overridden = !!rawPath;
    if (overridden) {
      // resolve path properly
      if (simplifiedPath.charCodeAt(0) !== 0x2f /* / */) {  // path is relative
        var absRawPath = collapse_dots(absoluteUri.getRawPath() || '')
            .replace(EXTRA_PARENT_PATHS_RE, '');
        var slash = absRawPath.lastIndexOf('/') + 1;
        simplifiedPath = collapse_dots(
            (slash ? absRawPath.substring(0, slash) : '')
            + collapse_dots(rawPath))
            .replace(EXTRA_PARENT_PATHS_RE, '');
      }
    } else {
      simplifiedPath = simplifiedPath
          && simplifiedPath.replace(EXTRA_PARENT_PATHS_RE, '');
      if (simplifiedPath !== rawPath) {
        absoluteUri.setRawPath(simplifiedPath);
      }
    }
  }

  if (overridden) {
    absoluteUri.setRawPath(simplifiedPath);
  } else {
    overridden = relativeUri.hasQuery();
  }

  if (overridden) {
    absoluteUri.setRawQuery(relativeUri.getRawQuery());
  } else {
    overridden = relativeUri.hasFragment();
  }

  if (overridden) {
    absoluteUri.setRawFragment(relativeUri.getRawFragment());
  }

  return absoluteUri;
}

/**
 * a mutable URI.
 *
 * This class contains setters and getters for the parts of the URI.
 * The <tt>getXYZ</tt>/<tt>setXYZ</tt> methods return the decoded part -- so
 * <code>uri.parse('/foo%20bar').getPath()</code> will return the decoded path,
 * <tt>/foo bar</tt>.
 *
 * <p>The raw versions of fields are available too.
 * <code>uri.parse('/foo%20bar').getRawPath()</code> will return the raw path,
 * <tt>/foo%20bar</tt>.  Use the raw setters with care, since
 * <code>URI::toString</code> is not guaranteed to return a valid url if a
 * raw setter was used.
 *
 * <p>All setters return <tt>this</tt> and so may be chained, a la
 * <code>uri.parse('/foo').setFragment('part').toString()</code>.
 *
 * <p>You should not use this constructor directly -- please prefer the factory
 * functions {@link uri.parse}, {@link uri.create}, {@link uri.resolve}
 * instead.</p>
 *
 * <p>The parameters are all raw (assumed to be properly escaped) parts, and
 * any (but not all) may be null.  Undefined is not allowed.</p>
 *
 * @constructor
 */
function URI(
    rawScheme,
    rawCredentials, rawDomain, port,
    rawPath, rawQuery, rawFragment) {
  this.scheme_ = rawScheme;
  this.credentials_ = rawCredentials;
  this.domain_ = rawDomain;
  this.port_ = port;
  this.path_ = rawPath;
  this.query_ = rawQuery;
  this.fragment_ = rawFragment;
  /**
   * @type {Array|null}
   */
  this.paramCache_ = null;
}

/** returns the string form of the url. */
URI.prototype.toString = function () {
  var out = [];
  if (null !== this.scheme_) { out.push(this.scheme_, ':'); }
  if (null !== this.domain_) {
    out.push('//');
    if (null !== this.credentials_) { out.push(this.credentials_, '@'); }
    out.push(this.domain_);
    if (null !== this.port_) { out.push(':', this.port_.toString()); }
  }
  if (null !== this.path_) { out.push(this.path_); }
  if (null !== this.query_) { out.push('?', this.query_); }
  if (null !== this.fragment_) { out.push('#', this.fragment_); }
  return out.join('');
};

URI.prototype.clone = function () {
  return new URI(this.scheme_, this.credentials_, this.domain_, this.port_,
                 this.path_, this.query_, this.fragment_);
};

URI.prototype.getScheme = function () {
  // HTML5 spec does not require the scheme to be lowercased but
  // all common browsers except Safari lowercase the scheme.
  return this.scheme_ && decodeURIComponent(this.scheme_).toLowerCase();
};
URI.prototype.getRawScheme = function () {
  return this.scheme_;
};
URI.prototype.setScheme = function (newScheme) {
  this.scheme_ = encodeIfExists2(
      newScheme, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_);
  return this;
};
URI.prototype.setRawScheme = function (newScheme) {
  this.scheme_ = newScheme ? newScheme : null;
  return this;
};
URI.prototype.hasScheme = function () {
  return null !== this.scheme_;
};


URI.prototype.getCredentials = function () {
  return this.credentials_ && decodeURIComponent(this.credentials_);
};
URI.prototype.getRawCredentials = function () {
  return this.credentials_;
};
URI.prototype.setCredentials = function (newCredentials) {
  this.credentials_ = encodeIfExists2(
      newCredentials, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_);

  return this;
};
URI.prototype.setRawCredentials = function (newCredentials) {
  this.credentials_ = newCredentials ? newCredentials : null;
  return this;
};
URI.prototype.hasCredentials = function () {
  return null !== this.credentials_;
};


URI.prototype.getDomain = function () {
  return this.domain_ && decodeURIComponent(this.domain_);
};
URI.prototype.getRawDomain = function () {
  return this.domain_;
};
URI.prototype.setDomain = function (newDomain) {
  return this.setRawDomain(newDomain && encodeURIComponent(newDomain));
};
URI.prototype.setRawDomain = function (newDomain) {
  this.domain_ = newDomain ? newDomain : null;
  // Maintain the invariant that paths must start with a slash when the URI
  // is not path-relative.
  return this.setRawPath(this.path_);
};
URI.prototype.hasDomain = function () {
  return null !== this.domain_;
};


URI.prototype.getPort = function () {
  return this.port_ && decodeURIComponent(this.port_);
};
URI.prototype.setPort = function (newPort) {
  if (newPort) {
    newPort = Number(newPort);
    if (newPort !== (newPort & 0xffff)) {
      throw new Error('Bad port number ' + newPort);
    }
    this.port_ = '' + newPort;
  } else {
    this.port_ = null;
  }
  return this;
};
URI.prototype.hasPort = function () {
  return null !== this.port_;
};


URI.prototype.getPath = function () {
  return this.path_ && decodeURIComponent(this.path_);
};
URI.prototype.getRawPath = function () {
  return this.path_;
};
URI.prototype.setPath = function (newPath) {
  return this.setRawPath(encodeIfExists2(newPath, URI_DISALLOWED_IN_PATH_));
};
URI.prototype.setRawPath = function (newPath) {
  if (newPath) {
    newPath = String(newPath);
    this.path_ = 
      // Paths must start with '/' unless this is a path-relative URL.
      (!this.domain_ || /^\//.test(newPath)) ? newPath : '/' + newPath;
  } else {
    this.path_ = null;
  }
  return this;
};
URI.prototype.hasPath = function () {
  return null !== this.path_;
};


URI.prototype.getQuery = function () {
  // From http://www.w3.org/Addressing/URL/4_URI_Recommentations.html
  // Within the query string, the plus sign is reserved as shorthand notation
  // for a space.
  return this.query_ && decodeURIComponent(this.query_).replace(/\+/g, ' ');
};
URI.prototype.getRawQuery = function () {
  return this.query_;
};
URI.prototype.setQuery = function (newQuery) {
  this.paramCache_ = null;
  this.query_ = encodeIfExists(newQuery);
  return this;
};
URI.prototype.setRawQuery = function (newQuery) {
  this.paramCache_ = null;
  this.query_ = newQuery ? newQuery : null;
  return this;
};
URI.prototype.hasQuery = function () {
  return null !== this.query_;
};

/**
 * sets the query given a list of strings of the form
 * [ key0, value0, key1, value1, ... ].
 *
 * <p><code>uri.setAllParameters(['a', 'b', 'c', 'd']).getQuery()</code>
 * will yield <code>'a=b&c=d'</code>.
 */
URI.prototype.setAllParameters = function (params) {
  if (typeof params === 'object') {
    if (!(params instanceof Array)
        && (params instanceof Object
            || Object.prototype.toString.call(params) !== '[object Array]')) {
      var newParams = [];
      var i = -1;
      for (var k in params) {
        var v = params[k];
        if ('string' === typeof v) {
          newParams[++i] = k;
          newParams[++i] = v;
        }
      }
      params = newParams;
    }
  }
  this.paramCache_ = null;
  var queryBuf = [];
  var separator = '';
  for (var j = 0; j < params.length;) {
    var k = params[j++];
    var v = params[j++];
    queryBuf.push(separator, encodeURIComponent(k.toString()));
    separator = '&';
    if (v) {
      queryBuf.push('=', encodeURIComponent(v.toString()));
    }
  }
  this.query_ = queryBuf.join('');
  return this;
};
URI.prototype.checkParameterCache_ = function () {
  if (!this.paramCache_) {
    var q = this.query_;
    if (!q) {
      this.paramCache_ = [];
    } else {
      var cgiParams = q.split(/[&\?]/);
      var out = [];
      var k = -1;
      for (var i = 0; i < cgiParams.length; ++i) {
        var m = cgiParams[i].match(/^([^=]*)(?:=(.*))?$/);
        // From http://www.w3.org/Addressing/URL/4_URI_Recommentations.html
        // Within the query string, the plus sign is reserved as shorthand
        // notation for a space.
        out[++k] = decodeURIComponent(m[1]).replace(/\+/g, ' ');
        out[++k] = decodeURIComponent(m[2] || '').replace(/\+/g, ' ');
      }
      this.paramCache_ = out;
    }
  }
};
/**
 * sets the values of the named cgi parameters.
 *
 * <p>So, <code>uri.parse('foo?a=b&c=d&e=f').setParameterValues('c', ['new'])
 * </code> yields <tt>foo?a=b&c=new&e=f</tt>.</p>
 *
 * @param key {string}
 * @param values {Array.<string>} the new values.  If values is a single string
 *   then it will be treated as the sole value.
 */
URI.prototype.setParameterValues = function (key, values) {
  // be nice and avoid subtle bugs where [] operator on string performs charAt
  // on some browsers and crashes on IE
  if (typeof values === 'string') {
    values = [ values ];
  }

  this.checkParameterCache_();
  var newValueIndex = 0;
  var pc = this.paramCache_;
  var params = [];
  for (var i = 0, k = 0; i < pc.length; i += 2) {
    if (key === pc[i]) {
      if (newValueIndex < values.length) {
        params.push(key, values[newValueIndex++]);
      }
    } else {
      params.push(pc[i], pc[i + 1]);
    }
  }
  while (newValueIndex < values.length) {
    params.push(key, values[newValueIndex++]);
  }
  this.setAllParameters(params);
  return this;
};
URI.prototype.removeParameter = function (key) {
  return this.setParameterValues(key, []);
};
/**
 * returns the parameters specified in the query part of the uri as a list of
 * keys and values like [ key0, value0, key1, value1, ... ].
 *
 * @return {Array.<string>}
 */
URI.prototype.getAllParameters = function () {
  this.checkParameterCache_();
  return this.paramCache_.slice(0, this.paramCache_.length);
};
/**
 * returns the value<b>s</b> for a given cgi parameter as a list of decoded
 * query parameter values.
 * @return {Array.<string>}
 */
URI.prototype.getParameterValues = function (paramNameUnescaped) {
  this.checkParameterCache_();
  var values = [];
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    if (paramNameUnescaped === this.paramCache_[i]) {
      values.push(this.paramCache_[i + 1]);
    }
  }
  return values;
};
/**
 * returns a map of cgi parameter names to (non-empty) lists of values.
 * @return {Object.<string,Array.<string>>}
 */
URI.prototype.getParameterMap = function (paramNameUnescaped) {
  this.checkParameterCache_();
  var paramMap = {};
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    var key = this.paramCache_[i++],
      value = this.paramCache_[i++];
    if (!(key in paramMap)) {
      paramMap[key] = [value];
    } else {
      paramMap[key].push(value);
    }
  }
  return paramMap;
};
/**
 * returns the first value for a given cgi parameter or null if the given
 * parameter name does not appear in the query string.
 * If the given parameter name does appear, but has no '<tt>=</tt>' following
 * it, then the empty string will be returned.
 * @return {string|null}
 */
URI.prototype.getParameterValue = function (paramNameUnescaped) {
  this.checkParameterCache_();
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    if (paramNameUnescaped === this.paramCache_[i]) {
      return this.paramCache_[i + 1];
    }
  }
  return null;
};

URI.prototype.getFragment = function () {
  return this.fragment_ && decodeURIComponent(this.fragment_);
};
URI.prototype.getRawFragment = function () {
  return this.fragment_;
};
URI.prototype.setFragment = function (newFragment) {
  this.fragment_ = newFragment ? encodeURIComponent(newFragment) : null;
  return this;
};
URI.prototype.setRawFragment = function (newFragment) {
  this.fragment_ = newFragment ? newFragment : null;
  return this;
};
URI.prototype.hasFragment = function () {
  return null !== this.fragment_;
};

function nullIfAbsent(matchPart) {
  return ('string' == typeof matchPart) && (matchPart.length > 0)
         ? matchPart
         : null;
}




/**
 * a regular expression for breaking a URI into its component parts.
 *
 * <p>http://www.gbiv.com/protocols/uri/rfc/rfc3986.html#RFC2234 says
 * As the "first-match-wins" algorithm is identical to the "greedy"
 * disambiguation method used by POSIX regular expressions, it is natural and
 * commonplace to use a regular expression for parsing the potential five
 * components of a URI reference.
 *
 * <p>The following line is the regular expression for breaking-down a
 * well-formed URI reference into its components.
 *
 * <pre>
 * ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
 *  12            3  4          5       6  7        8 9
 * </pre>
 *
 * <p>The numbers in the second line above are only to assist readability; they
 * indicate the reference points for each subexpression (i.e., each paired
 * parenthesis). We refer to the value matched for subexpression <n> as $<n>.
 * For example, matching the above expression to
 * <pre>
 *     http://www.ics.uci.edu/pub/ietf/uri/#Related
 * </pre>
 * results in the following subexpression matches:
 * <pre>
 *    $1 = http:
 *    $2 = http
 *    $3 = //www.ics.uci.edu
 *    $4 = www.ics.uci.edu
 *    $5 = /pub/ietf/uri/
 *    $6 = <undefined>
 *    $7 = <undefined>
 *    $8 = #Related
 *    $9 = Related
 * </pre>
 * where <undefined> indicates that the component is not present, as is the
 * case for the query component in the above example. Therefore, we can
 * determine the value of the five components as
 * <pre>
 *    scheme    = $2
 *    authority = $4
 *    path      = $5
 *    query     = $7
 *    fragment  = $9
 * </pre>
 *
 * <p>msamuel: I have modified the regular expression slightly to expose the
 * credentials, domain, and port separately from the authority.
 * The modified version yields
 * <pre>
 *    $1 = http              scheme
 *    $2 = <undefined>       credentials -\
 *    $3 = www.ics.uci.edu   domain       | authority
 *    $4 = <undefined>       port        -/
 *    $5 = /pub/ietf/uri/    path
 *    $6 = <undefined>       query without ?
 *    $7 = Related           fragment without #
 * </pre>
 */
var URI_RE_ = new RegExp(
      "^" +
      "(?:" +
        "([^:/?#]+)" +         // scheme
      ":)?" +
      "(?://" +
        "(?:([^/?#]*)@)?" +    // credentials
        "([^/?#:@]*)" +        // domain
        "(?::([0-9]+))?" +     // port
      ")?" +
      "([^?#]+)?" +            // path
      "(?:\\?([^#]*))?" +      // query
      "(?:#(.*))?" +           // fragment
      "$"
      );

var URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_ = /[#\/\?@]/g;
var URI_DISALLOWED_IN_PATH_ = /[\#\?]/g;

URI.parse = parse;
URI.create = create;
URI.resolve = resolve;
URI.collapse_dots = collapse_dots;  // Visible for testing.

// lightweight string-based api for loadModuleMaker
URI.utils = {
  mimeTypeOf: function (uri) {
    var uriObj = parse(uri);
    if (/\.html$/.test(uriObj.getPath())) {
      return 'text/html';
    } else {
      return 'application/javascript';
    }
  },
  resolve: function (base, uri) {
    if (base) {
      return resolve(parse(base), parse(uri)).toString();
    } else {
      return '' + uri;
    }
  }
};


return URI;
})();

// Copyright Google Inc.
// Licensed under the Apache Licence Version 2.0
// Autogenerated at Mon Feb 25 13:05:42 EST 2013
// @overrides window
// @provides html4
var html4 = {};
html4.atype = {
  'NONE': 0,
  'URI': 1,
  'URI_FRAGMENT': 11,
  'SCRIPT': 2,
  'STYLE': 3,
  'HTML': 12,
  'ID': 4,
  'IDREF': 5,
  'IDREFS': 6,
  'GLOBAL_NAME': 7,
  'LOCAL_NAME': 8,
  'CLASSES': 9,
  'FRAME_TARGET': 10,
  'MEDIA_QUERY': 13
};
html4[ 'atype' ] = html4.atype;
html4.ATTRIBS = {
  '*::class': 9,
  '*::dir': 0,
  '*::draggable': 0,
  '*::hidden': 0,
  '*::id': 4,
  '*::inert': 0,
  '*::itemprop': 0,
  '*::itemref': 6,
  '*::itemscope': 0,
  '*::lang': 0,
  '*::onblur': 2,
  '*::onchange': 2,
  '*::onclick': 2,
  '*::ondblclick': 2,
  '*::onfocus': 2,
  '*::onkeydown': 2,
  '*::onkeypress': 2,
  '*::onkeyup': 2,
  '*::onload': 2,
  '*::onmousedown': 2,
  '*::onmousemove': 2,
  '*::onmouseout': 2,
  '*::onmouseover': 2,
  '*::onmouseup': 2,
  '*::onreset': 2,
  '*::onscroll': 2,
  '*::onselect': 2,
  '*::onsubmit': 2,
  '*::onunload': 2,
  '*::spellcheck': 0,
  '*::style': 3,
  '*::title': 0,
  '*::translate': 0,
  'a::accesskey': 0,
  'a::coords': 0,
  'a::href': 1,
  'a::hreflang': 0,
  'a::name': 7,
  'a::onblur': 2,
  'a::onfocus': 2,
  'a::shape': 0,
  'a::tabindex': 0,
  'a::target': 10,
  'a::type': 0,
  'area::accesskey': 0,
  'area::alt': 0,
  'area::coords': 0,
  'area::href': 1,
  'area::nohref': 0,
  'area::onblur': 2,
  'area::onfocus': 2,
  'area::shape': 0,
  'area::tabindex': 0,
  'area::target': 10,
  'audio::controls': 0,
  'audio::loop': 0,
  'audio::mediagroup': 5,
  'audio::muted': 0,
  'audio::preload': 0,
  'bdo::dir': 0,
  'blockquote::cite': 1,
  'br::clear': 0,
  'button::accesskey': 0,
  'button::disabled': 0,
  'button::name': 8,
  'button::onblur': 2,
  'button::onfocus': 2,
  'button::tabindex': 0,
  'button::type': 0,
  'button::value': 0,
  'canvas::height': 0,
  'canvas::width': 0,
  'caption::align': 0,
  'col::align': 0,
  'col::char': 0,
  'col::charoff': 0,
  'col::span': 0,
  'col::valign': 0,
  'col::width': 0,
  'colgroup::align': 0,
  'colgroup::char': 0,
  'colgroup::charoff': 0,
  'colgroup::span': 0,
  'colgroup::valign': 0,
  'colgroup::width': 0,
  'command::checked': 0,
  'command::command': 5,
  'command::disabled': 0,
  'command::icon': 1,
  'command::label': 0,
  'command::radiogroup': 0,
  'command::type': 0,
  'data::value': 0,
  'del::cite': 1,
  'del::datetime': 0,
  'details::open': 0,
  'dir::compact': 0,
  'div::align': 0,
  'dl::compact': 0,
  'fieldset::disabled': 0,
  'font::color': 0,
  'font::face': 0,
  'font::size': 0,
  'form::accept': 0,
  'form::action': 1,
  'form::autocomplete': 0,
  'form::enctype': 0,
  'form::method': 0,
  'form::name': 7,
  'form::novalidate': 0,
  'form::onreset': 2,
  'form::onsubmit': 2,
  'form::target': 10,
  'h1::align': 0,
  'h2::align': 0,
  'h3::align': 0,
  'h4::align': 0,
  'h5::align': 0,
  'h6::align': 0,
  'hr::align': 0,
  'hr::noshade': 0,
  'hr::size': 0,
  'hr::width': 0,
  'iframe::align': 0,
  'iframe::frameborder': 0,
  'iframe::height': 0,
  'iframe::marginheight': 0,
  'iframe::marginwidth': 0,
  'iframe::width': 0,
  'img::align': 0,
  'img::alt': 0,
  'img::border': 0,
  'img::height': 0,
  'img::hspace': 0,
  'img::ismap': 0,
  'img::name': 7,
  'img::src': 1,
  'img::usemap': 11,
  'img::vspace': 0,
  'img::width': 0,
  'input::accept': 0,
  'input::accesskey': 0,
  'input::align': 0,
  'input::alt': 0,
  'input::autocomplete': 0,
  'input::checked': 0,
  'input::disabled': 0,
  'input::inputmode': 0,
  'input::ismap': 0,
  'input::list': 5,
  'input::max': 0,
  'input::maxlength': 0,
  'input::min': 0,
  'input::multiple': 0,
  'input::name': 8,
  'input::onblur': 2,
  'input::onchange': 2,
  'input::onfocus': 2,
  'input::onselect': 2,
  'input::placeholder': 0,
  'input::readonly': 0,
  'input::required': 0,
  'input::size': 0,
  'input::src': 1,
  'input::step': 0,
  'input::tabindex': 0,
  'input::type': 0,
  'input::usemap': 11,
  'input::value': 0,
  'ins::cite': 1,
  'ins::datetime': 0,
  'label::accesskey': 0,
  'label::for': 5,
  'label::onblur': 2,
  'label::onfocus': 2,
  'legend::accesskey': 0,
  'legend::align': 0,
  'li::type': 0,
  'li::value': 0,
  'map::name': 7,
  'menu::compact': 0,
  'menu::label': 0,
  'menu::type': 0,
  'meter::high': 0,
  'meter::low': 0,
  'meter::max': 0,
  'meter::min': 0,
  'meter::value': 0,
  'ol::compact': 0,
  'ol::reversed': 0,
  'ol::start': 0,
  'ol::type': 0,
  'optgroup::disabled': 0,
  'optgroup::label': 0,
  'option::disabled': 0,
  'option::label': 0,
  'option::selected': 0,
  'option::value': 0,
  'output::for': 6,
  'output::name': 8,
  'p::align': 0,
  'pre::width': 0,
  'progress::max': 0,
  'progress::min': 0,
  'progress::value': 0,
  'q::cite': 1,
  'select::autocomplete': 0,
  'select::disabled': 0,
  'select::multiple': 0,
  'select::name': 8,
  'select::onblur': 2,
  'select::onchange': 2,
  'select::onfocus': 2,
  'select::required': 0,
  'select::size': 0,
  'select::tabindex': 0,
  'source::type': 0,
  'table::align': 0,
  'table::bgcolor': 0,
  'table::border': 0,
  'table::cellpadding': 0,
  'table::cellspacing': 0,
  'table::frame': 0,
  'table::rules': 0,
  'table::summary': 0,
  'table::width': 0,
  'tbody::align': 0,
  'tbody::char': 0,
  'tbody::charoff': 0,
  'tbody::valign': 0,
  'td::abbr': 0,
  'td::align': 0,
  'td::axis': 0,
  'td::bgcolor': 0,
  'td::char': 0,
  'td::charoff': 0,
  'td::colspan': 0,
  'td::headers': 6,
  'td::height': 0,
  'td::nowrap': 0,
  'td::rowspan': 0,
  'td::scope': 0,
  'td::valign': 0,
  'td::width': 0,
  'textarea::accesskey': 0,
  'textarea::autocomplete': 0,
  'textarea::cols': 0,
  'textarea::disabled': 0,
  'textarea::inputmode': 0,
  'textarea::name': 8,
  'textarea::onblur': 2,
  'textarea::onchange': 2,
  'textarea::onfocus': 2,
  'textarea::onselect': 2,
  'textarea::placeholder': 0,
  'textarea::readonly': 0,
  'textarea::required': 0,
  'textarea::rows': 0,
  'textarea::tabindex': 0,
  'textarea::wrap': 0,
  'tfoot::align': 0,
  'tfoot::char': 0,
  'tfoot::charoff': 0,
  'tfoot::valign': 0,
  'th::abbr': 0,
  'th::align': 0,
  'th::axis': 0,
  'th::bgcolor': 0,
  'th::char': 0,
  'th::charoff': 0,
  'th::colspan': 0,
  'th::headers': 6,
  'th::height': 0,
  'th::nowrap': 0,
  'th::rowspan': 0,
  'th::scope': 0,
  'th::valign': 0,
  'th::width': 0,
  'thead::align': 0,
  'thead::char': 0,
  'thead::charoff': 0,
  'thead::valign': 0,
  'tr::align': 0,
  'tr::bgcolor': 0,
  'tr::char': 0,
  'tr::charoff': 0,
  'tr::valign': 0,
  'track::default': 0,
  'track::kind': 0,
  'track::label': 0,
  'track::srclang': 0,
  'ul::compact': 0,
  'ul::type': 0,
  'video::controls': 0,
  'video::height': 0,
  'video::loop': 0,
  'video::mediagroup': 5,
  'video::muted': 0,
  'video::poster': 1,
  'video::preload': 0,
  'video::width': 0
};
html4[ 'ATTRIBS' ] = html4.ATTRIBS;
html4.eflags = {
  'OPTIONAL_ENDTAG': 1,
  'EMPTY': 2,
  'CDATA': 4,
  'RCDATA': 8,
  'UNSAFE': 16,
  'FOLDABLE': 32,
  'SCRIPT': 64,
  'STYLE': 128,
  'VIRTUALIZED': 256
};
html4[ 'eflags' ] = html4.eflags;
html4.ELEMENTS = {
  'a': 0,
  'abbr': 0,
  'acronym': 0,
  'address': 0,
  'applet': 272,
  'area': 2,
  'article': 0,
  'aside': 0,
  'audio': 0,
  'b': 0,
  'base': 274,
  'basefont': 274,
  'bdi': 0,
  'bdo': 0,
  'big': 0,
  'blockquote': 0,
  'body': 305,
  'br': 2,
  'button': 0,
  'canvas': 0,
  'caption': 0,
  'center': 0,
  'cite': 0,
  'code': 0,
  'col': 2,
  'colgroup': 1,
  'command': 2,
  'data': 0,
  'datalist': 0,
  'dd': 1,
  'del': 0,
  'details': 0,
  'dfn': 0,
  'dialog': 272,
  'dir': 0,
  'div': 0,
  'dl': 0,
  'dt': 1,
  'em': 0,
  'fieldset': 0,
  'figcaption': 0,
  'figure': 0,
  'font': 0,
  'footer': 0,
  'form': 0,
  'frame': 274,
  'frameset': 272,
  'h1': 0,
  'h2': 0,
  'h3': 0,
  'h4': 0,
  'h5': 0,
  'h6': 0,
  'head': 305,
  'header': 0,
  'hgroup': 0,
  'hr': 2,
  'html': 305,
  'i': 0,
  'iframe': 4,
  'img': 2,
  'input': 2,
  'ins': 0,
  'isindex': 274,
  'kbd': 0,
  'keygen': 274,
  'label': 0,
  'legend': 0,
  'li': 1,
  'link': 274,
  'map': 0,
  'mark': 0,
  'menu': 0,
  'meta': 274,
  'meter': 0,
  'nav': 0,
  'nobr': 0,
  'noembed': 276,
  'noframes': 276,
  'noscript': 276,
  'object': 272,
  'ol': 0,
  'optgroup': 0,
  'option': 1,
  'output': 0,
  'p': 1,
  'param': 274,
  'pre': 0,
  'progress': 0,
  'q': 0,
  's': 0,
  'samp': 0,
  'script': 84,
  'section': 0,
  'select': 0,
  'small': 0,
  'source': 2,
  'span': 0,
  'strike': 0,
  'strong': 0,
  'style': 148,
  'sub': 0,
  'summary': 0,
  'sup': 0,
  'table': 0,
  'tbody': 1,
  'td': 1,
  'textarea': 8,
  'tfoot': 1,
  'th': 1,
  'thead': 1,
  'time': 0,
  'title': 280,
  'tr': 1,
  'track': 2,
  'tt': 0,
  'u': 0,
  'ul': 0,
  'var': 0,
  'video': 0,
  'wbr': 2
};
html4[ 'ELEMENTS' ] = html4.ELEMENTS;
html4.ELEMENT_DOM_INTERFACES = {
  'a': 'HTMLAnchorElement',
  'abbr': 'HTMLElement',
  'acronym': 'HTMLElement',
  'address': 'HTMLElement',
  'applet': 'HTMLAppletElement',
  'area': 'HTMLAreaElement',
  'article': 'HTMLElement',
  'aside': 'HTMLElement',
  'audio': 'HTMLAudioElement',
  'b': 'HTMLElement',
  'base': 'HTMLBaseElement',
  'basefont': 'HTMLBaseFontElement',
  'bdi': 'HTMLElement',
  'bdo': 'HTMLElement',
  'big': 'HTMLElement',
  'blockquote': 'HTMLQuoteElement',
  'body': 'HTMLBodyElement',
  'br': 'HTMLBRElement',
  'button': 'HTMLButtonElement',
  'canvas': 'HTMLCanvasElement',
  'caption': 'HTMLTableCaptionElement',
  'center': 'HTMLElement',
  'cite': 'HTMLElement',
  'code': 'HTMLElement',
  'col': 'HTMLTableColElement',
  'colgroup': 'HTMLTableColElement',
  'command': 'HTMLCommandElement',
  'data': 'HTMLElement',
  'datalist': 'HTMLDataListElement',
  'dd': 'HTMLElement',
  'del': 'HTMLModElement',
  'details': 'HTMLDetailsElement',
  'dfn': 'HTMLElement',
  'dialog': 'HTMLDialogElement',
  'dir': 'HTMLDirectoryElement',
  'div': 'HTMLDivElement',
  'dl': 'HTMLDListElement',
  'dt': 'HTMLElement',
  'em': 'HTMLElement',
  'fieldset': 'HTMLFieldSetElement',
  'figcaption': 'HTMLElement',
  'figure': 'HTMLElement',
  'font': 'HTMLFontElement',
  'footer': 'HTMLElement',
  'form': 'HTMLFormElement',
  'frame': 'HTMLFrameElement',
  'frameset': 'HTMLFrameSetElement',
  'h1': 'HTMLHeadingElement',
  'h2': 'HTMLHeadingElement',
  'h3': 'HTMLHeadingElement',
  'h4': 'HTMLHeadingElement',
  'h5': 'HTMLHeadingElement',
  'h6': 'HTMLHeadingElement',
  'head': 'HTMLHeadElement',
  'header': 'HTMLElement',
  'hgroup': 'HTMLElement',
  'hr': 'HTMLHRElement',
  'html': 'HTMLHtmlElement',
  'i': 'HTMLElement',
  'iframe': 'HTMLIFrameElement',
  'img': 'HTMLImageElement',
  'input': 'HTMLInputElement',
  'ins': 'HTMLModElement',
  'isindex': 'HTMLUnknownElement',
  'kbd': 'HTMLElement',
  'keygen': 'HTMLKeygenElement',
  'label': 'HTMLLabelElement',
  'legend': 'HTMLLegendElement',
  'li': 'HTMLLIElement',
  'link': 'HTMLLinkElement',
  'map': 'HTMLMapElement',
  'mark': 'HTMLElement',
  'menu': 'HTMLMenuElement',
  'meta': 'HTMLMetaElement',
  'meter': 'HTMLMeterElement',
  'nav': 'HTMLElement',
  'nobr': 'HTMLElement',
  'noembed': 'HTMLElement',
  'noframes': 'HTMLElement',
  'noscript': 'HTMLElement',
  'object': 'HTMLObjectElement',
  'ol': 'HTMLOListElement',
  'optgroup': 'HTMLOptGroupElement',
  'option': 'HTMLOptionElement',
  'output': 'HTMLOutputElement',
  'p': 'HTMLParagraphElement',
  'param': 'HTMLParamElement',
  'pre': 'HTMLPreElement',
  'progress': 'HTMLProgressElement',
  'q': 'HTMLQuoteElement',
  's': 'HTMLElement',
  'samp': 'HTMLElement',
  'script': 'HTMLScriptElement',
  'section': 'HTMLElement',
  'select': 'HTMLSelectElement',
  'small': 'HTMLElement',
  'source': 'HTMLSourceElement',
  'span': 'HTMLSpanElement',
  'strike': 'HTMLElement',
  'strong': 'HTMLElement',
  'style': 'HTMLStyleElement',
  'sub': 'HTMLElement',
  'summary': 'HTMLElement',
  'sup': 'HTMLElement',
  'table': 'HTMLTableElement',
  'tbody': 'HTMLTableSectionElement',
  'td': 'HTMLTableDataCellElement',
  'textarea': 'HTMLTextAreaElement',
  'tfoot': 'HTMLTableSectionElement',
  'th': 'HTMLTableHeaderCellElement',
  'thead': 'HTMLTableSectionElement',
  'time': 'HTMLTimeElement',
  'title': 'HTMLTitleElement',
  'tr': 'HTMLTableRowElement',
  'track': 'HTMLTrackElement',
  'tt': 'HTMLElement',
  'u': 'HTMLElement',
  'ul': 'HTMLUListElement',
  'var': 'HTMLElement',
  'video': 'HTMLVideoElement',
  'wbr': 'HTMLElement'
};
html4[ 'ELEMENT_DOM_INTERFACES' ] = html4.ELEMENT_DOM_INTERFACES;
html4.ueffects = {
  'NOT_LOADED': 0,
  'SAME_DOCUMENT': 1,
  'NEW_DOCUMENT': 2
};
html4[ 'ueffects' ] = html4.ueffects;
html4.URIEFFECTS = {
  'a::href': 2,
  'area::href': 2,
  'blockquote::cite': 0,
  'command::icon': 1,
  'del::cite': 0,
  'form::action': 2,
  'img::src': 1,
  'input::src': 1,
  'ins::cite': 0,
  'q::cite': 0,
  'video::poster': 1
};
html4[ 'URIEFFECTS' ] = html4.URIEFFECTS;
html4.ltypes = {
  'UNSANDBOXED': 2,
  'SANDBOXED': 1,
  'DATA': 0
};
html4[ 'ltypes' ] = html4.ltypes;
html4.LOADERTYPES = {
  'a::href': 2,
  'area::href': 2,
  'blockquote::cite': 2,
  'command::icon': 1,
  'del::cite': 2,
  'form::action': 2,
  'img::src': 1,
  'input::src': 1,
  'ins::cite': 2,
  'q::cite': 2,
  'video::poster': 1
};
html4[ 'LOADERTYPES' ] = html4.LOADERTYPES;

// Copyright (C) 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 * An HTML sanitizer that can satisfy a variety of security policies.
 *
 * <p>
 * The HTML sanitizer is built around a SAX parser and HTML element and
 * attributes schemas.
 *
 * If the cssparser is loaded, inline styles are sanitized using the
 * css property and value schemas.  Else they are remove during
 * sanitization.
 *
 * If it exists, uses parseCssDeclarations, sanitizeCssProperty,  cssSchema
 *
 * @author mikesamuel@gmail.com
 * @author jasvir@gmail.com
 * \@requires html4, URI
 * \@overrides window
 * \@provides html, html_sanitize
 */

// The Turkish i seems to be a non-issue, but abort in case it is.
if ('I'.toLowerCase() !== 'i') { throw 'I/i problem'; }

/**
 * \@namespace
 */
var html = (function(html4) {

  // For closure compiler
  var parseCssDeclarations, sanitizeCssProperty, cssSchema;
  if ('undefined' !== typeof window) {
    parseCssDeclarations = window['parseCssDeclarations'];
    sanitizeCssProperty = window['sanitizeCssProperty'];
    cssSchema = window['cssSchema'];
  }

  // The keys of this object must be 'quoted' or JSCompiler will mangle them!
  // This is a partial list -- lookupEntity() uses the host browser's parser
  // (when available) to implement full entity lookup.
  // Note that entities are in general case-sensitive; the uppercase ones are
  // explicitly defined by HTML5 (presumably as compatibility).
  var ENTITIES = {
    'lt': '<',
    'LT': '<',
    'gt': '>',
    'GT': '>',
    'amp': '&',
    'AMP': '&',
    'quot': '"',
    'apos': '\'',
    'nbsp': '\240'
  };

  // Patterns for types of entity/character reference names.
  var decimalEscapeRe = /^#(\d+)$/;
  var hexEscapeRe = /^#x([0-9A-Fa-f]+)$/;
  // contains every entity per http://www.w3.org/TR/2011/WD-html5-20110113/named-character-references.html
  var safeEntityNameRe = /^[A-Za-z][A-za-z0-9]+$/;
  // Used as a hook to invoke the browser's entity parsing. <textarea> is used
  // because its content is parsed for entities but not tags.
  // TODO(kpreid): This retrieval is a kludge and leads to silent loss of
  // functionality if the document isn't available.
  var entityLookupElement =
      ('undefined' !== typeof window && window['document'])
          ? window['document'].createElement('textarea') : null;
  /**
   * Decodes an HTML entity.
   *
   * {\@updoc
   * $ lookupEntity('lt')
   * # '<'
   * $ lookupEntity('GT')
   * # '>'
   * $ lookupEntity('amp')
   * # '&'
   * $ lookupEntity('nbsp')
   * # '\xA0'
   * $ lookupEntity('apos')
   * # "'"
   * $ lookupEntity('quot')
   * # '"'
   * $ lookupEntity('#xa')
   * # '\n'
   * $ lookupEntity('#10')
   * # '\n'
   * $ lookupEntity('#x0a')
   * # '\n'
   * $ lookupEntity('#010')
   * # '\n'
   * $ lookupEntity('#x00A')
   * # '\n'
   * $ lookupEntity('Pi')      // Known failure
   * # '\u03A0'
   * $ lookupEntity('pi')      // Known failure
   * # '\u03C0'
   * }
   *
   * @param {string} name the content between the '&' and the ';'.
   * @return {string} a single unicode code-point as a string.
   */
  function lookupEntity(name) {
    // TODO: entity lookup as specified by HTML5 actually depends on the
    // presence of the ";".
    if (ENTITIES.hasOwnProperty(name)) { return ENTITIES[name]; }
    var m = name.match(decimalEscapeRe);
    if (m) {
      return String.fromCharCode(parseInt(m[1], 10));
    } else if (!!(m = name.match(hexEscapeRe))) {
      return String.fromCharCode(parseInt(m[1], 16));
    } else if (entityLookupElement && safeEntityNameRe.test(name)) {
      entityLookupElement.innerHTML = '&' + name + ';';
      var text = entityLookupElement.textContent;
      ENTITIES[name] = text;
      return text;
    } else {
      return '&' + name + ';';
    }
  }

  function decodeOneEntity(_, name) {
    return lookupEntity(name);
  }

  var nulRe = /\0/g;
  function stripNULs(s) {
    return s.replace(nulRe, '');
  }

  var ENTITY_RE_1 = /&(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/g;
  var ENTITY_RE_2 = /^(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/;
  /**
   * The plain text of a chunk of HTML CDATA which possibly containing.
   *
   * {\@updoc
   * $ unescapeEntities('')
   * # ''
   * $ unescapeEntities('hello World!')
   * # 'hello World!'
   * $ unescapeEntities('1 &lt; 2 &amp;&AMP; 4 &gt; 3&#10;')
   * # '1 < 2 && 4 > 3\n'
   * $ unescapeEntities('&lt;&lt <- unfinished entity&gt;')
   * # '<&lt <- unfinished entity>'
   * $ unescapeEntities('/foo?bar=baz&copy=true')  // & often unescaped in URLS
   * # '/foo?bar=baz&copy=true'
   * $ unescapeEntities('pi=&pi;&#x3c0;, Pi=&Pi;\u03A0') // FIXME: known failure
   * # 'pi=\u03C0\u03c0, Pi=\u03A0\u03A0'
   * }
   *
   * @param {string} s a chunk of HTML CDATA.  It must not start or end inside
   *     an HTML entity.
   */
  function unescapeEntities(s) {
    return s.replace(ENTITY_RE_1, decodeOneEntity);
  }

  var ampRe = /&/g;
  var looseAmpRe = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/gi;
  var ltRe = /[<]/g;
  var gtRe = />/g;
  var quotRe = /\"/g;

  /**
   * Escapes HTML special characters in attribute values.
   *
   * {\@updoc
   * $ escapeAttrib('')
   * # ''
   * $ escapeAttrib('"<<&==&>>"')  // Do not just escape the first occurrence.
   * # '&#34;&lt;&lt;&amp;&#61;&#61;&amp;&gt;&gt;&#34;'
   * $ escapeAttrib('Hello <World>!')
   * # 'Hello &lt;World&gt;!'
   * }
   */
  function escapeAttrib(s) {
    return ('' + s).replace(ampRe, '&amp;').replace(ltRe, '&lt;')
        .replace(gtRe, '&gt;').replace(quotRe, '&#34;');
  }

  /**
   * Escape entities in RCDATA that can be escaped without changing the meaning.
   * {\@updoc
   * $ normalizeRCData('1 < 2 &&amp; 3 > 4 &amp;& 5 &lt; 7&8')
   * # '1 &lt; 2 &amp;&amp; 3 &gt; 4 &amp;&amp; 5 &lt; 7&amp;8'
   * }
   */
  function normalizeRCData(rcdata) {
    return rcdata
        .replace(looseAmpRe, '&amp;$1')
        .replace(ltRe, '&lt;')
        .replace(gtRe, '&gt;');
  }

  // TODO(felix8a): validate sanitizer regexs against the HTML5 grammar at
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html

  // We initially split input so that potentially meaningful characters
  // like '<' and '>' are separate tokens, using a fast dumb process that
  // ignores quoting.  Then we walk that token stream, and when we see a
  // '<' that's the start of a tag, we use ATTR_RE to extract tag
  // attributes from the next token.  That token will never have a '>'
  // character.  However, it might have an unbalanced quote character, and
  // when we see that, we combine additional tokens to balance the quote.

  var ATTR_RE = new RegExp(
    '^\\s*' +
    '([-.:\\w]+)' +             // 1 = Attribute name
    '(?:' + (
      '\\s*(=)\\s*' +           // 2 = Is there a value?
      '(' + (                   // 3 = Attribute value
        // TODO(felix8a): maybe use backref to match quotes
        '(\")[^\"]*(\"|$)' +    // 4, 5 = Double-quoted string
        '|' +
        '(\')[^\']*(\'|$)' +    // 6, 7 = Single-quoted string
        '|' +
        // Positive lookahead to prevent interpretation of
        // <foo a= b=c> as <foo a='b=c'>
        // TODO(felix8a): might be able to drop this case
        '(?=[a-z][-\\w]*\\s*=)' +
        '|' +
        // Unquoted value that isn't an attribute name
        // (since we didn't match the positive lookahead above)
        '[^\"\'\\s]*' ) +
      ')' ) +
    ')?',
    'i');

  // false on IE<=8, true on most other browsers
  var splitWillCapture = ('a,b'.split(/(,)/).length === 3);

  // bitmask for tags with special parsing, like <script> and <textarea>
  var EFLAGS_TEXT = html4.eflags['CDATA'] | html4.eflags['RCDATA'];

  /**
   * Given a SAX-like event handler, produce a function that feeds those
   * events and a parameter to the event handler.
   *
   * The event handler has the form:{@code
   * {
   *   // Name is an upper-case HTML tag name.  Attribs is an array of
   *   // alternating upper-case attribute names, and attribute values.  The
   *   // attribs array is reused by the parser.  Param is the value passed to
   *   // the saxParser.
   *   startTag: function (name, attribs, param) { ... },
   *   endTag:   function (name, param) { ... },
   *   pcdata:   function (text, param) { ... },
   *   rcdata:   function (text, param) { ... },
   *   cdata:    function (text, param) { ... },
   *   startDoc: function (param) { ... },
   *   endDoc:   function (param) { ... }
   * }}
   *
   * @param {Object} handler a record containing event handlers.
   * @return {function(string, Object)} A function that takes a chunk of HTML
   *     and a parameter.  The parameter is passed on to the handler methods.
   */
  function makeSaxParser(handler) {
    // Accept quoted or unquoted keys (Closure compat)
    var hcopy = {
      cdata: handler.cdata || handler['cdata'],
      comment: handler.comment || handler['comment'],
      endDoc: handler.endDoc || handler['endDoc'],
      endTag: handler.endTag || handler['endTag'],
      pcdata: handler.pcdata || handler['pcdata'],
      rcdata: handler.rcdata || handler['rcdata'],
      startDoc: handler.startDoc || handler['startDoc'],
      startTag: handler.startTag || handler['startTag']
    };
    return function(htmlText, param) {
      return parse(htmlText, hcopy, param);
    };
  }

  // Parsing strategy is to split input into parts that might be lexically
  // meaningful (every ">" becomes a separate part), and then recombine
  // parts if we discover they're in a different context.

  // TODO(felix8a): Significant performance regressions from -legacy,
  // tested on
  //    Chrome 18.0
  //    Firefox 11.0
  //    IE 6, 7, 8, 9
  //    Opera 11.61
  //    Safari 5.1.3
  // Many of these are unusual patterns that are linearly slower and still
  // pretty fast (eg 1ms to 5ms), so not necessarily worth fixing.

  // TODO(felix8a): "<script> && && && ... <\/script>" is slower on all
  // browsers.  The hotspot is htmlSplit.

  // TODO(felix8a): "<p title='>>>>...'><\/p>" is slower on all browsers.
  // This is partly htmlSplit, but the hotspot is parseTagAndAttrs.

  // TODO(felix8a): "<a><\/a><a><\/a>..." is slower on IE9.
  // "<a>1<\/a><a>1<\/a>..." is faster, "<a><\/a>2<a><\/a>2..." is faster.

  // TODO(felix8a): "<p<p<p..." is slower on IE[6-8]

  var continuationMarker = {};
  function parse(htmlText, handler, param) {
    var m, p, tagName;
    var parts = htmlSplit(htmlText);
    var state = {
      noMoreGT: false,
      noMoreEndComments: false
    };
    parseCPS(handler, parts, 0, state, param);
  }

  function continuationMaker(h, parts, initial, state, param) {
    return function () {
      parseCPS(h, parts, initial, state, param);
    };
  }

  function parseCPS(h, parts, initial, state, param) {
    try {
      if (h.startDoc && initial == 0) { h.startDoc(param); }
      var m, p, tagName;
      for (var pos = initial, end = parts.length; pos < end;) {
        var current = parts[pos++];
        var next = parts[pos];
        switch (current) {
        case '&':
          if (ENTITY_RE_2.test(next)) {
            if (h.pcdata) {
              h.pcdata('&' + next, param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
            pos++;
          } else {
            if (h.pcdata) { h.pcdata("&amp;", param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\/':
          if (m = /^([-\w:]+)[^\'\"]*/.exec(next)) {
            if (m[0].length === next.length && parts[pos + 1] === '>') {
              // fast case, no attribute parsing needed
              pos += 2;
              tagName = m[1].toLowerCase();
              if (h.endTag) {
                h.endTag(tagName, param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
            } else {
              // slow case, need to parse attributes
              // TODO(felix8a): do we really care about misparsing this?
              pos = parseEndTag(
                parts, pos, h, param, continuationMarker, state);
            }
          } else {
            if (h.pcdata) {
              h.pcdata('&lt;/', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<':
          if (m = /^([-\w:]+)\s*\/?/.exec(next)) {
            if (m[0].length === next.length && parts[pos + 1] === '>') {
              // fast case, no attribute parsing needed
              pos += 2;
              tagName = m[1].toLowerCase();
              if (h.startTag) {
                h.startTag(tagName, [], param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
              // tags like <script> and <textarea> have special parsing
              var eflags = html4.ELEMENTS[tagName];
              if (eflags & EFLAGS_TEXT) {
                var tag = { name: tagName, next: pos, eflags: eflags };
                pos = parseText(
                  parts, tag, h, param, continuationMarker, state);
              }
            } else {
              // slow case, need to parse attributes
              pos = parseStartTag(
                parts, pos, h, param, continuationMarker, state);
            }
          } else {
            if (h.pcdata) {
              h.pcdata('&lt;', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\!--':
          // The pathological case is n copies of '<\!--' without '-->', and
          // repeated failure to find '-->' is quadratic.  We avoid that by
          // remembering when search for '-->' fails.
          if (!state.noMoreEndComments) {
            // A comment <\!--x--> is split into three tokens:
            //   '<\!--', 'x--', '>'
            // We want to find the next '>' token that has a preceding '--'.
            // pos is at the 'x--'.
            for (p = pos + 1; p < end; p++) {
              if (parts[p] === '>' && /--$/.test(parts[p - 1])) { break; }
            }
            if (p < end) {
              if (h.comment) {
                var comment = parts.slice(pos, p).join('');
                h.comment(
                  comment.substr(0, comment.length - 2), param,
                  continuationMarker,
                  continuationMaker(h, parts, p + 1, state, param));
              }
              pos = p + 1;
            } else {
              state.noMoreEndComments = true;
            }
          }
          if (state.noMoreEndComments) {
            if (h.pcdata) {
              h.pcdata('&lt;!--', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\!':
          if (!/^\w/.test(next)) {
            if (h.pcdata) {
              h.pcdata('&lt;!', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          } else {
            // similar to noMoreEndComment logic
            if (!state.noMoreGT) {
              for (p = pos + 1; p < end; p++) {
                if (parts[p] === '>') { break; }
              }
              if (p < end) {
                pos = p + 1;
              } else {
                state.noMoreGT = true;
              }
            }
            if (state.noMoreGT) {
              if (h.pcdata) {
                h.pcdata('&lt;!', param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
            }
          }
          break;
        case '<?':
          // similar to noMoreEndComment logic
          if (!state.noMoreGT) {
            for (p = pos + 1; p < end; p++) {
              if (parts[p] === '>') { break; }
            }
            if (p < end) {
              pos = p + 1;
            } else {
              state.noMoreGT = true;
            }
          }
          if (state.noMoreGT) {
            if (h.pcdata) {
              h.pcdata('&lt;?', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '>':
          if (h.pcdata) {
            h.pcdata("&gt;", param, continuationMarker,
              continuationMaker(h, parts, pos, state, param));
          }
          break;
        case '':
          break;
        default:
          if (h.pcdata) {
            h.pcdata(current, param, continuationMarker,
              continuationMaker(h, parts, pos, state, param));
          }
          break;
        }
      }
      if (h.endDoc) { h.endDoc(param); }
    } catch (e) {
      if (e !== continuationMarker) { throw e; }
    }
  }

  // Split str into parts for the html parser.
  function htmlSplit(str) {
    // can't hoist this out of the function because of the re.exec loop.
    var re = /(<\/|<\!--|<[!?]|[&<>])/g;
    str += '';
    if (splitWillCapture) {
      return str.split(re);
    } else {
      var parts = [];
      var lastPos = 0;
      var m;
      while ((m = re.exec(str)) !== null) {
        parts.push(str.substring(lastPos, m.index));
        parts.push(m[0]);
        lastPos = m.index + m[0].length;
      }
      parts.push(str.substring(lastPos));
      return parts;
    }
  }

  function parseEndTag(parts, pos, h, param, continuationMarker, state) {
    var tag = parseTagAndAttrs(parts, pos);
    // drop unclosed tags
    if (!tag) { return parts.length; }
    if (h.endTag) {
      h.endTag(tag.name, param, continuationMarker,
        continuationMaker(h, parts, pos, state, param));
    }
    return tag.next;
  }

  function parseStartTag(parts, pos, h, param, continuationMarker, state) {
    var tag = parseTagAndAttrs(parts, pos);
    // drop unclosed tags
    if (!tag) { return parts.length; }
    if (h.startTag) {
      h.startTag(tag.name, tag.attrs, param, continuationMarker,
        continuationMaker(h, parts, tag.next, state, param));
    }
    // tags like <script> and <textarea> have special parsing
    if (tag.eflags & EFLAGS_TEXT) {
      return parseText(parts, tag, h, param, continuationMarker, state);
    } else {
      return tag.next;
    }
  }

  var endTagRe = {};

  // Tags like <script> and <textarea> are flagged as CDATA or RCDATA,
  // which means everything is text until we see the correct closing tag.
  function parseText(parts, tag, h, param, continuationMarker, state) {
    var end = parts.length;
    if (!endTagRe.hasOwnProperty(tag.name)) {
      endTagRe[tag.name] = new RegExp('^' + tag.name + '(?:[\\s\\/]|$)', 'i');
    }
    var re = endTagRe[tag.name];
    var first = tag.next;
    var p = tag.next + 1;
    for (; p < end; p++) {
      if (parts[p - 1] === '<\/' && re.test(parts[p])) { break; }
    }
    if (p < end) { p -= 1; }
    var buf = parts.slice(first, p).join('');
    if (tag.eflags & html4.eflags['CDATA']) {
      if (h.cdata) {
        h.cdata(buf, param, continuationMarker,
          continuationMaker(h, parts, p, state, param));
      }
    } else if (tag.eflags & html4.eflags['RCDATA']) {
      if (h.rcdata) {
        h.rcdata(normalizeRCData(buf), param, continuationMarker,
          continuationMaker(h, parts, p, state, param));
      }
    } else {
      throw new Error('bug');
    }
    return p;
  }

  // at this point, parts[pos-1] is either "<" or "<\/".
  function parseTagAndAttrs(parts, pos) {
    var m = /^([-\w:]+)/.exec(parts[pos]);
    var tag = {};
    tag.name = m[1].toLowerCase();
    tag.eflags = html4.ELEMENTS[tag.name];
    var buf = parts[pos].substr(m[0].length);
    // Find the next '>'.  We optimistically assume this '>' is not in a
    // quoted context, and further down we fix things up if it turns out to
    // be quoted.
    var p = pos + 1;
    var end = parts.length;
    for (; p < end; p++) {
      if (parts[p] === '>') { break; }
      buf += parts[p];
    }
    if (end <= p) { return void 0; }
    var attrs = [];
    while (buf !== '') {
      m = ATTR_RE.exec(buf);
      if (!m) {
        // No attribute found: skip garbage
        buf = buf.replace(/^[\s\S][^a-z\s]*/, '');

      } else if ((m[4] && !m[5]) || (m[6] && !m[7])) {
        // Unterminated quote: slurp to the next unquoted '>'
        var quote = m[4] || m[6];
        var sawQuote = false;
        var abuf = [buf, parts[p++]];
        for (; p < end; p++) {
          if (sawQuote) {
            if (parts[p] === '>') { break; }
          } else if (0 <= parts[p].indexOf(quote)) {
            sawQuote = true;
          }
          abuf.push(parts[p]);
        }
        // Slurp failed: lose the garbage
        if (end <= p) { break; }
        // Otherwise retry attribute parsing
        buf = abuf.join('');
        continue;

      } else {
        // We have an attribute
        var aName = m[1].toLowerCase();
        var aValue = m[2] ? decodeValue(m[3]) : '';
        attrs.push(aName, aValue);
        buf = buf.substr(m[0].length);
      }
    }
    tag.attrs = attrs;
    tag.next = p + 1;
    return tag;
  }

  function decodeValue(v) {
    var q = v.charCodeAt(0);
    if (q === 0x22 || q === 0x27) { // " or '
      v = v.substr(1, v.length - 2);
    }
    return unescapeEntities(stripNULs(v));
  }

  /**
   * Returns a function that strips unsafe tags and attributes from html.
   * @param {function(string, Array.<string>): ?Array.<string>} tagPolicy
   *     A function that takes (tagName, attribs[]), where tagName is a key in
   *     html4.ELEMENTS and attribs is an array of alternating attribute names
   *     and values.  It should return a record (as follows), or null to delete
   *     the element.  It's okay for tagPolicy to modify the attribs array,
   *     but the same array is reused, so it should not be held between calls.
   *     Record keys:
   *        attribs: (required) Sanitized attributes array.
   *        tagName: Replacement tag name.
   * @return {function(string, Array)} A function that sanitizes a string of
   *     HTML and appends result strings to the second argument, an array.
   */
  function makeHtmlSanitizer(tagPolicy) {
    var stack;
    var ignoring;
    var emit = function (text, out) {
      if (!ignoring) { out.push(text); }
    };
    return makeSaxParser({
      'startDoc': function(_) {
        stack = [];
        ignoring = false;
      },
      'startTag': function(tagNameOrig, attribs, out) {
        if (ignoring) { return; }
        if (!html4.ELEMENTS.hasOwnProperty(tagNameOrig)) { return; }
        var eflagsOrig = html4.ELEMENTS[tagNameOrig];
        if (eflagsOrig & html4.eflags['FOLDABLE']) {
          return;
        }

        var decision = tagPolicy(tagNameOrig, attribs);
        if (!decision) {
          ignoring = !(eflagsOrig & html4.eflags['EMPTY']);
          return;
        } else if (typeof decision !== 'object') {
          throw new Error('tagPolicy did not return object (old API?)');
        }
        if ('attribs' in decision) {
          attribs = decision['attribs'];
        } else {
          throw new Error('tagPolicy gave no attribs');
        }
        var eflagsRep;
        var tagNameRep;
        if ('tagName' in decision) {
          tagNameRep = decision['tagName'];
          eflagsRep = html4.ELEMENTS[tagNameRep];
        } else {
          tagNameRep = tagNameOrig;
          eflagsRep = eflagsOrig;
        }
        // TODO(mikesamuel): relying on tagPolicy not to insert unsafe
        // attribute names.

        // If this is an optional-end-tag element and either this element or its
        // previous like sibling was rewritten, then insert a close tag to
        // preserve structure.
        if (eflagsOrig & html4.eflags['OPTIONAL_ENDTAG']) {
          var onStack = stack[stack.length - 1];
          if (onStack && onStack.orig === tagNameOrig &&
              (onStack.rep !== tagNameRep || tagNameOrig !== tagNameRep)) {
                out.push('<\/', onStack.rep, '>');
          }
        }

        if (!(eflagsOrig & html4.eflags['EMPTY'])) {
          stack.push({orig: tagNameOrig, rep: tagNameRep});
        }

        out.push('<', tagNameRep);
        for (var i = 0, n = attribs.length; i < n; i += 2) {
          var attribName = attribs[i],
              value = attribs[i + 1];
          if (value !== null && value !== void 0) {
            out.push(' ', attribName, '="', escapeAttrib(value), '"');
          }
        }
        out.push('>');

        if ((eflagsOrig & html4.eflags['EMPTY'])
            && !(eflagsRep & html4.eflags['EMPTY'])) {
          // replacement is non-empty, synthesize end tag
          out.push('<\/', tagNameRep, '>');
        }
      },
      'endTag': function(tagName, out) {
        if (ignoring) {
          ignoring = false;
          return;
        }
        if (!html4.ELEMENTS.hasOwnProperty(tagName)) { return; }
        var eflags = html4.ELEMENTS[tagName];
        if (!(eflags & (html4.eflags['EMPTY'] | html4.eflags['FOLDABLE']))) {
          var index;
          if (eflags & html4.eflags['OPTIONAL_ENDTAG']) {
            for (index = stack.length; --index >= 0;) {
              var stackElOrigTag = stack[index].orig;
              if (stackElOrigTag === tagName) { break; }
              if (!(html4.ELEMENTS[stackElOrigTag] &
                    html4.eflags['OPTIONAL_ENDTAG'])) {
                // Don't pop non optional end tags looking for a match.
                return;
              }
            }
          } else {
            for (index = stack.length; --index >= 0;) {
              if (stack[index].orig === tagName) { break; }
            }
          }
          if (index < 0) { return; }  // Not opened.
          for (var i = stack.length; --i > index;) {
            var stackElRepTag = stack[i].rep;
            if (!(html4.ELEMENTS[stackElRepTag] &
                  html4.eflags['OPTIONAL_ENDTAG'])) {
              out.push('<\/', stackElRepTag, '>');
            }
          }
          if (index < stack.length) {
            tagName = stack[index].rep;
          }
          stack.length = index;
          out.push('<\/', tagName, '>');
        }
      },
      'pcdata': emit,
      'rcdata': emit,
      'cdata': emit,
      'endDoc': function(out) {
        for (; stack.length; stack.length--) {
          out.push('<\/', stack[stack.length - 1].rep, '>');
        }
      }
    });
  }

  var ALLOWED_URI_SCHEMES = /^(?:https?|mailto|data)$/i;

  function safeUri(uri, effect, ltype, hints, naiveUriRewriter) {
    if (!naiveUriRewriter) { return null; }
    try {
      var parsed = URI.parse('' + uri);
      if (parsed) {
        if (!parsed.hasScheme() ||
            ALLOWED_URI_SCHEMES.test(parsed.getScheme())) {
          var safe = naiveUriRewriter(parsed, effect, ltype, hints);
          return safe ? safe.toString() : null;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function log(logger, tagName, attribName, oldValue, newValue) {
    if (!attribName) {
      logger(tagName + " removed", {
        change: "removed",
        tagName: tagName
      });
    }
    if (oldValue !== newValue) {
      var changed = "changed";
      if (oldValue && !newValue) {
        changed = "removed";
      } else if (!oldValue && newValue)  {
        changed = "added";
      }
      logger(tagName + "." + attribName + " " + changed, {
        change: changed,
        tagName: tagName,
        attribName: attribName,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  }

  function lookupAttribute(map, tagName, attribName) {
    var attribKey;
    attribKey = tagName + '::' + attribName;
    if (map.hasOwnProperty(attribKey)) {
      return map[attribKey];
    }
    attribKey = '*::' + attribName;
    if (map.hasOwnProperty(attribKey)) {
      return map[attribKey];
    }
    return void 0;
  }
  function getAttributeType(tagName, attribName) {
    return lookupAttribute(html4.ATTRIBS, tagName, attribName);
  }
  function getLoaderType(tagName, attribName) {
    return lookupAttribute(html4.LOADERTYPES, tagName, attribName);
  }
  function getUriEffect(tagName, attribName) {
    return lookupAttribute(html4.URIEFFECTS, tagName, attribName);
  }

  /**
   * Sanitizes attributes on an HTML tag.
   * @param {string} tagName An HTML tag name in lowercase.
   * @param {Array.<?string>} attribs An array of alternating names and values.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes; it can return a new string value, or null to
   *     delete the attribute.  If unspecified, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes; it can return a new string value, or null to delete
   *     the attribute.  If unspecified, these attributes are kept unchanged.
   * @return {Array.<?string>} The sanitized attributes as a list of alternating
   *     names and values, where a null value means to omit the attribute.
   */
  function sanitizeAttribs(tagName, attribs,
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    // TODO(felix8a): it's obnoxious that domado duplicates much of this
    // TODO(felix8a): maybe consistently enforce constraints like target=
    for (var i = 0; i < attribs.length; i += 2) {
      var attribName = attribs[i];
      var value = attribs[i + 1];
      var oldValue = value;
      var atype = null, attribKey;
      if ((attribKey = tagName + '::' + attribName,
           html4.ATTRIBS.hasOwnProperty(attribKey)) ||
          (attribKey = '*::' + attribName,
           html4.ATTRIBS.hasOwnProperty(attribKey))) {
        atype = html4.ATTRIBS[attribKey];
      }
      if (atype !== null) {
        switch (atype) {
          case html4.atype['NONE']: break;
          case html4.atype['SCRIPT']:
            value = null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['STYLE']:
            if ('undefined' === typeof parseCssDeclarations) {
              value = null;
              if (opt_logger) {
                log(opt_logger, tagName, attribName, oldValue, value);
	      }
              break;
            }
            var sanitizedDeclarations = [];
            parseCssDeclarations(
                value,
                {
                  declaration: function (property, tokens) {
                    var normProp = property.toLowerCase();
                    var schema = cssSchema[normProp];
                    if (!schema) {
                      return;
                    }
                    sanitizeCssProperty(
                        normProp, schema, tokens,
                        opt_naiveUriRewriter
                        ? function (url) {
                            return safeUri(
                                url, html4.ueffects.SAME_DOCUMENT,
                                html4.ltypes.SANDBOXED,
                                {
                                  "TYPE": "CSS",
                                  "CSS_PROP": normProp
                                }, opt_naiveUriRewriter);
                          }
                        : null);
                    sanitizedDeclarations.push(property + ': ' + tokens.join(' '));
                  }
                });
            value = sanitizedDeclarations.length > 0 ?
              sanitizedDeclarations.join(' ; ') : null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['ID']:
          case html4.atype['IDREF']:
          case html4.atype['IDREFS']:
          case html4.atype['GLOBAL_NAME']:
          case html4.atype['LOCAL_NAME']:
          case html4.atype['CLASSES']:
            value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['URI']:
            value = safeUri(value,
              getUriEffect(tagName, attribName),
              getLoaderType(tagName, attribName),
              {
                "TYPE": "MARKUP",
                "XML_ATTR": attribName,
                "XML_TAG": tagName
              }, opt_naiveUriRewriter);
              if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['URI_FRAGMENT']:
            if (value && '#' === value.charAt(0)) {
              value = value.substring(1);  // remove the leading '#'
              value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
              if (value !== null && value !== void 0) {
                value = '#' + value;  // restore the leading '#'
              }
            } else {
              value = null;
            }
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          default:
            value = null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
        }
      } else {
        value = null;
        if (opt_logger) {
          log(opt_logger, tagName, attribName, oldValue, value);
        }
      }
      attribs[i + 1] = value;
    }
    return attribs;
  }

  /**
   * Creates a tag policy that omits all tags marked UNSAFE in html4-defs.js
   * and applies the default attribute sanitizer with the supplied policy for
   * URI attributes and NMTOKEN attributes.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes.  If not given, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes.  If not given, such attributes are left unchanged.
   * @return {function(string, Array.<?string>)} A tagPolicy suitable for
   *     passing to html.sanitize.
   */
  function makeTagPolicy(
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    return function(tagName, attribs) {
      if (!(html4.ELEMENTS[tagName] & html4.eflags['UNSAFE'])) {
        return {
          'attribs': sanitizeAttribs(tagName, attribs,
            opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger)
        };
      } else {
        if (opt_logger) {
          log(opt_logger, tagName, undefined, undefined, undefined);
        }
      }
    };
  }

  /**
   * Sanitizes HTML tags and attributes according to a given policy.
   * @param {string} inputHtml The HTML to sanitize.
   * @param {function(string, Array.<?string>)} tagPolicy A function that
   *     decides which tags to accept and sanitizes their attributes (see
   *     makeHtmlSanitizer above for details).
   * @return {string} The sanitized HTML.
   */
  function sanitizeWithPolicy(inputHtml, tagPolicy) {
    var outputArray = [];
    makeHtmlSanitizer(tagPolicy)(inputHtml, outputArray);
    return outputArray.join('');
  }

  /**
   * Strips unsafe tags and attributes from HTML.
   * @param {string} inputHtml The HTML to sanitize.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes.  If not given, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes.  If not given, such attributes are left unchanged.
   */
  function sanitize(inputHtml,
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    var tagPolicy = makeTagPolicy(
      opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger);
    return sanitizeWithPolicy(inputHtml, tagPolicy);
  }

  // Export both quoted and unquoted names for Closure linkage.
  var html = {};
  html.escapeAttrib = html['escapeAttrib'] = escapeAttrib;
  html.makeHtmlSanitizer = html['makeHtmlSanitizer'] = makeHtmlSanitizer;
  html.makeSaxParser = html['makeSaxParser'] = makeSaxParser;
  html.makeTagPolicy = html['makeTagPolicy'] = makeTagPolicy;
  html.normalizeRCData = html['normalizeRCData'] = normalizeRCData;
  html.sanitize = html['sanitize'] = sanitize;
  html.sanitizeAttribs = html['sanitizeAttribs'] = sanitizeAttribs;
  html.sanitizeWithPolicy = html['sanitizeWithPolicy'] = sanitizeWithPolicy;
  html.unescapeEntities = html['unescapeEntities'] = unescapeEntities;
  return html;
})(html4);

var html_sanitize = html['sanitize'];

// Loosen restrictions of Caja's
// html-sanitizer to allow for styling
html4.ATTRIBS['*::style'] = 0;
html4.ELEMENTS['style'] = 0;
html4.ATTRIBS['a::target'] = 0;
html4.ELEMENTS['video'] = 0;
html4.ATTRIBS['video::src'] = 0;
html4.ATTRIBS['video::poster'] = 0;
html4.ATTRIBS['video::controls'] = 0;
html4.ELEMENTS['audio'] = 0;
html4.ATTRIBS['audio::src'] = 0;
html4.ATTRIBS['video::autoplay'] = 0;
html4.ATTRIBS['video::controls'] = 0;

if (typeof module !== 'undefined') {
    module.exports = html_sanitize;
}

},{}],6:[function(require,module,exports){
module.exports={
  "author": "Mapbox",
  "name": "mapbox.js",
  "description": "mapbox javascript api",
  "version": "2.0.1",
  "homepage": "http://mapbox.com/",
  "repository": {
    "type": "git",
    "url": "git://github.com/mapbox/mapbox.js.git"
  },
  "main": "src/index.js",
  "dependencies": {
    "leaflet": "0.7.3",
    "mustache": "0.7.3",
    "corslite": "0.0.6",
    "sanitize-caja": "0.1.2"
  },
  "scripts": {
    "test": "jshint src/*.js && mocha-phantomjs test/index.html"
  },
  "devDependencies": {
    "leaflet-hash": "0.2.1",
    "leaflet-fullscreen": "0.0.0",
    "uglify-js": "2.4.8",
    "mocha": "1.17.1",
    "expect.js": "0.3.1",
    "sinon": "1.10.2",
    "mocha-phantomjs": "3.1.6",
    "happen": "0.1.3",
    "browserify": "3.23.1",
    "jshint": "2.4.4",
    "clean-css": "~2.0.7",
    "minimist": "0.0.5",
    "marked": "~0.3.0"
  },
  "optionalDependencies": {},
  "engines": {
    "node": "*"
  }
}

},{}],7:[function(require,module,exports){
'use strict';

module.exports = {
    HTTP_URL: 'http://a.tiles.mapbox.com/v4',
    HTTPS_URL: 'https://a.tiles.mapbox.com/v4',
    FORCE_HTTPS: false,
    REQUIRE_ACCESS_TOKEN: true
};

},{}],8:[function(require,module,exports){
'use strict';

var util = require('./util'),
    urlhelper = require('./url'),
    request = require('./request'),
    marker = require('./marker'),
    simplestyle = require('./simplestyle');

// # featureLayer
//
// A layer of features, loaded from Mapbox or else. Adds the ability
// to reset features, filter them, and load them from a GeoJSON URL.
var FeatureLayer = L.FeatureGroup.extend({
    options: {
        filter: function() { return true; },
        sanitizer: require('sanitize-caja'),
        style: simplestyle.style
    },

    initialize: function(_, options) {
        L.setOptions(this, options);

        this._layers = {};

        if (typeof _ === 'string') {
            util.idUrl(_, this);
        // javascript object of TileJSON data
        } else if (_ && typeof _ === 'object') {
            this.setGeoJSON(_);
        }
    },

    setGeoJSON: function(_) {
        this._geojson = _;
        this.clearLayers();
        this._initialize(_);
        return this;
    },

    getGeoJSON: function() {
        return this._geojson;
    },

    loadURL: function(url) {
        if (this._request && 'abort' in this._request) this._request.abort();
        this._request = request(url, L.bind(function(err, json) {
            this._request = null;
            if (err && err.type !== 'abort') {
                util.log('could not load features at ' + url);
                this.fire('error', {error: err});
            } else if (json) {
                this.setGeoJSON(json);
                this.fire('ready');
            }
        }, this));
        return this;
    },

    loadID: function(id) {
        return this.loadURL(urlhelper('/' + id + '/features.json', this.options.accessToken));
    },

    setFilter: function(_) {
        this.options.filter = _;
        if (this._geojson) {
            this.clearLayers();
            this._initialize(this._geojson);
        }
        return this;
    },

    getFilter: function() {
        return this.options.filter;
    },

    _initialize: function(json) {
        var features = L.Util.isArray(json) ? json : json.features,
            i, len;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                // Only add this if geometry or geometries are set and not null
                if (features[i].geometries || features[i].geometry || features[i].features) {
                    this._initialize(features[i]);
                }
            }
        } else if (this.options.filter(json)) {

            var opts = {accessToken: this.options.accessToken},
                layer = L.GeoJSON.geometryToLayer(json, function(feature, latlon) {
                    return marker.style(feature, latlon, opts);
                }),
                popupHtml = marker.createPopup(json, this.options.sanitizer);

            if ('setStyle' in layer) {
                layer.setStyle(simplestyle.style(json));
            }

            layer.feature = json;

            if (popupHtml) {
                layer.bindPopup(popupHtml, {
                    closeButton: false
                });
            }

            this.addLayer(layer);
        }
    }
});

module.exports.FeatureLayer = FeatureLayer;

module.exports.featureLayer = function(_, options) {
    return new FeatureLayer(_, options);
};

},{"./marker":21,"./request":22,"./simplestyle":24,"./url":26,"./util":27,"sanitize-caja":4}],9:[function(require,module,exports){
'use strict';

var util = require('./util'),
    urlhelper = require('./url'),
    request = require('./request');

// Low-level geocoding interface - wraps specific API calls and their
// return values.
module.exports = function(url, options) {

    var geocoder = {};

    util.strict(url, 'string');

    if (url.indexOf('/') === -1) {
        url = urlhelper('/geocode/' + url + '/{query}.json', options && options.accessToken);
    }

    geocoder.getURL = function() {
        return url;
    };

    geocoder.queryURL = function(_) {
        if (typeof _ !== 'string') {
            var parts = [];
            for (var i = 0; i < _.length; i++) {
                parts[i] = encodeURIComponent(_[i]);
            }
            return L.Util.template(geocoder.getURL(), {
                query: parts.join(';')
            });
        } else {
            return L.Util.template(geocoder.getURL(), {
                query: encodeURIComponent(_)
            });
        }
    };

    geocoder.query = function(_, callback) {
        util.strict(callback, 'function');
        request(geocoder.queryURL(_), function(err, json) {
            if (json && (json.length || json.features)) {
                var res = {
                    results: json
                };
                if (json.features && json.features.length) {
                    res.latlng = [
                        json.features[0].center[1],
                        json.features[0].center[0]];

                    if (json.features[0].bbox) {
                        res.bounds = json.features[0].bbox;
                        res.lbounds = util.lbounds(res.bounds);
                    }
                }
                callback(null, res);
            } else callback(err || true);
        });

        return geocoder;
    };

    // a reverse geocode:
    //
    //  geocoder.reverseQuery([80, 20])
    geocoder.reverseQuery = function(_, callback) {
        var q = '';

        // sort through different ways people represent lat and lon pairs
        function normalize(x) {
            if (x.lat !== undefined && x.lng !== undefined) {
                return x.lng + ',' + x.lat;
            } else if (x.lat !== undefined && x.lon !== undefined) {
                return x.lon + ',' + x.lat;
            } else {
                return x[0] + ',' + x[1];
            }
        }

        if (_.length && _[0].length) {
            for (var i = 0, pts = []; i < _.length; i++) {
                pts.push(normalize(_[i]));
            }
            q = pts.join(';');
        } else {
            q = normalize(_);
        }

        request(geocoder.queryURL(q), function(err, json) {
            callback(err, json);
        });

        return geocoder;
    };

    return geocoder;
};

},{"./request":22,"./url":26,"./util":27}],10:[function(require,module,exports){
'use strict';

var geocoder = require('./geocoder'),
    util = require('./util');

var GeocoderControl = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'topleft',
        pointZoom: 16,
        keepOpen: false
    },

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        this.setURL(_);
    },

    setURL: function(_) {
        this.geocoder = geocoder(_, {accessToken: this.options.accessToken});
        return this;
    },

    getURL: function() {
        return this.geocoder.getURL();
    },

    setID: function(_) {
        return this.setURL(_);
    },

    setTileJSON: function(_) {
        return this.setURL(_.geocoder);
    },

    _toggle: function(e) {
        if (e) L.DomEvent.stop(e);
        if (L.DomUtil.hasClass(this._container, 'active')) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        } else {
            L.DomUtil.addClass(this._container, 'active');
            this._input.focus();
            this._input.select();
        }
    },

    _closeIfOpen: function(e) {
        if (L.DomUtil.hasClass(this._container, 'active') &&
            !this.options.keepOpen) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        }
    },

    onAdd: function(map) {

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder leaflet-bar leaflet-control'),
            link = L.DomUtil.create('a', 'leaflet-control-mapbox-geocoder-toggle mapbox-icon mapbox-icon-geocoder', container),
            results = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-results', container),
            wrap = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-wrap', container),
            form = L.DomUtil.create('form', 'leaflet-control-mapbox-geocoder-form', wrap),
            input  = L.DomUtil.create('input', '', form);

        link.href = '#';
        link.innerHTML = '&nbsp;';

        input.type = 'text';
        input.setAttribute('placeholder', 'Search');

        L.DomEvent.addListener(form, 'submit', this._geocode, this);
        L.DomEvent.disableClickPropagation(container);

        this._map = map;
        this._results = results;
        this._input = input;
        this._form = form;

        if (this.options.keepOpen) {
            L.DomUtil.addClass(container, 'active');
        } else {
            this._map.on('click', this._closeIfOpen, this);
            L.DomEvent.addListener(link, 'click', this._toggle, this);
        }

        return container;
    },

    _geocode: function(e) {
        L.DomEvent.preventDefault(e);
        L.DomUtil.addClass(this._container, 'searching');

        var map = this._map;
        var onload = L.bind(function(err, resp) {
            L.DomUtil.removeClass(this._container, 'searching');
            if (err || !resp || !resp.results || !resp.results.features || !resp.results.features.length) {
                this.fire('error', {error: err});
            } else {
                this._results.innerHTML = '';
                var features = resp.results.features;
                if (features.length === 1) {
                    this.fire('autoselect', { feature: features[0] });
                    chooseResult(features[0]);
                    this._closeIfOpen();
                } else {
                    for (var i = 0, l = Math.min(features.length, 5); i < l; i++) {
                        var feature = features[i];
                        var name = feature.place_name;
                        if (!name.length) continue;

                        var r = L.DomUtil.create('a', '', this._results);
                        var text = ('innerText' in r) ? 'innerText' : 'textContent';
                        r[text] = name;
                        r.href = '#';

                        (L.bind(function(feature) {
                            L.DomEvent.addListener(r, 'click', function(e) {
                                chooseResult(feature);
                                L.DomEvent.stop(e);
                                this.fire('select', { feature: feature });
                            }, this);
                        }, this))(feature);
                    }
                    if (features.length > 5) {
                        var outof = L.DomUtil.create('span', '', this._results);
                        outof.innerHTML = 'Top 5 of ' + features.length + '  results';
                    }
                }
                this.fire('found', {results: resp.results});
            }
        }, this);

        var chooseResult = L.bind(function(result) {
            if (result.bbox) {
                this._map.fitBounds(util.lbounds(result.bbox));
            } else if (result.center) {
                this._map.setView([result.center[1], result.center[0]], (map.getZoom() === undefined) ?
                    this.options.pointZoom :
                    Math.max(map.getZoom(), this.options.pointZoom));
            }
        }, this);

        this.geocoder.query(this._input.value, onload);
    }
});

module.exports.GeocoderControl = GeocoderControl;

module.exports.geocoderControl = function(_, options) {
    return new GeocoderControl(_, options);
};

},{"./geocoder":9,"./util":27}],11:[function(require,module,exports){
'use strict';

function utfDecode(c) {
    if (c >= 93) c--;
    if (c >= 35) c--;
    return c - 32;
}

module.exports = function(data) {
    return function(x, y) {
        if (!data) return;
        var idx = utfDecode(data.grid[y].charCodeAt(x)),
            key = data.keys[idx];
        return data.data[key];
    };
};

},{}],12:[function(require,module,exports){
'use strict';

var util = require('./util'),
    Mustache = require('mustache');

var GridControl = L.Control.extend({

    options: {
        pinnable: true,
        follow: false,
        sanitizer: require('sanitize-caja'),
        touchTeaser: true,
        location: true
    },

    _currentContent: '',

    // pinned means that this control is on a feature and the user has likely
    // clicked. pinned will not become false unless the user clicks off
    // of the feature onto another or clicks x
    _pinned: false,

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        util.strict_instance(_, L.Class, 'L.mapbox.gridLayer');
        this._layer = _;
    },

    setTemplate: function(template) {
        util.strict(template, 'string');
        this.options.template = template;
        return this;
    },

    _template: function(format, data) {
        if (!data) return;
        var template = this.options.template || this._layer.getTileJSON().template;
        if (template) {
            var d = {};
            d['__' + format + '__'] = true;
            return this.options.sanitizer(
                Mustache.to_html(template, L.extend(d, data)));
        }
    },

    // change the content of the tooltip HTML if it has changed, otherwise
    // noop
    _show: function(content, o) {
        if (content === this._currentContent) return;

        this._currentContent = content;

        if (this.options.follow) {
            this._popup.setContent(content)
                .setLatLng(o.latLng);
            if (this._map._popup !== this._popup) this._popup.openOn(this._map);
        } else {
            this._container.style.display = 'block';
            this._contentWrapper.innerHTML = content;
        }
    },

    hide: function() {
        this._pinned = false;
        this._currentContent = '';

        this._map.closePopup();
        this._container.style.display = 'none';
        this._contentWrapper.innerHTML = '';

        L.DomUtil.removeClass(this._container, 'closable');

        return this;
    },

    _mouseover: function(o) {
        if (o.data) {
            L.DomUtil.addClass(this._map._container, 'map-clickable');
        } else {
            L.DomUtil.removeClass(this._map._container, 'map-clickable');
        }

        if (this._pinned) return;

        var content = this._template('teaser', o.data);
        if (content) {
            this._show(content, o);
        } else {
            this.hide();
        }
    },

    _mousemove: function(o) {
        if (this._pinned) return;
        if (!this.options.follow) return;

        this._popup.setLatLng(o.latLng);
    },

    _navigateTo: function(url) {
        window.top.location.href = url;
    },

    _click: function(o) {

        var location_formatted = this._template('location', o.data);
        if (this.options.location && location_formatted &&
            location_formatted.search(/^https?:/) === 0) {
            return this._navigateTo(this._template('location', o.data));
        }

        if (!this.options.pinnable) return;

        var content = this._template('full', o.data);

        if (!content && this.options.touchTeaser && L.Browser.touch) {
            content = this._template('teaser', o.data);
        }

        if (content) {
            L.DomUtil.addClass(this._container, 'closable');
            this._pinned = true;
            this._show(content, o);
        } else if (this._pinned) {
            L.DomUtil.removeClass(this._container, 'closable');
            this._pinned = false;
            this.hide();
        }
    },

    _onPopupClose: function() {
        this._currentContent = null;
        this._pinned = false;
    },

    _createClosebutton: function(container, fn) {
        var link = L.DomUtil.create('a', 'close', container);

        link.innerHTML = 'close';
        link.href = '#';
        link.title = 'close';

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'mousedown', L.DomEvent.stopPropagation)
            .on(link, 'dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, this);

        return link;
    },

    onAdd: function(map) {
        this._map = map;

        var className = 'leaflet-control-grid map-tooltip',
            container = L.DomUtil.create('div', className),
            contentWrapper = L.DomUtil.create('div', 'map-tooltip-content');

        // hide the container element initially
        container.style.display = 'none';
        this._createClosebutton(container, this.hide);
        container.appendChild(contentWrapper);

        this._contentWrapper = contentWrapper;
        this._popup = new L.Popup({ autoPan: false, closeOnClick: false });

        map.on('popupclose', this._onPopupClose, this);

        L.DomEvent
            .disableClickPropagation(container)
            // allow people to scroll tooltips with mousewheel
            .addListener(container, 'mousewheel', L.DomEvent.stopPropagation);

        this._layer
            .on('mouseover', this._mouseover, this)
            .on('mousemove', this._mousemove, this)
            .on('click', this._click, this);

        return container;
    },

    onRemove: function (map) {

        map.off('popupclose', this._onPopupClose, this);

        this._layer
            .off('mouseover', this._mouseover, this)
            .off('mousemove', this._mousemove, this)
            .off('click', this._click, this);
    }
});

module.exports.GridControl = GridControl;

module.exports.gridControl = function(_, options) {
    return new GridControl(_, options);
};

},{"./util":27,"mustache":3,"sanitize-caja":4}],13:[function(require,module,exports){
'use strict';

var util = require('./util'),
    url = require('./url'),
    request = require('./request'),
    grid = require('./grid');

// forked from danzel/L.UTFGrid
var GridLayer = L.Class.extend({
    includes: [L.Mixin.Events, require('./load_tilejson')],

    options: {
        template: function() { return ''; }
    },

    _mouseOn: null,
    _tilejson: {},
    _cache: {},

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        this._loadTileJSON(_);
    },

    _setTileJSON: function(json) {
        util.strict(json, 'object');

        L.extend(this.options, {
            grids: json.grids,
            minZoom: json.minzoom,
            maxZoom: json.maxzoom,
            bounds: json.bounds && util.lbounds(json.bounds)
        });

        this._tilejson = json;
        this._cache = {};
        this._update();

        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    active: function() {
        return !!(this._map && this.options.grids && this.options.grids.length);
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    onAdd: function(map) {
        this._map = map;
        this._update();

        this._map
            .on('click', this._click, this)
            .on('mousemove', this._move, this)
            .on('moveend', this._update, this);
    },

    onRemove: function() {
        this._map
            .off('click', this._click, this)
            .off('mousemove', this._move, this)
            .off('moveend', this._update, this);
    },

    getData: function(latlng, callback) {
        if (!this.active()) return;

        var map = this._map,
            point = map.project(latlng.wrap()),
            tileSize = 256,
            resolution = 4,
            x = Math.floor(point.x / tileSize),
            y = Math.floor(point.y / tileSize),
            max = map.options.crs.scale(map.getZoom()) / tileSize;

        x = (x + max) % max;
        y = (y + max) % max;

        this._getTile(map.getZoom(), x, y, function(grid) {
            var gridX = Math.floor((point.x - (x * tileSize)) / resolution),
                gridY = Math.floor((point.y - (y * tileSize)) / resolution);

            callback(grid(gridX, gridY));
        });

        return this;
    },

    _click: function(e) {
        this.getData(e.latlng, L.bind(function(data) {
            this.fire('click', {
                latLng: e.latlng,
                data: data
            });
        }, this));
    },

    _move: function(e) {
        this.getData(e.latlng, L.bind(function(data) {
            if (data !== this._mouseOn) {
                if (this._mouseOn) {
                    this.fire('mouseout', {
                        latLng: e.latlng,
                        data: this._mouseOn
                    });
                }

                this.fire('mouseover', {
                    latLng: e.latlng,
                    data: data
                });

                this._mouseOn = data;
            } else {
                this.fire('mousemove', {
                    latLng: e.latlng,
                    data: data
                });
            }
        }, this));
    },

    _getTileURL: function(tilePoint) {
        var urls = this.options.grids,
            index = (tilePoint.x + tilePoint.y) % urls.length,
            url = urls[index];

        return L.Util.template(url, tilePoint);
    },

    // Load up all required json grid files
    _update: function() {
        if (!this.active()) return;

        var bounds = this._map.getPixelBounds(),
            z = this._map.getZoom(),
            tileSize = 256;

        if (z > this.options.maxZoom || z < this.options.minZoom) return;

        var tileBounds = L.bounds(
                bounds.min.divideBy(tileSize)._floor(),
                bounds.max.divideBy(tileSize)._floor()),
            max = this._map.options.crs.scale(z) / tileSize;

        for (var x = tileBounds.min.x; x <= tileBounds.max.x; x++) {
            for (var y = tileBounds.min.y; y <= tileBounds.max.y; y++) {
                // x wrapped
                this._getTile(z, ((x % max) + max) % max, ((y % max) + max) % max);
            }
        }
    },

    _getTile: function(z, x, y, callback) {
        var key = z + '_' + x + '_' + y,
            tilePoint = L.point(x, y);

        tilePoint.z = z;

        if (!this._tileShouldBeLoaded(tilePoint)) {
            return;
        }

        if (key in this._cache) {
            if (!callback) return;

            if (typeof this._cache[key] === 'function') {
                callback(this._cache[key]); // Already loaded
            } else {
                this._cache[key].push(callback); // Pending
            }

            return;
        }

        this._cache[key] = [];

        if (callback) {
            this._cache[key].push(callback);
        }

        request(this._getTileURL(tilePoint), L.bind(function(err, json) {
            var callbacks = this._cache[key];
            this._cache[key] = grid(json);
            for (var i = 0; i < callbacks.length; ++i) {
                callbacks[i](this._cache[key]);
            }
        }, this));
    },

    _tileShouldBeLoaded: function(tilePoint) {
        if (tilePoint.z > this.options.maxZoom || tilePoint.z < this.options.minZoom) {
            return false;
        }

        if (this.options.bounds) {
            var tileSize = 256,
                nwPoint = tilePoint.multiplyBy(tileSize),
                sePoint = nwPoint.add(new L.Point(tileSize, tileSize)),
                nw = this._map.unproject(nwPoint),
                se = this._map.unproject(sePoint),
                bounds = new L.LatLngBounds([nw, se]);

            if (!this.options.bounds.intersects(bounds)) {
                return false;
            }
        }

        return true;
    }
});

module.exports.GridLayer = GridLayer;

module.exports.gridLayer = function(_, options) {
    return new GridLayer(_, options);
};

},{"./grid":11,"./load_tilejson":18,"./request":22,"./url":26,"./util":27}],14:[function(require,module,exports){
require('./leaflet');
require('./mapbox');

},{"./leaflet":16,"./mapbox":20}],15:[function(require,module,exports){
'use strict';

var InfoControl = L.Control.extend({
    options: {
        position: 'bottomright',
        sanitizer: require('sanitize-caja')
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._info = {};
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'mapbox-control-info mapbox-small');
        this._content = L.DomUtil.create('div', 'map-info-container', this._container);

        var link = L.DomUtil.create('a', 'mapbox-info-toggle mapbox-icon mapbox-icon-info', this._container);
        link.href = '#';

        L.DomEvent.addListener(link, 'click', this._showInfo, this);
        L.DomEvent.disableClickPropagation(this._container);

        for (var i in map._layers) {
            if (map._layers[i].getAttribution) {
                this.addInfo(map._layers[i].getAttribution());
            }
        }

        map
            .on('layeradd', this._onLayerAdd, this)
            .on('layerremove', this._onLayerRemove, this);

        this._update();
        return this._container;
    },

    onRemove: function(map) {
        map
            .off('layeradd', this._onLayerAdd, this)
            .off('layerremove', this._onLayerRemove, this);
    },

    addInfo: function(text) {
        if (!text) return this;
        if (!this._info[text]) this._info[text] = 0;
        this._info[text] = true;
        return this._update();
    },

    removeInfo: function (text) {
        if (!text) return this;
        if (this._info[text]) this._info[text] = false;
        return this._update();
    },

    _showInfo: function(e) {
        L.DomEvent.preventDefault(e);
        if (this._active === true) return this._hidecontent();

        L.DomUtil.addClass(this._container, 'active');
        this._active = true;
        this._update();
    },

    _hidecontent: function() {
        this._content.innerHTML = '';
        this._active = false;
        L.DomUtil.removeClass(this._container, 'active');
        return;
    },

    _update: function() {
        if (!this._map) { return this; }
        this._content.innerHTML = '';
        var hide = 'none';
        var info = [];

        for (var i in this._info) {
            if (this._info.hasOwnProperty(i) && this._info[i]) {
                info.push(this.options.sanitizer(i));
                hide = 'block';
            }
        }

        this._content.innerHTML += info.join(' | ');

        // If there are no results in _info then hide this.
        this._container.style.display = hide;
        return this;
    },

    _onLayerAdd: function(e) {
        if (e.layer.getAttribution && e.layer.getAttribution()) {
            this.addInfo(e.layer.getAttribution());
        } else if ('on' in e.layer && e.layer.getAttribution) {
            e.layer.on('ready', L.bind(function() {
                this.addInfo(e.layer.getAttribution());
            }, this));
        }
    },

    _onLayerRemove: function (e) {
        if (e.layer.getAttribution) {
            this.removeInfo(e.layer.getAttribution());
        }
    }
});

module.exports.InfoControl = InfoControl;

module.exports.infoControl = function(options) {
    return new InfoControl(options);
};

},{"sanitize-caja":4}],16:[function(require,module,exports){
window.L = require('leaflet/dist/leaflet-src');

},{"leaflet/dist/leaflet-src":2}],17:[function(require,module,exports){
'use strict';

var LegendControl = L.Control.extend({

    options: {
        position: 'bottomright',
        sanitizer: require('sanitize-caja')
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._legends = {};
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'map-legends wax-legends');
        L.DomEvent.disableClickPropagation(this._container);

        this._update();

        return this._container;
    },

    addLegend: function(text) {
        if (!text) { return this; }

        if (!this._legends[text]) {
            this._legends[text] = 0;
        }

        this._legends[text]++;
        return this._update();
    },

    removeLegend: function(text) {
        if (!text) { return this; }
        if (this._legends[text]) this._legends[text]--;
        return this._update();
    },

    _update: function() {
        if (!this._map) { return this; }

        this._container.innerHTML = '';
        var hide = 'none';

        for (var i in this._legends) {
            if (this._legends.hasOwnProperty(i) && this._legends[i]) {
                var div = L.DomUtil.create('div', 'map-legend wax-legend', this._container);
                div.innerHTML = this.options.sanitizer(i);
                hide = 'block';
            }
        }

        // hide the control entirely unless there is at least one legend;
        // otherwise there will be a small grey blemish on the map.
        this._container.style.display = hide;

        return this;
    }
});

module.exports.LegendControl = LegendControl;

module.exports.legendControl = function(options) {
    return new LegendControl(options);
};

},{"sanitize-caja":4}],18:[function(require,module,exports){
'use strict';

var request = require('./request'),
    url = require('./url'),
    util = require('./util');

module.exports = {
    _loadTileJSON: function(_) {
        if (typeof _ === 'string') {
            _ = url.tileJSON(_, this.options && this.options.accessToken);
            request(_, L.bind(function(err, json) {
                if (err) {
                    util.log('could not load TileJSON at ' + _);
                    this.fire('error', {error: err});
                } else if (json) {
                    this._setTileJSON(json);
                    this.fire('ready');
                }
            }, this));
        } else if (_ && typeof _ === 'object') {
            this._setTileJSON(_);
        }
    }
};

},{"./request":22,"./url":26,"./util":27}],19:[function(require,module,exports){
'use strict';

var util = require('./util'),
    tileLayer = require('./tile_layer').tileLayer,
    featureLayer = require('./feature_layer').featureLayer,
    gridLayer = require('./grid_layer').gridLayer,
    gridControl = require('./grid_control').gridControl,
    infoControl = require('./info_control').infoControl,
    shareControl = require('./share_control').shareControl,
    legendControl = require('./legend_control').legendControl;

function withAccessToken(options, accessToken) {
    if (!accessToken || options.accessToken)
        return options;
    return L.extend({accessToken: accessToken}, options);
}

var LMap = L.Map.extend({
    includes: [require('./load_tilejson')],

    options: {
        tileLayer: {},
        featureLayer: {},
        gridLayer: {},
        legendControl: {},
        gridControl: {},
        infoControl: false,
        shareControl: false
    },

    _tilejson: {},

    initialize: function(element, _, options) {
        L.Map.prototype.initialize.call(this, element, options);

        // disable the default 'Leaflet' text
        if (this.attributionControl) this.attributionControl.setPrefix('');

        if (this.options.tileLayer) {
            this.tileLayer = tileLayer(undefined,
                withAccessToken(this.options.tileLayer, this.options.accessToken));
            this.addLayer(this.tileLayer);
        }

        if (this.options.featureLayer) {
            this.featureLayer = featureLayer(undefined,
                withAccessToken(this.options.featureLayer, this.options.accessToken));
            this.addLayer(this.featureLayer);
        }

        if (this.options.gridLayer) {
            this.gridLayer = gridLayer(undefined,
                withAccessToken(this.options.gridLayer, this.options.accessToken));
            this.addLayer(this.gridLayer);
        }

        if (this.options.gridLayer && this.options.gridControl) {
            this.gridControl = gridControl(this.gridLayer, this.options.gridControl);
            this.addControl(this.gridControl);
        }

        if (this.options.infoControl) {
            this.infoControl = infoControl(this.options.infoControl);
            this.addControl(this.infoControl);
        }

        if (this.options.legendControl) {
            this.legendControl = legendControl(this.options.legendControl);
            this.addControl(this.legendControl);
        }

        if (this.options.shareControl) {
            this.shareControl = shareControl(undefined,
                withAccessToken(this.options.shareControl, this.options.accessToken));
            this.addControl(this.shareControl);
        }

        this._loadTileJSON(_);
    },

    // Update certain properties on 'ready' event
    addLayer: function(layer) {
        if ('on' in layer) { layer.on('ready', L.bind(function() { this._updateLayer(layer); }, this)); }
        return L.Map.prototype.addLayer.call(this, layer);
    },

    // use a javascript object of tilejson data to configure this layer
    _setTileJSON: function(_) {
        this._tilejson = _;
        this._initialize(_);
        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    _initialize: function(json) {
        if (this.tileLayer) {
            this.tileLayer._setTileJSON(json);
            this._updateLayer(this.tileLayer);
        }

        if (this.featureLayer && !this.featureLayer.getGeoJSON() && json.data && json.data[0]) {
            this.featureLayer.loadURL(json.data[0]);
        }

        if (this.gridLayer) {
            this.gridLayer._setTileJSON(json);
            this._updateLayer(this.gridLayer);
        }

        if (this.infoControl && json.attribution) {
            this.infoControl.addInfo(json.attribution);
        }

        if (this.legendControl && json.legend) {
            this.legendControl.addLegend(json.legend);
        }

        if (this.shareControl) {
            this.shareControl._setTileJSON(json);
        }

        if (!this._loaded && json.center) {
            var zoom = json.center[2],
                center = L.latLng(json.center[1], json.center[0]);

            this.setView(center, zoom);
        }
    },

    _editLink: function() {
        if (!this._controlContainer.getElementsByClassName) return;
        var link = this._controlContainer.getElementsByClassName('mapbox-improve-map');
        if (link.length && this._loaded) {
            var center = this.getCenter().wrap();
            var tilejson = this._tilejson || {};
            var id = tilejson.id || '';

            for (var i = 0; i < link.length; i++) {
                link[i].href = link[i].href.split('#')[0] + '#' + id + '/' +
                    center.lng.toFixed(3) + '/' +
                    center.lat.toFixed(3) + '/' +
                    this.getZoom();
            }
        }
    },

    _updateLayer: function(layer) {
        if (!layer.options) return;

        if (this.infoControl && this._loaded) {
            this.infoControl.addInfo(layer.options.infoControl);
        }

        if (this.attributionControl && this._loaded && layer.getAttribution) {
            this.attributionControl.addAttribution(layer.getAttribution());
        }

        this.on('moveend', this._editLink, this);

        if (!(L.stamp(layer) in this._zoomBoundLayers) &&
                (layer.options.maxZoom || layer.options.minZoom)) {
            this._zoomBoundLayers[L.stamp(layer)] = layer;
        }

        this._editLink();
        this._updateZoomLevels();
    }
});

module.exports.Map = LMap;

module.exports.map = function(element, _, options) {
    return new LMap(element, _, options);
};

},{"./feature_layer":8,"./grid_control":12,"./grid_layer":13,"./info_control":15,"./legend_control":17,"./load_tilejson":18,"./share_control":23,"./tile_layer":25,"./util":27}],20:[function(require,module,exports){
'use strict';

// Hardcode image path, because Leaflet's autodetection
// fails, because mapbox.js is not named leaflet.js
window.L.Icon.Default.imagePath = '//api.tiles.mapbox.com/mapbox.js/' + 'v' +
    require('../package.json').version + '/images';

var geocoderControl = require('./geocoder_control'),
    gridControl = require('./grid_control'),
    featureLayer = require('./feature_layer'),
    legendControl = require('./legend_control'),
    shareControl = require('./share_control'),
    tileLayer = require('./tile_layer'),
    infoControl = require('./info_control'),
    map = require('./map'),
    gridLayer = require('./grid_layer');

L.mapbox = module.exports = {
    VERSION: require('../package.json').version,
    geocoder: require('./geocoder'),
    marker: require('./marker'),
    simplestyle: require('./simplestyle'),
    tileLayer: tileLayer.tileLayer,
    TileLayer: tileLayer.TileLayer,
    infoControl: infoControl.infoControl,
    InfoControl: infoControl.InfoControl,
    shareControl: shareControl.shareControl,
    ShareControl: shareControl.ShareControl,
    legendControl: legendControl.legendControl,
    LegendControl: legendControl.LegendControl,
    geocoderControl: geocoderControl.geocoderControl,
    GeocoderControl: geocoderControl.GeocoderControl,
    gridControl: gridControl.gridControl,
    GridControl: gridControl.GridControl,
    gridLayer: gridLayer.gridLayer,
    GridLayer: gridLayer.GridLayer,
    featureLayer: featureLayer.featureLayer,
    FeatureLayer: featureLayer.FeatureLayer,
    map: map.map,
    Map: map.Map,
    config: require('./config'),
    sanitize: require('sanitize-caja'),
    template: require('mustache').to_html
};

},{"../package.json":6,"./config":7,"./feature_layer":8,"./geocoder":9,"./geocoder_control":10,"./grid_control":12,"./grid_layer":13,"./info_control":15,"./legend_control":17,"./map":19,"./marker":21,"./share_control":23,"./simplestyle":24,"./tile_layer":25,"mustache":3,"sanitize-caja":4}],21:[function(require,module,exports){
'use strict';

var url = require('./url'),
    util = require('./util'),
    sanitize = require('sanitize-caja');

// mapbox-related markers functionality
// provide an icon from mapbox's simple-style spec and hosted markers
// service
function icon(fp, options) {
    fp = fp || {};

    var sizes = {
            small: [20, 50],
            medium: [30, 70],
            large: [35, 90]
        },
        size = fp['marker-size'] || 'medium',
        symbol = (fp['marker-symbol']) ? '-' + fp['marker-symbol'] : '',
        color = (fp['marker-color'] || '7e7e7e').replace('#', '');

    return L.icon({
        iconUrl: url('/marker/' +
            'pin-' + size.charAt(0) + symbol + '+' + color +
            // detect and use retina markers, which are x2 resolution
            (L.Browser.retina ? '@2x' : '') + '.png', options && options.accessToken),
        iconSize: sizes[size],
        iconAnchor: [sizes[size][0] / 2, sizes[size][1] / 2],
        popupAnchor: [0, -sizes[size][1] / 2]
    });
}

// a factory that provides markers for Leaflet from Mapbox's
// [simple-style specification](https://github.com/mapbox/simplestyle-spec)
// and [Markers API](http://mapbox.com/developers/api/#markers).
function style(f, latlon, options) {
    return L.marker(latlon, {
        icon: icon(f.properties, options),
        title: util.strip_tags(
            sanitize((f.properties && f.properties.title) || ''))
    });
}

// Sanitize and format properties of a GeoJSON Feature object in order
// to form the HTML string used as the argument for `L.createPopup`
function createPopup(f, sanitizer) {
    if (!f || !f.properties) return '';
    var popup = '';

    if (f.properties.title) {
        popup += '<div class="marker-title">' + f.properties.title + '</div>';
    }

    if (f.properties.description) {
        popup += '<div class="marker-description">' + f.properties.description + '</div>';
    }

    return (sanitizer || sanitize)(popup);
}

module.exports = {
    icon: icon,
    style: style,
    createPopup: createPopup
};

},{"./url":26,"./util":27,"sanitize-caja":4}],22:[function(require,module,exports){
'use strict';

var corslite = require('corslite'),
    strict = require('./util').strict,
    config = require('./config'),
    protocol = /^(https?:)?(?=\/\/(.|api)\.tiles\.mapbox\.com\/)/;

module.exports = function(url, callback) {
    strict(url, 'string');
    strict(callback, 'function');

    url = url.replace(protocol, function(match, protocol) {
        if (!('withCredentials' in new window.XMLHttpRequest())) {
            // XDomainRequest in use; doesn't support cross-protocol requests
            return document.location.protocol;
        } else if ('https:' === protocol || 'https:' === document.location.protocol || config.FORCE_HTTPS) {
            return 'https:';
        } else {
            return 'http:';
        }
    });

    return corslite(url, onload);
    function onload(err, resp) {
        if (!err && resp) {
            resp = JSON.parse(resp.responseText);
        }
        callback(err, resp);
    }
};

},{"./config":7,"./util":27,"corslite":1}],23:[function(require,module,exports){
'use strict';

var urlhelper = require('./url');

var ShareControl = L.Control.extend({
    includes: [require('./load_tilejson')],

    options: {
        position: 'topleft',
        url: ''
    },

    initialize: function(_, options) {
        L.setOptions(this, options);
        this._loadTileJSON(_);
    },

    _setTileJSON: function(json) {
        this._tilejson = json;
    },

    onAdd: function(map) {
        this._map = map;

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-share leaflet-bar');
        var link = L.DomUtil.create('a', 'mapbox-share mapbox-icon mapbox-icon-share', container);
        link.href = '#';

        this._modal = L.DomUtil.create('div', 'mapbox-modal', this._map._container);
        this._mask = L.DomUtil.create('div', 'mapbox-modal-mask', this._modal);
        this._content = L.DomUtil.create('div', 'mapbox-modal-content', this._modal);

        L.DomEvent.addListener(link, 'click', this._shareClick, this);
        L.DomEvent.disableClickPropagation(container);

        this._map.on('mousedown', this._clickOut, this);

        return container;
    },

    _clickOut: function(e) {
        if (this._sharing) {
            L.DomEvent.preventDefault(e);
            L.DomUtil.removeClass(this._modal, 'active');
            this._content.innerHTML = '';
            this._sharing = null;
            return;
        }
    },

    _shareClick: function(e) {
        L.DomEvent.stop(e);
        if (this._sharing) return this._clickOut(e);

        var tilejson = this._tilejson || this._map._tilejson || {},
            url = encodeURIComponent(this.options.url || tilejson.webpage || window.location),
            name = encodeURIComponent(tilejson.name),
            image = urlhelper(tilejson.id + '/' + this._map.getCenter().lng + ',' + this._map.getCenter().lat + ',' + this._map.getZoom() + '/600x600.png', this.options.accessToken),
            embed = urlhelper(tilejson.id + '.html', this.options.accessToken),
            twitter = '//twitter.com/intent/tweet?status=' + name + ' ' + url,
            facebook = '//www.facebook.com/sharer.php?u=' + url + '&t=' + encodeURIComponent(tilejson.name),
            pinterest = '//www.pinterest.com/pin/create/button/?url=' + url + '&media=' + image + '&description=' + tilejson.name,
            share = ("<h3>Share this map</h3>" +
                    "<div class='mapbox-share-buttons'><a class='mapbox-button mapbox-button-icon mapbox-icon-facebook' target='_blank' href='{{facebook}}'>Facebook</a>" +
                    "<a class='mapbox-button mapbox-button-icon mapbox-icon-twitter' target='_blank' href='{{twitter}}'>Twitter</a>" +
                    "<a class='mapbox-button mapbox-button-icon mapbox-icon-pinterest' target='_blank' href='{{pinterest}}'>Pinterest</a></div>")
                    .replace('{{twitter}}', twitter)
                    .replace('{{facebook}}', facebook)
                    .replace('{{pinterest}}', pinterest),
            embedValue = '<iframe width="100%" height="500px" frameBorder="0" src="{{embed}}"></iframe>'.replace('{{embed}}', embed),
            embedLabel = 'Copy and paste this <strong>HTML code</strong> into documents to embed this map on web pages.';

        L.DomUtil.addClass(this._modal, 'active');

        this._sharing = L.DomUtil.create('div', 'mapbox-modal-body', this._content);
        this._sharing.innerHTML = share;

        var input = L.DomUtil.create('input', 'mapbox-embed', this._sharing);
        input.type = 'text';
        input.value = embedValue;

        var label = L.DomUtil.create('label', 'mapbox-embed-description', this._sharing);
        label.innerHTML = embedLabel;

        var close = L.DomUtil.create('a', 'leaflet-popup-close-button', this._sharing);
        close.href = '#';

        L.DomEvent.disableClickPropagation(this._sharing);
        L.DomEvent.addListener(close, 'click', this._clickOut, this);
        L.DomEvent.addListener(input, 'click', function(e) {
            e.target.focus();
            e.target.select();
        });
    }
});

module.exports.ShareControl = ShareControl;

module.exports.shareControl = function(_, options) {
    return new ShareControl(_, options);
};

},{"./load_tilejson":18,"./url":26}],24:[function(require,module,exports){
'use strict';

// an implementation of the simplestyle spec for polygon and linestring features
// https://github.com/mapbox/simplestyle-spec
var defaults = {
    stroke: '#555555',
    'stroke-width': 2,
    'stroke-opacity': 1,
    fill: '#555555',
    'fill-opacity': 0.5
};

var mapping = [
    ['stroke', 'color'],
    ['stroke-width', 'weight'],
    ['stroke-opacity', 'opacity'],
    ['fill', 'fillColor'],
    ['fill-opacity', 'fillOpacity']
];

function fallback(a, b) {
    var c = {};
    for (var k in b) {
        if (a[k] === undefined) c[k] = b[k];
        else c[k] = a[k];
    }
    return c;
}

function remap(a) {
    var d = {};
    for (var i = 0; i < mapping.length; i++) {
        d[mapping[i][1]] = a[mapping[i][0]];
    }
    return d;
}

function style(feature) {
    return remap(fallback(feature.properties || {}, defaults));
}

module.exports = {
    style: style,
    defaults: defaults
};

},{}],25:[function(require,module,exports){
'use strict';

var util = require('./util'),
    url = require('./url');

var TileLayer = L.TileLayer.extend({
    includes: [require('./load_tilejson')],

    options: {
        format: 'png'
    },

    // http://mapbox.com/developers/api/#image_quality
    formats: [
        'png',
        // PNG
        'png32', 'png64', 'png128', 'png256',
        // JPG
        'jpg70', 'jpg80', 'jpg90'],

    scalePrefix: '@2x.',

    initialize: function(_, options) {
        L.TileLayer.prototype.initialize.call(this, undefined, options);

        this._tilejson = {};

        if (options && options.format) {
            util.strict_oneof(options.format, this.formats);
        }

        this._loadTileJSON(_);
    },

    setFormat: function(_) {
        util.strict(_, 'string');
        this.options.format = _;
        this.redraw();
        return this;
    },

    // disable the setUrl function, which is not available on mapbox tilelayers
    setUrl: null,

    _setTileJSON: function(json) {
        util.strict(json, 'object');

        L.extend(this.options, {
            tiles: json.tiles,
            attribution: json.attribution,
            minZoom: json.minzoom || 0,
            maxZoom: json.maxzoom || 18,
            tms: json.scheme === 'tms',
            bounds: json.bounds && util.lbounds(json.bounds)
        });

        this._tilejson = json;
        this.redraw();
        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    // this is an exception to mapbox.js naming rules because it's called
    // by `L.map`
    getTileUrl: function(tilePoint) {
        var tiles = this.options.tiles,
            index = Math.floor(Math.abs(tilePoint.x + tilePoint.y) % tiles.length),
            url = tiles[index];

        var templated = L.Util.template(url, tilePoint);
        if (!templated) {
            return templated;
        } else {
            return templated.replace('.png',
                (L.Browser.retina ? this.scalePrefix : '.') + this.options.format);
        }
    },

    // TileJSON.TileLayers are added to the map immediately, so that they get
    // the desired z-index, but do not update until the TileJSON has been loaded.
    _update: function() {
        if (this.options.tiles) {
            L.TileLayer.prototype._update.call(this);
        }
    }
});

module.exports.TileLayer = TileLayer;

module.exports.tileLayer = function(_, options) {
    return new TileLayer(_, options);
};

},{"./load_tilejson":18,"./url":26,"./util":27}],26:[function(require,module,exports){
'use strict';

var config = require('./config'),
    version = require('../package.json').version;

module.exports = function(path, accessToken) {
    accessToken = accessToken || L.mapbox.accessToken;

    if (!accessToken && config.REQUIRE_ACCESS_TOKEN) {
        throw new Error('An API access token is required to use Mapbox.js. ' +
            'See https://www.mapbox.com/mapbox.js/api/v' + version + '/api-access-tokens/');
    }

    var url = ('https:' === document.location.protocol || config.FORCE_HTTPS) ? config.HTTPS_URL : config.HTTP_URL;
    url += path;
    url += url.indexOf('?') !== -1 ? '&access_token=' : '?access_token=';

    if (config.REQUIRE_ACCESS_TOKEN) {
        if (accessToken[0] === 's') {
            throw new Error('Use a public access token (pk.*) with Mapbox.js, not a secret access token (sk.*). ' +
                'See https://www.mapbox.com/mapbox.js/api/v' + version + '/api-access-tokens/');
        }

        url += accessToken;
    }

    return url;
};

module.exports.tileJSON = function(urlOrMapID, accessToken) {
    if (urlOrMapID.indexOf('/') !== -1)
        return urlOrMapID;

    var url = module.exports('/' + urlOrMapID + '.json', accessToken);

    // TileJSON requests need a secure flag appended to their URLs so
    // that the server knows to send SSL-ified resource references.
    if (url.indexOf('https') === 0)
        url += '&secure';

    return url;
};

},{"../package.json":6,"./config":7}],27:[function(require,module,exports){
'use strict';

module.exports = {
    idUrl: function(_, t) {
        if (_.indexOf('/') == -1) t.loadID(_);
        else t.loadURL(_);
    },
    log: function(_) {
        if (typeof console === 'object' &&
            typeof console.error === 'function') {
            console.error(_);
        }
    },
    strict: function(_, type) {
        if (typeof _ !== type) {
            throw new Error('Invalid argument: ' + type + ' expected');
        }
    },
    strict_instance: function(_, klass, name) {
        if (!(_ instanceof klass)) {
            throw new Error('Invalid argument: ' + name + ' expected');
        }
    },
    strict_oneof: function(_, values) {
        if (!contains(_, values)) {
            throw new Error('Invalid argument: ' + _ + ' given, valid values are ' +
                values.join(', '));
        }
    },
    strip_tags: function(_) {
        return _.replace(/<[^<]+>/g, '');
    },
    lbounds: function(_) {
        // leaflet-compatible bounds, since leaflet does not do geojson
        return new L.LatLngBounds([[_[1], _[0]], [_[3], _[2]]]);
    }
};

function contains(item, list) {
    if (!list || !list.length) return false;
    for (var i = 0; i < list.length; i++) {
        if (list[i] == item) return true;
    }
    return false;
}

},{}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvbm9kZV9tb2R1bGVzL2NvcnNsaXRlL2NvcnNsaXRlLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9ub2RlX21vZHVsZXMvbGVhZmxldC9kaXN0L2xlYWZsZXQtc3JjLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9ub2RlX21vZHVsZXMvbXVzdGFjaGUvbXVzdGFjaGUuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL25vZGVfbW9kdWxlcy9zYW5pdGl6ZS1jYWphL2luZGV4LmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9ub2RlX21vZHVsZXMvc2FuaXRpemUtY2FqYS9zYW5pdGl6ZXItYnVuZGxlLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9wYWNrYWdlLmpzb24iLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9jb25maWcuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9mZWF0dXJlX2xheWVyLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9zcmMvZ2VvY29kZXIuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9nZW9jb2Rlcl9jb250cm9sLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9zcmMvZ3JpZC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL2dyaWRfY29udHJvbC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL2dyaWRfbGF5ZXIuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL2luZm9fY29udHJvbC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL2xlYWZsZXQuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9sZWdlbmRfY29udHJvbC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL2xvYWRfdGlsZWpzb24uanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9tYXAuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9tYXBib3guanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9tYXJrZXIuanMiLCIvVXNlcnMvdG1jdy9zcmMvbWFwYm94LmpzL3NyYy9yZXF1ZXN0LmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9zcmMvc2hhcmVfY29udHJvbC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL3NpbXBsZXN0eWxlLmpzIiwiL1VzZXJzL3RtY3cvc3JjL21hcGJveC5qcy9zcmMvdGlsZV9sYXllci5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL3VybC5qcyIsIi9Vc2Vycy90bWN3L3NyYy9tYXBib3guanMvc3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOTRFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIGNvcnNsaXRlKHVybCwgY2FsbGJhY2ssIGNvcnMpIHtcbiAgICB2YXIgc2VudCA9IGZhbHNlO1xuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvcignQnJvd3NlciBub3Qgc3VwcG9ydGVkJykpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY29ycyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG0gPSB1cmwubWF0Y2goL15cXHMqaHR0cHM/OlxcL1xcL1teXFwvXSovKTtcbiAgICAgICAgY29ycyA9IG0gJiYgKG1bMF0gIT09IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmRvbWFpbiArXG4gICAgICAgICAgICAgICAgKGxvY2F0aW9uLnBvcnQgPyAnOicgKyBsb2NhdGlvbi5wb3J0IDogJycpKTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIGZ1bmN0aW9uIGlzU3VjY2Vzc2Z1bChzdGF0dXMpIHtcbiAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwIHx8IHN0YXR1cyA9PT0gMzA0O1xuICAgIH1cblxuICAgIGlmIChjb3JzICYmICEoJ3dpdGhDcmVkZW50aWFscycgaW4geCkpIHtcbiAgICAgICAgLy8gSUU4LTlcbiAgICAgICAgeCA9IG5ldyB3aW5kb3cuWERvbWFpblJlcXVlc3QoKTtcblxuICAgICAgICAvLyBFbnN1cmUgY2FsbGJhY2sgaXMgbmV2ZXIgY2FsbGVkIHN5bmNocm9ub3VzbHksIGkuZS4sIGJlZm9yZVxuICAgICAgICAvLyB4LnNlbmQoKSByZXR1cm5zICh0aGlzIGhhcyBiZWVuIG9ic2VydmVkIGluIHRoZSB3aWxkKS5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXBib3gvbWFwYm94LmpzL2lzc3Vlcy80NzJcbiAgICAgICAgdmFyIG9yaWdpbmFsID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VudCkge1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbC5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgLy8gWERvbWFpblJlcXVlc3RcbiAgICAgICAgICAgIHguc3RhdHVzID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAgICAgaXNTdWNjZXNzZnVsKHguc3RhdHVzKSkgY2FsbGJhY2suY2FsbCh4LCBudWxsLCB4KTtcbiAgICAgICAgZWxzZSBjYWxsYmFjay5jYWxsKHgsIHgsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEJvdGggYG9ucmVhZHlzdGF0ZWNoYW5nZWAgYW5kIGBvbmxvYWRgIGNhbiBmaXJlLiBgb25yZWFkeXN0YXRlY2hhbmdlYFxuICAgIC8vIGhhcyBbYmVlbiBzdXBwb3J0ZWQgZm9yIGxvbmdlcl0oaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvOTE4MTUwOC8yMjkwMDEpLlxuICAgIGlmICgnb25sb2FkJyBpbiB4KSB7XG4gICAgICAgIHgub25sb2FkID0gbG9hZGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHgub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gcmVhZHlzdGF0ZSgpIHtcbiAgICAgICAgICAgIGlmICh4LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayB3aXRoIHRoZSBYTUxIdHRwUmVxdWVzdCBvYmplY3QgYXMgYW4gZXJyb3IgYW5kIHByZXZlbnRcbiAgICAvLyBpdCBmcm9tIGV2ZXIgYmVpbmcgY2FsbGVkIGFnYWluIGJ5IHJlYXNzaWduaW5nIGl0IHRvIGBub29wYFxuICAgIHgub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKGV2dCkge1xuICAgICAgICAvLyBYRG9tYWluUmVxdWVzdCBwcm92aWRlcyBubyBldnQgcGFyYW1ldGVyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZXZ0IHx8IHRydWUsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICAvLyBJRTkgbXVzdCBoYXZlIG9ucHJvZ3Jlc3MgYmUgc2V0IHRvIGEgdW5pcXVlIGZ1bmN0aW9uLlxuICAgIHgub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkgeyB9O1xuXG4gICAgeC5vbnRpbWVvdXQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBldnQsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICB4Lm9uYWJvcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBldnQsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICAvLyBHRVQgaXMgdGhlIG9ubHkgc3VwcG9ydGVkIEhUVFAgVmVyYiBieSBYRG9tYWluUmVxdWVzdCBhbmQgaXMgdGhlXG4gICAgLy8gb25seSBvbmUgc3VwcG9ydGVkIGhlcmUuXG4gICAgeC5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXG4gICAgLy8gU2VuZCB0aGUgcmVxdWVzdC4gU2VuZGluZyBkYXRhIGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgeC5zZW5kKG51bGwpO1xuICAgIHNlbnQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHg7XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBjb3JzbGl0ZTtcbiIsIi8qXG4gTGVhZmxldCwgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIG1vYmlsZS1mcmllbmRseSBpbnRlcmFjdGl2ZSBtYXBzLiBodHRwOi8vbGVhZmxldGpzLmNvbVxuIChjKSAyMDEwLTIwMTMsIFZsYWRpbWlyIEFnYWZvbmtpblxuIChjKSAyMDEwLTIwMTEsIENsb3VkTWFkZVxuKi9cbihmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XHJcbnZhciBvbGRMID0gd2luZG93LkwsXHJcbiAgICBMID0ge307XHJcblxyXG5MLnZlcnNpb24gPSAnMC43LjInO1xyXG5cclxuLy8gZGVmaW5lIExlYWZsZXQgZm9yIE5vZGUgbW9kdWxlIHBhdHRlcm4gbG9hZGVycywgaW5jbHVkaW5nIEJyb3dzZXJpZnlcclxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuXHRtb2R1bGUuZXhwb3J0cyA9IEw7XHJcblxyXG4vLyBkZWZpbmUgTGVhZmxldCBhcyBhbiBBTUQgbW9kdWxlXHJcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcblx0ZGVmaW5lKEwpO1xyXG59XHJcblxyXG4vLyBkZWZpbmUgTGVhZmxldCBhcyBhIGdsb2JhbCBMIHZhcmlhYmxlLCBzYXZpbmcgdGhlIG9yaWdpbmFsIEwgdG8gcmVzdG9yZSBsYXRlciBpZiBuZWVkZWRcclxuXHJcbkwubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR3aW5kb3cuTCA9IG9sZEw7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG53aW5kb3cuTCA9IEw7XHJcblxuXG4vKlxyXG4gKiBMLlV0aWwgY29udGFpbnMgdmFyaW91cyB1dGlsaXR5IGZ1bmN0aW9ucyB1c2VkIHRocm91Z2hvdXQgTGVhZmxldCBjb2RlLlxyXG4gKi9cclxuXHJcbkwuVXRpbCA9IHtcclxuXHRleHRlbmQ6IGZ1bmN0aW9uIChkZXN0KSB7IC8vIChPYmplY3RbLCBPYmplY3QsIC4uLl0pIC0+XHJcblx0XHR2YXIgc291cmNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXHJcblx0XHQgICAgaSwgaiwgbGVuLCBzcmM7XHJcblxyXG5cdFx0Zm9yIChqID0gMCwgbGVuID0gc291cmNlcy5sZW5ndGg7IGogPCBsZW47IGorKykge1xyXG5cdFx0XHRzcmMgPSBzb3VyY2VzW2pdIHx8IHt9O1xyXG5cdFx0XHRmb3IgKGkgaW4gc3JjKSB7XHJcblx0XHRcdFx0aWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG5cdFx0XHRcdFx0ZGVzdFtpXSA9IHNyY1tpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXN0O1xyXG5cdH0sXHJcblxyXG5cdGJpbmQ6IGZ1bmN0aW9uIChmbiwgb2JqKSB7IC8vIChGdW5jdGlvbiwgT2JqZWN0KSAtPiBGdW5jdGlvblxyXG5cdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikgOiBudWxsO1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0cmV0dXJuIGZuLmFwcGx5KG9iaiwgYXJncyB8fCBhcmd1bWVudHMpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRzdGFtcDogKGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBsYXN0SWQgPSAwLFxyXG5cdFx0ICAgIGtleSA9ICdfbGVhZmxldF9pZCc7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG5cdFx0XHRvYmpba2V5XSA9IG9ialtrZXldIHx8ICsrbGFzdElkO1xyXG5cdFx0XHRyZXR1cm4gb2JqW2tleV07XHJcblx0XHR9O1xyXG5cdH0oKSksXHJcblxyXG5cdGludm9rZUVhY2g6IGZ1bmN0aW9uIChvYmosIG1ldGhvZCwgY29udGV4dCkge1xyXG5cdFx0dmFyIGksIGFyZ3M7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDMpO1xyXG5cclxuXHRcdFx0Zm9yIChpIGluIG9iaikge1xyXG5cdFx0XHRcdG1ldGhvZC5hcHBseShjb250ZXh0LCBbaSwgb2JqW2ldXS5jb25jYXQoYXJncykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9LFxyXG5cclxuXHRsaW1pdEV4ZWNCeUludGVydmFsOiBmdW5jdGlvbiAoZm4sIHRpbWUsIGNvbnRleHQpIHtcclxuXHRcdHZhciBsb2NrLCBleGVjT25VbmxvY2s7XHJcblxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXJGbigpIHtcclxuXHRcdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblxyXG5cdFx0XHRpZiAobG9jaykge1xyXG5cdFx0XHRcdGV4ZWNPblVubG9jayA9IHRydWU7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRsb2NrID0gdHJ1ZTtcclxuXHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdGxvY2sgPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0aWYgKGV4ZWNPblVubG9jaykge1xyXG5cdFx0XHRcdFx0d3JhcHBlckZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG5cdFx0XHRcdFx0ZXhlY09uVW5sb2NrID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCB0aW1lKTtcclxuXHJcblx0XHRcdGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG5cdFx0fTtcclxuXHR9LFxyXG5cclxuXHRmYWxzZUZuOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0Zm9ybWF0TnVtOiBmdW5jdGlvbiAobnVtLCBkaWdpdHMpIHtcclxuXHRcdHZhciBwb3cgPSBNYXRoLnBvdygxMCwgZGlnaXRzIHx8IDUpO1xyXG5cdFx0cmV0dXJuIE1hdGgucm91bmQobnVtICogcG93KSAvIHBvdztcclxuXHR9LFxyXG5cclxuXHR0cmltOiBmdW5jdGlvbiAoc3RyKSB7XHJcblx0XHRyZXR1cm4gc3RyLnRyaW0gPyBzdHIudHJpbSgpIDogc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcclxuXHR9LFxyXG5cclxuXHRzcGxpdFdvcmRzOiBmdW5jdGlvbiAoc3RyKSB7XHJcblx0XHRyZXR1cm4gTC5VdGlsLnRyaW0oc3RyKS5zcGxpdCgvXFxzKy8pO1xyXG5cdH0sXHJcblxyXG5cdHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvYmosIG9wdGlvbnMpIHtcclxuXHRcdG9iai5vcHRpb25zID0gTC5leHRlbmQoe30sIG9iai5vcHRpb25zLCBvcHRpb25zKTtcclxuXHRcdHJldHVybiBvYmoub3B0aW9ucztcclxuXHR9LFxyXG5cclxuXHRnZXRQYXJhbVN0cmluZzogZnVuY3Rpb24gKG9iaiwgZXhpc3RpbmdVcmwsIHVwcGVyY2FzZSkge1xyXG5cdFx0dmFyIHBhcmFtcyA9IFtdO1xyXG5cdFx0Zm9yICh2YXIgaSBpbiBvYmopIHtcclxuXHRcdFx0cGFyYW1zLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KHVwcGVyY2FzZSA/IGkudG9VcHBlckNhc2UoKSA6IGkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KG9ialtpXSkpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuICgoIWV4aXN0aW5nVXJsIHx8IGV4aXN0aW5nVXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArIHBhcmFtcy5qb2luKCcmJyk7XHJcblx0fSxcclxuXHR0ZW1wbGF0ZTogZnVuY3Rpb24gKHN0ciwgZGF0YSkge1xyXG5cdFx0cmV0dXJuIHN0ci5yZXBsYWNlKC9cXHsgKihbXFx3X10rKSAqXFx9L2csIGZ1bmN0aW9uIChzdHIsIGtleSkge1xyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW2tleV07XHJcblx0XHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyB2YWx1ZSBwcm92aWRlZCBmb3IgdmFyaWFibGUgJyArIHN0cik7XHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFsdWUgPSB2YWx1ZShkYXRhKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdmFsdWU7XHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcclxuXHRcdHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XScpO1xyXG5cdH0sXHJcblxyXG5cdGVtcHR5SW1hZ2VVcmw6ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhBUUFCQUFEL0FDd0FBQUFBQVFBQkFBQUNBRHM9J1xyXG59O1xyXG5cclxuKGZ1bmN0aW9uICgpIHtcclxuXHJcblx0Ly8gaW5zcGlyZWQgYnkgaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cclxuXHJcblx0ZnVuY3Rpb24gZ2V0UHJlZml4ZWQobmFtZSkge1xyXG5cdFx0dmFyIGksIGZuLFxyXG5cdFx0ICAgIHByZWZpeGVzID0gWyd3ZWJraXQnLCAnbW96JywgJ28nLCAnbXMnXTtcclxuXHJcblx0XHRmb3IgKGkgPSAwOyBpIDwgcHJlZml4ZXMubGVuZ3RoICYmICFmbjsgaSsrKSB7XHJcblx0XHRcdGZuID0gd2luZG93W3ByZWZpeGVzW2ldICsgbmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGZuO1xyXG5cdH1cclxuXHJcblx0dmFyIGxhc3RUaW1lID0gMDtcclxuXHJcblx0ZnVuY3Rpb24gdGltZW91dERlZmVyKGZuKSB7XHJcblx0XHR2YXIgdGltZSA9ICtuZXcgRGF0ZSgpLFxyXG5cdFx0ICAgIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtICh0aW1lIC0gbGFzdFRpbWUpKTtcclxuXHJcblx0XHRsYXN0VGltZSA9IHRpbWUgKyB0aW1lVG9DYWxsO1xyXG5cdFx0cmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGZuLCB0aW1lVG9DYWxsKTtcclxuXHR9XHJcblxyXG5cdHZhciByZXF1ZXN0Rm4gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcblx0ICAgICAgICBnZXRQcmVmaXhlZCgnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJykgfHwgdGltZW91dERlZmVyO1xyXG5cclxuXHR2YXIgY2FuY2VsRm4gPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcclxuXHQgICAgICAgIGdldFByZWZpeGVkKCdDYW5jZWxBbmltYXRpb25GcmFtZScpIHx8XHJcblx0ICAgICAgICBnZXRQcmVmaXhlZCgnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJykgfHxcclxuXHQgICAgICAgIGZ1bmN0aW9uIChpZCkgeyB3aW5kb3cuY2xlYXJUaW1lb3V0KGlkKTsgfTtcclxuXHJcblxyXG5cdEwuVXRpbC5yZXF1ZXN0QW5pbUZyYW1lID0gZnVuY3Rpb24gKGZuLCBjb250ZXh0LCBpbW1lZGlhdGUsIGVsZW1lbnQpIHtcclxuXHRcdGZuID0gTC5iaW5kKGZuLCBjb250ZXh0KTtcclxuXHJcblx0XHRpZiAoaW1tZWRpYXRlICYmIHJlcXVlc3RGbiA9PT0gdGltZW91dERlZmVyKSB7XHJcblx0XHRcdGZuKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gcmVxdWVzdEZuLmNhbGwod2luZG93LCBmbiwgZWxlbWVudCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0TC5VdGlsLmNhbmNlbEFuaW1GcmFtZSA9IGZ1bmN0aW9uIChpZCkge1xyXG5cdFx0aWYgKGlkKSB7XHJcblx0XHRcdGNhbmNlbEZuLmNhbGwod2luZG93LCBpZCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcbn0oKSk7XHJcblxyXG4vLyBzaG9ydGN1dHMgZm9yIG1vc3QgdXNlZCB1dGlsaXR5IGZ1bmN0aW9uc1xyXG5MLmV4dGVuZCA9IEwuVXRpbC5leHRlbmQ7XHJcbkwuYmluZCA9IEwuVXRpbC5iaW5kO1xyXG5MLnN0YW1wID0gTC5VdGlsLnN0YW1wO1xyXG5MLnNldE9wdGlvbnMgPSBMLlV0aWwuc2V0T3B0aW9ucztcclxuXG5cbi8qXHJcbiAqIEwuQ2xhc3MgcG93ZXJzIHRoZSBPT1AgZmFjaWxpdGllcyBvZiB0aGUgbGlicmFyeS5cclxuICogVGhhbmtzIHRvIEpvaG4gUmVzaWcgYW5kIERlYW4gRWR3YXJkcyBmb3IgaW5zcGlyYXRpb24hXHJcbiAqL1xyXG5cclxuTC5DbGFzcyA9IGZ1bmN0aW9uICgpIHt9O1xyXG5cclxuTC5DbGFzcy5leHRlbmQgPSBmdW5jdGlvbiAocHJvcHMpIHtcclxuXHJcblx0Ly8gZXh0ZW5kZWQgY2xhc3Mgd2l0aCB0aGUgbmV3IHByb3RvdHlwZVxyXG5cdHZhciBOZXdDbGFzcyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHQvLyBjYWxsIHRoZSBjb25zdHJ1Y3RvclxyXG5cdFx0aWYgKHRoaXMuaW5pdGlhbGl6ZSkge1xyXG5cdFx0XHR0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBjYWxsIGFsbCBjb25zdHJ1Y3RvciBob29rc1xyXG5cdFx0aWYgKHRoaXMuX2luaXRIb29rcykge1xyXG5cdFx0XHR0aGlzLmNhbGxJbml0SG9va3MoKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHQvLyBpbnN0YW50aWF0ZSBjbGFzcyB3aXRob3V0IGNhbGxpbmcgY29uc3RydWN0b3JcclxuXHR2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xyXG5cdEYucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XHJcblxyXG5cdHZhciBwcm90byA9IG5ldyBGKCk7XHJcblx0cHJvdG8uY29uc3RydWN0b3IgPSBOZXdDbGFzcztcclxuXHJcblx0TmV3Q2xhc3MucHJvdG90eXBlID0gcHJvdG87XHJcblxyXG5cdC8vaW5oZXJpdCBwYXJlbnQncyBzdGF0aWNzXHJcblx0Zm9yICh2YXIgaSBpbiB0aGlzKSB7XHJcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpICE9PSAncHJvdG90eXBlJykge1xyXG5cdFx0XHROZXdDbGFzc1tpXSA9IHRoaXNbaV07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBtaXggc3RhdGljIHByb3BlcnRpZXMgaW50byB0aGUgY2xhc3NcclxuXHRpZiAocHJvcHMuc3RhdGljcykge1xyXG5cdFx0TC5leHRlbmQoTmV3Q2xhc3MsIHByb3BzLnN0YXRpY3MpO1xyXG5cdFx0ZGVsZXRlIHByb3BzLnN0YXRpY3M7XHJcblx0fVxyXG5cclxuXHQvLyBtaXggaW5jbHVkZXMgaW50byB0aGUgcHJvdG90eXBlXHJcblx0aWYgKHByb3BzLmluY2x1ZGVzKSB7XHJcblx0XHRMLlV0aWwuZXh0ZW5kLmFwcGx5KG51bGwsIFtwcm90b10uY29uY2F0KHByb3BzLmluY2x1ZGVzKSk7XHJcblx0XHRkZWxldGUgcHJvcHMuaW5jbHVkZXM7XHJcblx0fVxyXG5cclxuXHQvLyBtZXJnZSBvcHRpb25zXHJcblx0aWYgKHByb3BzLm9wdGlvbnMgJiYgcHJvdG8ub3B0aW9ucykge1xyXG5cdFx0cHJvcHMub3B0aW9ucyA9IEwuZXh0ZW5kKHt9LCBwcm90by5vcHRpb25zLCBwcm9wcy5vcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdC8vIG1peCBnaXZlbiBwcm9wZXJ0aWVzIGludG8gdGhlIHByb3RvdHlwZVxyXG5cdEwuZXh0ZW5kKHByb3RvLCBwcm9wcyk7XHJcblxyXG5cdHByb3RvLl9pbml0SG9va3MgPSBbXTtcclxuXHJcblx0dmFyIHBhcmVudCA9IHRoaXM7XHJcblx0Ly8ganNoaW50IGNhbWVsY2FzZTogZmFsc2VcclxuXHROZXdDbGFzcy5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xyXG5cclxuXHQvLyBhZGQgbWV0aG9kIGZvciBjYWxsaW5nIGFsbCBob29rc1xyXG5cdHByb3RvLmNhbGxJbml0SG9va3MgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2luaXRIb29rc0NhbGxlZCkgeyByZXR1cm47IH1cclxuXHJcblx0XHRpZiAocGFyZW50LnByb3RvdHlwZS5jYWxsSW5pdEhvb2tzKSB7XHJcblx0XHRcdHBhcmVudC5wcm90b3R5cGUuY2FsbEluaXRIb29rcy5jYWxsKHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2luaXRIb29rc0NhbGxlZCA9IHRydWU7XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb3RvLl9pbml0SG9va3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0cHJvdG8uX2luaXRIb29rc1tpXS5jYWxsKHRoaXMpO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHJldHVybiBOZXdDbGFzcztcclxufTtcclxuXHJcblxyXG4vLyBtZXRob2QgZm9yIGFkZGluZyBwcm9wZXJ0aWVzIHRvIHByb3RvdHlwZVxyXG5MLkNsYXNzLmluY2x1ZGUgPSBmdW5jdGlvbiAocHJvcHMpIHtcclxuXHRMLmV4dGVuZCh0aGlzLnByb3RvdHlwZSwgcHJvcHMpO1xyXG59O1xyXG5cclxuLy8gbWVyZ2UgbmV3IGRlZmF1bHQgb3B0aW9ucyB0byB0aGUgQ2xhc3NcclxuTC5DbGFzcy5tZXJnZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdEwuZXh0ZW5kKHRoaXMucHJvdG90eXBlLm9wdGlvbnMsIG9wdGlvbnMpO1xyXG59O1xyXG5cclxuLy8gYWRkIGEgY29uc3RydWN0b3IgaG9va1xyXG5MLkNsYXNzLmFkZEluaXRIb29rID0gZnVuY3Rpb24gKGZuKSB7IC8vIChGdW5jdGlvbikgfHwgKFN0cmluZywgYXJncy4uLilcclxuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcblxyXG5cdHZhciBpbml0ID0gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gZm4gOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzW2ZuXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLnByb3RvdHlwZS5faW5pdEhvb2tzID0gdGhpcy5wcm90b3R5cGUuX2luaXRIb29rcyB8fCBbXTtcclxuXHR0aGlzLnByb3RvdHlwZS5faW5pdEhvb2tzLnB1c2goaW5pdCk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBMLk1peGluLkV2ZW50cyBpcyB1c2VkIHRvIGFkZCBjdXN0b20gZXZlbnRzIGZ1bmN0aW9uYWxpdHkgdG8gTGVhZmxldCBjbGFzc2VzLlxyXG4gKi9cclxuXHJcbnZhciBldmVudHNLZXkgPSAnX2xlYWZsZXRfZXZlbnRzJztcclxuXHJcbkwuTWl4aW4gPSB7fTtcclxuXHJcbkwuTWl4aW4uRXZlbnRzID0ge1xyXG5cclxuXHRhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAodHlwZXMsIGZuLCBjb250ZXh0KSB7IC8vIChTdHJpbmcsIEZ1bmN0aW9uWywgT2JqZWN0XSkgb3IgKE9iamVjdFssIE9iamVjdF0pXHJcblxyXG5cdFx0Ly8gdHlwZXMgY2FuIGJlIGEgbWFwIG9mIHR5cGVzL2hhbmRsZXJzXHJcblx0XHRpZiAoTC5VdGlsLmludm9rZUVhY2godHlwZXMsIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciwgdGhpcywgZm4sIGNvbnRleHQpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cdFx0dmFyIGV2ZW50cyA9IHRoaXNbZXZlbnRzS2V5XSA9IHRoaXNbZXZlbnRzS2V5XSB8fCB7fSxcclxuXHRcdCAgICBjb250ZXh0SWQgPSBjb250ZXh0ICYmIGNvbnRleHQgIT09IHRoaXMgJiYgTC5zdGFtcChjb250ZXh0KSxcclxuXHRcdCAgICBpLCBsZW4sIGV2ZW50LCB0eXBlLCBpbmRleEtleSwgaW5kZXhMZW5LZXksIHR5cGVJbmRleDtcclxuXHJcblx0XHQvLyB0eXBlcyBjYW4gYmUgYSBzdHJpbmcgb2Ygc3BhY2Utc2VwYXJhdGVkIHdvcmRzXHJcblx0XHR0eXBlcyA9IEwuVXRpbC5zcGxpdFdvcmRzKHR5cGVzKTtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0eXBlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRldmVudCA9IHtcclxuXHRcdFx0XHRhY3Rpb246IGZuLFxyXG5cdFx0XHRcdGNvbnRleHQ6IGNvbnRleHQgfHwgdGhpc1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR0eXBlID0gdHlwZXNbaV07XHJcblxyXG5cdFx0XHRpZiAoY29udGV4dElkKSB7XHJcblx0XHRcdFx0Ly8gc3RvcmUgbGlzdGVuZXJzIG9mIGEgcGFydGljdWxhciBjb250ZXh0IGluIGEgc2VwYXJhdGUgaGFzaCAoaWYgaXQgaGFzIGFuIGlkKVxyXG5cdFx0XHRcdC8vIGdpdmVzIGEgbWFqb3IgcGVyZm9ybWFuY2UgYm9vc3Qgd2hlbiByZW1vdmluZyB0aG91c2FuZHMgb2YgbWFwIGxheWVyc1xyXG5cclxuXHRcdFx0XHRpbmRleEtleSA9IHR5cGUgKyAnX2lkeCc7XHJcblx0XHRcdFx0aW5kZXhMZW5LZXkgPSBpbmRleEtleSArICdfbGVuJztcclxuXHJcblx0XHRcdFx0dHlwZUluZGV4ID0gZXZlbnRzW2luZGV4S2V5XSA9IGV2ZW50c1tpbmRleEtleV0gfHwge307XHJcblxyXG5cdFx0XHRcdGlmICghdHlwZUluZGV4W2NvbnRleHRJZF0pIHtcclxuXHRcdFx0XHRcdHR5cGVJbmRleFtjb250ZXh0SWRdID0gW107XHJcblxyXG5cdFx0XHRcdFx0Ly8ga2VlcCB0cmFjayBvZiB0aGUgbnVtYmVyIG9mIGtleXMgaW4gdGhlIGluZGV4IHRvIHF1aWNrbHkgY2hlY2sgaWYgaXQncyBlbXB0eVxyXG5cdFx0XHRcdFx0ZXZlbnRzW2luZGV4TGVuS2V5XSA9IChldmVudHNbaW5kZXhMZW5LZXldIHx8IDApICsgMTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHR5cGVJbmRleFtjb250ZXh0SWRdLnB1c2goZXZlbnQpO1xyXG5cclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0ZXZlbnRzW3R5cGVdID0gZXZlbnRzW3R5cGVdIHx8IFtdO1xyXG5cdFx0XHRcdGV2ZW50c1t0eXBlXS5wdXNoKGV2ZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGhhc0V2ZW50TGlzdGVuZXJzOiBmdW5jdGlvbiAodHlwZSkgeyAvLyAoU3RyaW5nKSAtPiBCb29sZWFuXHJcblx0XHR2YXIgZXZlbnRzID0gdGhpc1tldmVudHNLZXldO1xyXG5cdFx0cmV0dXJuICEhZXZlbnRzICYmICgodHlwZSBpbiBldmVudHMgJiYgZXZlbnRzW3R5cGVdLmxlbmd0aCA+IDApIHx8XHJcblx0XHQgICAgICAgICAgICAgICAgICAgICh0eXBlICsgJ19pZHgnIGluIGV2ZW50cyAmJiBldmVudHNbdHlwZSArICdfaWR4X2xlbiddID4gMCkpO1xyXG5cdH0sXHJcblxyXG5cdHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uICh0eXBlcywgZm4sIGNvbnRleHQpIHsgLy8gKFtTdHJpbmcsIEZ1bmN0aW9uLCBPYmplY3RdKSBvciAoT2JqZWN0WywgT2JqZWN0XSlcclxuXHJcblx0XHRpZiAoIXRoaXNbZXZlbnRzS2V5XSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXR5cGVzKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLmNsZWFyQWxsRXZlbnRMaXN0ZW5lcnMoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoTC5VdGlsLmludm9rZUVhY2godHlwZXMsIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciwgdGhpcywgZm4sIGNvbnRleHQpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cdFx0dmFyIGV2ZW50cyA9IHRoaXNbZXZlbnRzS2V5XSxcclxuXHRcdCAgICBjb250ZXh0SWQgPSBjb250ZXh0ICYmIGNvbnRleHQgIT09IHRoaXMgJiYgTC5zdGFtcChjb250ZXh0KSxcclxuXHRcdCAgICBpLCBsZW4sIHR5cGUsIGxpc3RlbmVycywgaiwgaW5kZXhLZXksIGluZGV4TGVuS2V5LCB0eXBlSW5kZXgsIHJlbW92ZWQ7XHJcblxyXG5cdFx0dHlwZXMgPSBMLlV0aWwuc3BsaXRXb3Jkcyh0eXBlcyk7XHJcblxyXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gdHlwZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dHlwZSA9IHR5cGVzW2ldO1xyXG5cdFx0XHRpbmRleEtleSA9IHR5cGUgKyAnX2lkeCc7XHJcblx0XHRcdGluZGV4TGVuS2V5ID0gaW5kZXhLZXkgKyAnX2xlbic7XHJcblxyXG5cdFx0XHR0eXBlSW5kZXggPSBldmVudHNbaW5kZXhLZXldO1xyXG5cclxuXHRcdFx0aWYgKCFmbikge1xyXG5cdFx0XHRcdC8vIGNsZWFyIGFsbCBsaXN0ZW5lcnMgZm9yIGEgdHlwZSBpZiBmdW5jdGlvbiBpc24ndCBzcGVjaWZpZWRcclxuXHRcdFx0XHRkZWxldGUgZXZlbnRzW3R5cGVdO1xyXG5cdFx0XHRcdGRlbGV0ZSBldmVudHNbaW5kZXhLZXldO1xyXG5cdFx0XHRcdGRlbGV0ZSBldmVudHNbaW5kZXhMZW5LZXldO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnMgPSBjb250ZXh0SWQgJiYgdHlwZUluZGV4ID8gdHlwZUluZGV4W2NvbnRleHRJZF0gOiBldmVudHNbdHlwZV07XHJcblxyXG5cdFx0XHRcdGlmIChsaXN0ZW5lcnMpIHtcclxuXHRcdFx0XHRcdGZvciAoaiA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoKGxpc3RlbmVyc1tqXS5hY3Rpb24gPT09IGZuKSAmJiAoIWNvbnRleHQgfHwgKGxpc3RlbmVyc1tqXS5jb250ZXh0ID09PSBjb250ZXh0KSkpIHtcclxuXHRcdFx0XHRcdFx0XHRyZW1vdmVkID0gbGlzdGVuZXJzLnNwbGljZShqLCAxKTtcclxuXHRcdFx0XHRcdFx0XHQvLyBzZXQgdGhlIG9sZCBhY3Rpb24gdG8gYSBuby1vcCwgYmVjYXVzZSBpdCBpcyBwb3NzaWJsZVxyXG5cdFx0XHRcdFx0XHRcdC8vIHRoYXQgdGhlIGxpc3RlbmVyIGlzIGJlaW5nIGl0ZXJhdGVkIG92ZXIgYXMgcGFydCBvZiBhIGRpc3BhdGNoXHJcblx0XHRcdFx0XHRcdFx0cmVtb3ZlZFswXS5hY3Rpb24gPSBMLlV0aWwuZmFsc2VGbjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmIChjb250ZXh0ICYmIHR5cGVJbmRleCAmJiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkpIHtcclxuXHRcdFx0XHRcdFx0ZGVsZXRlIHR5cGVJbmRleFtjb250ZXh0SWRdO1xyXG5cdFx0XHRcdFx0XHRldmVudHNbaW5kZXhMZW5LZXldLS07XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0Y2xlYXJBbGxFdmVudExpc3RlbmVyczogZnVuY3Rpb24gKCkge1xyXG5cdFx0ZGVsZXRlIHRoaXNbZXZlbnRzS2V5XTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGZpcmVFdmVudDogZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHsgLy8gKFN0cmluZ1ssIE9iamVjdF0pXHJcblx0XHRpZiAoIXRoaXMuaGFzRXZlbnRMaXN0ZW5lcnModHlwZSkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGV2ZW50ID0gTC5VdGlsLmV4dGVuZCh7fSwgZGF0YSwgeyB0eXBlOiB0eXBlLCB0YXJnZXQ6IHRoaXMgfSk7XHJcblxyXG5cdFx0dmFyIGV2ZW50cyA9IHRoaXNbZXZlbnRzS2V5XSxcclxuXHRcdCAgICBsaXN0ZW5lcnMsIGksIGxlbiwgdHlwZUluZGV4LCBjb250ZXh0SWQ7XHJcblxyXG5cdFx0aWYgKGV2ZW50c1t0eXBlXSkge1xyXG5cdFx0XHQvLyBtYWtlIHN1cmUgYWRkaW5nL3JlbW92aW5nIGxpc3RlbmVycyBpbnNpZGUgb3RoZXIgbGlzdGVuZXJzIHdvbid0IGNhdXNlIGluZmluaXRlIGxvb3BcclxuXHRcdFx0bGlzdGVuZXJzID0gZXZlbnRzW3R5cGVdLnNsaWNlKCk7XHJcblxyXG5cdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnNbaV0uYWN0aW9uLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGV2ZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGZpcmUgZXZlbnQgZm9yIHRoZSBjb250ZXh0LWluZGV4ZWQgbGlzdGVuZXJzIGFzIHdlbGxcclxuXHRcdHR5cGVJbmRleCA9IGV2ZW50c1t0eXBlICsgJ19pZHgnXTtcclxuXHJcblx0XHRmb3IgKGNvbnRleHRJZCBpbiB0eXBlSW5kZXgpIHtcclxuXHRcdFx0bGlzdGVuZXJzID0gdHlwZUluZGV4W2NvbnRleHRJZF0uc2xpY2UoKTtcclxuXHJcblx0XHRcdGlmIChsaXN0ZW5lcnMpIHtcclxuXHRcdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdGxpc3RlbmVyc1tpXS5hY3Rpb24uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgZXZlbnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGFkZE9uZVRpbWVFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAodHlwZXMsIGZuLCBjb250ZXh0KSB7XHJcblxyXG5cdFx0aWYgKEwuVXRpbC5pbnZva2VFYWNoKHR5cGVzLCB0aGlzLmFkZE9uZVRpbWVFdmVudExpc3RlbmVyLCB0aGlzLCBmbiwgY29udGV4dCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcblx0XHR2YXIgaGFuZGxlciA9IEwuYmluZChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXNcclxuXHRcdFx0ICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGVzLCBmbiwgY29udGV4dClcclxuXHRcdFx0ICAgIC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGVzLCBoYW5kbGVyLCBjb250ZXh0KTtcclxuXHRcdH0sIHRoaXMpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHQgICAgLmFkZEV2ZW50TGlzdGVuZXIodHlwZXMsIGZuLCBjb250ZXh0KVxyXG5cdFx0ICAgIC5hZGRFdmVudExpc3RlbmVyKHR5cGVzLCBoYW5kbGVyLCBjb250ZXh0KTtcclxuXHR9XHJcbn07XHJcblxyXG5MLk1peGluLkV2ZW50cy5vbiA9IEwuTWl4aW4uRXZlbnRzLmFkZEV2ZW50TGlzdGVuZXI7XHJcbkwuTWl4aW4uRXZlbnRzLm9mZiA9IEwuTWl4aW4uRXZlbnRzLnJlbW92ZUV2ZW50TGlzdGVuZXI7XHJcbkwuTWl4aW4uRXZlbnRzLm9uY2UgPSBMLk1peGluLkV2ZW50cy5hZGRPbmVUaW1lRXZlbnRMaXN0ZW5lcjtcclxuTC5NaXhpbi5FdmVudHMuZmlyZSA9IEwuTWl4aW4uRXZlbnRzLmZpcmVFdmVudDtcclxuXG5cbi8qXHJcbiAqIEwuQnJvd3NlciBoYW5kbGVzIGRpZmZlcmVudCBicm93c2VyIGFuZCBmZWF0dXJlIGRldGVjdGlvbnMgZm9yIGludGVybmFsIExlYWZsZXQgdXNlLlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcblxyXG5cdHZhciBpZSA9ICdBY3RpdmVYT2JqZWN0JyBpbiB3aW5kb3csXHJcblx0XHRpZWx0OSA9IGllICYmICFkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyLFxyXG5cclxuXHQgICAgLy8gdGVycmlibGUgYnJvd3NlciBkZXRlY3Rpb24gdG8gd29yayBhcm91bmQgU2FmYXJpIC8gaU9TIC8gQW5kcm9pZCBicm93c2VyIGJ1Z3NcclxuXHQgICAgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCksXHJcblx0ICAgIHdlYmtpdCA9IHVhLmluZGV4T2YoJ3dlYmtpdCcpICE9PSAtMSxcclxuXHQgICAgY2hyb21lID0gdWEuaW5kZXhPZignY2hyb21lJykgIT09IC0xLFxyXG5cdCAgICBwaGFudG9tanMgPSB1YS5pbmRleE9mKCdwaGFudG9tJykgIT09IC0xLFxyXG5cdCAgICBhbmRyb2lkID0gdWEuaW5kZXhPZignYW5kcm9pZCcpICE9PSAtMSxcclxuXHQgICAgYW5kcm9pZDIzID0gdWEuc2VhcmNoKCdhbmRyb2lkIFsyM10nKSAhPT0gLTEsXHJcblx0XHRnZWNrbyA9IHVhLmluZGV4T2YoJ2dlY2tvJykgIT09IC0xLFxyXG5cclxuXHQgICAgbW9iaWxlID0gdHlwZW9mIG9yaWVudGF0aW9uICE9PSB1bmRlZmluZWQgKyAnJyxcclxuXHQgICAgbXNQb2ludGVyID0gd2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgJiZcclxuXHQgICAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cyAmJiAhd2luZG93LlBvaW50ZXJFdmVudCxcclxuXHRcdHBvaW50ZXIgPSAod2luZG93LlBvaW50ZXJFdmVudCAmJiB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICYmIHdpbmRvdy5uYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMpIHx8XHJcblx0XHRcdFx0ICBtc1BvaW50ZXIsXHJcblx0ICAgIHJldGluYSA9ICgnZGV2aWNlUGl4ZWxSYXRpbycgaW4gd2luZG93ICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID4gMSkgfHxcclxuXHQgICAgICAgICAgICAgKCdtYXRjaE1lZGlhJyBpbiB3aW5kb3cgJiYgd2luZG93Lm1hdGNoTWVkaWEoJyhtaW4tcmVzb2x1dGlvbjoxNDRkcGkpJykgJiZcclxuXHQgICAgICAgICAgICAgIHdpbmRvdy5tYXRjaE1lZGlhKCcobWluLXJlc29sdXRpb246MTQ0ZHBpKScpLm1hdGNoZXMpLFxyXG5cclxuXHQgICAgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxyXG5cdCAgICBpZTNkID0gaWUgJiYgKCd0cmFuc2l0aW9uJyBpbiBkb2Muc3R5bGUpLFxyXG5cdCAgICB3ZWJraXQzZCA9ICgnV2ViS2l0Q1NTTWF0cml4JyBpbiB3aW5kb3cpICYmICgnbTExJyBpbiBuZXcgd2luZG93LldlYktpdENTU01hdHJpeCgpKSAmJiAhYW5kcm9pZDIzLFxyXG5cdCAgICBnZWNrbzNkID0gJ01velBlcnNwZWN0aXZlJyBpbiBkb2Muc3R5bGUsXHJcblx0ICAgIG9wZXJhM2QgPSAnT1RyYW5zaXRpb24nIGluIGRvYy5zdHlsZSxcclxuXHQgICAgYW55M2QgPSAhd2luZG93LkxfRElTQUJMRV8zRCAmJiAoaWUzZCB8fCB3ZWJraXQzZCB8fCBnZWNrbzNkIHx8IG9wZXJhM2QpICYmICFwaGFudG9tanM7XHJcblxyXG5cclxuXHQvLyBQaGFudG9tSlMgaGFzICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgYnV0IGRvZXNuJ3QgYWN0dWFsbHkgc3VwcG9ydCB0b3VjaC5cclxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vTGVhZmxldC9MZWFmbGV0L3B1bGwvMTQzNCNpc3N1ZWNvbW1lbnQtMTM4NDMxNTFcclxuXHJcblx0dmFyIHRvdWNoID0gIXdpbmRvdy5MX05PX1RPVUNIICYmICFwaGFudG9tanMgJiYgKGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHR2YXIgc3RhcnROYW1lID0gJ29udG91Y2hzdGFydCc7XHJcblxyXG5cdFx0Ly8gSUUxMCsgKFdlIHNpbXVsYXRlIHRoZXNlIGludG8gdG91Y2gqIGV2ZW50cyBpbiBMLkRvbUV2ZW50IGFuZCBMLkRvbUV2ZW50LlBvaW50ZXIpIG9yIFdlYktpdCwgZXRjLlxyXG5cdFx0aWYgKHBvaW50ZXIgfHwgKHN0YXJ0TmFtZSBpbiBkb2MpKSB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEZpcmVmb3gvR2Vja29cclxuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcclxuXHRcdCAgICBzdXBwb3J0ZWQgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoIWRpdi5zZXRBdHRyaWJ1dGUpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0ZGl2LnNldEF0dHJpYnV0ZShzdGFydE5hbWUsICdyZXR1cm47Jyk7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBkaXZbc3RhcnROYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRzdXBwb3J0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGRpdi5yZW1vdmVBdHRyaWJ1dGUoc3RhcnROYW1lKTtcclxuXHRcdGRpdiA9IG51bGw7XHJcblxyXG5cdFx0cmV0dXJuIHN1cHBvcnRlZDtcclxuXHR9KCkpO1xyXG5cclxuXHJcblx0TC5Ccm93c2VyID0ge1xyXG5cdFx0aWU6IGllLFxyXG5cdFx0aWVsdDk6IGllbHQ5LFxyXG5cdFx0d2Via2l0OiB3ZWJraXQsXHJcblx0XHRnZWNrbzogZ2Vja28gJiYgIXdlYmtpdCAmJiAhd2luZG93Lm9wZXJhICYmICFpZSxcclxuXHJcblx0XHRhbmRyb2lkOiBhbmRyb2lkLFxyXG5cdFx0YW5kcm9pZDIzOiBhbmRyb2lkMjMsXHJcblxyXG5cdFx0Y2hyb21lOiBjaHJvbWUsXHJcblxyXG5cdFx0aWUzZDogaWUzZCxcclxuXHRcdHdlYmtpdDNkOiB3ZWJraXQzZCxcclxuXHRcdGdlY2tvM2Q6IGdlY2tvM2QsXHJcblx0XHRvcGVyYTNkOiBvcGVyYTNkLFxyXG5cdFx0YW55M2Q6IGFueTNkLFxyXG5cclxuXHRcdG1vYmlsZTogbW9iaWxlLFxyXG5cdFx0bW9iaWxlV2Via2l0OiBtb2JpbGUgJiYgd2Via2l0LFxyXG5cdFx0bW9iaWxlV2Via2l0M2Q6IG1vYmlsZSAmJiB3ZWJraXQzZCxcclxuXHRcdG1vYmlsZU9wZXJhOiBtb2JpbGUgJiYgd2luZG93Lm9wZXJhLFxyXG5cclxuXHRcdHRvdWNoOiB0b3VjaCxcclxuXHRcdG1zUG9pbnRlcjogbXNQb2ludGVyLFxyXG5cdFx0cG9pbnRlcjogcG9pbnRlcixcclxuXHJcblx0XHRyZXRpbmE6IHJldGluYVxyXG5cdH07XHJcblxyXG59KCkpO1xyXG5cblxuLypcclxuICogTC5Qb2ludCByZXByZXNlbnRzIGEgcG9pbnQgd2l0aCB4IGFuZCB5IGNvb3JkaW5hdGVzLlxyXG4gKi9cclxuXHJcbkwuUG9pbnQgPSBmdW5jdGlvbiAoLypOdW1iZXIqLyB4LCAvKk51bWJlciovIHksIC8qQm9vbGVhbiovIHJvdW5kKSB7XHJcblx0dGhpcy54ID0gKHJvdW5kID8gTWF0aC5yb3VuZCh4KSA6IHgpO1xyXG5cdHRoaXMueSA9IChyb3VuZCA/IE1hdGgucm91bmQoeSkgOiB5KTtcclxufTtcclxuXHJcbkwuUG9pbnQucHJvdG90eXBlID0ge1xyXG5cclxuXHRjbG9uZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KHRoaXMueCwgdGhpcy55KTtcclxuXHR9LFxyXG5cclxuXHQvLyBub24tZGVzdHJ1Y3RpdmUsIHJldHVybnMgYSBuZXcgcG9pbnRcclxuXHRhZGQ6IGZ1bmN0aW9uIChwb2ludCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuY2xvbmUoKS5fYWRkKEwucG9pbnQocG9pbnQpKTtcclxuXHR9LFxyXG5cclxuXHQvLyBkZXN0cnVjdGl2ZSwgdXNlZCBkaXJlY3RseSBmb3IgcGVyZm9ybWFuY2UgaW4gc2l0dWF0aW9ucyB3aGVyZSBpdCdzIHNhZmUgdG8gbW9kaWZ5IGV4aXN0aW5nIHBvaW50XHJcblx0X2FkZDogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHR0aGlzLnggKz0gcG9pbnQueDtcclxuXHRcdHRoaXMueSArPSBwb2ludC55O1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0c3VidHJhY3Q6IGZ1bmN0aW9uIChwb2ludCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuY2xvbmUoKS5fc3VidHJhY3QoTC5wb2ludChwb2ludCkpO1xyXG5cdH0sXHJcblxyXG5cdF9zdWJ0cmFjdDogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHR0aGlzLnggLT0gcG9pbnQueDtcclxuXHRcdHRoaXMueSAtPSBwb2ludC55O1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0ZGl2aWRlQnk6IGZ1bmN0aW9uIChudW0pIHtcclxuXHRcdHJldHVybiB0aGlzLmNsb25lKCkuX2RpdmlkZUJ5KG51bSk7XHJcblx0fSxcclxuXHJcblx0X2RpdmlkZUJ5OiBmdW5jdGlvbiAobnVtKSB7XHJcblx0XHR0aGlzLnggLz0gbnVtO1xyXG5cdFx0dGhpcy55IC89IG51bTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG11bHRpcGx5Qnk6IGZ1bmN0aW9uIChudW0pIHtcclxuXHRcdHJldHVybiB0aGlzLmNsb25lKCkuX211bHRpcGx5QnkobnVtKTtcclxuXHR9LFxyXG5cclxuXHRfbXVsdGlwbHlCeTogZnVuY3Rpb24gKG51bSkge1xyXG5cdFx0dGhpcy54ICo9IG51bTtcclxuXHRcdHRoaXMueSAqPSBudW07XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyb3VuZDogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuY2xvbmUoKS5fcm91bmQoKTtcclxuXHR9LFxyXG5cclxuXHRfcm91bmQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMueCA9IE1hdGgucm91bmQodGhpcy54KTtcclxuXHRcdHRoaXMueSA9IE1hdGgucm91bmQodGhpcy55KTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGZsb29yOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5jbG9uZSgpLl9mbG9vcigpO1xyXG5cdH0sXHJcblxyXG5cdF9mbG9vcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhpcy54ID0gTWF0aC5mbG9vcih0aGlzLngpO1xyXG5cdFx0dGhpcy55ID0gTWF0aC5mbG9vcih0aGlzLnkpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0ZGlzdGFuY2VUbzogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHRwb2ludCA9IEwucG9pbnQocG9pbnQpO1xyXG5cclxuXHRcdHZhciB4ID0gcG9pbnQueCAtIHRoaXMueCxcclxuXHRcdCAgICB5ID0gcG9pbnQueSAtIHRoaXMueTtcclxuXHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xyXG5cdH0sXHJcblxyXG5cdGVxdWFsczogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHRwb2ludCA9IEwucG9pbnQocG9pbnQpO1xyXG5cclxuXHRcdHJldHVybiBwb2ludC54ID09PSB0aGlzLnggJiZcclxuXHRcdCAgICAgICBwb2ludC55ID09PSB0aGlzLnk7XHJcblx0fSxcclxuXHJcblx0Y29udGFpbnM6IGZ1bmN0aW9uIChwb2ludCkge1xyXG5cdFx0cG9pbnQgPSBMLnBvaW50KHBvaW50KTtcclxuXHJcblx0XHRyZXR1cm4gTWF0aC5hYnMocG9pbnQueCkgPD0gTWF0aC5hYnModGhpcy54KSAmJlxyXG5cdFx0ICAgICAgIE1hdGguYWJzKHBvaW50LnkpIDw9IE1hdGguYWJzKHRoaXMueSk7XHJcblx0fSxcclxuXHJcblx0dG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAnUG9pbnQoJyArXHJcblx0XHQgICAgICAgIEwuVXRpbC5mb3JtYXROdW0odGhpcy54KSArICcsICcgK1xyXG5cdFx0ICAgICAgICBMLlV0aWwuZm9ybWF0TnVtKHRoaXMueSkgKyAnKSc7XHJcblx0fVxyXG59O1xyXG5cclxuTC5wb2ludCA9IGZ1bmN0aW9uICh4LCB5LCByb3VuZCkge1xyXG5cdGlmICh4IGluc3RhbmNlb2YgTC5Qb2ludCkge1xyXG5cdFx0cmV0dXJuIHg7XHJcblx0fVxyXG5cdGlmIChMLlV0aWwuaXNBcnJheSh4KSkge1xyXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KHhbMF0sIHhbMV0pO1xyXG5cdH1cclxuXHRpZiAoeCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGwpIHtcclxuXHRcdHJldHVybiB4O1xyXG5cdH1cclxuXHRyZXR1cm4gbmV3IEwuUG9pbnQoeCwgeSwgcm91bmQpO1xyXG59O1xyXG5cblxuLypcclxuICogTC5Cb3VuZHMgcmVwcmVzZW50cyBhIHJlY3Rhbmd1bGFyIGFyZWEgb24gdGhlIHNjcmVlbiBpbiBwaXhlbCBjb29yZGluYXRlcy5cclxuICovXHJcblxyXG5MLkJvdW5kcyA9IGZ1bmN0aW9uIChhLCBiKSB7IC8vKFBvaW50LCBQb2ludCkgb3IgUG9pbnRbXVxyXG5cdGlmICghYSkgeyByZXR1cm47IH1cclxuXHJcblx0dmFyIHBvaW50cyA9IGIgPyBbYSwgYl0gOiBhO1xyXG5cclxuXHRmb3IgKHZhciBpID0gMCwgbGVuID0gcG9pbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHR0aGlzLmV4dGVuZChwb2ludHNbaV0pO1xyXG5cdH1cclxufTtcclxuXHJcbkwuQm91bmRzLnByb3RvdHlwZSA9IHtcclxuXHQvLyBleHRlbmQgdGhlIGJvdW5kcyB0byBjb250YWluIHRoZSBnaXZlbiBwb2ludFxyXG5cdGV4dGVuZDogZnVuY3Rpb24gKHBvaW50KSB7IC8vIChQb2ludClcclxuXHRcdHBvaW50ID0gTC5wb2ludChwb2ludCk7XHJcblxyXG5cdFx0aWYgKCF0aGlzLm1pbiAmJiAhdGhpcy5tYXgpIHtcclxuXHRcdFx0dGhpcy5taW4gPSBwb2ludC5jbG9uZSgpO1xyXG5cdFx0XHR0aGlzLm1heCA9IHBvaW50LmNsb25lKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLm1pbi54ID0gTWF0aC5taW4ocG9pbnQueCwgdGhpcy5taW4ueCk7XHJcblx0XHRcdHRoaXMubWF4LnggPSBNYXRoLm1heChwb2ludC54LCB0aGlzLm1heC54KTtcclxuXHRcdFx0dGhpcy5taW4ueSA9IE1hdGgubWluKHBvaW50LnksIHRoaXMubWluLnkpO1xyXG5cdFx0XHR0aGlzLm1heC55ID0gTWF0aC5tYXgocG9pbnQueSwgdGhpcy5tYXgueSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRnZXRDZW50ZXI6IGZ1bmN0aW9uIChyb3VuZCkgeyAvLyAoQm9vbGVhbikgLT4gUG9pbnRcclxuXHRcdHJldHVybiBuZXcgTC5Qb2ludChcclxuXHRcdCAgICAgICAgKHRoaXMubWluLnggKyB0aGlzLm1heC54KSAvIDIsXHJcblx0XHQgICAgICAgICh0aGlzLm1pbi55ICsgdGhpcy5tYXgueSkgLyAyLCByb3VuZCk7XHJcblx0fSxcclxuXHJcblx0Z2V0Qm90dG9tTGVmdDogZnVuY3Rpb24gKCkgeyAvLyAtPiBQb2ludFxyXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KHRoaXMubWluLngsIHRoaXMubWF4LnkpO1xyXG5cdH0sXHJcblxyXG5cdGdldFRvcFJpZ2h0OiBmdW5jdGlvbiAoKSB7IC8vIC0+IFBvaW50XHJcblx0XHRyZXR1cm4gbmV3IEwuUG9pbnQodGhpcy5tYXgueCwgdGhpcy5taW4ueSk7XHJcblx0fSxcclxuXHJcblx0Z2V0U2l6ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMubWF4LnN1YnRyYWN0KHRoaXMubWluKTtcclxuXHR9LFxyXG5cclxuXHRjb250YWluczogZnVuY3Rpb24gKG9iaikgeyAvLyAoQm91bmRzKSBvciAoUG9pbnQpIC0+IEJvb2xlYW5cclxuXHRcdHZhciBtaW4sIG1heDtcclxuXHJcblx0XHRpZiAodHlwZW9mIG9ialswXSA9PT0gJ251bWJlcicgfHwgb2JqIGluc3RhbmNlb2YgTC5Qb2ludCkge1xyXG5cdFx0XHRvYmogPSBMLnBvaW50KG9iaik7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvYmogPSBMLmJvdW5kcyhvYmopO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvYmogaW5zdGFuY2VvZiBMLkJvdW5kcykge1xyXG5cdFx0XHRtaW4gPSBvYmoubWluO1xyXG5cdFx0XHRtYXggPSBvYmoubWF4O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bWluID0gbWF4ID0gb2JqO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiAobWluLnggPj0gdGhpcy5taW4ueCkgJiZcclxuXHRcdCAgICAgICAobWF4LnggPD0gdGhpcy5tYXgueCkgJiZcclxuXHRcdCAgICAgICAobWluLnkgPj0gdGhpcy5taW4ueSkgJiZcclxuXHRcdCAgICAgICAobWF4LnkgPD0gdGhpcy5tYXgueSk7XHJcblx0fSxcclxuXHJcblx0aW50ZXJzZWN0czogZnVuY3Rpb24gKGJvdW5kcykgeyAvLyAoQm91bmRzKSAtPiBCb29sZWFuXHJcblx0XHRib3VuZHMgPSBMLmJvdW5kcyhib3VuZHMpO1xyXG5cclxuXHRcdHZhciBtaW4gPSB0aGlzLm1pbixcclxuXHRcdCAgICBtYXggPSB0aGlzLm1heCxcclxuXHRcdCAgICBtaW4yID0gYm91bmRzLm1pbixcclxuXHRcdCAgICBtYXgyID0gYm91bmRzLm1heCxcclxuXHRcdCAgICB4SW50ZXJzZWN0cyA9IChtYXgyLnggPj0gbWluLngpICYmIChtaW4yLnggPD0gbWF4LngpLFxyXG5cdFx0ICAgIHlJbnRlcnNlY3RzID0gKG1heDIueSA+PSBtaW4ueSkgJiYgKG1pbjIueSA8PSBtYXgueSk7XHJcblxyXG5cdFx0cmV0dXJuIHhJbnRlcnNlY3RzICYmIHlJbnRlcnNlY3RzO1xyXG5cdH0sXHJcblxyXG5cdGlzVmFsaWQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAhISh0aGlzLm1pbiAmJiB0aGlzLm1heCk7XHJcblx0fVxyXG59O1xyXG5cclxuTC5ib3VuZHMgPSBmdW5jdGlvbiAoYSwgYikgeyAvLyAoQm91bmRzKSBvciAoUG9pbnQsIFBvaW50KSBvciAoUG9pbnRbXSlcclxuXHRpZiAoIWEgfHwgYSBpbnN0YW5jZW9mIEwuQm91bmRzKSB7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9XHJcblx0cmV0dXJuIG5ldyBMLkJvdW5kcyhhLCBiKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIEwuVHJhbnNmb3JtYXRpb24gaXMgYW4gdXRpbGl0eSBjbGFzcyB0byBwZXJmb3JtIHNpbXBsZSBwb2ludCB0cmFuc2Zvcm1hdGlvbnMgdGhyb3VnaCBhIDJkLW1hdHJpeC5cclxuICovXHJcblxyXG5MLlRyYW5zZm9ybWF0aW9uID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQpIHtcclxuXHR0aGlzLl9hID0gYTtcclxuXHR0aGlzLl9iID0gYjtcclxuXHR0aGlzLl9jID0gYztcclxuXHR0aGlzLl9kID0gZDtcclxufTtcclxuXHJcbkwuVHJhbnNmb3JtYXRpb24ucHJvdG90eXBlID0ge1xyXG5cdHRyYW5zZm9ybTogZnVuY3Rpb24gKHBvaW50LCBzY2FsZSkgeyAvLyAoUG9pbnQsIE51bWJlcikgLT4gUG9pbnRcclxuXHRcdHJldHVybiB0aGlzLl90cmFuc2Zvcm0ocG9pbnQuY2xvbmUoKSwgc2NhbGUpO1xyXG5cdH0sXHJcblxyXG5cdC8vIGRlc3RydWN0aXZlIHRyYW5zZm9ybSAoZmFzdGVyKVxyXG5cdF90cmFuc2Zvcm06IGZ1bmN0aW9uIChwb2ludCwgc2NhbGUpIHtcclxuXHRcdHNjYWxlID0gc2NhbGUgfHwgMTtcclxuXHRcdHBvaW50LnggPSBzY2FsZSAqICh0aGlzLl9hICogcG9pbnQueCArIHRoaXMuX2IpO1xyXG5cdFx0cG9pbnQueSA9IHNjYWxlICogKHRoaXMuX2MgKiBwb2ludC55ICsgdGhpcy5fZCk7XHJcblx0XHRyZXR1cm4gcG9pbnQ7XHJcblx0fSxcclxuXHJcblx0dW50cmFuc2Zvcm06IGZ1bmN0aW9uIChwb2ludCwgc2NhbGUpIHtcclxuXHRcdHNjYWxlID0gc2NhbGUgfHwgMTtcclxuXHRcdHJldHVybiBuZXcgTC5Qb2ludChcclxuXHRcdCAgICAgICAgKHBvaW50LnggLyBzY2FsZSAtIHRoaXMuX2IpIC8gdGhpcy5fYSxcclxuXHRcdCAgICAgICAgKHBvaW50LnkgLyBzY2FsZSAtIHRoaXMuX2QpIC8gdGhpcy5fYyk7XHJcblx0fVxyXG59O1xyXG5cblxuLypcclxuICogTC5Eb21VdGlsIGNvbnRhaW5zIHZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnMgZm9yIHdvcmtpbmcgd2l0aCBET00uXHJcbiAqL1xyXG5cclxuTC5Eb21VdGlsID0ge1xyXG5cdGdldDogZnVuY3Rpb24gKGlkKSB7XHJcblx0XHRyZXR1cm4gKHR5cGVvZiBpZCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgOiBpZCk7XHJcblx0fSxcclxuXHJcblx0Z2V0U3R5bGU6IGZ1bmN0aW9uIChlbCwgc3R5bGUpIHtcclxuXHJcblx0XHR2YXIgdmFsdWUgPSBlbC5zdHlsZVtzdHlsZV07XHJcblxyXG5cdFx0aWYgKCF2YWx1ZSAmJiBlbC5jdXJyZW50U3R5bGUpIHtcclxuXHRcdFx0dmFsdWUgPSBlbC5jdXJyZW50U3R5bGVbc3R5bGVdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICgoIXZhbHVlIHx8IHZhbHVlID09PSAnYXV0bycpICYmIGRvY3VtZW50LmRlZmF1bHRWaWV3KSB7XHJcblx0XHRcdHZhciBjc3MgPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBudWxsKTtcclxuXHRcdFx0dmFsdWUgPSBjc3MgPyBjc3Nbc3R5bGVdIDogbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdmFsdWUgPT09ICdhdXRvJyA/IG51bGwgOiB2YWx1ZTtcclxuXHR9LFxyXG5cclxuXHRnZXRWaWV3cG9ydE9mZnNldDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuXHJcblx0XHR2YXIgdG9wID0gMCxcclxuXHRcdCAgICBsZWZ0ID0gMCxcclxuXHRcdCAgICBlbCA9IGVsZW1lbnQsXHJcblx0XHQgICAgZG9jQm9keSA9IGRvY3VtZW50LmJvZHksXHJcblx0XHQgICAgZG9jRWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXHJcblx0XHQgICAgcG9zO1xyXG5cclxuXHRcdGRvIHtcclxuXHRcdFx0dG9wICArPSBlbC5vZmZzZXRUb3AgIHx8IDA7XHJcblx0XHRcdGxlZnQgKz0gZWwub2Zmc2V0TGVmdCB8fCAwO1xyXG5cclxuXHRcdFx0Ly9hZGQgYm9yZGVyc1xyXG5cdFx0XHR0b3AgKz0gcGFyc2VJbnQoTC5Eb21VdGlsLmdldFN0eWxlKGVsLCAnYm9yZGVyVG9wV2lkdGgnKSwgMTApIHx8IDA7XHJcblx0XHRcdGxlZnQgKz0gcGFyc2VJbnQoTC5Eb21VdGlsLmdldFN0eWxlKGVsLCAnYm9yZGVyTGVmdFdpZHRoJyksIDEwKSB8fCAwO1xyXG5cclxuXHRcdFx0cG9zID0gTC5Eb21VdGlsLmdldFN0eWxlKGVsLCAncG9zaXRpb24nKTtcclxuXHJcblx0XHRcdGlmIChlbC5vZmZzZXRQYXJlbnQgPT09IGRvY0JvZHkgJiYgcG9zID09PSAnYWJzb2x1dGUnKSB7IGJyZWFrOyB9XHJcblxyXG5cdFx0XHRpZiAocG9zID09PSAnZml4ZWQnKSB7XHJcblx0XHRcdFx0dG9wICArPSBkb2NCb2R5LnNjcm9sbFRvcCAgfHwgZG9jRWwuc2Nyb2xsVG9wICB8fCAwO1xyXG5cdFx0XHRcdGxlZnQgKz0gZG9jQm9keS5zY3JvbGxMZWZ0IHx8IGRvY0VsLnNjcm9sbExlZnQgfHwgMDtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHBvcyA9PT0gJ3JlbGF0aXZlJyAmJiAhZWwub2Zmc2V0TGVmdCkge1xyXG5cdFx0XHRcdHZhciB3aWR0aCA9IEwuRG9tVXRpbC5nZXRTdHlsZShlbCwgJ3dpZHRoJyksXHJcblx0XHRcdFx0ICAgIG1heFdpZHRoID0gTC5Eb21VdGlsLmdldFN0eWxlKGVsLCAnbWF4LXdpZHRoJyksXHJcblx0XHRcdFx0ICAgIHIgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcblx0XHRcdFx0aWYgKHdpZHRoICE9PSAnbm9uZScgfHwgbWF4V2lkdGggIT09ICdub25lJykge1xyXG5cdFx0XHRcdFx0bGVmdCArPSByLmxlZnQgKyBlbC5jbGllbnRMZWZ0O1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly9jYWxjdWxhdGUgZnVsbCB5IG9mZnNldCBzaW5jZSB3ZSdyZSBicmVha2luZyBvdXQgb2YgdGhlIGxvb3BcclxuXHRcdFx0XHR0b3AgKz0gci50b3AgKyAoZG9jQm9keS5zY3JvbGxUb3AgIHx8IGRvY0VsLnNjcm9sbFRvcCAgfHwgMCk7XHJcblxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRlbCA9IGVsLm9mZnNldFBhcmVudDtcclxuXHJcblx0XHR9IHdoaWxlIChlbCk7XHJcblxyXG5cdFx0ZWwgPSBlbGVtZW50O1xyXG5cclxuXHRcdGRvIHtcclxuXHRcdFx0aWYgKGVsID09PSBkb2NCb2R5KSB7IGJyZWFrOyB9XHJcblxyXG5cdFx0XHR0b3AgIC09IGVsLnNjcm9sbFRvcCAgfHwgMDtcclxuXHRcdFx0bGVmdCAtPSBlbC5zY3JvbGxMZWZ0IHx8IDA7XHJcblxyXG5cdFx0XHRlbCA9IGVsLnBhcmVudE5vZGU7XHJcblx0XHR9IHdoaWxlIChlbCk7XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KGxlZnQsIHRvcCk7XHJcblx0fSxcclxuXHJcblx0ZG9jdW1lbnRJc0x0cjogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCFMLkRvbVV0aWwuX2RvY0lzTHRyQ2FjaGVkKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5fZG9jSXNMdHJDYWNoZWQgPSB0cnVlO1xyXG5cdFx0XHRMLkRvbVV0aWwuX2RvY0lzTHRyID0gTC5Eb21VdGlsLmdldFN0eWxlKGRvY3VtZW50LmJvZHksICdkaXJlY3Rpb24nKSA9PT0gJ2x0cic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gTC5Eb21VdGlsLl9kb2NJc0x0cjtcclxuXHR9LFxyXG5cclxuXHRjcmVhdGU6IGZ1bmN0aW9uICh0YWdOYW1lLCBjbGFzc05hbWUsIGNvbnRhaW5lcikge1xyXG5cclxuXHRcdHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcblx0XHRlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XHJcblxyXG5cdFx0aWYgKGNvbnRhaW5lcikge1xyXG5cdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBlbDtcclxuXHR9LFxyXG5cclxuXHRoYXNDbGFzczogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XHJcblx0XHRpZiAoZWwuY2xhc3NMaXN0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcclxuXHRcdH1cclxuXHRcdHZhciBjbGFzc05hbWUgPSBMLkRvbVV0aWwuX2dldENsYXNzKGVsKTtcclxuXHRcdHJldHVybiBjbGFzc05hbWUubGVuZ3RoID4gMCAmJiBuZXcgUmVnRXhwKCcoXnxcXFxccyknICsgbmFtZSArICcoXFxcXHN8JCknKS50ZXN0KGNsYXNzTmFtZSk7XHJcblx0fSxcclxuXHJcblx0YWRkQ2xhc3M6IGZ1bmN0aW9uIChlbCwgbmFtZSkge1xyXG5cdFx0aWYgKGVsLmNsYXNzTGlzdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHZhciBjbGFzc2VzID0gTC5VdGlsLnNwbGl0V29yZHMobmFtZSk7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBjbGFzc2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0ZWwuY2xhc3NMaXN0LmFkZChjbGFzc2VzW2ldKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmICghTC5Eb21VdGlsLmhhc0NsYXNzKGVsLCBuYW1lKSkge1xyXG5cdFx0XHR2YXIgY2xhc3NOYW1lID0gTC5Eb21VdGlsLl9nZXRDbGFzcyhlbCk7XHJcblx0XHRcdEwuRG9tVXRpbC5fc2V0Q2xhc3MoZWwsIChjbGFzc05hbWUgPyBjbGFzc05hbWUgKyAnICcgOiAnJykgKyBuYW1lKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRyZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XHJcblx0XHRpZiAoZWwuY2xhc3NMaXN0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0ZWwuY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdEwuRG9tVXRpbC5fc2V0Q2xhc3MoZWwsIEwuVXRpbC50cmltKCgnICcgKyBMLkRvbVV0aWwuX2dldENsYXNzKGVsKSArICcgJykucmVwbGFjZSgnICcgKyBuYW1lICsgJyAnLCAnICcpKSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X3NldENsYXNzOiBmdW5jdGlvbiAoZWwsIG5hbWUpIHtcclxuXHRcdGlmIChlbC5jbGFzc05hbWUuYmFzZVZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdGVsLmNsYXNzTmFtZSA9IG5hbWU7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQvLyBpbiBjYXNlIG9mIFNWRyBlbGVtZW50XHJcblx0XHRcdGVsLmNsYXNzTmFtZS5iYXNlVmFsID0gbmFtZTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfZ2V0Q2xhc3M6IGZ1bmN0aW9uIChlbCkge1xyXG5cdFx0cmV0dXJuIGVsLmNsYXNzTmFtZS5iYXNlVmFsID09PSB1bmRlZmluZWQgPyBlbC5jbGFzc05hbWUgOiBlbC5jbGFzc05hbWUuYmFzZVZhbDtcclxuXHR9LFxyXG5cclxuXHRzZXRPcGFjaXR5OiBmdW5jdGlvbiAoZWwsIHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKCdvcGFjaXR5JyBpbiBlbC5zdHlsZSkge1xyXG5cdFx0XHRlbC5zdHlsZS5vcGFjaXR5ID0gdmFsdWU7XHJcblxyXG5cdFx0fSBlbHNlIGlmICgnZmlsdGVyJyBpbiBlbC5zdHlsZSkge1xyXG5cclxuXHRcdFx0dmFyIGZpbHRlciA9IGZhbHNlLFxyXG5cdFx0XHQgICAgZmlsdGVyTmFtZSA9ICdEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5BbHBoYSc7XHJcblxyXG5cdFx0XHQvLyBmaWx0ZXJzIGNvbGxlY3Rpb24gdGhyb3dzIGFuIGVycm9yIGlmIHdlIHRyeSB0byByZXRyaWV2ZSBhIGZpbHRlciB0aGF0IGRvZXNuJ3QgZXhpc3RcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRmaWx0ZXIgPSBlbC5maWx0ZXJzLml0ZW0oZmlsdGVyTmFtZSk7XHJcblx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHQvLyBkb24ndCBzZXQgb3BhY2l0eSB0byAxIGlmIHdlIGhhdmVuJ3QgYWxyZWFkeSBzZXQgYW4gb3BhY2l0eSxcclxuXHRcdFx0XHQvLyBpdCBpc24ndCBuZWVkZWQgYW5kIGJyZWFrcyB0cmFuc3BhcmVudCBwbmdzLlxyXG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gMSkgeyByZXR1cm47IH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFsdWUgPSBNYXRoLnJvdW5kKHZhbHVlICogMTAwKTtcclxuXHJcblx0XHRcdGlmIChmaWx0ZXIpIHtcclxuXHRcdFx0XHRmaWx0ZXIuRW5hYmxlZCA9ICh2YWx1ZSAhPT0gMTAwKTtcclxuXHRcdFx0XHRmaWx0ZXIuT3BhY2l0eSA9IHZhbHVlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGVsLnN0eWxlLmZpbHRlciArPSAnIHByb2dpZDonICsgZmlsdGVyTmFtZSArICcob3BhY2l0eT0nICsgdmFsdWUgKyAnKSc7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHR0ZXN0UHJvcDogZnVuY3Rpb24gKHByb3BzKSB7XHJcblxyXG5cdFx0dmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYgKHByb3BzW2ldIGluIHN0eWxlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHByb3BzW2ldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0Z2V0VHJhbnNsYXRlU3RyaW5nOiBmdW5jdGlvbiAocG9pbnQpIHtcclxuXHRcdC8vIG9uIFdlYktpdCBicm93c2VycyAoQ2hyb21lL1NhZmFyaS9pT1MgU2FmYXJpL0FuZHJvaWQpIHVzaW5nIHRyYW5zbGF0ZTNkIGluc3RlYWQgb2YgdHJhbnNsYXRlXHJcblx0XHQvLyBtYWtlcyBhbmltYXRpb24gc21vb3RoZXIgYXMgaXQgZW5zdXJlcyBIVyBhY2NlbCBpcyB1c2VkLiBGaXJlZm94IDEzIGRvZXNuJ3QgY2FyZVxyXG5cdFx0Ly8gKHNhbWUgc3BlZWQgZWl0aGVyIHdheSksIE9wZXJhIDEyIGRvZXNuJ3Qgc3VwcG9ydCB0cmFuc2xhdGUzZFxyXG5cclxuXHRcdHZhciBpczNkID0gTC5Ccm93c2VyLndlYmtpdDNkLFxyXG5cdFx0ICAgIG9wZW4gPSAndHJhbnNsYXRlJyArIChpczNkID8gJzNkJyA6ICcnKSArICcoJyxcclxuXHRcdCAgICBjbG9zZSA9IChpczNkID8gJywwJyA6ICcnKSArICcpJztcclxuXHJcblx0XHRyZXR1cm4gb3BlbiArIHBvaW50LnggKyAncHgsJyArIHBvaW50LnkgKyAncHgnICsgY2xvc2U7XHJcblx0fSxcclxuXHJcblx0Z2V0U2NhbGVTdHJpbmc6IGZ1bmN0aW9uIChzY2FsZSwgb3JpZ2luKSB7XHJcblxyXG5cdFx0dmFyIHByZVRyYW5zbGF0ZVN0ciA9IEwuRG9tVXRpbC5nZXRUcmFuc2xhdGVTdHJpbmcob3JpZ2luLmFkZChvcmlnaW4ubXVsdGlwbHlCeSgtMSAqIHNjYWxlKSkpLFxyXG5cdFx0ICAgIHNjYWxlU3RyID0gJyBzY2FsZSgnICsgc2NhbGUgKyAnKSAnO1xyXG5cclxuXHRcdHJldHVybiBwcmVUcmFuc2xhdGVTdHIgKyBzY2FsZVN0cjtcclxuXHR9LFxyXG5cclxuXHRzZXRQb3NpdGlvbjogZnVuY3Rpb24gKGVsLCBwb2ludCwgZGlzYWJsZTNEKSB7IC8vIChIVE1MRWxlbWVudCwgUG9pbnRbLCBCb29sZWFuXSlcclxuXHJcblx0XHQvLyBqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxyXG5cdFx0ZWwuX2xlYWZsZXRfcG9zID0gcG9pbnQ7XHJcblxyXG5cdFx0aWYgKCFkaXNhYmxlM0QgJiYgTC5Ccm93c2VyLmFueTNkKSB7XHJcblx0XHRcdGVsLnN0eWxlW0wuRG9tVXRpbC5UUkFOU0ZPUk1dID0gIEwuRG9tVXRpbC5nZXRUcmFuc2xhdGVTdHJpbmcocG9pbnQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZWwuc3R5bGUubGVmdCA9IHBvaW50LnggKyAncHgnO1xyXG5cdFx0XHRlbC5zdHlsZS50b3AgPSBwb2ludC55ICsgJ3B4JztcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRnZXRQb3NpdGlvbjogZnVuY3Rpb24gKGVsKSB7XHJcblx0XHQvLyB0aGlzIG1ldGhvZCBpcyBvbmx5IHVzZWQgZm9yIGVsZW1lbnRzIHByZXZpb3VzbHkgcG9zaXRpb25lZCB1c2luZyBzZXRQb3NpdGlvbixcclxuXHRcdC8vIHNvIGl0J3Mgc2FmZSB0byBjYWNoZSB0aGUgcG9zaXRpb24gZm9yIHBlcmZvcm1hbmNlXHJcblxyXG5cdFx0Ly8ganNoaW50IGNhbWVsY2FzZTogZmFsc2VcclxuXHRcdHJldHVybiBlbC5fbGVhZmxldF9wb3M7XHJcblx0fVxyXG59O1xyXG5cclxuXHJcbi8vIHByZWZpeCBzdHlsZSBwcm9wZXJ0eSBuYW1lc1xyXG5cclxuTC5Eb21VdGlsLlRSQU5TRk9STSA9IEwuRG9tVXRpbC50ZXN0UHJvcChcclxuICAgICAgICBbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nLCAnT1RyYW5zZm9ybScsICdNb3pUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nXSk7XHJcblxyXG4vLyB3ZWJraXRUcmFuc2l0aW9uIGNvbWVzIGZpcnN0IGJlY2F1c2Ugc29tZSBicm93c2VyIHZlcnNpb25zIHRoYXQgZHJvcCB2ZW5kb3IgcHJlZml4IGRvbid0IGRvXHJcbi8vIHRoZSBzYW1lIGZvciB0aGUgdHJhbnNpdGlvbmVuZCBldmVudCwgaW4gcGFydGljdWxhciB0aGUgQW5kcm9pZCA0LjEgc3RvY2sgYnJvd3NlclxyXG5cclxuTC5Eb21VdGlsLlRSQU5TSVRJT04gPSBMLkRvbVV0aWwudGVzdFByb3AoXHJcbiAgICAgICAgWyd3ZWJraXRUcmFuc2l0aW9uJywgJ3RyYW5zaXRpb24nLCAnT1RyYW5zaXRpb24nLCAnTW96VHJhbnNpdGlvbicsICdtc1RyYW5zaXRpb24nXSk7XHJcblxyXG5MLkRvbVV0aWwuVFJBTlNJVElPTl9FTkQgPVxyXG4gICAgICAgIEwuRG9tVXRpbC5UUkFOU0lUSU9OID09PSAnd2Via2l0VHJhbnNpdGlvbicgfHwgTC5Eb21VdGlsLlRSQU5TSVRJT04gPT09ICdPVHJhbnNpdGlvbicgP1xyXG4gICAgICAgIEwuRG9tVXRpbC5UUkFOU0lUSU9OICsgJ0VuZCcgOiAndHJhbnNpdGlvbmVuZCc7XHJcblxyXG4oZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCdvbnNlbGVjdHN0YXJ0JyBpbiBkb2N1bWVudCkge1xyXG4gICAgICAgIEwuZXh0ZW5kKEwuRG9tVXRpbCwge1xyXG4gICAgICAgICAgICBkaXNhYmxlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgTC5Eb21FdmVudC5vbih3aW5kb3csICdzZWxlY3RzdGFydCcsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZW5hYmxlVGV4dFNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgTC5Eb21FdmVudC5vZmYod2luZG93LCAnc2VsZWN0c3RhcnQnLCBMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgdXNlclNlbGVjdFByb3BlcnR5ID0gTC5Eb21VdGlsLnRlc3RQcm9wKFxyXG4gICAgICAgICAgICBbJ3VzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdPVXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ21zVXNlclNlbGVjdCddKTtcclxuXHJcbiAgICAgICAgTC5leHRlbmQoTC5Eb21VdGlsLCB7XHJcbiAgICAgICAgICAgIGRpc2FibGVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodXNlclNlbGVjdFByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VzZXJTZWxlY3QgPSBzdHlsZVt1c2VyU2VsZWN0UHJvcGVydHldO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW3VzZXJTZWxlY3RQcm9wZXJ0eV0gPSAnbm9uZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBlbmFibGVUZXh0U2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodXNlclNlbGVjdFByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlW3VzZXJTZWxlY3RQcm9wZXJ0eV0gPSB0aGlzLl91c2VyU2VsZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl91c2VyU2VsZWN0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cdEwuZXh0ZW5kKEwuRG9tVXRpbCwge1xyXG5cdFx0ZGlzYWJsZUltYWdlRHJhZzogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRMLkRvbUV2ZW50Lm9uKHdpbmRvdywgJ2RyYWdzdGFydCcsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpO1xyXG5cdFx0fSxcclxuXHJcblx0XHRlbmFibGVJbWFnZURyYWc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0TC5Eb21FdmVudC5vZmYod2luZG93LCAnZHJhZ3N0YXJ0JywgTC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdCk7XHJcblx0XHR9XHJcblx0fSk7XHJcbn0pKCk7XHJcblxuXG4vKlxyXG4gKiBMLkxhdExuZyByZXByZXNlbnRzIGEgZ2VvZ3JhcGhpY2FsIHBvaW50IHdpdGggbGF0aXR1ZGUgYW5kIGxvbmdpdHVkZSBjb29yZGluYXRlcy5cclxuICovXHJcblxyXG5MLkxhdExuZyA9IGZ1bmN0aW9uIChsYXQsIGxuZywgYWx0KSB7IC8vIChOdW1iZXIsIE51bWJlciwgTnVtYmVyKVxyXG5cdGxhdCA9IHBhcnNlRmxvYXQobGF0KTtcclxuXHRsbmcgPSBwYXJzZUZsb2F0KGxuZyk7XHJcblxyXG5cdGlmIChpc05hTihsYXQpIHx8IGlzTmFOKGxuZykpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBMYXRMbmcgb2JqZWN0OiAoJyArIGxhdCArICcsICcgKyBsbmcgKyAnKScpO1xyXG5cdH1cclxuXHJcblx0dGhpcy5sYXQgPSBsYXQ7XHJcblx0dGhpcy5sbmcgPSBsbmc7XHJcblxyXG5cdGlmIChhbHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0dGhpcy5hbHQgPSBwYXJzZUZsb2F0KGFsdCk7XHJcblx0fVxyXG59O1xyXG5cclxuTC5leHRlbmQoTC5MYXRMbmcsIHtcclxuXHRERUdfVE9fUkFEOiBNYXRoLlBJIC8gMTgwLFxyXG5cdFJBRF9UT19ERUc6IDE4MCAvIE1hdGguUEksXHJcblx0TUFYX01BUkdJTjogMS4wRS05IC8vIG1heCBtYXJnaW4gb2YgZXJyb3IgZm9yIHRoZSBcImVxdWFsc1wiIGNoZWNrXHJcbn0pO1xyXG5cclxuTC5MYXRMbmcucHJvdG90eXBlID0ge1xyXG5cdGVxdWFsczogZnVuY3Rpb24gKG9iaikgeyAvLyAoTGF0TG5nKSAtPiBCb29sZWFuXHJcblx0XHRpZiAoIW9iaikgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcblx0XHRvYmogPSBMLmxhdExuZyhvYmopO1xyXG5cclxuXHRcdHZhciBtYXJnaW4gPSBNYXRoLm1heChcclxuXHRcdCAgICAgICAgTWF0aC5hYnModGhpcy5sYXQgLSBvYmoubGF0KSxcclxuXHRcdCAgICAgICAgTWF0aC5hYnModGhpcy5sbmcgLSBvYmoubG5nKSk7XHJcblxyXG5cdFx0cmV0dXJuIG1hcmdpbiA8PSBMLkxhdExuZy5NQVhfTUFSR0lOO1xyXG5cdH0sXHJcblxyXG5cdHRvU3RyaW5nOiBmdW5jdGlvbiAocHJlY2lzaW9uKSB7IC8vIChOdW1iZXIpIC0+IFN0cmluZ1xyXG5cdFx0cmV0dXJuICdMYXRMbmcoJyArXHJcblx0XHQgICAgICAgIEwuVXRpbC5mb3JtYXROdW0odGhpcy5sYXQsIHByZWNpc2lvbikgKyAnLCAnICtcclxuXHRcdCAgICAgICAgTC5VdGlsLmZvcm1hdE51bSh0aGlzLmxuZywgcHJlY2lzaW9uKSArICcpJztcclxuXHR9LFxyXG5cclxuXHQvLyBIYXZlcnNpbmUgZGlzdGFuY2UgZm9ybXVsYSwgc2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSGF2ZXJzaW5lX2Zvcm11bGFcclxuXHQvLyBUT0RPIG1vdmUgdG8gcHJvamVjdGlvbiBjb2RlLCBMYXRMbmcgc2hvdWxkbid0IGtub3cgYWJvdXQgRWFydGhcclxuXHRkaXN0YW5jZVRvOiBmdW5jdGlvbiAob3RoZXIpIHsgLy8gKExhdExuZykgLT4gTnVtYmVyXHJcblx0XHRvdGhlciA9IEwubGF0TG5nKG90aGVyKTtcclxuXHJcblx0XHR2YXIgUiA9IDYzNzgxMzcsIC8vIGVhcnRoIHJhZGl1cyBpbiBtZXRlcnNcclxuXHRcdCAgICBkMnIgPSBMLkxhdExuZy5ERUdfVE9fUkFELFxyXG5cdFx0ICAgIGRMYXQgPSAob3RoZXIubGF0IC0gdGhpcy5sYXQpICogZDJyLFxyXG5cdFx0ICAgIGRMb24gPSAob3RoZXIubG5nIC0gdGhpcy5sbmcpICogZDJyLFxyXG5cdFx0ICAgIGxhdDEgPSB0aGlzLmxhdCAqIGQycixcclxuXHRcdCAgICBsYXQyID0gb3RoZXIubGF0ICogZDJyLFxyXG5cdFx0ICAgIHNpbjEgPSBNYXRoLnNpbihkTGF0IC8gMiksXHJcblx0XHQgICAgc2luMiA9IE1hdGguc2luKGRMb24gLyAyKTtcclxuXHJcblx0XHR2YXIgYSA9IHNpbjEgKiBzaW4xICsgc2luMiAqIHNpbjIgKiBNYXRoLmNvcyhsYXQxKSAqIE1hdGguY29zKGxhdDIpO1xyXG5cclxuXHRcdHJldHVybiBSICogMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTtcclxuXHR9LFxyXG5cclxuXHR3cmFwOiBmdW5jdGlvbiAoYSwgYikgeyAvLyAoTnVtYmVyLCBOdW1iZXIpIC0+IExhdExuZ1xyXG5cdFx0dmFyIGxuZyA9IHRoaXMubG5nO1xyXG5cclxuXHRcdGEgPSBhIHx8IC0xODA7XHJcblx0XHRiID0gYiB8fCAgMTgwO1xyXG5cclxuXHRcdGxuZyA9IChsbmcgKyBiKSAlIChiIC0gYSkgKyAobG5nIDwgYSB8fCBsbmcgPT09IGIgPyBiIDogYSk7XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBMLkxhdExuZyh0aGlzLmxhdCwgbG5nKTtcclxuXHR9XHJcbn07XHJcblxyXG5MLmxhdExuZyA9IGZ1bmN0aW9uIChhLCBiKSB7IC8vIChMYXRMbmcpIG9yIChbTnVtYmVyLCBOdW1iZXJdKSBvciAoTnVtYmVyLCBOdW1iZXIpXHJcblx0aWYgKGEgaW5zdGFuY2VvZiBMLkxhdExuZykge1xyXG5cdFx0cmV0dXJuIGE7XHJcblx0fVxyXG5cdGlmIChMLlV0aWwuaXNBcnJheShhKSkge1xyXG5cdFx0aWYgKHR5cGVvZiBhWzBdID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgYVswXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBMLkxhdExuZyhhWzBdLCBhWzFdLCBhWzJdKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoYSA9PT0gdW5kZWZpbmVkIHx8IGEgPT09IG51bGwpIHtcclxuXHRcdHJldHVybiBhO1xyXG5cdH1cclxuXHRpZiAodHlwZW9mIGEgPT09ICdvYmplY3QnICYmICdsYXQnIGluIGEpIHtcclxuXHRcdHJldHVybiBuZXcgTC5MYXRMbmcoYS5sYXQsICdsbmcnIGluIGEgPyBhLmxuZyA6IGEubG9uKTtcclxuXHR9XHJcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cdHJldHVybiBuZXcgTC5MYXRMbmcoYSwgYik7XHJcbn07XHJcblxyXG5cblxuLypcclxuICogTC5MYXRMbmdCb3VuZHMgcmVwcmVzZW50cyBhIHJlY3Rhbmd1bGFyIGFyZWEgb24gdGhlIG1hcCBpbiBnZW9ncmFwaGljYWwgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5cclxuTC5MYXRMbmdCb3VuZHMgPSBmdW5jdGlvbiAoc291dGhXZXN0LCBub3J0aEVhc3QpIHsgLy8gKExhdExuZywgTGF0TG5nKSBvciAoTGF0TG5nW10pXHJcblx0aWYgKCFzb3V0aFdlc3QpIHsgcmV0dXJuOyB9XHJcblxyXG5cdHZhciBsYXRsbmdzID0gbm9ydGhFYXN0ID8gW3NvdXRoV2VzdCwgbm9ydGhFYXN0XSA6IHNvdXRoV2VzdDtcclxuXHJcblx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGxhdGxuZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdHRoaXMuZXh0ZW5kKGxhdGxuZ3NbaV0pO1xyXG5cdH1cclxufTtcclxuXHJcbkwuTGF0TG5nQm91bmRzLnByb3RvdHlwZSA9IHtcclxuXHQvLyBleHRlbmQgdGhlIGJvdW5kcyB0byBjb250YWluIHRoZSBnaXZlbiBwb2ludCBvciBib3VuZHNcclxuXHRleHRlbmQ6IGZ1bmN0aW9uIChvYmopIHsgLy8gKExhdExuZykgb3IgKExhdExuZ0JvdW5kcylcclxuXHRcdGlmICghb2JqKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cdFx0dmFyIGxhdExuZyA9IEwubGF0TG5nKG9iaik7XHJcblx0XHRpZiAobGF0TG5nICE9PSBudWxsKSB7XHJcblx0XHRcdG9iaiA9IGxhdExuZztcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG9iaiA9IEwubGF0TG5nQm91bmRzKG9iaik7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG9iaiBpbnN0YW5jZW9mIEwuTGF0TG5nKSB7XHJcblx0XHRcdGlmICghdGhpcy5fc291dGhXZXN0ICYmICF0aGlzLl9ub3J0aEVhc3QpIHtcclxuXHRcdFx0XHR0aGlzLl9zb3V0aFdlc3QgPSBuZXcgTC5MYXRMbmcob2JqLmxhdCwgb2JqLmxuZyk7XHJcblx0XHRcdFx0dGhpcy5fbm9ydGhFYXN0ID0gbmV3IEwuTGF0TG5nKG9iai5sYXQsIG9iai5sbmcpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3NvdXRoV2VzdC5sYXQgPSBNYXRoLm1pbihvYmoubGF0LCB0aGlzLl9zb3V0aFdlc3QubGF0KTtcclxuXHRcdFx0XHR0aGlzLl9zb3V0aFdlc3QubG5nID0gTWF0aC5taW4ob2JqLmxuZywgdGhpcy5fc291dGhXZXN0LmxuZyk7XHJcblxyXG5cdFx0XHRcdHRoaXMuX25vcnRoRWFzdC5sYXQgPSBNYXRoLm1heChvYmoubGF0LCB0aGlzLl9ub3J0aEVhc3QubGF0KTtcclxuXHRcdFx0XHR0aGlzLl9ub3J0aEVhc3QubG5nID0gTWF0aC5tYXgob2JqLmxuZywgdGhpcy5fbm9ydGhFYXN0LmxuZyk7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgTC5MYXRMbmdCb3VuZHMpIHtcclxuXHRcdFx0dGhpcy5leHRlbmQob2JqLl9zb3V0aFdlc3QpO1xyXG5cdFx0XHR0aGlzLmV4dGVuZChvYmouX25vcnRoRWFzdCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHQvLyBleHRlbmQgdGhlIGJvdW5kcyBieSBhIHBlcmNlbnRhZ2VcclxuXHRwYWQ6IGZ1bmN0aW9uIChidWZmZXJSYXRpbykgeyAvLyAoTnVtYmVyKSAtPiBMYXRMbmdCb3VuZHNcclxuXHRcdHZhciBzdyA9IHRoaXMuX3NvdXRoV2VzdCxcclxuXHRcdCAgICBuZSA9IHRoaXMuX25vcnRoRWFzdCxcclxuXHRcdCAgICBoZWlnaHRCdWZmZXIgPSBNYXRoLmFicyhzdy5sYXQgLSBuZS5sYXQpICogYnVmZmVyUmF0aW8sXHJcblx0XHQgICAgd2lkdGhCdWZmZXIgPSBNYXRoLmFicyhzdy5sbmcgLSBuZS5sbmcpICogYnVmZmVyUmF0aW87XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBMLkxhdExuZ0JvdW5kcyhcclxuXHRcdCAgICAgICAgbmV3IEwuTGF0TG5nKHN3LmxhdCAtIGhlaWdodEJ1ZmZlciwgc3cubG5nIC0gd2lkdGhCdWZmZXIpLFxyXG5cdFx0ICAgICAgICBuZXcgTC5MYXRMbmcobmUubGF0ICsgaGVpZ2h0QnVmZmVyLCBuZS5sbmcgKyB3aWR0aEJ1ZmZlcikpO1xyXG5cdH0sXHJcblxyXG5cdGdldENlbnRlcjogZnVuY3Rpb24gKCkgeyAvLyAtPiBMYXRMbmdcclxuXHRcdHJldHVybiBuZXcgTC5MYXRMbmcoXHJcblx0XHQgICAgICAgICh0aGlzLl9zb3V0aFdlc3QubGF0ICsgdGhpcy5fbm9ydGhFYXN0LmxhdCkgLyAyLFxyXG5cdFx0ICAgICAgICAodGhpcy5fc291dGhXZXN0LmxuZyArIHRoaXMuX25vcnRoRWFzdC5sbmcpIC8gMik7XHJcblx0fSxcclxuXHJcblx0Z2V0U291dGhXZXN0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc291dGhXZXN0O1xyXG5cdH0sXHJcblxyXG5cdGdldE5vcnRoRWFzdDogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX25vcnRoRWFzdDtcclxuXHR9LFxyXG5cclxuXHRnZXROb3J0aFdlc3Q6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBuZXcgTC5MYXRMbmcodGhpcy5nZXROb3J0aCgpLCB0aGlzLmdldFdlc3QoKSk7XHJcblx0fSxcclxuXHJcblx0Z2V0U291dGhFYXN0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gbmV3IEwuTGF0TG5nKHRoaXMuZ2V0U291dGgoKSwgdGhpcy5nZXRFYXN0KCkpO1xyXG5cdH0sXHJcblxyXG5cdGdldFdlc3Q6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zb3V0aFdlc3QubG5nO1xyXG5cdH0sXHJcblxyXG5cdGdldFNvdXRoOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc291dGhXZXN0LmxhdDtcclxuXHR9LFxyXG5cclxuXHRnZXRFYXN0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbm9ydGhFYXN0LmxuZztcclxuXHR9LFxyXG5cclxuXHRnZXROb3J0aDogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX25vcnRoRWFzdC5sYXQ7XHJcblx0fSxcclxuXHJcblx0Y29udGFpbnM6IGZ1bmN0aW9uIChvYmopIHsgLy8gKExhdExuZ0JvdW5kcykgb3IgKExhdExuZykgLT4gQm9vbGVhblxyXG5cdFx0aWYgKHR5cGVvZiBvYmpbMF0gPT09ICdudW1iZXInIHx8IG9iaiBpbnN0YW5jZW9mIEwuTGF0TG5nKSB7XHJcblx0XHRcdG9iaiA9IEwubGF0TG5nKG9iaik7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvYmogPSBMLmxhdExuZ0JvdW5kcyhvYmopO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBzdyA9IHRoaXMuX3NvdXRoV2VzdCxcclxuXHRcdCAgICBuZSA9IHRoaXMuX25vcnRoRWFzdCxcclxuXHRcdCAgICBzdzIsIG5lMjtcclxuXHJcblx0XHRpZiAob2JqIGluc3RhbmNlb2YgTC5MYXRMbmdCb3VuZHMpIHtcclxuXHRcdFx0c3cyID0gb2JqLmdldFNvdXRoV2VzdCgpO1xyXG5cdFx0XHRuZTIgPSBvYmouZ2V0Tm9ydGhFYXN0KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRzdzIgPSBuZTIgPSBvYmo7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIChzdzIubGF0ID49IHN3LmxhdCkgJiYgKG5lMi5sYXQgPD0gbmUubGF0KSAmJlxyXG5cdFx0ICAgICAgIChzdzIubG5nID49IHN3LmxuZykgJiYgKG5lMi5sbmcgPD0gbmUubG5nKTtcclxuXHR9LFxyXG5cclxuXHRpbnRlcnNlY3RzOiBmdW5jdGlvbiAoYm91bmRzKSB7IC8vIChMYXRMbmdCb3VuZHMpXHJcblx0XHRib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhib3VuZHMpO1xyXG5cclxuXHRcdHZhciBzdyA9IHRoaXMuX3NvdXRoV2VzdCxcclxuXHRcdCAgICBuZSA9IHRoaXMuX25vcnRoRWFzdCxcclxuXHRcdCAgICBzdzIgPSBib3VuZHMuZ2V0U291dGhXZXN0KCksXHJcblx0XHQgICAgbmUyID0gYm91bmRzLmdldE5vcnRoRWFzdCgpLFxyXG5cclxuXHRcdCAgICBsYXRJbnRlcnNlY3RzID0gKG5lMi5sYXQgPj0gc3cubGF0KSAmJiAoc3cyLmxhdCA8PSBuZS5sYXQpLFxyXG5cdFx0ICAgIGxuZ0ludGVyc2VjdHMgPSAobmUyLmxuZyA+PSBzdy5sbmcpICYmIChzdzIubG5nIDw9IG5lLmxuZyk7XHJcblxyXG5cdFx0cmV0dXJuIGxhdEludGVyc2VjdHMgJiYgbG5nSW50ZXJzZWN0cztcclxuXHR9LFxyXG5cclxuXHR0b0JCb3hTdHJpbmc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBbdGhpcy5nZXRXZXN0KCksIHRoaXMuZ2V0U291dGgoKSwgdGhpcy5nZXRFYXN0KCksIHRoaXMuZ2V0Tm9ydGgoKV0uam9pbignLCcpO1xyXG5cdH0sXHJcblxyXG5cdGVxdWFsczogZnVuY3Rpb24gKGJvdW5kcykgeyAvLyAoTGF0TG5nQm91bmRzKVxyXG5cdFx0aWYgKCFib3VuZHMpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG5cdFx0Ym91bmRzID0gTC5sYXRMbmdCb3VuZHMoYm91bmRzKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy5fc291dGhXZXN0LmVxdWFscyhib3VuZHMuZ2V0U291dGhXZXN0KCkpICYmXHJcblx0XHQgICAgICAgdGhpcy5fbm9ydGhFYXN0LmVxdWFscyhib3VuZHMuZ2V0Tm9ydGhFYXN0KCkpO1xyXG5cdH0sXHJcblxyXG5cdGlzVmFsaWQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAhISh0aGlzLl9zb3V0aFdlc3QgJiYgdGhpcy5fbm9ydGhFYXN0KTtcclxuXHR9XHJcbn07XHJcblxyXG4vL1RPRE8gSW50ZXJuYXRpb25hbCBkYXRlIGxpbmU/XHJcblxyXG5MLmxhdExuZ0JvdW5kcyA9IGZ1bmN0aW9uIChhLCBiKSB7IC8vIChMYXRMbmdCb3VuZHMpIG9yIChMYXRMbmcsIExhdExuZylcclxuXHRpZiAoIWEgfHwgYSBpbnN0YW5jZW9mIEwuTGF0TG5nQm91bmRzKSB7XHJcblx0XHRyZXR1cm4gYTtcclxuXHR9XHJcblx0cmV0dXJuIG5ldyBMLkxhdExuZ0JvdW5kcyhhLCBiKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIEwuUHJvamVjdGlvbiBjb250YWlucyB2YXJpb3VzIGdlb2dyYXBoaWNhbCBwcm9qZWN0aW9ucyB1c2VkIGJ5IENSUyBjbGFzc2VzLlxyXG4gKi9cclxuXHJcbkwuUHJvamVjdGlvbiA9IHt9O1xyXG5cblxuLypcclxuICogU3BoZXJpY2FsIE1lcmNhdG9yIGlzIHRoZSBtb3N0IHBvcHVsYXIgbWFwIHByb2plY3Rpb24sIHVzZWQgYnkgRVBTRzozODU3IENSUyB1c2VkIGJ5IGRlZmF1bHQuXHJcbiAqL1xyXG5cclxuTC5Qcm9qZWN0aW9uLlNwaGVyaWNhbE1lcmNhdG9yID0ge1xyXG5cdE1BWF9MQVRJVFVERTogODUuMDUxMTI4Nzc5OCxcclxuXHJcblx0cHJvamVjdDogZnVuY3Rpb24gKGxhdGxuZykgeyAvLyAoTGF0TG5nKSAtPiBQb2ludFxyXG5cdFx0dmFyIGQgPSBMLkxhdExuZy5ERUdfVE9fUkFELFxyXG5cdFx0ICAgIG1heCA9IHRoaXMuTUFYX0xBVElUVURFLFxyXG5cdFx0ICAgIGxhdCA9IE1hdGgubWF4KE1hdGgubWluKG1heCwgbGF0bG5nLmxhdCksIC1tYXgpLFxyXG5cdFx0ICAgIHggPSBsYXRsbmcubG5nICogZCxcclxuXHRcdCAgICB5ID0gbGF0ICogZDtcclxuXHJcblx0XHR5ID0gTWF0aC5sb2coTWF0aC50YW4oKE1hdGguUEkgLyA0KSArICh5IC8gMikpKTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IEwuUG9pbnQoeCwgeSk7XHJcblx0fSxcclxuXHJcblx0dW5wcm9qZWN0OiBmdW5jdGlvbiAocG9pbnQpIHsgLy8gKFBvaW50LCBCb29sZWFuKSAtPiBMYXRMbmdcclxuXHRcdHZhciBkID0gTC5MYXRMbmcuUkFEX1RPX0RFRyxcclxuXHRcdCAgICBsbmcgPSBwb2ludC54ICogZCxcclxuXHRcdCAgICBsYXQgPSAoMiAqIE1hdGguYXRhbihNYXRoLmV4cChwb2ludC55KSkgLSAoTWF0aC5QSSAvIDIpKSAqIGQ7XHJcblxyXG5cdFx0cmV0dXJuIG5ldyBMLkxhdExuZyhsYXQsIGxuZyk7XHJcblx0fVxyXG59O1xyXG5cblxuLypcclxuICogU2ltcGxlIGVxdWlyZWN0YW5ndWxhciAoUGxhdGUgQ2FycmVlKSBwcm9qZWN0aW9uLCB1c2VkIGJ5IENSUyBsaWtlIEVQU0c6NDMyNiBhbmQgU2ltcGxlLlxyXG4gKi9cclxuXHJcbkwuUHJvamVjdGlvbi5Mb25MYXQgPSB7XHJcblx0cHJvamVjdDogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KGxhdGxuZy5sbmcsIGxhdGxuZy5sYXQpO1xyXG5cdH0sXHJcblxyXG5cdHVucHJvamVjdDogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHRyZXR1cm4gbmV3IEwuTGF0TG5nKHBvaW50LnksIHBvaW50LngpO1xyXG5cdH1cclxufTtcclxuXG5cbi8qXHJcbiAqIEwuQ1JTIGlzIGEgYmFzZSBvYmplY3QgZm9yIGFsbCBkZWZpbmVkIENSUyAoQ29vcmRpbmF0ZSBSZWZlcmVuY2UgU3lzdGVtcykgaW4gTGVhZmxldC5cclxuICovXHJcblxyXG5MLkNSUyA9IHtcclxuXHRsYXRMbmdUb1BvaW50OiBmdW5jdGlvbiAobGF0bG5nLCB6b29tKSB7IC8vIChMYXRMbmcsIE51bWJlcikgLT4gUG9pbnRcclxuXHRcdHZhciBwcm9qZWN0ZWRQb2ludCA9IHRoaXMucHJvamVjdGlvbi5wcm9qZWN0KGxhdGxuZyksXHJcblx0XHQgICAgc2NhbGUgPSB0aGlzLnNjYWxlKHpvb20pO1xyXG5cclxuXHRcdHJldHVybiB0aGlzLnRyYW5zZm9ybWF0aW9uLl90cmFuc2Zvcm0ocHJvamVjdGVkUG9pbnQsIHNjYWxlKTtcclxuXHR9LFxyXG5cclxuXHRwb2ludFRvTGF0TG5nOiBmdW5jdGlvbiAocG9pbnQsIHpvb20pIHsgLy8gKFBvaW50LCBOdW1iZXJbLCBCb29sZWFuXSkgLT4gTGF0TG5nXHJcblx0XHR2YXIgc2NhbGUgPSB0aGlzLnNjYWxlKHpvb20pLFxyXG5cdFx0ICAgIHVudHJhbnNmb3JtZWRQb2ludCA9IHRoaXMudHJhbnNmb3JtYXRpb24udW50cmFuc2Zvcm0ocG9pbnQsIHNjYWxlKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy5wcm9qZWN0aW9uLnVucHJvamVjdCh1bnRyYW5zZm9ybWVkUG9pbnQpO1xyXG5cdH0sXHJcblxyXG5cdHByb2plY3Q6IGZ1bmN0aW9uIChsYXRsbmcpIHtcclxuXHRcdHJldHVybiB0aGlzLnByb2plY3Rpb24ucHJvamVjdChsYXRsbmcpO1xyXG5cdH0sXHJcblxyXG5cdHNjYWxlOiBmdW5jdGlvbiAoem9vbSkge1xyXG5cdFx0cmV0dXJuIDI1NiAqIE1hdGgucG93KDIsIHpvb20pO1xyXG5cdH0sXHJcblxyXG5cdGdldFNpemU6IGZ1bmN0aW9uICh6b29tKSB7XHJcblx0XHR2YXIgcyA9IHRoaXMuc2NhbGUoem9vbSk7XHJcblx0XHRyZXR1cm4gTC5wb2ludChzLCBzKTtcclxuXHR9XHJcbn07XHJcblxuXG4vKlxuICogQSBzaW1wbGUgQ1JTIHRoYXQgY2FuIGJlIHVzZWQgZm9yIGZsYXQgbm9uLUVhcnRoIG1hcHMgbGlrZSBwYW5vcmFtYXMgb3IgZ2FtZSBtYXBzLlxuICovXG5cbkwuQ1JTLlNpbXBsZSA9IEwuZXh0ZW5kKHt9LCBMLkNSUywge1xuXHRwcm9qZWN0aW9uOiBMLlByb2plY3Rpb24uTG9uTGF0LFxuXHR0cmFuc2Zvcm1hdGlvbjogbmV3IEwuVHJhbnNmb3JtYXRpb24oMSwgMCwgLTEsIDApLFxuXG5cdHNjYWxlOiBmdW5jdGlvbiAoem9vbSkge1xuXHRcdHJldHVybiBNYXRoLnBvdygyLCB6b29tKTtcblx0fVxufSk7XG5cblxuLypcclxuICogTC5DUlMuRVBTRzM4NTcgKFNwaGVyaWNhbCBNZXJjYXRvcikgaXMgdGhlIG1vc3QgY29tbW9uIENSUyBmb3Igd2ViIG1hcHBpbmdcclxuICogYW5kIGlzIHVzZWQgYnkgTGVhZmxldCBieSBkZWZhdWx0LlxyXG4gKi9cclxuXHJcbkwuQ1JTLkVQU0czODU3ID0gTC5leHRlbmQoe30sIEwuQ1JTLCB7XHJcblx0Y29kZTogJ0VQU0c6Mzg1NycsXHJcblxyXG5cdHByb2plY3Rpb246IEwuUHJvamVjdGlvbi5TcGhlcmljYWxNZXJjYXRvcixcclxuXHR0cmFuc2Zvcm1hdGlvbjogbmV3IEwuVHJhbnNmb3JtYXRpb24oMC41IC8gTWF0aC5QSSwgMC41LCAtMC41IC8gTWF0aC5QSSwgMC41KSxcclxuXHJcblx0cHJvamVjdDogZnVuY3Rpb24gKGxhdGxuZykgeyAvLyAoTGF0TG5nKSAtPiBQb2ludFxyXG5cdFx0dmFyIHByb2plY3RlZFBvaW50ID0gdGhpcy5wcm9qZWN0aW9uLnByb2plY3QobGF0bG5nKSxcclxuXHRcdCAgICBlYXJ0aFJhZGl1cyA9IDYzNzgxMzc7XHJcblx0XHRyZXR1cm4gcHJvamVjdGVkUG9pbnQubXVsdGlwbHlCeShlYXJ0aFJhZGl1cyk7XHJcblx0fVxyXG59KTtcclxuXHJcbkwuQ1JTLkVQU0c5MDA5MTMgPSBMLmV4dGVuZCh7fSwgTC5DUlMuRVBTRzM4NTcsIHtcclxuXHRjb2RlOiAnRVBTRzo5MDA5MTMnXHJcbn0pO1xyXG5cblxuLypcclxuICogTC5DUlMuRVBTRzQzMjYgaXMgYSBDUlMgcG9wdWxhciBhbW9uZyBhZHZhbmNlZCBHSVMgc3BlY2lhbGlzdHMuXHJcbiAqL1xyXG5cclxuTC5DUlMuRVBTRzQzMjYgPSBMLmV4dGVuZCh7fSwgTC5DUlMsIHtcclxuXHRjb2RlOiAnRVBTRzo0MzI2JyxcclxuXHJcblx0cHJvamVjdGlvbjogTC5Qcm9qZWN0aW9uLkxvbkxhdCxcclxuXHR0cmFuc2Zvcm1hdGlvbjogbmV3IEwuVHJhbnNmb3JtYXRpb24oMSAvIDM2MCwgMC41LCAtMSAvIDM2MCwgMC41KVxyXG59KTtcclxuXG5cbi8qXHJcbiAqIEwuTWFwIGlzIHRoZSBjZW50cmFsIGNsYXNzIG9mIHRoZSBBUEkgLSBpdCBpcyB1c2VkIHRvIGNyZWF0ZSBhIG1hcC5cclxuICovXHJcblxyXG5MLk1hcCA9IEwuQ2xhc3MuZXh0ZW5kKHtcclxuXHJcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRjcnM6IEwuQ1JTLkVQU0czODU3LFxyXG5cclxuXHRcdC8qXHJcblx0XHRjZW50ZXI6IExhdExuZyxcclxuXHRcdHpvb206IE51bWJlcixcclxuXHRcdGxheWVyczogQXJyYXksXHJcblx0XHQqL1xyXG5cclxuXHRcdGZhZGVBbmltYXRpb246IEwuRG9tVXRpbC5UUkFOU0lUSU9OICYmICFMLkJyb3dzZXIuYW5kcm9pZDIzLFxyXG5cdFx0dHJhY2tSZXNpemU6IHRydWUsXHJcblx0XHRtYXJrZXJab29tQW5pbWF0aW9uOiBMLkRvbVV0aWwuVFJBTlNJVElPTiAmJiBMLkJyb3dzZXIuYW55M2RcclxuXHR9LFxyXG5cclxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAoaWQsIG9wdGlvbnMpIHsgLy8gKEhUTUxFbGVtZW50IG9yIFN0cmluZywgT2JqZWN0KVxyXG5cdFx0b3B0aW9ucyA9IEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcblxyXG5cdFx0dGhpcy5faW5pdENvbnRhaW5lcihpZCk7XHJcblx0XHR0aGlzLl9pbml0TGF5b3V0KCk7XHJcblxyXG5cdFx0Ly8gaGFjayBmb3IgaHR0cHM6Ly9naXRodWIuY29tL0xlYWZsZXQvTGVhZmxldC9pc3N1ZXMvMTk4MFxyXG5cdFx0dGhpcy5fb25SZXNpemUgPSBMLmJpbmQodGhpcy5fb25SZXNpemUsIHRoaXMpO1xyXG5cclxuXHRcdHRoaXMuX2luaXRFdmVudHMoKTtcclxuXHJcblx0XHRpZiAob3B0aW9ucy5tYXhCb3VuZHMpIHtcclxuXHRcdFx0dGhpcy5zZXRNYXhCb3VuZHMob3B0aW9ucy5tYXhCb3VuZHMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmNlbnRlciAmJiBvcHRpb25zLnpvb20gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aGlzLnNldFZpZXcoTC5sYXRMbmcob3B0aW9ucy5jZW50ZXIpLCBvcHRpb25zLnpvb20sIHtyZXNldDogdHJ1ZX0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2hhbmRsZXJzID0gW107XHJcblxyXG5cdFx0dGhpcy5fbGF5ZXJzID0ge307XHJcblx0XHR0aGlzLl96b29tQm91bmRMYXllcnMgPSB7fTtcclxuXHRcdHRoaXMuX3RpbGVMYXllcnNOdW0gPSAwO1xyXG5cclxuXHRcdHRoaXMuY2FsbEluaXRIb29rcygpO1xyXG5cclxuXHRcdHRoaXMuX2FkZExheWVycyhvcHRpb25zLmxheWVycyk7XHJcblx0fSxcclxuXHJcblxyXG5cdC8vIHB1YmxpYyBtZXRob2RzIHRoYXQgbW9kaWZ5IG1hcCBzdGF0ZVxyXG5cclxuXHQvLyByZXBsYWNlZCBieSBhbmltYXRpb24tcG93ZXJlZCBpbXBsZW1lbnRhdGlvbiBpbiBNYXAuUGFuQW5pbWF0aW9uLmpzXHJcblx0c2V0VmlldzogZnVuY3Rpb24gKGNlbnRlciwgem9vbSkge1xyXG5cdFx0em9vbSA9IHpvb20gPT09IHVuZGVmaW5lZCA/IHRoaXMuZ2V0Wm9vbSgpIDogem9vbTtcclxuXHRcdHRoaXMuX3Jlc2V0VmlldyhMLmxhdExuZyhjZW50ZXIpLCB0aGlzLl9saW1pdFpvb20oem9vbSkpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0c2V0Wm9vbTogZnVuY3Rpb24gKHpvb20sIG9wdGlvbnMpIHtcclxuXHRcdGlmICghdGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdHRoaXMuX3pvb20gPSB0aGlzLl9saW1pdFpvb20oem9vbSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuc2V0Vmlldyh0aGlzLmdldENlbnRlcigpLCB6b29tLCB7em9vbTogb3B0aW9uc30pO1xyXG5cdH0sXHJcblxyXG5cdHpvb21JbjogZnVuY3Rpb24gKGRlbHRhLCBvcHRpb25zKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5zZXRab29tKHRoaXMuX3pvb20gKyAoZGVsdGEgfHwgMSksIG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdHpvb21PdXQ6IGZ1bmN0aW9uIChkZWx0YSwgb3B0aW9ucykge1xyXG5cdFx0cmV0dXJuIHRoaXMuc2V0Wm9vbSh0aGlzLl96b29tIC0gKGRlbHRhIHx8IDEpLCBvcHRpb25zKTtcclxuXHR9LFxyXG5cclxuXHRzZXRab29tQXJvdW5kOiBmdW5jdGlvbiAobGF0bG5nLCB6b29tLCBvcHRpb25zKSB7XHJcblx0XHR2YXIgc2NhbGUgPSB0aGlzLmdldFpvb21TY2FsZSh6b29tKSxcclxuXHRcdCAgICB2aWV3SGFsZiA9IHRoaXMuZ2V0U2l6ZSgpLmRpdmlkZUJ5KDIpLFxyXG5cdFx0ICAgIGNvbnRhaW5lclBvaW50ID0gbGF0bG5nIGluc3RhbmNlb2YgTC5Qb2ludCA/IGxhdGxuZyA6IHRoaXMubGF0TG5nVG9Db250YWluZXJQb2ludChsYXRsbmcpLFxyXG5cclxuXHRcdCAgICBjZW50ZXJPZmZzZXQgPSBjb250YWluZXJQb2ludC5zdWJ0cmFjdCh2aWV3SGFsZikubXVsdGlwbHlCeSgxIC0gMSAvIHNjYWxlKSxcclxuXHRcdCAgICBuZXdDZW50ZXIgPSB0aGlzLmNvbnRhaW5lclBvaW50VG9MYXRMbmcodmlld0hhbGYuYWRkKGNlbnRlck9mZnNldCkpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzLnNldFZpZXcobmV3Q2VudGVyLCB6b29tLCB7em9vbTogb3B0aW9uc30pO1xyXG5cdH0sXHJcblxyXG5cdGZpdEJvdW5kczogZnVuY3Rpb24gKGJvdW5kcywgb3B0aW9ucykge1xyXG5cclxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cdFx0Ym91bmRzID0gYm91bmRzLmdldEJvdW5kcyA/IGJvdW5kcy5nZXRCb3VuZHMoKSA6IEwubGF0TG5nQm91bmRzKGJvdW5kcyk7XHJcblxyXG5cdFx0dmFyIHBhZGRpbmdUTCA9IEwucG9pbnQob3B0aW9ucy5wYWRkaW5nVG9wTGVmdCB8fCBvcHRpb25zLnBhZGRpbmcgfHwgWzAsIDBdKSxcclxuXHRcdCAgICBwYWRkaW5nQlIgPSBMLnBvaW50KG9wdGlvbnMucGFkZGluZ0JvdHRvbVJpZ2h0IHx8IG9wdGlvbnMucGFkZGluZyB8fCBbMCwgMF0pLFxyXG5cclxuXHRcdCAgICB6b29tID0gdGhpcy5nZXRCb3VuZHNab29tKGJvdW5kcywgZmFsc2UsIHBhZGRpbmdUTC5hZGQocGFkZGluZ0JSKSksXHJcblx0XHQgICAgcGFkZGluZ09mZnNldCA9IHBhZGRpbmdCUi5zdWJ0cmFjdChwYWRkaW5nVEwpLmRpdmlkZUJ5KDIpLFxyXG5cclxuXHRcdCAgICBzd1BvaW50ID0gdGhpcy5wcm9qZWN0KGJvdW5kcy5nZXRTb3V0aFdlc3QoKSwgem9vbSksXHJcblx0XHQgICAgbmVQb2ludCA9IHRoaXMucHJvamVjdChib3VuZHMuZ2V0Tm9ydGhFYXN0KCksIHpvb20pLFxyXG5cdFx0ICAgIGNlbnRlciA9IHRoaXMudW5wcm9qZWN0KHN3UG9pbnQuYWRkKG5lUG9pbnQpLmRpdmlkZUJ5KDIpLmFkZChwYWRkaW5nT2Zmc2V0KSwgem9vbSk7XHJcblxyXG5cdFx0em9vbSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5tYXhab29tID8gTWF0aC5taW4ob3B0aW9ucy5tYXhab29tLCB6b29tKSA6IHpvb207XHJcblxyXG5cdFx0cmV0dXJuIHRoaXMuc2V0VmlldyhjZW50ZXIsIHpvb20sIG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdGZpdFdvcmxkOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0cmV0dXJuIHRoaXMuZml0Qm91bmRzKFtbLTkwLCAtMTgwXSwgWzkwLCAxODBdXSwgb3B0aW9ucyk7XHJcblx0fSxcclxuXHJcblx0cGFuVG86IGZ1bmN0aW9uIChjZW50ZXIsIG9wdGlvbnMpIHsgLy8gKExhdExuZylcclxuXHRcdHJldHVybiB0aGlzLnNldFZpZXcoY2VudGVyLCB0aGlzLl96b29tLCB7cGFuOiBvcHRpb25zfSk7XHJcblx0fSxcclxuXHJcblx0cGFuQnk6IGZ1bmN0aW9uIChvZmZzZXQpIHsgLy8gKFBvaW50KVxyXG5cdFx0Ly8gcmVwbGFjZWQgd2l0aCBhbmltYXRlZCBwYW5CeSBpbiBNYXAuUGFuQW5pbWF0aW9uLmpzXHJcblx0XHR0aGlzLmZpcmUoJ21vdmVzdGFydCcpO1xyXG5cclxuXHRcdHRoaXMuX3Jhd1BhbkJ5KEwucG9pbnQob2Zmc2V0KSk7XHJcblxyXG5cdFx0dGhpcy5maXJlKCdtb3ZlJyk7XHJcblx0XHRyZXR1cm4gdGhpcy5maXJlKCdtb3ZlZW5kJyk7XHJcblx0fSxcclxuXHJcblx0c2V0TWF4Qm91bmRzOiBmdW5jdGlvbiAoYm91bmRzKSB7XHJcblx0XHRib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhib3VuZHMpO1xyXG5cclxuXHRcdHRoaXMub3B0aW9ucy5tYXhCb3VuZHMgPSBib3VuZHM7XHJcblxyXG5cdFx0aWYgKCFib3VuZHMpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMub2ZmKCdtb3ZlZW5kJywgdGhpcy5fcGFuSW5zaWRlTWF4Qm91bmRzLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdHRoaXMuX3Bhbkluc2lkZU1heEJvdW5kcygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzLm9uKCdtb3ZlZW5kJywgdGhpcy5fcGFuSW5zaWRlTWF4Qm91bmRzLCB0aGlzKTtcclxuXHR9LFxyXG5cclxuXHRwYW5JbnNpZGVCb3VuZHM6IGZ1bmN0aW9uIChib3VuZHMsIG9wdGlvbnMpIHtcclxuXHRcdHZhciBjZW50ZXIgPSB0aGlzLmdldENlbnRlcigpLFxyXG5cdFx0XHRuZXdDZW50ZXIgPSB0aGlzLl9saW1pdENlbnRlcihjZW50ZXIsIHRoaXMuX3pvb20sIGJvdW5kcyk7XHJcblxyXG5cdFx0aWYgKGNlbnRlci5lcXVhbHMobmV3Q2VudGVyKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHRcdHJldHVybiB0aGlzLnBhblRvKG5ld0NlbnRlciwgb3B0aW9ucyk7XHJcblx0fSxcclxuXHJcblx0YWRkTGF5ZXI6IGZ1bmN0aW9uIChsYXllcikge1xyXG5cdFx0Ly8gVE9ETyBtZXRob2QgaXMgdG9vIGJpZywgcmVmYWN0b3JcclxuXHJcblx0XHR2YXIgaWQgPSBMLnN0YW1wKGxheWVyKTtcclxuXHJcblx0XHRpZiAodGhpcy5fbGF5ZXJzW2lkXSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHRcdHRoaXMuX2xheWVyc1tpZF0gPSBsYXllcjtcclxuXHJcblx0XHQvLyBUT0RPIGdldE1heFpvb20sIGdldE1pblpvb20gaW4gSUxheWVyIChpbnN0ZWFkIG9mIG9wdGlvbnMpXHJcblx0XHRpZiAobGF5ZXIub3B0aW9ucyAmJiAoIWlzTmFOKGxheWVyLm9wdGlvbnMubWF4Wm9vbSkgfHwgIWlzTmFOKGxheWVyLm9wdGlvbnMubWluWm9vbSkpKSB7XHJcblx0XHRcdHRoaXMuX3pvb21Cb3VuZExheWVyc1tpZF0gPSBsYXllcjtcclxuXHRcdFx0dGhpcy5fdXBkYXRlWm9vbUxldmVscygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFRPRE8gbG9va3MgdWdseSwgcmVmYWN0b3IhISFcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBMLlRpbGVMYXllciAmJiAobGF5ZXIgaW5zdGFuY2VvZiBMLlRpbGVMYXllcikpIHtcclxuXHRcdFx0dGhpcy5fdGlsZUxheWVyc051bSsrO1xyXG5cdFx0XHR0aGlzLl90aWxlTGF5ZXJzVG9Mb2FkKys7XHJcblx0XHRcdGxheWVyLm9uKCdsb2FkJywgdGhpcy5fb25UaWxlTGF5ZXJMb2FkLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdHRoaXMuX2xheWVyQWRkKGxheWVyKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmVMYXllcjogZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHR2YXIgaWQgPSBMLnN0YW1wKGxheWVyKTtcclxuXHJcblx0XHRpZiAoIXRoaXMuX2xheWVyc1tpZF0pIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcblx0XHRpZiAodGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdGxheWVyLm9uUmVtb3ZlKHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGRlbGV0ZSB0aGlzLl9sYXllcnNbaWRdO1xyXG5cclxuXHRcdGlmICh0aGlzLl9sb2FkZWQpIHtcclxuXHRcdFx0dGhpcy5maXJlKCdsYXllcnJlbW92ZScsIHtsYXllcjogbGF5ZXJ9KTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5fem9vbUJvdW5kTGF5ZXJzW2lkXSkge1xyXG5cdFx0XHRkZWxldGUgdGhpcy5fem9vbUJvdW5kTGF5ZXJzW2lkXTtcclxuXHRcdFx0dGhpcy5fdXBkYXRlWm9vbUxldmVscygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFRPRE8gbG9va3MgdWdseSwgcmVmYWN0b3JcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBMLlRpbGVMYXllciAmJiAobGF5ZXIgaW5zdGFuY2VvZiBMLlRpbGVMYXllcikpIHtcclxuXHRcdFx0dGhpcy5fdGlsZUxheWVyc051bS0tO1xyXG5cdFx0XHR0aGlzLl90aWxlTGF5ZXJzVG9Mb2FkLS07XHJcblx0XHRcdGxheWVyLm9mZignbG9hZCcsIHRoaXMuX29uVGlsZUxheWVyTG9hZCwgdGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0aGFzTGF5ZXI6IGZ1bmN0aW9uIChsYXllcikge1xyXG5cdFx0aWYgKCFsYXllcikgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcblx0XHRyZXR1cm4gKEwuc3RhbXAobGF5ZXIpIGluIHRoaXMuX2xheWVycyk7XHJcblx0fSxcclxuXHJcblx0ZWFjaExheWVyOiBmdW5jdGlvbiAobWV0aG9kLCBjb250ZXh0KSB7XHJcblx0XHRmb3IgKHZhciBpIGluIHRoaXMuX2xheWVycykge1xyXG5cdFx0XHRtZXRob2QuY2FsbChjb250ZXh0LCB0aGlzLl9sYXllcnNbaV0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0aW52YWxpZGF0ZVNpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRpZiAoIXRoaXMuX2xvYWRlZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHRcdG9wdGlvbnMgPSBMLmV4dGVuZCh7XHJcblx0XHRcdGFuaW1hdGU6IGZhbHNlLFxyXG5cdFx0XHRwYW46IHRydWVcclxuXHRcdH0sIG9wdGlvbnMgPT09IHRydWUgPyB7YW5pbWF0ZTogdHJ1ZX0gOiBvcHRpb25zKTtcclxuXHJcblx0XHR2YXIgb2xkU2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpO1xyXG5cdFx0dGhpcy5fc2l6ZUNoYW5nZWQgPSB0cnVlO1xyXG5cdFx0dGhpcy5faW5pdGlhbENlbnRlciA9IG51bGw7XHJcblxyXG5cdFx0dmFyIG5ld1NpemUgPSB0aGlzLmdldFNpemUoKSxcclxuXHRcdCAgICBvbGRDZW50ZXIgPSBvbGRTaXplLmRpdmlkZUJ5KDIpLnJvdW5kKCksXHJcblx0XHQgICAgbmV3Q2VudGVyID0gbmV3U2l6ZS5kaXZpZGVCeSgyKS5yb3VuZCgpLFxyXG5cdFx0ICAgIG9mZnNldCA9IG9sZENlbnRlci5zdWJ0cmFjdChuZXdDZW50ZXIpO1xyXG5cclxuXHRcdGlmICghb2Zmc2V0LnggJiYgIW9mZnNldC55KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cdFx0aWYgKG9wdGlvbnMuYW5pbWF0ZSAmJiBvcHRpb25zLnBhbikge1xyXG5cdFx0XHR0aGlzLnBhbkJ5KG9mZnNldCk7XHJcblxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKG9wdGlvbnMucGFuKSB7XHJcblx0XHRcdFx0dGhpcy5fcmF3UGFuQnkob2Zmc2V0KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5maXJlKCdtb3ZlJyk7XHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucy5kZWJvdW5jZU1vdmVlbmQpIHtcclxuXHRcdFx0XHRjbGVhclRpbWVvdXQodGhpcy5fc2l6ZVRpbWVyKTtcclxuXHRcdFx0XHR0aGlzLl9zaXplVGltZXIgPSBzZXRUaW1lb3V0KEwuYmluZCh0aGlzLmZpcmUsIHRoaXMsICdtb3ZlZW5kJyksIDIwMCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5maXJlKCdtb3ZlZW5kJyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcy5maXJlKCdyZXNpemUnLCB7XHJcblx0XHRcdG9sZFNpemU6IG9sZFNpemUsXHJcblx0XHRcdG5ld1NpemU6IG5ld1NpemVcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdC8vIFRPRE8gaGFuZGxlci5hZGRUb1xyXG5cdGFkZEhhbmRsZXI6IGZ1bmN0aW9uIChuYW1lLCBIYW5kbGVyQ2xhc3MpIHtcclxuXHRcdGlmICghSGFuZGxlckNsYXNzKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cdFx0dmFyIGhhbmRsZXIgPSB0aGlzW25hbWVdID0gbmV3IEhhbmRsZXJDbGFzcyh0aGlzKTtcclxuXHJcblx0XHR0aGlzLl9oYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xyXG5cclxuXHRcdGlmICh0aGlzLm9wdGlvbnNbbmFtZV0pIHtcclxuXHRcdFx0aGFuZGxlci5lbmFibGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9sb2FkZWQpIHtcclxuXHRcdFx0dGhpcy5maXJlKCd1bmxvYWQnKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9pbml0RXZlbnRzKCdvZmYnKTtcclxuXHJcblx0XHR0cnkge1xyXG5cdFx0XHQvLyB0aHJvd3MgZXJyb3IgaW4gSUU2LThcclxuXHRcdFx0ZGVsZXRlIHRoaXMuX2NvbnRhaW5lci5fbGVhZmxldDtcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0dGhpcy5fY29udGFpbmVyLl9sZWFmbGV0ID0gdW5kZWZpbmVkO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2NsZWFyUGFuZXMoKTtcclxuXHRcdGlmICh0aGlzLl9jbGVhckNvbnRyb2xQb3MpIHtcclxuXHRcdFx0dGhpcy5fY2xlYXJDb250cm9sUG9zKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fY2xlYXJIYW5kbGVycygpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cclxuXHQvLyBwdWJsaWMgbWV0aG9kcyBmb3IgZ2V0dGluZyBtYXAgc3RhdGVcclxuXHJcblx0Z2V0Q2VudGVyOiBmdW5jdGlvbiAoKSB7IC8vIChCb29sZWFuKSAtPiBMYXRMbmdcclxuXHRcdHRoaXMuX2NoZWNrSWZMb2FkZWQoKTtcclxuXHJcblx0XHRpZiAodGhpcy5faW5pdGlhbENlbnRlciAmJiAhdGhpcy5fbW92ZWQoKSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5faW5pdGlhbENlbnRlcjtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmxheWVyUG9pbnRUb0xhdExuZyh0aGlzLl9nZXRDZW50ZXJMYXllclBvaW50KCkpO1xyXG5cdH0sXHJcblxyXG5cdGdldFpvb206IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl96b29tO1xyXG5cdH0sXHJcblxyXG5cdGdldEJvdW5kczogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGJvdW5kcyA9IHRoaXMuZ2V0UGl4ZWxCb3VuZHMoKSxcclxuXHRcdCAgICBzdyA9IHRoaXMudW5wcm9qZWN0KGJvdW5kcy5nZXRCb3R0b21MZWZ0KCkpLFxyXG5cdFx0ICAgIG5lID0gdGhpcy51bnByb2plY3QoYm91bmRzLmdldFRvcFJpZ2h0KCkpO1xyXG5cclxuXHRcdHJldHVybiBuZXcgTC5MYXRMbmdCb3VuZHMoc3csIG5lKTtcclxuXHR9LFxyXG5cclxuXHRnZXRNaW5ab29tOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLm1pblpvb20gPT09IHVuZGVmaW5lZCA/XHJcblx0XHRcdCh0aGlzLl9sYXllcnNNaW5ab29tID09PSB1bmRlZmluZWQgPyAwIDogdGhpcy5fbGF5ZXJzTWluWm9vbSkgOlxyXG5cdFx0XHR0aGlzLm9wdGlvbnMubWluWm9vbTtcclxuXHR9LFxyXG5cclxuXHRnZXRNYXhab29tOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLm1heFpvb20gPT09IHVuZGVmaW5lZCA/XHJcblx0XHRcdCh0aGlzLl9sYXllcnNNYXhab29tID09PSB1bmRlZmluZWQgPyBJbmZpbml0eSA6IHRoaXMuX2xheWVyc01heFpvb20pIDpcclxuXHRcdFx0dGhpcy5vcHRpb25zLm1heFpvb207XHJcblx0fSxcclxuXHJcblx0Z2V0Qm91bmRzWm9vbTogZnVuY3Rpb24gKGJvdW5kcywgaW5zaWRlLCBwYWRkaW5nKSB7IC8vIChMYXRMbmdCb3VuZHNbLCBCb29sZWFuLCBQb2ludF0pIC0+IE51bWJlclxyXG5cdFx0Ym91bmRzID0gTC5sYXRMbmdCb3VuZHMoYm91bmRzKTtcclxuXHJcblx0XHR2YXIgem9vbSA9IHRoaXMuZ2V0TWluWm9vbSgpIC0gKGluc2lkZSA/IDEgOiAwKSxcclxuXHRcdCAgICBtYXhab29tID0gdGhpcy5nZXRNYXhab29tKCksXHJcblx0XHQgICAgc2l6ZSA9IHRoaXMuZ2V0U2l6ZSgpLFxyXG5cclxuXHRcdCAgICBudyA9IGJvdW5kcy5nZXROb3J0aFdlc3QoKSxcclxuXHRcdCAgICBzZSA9IGJvdW5kcy5nZXRTb3V0aEVhc3QoKSxcclxuXHJcblx0XHQgICAgem9vbU5vdEZvdW5kID0gdHJ1ZSxcclxuXHRcdCAgICBib3VuZHNTaXplO1xyXG5cclxuXHRcdHBhZGRpbmcgPSBMLnBvaW50KHBhZGRpbmcgfHwgWzAsIDBdKTtcclxuXHJcblx0XHRkbyB7XHJcblx0XHRcdHpvb20rKztcclxuXHRcdFx0Ym91bmRzU2l6ZSA9IHRoaXMucHJvamVjdChzZSwgem9vbSkuc3VidHJhY3QodGhpcy5wcm9qZWN0KG53LCB6b29tKSkuYWRkKHBhZGRpbmcpO1xyXG5cdFx0XHR6b29tTm90Rm91bmQgPSAhaW5zaWRlID8gc2l6ZS5jb250YWlucyhib3VuZHNTaXplKSA6IGJvdW5kc1NpemUueCA8IHNpemUueCB8fCBib3VuZHNTaXplLnkgPCBzaXplLnk7XHJcblxyXG5cdFx0fSB3aGlsZSAoem9vbU5vdEZvdW5kICYmIHpvb20gPD0gbWF4Wm9vbSk7XHJcblxyXG5cdFx0aWYgKHpvb21Ob3RGb3VuZCAmJiBpbnNpZGUpIHtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGluc2lkZSA/IHpvb20gOiB6b29tIC0gMTtcclxuXHR9LFxyXG5cclxuXHRnZXRTaXplOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX3NpemUgfHwgdGhpcy5fc2l6ZUNoYW5nZWQpIHtcclxuXHRcdFx0dGhpcy5fc2l6ZSA9IG5ldyBMLlBvaW50KFxyXG5cdFx0XHRcdHRoaXMuX2NvbnRhaW5lci5jbGllbnRXaWR0aCxcclxuXHRcdFx0XHR0aGlzLl9jb250YWluZXIuY2xpZW50SGVpZ2h0KTtcclxuXHJcblx0XHRcdHRoaXMuX3NpemVDaGFuZ2VkID0gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fc2l6ZS5jbG9uZSgpO1xyXG5cdH0sXHJcblxyXG5cdGdldFBpeGVsQm91bmRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgdG9wTGVmdFBvaW50ID0gdGhpcy5fZ2V0VG9wTGVmdFBvaW50KCk7XHJcblx0XHRyZXR1cm4gbmV3IEwuQm91bmRzKHRvcExlZnRQb2ludCwgdG9wTGVmdFBvaW50LmFkZCh0aGlzLmdldFNpemUoKSkpO1xyXG5cdH0sXHJcblxyXG5cdGdldFBpeGVsT3JpZ2luOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl9jaGVja0lmTG9hZGVkKCk7XHJcblx0XHRyZXR1cm4gdGhpcy5faW5pdGlhbFRvcExlZnRQb2ludDtcclxuXHR9LFxyXG5cclxuXHRnZXRQYW5lczogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3BhbmVzO1xyXG5cdH0sXHJcblxyXG5cdGdldENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcclxuXHR9LFxyXG5cclxuXHJcblx0Ly8gVE9ETyByZXBsYWNlIHdpdGggdW5pdmVyc2FsIGltcGxlbWVudGF0aW9uIGFmdGVyIHJlZmFjdG9yaW5nIHByb2plY3Rpb25zXHJcblxyXG5cdGdldFpvb21TY2FsZTogZnVuY3Rpb24gKHRvWm9vbSkge1xyXG5cdFx0dmFyIGNycyA9IHRoaXMub3B0aW9ucy5jcnM7XHJcblx0XHRyZXR1cm4gY3JzLnNjYWxlKHRvWm9vbSkgLyBjcnMuc2NhbGUodGhpcy5fem9vbSk7XHJcblx0fSxcclxuXHJcblx0Z2V0U2NhbGVab29tOiBmdW5jdGlvbiAoc2NhbGUpIHtcclxuXHRcdHJldHVybiB0aGlzLl96b29tICsgKE1hdGgubG9nKHNjYWxlKSAvIE1hdGguTE4yKTtcclxuXHR9LFxyXG5cclxuXHJcblx0Ly8gY29udmVyc2lvbiBtZXRob2RzXHJcblxyXG5cdHByb2plY3Q6IGZ1bmN0aW9uIChsYXRsbmcsIHpvb20pIHsgLy8gKExhdExuZ1ssIE51bWJlcl0pIC0+IFBvaW50XHJcblx0XHR6b29tID0gem9vbSA9PT0gdW5kZWZpbmVkID8gdGhpcy5fem9vbSA6IHpvb207XHJcblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLmNycy5sYXRMbmdUb1BvaW50KEwubGF0TG5nKGxhdGxuZyksIHpvb20pO1xyXG5cdH0sXHJcblxyXG5cdHVucHJvamVjdDogZnVuY3Rpb24gKHBvaW50LCB6b29tKSB7IC8vIChQb2ludFssIE51bWJlcl0pIC0+IExhdExuZ1xyXG5cdFx0em9vbSA9IHpvb20gPT09IHVuZGVmaW5lZCA/IHRoaXMuX3pvb20gOiB6b29tO1xyXG5cdFx0cmV0dXJuIHRoaXMub3B0aW9ucy5jcnMucG9pbnRUb0xhdExuZyhMLnBvaW50KHBvaW50KSwgem9vbSk7XHJcblx0fSxcclxuXHJcblx0bGF5ZXJQb2ludFRvTGF0TG5nOiBmdW5jdGlvbiAocG9pbnQpIHsgLy8gKFBvaW50KVxyXG5cdFx0dmFyIHByb2plY3RlZFBvaW50ID0gTC5wb2ludChwb2ludCkuYWRkKHRoaXMuZ2V0UGl4ZWxPcmlnaW4oKSk7XHJcblx0XHRyZXR1cm4gdGhpcy51bnByb2plY3QocHJvamVjdGVkUG9pbnQpO1xyXG5cdH0sXHJcblxyXG5cdGxhdExuZ1RvTGF5ZXJQb2ludDogZnVuY3Rpb24gKGxhdGxuZykgeyAvLyAoTGF0TG5nKVxyXG5cdFx0dmFyIHByb2plY3RlZFBvaW50ID0gdGhpcy5wcm9qZWN0KEwubGF0TG5nKGxhdGxuZykpLl9yb3VuZCgpO1xyXG5cdFx0cmV0dXJuIHByb2plY3RlZFBvaW50Ll9zdWJ0cmFjdCh0aGlzLmdldFBpeGVsT3JpZ2luKCkpO1xyXG5cdH0sXHJcblxyXG5cdGNvbnRhaW5lclBvaW50VG9MYXllclBvaW50OiBmdW5jdGlvbiAocG9pbnQpIHsgLy8gKFBvaW50KVxyXG5cdFx0cmV0dXJuIEwucG9pbnQocG9pbnQpLnN1YnRyYWN0KHRoaXMuX2dldE1hcFBhbmVQb3MoKSk7XHJcblx0fSxcclxuXHJcblx0bGF5ZXJQb2ludFRvQ29udGFpbmVyUG9pbnQ6IGZ1bmN0aW9uIChwb2ludCkgeyAvLyAoUG9pbnQpXHJcblx0XHRyZXR1cm4gTC5wb2ludChwb2ludCkuYWRkKHRoaXMuX2dldE1hcFBhbmVQb3MoKSk7XHJcblx0fSxcclxuXHJcblx0Y29udGFpbmVyUG9pbnRUb0xhdExuZzogZnVuY3Rpb24gKHBvaW50KSB7XHJcblx0XHR2YXIgbGF5ZXJQb2ludCA9IHRoaXMuY29udGFpbmVyUG9pbnRUb0xheWVyUG9pbnQoTC5wb2ludChwb2ludCkpO1xyXG5cdFx0cmV0dXJuIHRoaXMubGF5ZXJQb2ludFRvTGF0TG5nKGxheWVyUG9pbnQpO1xyXG5cdH0sXHJcblxyXG5cdGxhdExuZ1RvQ29udGFpbmVyUG9pbnQ6IGZ1bmN0aW9uIChsYXRsbmcpIHtcclxuXHRcdHJldHVybiB0aGlzLmxheWVyUG9pbnRUb0NvbnRhaW5lclBvaW50KHRoaXMubGF0TG5nVG9MYXllclBvaW50KEwubGF0TG5nKGxhdGxuZykpKTtcclxuXHR9LFxyXG5cclxuXHRtb3VzZUV2ZW50VG9Db250YWluZXJQb2ludDogZnVuY3Rpb24gKGUpIHsgLy8gKE1vdXNlRXZlbnQpXHJcblx0XHRyZXR1cm4gTC5Eb21FdmVudC5nZXRNb3VzZVBvc2l0aW9uKGUsIHRoaXMuX2NvbnRhaW5lcik7XHJcblx0fSxcclxuXHJcblx0bW91c2VFdmVudFRvTGF5ZXJQb2ludDogZnVuY3Rpb24gKGUpIHsgLy8gKE1vdXNlRXZlbnQpXHJcblx0XHRyZXR1cm4gdGhpcy5jb250YWluZXJQb2ludFRvTGF5ZXJQb2ludCh0aGlzLm1vdXNlRXZlbnRUb0NvbnRhaW5lclBvaW50KGUpKTtcclxuXHR9LFxyXG5cclxuXHRtb3VzZUV2ZW50VG9MYXRMbmc6IGZ1bmN0aW9uIChlKSB7IC8vIChNb3VzZUV2ZW50KVxyXG5cdFx0cmV0dXJuIHRoaXMubGF5ZXJQb2ludFRvTGF0TG5nKHRoaXMubW91c2VFdmVudFRvTGF5ZXJQb2ludChlKSk7XHJcblx0fSxcclxuXHJcblxyXG5cdC8vIG1hcCBpbml0aWFsaXphdGlvbiBtZXRob2RzXHJcblxyXG5cdF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoaWQpIHtcclxuXHRcdHZhciBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuZ2V0KGlkKTtcclxuXHJcblx0XHRpZiAoIWNvbnRhaW5lcikge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ01hcCBjb250YWluZXIgbm90IGZvdW5kLicpO1xyXG5cdFx0fSBlbHNlIGlmIChjb250YWluZXIuX2xlYWZsZXQpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdNYXAgY29udGFpbmVyIGlzIGFscmVhZHkgaW5pdGlhbGl6ZWQuJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29udGFpbmVyLl9sZWFmbGV0ID0gdHJ1ZTtcclxuXHR9LFxyXG5cclxuXHRfaW5pdExheW91dDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lcjtcclxuXHJcblx0XHRMLkRvbVV0aWwuYWRkQ2xhc3MoY29udGFpbmVyLCAnbGVhZmxldC1jb250YWluZXInICtcclxuXHRcdFx0KEwuQnJvd3Nlci50b3VjaCA/ICcgbGVhZmxldC10b3VjaCcgOiAnJykgK1xyXG5cdFx0XHQoTC5Ccm93c2VyLnJldGluYSA/ICcgbGVhZmxldC1yZXRpbmEnIDogJycpICtcclxuXHRcdFx0KEwuQnJvd3Nlci5pZWx0OSA/ICcgbGVhZmxldC1vbGRpZScgOiAnJykgK1xyXG5cdFx0XHQodGhpcy5vcHRpb25zLmZhZGVBbmltYXRpb24gPyAnIGxlYWZsZXQtZmFkZS1hbmltJyA6ICcnKSk7XHJcblxyXG5cdFx0dmFyIHBvc2l0aW9uID0gTC5Eb21VdGlsLmdldFN0eWxlKGNvbnRhaW5lciwgJ3Bvc2l0aW9uJyk7XHJcblxyXG5cdFx0aWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnICYmIHBvc2l0aW9uICE9PSAncmVsYXRpdmUnICYmIHBvc2l0aW9uICE9PSAnZml4ZWQnKSB7XHJcblx0XHRcdGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5faW5pdFBhbmVzKCk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2luaXRDb250cm9sUG9zKSB7XHJcblx0XHRcdHRoaXMuX2luaXRDb250cm9sUG9zKCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X2luaXRQYW5lczogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHBhbmVzID0gdGhpcy5fcGFuZXMgPSB7fTtcclxuXHJcblx0XHR0aGlzLl9tYXBQYW5lID0gcGFuZXMubWFwUGFuZSA9IHRoaXMuX2NyZWF0ZVBhbmUoJ2xlYWZsZXQtbWFwLXBhbmUnLCB0aGlzLl9jb250YWluZXIpO1xyXG5cclxuXHRcdHRoaXMuX3RpbGVQYW5lID0gcGFuZXMudGlsZVBhbmUgPSB0aGlzLl9jcmVhdGVQYW5lKCdsZWFmbGV0LXRpbGUtcGFuZScsIHRoaXMuX21hcFBhbmUpO1xyXG5cdFx0cGFuZXMub2JqZWN0c1BhbmUgPSB0aGlzLl9jcmVhdGVQYW5lKCdsZWFmbGV0LW9iamVjdHMtcGFuZScsIHRoaXMuX21hcFBhbmUpO1xyXG5cdFx0cGFuZXMuc2hhZG93UGFuZSA9IHRoaXMuX2NyZWF0ZVBhbmUoJ2xlYWZsZXQtc2hhZG93LXBhbmUnKTtcclxuXHRcdHBhbmVzLm92ZXJsYXlQYW5lID0gdGhpcy5fY3JlYXRlUGFuZSgnbGVhZmxldC1vdmVybGF5LXBhbmUnKTtcclxuXHRcdHBhbmVzLm1hcmtlclBhbmUgPSB0aGlzLl9jcmVhdGVQYW5lKCdsZWFmbGV0LW1hcmtlci1wYW5lJyk7XHJcblx0XHRwYW5lcy5wb3B1cFBhbmUgPSB0aGlzLl9jcmVhdGVQYW5lKCdsZWFmbGV0LXBvcHVwLXBhbmUnKTtcclxuXHJcblx0XHR2YXIgem9vbUhpZGUgPSAnIGxlYWZsZXQtem9vbS1oaWRlJztcclxuXHJcblx0XHRpZiAoIXRoaXMub3B0aW9ucy5tYXJrZXJab29tQW5pbWF0aW9uKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhwYW5lcy5tYXJrZXJQYW5lLCB6b29tSGlkZSk7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhwYW5lcy5zaGFkb3dQYW5lLCB6b29tSGlkZSk7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhwYW5lcy5wb3B1cFBhbmUsIHpvb21IaWRlKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfY3JlYXRlUGFuZTogZnVuY3Rpb24gKGNsYXNzTmFtZSwgY29udGFpbmVyKSB7XHJcblx0XHRyZXR1cm4gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY2xhc3NOYW1lLCBjb250YWluZXIgfHwgdGhpcy5fcGFuZXMub2JqZWN0c1BhbmUpO1xyXG5cdH0sXHJcblxyXG5cdF9jbGVhclBhbmVzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl9jb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5fbWFwUGFuZSk7XHJcblx0fSxcclxuXHJcblx0X2FkZExheWVyczogZnVuY3Rpb24gKGxheWVycykge1xyXG5cdFx0bGF5ZXJzID0gbGF5ZXJzID8gKEwuVXRpbC5pc0FycmF5KGxheWVycykgPyBsYXllcnMgOiBbbGF5ZXJzXSkgOiBbXTtcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gbGF5ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHRoaXMuYWRkTGF5ZXIobGF5ZXJzW2ldKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHJcblx0Ly8gcHJpdmF0ZSBtZXRob2RzIHRoYXQgbW9kaWZ5IG1hcCBzdGF0ZVxyXG5cclxuXHRfcmVzZXRWaWV3OiBmdW5jdGlvbiAoY2VudGVyLCB6b29tLCBwcmVzZXJ2ZU1hcE9mZnNldCwgYWZ0ZXJab29tQW5pbSkge1xyXG5cclxuXHRcdHZhciB6b29tQ2hhbmdlZCA9ICh0aGlzLl96b29tICE9PSB6b29tKTtcclxuXHJcblx0XHRpZiAoIWFmdGVyWm9vbUFuaW0pIHtcclxuXHRcdFx0dGhpcy5maXJlKCdtb3Zlc3RhcnQnKTtcclxuXHJcblx0XHRcdGlmICh6b29tQ2hhbmdlZCkge1xyXG5cdFx0XHRcdHRoaXMuZmlyZSgnem9vbXN0YXJ0Jyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl96b29tID0gem9vbTtcclxuXHRcdHRoaXMuX2luaXRpYWxDZW50ZXIgPSBjZW50ZXI7XHJcblxyXG5cdFx0dGhpcy5faW5pdGlhbFRvcExlZnRQb2ludCA9IHRoaXMuX2dldE5ld1RvcExlZnRQb2ludChjZW50ZXIpO1xyXG5cclxuXHRcdGlmICghcHJlc2VydmVNYXBPZmZzZXQpIHtcclxuXHRcdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX21hcFBhbmUsIG5ldyBMLlBvaW50KDAsIDApKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX2luaXRpYWxUb3BMZWZ0UG9pbnQuX2FkZCh0aGlzLl9nZXRNYXBQYW5lUG9zKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3RpbGVMYXllcnNUb0xvYWQgPSB0aGlzLl90aWxlTGF5ZXJzTnVtO1xyXG5cclxuXHRcdHZhciBsb2FkaW5nID0gIXRoaXMuX2xvYWRlZDtcclxuXHRcdHRoaXMuX2xvYWRlZCA9IHRydWU7XHJcblxyXG5cdFx0dGhpcy5maXJlKCd2aWV3cmVzZXQnLCB7aGFyZDogIXByZXNlcnZlTWFwT2Zmc2V0fSk7XHJcblxyXG5cdFx0aWYgKGxvYWRpbmcpIHtcclxuXHRcdFx0dGhpcy5maXJlKCdsb2FkJyk7XHJcblx0XHRcdHRoaXMuZWFjaExheWVyKHRoaXMuX2xheWVyQWRkLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ21vdmUnKTtcclxuXHJcblx0XHRpZiAoem9vbUNoYW5nZWQgfHwgYWZ0ZXJab29tQW5pbSkge1xyXG5cdFx0XHR0aGlzLmZpcmUoJ3pvb21lbmQnKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ21vdmVlbmQnLCB7aGFyZDogIXByZXNlcnZlTWFwT2Zmc2V0fSk7XHJcblx0fSxcclxuXHJcblx0X3Jhd1BhbkJ5OiBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcblx0XHRMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fbWFwUGFuZSwgdGhpcy5fZ2V0TWFwUGFuZVBvcygpLnN1YnRyYWN0KG9mZnNldCkpO1xyXG5cdH0sXHJcblxyXG5cdF9nZXRab29tU3BhbjogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuZ2V0TWF4Wm9vbSgpIC0gdGhpcy5nZXRNaW5ab29tKCk7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVpvb21MZXZlbHM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBpLFxyXG5cdFx0XHRtaW5ab29tID0gSW5maW5pdHksXHJcblx0XHRcdG1heFpvb20gPSAtSW5maW5pdHksXHJcblx0XHRcdG9sZFpvb21TcGFuID0gdGhpcy5fZ2V0Wm9vbVNwYW4oKTtcclxuXHJcblx0XHRmb3IgKGkgaW4gdGhpcy5fem9vbUJvdW5kTGF5ZXJzKSB7XHJcblx0XHRcdHZhciBsYXllciA9IHRoaXMuX3pvb21Cb3VuZExheWVyc1tpXTtcclxuXHRcdFx0aWYgKCFpc05hTihsYXllci5vcHRpb25zLm1pblpvb20pKSB7XHJcblx0XHRcdFx0bWluWm9vbSA9IE1hdGgubWluKG1pblpvb20sIGxheWVyLm9wdGlvbnMubWluWm9vbSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFpc05hTihsYXllci5vcHRpb25zLm1heFpvb20pKSB7XHJcblx0XHRcdFx0bWF4Wm9vbSA9IE1hdGgubWF4KG1heFpvb20sIGxheWVyLm9wdGlvbnMubWF4Wm9vbSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaSA9PT0gdW5kZWZpbmVkKSB7IC8vIHdlIGhhdmUgbm8gdGlsZWxheWVyc1xyXG5cdFx0XHR0aGlzLl9sYXllcnNNYXhab29tID0gdGhpcy5fbGF5ZXJzTWluWm9vbSA9IHVuZGVmaW5lZDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX2xheWVyc01heFpvb20gPSBtYXhab29tO1xyXG5cdFx0XHR0aGlzLl9sYXllcnNNaW5ab29tID0gbWluWm9vbTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAob2xkWm9vbVNwYW4gIT09IHRoaXMuX2dldFpvb21TcGFuKCkpIHtcclxuXHRcdFx0dGhpcy5maXJlKCd6b29tbGV2ZWxzY2hhbmdlJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X3Bhbkluc2lkZU1heEJvdW5kczogZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhpcy5wYW5JbnNpZGVCb3VuZHModGhpcy5vcHRpb25zLm1heEJvdW5kcyk7XHJcblx0fSxcclxuXHJcblx0X2NoZWNrSWZMb2FkZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignU2V0IG1hcCBjZW50ZXIgYW5kIHpvb20gZmlyc3QuJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Ly8gbWFwIGV2ZW50c1xyXG5cclxuXHRfaW5pdEV2ZW50czogZnVuY3Rpb24gKG9uT2ZmKSB7XHJcblx0XHRpZiAoIUwuRG9tRXZlbnQpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0b25PZmYgPSBvbk9mZiB8fCAnb24nO1xyXG5cclxuXHRcdEwuRG9tRXZlbnRbb25PZmZdKHRoaXMuX2NvbnRhaW5lciwgJ2NsaWNrJywgdGhpcy5fb25Nb3VzZUNsaWNrLCB0aGlzKTtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gWydkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2V1cCcsICdtb3VzZWVudGVyJyxcclxuXHRcdCAgICAgICAgICAgICAgJ21vdXNlbGVhdmUnLCAnbW91c2Vtb3ZlJywgJ2NvbnRleHRtZW51J10sXHJcblx0XHQgICAgaSwgbGVuO1xyXG5cclxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGV2ZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRMLkRvbUV2ZW50W29uT2ZmXSh0aGlzLl9jb250YWluZXIsIGV2ZW50c1tpXSwgdGhpcy5fZmlyZU1vdXNlRXZlbnQsIHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLm9wdGlvbnMudHJhY2tSZXNpemUpIHtcclxuXHRcdFx0TC5Eb21FdmVudFtvbk9mZl0od2luZG93LCAncmVzaXplJywgdGhpcy5fb25SZXNpemUsIHRoaXMpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9vblJlc2l6ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0TC5VdGlsLmNhbmNlbEFuaW1GcmFtZSh0aGlzLl9yZXNpemVSZXF1ZXN0KTtcclxuXHRcdHRoaXMuX3Jlc2l6ZVJlcXVlc3QgPSBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZShcclxuXHRcdCAgICAgICAgZnVuY3Rpb24gKCkgeyB0aGlzLmludmFsaWRhdGVTaXplKHtkZWJvdW5jZU1vdmVlbmQ6IHRydWV9KTsgfSwgdGhpcywgZmFsc2UsIHRoaXMuX2NvbnRhaW5lcik7XHJcblx0fSxcclxuXHJcblx0X29uTW91c2VDbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHRcdGlmICghdGhpcy5fbG9hZGVkIHx8ICghZS5fc2ltdWxhdGVkICYmXHJcblx0XHQgICAgICAgICgodGhpcy5kcmFnZ2luZyAmJiB0aGlzLmRyYWdnaW5nLm1vdmVkKCkpIHx8XHJcblx0XHQgICAgICAgICAodGhpcy5ib3hab29tICAmJiB0aGlzLmJveFpvb20ubW92ZWQoKSkpKSB8fFxyXG5cdFx0ICAgICAgICAgICAgTC5Eb21FdmVudC5fc2tpcHBlZChlKSkgeyByZXR1cm47IH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ3ByZWNsaWNrJyk7XHJcblx0XHR0aGlzLl9maXJlTW91c2VFdmVudChlKTtcclxuXHR9LFxyXG5cclxuXHRfZmlyZU1vdXNlRXZlbnQ6IGZ1bmN0aW9uIChlKSB7XHJcblx0XHRpZiAoIXRoaXMuX2xvYWRlZCB8fCBMLkRvbUV2ZW50Ll9za2lwcGVkKGUpKSB7IHJldHVybjsgfVxyXG5cclxuXHRcdHZhciB0eXBlID0gZS50eXBlO1xyXG5cclxuXHRcdHR5cGUgPSAodHlwZSA9PT0gJ21vdXNlZW50ZXInID8gJ21vdXNlb3ZlcicgOiAodHlwZSA9PT0gJ21vdXNlbGVhdmUnID8gJ21vdXNlb3V0JyA6IHR5cGUpKTtcclxuXHJcblx0XHRpZiAoIXRoaXMuaGFzRXZlbnRMaXN0ZW5lcnModHlwZSkpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0aWYgKHR5cGUgPT09ICdjb250ZXh0bWVudScpIHtcclxuXHRcdFx0TC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY29udGFpbmVyUG9pbnQgPSB0aGlzLm1vdXNlRXZlbnRUb0NvbnRhaW5lclBvaW50KGUpLFxyXG5cdFx0ICAgIGxheWVyUG9pbnQgPSB0aGlzLmNvbnRhaW5lclBvaW50VG9MYXllclBvaW50KGNvbnRhaW5lclBvaW50KSxcclxuXHRcdCAgICBsYXRsbmcgPSB0aGlzLmxheWVyUG9pbnRUb0xhdExuZyhsYXllclBvaW50KTtcclxuXHJcblx0XHR0aGlzLmZpcmUodHlwZSwge1xyXG5cdFx0XHRsYXRsbmc6IGxhdGxuZyxcclxuXHRcdFx0bGF5ZXJQb2ludDogbGF5ZXJQb2ludCxcclxuXHRcdFx0Y29udGFpbmVyUG9pbnQ6IGNvbnRhaW5lclBvaW50LFxyXG5cdFx0XHRvcmlnaW5hbEV2ZW50OiBlXHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRfb25UaWxlTGF5ZXJMb2FkOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl90aWxlTGF5ZXJzVG9Mb2FkLS07XHJcblx0XHRpZiAodGhpcy5fdGlsZUxheWVyc051bSAmJiAhdGhpcy5fdGlsZUxheWVyc1RvTG9hZCkge1xyXG5cdFx0XHR0aGlzLmZpcmUoJ3RpbGVsYXllcnNsb2FkJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X2NsZWFySGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9oYW5kbGVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR0aGlzLl9oYW5kbGVyc1tpXS5kaXNhYmxlKCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0d2hlblJlYWR5OiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNvbnRleHQpIHtcclxuXHRcdGlmICh0aGlzLl9sb2FkZWQpIHtcclxuXHRcdFx0Y2FsbGJhY2suY2FsbChjb250ZXh0IHx8IHRoaXMsIHRoaXMpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5vbignbG9hZCcsIGNhbGxiYWNrLCBjb250ZXh0KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdF9sYXllckFkZDogZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHRsYXllci5vbkFkZCh0aGlzKTtcclxuXHRcdHRoaXMuZmlyZSgnbGF5ZXJhZGQnLCB7bGF5ZXI6IGxheWVyfSk7XHJcblx0fSxcclxuXHJcblxyXG5cdC8vIHByaXZhdGUgbWV0aG9kcyBmb3IgZ2V0dGluZyBtYXAgc3RhdGVcclxuXHJcblx0X2dldE1hcFBhbmVQb3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBMLkRvbVV0aWwuZ2V0UG9zaXRpb24odGhpcy5fbWFwUGFuZSk7XHJcblx0fSxcclxuXHJcblx0X21vdmVkOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgcG9zID0gdGhpcy5fZ2V0TWFwUGFuZVBvcygpO1xyXG5cdFx0cmV0dXJuIHBvcyAmJiAhcG9zLmVxdWFscyhbMCwgMF0pO1xyXG5cdH0sXHJcblxyXG5cdF9nZXRUb3BMZWZ0UG9pbnQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLmdldFBpeGVsT3JpZ2luKCkuc3VidHJhY3QodGhpcy5fZ2V0TWFwUGFuZVBvcygpKTtcclxuXHR9LFxyXG5cclxuXHRfZ2V0TmV3VG9wTGVmdFBvaW50OiBmdW5jdGlvbiAoY2VudGVyLCB6b29tKSB7XHJcblx0XHR2YXIgdmlld0hhbGYgPSB0aGlzLmdldFNpemUoKS5fZGl2aWRlQnkoMik7XHJcblx0XHQvLyBUT0RPIHJvdW5kIG9uIGRpc3BsYXksIG5vdCBjYWxjdWxhdGlvbiB0byBpbmNyZWFzZSBwcmVjaXNpb24/XHJcblx0XHRyZXR1cm4gdGhpcy5wcm9qZWN0KGNlbnRlciwgem9vbSkuX3N1YnRyYWN0KHZpZXdIYWxmKS5fcm91bmQoKTtcclxuXHR9LFxyXG5cclxuXHRfbGF0TG5nVG9OZXdMYXllclBvaW50OiBmdW5jdGlvbiAobGF0bG5nLCBuZXdab29tLCBuZXdDZW50ZXIpIHtcclxuXHRcdHZhciB0b3BMZWZ0ID0gdGhpcy5fZ2V0TmV3VG9wTGVmdFBvaW50KG5ld0NlbnRlciwgbmV3Wm9vbSkuYWRkKHRoaXMuX2dldE1hcFBhbmVQb3MoKSk7XHJcblx0XHRyZXR1cm4gdGhpcy5wcm9qZWN0KGxhdGxuZywgbmV3Wm9vbSkuX3N1YnRyYWN0KHRvcExlZnQpO1xyXG5cdH0sXHJcblxyXG5cdC8vIGxheWVyIHBvaW50IG9mIHRoZSBjdXJyZW50IGNlbnRlclxyXG5cdF9nZXRDZW50ZXJMYXllclBvaW50OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5jb250YWluZXJQb2ludFRvTGF5ZXJQb2ludCh0aGlzLmdldFNpemUoKS5fZGl2aWRlQnkoMikpO1xyXG5cdH0sXHJcblxyXG5cdC8vIG9mZnNldCBvZiB0aGUgc3BlY2lmaWVkIHBsYWNlIHRvIHRoZSBjdXJyZW50IGNlbnRlciBpbiBwaXhlbHNcclxuXHRfZ2V0Q2VudGVyT2Zmc2V0OiBmdW5jdGlvbiAobGF0bG5nKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5sYXRMbmdUb0xheWVyUG9pbnQobGF0bG5nKS5zdWJ0cmFjdCh0aGlzLl9nZXRDZW50ZXJMYXllclBvaW50KCkpO1xyXG5cdH0sXHJcblxyXG5cdC8vIGFkanVzdCBjZW50ZXIgZm9yIHZpZXcgdG8gZ2V0IGluc2lkZSBib3VuZHNcclxuXHRfbGltaXRDZW50ZXI6IGZ1bmN0aW9uIChjZW50ZXIsIHpvb20sIGJvdW5kcykge1xyXG5cclxuXHRcdGlmICghYm91bmRzKSB7IHJldHVybiBjZW50ZXI7IH1cclxuXHJcblx0XHR2YXIgY2VudGVyUG9pbnQgPSB0aGlzLnByb2plY3QoY2VudGVyLCB6b29tKSxcclxuXHRcdCAgICB2aWV3SGFsZiA9IHRoaXMuZ2V0U2l6ZSgpLmRpdmlkZUJ5KDIpLFxyXG5cdFx0ICAgIHZpZXdCb3VuZHMgPSBuZXcgTC5Cb3VuZHMoY2VudGVyUG9pbnQuc3VidHJhY3Qodmlld0hhbGYpLCBjZW50ZXJQb2ludC5hZGQodmlld0hhbGYpKSxcclxuXHRcdCAgICBvZmZzZXQgPSB0aGlzLl9nZXRCb3VuZHNPZmZzZXQodmlld0JvdW5kcywgYm91bmRzLCB6b29tKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy51bnByb2plY3QoY2VudGVyUG9pbnQuYWRkKG9mZnNldCksIHpvb20pO1xyXG5cdH0sXHJcblxyXG5cdC8vIGFkanVzdCBvZmZzZXQgZm9yIHZpZXcgdG8gZ2V0IGluc2lkZSBib3VuZHNcclxuXHRfbGltaXRPZmZzZXQ6IGZ1bmN0aW9uIChvZmZzZXQsIGJvdW5kcykge1xyXG5cdFx0aWYgKCFib3VuZHMpIHsgcmV0dXJuIG9mZnNldDsgfVxyXG5cclxuXHRcdHZhciB2aWV3Qm91bmRzID0gdGhpcy5nZXRQaXhlbEJvdW5kcygpLFxyXG5cdFx0ICAgIG5ld0JvdW5kcyA9IG5ldyBMLkJvdW5kcyh2aWV3Qm91bmRzLm1pbi5hZGQob2Zmc2V0KSwgdmlld0JvdW5kcy5tYXguYWRkKG9mZnNldCkpO1xyXG5cclxuXHRcdHJldHVybiBvZmZzZXQuYWRkKHRoaXMuX2dldEJvdW5kc09mZnNldChuZXdCb3VuZHMsIGJvdW5kcykpO1xyXG5cdH0sXHJcblxyXG5cdC8vIHJldHVybnMgb2Zmc2V0IG5lZWRlZCBmb3IgcHhCb3VuZHMgdG8gZ2V0IGluc2lkZSBtYXhCb3VuZHMgYXQgYSBzcGVjaWZpZWQgem9vbVxyXG5cdF9nZXRCb3VuZHNPZmZzZXQ6IGZ1bmN0aW9uIChweEJvdW5kcywgbWF4Qm91bmRzLCB6b29tKSB7XHJcblx0XHR2YXIgbndPZmZzZXQgPSB0aGlzLnByb2plY3QobWF4Qm91bmRzLmdldE5vcnRoV2VzdCgpLCB6b29tKS5zdWJ0cmFjdChweEJvdW5kcy5taW4pLFxyXG5cdFx0ICAgIHNlT2Zmc2V0ID0gdGhpcy5wcm9qZWN0KG1heEJvdW5kcy5nZXRTb3V0aEVhc3QoKSwgem9vbSkuc3VidHJhY3QocHhCb3VuZHMubWF4KSxcclxuXHJcblx0XHQgICAgZHggPSB0aGlzLl9yZWJvdW5kKG53T2Zmc2V0LngsIC1zZU9mZnNldC54KSxcclxuXHRcdCAgICBkeSA9IHRoaXMuX3JlYm91bmQobndPZmZzZXQueSwgLXNlT2Zmc2V0LnkpO1xyXG5cclxuXHRcdHJldHVybiBuZXcgTC5Qb2ludChkeCwgZHkpO1xyXG5cdH0sXHJcblxyXG5cdF9yZWJvdW5kOiBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcclxuXHRcdHJldHVybiBsZWZ0ICsgcmlnaHQgPiAwID9cclxuXHRcdFx0TWF0aC5yb3VuZChsZWZ0IC0gcmlnaHQpIC8gMiA6XHJcblx0XHRcdE1hdGgubWF4KDAsIE1hdGguY2VpbChsZWZ0KSkgLSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKHJpZ2h0KSk7XHJcblx0fSxcclxuXHJcblx0X2xpbWl0Wm9vbTogZnVuY3Rpb24gKHpvb20pIHtcclxuXHRcdHZhciBtaW4gPSB0aGlzLmdldE1pblpvb20oKSxcclxuXHRcdCAgICBtYXggPSB0aGlzLmdldE1heFpvb20oKTtcclxuXHJcblx0XHRyZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbihtYXgsIHpvb20pKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5tYXAgPSBmdW5jdGlvbiAoaWQsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuTWFwKGlkLCBvcHRpb25zKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIE1lcmNhdG9yIHByb2plY3Rpb24gdGhhdCB0YWtlcyBpbnRvIGFjY291bnQgdGhhdCB0aGUgRWFydGggaXMgbm90IGEgcGVyZmVjdCBzcGhlcmUuXHJcbiAqIExlc3MgcG9wdWxhciB0aGFuIHNwaGVyaWNhbCBtZXJjYXRvcjsgdXNlZCBieSBwcm9qZWN0aW9ucyBsaWtlIEVQU0c6MzM5NS5cclxuICovXHJcblxyXG5MLlByb2plY3Rpb24uTWVyY2F0b3IgPSB7XHJcblx0TUFYX0xBVElUVURFOiA4NS4wODQwNTkxNTU2LFxyXG5cclxuXHRSX01JTk9SOiA2MzU2NzUyLjMxNDI0NTE3OSxcclxuXHRSX01BSk9SOiA2Mzc4MTM3LFxyXG5cclxuXHRwcm9qZWN0OiBmdW5jdGlvbiAobGF0bG5nKSB7IC8vIChMYXRMbmcpIC0+IFBvaW50XHJcblx0XHR2YXIgZCA9IEwuTGF0TG5nLkRFR19UT19SQUQsXHJcblx0XHQgICAgbWF4ID0gdGhpcy5NQVhfTEFUSVRVREUsXHJcblx0XHQgICAgbGF0ID0gTWF0aC5tYXgoTWF0aC5taW4obWF4LCBsYXRsbmcubGF0KSwgLW1heCksXHJcblx0XHQgICAgciA9IHRoaXMuUl9NQUpPUixcclxuXHRcdCAgICByMiA9IHRoaXMuUl9NSU5PUixcclxuXHRcdCAgICB4ID0gbGF0bG5nLmxuZyAqIGQgKiByLFxyXG5cdFx0ICAgIHkgPSBsYXQgKiBkLFxyXG5cdFx0ICAgIHRtcCA9IHIyIC8gcixcclxuXHRcdCAgICBlY2NlbnQgPSBNYXRoLnNxcnQoMS4wIC0gdG1wICogdG1wKSxcclxuXHRcdCAgICBjb24gPSBlY2NlbnQgKiBNYXRoLnNpbih5KTtcclxuXHJcblx0XHRjb24gPSBNYXRoLnBvdygoMSAtIGNvbikgLyAoMSArIGNvbiksIGVjY2VudCAqIDAuNSk7XHJcblxyXG5cdFx0dmFyIHRzID0gTWF0aC50YW4oMC41ICogKChNYXRoLlBJICogMC41KSAtIHkpKSAvIGNvbjtcclxuXHRcdHkgPSAtciAqIE1hdGgubG9nKHRzKTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IEwuUG9pbnQoeCwgeSk7XHJcblx0fSxcclxuXHJcblx0dW5wcm9qZWN0OiBmdW5jdGlvbiAocG9pbnQpIHsgLy8gKFBvaW50LCBCb29sZWFuKSAtPiBMYXRMbmdcclxuXHRcdHZhciBkID0gTC5MYXRMbmcuUkFEX1RPX0RFRyxcclxuXHRcdCAgICByID0gdGhpcy5SX01BSk9SLFxyXG5cdFx0ICAgIHIyID0gdGhpcy5SX01JTk9SLFxyXG5cdFx0ICAgIGxuZyA9IHBvaW50LnggKiBkIC8gcixcclxuXHRcdCAgICB0bXAgPSByMiAvIHIsXHJcblx0XHQgICAgZWNjZW50ID0gTWF0aC5zcXJ0KDEgLSAodG1wICogdG1wKSksXHJcblx0XHQgICAgdHMgPSBNYXRoLmV4cCgtIHBvaW50LnkgLyByKSxcclxuXHRcdCAgICBwaGkgPSAoTWF0aC5QSSAvIDIpIC0gMiAqIE1hdGguYXRhbih0cyksXHJcblx0XHQgICAgbnVtSXRlciA9IDE1LFxyXG5cdFx0ICAgIHRvbCA9IDFlLTcsXHJcblx0XHQgICAgaSA9IG51bUl0ZXIsXHJcblx0XHQgICAgZHBoaSA9IDAuMSxcclxuXHRcdCAgICBjb247XHJcblxyXG5cdFx0d2hpbGUgKChNYXRoLmFicyhkcGhpKSA+IHRvbCkgJiYgKC0taSA+IDApKSB7XHJcblx0XHRcdGNvbiA9IGVjY2VudCAqIE1hdGguc2luKHBoaSk7XHJcblx0XHRcdGRwaGkgPSAoTWF0aC5QSSAvIDIpIC0gMiAqIE1hdGguYXRhbih0cyAqXHJcblx0XHRcdCAgICAgICAgICAgIE1hdGgucG93KCgxLjAgLSBjb24pIC8gKDEuMCArIGNvbiksIDAuNSAqIGVjY2VudCkpIC0gcGhpO1xyXG5cdFx0XHRwaGkgKz0gZHBoaTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmV3IEwuTGF0TG5nKHBoaSAqIGQsIGxuZyk7XHJcblx0fVxyXG59O1xyXG5cblxuXHJcbkwuQ1JTLkVQU0czMzk1ID0gTC5leHRlbmQoe30sIEwuQ1JTLCB7XHJcblx0Y29kZTogJ0VQU0c6MzM5NScsXHJcblxyXG5cdHByb2plY3Rpb246IEwuUHJvamVjdGlvbi5NZXJjYXRvcixcclxuXHJcblx0dHJhbnNmb3JtYXRpb246IChmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgbSA9IEwuUHJvamVjdGlvbi5NZXJjYXRvcixcclxuXHRcdCAgICByID0gbS5SX01BSk9SLFxyXG5cdFx0ICAgIHNjYWxlID0gMC41IC8gKE1hdGguUEkgKiByKTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IEwuVHJhbnNmb3JtYXRpb24oc2NhbGUsIDAuNSwgLXNjYWxlLCAwLjUpO1xyXG5cdH0oKSlcclxufSk7XHJcblxuXG4vKlxyXG4gKiBMLlRpbGVMYXllciBpcyB1c2VkIGZvciBzdGFuZGFyZCB4eXotbnVtYmVyZWQgdGlsZSBsYXllcnMuXHJcbiAqL1xyXG5cclxuTC5UaWxlTGF5ZXIgPSBMLkNsYXNzLmV4dGVuZCh7XHJcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRtaW5ab29tOiAwLFxyXG5cdFx0bWF4Wm9vbTogMTgsXHJcblx0XHR0aWxlU2l6ZTogMjU2LFxyXG5cdFx0c3ViZG9tYWluczogJ2FiYycsXHJcblx0XHRlcnJvclRpbGVVcmw6ICcnLFxyXG5cdFx0YXR0cmlidXRpb246ICcnLFxyXG5cdFx0em9vbU9mZnNldDogMCxcclxuXHRcdG9wYWNpdHk6IDEsXHJcblx0XHQvKlxyXG5cdFx0bWF4TmF0aXZlWm9vbTogbnVsbCxcclxuXHRcdHpJbmRleDogbnVsbCxcclxuXHRcdHRtczogZmFsc2UsXHJcblx0XHRjb250aW51b3VzV29ybGQ6IGZhbHNlLFxyXG5cdFx0bm9XcmFwOiBmYWxzZSxcclxuXHRcdHpvb21SZXZlcnNlOiBmYWxzZSxcclxuXHRcdGRldGVjdFJldGluYTogZmFsc2UsXHJcblx0XHRyZXVzZVRpbGVzOiBmYWxzZSxcclxuXHRcdGJvdW5kczogZmFsc2UsXHJcblx0XHQqL1xyXG5cdFx0dW5sb2FkSW52aXNpYmxlVGlsZXM6IEwuQnJvd3Nlci5tb2JpbGUsXHJcblx0XHR1cGRhdGVXaGVuSWRsZTogTC5Ccm93c2VyLm1vYmlsZVxyXG5cdH0sXHJcblxyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcclxuXHRcdG9wdGlvbnMgPSBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblxyXG5cdFx0Ly8gZGV0ZWN0aW5nIHJldGluYSBkaXNwbGF5cywgYWRqdXN0aW5nIHRpbGVTaXplIGFuZCB6b29tIGxldmVsc1xyXG5cdFx0aWYgKG9wdGlvbnMuZGV0ZWN0UmV0aW5hICYmIEwuQnJvd3Nlci5yZXRpbmEgJiYgb3B0aW9ucy5tYXhab29tID4gMCkge1xyXG5cclxuXHRcdFx0b3B0aW9ucy50aWxlU2l6ZSA9IE1hdGguZmxvb3Iob3B0aW9ucy50aWxlU2l6ZSAvIDIpO1xyXG5cdFx0XHRvcHRpb25zLnpvb21PZmZzZXQrKztcclxuXHJcblx0XHRcdGlmIChvcHRpb25zLm1pblpvb20gPiAwKSB7XHJcblx0XHRcdFx0b3B0aW9ucy5taW5ab29tLS07XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5vcHRpb25zLm1heFpvb20tLTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5ib3VuZHMpIHtcclxuXHRcdFx0b3B0aW9ucy5ib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhvcHRpb25zLmJvdW5kcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fdXJsID0gdXJsO1xyXG5cclxuXHRcdHZhciBzdWJkb21haW5zID0gdGhpcy5vcHRpb25zLnN1YmRvbWFpbnM7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBzdWJkb21haW5zID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHR0aGlzLm9wdGlvbnMuc3ViZG9tYWlucyA9IHN1YmRvbWFpbnMuc3BsaXQoJycpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHR0aGlzLl9tYXAgPSBtYXA7XHJcblx0XHR0aGlzLl9hbmltYXRlZCA9IG1hcC5fem9vbUFuaW1hdGVkO1xyXG5cclxuXHRcdC8vIGNyZWF0ZSBhIGNvbnRhaW5lciBkaXYgZm9yIHRpbGVzXHJcblx0XHR0aGlzLl9pbml0Q29udGFpbmVyKCk7XHJcblxyXG5cdFx0Ly8gc2V0IHVwIGV2ZW50c1xyXG5cdFx0bWFwLm9uKHtcclxuXHRcdFx0J3ZpZXdyZXNldCc6IHRoaXMuX3Jlc2V0LFxyXG5cdFx0XHQnbW92ZWVuZCc6IHRoaXMuX3VwZGF0ZVxyXG5cdFx0fSwgdGhpcyk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2FuaW1hdGVkKSB7XHJcblx0XHRcdG1hcC5vbih7XHJcblx0XHRcdFx0J3pvb21hbmltJzogdGhpcy5fYW5pbWF0ZVpvb20sXHJcblx0XHRcdFx0J3pvb21lbmQnOiB0aGlzLl9lbmRab29tQW5pbVxyXG5cdFx0XHR9LCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMub3B0aW9ucy51cGRhdGVXaGVuSWRsZSkge1xyXG5cdFx0XHR0aGlzLl9saW1pdGVkVXBkYXRlID0gTC5VdGlsLmxpbWl0RXhlY0J5SW50ZXJ2YWwodGhpcy5fdXBkYXRlLCAxNTAsIHRoaXMpO1xyXG5cdFx0XHRtYXAub24oJ21vdmUnLCB0aGlzLl9saW1pdGVkVXBkYXRlLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9yZXNldCgpO1xyXG5cdFx0dGhpcy5fdXBkYXRlKCk7XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5hZGRMYXllcih0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHR0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xyXG5cclxuXHRcdG1hcC5vZmYoe1xyXG5cdFx0XHQndmlld3Jlc2V0JzogdGhpcy5fcmVzZXQsXHJcblx0XHRcdCdtb3ZlZW5kJzogdGhpcy5fdXBkYXRlXHJcblx0XHR9LCB0aGlzKTtcclxuXHJcblx0XHRpZiAodGhpcy5fYW5pbWF0ZWQpIHtcclxuXHRcdFx0bWFwLm9mZih7XHJcblx0XHRcdFx0J3pvb21hbmltJzogdGhpcy5fYW5pbWF0ZVpvb20sXHJcblx0XHRcdFx0J3pvb21lbmQnOiB0aGlzLl9lbmRab29tQW5pbVxyXG5cdFx0XHR9LCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMub3B0aW9ucy51cGRhdGVXaGVuSWRsZSkge1xyXG5cdFx0XHRtYXAub2ZmKCdtb3ZlJywgdGhpcy5fbGltaXRlZFVwZGF0ZSwgdGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fY29udGFpbmVyID0gbnVsbDtcclxuXHRcdHRoaXMuX21hcCA9IG51bGw7XHJcblx0fSxcclxuXHJcblx0YnJpbmdUb0Zyb250OiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgcGFuZSA9IHRoaXMuX21hcC5fcGFuZXMudGlsZVBhbmU7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2NvbnRhaW5lcikge1xyXG5cdFx0XHRwYW5lLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XHJcblx0XHRcdHRoaXMuX3NldEF1dG9aSW5kZXgocGFuZSwgTWF0aC5tYXgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGJyaW5nVG9CYWNrOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgcGFuZSA9IHRoaXMuX21hcC5fcGFuZXMudGlsZVBhbmU7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2NvbnRhaW5lcikge1xyXG5cdFx0XHRwYW5lLmluc2VydEJlZm9yZSh0aGlzLl9jb250YWluZXIsIHBhbmUuZmlyc3RDaGlsZCk7XHJcblx0XHRcdHRoaXMuX3NldEF1dG9aSW5kZXgocGFuZSwgTWF0aC5taW4pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGdldEF0dHJpYnV0aW9uOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uO1xyXG5cdH0sXHJcblxyXG5cdGdldENvbnRhaW5lcjogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcclxuXHR9LFxyXG5cclxuXHRzZXRPcGFjaXR5OiBmdW5jdGlvbiAob3BhY2l0eSkge1xyXG5cdFx0dGhpcy5vcHRpb25zLm9wYWNpdHkgPSBvcGFjaXR5O1xyXG5cclxuXHRcdGlmICh0aGlzLl9tYXApIHtcclxuXHRcdFx0dGhpcy5fdXBkYXRlT3BhY2l0eSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldFpJbmRleDogZnVuY3Rpb24gKHpJbmRleCkge1xyXG5cdFx0dGhpcy5vcHRpb25zLnpJbmRleCA9IHpJbmRleDtcclxuXHRcdHRoaXMuX3VwZGF0ZVpJbmRleCgpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldFVybDogZnVuY3Rpb24gKHVybCwgbm9SZWRyYXcpIHtcclxuXHRcdHRoaXMuX3VybCA9IHVybDtcclxuXHJcblx0XHRpZiAoIW5vUmVkcmF3KSB7XHJcblx0XHRcdHRoaXMucmVkcmF3KCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0cmVkcmF3OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5fbWFwKSB7XHJcblx0XHRcdHRoaXMuX3Jlc2V0KHtoYXJkOiB0cnVlfSk7XHJcblx0XHRcdHRoaXMuX3VwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVpJbmRleDogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbnRhaW5lciAmJiB0aGlzLm9wdGlvbnMuekluZGV4ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5fY29udGFpbmVyLnN0eWxlLnpJbmRleCA9IHRoaXMub3B0aW9ucy56SW5kZXg7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X3NldEF1dG9aSW5kZXg6IGZ1bmN0aW9uIChwYW5lLCBjb21wYXJlKSB7XHJcblxyXG5cdFx0dmFyIGxheWVycyA9IHBhbmUuY2hpbGRyZW4sXHJcblx0XHQgICAgZWRnZVpJbmRleCA9IC1jb21wYXJlKEluZmluaXR5LCAtSW5maW5pdHkpLCAvLyAtSW5maW5pdHkgZm9yIG1heCwgSW5maW5pdHkgZm9yIG1pblxyXG5cdFx0ICAgIHpJbmRleCwgaSwgbGVuO1xyXG5cclxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGxheWVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cclxuXHRcdFx0aWYgKGxheWVyc1tpXSAhPT0gdGhpcy5fY29udGFpbmVyKSB7XHJcblx0XHRcdFx0ekluZGV4ID0gcGFyc2VJbnQobGF5ZXJzW2ldLnN0eWxlLnpJbmRleCwgMTApO1xyXG5cclxuXHRcdFx0XHRpZiAoIWlzTmFOKHpJbmRleCkpIHtcclxuXHRcdFx0XHRcdGVkZ2VaSW5kZXggPSBjb21wYXJlKGVkZ2VaSW5kZXgsIHpJbmRleCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vcHRpb25zLnpJbmRleCA9IHRoaXMuX2NvbnRhaW5lci5zdHlsZS56SW5kZXggPVxyXG5cdFx0ICAgICAgICAoaXNGaW5pdGUoZWRnZVpJbmRleCkgPyBlZGdlWkluZGV4IDogMCkgKyBjb21wYXJlKDEsIC0xKTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlT3BhY2l0eTogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGksXHJcblx0XHQgICAgdGlsZXMgPSB0aGlzLl90aWxlcztcclxuXHJcblx0XHRpZiAoTC5Ccm93c2VyLmllbHQ5KSB7XHJcblx0XHRcdGZvciAoaSBpbiB0aWxlcykge1xyXG5cdFx0XHRcdEwuRG9tVXRpbC5zZXRPcGFjaXR5KHRpbGVzW2ldLCB0aGlzLm9wdGlvbnMub3BhY2l0eSk7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdEwuRG9tVXRpbC5zZXRPcGFjaXR5KHRoaXMuX2NvbnRhaW5lciwgdGhpcy5vcHRpb25zLm9wYWNpdHkpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgdGlsZVBhbmUgPSB0aGlzLl9tYXAuX3BhbmVzLnRpbGVQYW5lO1xyXG5cclxuXHRcdGlmICghdGhpcy5fY29udGFpbmVyKSB7XHJcblx0XHRcdHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWxheWVyJyk7XHJcblxyXG5cdFx0XHR0aGlzLl91cGRhdGVaSW5kZXgoKTtcclxuXHJcblx0XHRcdGlmICh0aGlzLl9hbmltYXRlZCkge1xyXG5cdFx0XHRcdHZhciBjbGFzc05hbWUgPSAnbGVhZmxldC10aWxlLWNvbnRhaW5lcic7XHJcblxyXG5cdFx0XHRcdHRoaXMuX2JnQnVmZmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY2xhc3NOYW1lLCB0aGlzLl9jb250YWluZXIpO1xyXG5cdFx0XHRcdHRoaXMuX3RpbGVDb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUsIHRoaXMuX2NvbnRhaW5lcik7XHJcblxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3RpbGVDb250YWluZXIgPSB0aGlzLl9jb250YWluZXI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRpbGVQYW5lLmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lcik7XHJcblxyXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLm9wYWNpdHkgPCAxKSB7XHJcblx0XHRcdFx0dGhpcy5fdXBkYXRlT3BhY2l0eSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X3Jlc2V0OiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0Zm9yICh2YXIga2V5IGluIHRoaXMuX3RpbGVzKSB7XHJcblx0XHRcdHRoaXMuZmlyZSgndGlsZXVubG9hZCcsIHt0aWxlOiB0aGlzLl90aWxlc1trZXldfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fdGlsZXMgPSB7fTtcclxuXHRcdHRoaXMuX3RpbGVzVG9Mb2FkID0gMDtcclxuXHJcblx0XHRpZiAodGhpcy5vcHRpb25zLnJldXNlVGlsZXMpIHtcclxuXHRcdFx0dGhpcy5fdW51c2VkVGlsZXMgPSBbXTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl90aWxlQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xyXG5cclxuXHRcdGlmICh0aGlzLl9hbmltYXRlZCAmJiBlICYmIGUuaGFyZCkge1xyXG5cdFx0XHR0aGlzLl9jbGVhckJnQnVmZmVyKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5faW5pdENvbnRhaW5lcigpO1xyXG5cdH0sXHJcblxyXG5cdF9nZXRUaWxlU2l6ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdCAgICB6b29tID0gbWFwLmdldFpvb20oKSArIHRoaXMub3B0aW9ucy56b29tT2Zmc2V0LFxyXG5cdFx0ICAgIHpvb21OID0gdGhpcy5vcHRpb25zLm1heE5hdGl2ZVpvb20sXHJcblx0XHQgICAgdGlsZVNpemUgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XHJcblxyXG5cdFx0aWYgKHpvb21OICYmIHpvb20gPiB6b29tTikge1xyXG5cdFx0XHR0aWxlU2l6ZSA9IE1hdGgucm91bmQobWFwLmdldFpvb21TY2FsZSh6b29tKSAvIG1hcC5nZXRab29tU2NhbGUoem9vbU4pICogdGlsZVNpemUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aWxlU2l6ZTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0aWYgKCF0aGlzLl9tYXApIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdCAgICBib3VuZHMgPSBtYXAuZ2V0UGl4ZWxCb3VuZHMoKSxcclxuXHRcdCAgICB6b29tID0gbWFwLmdldFpvb20oKSxcclxuXHRcdCAgICB0aWxlU2l6ZSA9IHRoaXMuX2dldFRpbGVTaXplKCk7XHJcblxyXG5cdFx0aWYgKHpvb20gPiB0aGlzLm9wdGlvbnMubWF4Wm9vbSB8fCB6b29tIDwgdGhpcy5vcHRpb25zLm1pblpvb20pIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB0aWxlQm91bmRzID0gTC5ib3VuZHMoXHJcblx0XHQgICAgICAgIGJvdW5kcy5taW4uZGl2aWRlQnkodGlsZVNpemUpLl9mbG9vcigpLFxyXG5cdFx0ICAgICAgICBib3VuZHMubWF4LmRpdmlkZUJ5KHRpbGVTaXplKS5fZmxvb3IoKSk7XHJcblxyXG5cdFx0dGhpcy5fYWRkVGlsZXNGcm9tQ2VudGVyT3V0KHRpbGVCb3VuZHMpO1xyXG5cclxuXHRcdGlmICh0aGlzLm9wdGlvbnMudW5sb2FkSW52aXNpYmxlVGlsZXMgfHwgdGhpcy5vcHRpb25zLnJldXNlVGlsZXMpIHtcclxuXHRcdFx0dGhpcy5fcmVtb3ZlT3RoZXJUaWxlcyh0aWxlQm91bmRzKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfYWRkVGlsZXNGcm9tQ2VudGVyT3V0OiBmdW5jdGlvbiAoYm91bmRzKSB7XHJcblx0XHR2YXIgcXVldWUgPSBbXSxcclxuXHRcdCAgICBjZW50ZXIgPSBib3VuZHMuZ2V0Q2VudGVyKCk7XHJcblxyXG5cdFx0dmFyIGosIGksIHBvaW50O1xyXG5cclxuXHRcdGZvciAoaiA9IGJvdW5kcy5taW4ueTsgaiA8PSBib3VuZHMubWF4Lnk7IGorKykge1xyXG5cdFx0XHRmb3IgKGkgPSBib3VuZHMubWluLng7IGkgPD0gYm91bmRzLm1heC54OyBpKyspIHtcclxuXHRcdFx0XHRwb2ludCA9IG5ldyBMLlBvaW50KGksIGopO1xyXG5cclxuXHRcdFx0XHRpZiAodGhpcy5fdGlsZVNob3VsZEJlTG9hZGVkKHBvaW50KSkge1xyXG5cdFx0XHRcdFx0cXVldWUucHVzaChwb2ludCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHRpbGVzVG9Mb2FkID0gcXVldWUubGVuZ3RoO1xyXG5cclxuXHRcdGlmICh0aWxlc1RvTG9hZCA9PT0gMCkgeyByZXR1cm47IH1cclxuXHJcblx0XHQvLyBsb2FkIHRpbGVzIGluIG9yZGVyIG9mIHRoZWlyIGRpc3RhbmNlIHRvIGNlbnRlclxyXG5cdFx0cXVldWUuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG5cdFx0XHRyZXR1cm4gYS5kaXN0YW5jZVRvKGNlbnRlcikgLSBiLmRpc3RhbmNlVG8oY2VudGVyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuXHJcblx0XHQvLyBpZiBpdHMgdGhlIGZpcnN0IGJhdGNoIG9mIHRpbGVzIHRvIGxvYWRcclxuXHRcdGlmICghdGhpcy5fdGlsZXNUb0xvYWQpIHtcclxuXHRcdFx0dGhpcy5maXJlKCdsb2FkaW5nJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fdGlsZXNUb0xvYWQgKz0gdGlsZXNUb0xvYWQ7XHJcblxyXG5cdFx0Zm9yIChpID0gMDsgaSA8IHRpbGVzVG9Mb2FkOyBpKyspIHtcclxuXHRcdFx0dGhpcy5fYWRkVGlsZShxdWV1ZVtpXSwgZnJhZ21lbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3RpbGVDb250YWluZXIuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xyXG5cdH0sXHJcblxyXG5cdF90aWxlU2hvdWxkQmVMb2FkZWQ6IGZ1bmN0aW9uICh0aWxlUG9pbnQpIHtcclxuXHRcdGlmICgodGlsZVBvaW50LnggKyAnOicgKyB0aWxlUG9pbnQueSkgaW4gdGhpcy5fdGlsZXMpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlOyAvLyBhbHJlYWR5IGxvYWRlZFxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xyXG5cclxuXHRcdGlmICghb3B0aW9ucy5jb250aW51b3VzV29ybGQpIHtcclxuXHRcdFx0dmFyIGxpbWl0ID0gdGhpcy5fZ2V0V3JhcFRpbGVOdW0oKTtcclxuXHJcblx0XHRcdC8vIGRvbid0IGxvYWQgaWYgZXhjZWVkcyB3b3JsZCBib3VuZHNcclxuXHRcdFx0aWYgKChvcHRpb25zLm5vV3JhcCAmJiAodGlsZVBvaW50LnggPCAwIHx8IHRpbGVQb2ludC54ID49IGxpbWl0LngpKSB8fFxyXG5cdFx0XHRcdHRpbGVQb2ludC55IDwgMCB8fCB0aWxlUG9pbnQueSA+PSBsaW1pdC55KSB7IHJldHVybiBmYWxzZTsgfVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmJvdW5kcykge1xyXG5cdFx0XHR2YXIgdGlsZVNpemUgPSBvcHRpb25zLnRpbGVTaXplLFxyXG5cdFx0XHQgICAgbndQb2ludCA9IHRpbGVQb2ludC5tdWx0aXBseUJ5KHRpbGVTaXplKSxcclxuXHRcdFx0ICAgIHNlUG9pbnQgPSBud1BvaW50LmFkZChbdGlsZVNpemUsIHRpbGVTaXplXSksXHJcblx0XHRcdCAgICBudyA9IHRoaXMuX21hcC51bnByb2plY3QobndQb2ludCksXHJcblx0XHRcdCAgICBzZSA9IHRoaXMuX21hcC51bnByb2plY3Qoc2VQb2ludCk7XHJcblxyXG5cdFx0XHQvLyBUT0RPIHRlbXBvcmFyeSBoYWNrLCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgcmVmYWN0b3JpbmcgcHJvamVjdGlvbnNcclxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL0xlYWZsZXQvTGVhZmxldC9pc3N1ZXMvMTYxOFxyXG5cdFx0XHRpZiAoIW9wdGlvbnMuY29udGludW91c1dvcmxkICYmICFvcHRpb25zLm5vV3JhcCkge1xyXG5cdFx0XHRcdG53ID0gbncud3JhcCgpO1xyXG5cdFx0XHRcdHNlID0gc2Uud3JhcCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIW9wdGlvbnMuYm91bmRzLmludGVyc2VjdHMoW253LCBzZV0pKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH0sXHJcblxyXG5cdF9yZW1vdmVPdGhlclRpbGVzOiBmdW5jdGlvbiAoYm91bmRzKSB7XHJcblx0XHR2YXIga0FyciwgeCwgeSwga2V5O1xyXG5cclxuXHRcdGZvciAoa2V5IGluIHRoaXMuX3RpbGVzKSB7XHJcblx0XHRcdGtBcnIgPSBrZXkuc3BsaXQoJzonKTtcclxuXHRcdFx0eCA9IHBhcnNlSW50KGtBcnJbMF0sIDEwKTtcclxuXHRcdFx0eSA9IHBhcnNlSW50KGtBcnJbMV0sIDEwKTtcclxuXHJcblx0XHRcdC8vIHJlbW92ZSB0aWxlIGlmIGl0J3Mgb3V0IG9mIGJvdW5kc1xyXG5cdFx0XHRpZiAoeCA8IGJvdW5kcy5taW4ueCB8fCB4ID4gYm91bmRzLm1heC54IHx8IHkgPCBib3VuZHMubWluLnkgfHwgeSA+IGJvdW5kcy5tYXgueSkge1xyXG5cdFx0XHRcdHRoaXMuX3JlbW92ZVRpbGUoa2V5KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9yZW1vdmVUaWxlOiBmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHR2YXIgdGlsZSA9IHRoaXMuX3RpbGVzW2tleV07XHJcblxyXG5cdFx0dGhpcy5maXJlKCd0aWxldW5sb2FkJywge3RpbGU6IHRpbGUsIHVybDogdGlsZS5zcmN9KTtcclxuXHJcblx0XHRpZiAodGhpcy5vcHRpb25zLnJldXNlVGlsZXMpIHtcclxuXHRcdFx0TC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRpbGUsICdsZWFmbGV0LXRpbGUtbG9hZGVkJyk7XHJcblx0XHRcdHRoaXMuX3VudXNlZFRpbGVzLnB1c2godGlsZSk7XHJcblxyXG5cdFx0fSBlbHNlIGlmICh0aWxlLnBhcmVudE5vZGUgPT09IHRoaXMuX3RpbGVDb250YWluZXIpIHtcclxuXHRcdFx0dGhpcy5fdGlsZUNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aWxlKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBmb3IgaHR0cHM6Ly9naXRodWIuY29tL0Nsb3VkTWFkZS9MZWFmbGV0L2lzc3Vlcy8xMzdcclxuXHRcdGlmICghTC5Ccm93c2VyLmFuZHJvaWQpIHtcclxuXHRcdFx0dGlsZS5vbmxvYWQgPSBudWxsO1xyXG5cdFx0XHR0aWxlLnNyYyA9IEwuVXRpbC5lbXB0eUltYWdlVXJsO1xyXG5cdFx0fVxyXG5cclxuXHRcdGRlbGV0ZSB0aGlzLl90aWxlc1trZXldO1xyXG5cdH0sXHJcblxyXG5cdF9hZGRUaWxlOiBmdW5jdGlvbiAodGlsZVBvaW50LCBjb250YWluZXIpIHtcclxuXHRcdHZhciB0aWxlUG9zID0gdGhpcy5fZ2V0VGlsZVBvcyh0aWxlUG9pbnQpO1xyXG5cclxuXHRcdC8vIGdldCB1bnVzZWQgdGlsZSAtIG9yIGNyZWF0ZSBhIG5ldyB0aWxlXHJcblx0XHR2YXIgdGlsZSA9IHRoaXMuX2dldFRpbGUoKTtcclxuXHJcblx0XHQvKlxyXG5cdFx0Q2hyb21lIDIwIGxheW91dHMgbXVjaCBmYXN0ZXIgd2l0aCB0b3AvbGVmdCAodmVyaWZ5IHdpdGggdGltZWxpbmUsIGZyYW1lcylcclxuXHRcdEFuZHJvaWQgNCBicm93c2VyIGhhcyBkaXNwbGF5IGlzc3VlcyB3aXRoIHRvcC9sZWZ0IGFuZCByZXF1aXJlcyB0cmFuc2Zvcm0gaW5zdGVhZFxyXG5cdFx0KG90aGVyIGJyb3dzZXJzIGRvbid0IGN1cnJlbnRseSBjYXJlKSAtIHNlZSBkZWJ1Zy9oYWNrcy9qaXR0ZXIuaHRtbCBmb3IgYW4gZXhhbXBsZVxyXG5cdFx0Ki9cclxuXHRcdEwuRG9tVXRpbC5zZXRQb3NpdGlvbih0aWxlLCB0aWxlUG9zLCBMLkJyb3dzZXIuY2hyb21lKTtcclxuXHJcblx0XHR0aGlzLl90aWxlc1t0aWxlUG9pbnQueCArICc6JyArIHRpbGVQb2ludC55XSA9IHRpbGU7XHJcblxyXG5cdFx0dGhpcy5fbG9hZFRpbGUodGlsZSwgdGlsZVBvaW50KTtcclxuXHJcblx0XHRpZiAodGlsZS5wYXJlbnROb2RlICE9PSB0aGlzLl90aWxlQ29udGFpbmVyKSB7XHJcblx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aWxlKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfZ2V0Wm9vbUZvclVybDogZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxyXG5cdFx0ICAgIHpvb20gPSB0aGlzLl9tYXAuZ2V0Wm9vbSgpO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLnpvb21SZXZlcnNlKSB7XHJcblx0XHRcdHpvb20gPSBvcHRpb25zLm1heFpvb20gLSB6b29tO1xyXG5cdFx0fVxyXG5cclxuXHRcdHpvb20gKz0gb3B0aW9ucy56b29tT2Zmc2V0O1xyXG5cclxuXHRcdHJldHVybiBvcHRpb25zLm1heE5hdGl2ZVpvb20gPyBNYXRoLm1pbih6b29tLCBvcHRpb25zLm1heE5hdGl2ZVpvb20pIDogem9vbTtcclxuXHR9LFxyXG5cclxuXHRfZ2V0VGlsZVBvczogZnVuY3Rpb24gKHRpbGVQb2ludCkge1xyXG5cdFx0dmFyIG9yaWdpbiA9IHRoaXMuX21hcC5nZXRQaXhlbE9yaWdpbigpLFxyXG5cdFx0ICAgIHRpbGVTaXplID0gdGhpcy5fZ2V0VGlsZVNpemUoKTtcclxuXHJcblx0XHRyZXR1cm4gdGlsZVBvaW50Lm11bHRpcGx5QnkodGlsZVNpemUpLnN1YnRyYWN0KG9yaWdpbik7XHJcblx0fSxcclxuXHJcblx0Ly8gaW1hZ2Utc3BlY2lmaWMgY29kZSAob3ZlcnJpZGUgdG8gaW1wbGVtZW50IGUuZy4gQ2FudmFzIG9yIFNWRyB0aWxlIGxheWVyKVxyXG5cclxuXHRnZXRUaWxlVXJsOiBmdW5jdGlvbiAodGlsZVBvaW50KSB7XHJcblx0XHRyZXR1cm4gTC5VdGlsLnRlbXBsYXRlKHRoaXMuX3VybCwgTC5leHRlbmQoe1xyXG5cdFx0XHRzOiB0aGlzLl9nZXRTdWJkb21haW4odGlsZVBvaW50KSxcclxuXHRcdFx0ejogdGlsZVBvaW50LnosXHJcblx0XHRcdHg6IHRpbGVQb2ludC54LFxyXG5cdFx0XHR5OiB0aWxlUG9pbnQueVxyXG5cdFx0fSwgdGhpcy5vcHRpb25zKSk7XHJcblx0fSxcclxuXHJcblx0X2dldFdyYXBUaWxlTnVtOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgY3JzID0gdGhpcy5fbWFwLm9wdGlvbnMuY3JzLFxyXG5cdFx0ICAgIHNpemUgPSBjcnMuZ2V0U2l6ZSh0aGlzLl9tYXAuZ2V0Wm9vbSgpKTtcclxuXHRcdHJldHVybiBzaXplLmRpdmlkZUJ5KHRoaXMuX2dldFRpbGVTaXplKCkpLl9mbG9vcigpO1xyXG5cdH0sXHJcblxyXG5cdF9hZGp1c3RUaWxlUG9pbnQ6IGZ1bmN0aW9uICh0aWxlUG9pbnQpIHtcclxuXHJcblx0XHR2YXIgbGltaXQgPSB0aGlzLl9nZXRXcmFwVGlsZU51bSgpO1xyXG5cclxuXHRcdC8vIHdyYXAgdGlsZSBjb29yZGluYXRlc1xyXG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMuY29udGludW91c1dvcmxkICYmICF0aGlzLm9wdGlvbnMubm9XcmFwKSB7XHJcblx0XHRcdHRpbGVQb2ludC54ID0gKCh0aWxlUG9pbnQueCAlIGxpbWl0LngpICsgbGltaXQueCkgJSBsaW1pdC54O1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLm9wdGlvbnMudG1zKSB7XHJcblx0XHRcdHRpbGVQb2ludC55ID0gbGltaXQueSAtIHRpbGVQb2ludC55IC0gMTtcclxuXHRcdH1cclxuXHJcblx0XHR0aWxlUG9pbnQueiA9IHRoaXMuX2dldFpvb21Gb3JVcmwoKTtcclxuXHR9LFxyXG5cclxuXHRfZ2V0U3ViZG9tYWluOiBmdW5jdGlvbiAodGlsZVBvaW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBNYXRoLmFicyh0aWxlUG9pbnQueCArIHRpbGVQb2ludC55KSAlIHRoaXMub3B0aW9ucy5zdWJkb21haW5zLmxlbmd0aDtcclxuXHRcdHJldHVybiB0aGlzLm9wdGlvbnMuc3ViZG9tYWluc1tpbmRleF07XHJcblx0fSxcclxuXHJcblx0X2dldFRpbGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMucmV1c2VUaWxlcyAmJiB0aGlzLl91bnVzZWRUaWxlcy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHZhciB0aWxlID0gdGhpcy5fdW51c2VkVGlsZXMucG9wKCk7XHJcblx0XHRcdHRoaXMuX3Jlc2V0VGlsZSh0aWxlKTtcclxuXHRcdFx0cmV0dXJuIHRpbGU7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fY3JlYXRlVGlsZSgpO1xyXG5cdH0sXHJcblxyXG5cdC8vIE92ZXJyaWRlIGlmIGRhdGEgc3RvcmVkIG9uIGEgdGlsZSBuZWVkcyB0byBiZSBjbGVhbmVkIHVwIGJlZm9yZSByZXVzZVxyXG5cdF9yZXNldFRpbGU6IGZ1bmN0aW9uICgvKnRpbGUqLykge30sXHJcblxyXG5cdF9jcmVhdGVUaWxlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2ltZycsICdsZWFmbGV0LXRpbGUnKTtcclxuXHRcdHRpbGUuc3R5bGUud2lkdGggPSB0aWxlLnN0eWxlLmhlaWdodCA9IHRoaXMuX2dldFRpbGVTaXplKCkgKyAncHgnO1xyXG5cdFx0dGlsZS5nYWxsZXJ5aW1nID0gJ25vJztcclxuXHJcblx0XHR0aWxlLm9uc2VsZWN0c3RhcnQgPSB0aWxlLm9ubW91c2Vtb3ZlID0gTC5VdGlsLmZhbHNlRm47XHJcblxyXG5cdFx0aWYgKEwuQnJvd3Nlci5pZWx0OSAmJiB0aGlzLm9wdGlvbnMub3BhY2l0eSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5zZXRPcGFjaXR5KHRpbGUsIHRoaXMub3B0aW9ucy5vcGFjaXR5KTtcclxuXHRcdH1cclxuXHRcdC8vIHdpdGhvdXQgdGhpcyBoYWNrLCB0aWxlcyBkaXNhcHBlYXIgYWZ0ZXIgem9vbSBvbiBDaHJvbWUgZm9yIEFuZHJvaWRcclxuXHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9MZWFmbGV0L0xlYWZsZXQvaXNzdWVzLzIwNzhcclxuXHRcdGlmIChMLkJyb3dzZXIubW9iaWxlV2Via2l0M2QpIHtcclxuXHRcdFx0dGlsZS5zdHlsZS5XZWJraXRCYWNrZmFjZVZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aWxlO1xyXG5cdH0sXHJcblxyXG5cdF9sb2FkVGlsZTogZnVuY3Rpb24gKHRpbGUsIHRpbGVQb2ludCkge1xyXG5cdFx0dGlsZS5fbGF5ZXIgID0gdGhpcztcclxuXHRcdHRpbGUub25sb2FkICA9IHRoaXMuX3RpbGVPbkxvYWQ7XHJcblx0XHR0aWxlLm9uZXJyb3IgPSB0aGlzLl90aWxlT25FcnJvcjtcclxuXHJcblx0XHR0aGlzLl9hZGp1c3RUaWxlUG9pbnQodGlsZVBvaW50KTtcclxuXHRcdHRpbGUuc3JjICAgICA9IHRoaXMuZ2V0VGlsZVVybCh0aWxlUG9pbnQpO1xyXG5cclxuXHRcdHRoaXMuZmlyZSgndGlsZWxvYWRzdGFydCcsIHtcclxuXHRcdFx0dGlsZTogdGlsZSxcclxuXHRcdFx0dXJsOiB0aWxlLnNyY1xyXG5cdFx0fSk7XHJcblx0fSxcclxuXHJcblx0X3RpbGVMb2FkZWQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX3RpbGVzVG9Mb2FkLS07XHJcblxyXG5cdFx0aWYgKHRoaXMuX2FuaW1hdGVkKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl90aWxlQ29udGFpbmVyLCAnbGVhZmxldC16b29tLWFuaW1hdGVkJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCF0aGlzLl90aWxlc1RvTG9hZCkge1xyXG5cdFx0XHR0aGlzLmZpcmUoJ2xvYWQnKTtcclxuXHJcblx0XHRcdGlmICh0aGlzLl9hbmltYXRlZCkge1xyXG5cdFx0XHRcdC8vIGNsZWFyIHNjYWxlZCB0aWxlcyBhZnRlciBhbGwgbmV3IHRpbGVzIGFyZSBsb2FkZWQgKGZvciBwZXJmb3JtYW5jZSlcclxuXHRcdFx0XHRjbGVhclRpbWVvdXQodGhpcy5fY2xlYXJCZ0J1ZmZlclRpbWVyKTtcclxuXHRcdFx0XHR0aGlzLl9jbGVhckJnQnVmZmVyVGltZXIgPSBzZXRUaW1lb3V0KEwuYmluZCh0aGlzLl9jbGVhckJnQnVmZmVyLCB0aGlzKSwgNTAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF90aWxlT25Mb2FkOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcjtcclxuXHJcblx0XHQvL09ubHkgaWYgd2UgYXJlIGxvYWRpbmcgYW4gYWN0dWFsIGltYWdlXHJcblx0XHRpZiAodGhpcy5zcmMgIT09IEwuVXRpbC5lbXB0eUltYWdlVXJsKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLCAnbGVhZmxldC10aWxlLWxvYWRlZCcpO1xyXG5cclxuXHRcdFx0bGF5ZXIuZmlyZSgndGlsZWxvYWQnLCB7XHJcblx0XHRcdFx0dGlsZTogdGhpcyxcclxuXHRcdFx0XHR1cmw6IHRoaXMuc3JjXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxheWVyLl90aWxlTG9hZGVkKCk7XHJcblx0fSxcclxuXHJcblx0X3RpbGVPbkVycm9yOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcjtcclxuXHJcblx0XHRsYXllci5maXJlKCd0aWxlZXJyb3InLCB7XHJcblx0XHRcdHRpbGU6IHRoaXMsXHJcblx0XHRcdHVybDogdGhpcy5zcmNcclxuXHRcdH0pO1xyXG5cclxuXHRcdHZhciBuZXdVcmwgPSBsYXllci5vcHRpb25zLmVycm9yVGlsZVVybDtcclxuXHRcdGlmIChuZXdVcmwpIHtcclxuXHRcdFx0dGhpcy5zcmMgPSBuZXdVcmw7XHJcblx0XHR9XHJcblxyXG5cdFx0bGF5ZXIuX3RpbGVMb2FkZWQoKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC50aWxlTGF5ZXIgPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLlRpbGVMYXllcih1cmwsIG9wdGlvbnMpO1xyXG59O1xyXG5cblxuLypcclxuICogTC5UaWxlTGF5ZXIuV01TIGlzIHVzZWQgZm9yIHB1dHRpbmcgV01TIHRpbGUgbGF5ZXJzIG9uIHRoZSBtYXAuXHJcbiAqL1xyXG5cclxuTC5UaWxlTGF5ZXIuV01TID0gTC5UaWxlTGF5ZXIuZXh0ZW5kKHtcclxuXHJcblx0ZGVmYXVsdFdtc1BhcmFtczoge1xyXG5cdFx0c2VydmljZTogJ1dNUycsXHJcblx0XHRyZXF1ZXN0OiAnR2V0TWFwJyxcclxuXHRcdHZlcnNpb246ICcxLjEuMScsXHJcblx0XHRsYXllcnM6ICcnLFxyXG5cdFx0c3R5bGVzOiAnJyxcclxuXHRcdGZvcm1hdDogJ2ltYWdlL2pwZWcnLFxyXG5cdFx0dHJhbnNwYXJlbnQ6IGZhbHNlXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKHVybCwgb3B0aW9ucykgeyAvLyAoU3RyaW5nLCBPYmplY3QpXHJcblxyXG5cdFx0dGhpcy5fdXJsID0gdXJsO1xyXG5cclxuXHRcdHZhciB3bXNQYXJhbXMgPSBMLmV4dGVuZCh7fSwgdGhpcy5kZWZhdWx0V21zUGFyYW1zKSxcclxuXHRcdCAgICB0aWxlU2l6ZSA9IG9wdGlvbnMudGlsZVNpemUgfHwgdGhpcy5vcHRpb25zLnRpbGVTaXplO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLmRldGVjdFJldGluYSAmJiBMLkJyb3dzZXIucmV0aW5hKSB7XHJcblx0XHRcdHdtc1BhcmFtcy53aWR0aCA9IHdtc1BhcmFtcy5oZWlnaHQgPSB0aWxlU2l6ZSAqIDI7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR3bXNQYXJhbXMud2lkdGggPSB3bXNQYXJhbXMuaGVpZ2h0ID0gdGlsZVNpemU7XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XHJcblx0XHRcdC8vIGFsbCBrZXlzIHRoYXQgYXJlIG5vdCBUaWxlTGF5ZXIgb3B0aW9ucyBnbyB0byBXTVMgcGFyYW1zXHJcblx0XHRcdGlmICghdGhpcy5vcHRpb25zLmhhc093blByb3BlcnR5KGkpICYmIGkgIT09ICdjcnMnKSB7XHJcblx0XHRcdFx0d21zUGFyYW1zW2ldID0gb3B0aW9uc1tpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMud21zUGFyYW1zID0gd21zUGFyYW1zO1xyXG5cclxuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cclxuXHRcdHRoaXMuX2NycyA9IHRoaXMub3B0aW9ucy5jcnMgfHwgbWFwLm9wdGlvbnMuY3JzO1xyXG5cclxuXHRcdHRoaXMuX3dtc1ZlcnNpb24gPSBwYXJzZUZsb2F0KHRoaXMud21zUGFyYW1zLnZlcnNpb24pO1xyXG5cclxuXHRcdHZhciBwcm9qZWN0aW9uS2V5ID0gdGhpcy5fd21zVmVyc2lvbiA+PSAxLjMgPyAnY3JzJyA6ICdzcnMnO1xyXG5cdFx0dGhpcy53bXNQYXJhbXNbcHJvamVjdGlvbktleV0gPSB0aGlzLl9jcnMuY29kZTtcclxuXHJcblx0XHRMLlRpbGVMYXllci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xyXG5cdH0sXHJcblxyXG5cdGdldFRpbGVVcmw6IGZ1bmN0aW9uICh0aWxlUG9pbnQpIHsgLy8gKFBvaW50LCBOdW1iZXIpIC0+IFN0cmluZ1xyXG5cclxuXHRcdHZhciBtYXAgPSB0aGlzLl9tYXAsXHJcblx0XHQgICAgdGlsZVNpemUgPSB0aGlzLm9wdGlvbnMudGlsZVNpemUsXHJcblxyXG5cdFx0ICAgIG53UG9pbnQgPSB0aWxlUG9pbnQubXVsdGlwbHlCeSh0aWxlU2l6ZSksXHJcblx0XHQgICAgc2VQb2ludCA9IG53UG9pbnQuYWRkKFt0aWxlU2l6ZSwgdGlsZVNpemVdKSxcclxuXHJcblx0XHQgICAgbncgPSB0aGlzLl9jcnMucHJvamVjdChtYXAudW5wcm9qZWN0KG53UG9pbnQsIHRpbGVQb2ludC56KSksXHJcblx0XHQgICAgc2UgPSB0aGlzLl9jcnMucHJvamVjdChtYXAudW5wcm9qZWN0KHNlUG9pbnQsIHRpbGVQb2ludC56KSksXHJcblx0XHQgICAgYmJveCA9IHRoaXMuX3dtc1ZlcnNpb24gPj0gMS4zICYmIHRoaXMuX2NycyA9PT0gTC5DUlMuRVBTRzQzMjYgP1xyXG5cdFx0ICAgICAgICBbc2UueSwgbncueCwgbncueSwgc2UueF0uam9pbignLCcpIDpcclxuXHRcdCAgICAgICAgW253LngsIHNlLnksIHNlLngsIG53LnldLmpvaW4oJywnKSxcclxuXHJcblx0XHQgICAgdXJsID0gTC5VdGlsLnRlbXBsYXRlKHRoaXMuX3VybCwge3M6IHRoaXMuX2dldFN1YmRvbWFpbih0aWxlUG9pbnQpfSk7XHJcblxyXG5cdFx0cmV0dXJuIHVybCArIEwuVXRpbC5nZXRQYXJhbVN0cmluZyh0aGlzLndtc1BhcmFtcywgdXJsLCB0cnVlKSArICcmQkJPWD0nICsgYmJveDtcclxuXHR9LFxyXG5cclxuXHRzZXRQYXJhbXM6IGZ1bmN0aW9uIChwYXJhbXMsIG5vUmVkcmF3KSB7XHJcblxyXG5cdFx0TC5leHRlbmQodGhpcy53bXNQYXJhbXMsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYgKCFub1JlZHJhdykge1xyXG5cdFx0XHR0aGlzLnJlZHJhdygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxufSk7XHJcblxyXG5MLnRpbGVMYXllci53bXMgPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLlRpbGVMYXllci5XTVModXJsLCBvcHRpb25zKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIEwuVGlsZUxheWVyLkNhbnZhcyBpcyBhIGNsYXNzIHRoYXQgeW91IGNhbiB1c2UgYXMgYSBiYXNlIGZvciBjcmVhdGluZ1xyXG4gKiBkeW5hbWljYWxseSBkcmF3biBDYW52YXMtYmFzZWQgdGlsZSBsYXllcnMuXHJcbiAqL1xyXG5cclxuTC5UaWxlTGF5ZXIuQ2FudmFzID0gTC5UaWxlTGF5ZXIuZXh0ZW5kKHtcclxuXHRvcHRpb25zOiB7XHJcblx0XHRhc3luYzogZmFsc2VcclxuXHR9LFxyXG5cclxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0TC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdHJlZHJhdzogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX21hcCkge1xyXG5cdFx0XHR0aGlzLl9yZXNldCh7aGFyZDogdHJ1ZX0pO1xyXG5cdFx0XHR0aGlzLl91cGRhdGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciBpIGluIHRoaXMuX3RpbGVzKSB7XHJcblx0XHRcdHRoaXMuX3JlZHJhd1RpbGUodGhpcy5fdGlsZXNbaV0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0X3JlZHJhd1RpbGU6IGZ1bmN0aW9uICh0aWxlKSB7XHJcblx0XHR0aGlzLmRyYXdUaWxlKHRpbGUsIHRpbGUuX3RpbGVQb2ludCwgdGhpcy5fbWFwLl96b29tKTtcclxuXHR9LFxyXG5cclxuXHRfY3JlYXRlVGlsZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHRpbGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdjYW52YXMnLCAnbGVhZmxldC10aWxlJyk7XHJcblx0XHR0aWxlLndpZHRoID0gdGlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XHJcblx0XHR0aWxlLm9uc2VsZWN0c3RhcnQgPSB0aWxlLm9ubW91c2Vtb3ZlID0gTC5VdGlsLmZhbHNlRm47XHJcblx0XHRyZXR1cm4gdGlsZTtcclxuXHR9LFxyXG5cclxuXHRfbG9hZFRpbGU6IGZ1bmN0aW9uICh0aWxlLCB0aWxlUG9pbnQpIHtcclxuXHRcdHRpbGUuX2xheWVyID0gdGhpcztcclxuXHRcdHRpbGUuX3RpbGVQb2ludCA9IHRpbGVQb2ludDtcclxuXHJcblx0XHR0aGlzLl9yZWRyYXdUaWxlKHRpbGUpO1xyXG5cclxuXHRcdGlmICghdGhpcy5vcHRpb25zLmFzeW5jKSB7XHJcblx0XHRcdHRoaXMudGlsZURyYXduKHRpbGUpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGRyYXdUaWxlOiBmdW5jdGlvbiAoLyp0aWxlLCB0aWxlUG9pbnQqLykge1xyXG5cdFx0Ly8gb3ZlcnJpZGUgd2l0aCByZW5kZXJpbmcgY29kZVxyXG5cdH0sXHJcblxyXG5cdHRpbGVEcmF3bjogZnVuY3Rpb24gKHRpbGUpIHtcclxuXHRcdHRoaXMuX3RpbGVPbkxvYWQuY2FsbCh0aWxlKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcbkwudGlsZUxheWVyLmNhbnZhcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLlRpbGVMYXllci5DYW52YXMob3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBMLkltYWdlT3ZlcmxheSBpcyB1c2VkIHRvIG92ZXJsYXkgaW1hZ2VzIG92ZXIgdGhlIG1hcCAodG8gc3BlY2lmaWMgZ2VvZ3JhcGhpY2FsIGJvdW5kcykuXHJcbiAqL1xyXG5cclxuTC5JbWFnZU92ZXJsYXkgPSBMLkNsYXNzLmV4dGVuZCh7XHJcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRvcGFjaXR5OiAxXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKHVybCwgYm91bmRzLCBvcHRpb25zKSB7IC8vIChTdHJpbmcsIExhdExuZ0JvdW5kcywgT2JqZWN0KVxyXG5cdFx0dGhpcy5fdXJsID0gdXJsO1xyXG5cdFx0dGhpcy5fYm91bmRzID0gTC5sYXRMbmdCb3VuZHMoYm91bmRzKTtcclxuXHJcblx0XHRMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblx0fSxcclxuXHJcblx0b25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdHRoaXMuX21hcCA9IG1hcDtcclxuXHJcblx0XHRpZiAoIXRoaXMuX2ltYWdlKSB7XHJcblx0XHRcdHRoaXMuX2luaXRJbWFnZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdG1hcC5fcGFuZXMub3ZlcmxheVBhbmUuYXBwZW5kQ2hpbGQodGhpcy5faW1hZ2UpO1xyXG5cclxuXHRcdG1hcC5vbigndmlld3Jlc2V0JywgdGhpcy5fcmVzZXQsIHRoaXMpO1xyXG5cclxuXHRcdGlmIChtYXAub3B0aW9ucy56b29tQW5pbWF0aW9uICYmIEwuQnJvd3Nlci5hbnkzZCkge1xyXG5cdFx0XHRtYXAub24oJ3pvb21hbmltJywgdGhpcy5fYW5pbWF0ZVpvb20sIHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3Jlc2V0KCk7XHJcblx0fSxcclxuXHJcblx0b25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5nZXRQYW5lcygpLm92ZXJsYXlQYW5lLnJlbW92ZUNoaWxkKHRoaXMuX2ltYWdlKTtcclxuXHJcblx0XHRtYXAub2ZmKCd2aWV3cmVzZXQnLCB0aGlzLl9yZXNldCwgdGhpcyk7XHJcblxyXG5cdFx0aWYgKG1hcC5vcHRpb25zLnpvb21BbmltYXRpb24pIHtcclxuXHRcdFx0bWFwLm9mZignem9vbWFuaW0nLCB0aGlzLl9hbmltYXRlWm9vbSwgdGhpcyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5hZGRMYXllcih0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldE9wYWNpdHk6IGZ1bmN0aW9uIChvcGFjaXR5KSB7XHJcblx0XHR0aGlzLm9wdGlvbnMub3BhY2l0eSA9IG9wYWNpdHk7XHJcblx0XHR0aGlzLl91cGRhdGVPcGFjaXR5KCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHQvLyBUT0RPIHJlbW92ZSBicmluZ1RvRnJvbnQvYnJpbmdUb0JhY2sgZHVwbGljYXRpb24gZnJvbSBUaWxlTGF5ZXIvUGF0aFxyXG5cdGJyaW5nVG9Gcm9udDogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX2ltYWdlKSB7XHJcblx0XHRcdHRoaXMuX21hcC5fcGFuZXMub3ZlcmxheVBhbmUuYXBwZW5kQ2hpbGQodGhpcy5faW1hZ2UpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0YnJpbmdUb0JhY2s6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBwYW5lID0gdGhpcy5fbWFwLl9wYW5lcy5vdmVybGF5UGFuZTtcclxuXHRcdGlmICh0aGlzLl9pbWFnZSkge1xyXG5cdFx0XHRwYW5lLmluc2VydEJlZm9yZSh0aGlzLl9pbWFnZSwgcGFuZS5maXJzdENoaWxkKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldFVybDogZnVuY3Rpb24gKHVybCkge1xyXG5cdFx0dGhpcy5fdXJsID0gdXJsO1xyXG5cdFx0dGhpcy5faW1hZ2Uuc3JjID0gdGhpcy5fdXJsO1xyXG5cdH0sXHJcblxyXG5cdGdldEF0dHJpYnV0aW9uOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5vcHRpb25zLmF0dHJpYnV0aW9uO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0SW1hZ2U6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX2ltYWdlID0gTC5Eb21VdGlsLmNyZWF0ZSgnaW1nJywgJ2xlYWZsZXQtaW1hZ2UtbGF5ZXInKTtcclxuXHJcblx0XHRpZiAodGhpcy5fbWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBMLkJyb3dzZXIuYW55M2QpIHtcclxuXHRcdFx0TC5Eb21VdGlsLmFkZENsYXNzKHRoaXMuX2ltYWdlLCAnbGVhZmxldC16b29tLWFuaW1hdGVkJyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5faW1hZ2UsICdsZWFmbGV0LXpvb20taGlkZScpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3VwZGF0ZU9wYWNpdHkoKTtcclxuXHJcblx0XHQvL1RPRE8gY3JlYXRlSW1hZ2UgdXRpbCBtZXRob2QgdG8gcmVtb3ZlIGR1cGxpY2F0aW9uXHJcblx0XHRMLmV4dGVuZCh0aGlzLl9pbWFnZSwge1xyXG5cdFx0XHRnYWxsZXJ5aW1nOiAnbm8nLFxyXG5cdFx0XHRvbnNlbGVjdHN0YXJ0OiBMLlV0aWwuZmFsc2VGbixcclxuXHRcdFx0b25tb3VzZW1vdmU6IEwuVXRpbC5mYWxzZUZuLFxyXG5cdFx0XHRvbmxvYWQ6IEwuYmluZCh0aGlzLl9vbkltYWdlTG9hZCwgdGhpcyksXHJcblx0XHRcdHNyYzogdGhpcy5fdXJsXHJcblx0XHR9KTtcclxuXHR9LFxyXG5cclxuXHRfYW5pbWF0ZVpvb206IGZ1bmN0aW9uIChlKSB7XHJcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwLFxyXG5cdFx0ICAgIGltYWdlID0gdGhpcy5faW1hZ2UsXHJcblx0XHQgICAgc2NhbGUgPSBtYXAuZ2V0Wm9vbVNjYWxlKGUuem9vbSksXHJcblx0XHQgICAgbncgPSB0aGlzLl9ib3VuZHMuZ2V0Tm9ydGhXZXN0KCksXHJcblx0XHQgICAgc2UgPSB0aGlzLl9ib3VuZHMuZ2V0U291dGhFYXN0KCksXHJcblxyXG5cdFx0ICAgIHRvcExlZnQgPSBtYXAuX2xhdExuZ1RvTmV3TGF5ZXJQb2ludChudywgZS56b29tLCBlLmNlbnRlciksXHJcblx0XHQgICAgc2l6ZSA9IG1hcC5fbGF0TG5nVG9OZXdMYXllclBvaW50KHNlLCBlLnpvb20sIGUuY2VudGVyKS5fc3VidHJhY3QodG9wTGVmdCksXHJcblx0XHQgICAgb3JpZ2luID0gdG9wTGVmdC5fYWRkKHNpemUuX211bHRpcGx5QnkoKDEgLyAyKSAqICgxIC0gMSAvIHNjYWxlKSkpO1xyXG5cclxuXHRcdGltYWdlLnN0eWxlW0wuRG9tVXRpbC5UUkFOU0ZPUk1dID1cclxuXHRcdCAgICAgICAgTC5Eb21VdGlsLmdldFRyYW5zbGF0ZVN0cmluZyhvcmlnaW4pICsgJyBzY2FsZSgnICsgc2NhbGUgKyAnKSAnO1xyXG5cdH0sXHJcblxyXG5cdF9yZXNldDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGltYWdlICAgPSB0aGlzLl9pbWFnZSxcclxuXHRcdCAgICB0b3BMZWZ0ID0gdGhpcy5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLl9ib3VuZHMuZ2V0Tm9ydGhXZXN0KCkpLFxyXG5cdFx0ICAgIHNpemUgPSB0aGlzLl9tYXAubGF0TG5nVG9MYXllclBvaW50KHRoaXMuX2JvdW5kcy5nZXRTb3V0aEVhc3QoKSkuX3N1YnRyYWN0KHRvcExlZnQpO1xyXG5cclxuXHRcdEwuRG9tVXRpbC5zZXRQb3NpdGlvbihpbWFnZSwgdG9wTGVmdCk7XHJcblxyXG5cdFx0aW1hZ2Uuc3R5bGUud2lkdGggID0gc2l6ZS54ICsgJ3B4JztcclxuXHRcdGltYWdlLnN0eWxlLmhlaWdodCA9IHNpemUueSArICdweCc7XHJcblx0fSxcclxuXHJcblx0X29uSW1hZ2VMb2FkOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLmZpcmUoJ2xvYWQnKTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlT3BhY2l0eTogZnVuY3Rpb24gKCkge1xyXG5cdFx0TC5Eb21VdGlsLnNldE9wYWNpdHkodGhpcy5faW1hZ2UsIHRoaXMub3B0aW9ucy5vcGFjaXR5KTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5pbWFnZU92ZXJsYXkgPSBmdW5jdGlvbiAodXJsLCBib3VuZHMsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuSW1hZ2VPdmVybGF5KHVybCwgYm91bmRzLCBvcHRpb25zKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIEwuSWNvbiBpcyBhbiBpbWFnZS1iYXNlZCBpY29uIGNsYXNzIHRoYXQgeW91IGNhbiB1c2Ugd2l0aCBMLk1hcmtlciBmb3IgY3VzdG9tIG1hcmtlcnMuXHJcbiAqL1xyXG5cclxuTC5JY29uID0gTC5DbGFzcy5leHRlbmQoe1xyXG5cdG9wdGlvbnM6IHtcclxuXHRcdC8qXHJcblx0XHRpY29uVXJsOiAoU3RyaW5nKSAocmVxdWlyZWQpXHJcblx0XHRpY29uUmV0aW5hVXJsOiAoU3RyaW5nKSAob3B0aW9uYWwsIHVzZWQgZm9yIHJldGluYSBkZXZpY2VzIGlmIGRldGVjdGVkKVxyXG5cdFx0aWNvblNpemU6IChQb2ludCkgKGNhbiBiZSBzZXQgdGhyb3VnaCBDU1MpXHJcblx0XHRpY29uQW5jaG9yOiAoUG9pbnQpIChjZW50ZXJlZCBieSBkZWZhdWx0LCBjYW4gYmUgc2V0IGluIENTUyB3aXRoIG5lZ2F0aXZlIG1hcmdpbnMpXHJcblx0XHRwb3B1cEFuY2hvcjogKFBvaW50KSAoaWYgbm90IHNwZWNpZmllZCwgcG9wdXAgb3BlbnMgaW4gdGhlIGFuY2hvciBwb2ludClcclxuXHRcdHNoYWRvd1VybDogKFN0cmluZykgKG5vIHNoYWRvdyBieSBkZWZhdWx0KVxyXG5cdFx0c2hhZG93UmV0aW5hVXJsOiAoU3RyaW5nKSAob3B0aW9uYWwsIHVzZWQgZm9yIHJldGluYSBkZXZpY2VzIGlmIGRldGVjdGVkKVxyXG5cdFx0c2hhZG93U2l6ZTogKFBvaW50KVxyXG5cdFx0c2hhZG93QW5jaG9yOiAoUG9pbnQpXHJcblx0XHQqL1xyXG5cdFx0Y2xhc3NOYW1lOiAnJ1xyXG5cdH0sXHJcblxyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblx0fSxcclxuXHJcblx0Y3JlYXRlSWNvbjogZnVuY3Rpb24gKG9sZEljb24pIHtcclxuXHRcdHJldHVybiB0aGlzLl9jcmVhdGVJY29uKCdpY29uJywgb2xkSWNvbik7XHJcblx0fSxcclxuXHJcblx0Y3JlYXRlU2hhZG93OiBmdW5jdGlvbiAob2xkSWNvbikge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NyZWF0ZUljb24oJ3NoYWRvdycsIG9sZEljb24pO1xyXG5cdH0sXHJcblxyXG5cdF9jcmVhdGVJY29uOiBmdW5jdGlvbiAobmFtZSwgb2xkSWNvbikge1xyXG5cdFx0dmFyIHNyYyA9IHRoaXMuX2dldEljb25VcmwobmFtZSk7XHJcblxyXG5cdFx0aWYgKCFzcmMpIHtcclxuXHRcdFx0aWYgKG5hbWUgPT09ICdpY29uJykge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignaWNvblVybCBub3Qgc2V0IGluIEljb24gb3B0aW9ucyAoc2VlIHRoZSBkb2NzKS4nKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaW1nO1xyXG5cdFx0aWYgKCFvbGRJY29uIHx8IG9sZEljb24udGFnTmFtZSAhPT0gJ0lNRycpIHtcclxuXHRcdFx0aW1nID0gdGhpcy5fY3JlYXRlSW1nKHNyYyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpbWcgPSB0aGlzLl9jcmVhdGVJbWcoc3JjLCBvbGRJY29uKTtcclxuXHRcdH1cclxuXHRcdHRoaXMuX3NldEljb25TdHlsZXMoaW1nLCBuYW1lKTtcclxuXHJcblx0XHRyZXR1cm4gaW1nO1xyXG5cdH0sXHJcblxyXG5cdF9zZXRJY29uU3R5bGVzOiBmdW5jdGlvbiAoaW1nLCBuYW1lKSB7XHJcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcclxuXHRcdCAgICBzaXplID0gTC5wb2ludChvcHRpb25zW25hbWUgKyAnU2l6ZSddKSxcclxuXHRcdCAgICBhbmNob3I7XHJcblxyXG5cdFx0aWYgKG5hbWUgPT09ICdzaGFkb3cnKSB7XHJcblx0XHRcdGFuY2hvciA9IEwucG9pbnQob3B0aW9ucy5zaGFkb3dBbmNob3IgfHwgb3B0aW9ucy5pY29uQW5jaG9yKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGFuY2hvciA9IEwucG9pbnQob3B0aW9ucy5pY29uQW5jaG9yKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWFuY2hvciAmJiBzaXplKSB7XHJcblx0XHRcdGFuY2hvciA9IHNpemUuZGl2aWRlQnkoMiwgdHJ1ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aW1nLmNsYXNzTmFtZSA9ICdsZWFmbGV0LW1hcmtlci0nICsgbmFtZSArICcgJyArIG9wdGlvbnMuY2xhc3NOYW1lO1xyXG5cclxuXHRcdGlmIChhbmNob3IpIHtcclxuXHRcdFx0aW1nLnN0eWxlLm1hcmdpbkxlZnQgPSAoLWFuY2hvci54KSArICdweCc7XHJcblx0XHRcdGltZy5zdHlsZS5tYXJnaW5Ub3AgID0gKC1hbmNob3IueSkgKyAncHgnO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChzaXplKSB7XHJcblx0XHRcdGltZy5zdHlsZS53aWR0aCAgPSBzaXplLnggKyAncHgnO1xyXG5cdFx0XHRpbWcuc3R5bGUuaGVpZ2h0ID0gc2l6ZS55ICsgJ3B4JztcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfY3JlYXRlSW1nOiBmdW5jdGlvbiAoc3JjLCBlbCkge1xyXG5cdFx0ZWwgPSBlbCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuXHRcdGVsLnNyYyA9IHNyYztcclxuXHRcdHJldHVybiBlbDtcclxuXHR9LFxyXG5cclxuXHRfZ2V0SWNvblVybDogZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRcdGlmIChMLkJyb3dzZXIucmV0aW5hICYmIHRoaXMub3B0aW9uc1tuYW1lICsgJ1JldGluYVVybCddKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbnNbbmFtZSArICdSZXRpbmFVcmwnXTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLm9wdGlvbnNbbmFtZSArICdVcmwnXTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5pY29uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuSWNvbihvcHRpb25zKTtcclxufTtcclxuXG5cbi8qXG4gKiBMLkljb24uRGVmYXVsdCBpcyB0aGUgYmx1ZSBtYXJrZXIgaWNvbiB1c2VkIGJ5IGRlZmF1bHQgaW4gTGVhZmxldC5cbiAqL1xuXG5MLkljb24uRGVmYXVsdCA9IEwuSWNvbi5leHRlbmQoe1xuXG5cdG9wdGlvbnM6IHtcblx0XHRpY29uU2l6ZTogWzI1LCA0MV0sXG5cdFx0aWNvbkFuY2hvcjogWzEyLCA0MV0sXG5cdFx0cG9wdXBBbmNob3I6IFsxLCAtMzRdLFxuXG5cdFx0c2hhZG93U2l6ZTogWzQxLCA0MV1cblx0fSxcblxuXHRfZ2V0SWNvblVybDogZnVuY3Rpb24gKG5hbWUpIHtcblx0XHR2YXIga2V5ID0gbmFtZSArICdVcmwnO1xuXG5cdFx0aWYgKHRoaXMub3B0aW9uc1trZXldKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25zW2tleV07XG5cdFx0fVxuXG5cdFx0aWYgKEwuQnJvd3Nlci5yZXRpbmEgJiYgbmFtZSA9PT0gJ2ljb24nKSB7XG5cdFx0XHRuYW1lICs9ICctMngnO1xuXHRcdH1cblxuXHRcdHZhciBwYXRoID0gTC5JY29uLkRlZmF1bHQuaW1hZ2VQYXRoO1xuXG5cdFx0aWYgKCFwYXRoKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkblxcJ3QgYXV0b2RldGVjdCBMLkljb24uRGVmYXVsdC5pbWFnZVBhdGgsIHNldCBpdCBtYW51YWxseS4nKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcGF0aCArICcvbWFya2VyLScgKyBuYW1lICsgJy5wbmcnO1xuXHR9XG59KTtcblxuTC5JY29uLkRlZmF1bHQuaW1hZ2VQYXRoID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksXG5cdCAgICBsZWFmbGV0UmUgPSAvW1xcL15dbGVhZmxldFtcXC1cXC5fXT8oW1xcd1xcLVxcLl9dKilcXC5qc1xcPz8vO1xuXG5cdHZhciBpLCBsZW4sIHNyYywgbWF0Y2hlcywgcGF0aDtcblxuXHRmb3IgKGkgPSAwLCBsZW4gPSBzY3JpcHRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0c3JjID0gc2NyaXB0c1tpXS5zcmM7XG5cdFx0bWF0Y2hlcyA9IHNyYy5tYXRjaChsZWFmbGV0UmUpO1xuXG5cdFx0aWYgKG1hdGNoZXMpIHtcblx0XHRcdHBhdGggPSBzcmMuc3BsaXQobGVhZmxldFJlKVswXTtcblx0XHRcdHJldHVybiAocGF0aCA/IHBhdGggKyAnLycgOiAnJykgKyAnaW1hZ2VzJztcblx0XHR9XG5cdH1cbn0oKSk7XG5cblxuLypcclxuICogTC5NYXJrZXIgaXMgdXNlZCB0byBkaXNwbGF5IGNsaWNrYWJsZS9kcmFnZ2FibGUgaWNvbnMgb24gdGhlIG1hcC5cclxuICovXHJcblxyXG5MLk1hcmtlciA9IEwuQ2xhc3MuZXh0ZW5kKHtcclxuXHJcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHRpY29uOiBuZXcgTC5JY29uLkRlZmF1bHQoKSxcclxuXHRcdHRpdGxlOiAnJyxcclxuXHRcdGFsdDogJycsXHJcblx0XHRjbGlja2FibGU6IHRydWUsXHJcblx0XHRkcmFnZ2FibGU6IGZhbHNlLFxyXG5cdFx0a2V5Ym9hcmQ6IHRydWUsXHJcblx0XHR6SW5kZXhPZmZzZXQ6IDAsXHJcblx0XHRvcGFjaXR5OiAxLFxyXG5cdFx0cmlzZU9uSG92ZXI6IGZhbHNlLFxyXG5cdFx0cmlzZU9mZnNldDogMjUwXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xyXG5cdFx0TC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG5cdFx0dGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0dGhpcy5fbWFwID0gbWFwO1xyXG5cclxuXHRcdG1hcC5vbigndmlld3Jlc2V0JywgdGhpcy51cGRhdGUsIHRoaXMpO1xyXG5cclxuXHRcdHRoaXMuX2luaXRJY29uKCk7XHJcblx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cdFx0dGhpcy5maXJlKCdhZGQnKTtcclxuXHJcblx0XHRpZiAobWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBtYXAub3B0aW9ucy5tYXJrZXJab29tQW5pbWF0aW9uKSB7XHJcblx0XHRcdG1hcC5vbignem9vbWFuaW0nLCB0aGlzLl9hbmltYXRlWm9vbSwgdGhpcyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5hZGRMYXllcih0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHRpZiAodGhpcy5kcmFnZ2luZykge1xyXG5cdFx0XHR0aGlzLmRyYWdnaW5nLmRpc2FibGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9yZW1vdmVJY29uKCk7XHJcblx0XHR0aGlzLl9yZW1vdmVTaGFkb3coKTtcclxuXHJcblx0XHR0aGlzLmZpcmUoJ3JlbW92ZScpO1xyXG5cclxuXHRcdG1hcC5vZmYoe1xyXG5cdFx0XHQndmlld3Jlc2V0JzogdGhpcy51cGRhdGUsXHJcblx0XHRcdCd6b29tYW5pbSc6IHRoaXMuX2FuaW1hdGVab29tXHJcblx0XHR9LCB0aGlzKTtcclxuXHJcblx0XHR0aGlzLl9tYXAgPSBudWxsO1xyXG5cdH0sXHJcblxyXG5cdGdldExhdExuZzogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2xhdGxuZztcclxuXHR9LFxyXG5cclxuXHRzZXRMYXRMbmc6IGZ1bmN0aW9uIChsYXRsbmcpIHtcclxuXHRcdHRoaXMuX2xhdGxuZyA9IEwubGF0TG5nKGxhdGxuZyk7XHJcblxyXG5cdFx0dGhpcy51cGRhdGUoKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy5maXJlKCdtb3ZlJywgeyBsYXRsbmc6IHRoaXMuX2xhdGxuZyB9KTtcclxuXHR9LFxyXG5cclxuXHRzZXRaSW5kZXhPZmZzZXQ6IGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuXHRcdHRoaXMub3B0aW9ucy56SW5kZXhPZmZzZXQgPSBvZmZzZXQ7XHJcblx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldEljb246IGZ1bmN0aW9uIChpY29uKSB7XHJcblxyXG5cdFx0dGhpcy5vcHRpb25zLmljb24gPSBpY29uO1xyXG5cclxuXHRcdGlmICh0aGlzLl9tYXApIHtcclxuXHRcdFx0dGhpcy5faW5pdEljb24oKTtcclxuXHRcdFx0dGhpcy51cGRhdGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodGhpcy5fcG9wdXApIHtcclxuXHRcdFx0dGhpcy5iaW5kUG9wdXAodGhpcy5fcG9wdXApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX2ljb24pIHtcclxuXHRcdFx0dmFyIHBvcyA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5fbGF0bG5nKS5yb3VuZCgpO1xyXG5cdFx0XHR0aGlzLl9zZXRQb3MocG9zKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRfaW5pdEljb246IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxyXG5cdFx0ICAgIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdCAgICBhbmltYXRpb24gPSAobWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBtYXAub3B0aW9ucy5tYXJrZXJab29tQW5pbWF0aW9uKSxcclxuXHRcdCAgICBjbGFzc1RvQWRkID0gYW5pbWF0aW9uID8gJ2xlYWZsZXQtem9vbS1hbmltYXRlZCcgOiAnbGVhZmxldC16b29tLWhpZGUnO1xyXG5cclxuXHRcdHZhciBpY29uID0gb3B0aW9ucy5pY29uLmNyZWF0ZUljb24odGhpcy5faWNvbiksXHJcblx0XHRcdGFkZEljb24gPSBmYWxzZTtcclxuXHJcblx0XHQvLyBpZiB3ZSdyZSBub3QgcmV1c2luZyB0aGUgaWNvbiwgcmVtb3ZlIHRoZSBvbGQgb25lIGFuZCBpbml0IG5ldyBvbmVcclxuXHRcdGlmIChpY29uICE9PSB0aGlzLl9pY29uKSB7XHJcblx0XHRcdGlmICh0aGlzLl9pY29uKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVtb3ZlSWNvbigpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZEljb24gPSB0cnVlO1xyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMudGl0bGUpIHtcclxuXHRcdFx0XHRpY29uLnRpdGxlID0gb3B0aW9ucy50aXRsZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKG9wdGlvbnMuYWx0KSB7XHJcblx0XHRcdFx0aWNvbi5hbHQgPSBvcHRpb25zLmFsdDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhpY29uLCBjbGFzc1RvQWRkKTtcclxuXHJcblx0XHRpZiAob3B0aW9ucy5rZXlib2FyZCkge1xyXG5cdFx0XHRpY29uLnRhYkluZGV4ID0gJzAnO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2ljb24gPSBpY29uO1xyXG5cclxuXHRcdHRoaXMuX2luaXRJbnRlcmFjdGlvbigpO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLnJpc2VPbkhvdmVyKSB7XHJcblx0XHRcdEwuRG9tRXZlbnRcclxuXHRcdFx0XHQub24oaWNvbiwgJ21vdXNlb3ZlcicsIHRoaXMuX2JyaW5nVG9Gcm9udCwgdGhpcylcclxuXHRcdFx0XHQub24oaWNvbiwgJ21vdXNlb3V0JywgdGhpcy5fcmVzZXRaSW5kZXgsIHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBuZXdTaGFkb3cgPSBvcHRpb25zLmljb24uY3JlYXRlU2hhZG93KHRoaXMuX3NoYWRvdyksXHJcblx0XHRcdGFkZFNoYWRvdyA9IGZhbHNlO1xyXG5cclxuXHRcdGlmIChuZXdTaGFkb3cgIT09IHRoaXMuX3NoYWRvdykge1xyXG5cdFx0XHR0aGlzLl9yZW1vdmVTaGFkb3coKTtcclxuXHRcdFx0YWRkU2hhZG93ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobmV3U2hhZG93KSB7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhuZXdTaGFkb3csIGNsYXNzVG9BZGQpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5fc2hhZG93ID0gbmV3U2hhZG93O1xyXG5cclxuXHJcblx0XHRpZiAob3B0aW9ucy5vcGFjaXR5IDwgMSkge1xyXG5cdFx0XHR0aGlzLl91cGRhdGVPcGFjaXR5KCk7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdHZhciBwYW5lcyA9IHRoaXMuX21hcC5fcGFuZXM7XHJcblxyXG5cdFx0aWYgKGFkZEljb24pIHtcclxuXHRcdFx0cGFuZXMubWFya2VyUGFuZS5hcHBlbmRDaGlsZCh0aGlzLl9pY29uKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobmV3U2hhZG93ICYmIGFkZFNoYWRvdykge1xyXG5cdFx0XHRwYW5lcy5zaGFkb3dQYW5lLmFwcGVuZENoaWxkKHRoaXMuX3NoYWRvdyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X3JlbW92ZUljb246IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMucmlzZU9uSG92ZXIpIHtcclxuXHRcdFx0TC5Eb21FdmVudFxyXG5cdFx0XHQgICAgLm9mZih0aGlzLl9pY29uLCAnbW91c2VvdmVyJywgdGhpcy5fYnJpbmdUb0Zyb250KVxyXG5cdFx0XHQgICAgLm9mZih0aGlzLl9pY29uLCAnbW91c2VvdXQnLCB0aGlzLl9yZXNldFpJbmRleCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fbWFwLl9wYW5lcy5tYXJrZXJQYW5lLnJlbW92ZUNoaWxkKHRoaXMuX2ljb24pO1xyXG5cclxuXHRcdHRoaXMuX2ljb24gPSBudWxsO1xyXG5cdH0sXHJcblxyXG5cdF9yZW1vdmVTaGFkb3c6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9zaGFkb3cpIHtcclxuXHRcdFx0dGhpcy5fbWFwLl9wYW5lcy5zaGFkb3dQYW5lLnJlbW92ZUNoaWxkKHRoaXMuX3NoYWRvdyk7XHJcblx0XHR9XHJcblx0XHR0aGlzLl9zaGFkb3cgPSBudWxsO1xyXG5cdH0sXHJcblxyXG5cdF9zZXRQb3M6IGZ1bmN0aW9uIChwb3MpIHtcclxuXHRcdEwuRG9tVXRpbC5zZXRQb3NpdGlvbih0aGlzLl9pY29uLCBwb3MpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9zaGFkb3cpIHtcclxuXHRcdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX3NoYWRvdywgcG9zKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl96SW5kZXggPSBwb3MueSArIHRoaXMub3B0aW9ucy56SW5kZXhPZmZzZXQ7XHJcblxyXG5cdFx0dGhpcy5fcmVzZXRaSW5kZXgoKTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlWkluZGV4OiBmdW5jdGlvbiAob2Zmc2V0KSB7XHJcblx0XHR0aGlzLl9pY29uLnN0eWxlLnpJbmRleCA9IHRoaXMuX3pJbmRleCArIG9mZnNldDtcclxuXHR9LFxyXG5cclxuXHRfYW5pbWF0ZVpvb206IGZ1bmN0aW9uIChvcHQpIHtcclxuXHRcdHZhciBwb3MgPSB0aGlzLl9tYXAuX2xhdExuZ1RvTmV3TGF5ZXJQb2ludCh0aGlzLl9sYXRsbmcsIG9wdC56b29tLCBvcHQuY2VudGVyKS5yb3VuZCgpO1xyXG5cclxuXHRcdHRoaXMuX3NldFBvcyhwb3MpO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0SW50ZXJhY3Rpb246IGZ1bmN0aW9uICgpIHtcclxuXHJcblx0XHRpZiAoIXRoaXMub3B0aW9ucy5jbGlja2FibGUpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0Ly8gVE9ETyByZWZhY3RvciBpbnRvIHNvbWV0aGluZyBzaGFyZWQgd2l0aCBNYXAvUGF0aC9ldGMuIHRvIERSWSBpdCB1cFxyXG5cclxuXHRcdHZhciBpY29uID0gdGhpcy5faWNvbixcclxuXHRcdCAgICBldmVudHMgPSBbJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZW92ZXInLCAnbW91c2VvdXQnLCAnY29udGV4dG1lbnUnXTtcclxuXHJcblx0XHRMLkRvbVV0aWwuYWRkQ2xhc3MoaWNvbiwgJ2xlYWZsZXQtY2xpY2thYmxlJyk7XHJcblx0XHRMLkRvbUV2ZW50Lm9uKGljb24sICdjbGljaycsIHRoaXMuX29uTW91c2VDbGljaywgdGhpcyk7XHJcblx0XHRMLkRvbUV2ZW50Lm9uKGljb24sICdrZXlwcmVzcycsIHRoaXMuX29uS2V5UHJlc3MsIHRoaXMpO1xyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdEwuRG9tRXZlbnQub24oaWNvbiwgZXZlbnRzW2ldLCB0aGlzLl9maXJlTW91c2VFdmVudCwgdGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKEwuSGFuZGxlci5NYXJrZXJEcmFnKSB7XHJcblx0XHRcdHRoaXMuZHJhZ2dpbmcgPSBuZXcgTC5IYW5kbGVyLk1hcmtlckRyYWcodGhpcyk7XHJcblxyXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLmRyYWdnYWJsZSkge1xyXG5cdFx0XHRcdHRoaXMuZHJhZ2dpbmcuZW5hYmxlKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfb25Nb3VzZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0dmFyIHdhc0RyYWdnZWQgPSB0aGlzLmRyYWdnaW5nICYmIHRoaXMuZHJhZ2dpbmcubW92ZWQoKTtcclxuXHJcblx0XHRpZiAodGhpcy5oYXNFdmVudExpc3RlbmVycyhlLnR5cGUpIHx8IHdhc0RyYWdnZWQpIHtcclxuXHRcdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHdhc0RyYWdnZWQpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0aWYgKCghdGhpcy5kcmFnZ2luZyB8fCAhdGhpcy5kcmFnZ2luZy5fZW5hYmxlZCkgJiYgdGhpcy5fbWFwLmRyYWdnaW5nICYmIHRoaXMuX21hcC5kcmFnZ2luZy5tb3ZlZCgpKSB7IHJldHVybjsgfVxyXG5cclxuXHRcdHRoaXMuZmlyZShlLnR5cGUsIHtcclxuXHRcdFx0b3JpZ2luYWxFdmVudDogZSxcclxuXHRcdFx0bGF0bG5nOiB0aGlzLl9sYXRsbmdcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdF9vbktleVByZXNzOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcclxuXHRcdFx0dGhpcy5maXJlKCdjbGljaycsIHtcclxuXHRcdFx0XHRvcmlnaW5hbEV2ZW50OiBlLFxyXG5cdFx0XHRcdGxhdGxuZzogdGhpcy5fbGF0bG5nXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9maXJlTW91c2VFdmVudDogZnVuY3Rpb24gKGUpIHtcclxuXHJcblx0XHR0aGlzLmZpcmUoZS50eXBlLCB7XHJcblx0XHRcdG9yaWdpbmFsRXZlbnQ6IGUsXHJcblx0XHRcdGxhdGxuZzogdGhpcy5fbGF0bG5nXHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBUT0RPIHByb3BlciBjdXN0b20gZXZlbnQgcHJvcGFnYXRpb25cclxuXHRcdC8vIHRoaXMgbGluZSB3aWxsIGFsd2F5cyBiZSBjYWxsZWQgaWYgbWFya2VyIGlzIGluIGEgRmVhdHVyZUdyb3VwXHJcblx0XHRpZiAoZS50eXBlID09PSAnY29udGV4dG1lbnUnICYmIHRoaXMuaGFzRXZlbnRMaXN0ZW5lcnMoZS50eXBlKSkge1xyXG5cdFx0XHRMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGUudHlwZSAhPT0gJ21vdXNlZG93bicpIHtcclxuXHRcdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdHNldE9wYWNpdHk6IGZ1bmN0aW9uIChvcGFjaXR5KSB7XHJcblx0XHR0aGlzLm9wdGlvbnMub3BhY2l0eSA9IG9wYWNpdHk7XHJcblx0XHRpZiAodGhpcy5fbWFwKSB7XHJcblx0XHRcdHRoaXMuX3VwZGF0ZU9wYWNpdHkoKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlT3BhY2l0eTogZnVuY3Rpb24gKCkge1xyXG5cdFx0TC5Eb21VdGlsLnNldE9wYWNpdHkodGhpcy5faWNvbiwgdGhpcy5vcHRpb25zLm9wYWNpdHkpO1xyXG5cdFx0aWYgKHRoaXMuX3NoYWRvdykge1xyXG5cdFx0XHRMLkRvbVV0aWwuc2V0T3BhY2l0eSh0aGlzLl9zaGFkb3csIHRoaXMub3B0aW9ucy5vcGFjaXR5KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfYnJpbmdUb0Zyb250OiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl91cGRhdGVaSW5kZXgodGhpcy5vcHRpb25zLnJpc2VPZmZzZXQpO1xyXG5cdH0sXHJcblxyXG5cdF9yZXNldFpJbmRleDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhpcy5fdXBkYXRlWkluZGV4KDApO1xyXG5cdH1cclxufSk7XHJcblxyXG5MLm1hcmtlciA9IGZ1bmN0aW9uIChsYXRsbmcsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuTWFya2VyKGxhdGxuZywgb3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxuICogTC5EaXZJY29uIGlzIGEgbGlnaHR3ZWlnaHQgSFRNTC1iYXNlZCBpY29uIGNsYXNzIChhcyBvcHBvc2VkIHRvIHRoZSBpbWFnZS1iYXNlZCBMLkljb24pXG4gKiB0byB1c2Ugd2l0aCBMLk1hcmtlci5cbiAqL1xuXG5MLkRpdkljb24gPSBMLkljb24uZXh0ZW5kKHtcblx0b3B0aW9uczoge1xuXHRcdGljb25TaXplOiBbMTIsIDEyXSwgLy8gYWxzbyBjYW4gYmUgc2V0IHRocm91Z2ggQ1NTXG5cdFx0Lypcblx0XHRpY29uQW5jaG9yOiAoUG9pbnQpXG5cdFx0cG9wdXBBbmNob3I6IChQb2ludClcblx0XHRodG1sOiAoU3RyaW5nKVxuXHRcdGJnUG9zOiAoUG9pbnQpXG5cdFx0Ki9cblx0XHRjbGFzc05hbWU6ICdsZWFmbGV0LWRpdi1pY29uJyxcblx0XHRodG1sOiBmYWxzZVxuXHR9LFxuXG5cdGNyZWF0ZUljb246IGZ1bmN0aW9uIChvbGRJY29uKSB7XG5cdFx0dmFyIGRpdiA9IChvbGRJY29uICYmIG9sZEljb24udGFnTmFtZSA9PT0gJ0RJVicpID8gb2xkSWNvbiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdCAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG5cdFx0aWYgKG9wdGlvbnMuaHRtbCAhPT0gZmFsc2UpIHtcblx0XHRcdGRpdi5pbm5lckhUTUwgPSBvcHRpb25zLmh0bWw7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRpdi5pbm5lckhUTUwgPSAnJztcblx0XHR9XG5cblx0XHRpZiAob3B0aW9ucy5iZ1Bvcykge1xuXHRcdFx0ZGl2LnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9XG5cdFx0XHQgICAgICAgICgtb3B0aW9ucy5iZ1Bvcy54KSArICdweCAnICsgKC1vcHRpb25zLmJnUG9zLnkpICsgJ3B4Jztcblx0XHR9XG5cblx0XHR0aGlzLl9zZXRJY29uU3R5bGVzKGRpdiwgJ2ljb24nKTtcblx0XHRyZXR1cm4gZGl2O1xuXHR9LFxuXG5cdGNyZWF0ZVNoYWRvdzogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG59KTtcblxuTC5kaXZJY29uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0cmV0dXJuIG5ldyBMLkRpdkljb24ob3B0aW9ucyk7XG59O1xuXG5cbi8qXHJcbiAqIEwuUG9wdXAgaXMgdXNlZCBmb3IgZGlzcGxheWluZyBwb3B1cHMgb24gdGhlIG1hcC5cclxuICovXHJcblxyXG5MLk1hcC5tZXJnZU9wdGlvbnMoe1xyXG5cdGNsb3NlUG9wdXBPbkNsaWNrOiB0cnVlXHJcbn0pO1xyXG5cclxuTC5Qb3B1cCA9IEwuQ2xhc3MuZXh0ZW5kKHtcclxuXHRpbmNsdWRlczogTC5NaXhpbi5FdmVudHMsXHJcblxyXG5cdG9wdGlvbnM6IHtcclxuXHRcdG1pbldpZHRoOiA1MCxcclxuXHRcdG1heFdpZHRoOiAzMDAsXHJcblx0XHQvLyBtYXhIZWlnaHQ6IG51bGwsXHJcblx0XHRhdXRvUGFuOiB0cnVlLFxyXG5cdFx0Y2xvc2VCdXR0b246IHRydWUsXHJcblx0XHRvZmZzZXQ6IFswLCA3XSxcclxuXHRcdGF1dG9QYW5QYWRkaW5nOiBbNSwgNV0sXHJcblx0XHQvLyBhdXRvUGFuUGFkZGluZ1RvcExlZnQ6IG51bGwsXHJcblx0XHQvLyBhdXRvUGFuUGFkZGluZ0JvdHRvbVJpZ2h0OiBudWxsLFxyXG5cdFx0a2VlcEluVmlldzogZmFsc2UsXHJcblx0XHRjbGFzc05hbWU6ICcnLFxyXG5cdFx0em9vbUFuaW1hdGlvbjogdHJ1ZVxyXG5cdH0sXHJcblxyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zLCBzb3VyY2UpIHtcclxuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcblx0XHR0aGlzLl9zb3VyY2UgPSBzb3VyY2U7XHJcblx0XHR0aGlzLl9hbmltYXRlZCA9IEwuQnJvd3Nlci5hbnkzZCAmJiB0aGlzLm9wdGlvbnMuem9vbUFuaW1hdGlvbjtcclxuXHRcdHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xyXG5cdH0sXHJcblxyXG5cdG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHR0aGlzLl9tYXAgPSBtYXA7XHJcblxyXG5cdFx0aWYgKCF0aGlzLl9jb250YWluZXIpIHtcclxuXHRcdFx0dGhpcy5faW5pdExheW91dCgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBhbmltRmFkZSA9IG1hcC5vcHRpb25zLmZhZGVBbmltYXRpb247XHJcblxyXG5cdFx0aWYgKGFuaW1GYWRlKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5zZXRPcGFjaXR5KHRoaXMuX2NvbnRhaW5lciwgMCk7XHJcblx0XHR9XHJcblx0XHRtYXAuX3BhbmVzLnBvcHVwUGFuZS5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xyXG5cclxuXHRcdG1hcC5vbih0aGlzLl9nZXRFdmVudHMoKSwgdGhpcyk7XHJcblxyXG5cdFx0dGhpcy51cGRhdGUoKTtcclxuXHJcblx0XHRpZiAoYW5pbUZhZGUpIHtcclxuXHRcdFx0TC5Eb21VdGlsLnNldE9wYWNpdHkodGhpcy5fY29udGFpbmVyLCAxKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ29wZW4nKTtcclxuXHJcblx0XHRtYXAuZmlyZSgncG9wdXBvcGVuJywge3BvcHVwOiB0aGlzfSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX3NvdXJjZSkge1xyXG5cdFx0XHR0aGlzLl9zb3VyY2UuZmlyZSgncG9wdXBvcGVuJywge3BvcHVwOiB0aGlzfSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5hZGRMYXllcih0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9wZW5PbjogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0bWFwLm9wZW5Qb3B1cCh0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHRtYXAuX3BhbmVzLnBvcHVwUGFuZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xyXG5cclxuXHRcdEwuVXRpbC5mYWxzZUZuKHRoaXMuX2NvbnRhaW5lci5vZmZzZXRXaWR0aCk7IC8vIGZvcmNlIHJlZmxvd1xyXG5cclxuXHRcdG1hcC5vZmYodGhpcy5fZ2V0RXZlbnRzKCksIHRoaXMpO1xyXG5cclxuXHRcdGlmIChtYXAub3B0aW9ucy5mYWRlQW5pbWF0aW9uKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5zZXRPcGFjaXR5KHRoaXMuX2NvbnRhaW5lciwgMCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fbWFwID0gbnVsbDtcclxuXHJcblx0XHR0aGlzLmZpcmUoJ2Nsb3NlJyk7XHJcblxyXG5cdFx0bWFwLmZpcmUoJ3BvcHVwY2xvc2UnLCB7cG9wdXA6IHRoaXN9KTtcclxuXHJcblx0XHRpZiAodGhpcy5fc291cmNlKSB7XHJcblx0XHRcdHRoaXMuX3NvdXJjZS5maXJlKCdwb3B1cGNsb3NlJywge3BvcHVwOiB0aGlzfSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Z2V0TGF0TG5nOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbGF0bG5nO1xyXG5cdH0sXHJcblxyXG5cdHNldExhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cdFx0dGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcclxuXHRcdGlmICh0aGlzLl9tYXApIHtcclxuXHRcdFx0dGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcclxuXHRcdFx0dGhpcy5fYWRqdXN0UGFuKCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRnZXRDb250ZW50OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY29udGVudDtcclxuXHR9LFxyXG5cclxuXHRzZXRDb250ZW50OiBmdW5jdGlvbiAoY29udGVudCkge1xyXG5cdFx0dGhpcy5fY29udGVudCA9IGNvbnRlbnQ7XHJcblx0XHR0aGlzLnVwZGF0ZSgpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0dXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX21hcCkgeyByZXR1cm47IH1cclxuXHJcblx0XHR0aGlzLl9jb250YWluZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xyXG5cclxuXHRcdHRoaXMuX3VwZGF0ZUNvbnRlbnQoKTtcclxuXHRcdHRoaXMuX3VwZGF0ZUxheW91dCgpO1xyXG5cdFx0dGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcclxuXHJcblx0XHR0aGlzLl9jb250YWluZXIuc3R5bGUudmlzaWJpbGl0eSA9ICcnO1xyXG5cclxuXHRcdHRoaXMuX2FkanVzdFBhbigpO1xyXG5cdH0sXHJcblxyXG5cdF9nZXRFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBldmVudHMgPSB7XHJcblx0XHRcdHZpZXdyZXNldDogdGhpcy5fdXBkYXRlUG9zaXRpb25cclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKHRoaXMuX2FuaW1hdGVkKSB7XHJcblx0XHRcdGV2ZW50cy56b29tYW5pbSA9IHRoaXMuX3pvb21BbmltYXRpb247XHJcblx0XHR9XHJcblx0XHRpZiAoJ2Nsb3NlT25DbGljaycgaW4gdGhpcy5vcHRpb25zID8gdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA6IHRoaXMuX21hcC5vcHRpb25zLmNsb3NlUG9wdXBPbkNsaWNrKSB7XHJcblx0XHRcdGV2ZW50cy5wcmVjbGljayA9IHRoaXMuX2Nsb3NlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5rZWVwSW5WaWV3KSB7XHJcblx0XHRcdGV2ZW50cy5tb3ZlZW5kID0gdGhpcy5fYWRqdXN0UGFuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBldmVudHM7XHJcblx0fSxcclxuXHJcblx0X2Nsb3NlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5fbWFwKSB7XHJcblx0XHRcdHRoaXMuX21hcC5jbG9zZVBvcHVwKHRoaXMpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9pbml0TGF5b3V0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgcHJlZml4ID0gJ2xlYWZsZXQtcG9wdXAnLFxyXG5cdFx0XHRjb250YWluZXJDbGFzcyA9IHByZWZpeCArICcgJyArIHRoaXMub3B0aW9ucy5jbGFzc05hbWUgKyAnIGxlYWZsZXQtem9vbS0nICtcclxuXHRcdFx0ICAgICAgICAodGhpcy5fYW5pbWF0ZWQgPyAnYW5pbWF0ZWQnIDogJ2hpZGUnKSxcclxuXHRcdFx0Y29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY29udGFpbmVyQ2xhc3MpLFxyXG5cdFx0XHRjbG9zZUJ1dHRvbjtcclxuXHJcblx0XHRpZiAodGhpcy5vcHRpb25zLmNsb3NlQnV0dG9uKSB7XHJcblx0XHRcdGNsb3NlQnV0dG9uID0gdGhpcy5fY2xvc2VCdXR0b24gPVxyXG5cdFx0XHQgICAgICAgIEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCBwcmVmaXggKyAnLWNsb3NlLWJ1dHRvbicsIGNvbnRhaW5lcik7XHJcblx0XHRcdGNsb3NlQnV0dG9uLmhyZWYgPSAnI2Nsb3NlJztcclxuXHRcdFx0Y2xvc2VCdXR0b24uaW5uZXJIVE1MID0gJyYjMjE1Oyc7XHJcblx0XHRcdEwuRG9tRXZlbnQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24oY2xvc2VCdXR0b24pO1xyXG5cclxuXHRcdFx0TC5Eb21FdmVudC5vbihjbG9zZUJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5fb25DbG9zZUJ1dHRvbkNsaWNrLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgd3JhcHBlciA9IHRoaXMuX3dyYXBwZXIgPVxyXG5cdFx0ICAgICAgICBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBwcmVmaXggKyAnLWNvbnRlbnQtd3JhcHBlcicsIGNvbnRhaW5lcik7XHJcblx0XHRMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKHdyYXBwZXIpO1xyXG5cclxuXHRcdHRoaXMuX2NvbnRlbnROb2RlID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgcHJlZml4ICsgJy1jb250ZW50Jywgd3JhcHBlcik7XHJcblxyXG5cdFx0TC5Eb21FdmVudC5kaXNhYmxlU2Nyb2xsUHJvcGFnYXRpb24odGhpcy5fY29udGVudE5vZGUpO1xyXG5cdFx0TC5Eb21FdmVudC5vbih3cmFwcGVyLCAnY29udGV4dG1lbnUnLCBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbik7XHJcblxyXG5cdFx0dGhpcy5fdGlwQ29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgcHJlZml4ICsgJy10aXAtY29udGFpbmVyJywgY29udGFpbmVyKTtcclxuXHRcdHRoaXMuX3RpcCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsIHByZWZpeCArICctdGlwJywgdGhpcy5fdGlwQ29udGFpbmVyKTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlQ29udGVudDogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGlzLl9jb250ZW50KSB7IHJldHVybjsgfVxyXG5cclxuXHRcdGlmICh0eXBlb2YgdGhpcy5fY29udGVudCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0dGhpcy5fY29udGVudE5vZGUuaW5uZXJIVE1MID0gdGhpcy5fY29udGVudDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHdoaWxlICh0aGlzLl9jb250ZW50Tm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250ZW50Tm9kZS5maXJzdENoaWxkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLl9jb250ZW50Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLl9jb250ZW50KTtcclxuXHRcdH1cclxuXHRcdHRoaXMuZmlyZSgnY29udGVudHVwZGF0ZScpO1xyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVMYXlvdXQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBjb250YWluZXIgPSB0aGlzLl9jb250ZW50Tm9kZSxcclxuXHRcdCAgICBzdHlsZSA9IGNvbnRhaW5lci5zdHlsZTtcclxuXHJcblx0XHRzdHlsZS53aWR0aCA9ICcnO1xyXG5cdFx0c3R5bGUud2hpdGVTcGFjZSA9ICdub3dyYXAnO1xyXG5cclxuXHRcdHZhciB3aWR0aCA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuXHRcdHdpZHRoID0gTWF0aC5taW4od2lkdGgsIHRoaXMub3B0aW9ucy5tYXhXaWR0aCk7XHJcblx0XHR3aWR0aCA9IE1hdGgubWF4KHdpZHRoLCB0aGlzLm9wdGlvbnMubWluV2lkdGgpO1xyXG5cclxuXHRcdHN0eWxlLndpZHRoID0gKHdpZHRoICsgMSkgKyAncHgnO1xyXG5cdFx0c3R5bGUud2hpdGVTcGFjZSA9ICcnO1xyXG5cclxuXHRcdHN0eWxlLmhlaWdodCA9ICcnO1xyXG5cclxuXHRcdHZhciBoZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0LFxyXG5cdFx0ICAgIG1heEhlaWdodCA9IHRoaXMub3B0aW9ucy5tYXhIZWlnaHQsXHJcblx0XHQgICAgc2Nyb2xsZWRDbGFzcyA9ICdsZWFmbGV0LXBvcHVwLXNjcm9sbGVkJztcclxuXHJcblx0XHRpZiAobWF4SGVpZ2h0ICYmIGhlaWdodCA+IG1heEhlaWdodCkge1xyXG5cdFx0XHRzdHlsZS5oZWlnaHQgPSBtYXhIZWlnaHQgKyAncHgnO1xyXG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3MoY29udGFpbmVyLCBzY3JvbGxlZENsYXNzKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdEwuRG9tVXRpbC5yZW1vdmVDbGFzcyhjb250YWluZXIsIHNjcm9sbGVkQ2xhc3MpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2NvbnRhaW5lcldpZHRoID0gdGhpcy5fY29udGFpbmVyLm9mZnNldFdpZHRoO1xyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGlzLl9tYXApIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIHBvcyA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5fbGF0bG5nKSxcclxuXHRcdCAgICBhbmltYXRlZCA9IHRoaXMuX2FuaW1hdGVkLFxyXG5cdFx0ICAgIG9mZnNldCA9IEwucG9pbnQodGhpcy5vcHRpb25zLm9mZnNldCk7XHJcblxyXG5cdFx0aWYgKGFuaW1hdGVkKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5zZXRQb3NpdGlvbih0aGlzLl9jb250YWluZXIsIHBvcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fY29udGFpbmVyQm90dG9tID0gLW9mZnNldC55IC0gKGFuaW1hdGVkID8gMCA6IHBvcy55KTtcclxuXHRcdHRoaXMuX2NvbnRhaW5lckxlZnQgPSAtTWF0aC5yb3VuZCh0aGlzLl9jb250YWluZXJXaWR0aCAvIDIpICsgb2Zmc2V0LnggKyAoYW5pbWF0ZWQgPyAwIDogcG9zLngpO1xyXG5cclxuXHRcdC8vIGJvdHRvbSBwb3NpdGlvbiB0aGUgcG9wdXAgaW4gY2FzZSB0aGUgaGVpZ2h0IG9mIHRoZSBwb3B1cCBjaGFuZ2VzIChpbWFnZXMgbG9hZGluZyBldGMpXHJcblx0XHR0aGlzLl9jb250YWluZXIuc3R5bGUuYm90dG9tID0gdGhpcy5fY29udGFpbmVyQm90dG9tICsgJ3B4JztcclxuXHRcdHRoaXMuX2NvbnRhaW5lci5zdHlsZS5sZWZ0ID0gdGhpcy5fY29udGFpbmVyTGVmdCArICdweCc7XHJcblx0fSxcclxuXHJcblx0X3pvb21BbmltYXRpb246IGZ1bmN0aW9uIChvcHQpIHtcclxuXHRcdHZhciBwb3MgPSB0aGlzLl9tYXAuX2xhdExuZ1RvTmV3TGF5ZXJQb2ludCh0aGlzLl9sYXRsbmcsIG9wdC56b29tLCBvcHQuY2VudGVyKTtcclxuXHJcblx0XHRMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fY29udGFpbmVyLCBwb3MpO1xyXG5cdH0sXHJcblxyXG5cdF9hZGp1c3RQYW46IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhpcy5vcHRpb25zLmF1dG9QYW4pIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdCAgICBjb250YWluZXJIZWlnaHQgPSB0aGlzLl9jb250YWluZXIub2Zmc2V0SGVpZ2h0LFxyXG5cdFx0ICAgIGNvbnRhaW5lcldpZHRoID0gdGhpcy5fY29udGFpbmVyV2lkdGgsXHJcblxyXG5cdFx0ICAgIGxheWVyUG9zID0gbmV3IEwuUG9pbnQodGhpcy5fY29udGFpbmVyTGVmdCwgLWNvbnRhaW5lckhlaWdodCAtIHRoaXMuX2NvbnRhaW5lckJvdHRvbSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2FuaW1hdGVkKSB7XHJcblx0XHRcdGxheWVyUG9zLl9hZGQoTC5Eb21VdGlsLmdldFBvc2l0aW9uKHRoaXMuX2NvbnRhaW5lcikpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjb250YWluZXJQb3MgPSBtYXAubGF5ZXJQb2ludFRvQ29udGFpbmVyUG9pbnQobGF5ZXJQb3MpLFxyXG5cdFx0ICAgIHBhZGRpbmcgPSBMLnBvaW50KHRoaXMub3B0aW9ucy5hdXRvUGFuUGFkZGluZyksXHJcblx0XHQgICAgcGFkZGluZ1RMID0gTC5wb2ludCh0aGlzLm9wdGlvbnMuYXV0b1BhblBhZGRpbmdUb3BMZWZ0IHx8IHBhZGRpbmcpLFxyXG5cdFx0ICAgIHBhZGRpbmdCUiA9IEwucG9pbnQodGhpcy5vcHRpb25zLmF1dG9QYW5QYWRkaW5nQm90dG9tUmlnaHQgfHwgcGFkZGluZyksXHJcblx0XHQgICAgc2l6ZSA9IG1hcC5nZXRTaXplKCksXHJcblx0XHQgICAgZHggPSAwLFxyXG5cdFx0ICAgIGR5ID0gMDtcclxuXHJcblx0XHRpZiAoY29udGFpbmVyUG9zLnggKyBjb250YWluZXJXaWR0aCArIHBhZGRpbmdCUi54ID4gc2l6ZS54KSB7IC8vIHJpZ2h0XHJcblx0XHRcdGR4ID0gY29udGFpbmVyUG9zLnggKyBjb250YWluZXJXaWR0aCAtIHNpemUueCArIHBhZGRpbmdCUi54O1xyXG5cdFx0fVxyXG5cdFx0aWYgKGNvbnRhaW5lclBvcy54IC0gZHggLSBwYWRkaW5nVEwueCA8IDApIHsgLy8gbGVmdFxyXG5cdFx0XHRkeCA9IGNvbnRhaW5lclBvcy54IC0gcGFkZGluZ1RMLng7XHJcblx0XHR9XHJcblx0XHRpZiAoY29udGFpbmVyUG9zLnkgKyBjb250YWluZXJIZWlnaHQgKyBwYWRkaW5nQlIueSA+IHNpemUueSkgeyAvLyBib3R0b21cclxuXHRcdFx0ZHkgPSBjb250YWluZXJQb3MueSArIGNvbnRhaW5lckhlaWdodCAtIHNpemUueSArIHBhZGRpbmdCUi55O1xyXG5cdFx0fVxyXG5cdFx0aWYgKGNvbnRhaW5lclBvcy55IC0gZHkgLSBwYWRkaW5nVEwueSA8IDApIHsgLy8gdG9wXHJcblx0XHRcdGR5ID0gY29udGFpbmVyUG9zLnkgLSBwYWRkaW5nVEwueTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZHggfHwgZHkpIHtcclxuXHRcdFx0bWFwXHJcblx0XHRcdCAgICAuZmlyZSgnYXV0b3BhbnN0YXJ0JylcclxuXHRcdFx0ICAgIC5wYW5CeShbZHgsIGR5XSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X29uQ2xvc2VCdXR0b25DbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHRcdHRoaXMuX2Nsb3NlKCk7XHJcblx0XHRMLkRvbUV2ZW50LnN0b3AoZSk7XHJcblx0fVxyXG59KTtcclxuXHJcbkwucG9wdXAgPSBmdW5jdGlvbiAob3B0aW9ucywgc291cmNlKSB7XHJcblx0cmV0dXJuIG5ldyBMLlBvcHVwKG9wdGlvbnMsIHNvdXJjZSk7XHJcbn07XHJcblxyXG5cclxuTC5NYXAuaW5jbHVkZSh7XHJcblx0b3BlblBvcHVwOiBmdW5jdGlvbiAocG9wdXAsIGxhdGxuZywgb3B0aW9ucykgeyAvLyAoUG9wdXApIG9yIChTdHJpbmcgfHwgSFRNTEVsZW1lbnQsIExhdExuZ1ssIE9iamVjdF0pXHJcblx0XHR0aGlzLmNsb3NlUG9wdXAoKTtcclxuXHJcblx0XHRpZiAoIShwb3B1cCBpbnN0YW5jZW9mIEwuUG9wdXApKSB7XHJcblx0XHRcdHZhciBjb250ZW50ID0gcG9wdXA7XHJcblxyXG5cdFx0XHRwb3B1cCA9IG5ldyBMLlBvcHVwKG9wdGlvbnMpXHJcblx0XHRcdCAgICAuc2V0TGF0TG5nKGxhdGxuZylcclxuXHRcdFx0ICAgIC5zZXRDb250ZW50KGNvbnRlbnQpO1xyXG5cdFx0fVxyXG5cdFx0cG9wdXAuX2lzT3BlbiA9IHRydWU7XHJcblxyXG5cdFx0dGhpcy5fcG9wdXAgPSBwb3B1cDtcclxuXHRcdHJldHVybiB0aGlzLmFkZExheWVyKHBvcHVwKTtcclxuXHR9LFxyXG5cclxuXHRjbG9zZVBvcHVwOiBmdW5jdGlvbiAocG9wdXApIHtcclxuXHRcdGlmICghcG9wdXAgfHwgcG9wdXAgPT09IHRoaXMuX3BvcHVwKSB7XHJcblx0XHRcdHBvcHVwID0gdGhpcy5fcG9wdXA7XHJcblx0XHRcdHRoaXMuX3BvcHVwID0gbnVsbDtcclxuXHRcdH1cclxuXHRcdGlmIChwb3B1cCkge1xyXG5cdFx0XHR0aGlzLnJlbW92ZUxheWVyKHBvcHVwKTtcclxuXHRcdFx0cG9wdXAuX2lzT3BlbiA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG59KTtcclxuXG5cbi8qXHJcbiAqIFBvcHVwIGV4dGVuc2lvbiB0byBMLk1hcmtlciwgYWRkaW5nIHBvcHVwLXJlbGF0ZWQgbWV0aG9kcy5cclxuICovXHJcblxyXG5MLk1hcmtlci5pbmNsdWRlKHtcclxuXHRvcGVuUG9wdXA6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9wb3B1cCAmJiB0aGlzLl9tYXAgJiYgIXRoaXMuX21hcC5oYXNMYXllcih0aGlzLl9wb3B1cCkpIHtcclxuXHRcdFx0dGhpcy5fcG9wdXAuc2V0TGF0TG5nKHRoaXMuX2xhdGxuZyk7XHJcblx0XHRcdHRoaXMuX21hcC5vcGVuUG9wdXAodGhpcy5fcG9wdXApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGNsb3NlUG9wdXA6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9wb3B1cCkge1xyXG5cdFx0XHR0aGlzLl9wb3B1cC5fY2xvc2UoKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHRvZ2dsZVBvcHVwOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5fcG9wdXApIHtcclxuXHRcdFx0aWYgKHRoaXMuX3BvcHVwLl9pc09wZW4pIHtcclxuXHRcdFx0XHR0aGlzLmNsb3NlUG9wdXAoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLm9wZW5Qb3B1cCgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRiaW5kUG9wdXA6IGZ1bmN0aW9uIChjb250ZW50LCBvcHRpb25zKSB7XHJcblx0XHR2YXIgYW5jaG9yID0gTC5wb2ludCh0aGlzLm9wdGlvbnMuaWNvbi5vcHRpb25zLnBvcHVwQW5jaG9yIHx8IFswLCAwXSk7XHJcblxyXG5cdFx0YW5jaG9yID0gYW5jaG9yLmFkZChMLlBvcHVwLnByb3RvdHlwZS5vcHRpb25zLm9mZnNldCk7XHJcblxyXG5cdFx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5vZmZzZXQpIHtcclxuXHRcdFx0YW5jaG9yID0gYW5jaG9yLmFkZChvcHRpb25zLm9mZnNldCk7XHJcblx0XHR9XHJcblxyXG5cdFx0b3B0aW9ucyA9IEwuZXh0ZW5kKHtvZmZzZXQ6IGFuY2hvcn0sIG9wdGlvbnMpO1xyXG5cclxuXHRcdGlmICghdGhpcy5fcG9wdXBIYW5kbGVyc0FkZGVkKSB7XHJcblx0XHRcdHRoaXNcclxuXHRcdFx0ICAgIC5vbignY2xpY2snLCB0aGlzLnRvZ2dsZVBvcHVwLCB0aGlzKVxyXG5cdFx0XHQgICAgLm9uKCdyZW1vdmUnLCB0aGlzLmNsb3NlUG9wdXAsIHRoaXMpXHJcblx0XHRcdCAgICAub24oJ21vdmUnLCB0aGlzLl9tb3ZlUG9wdXAsIHRoaXMpO1xyXG5cdFx0XHR0aGlzLl9wb3B1cEhhbmRsZXJzQWRkZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjb250ZW50IGluc3RhbmNlb2YgTC5Qb3B1cCkge1xyXG5cdFx0XHRMLnNldE9wdGlvbnMoY29udGVudCwgb3B0aW9ucyk7XHJcblx0XHRcdHRoaXMuX3BvcHVwID0gY29udGVudDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX3BvcHVwID0gbmV3IEwuUG9wdXAob3B0aW9ucywgdGhpcylcclxuXHRcdFx0XHQuc2V0Q29udGVudChjb250ZW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRzZXRQb3B1cENvbnRlbnQ6IGZ1bmN0aW9uIChjb250ZW50KSB7XHJcblx0XHRpZiAodGhpcy5fcG9wdXApIHtcclxuXHRcdFx0dGhpcy5fcG9wdXAuc2V0Q29udGVudChjb250ZW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHVuYmluZFBvcHVwOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5fcG9wdXApIHtcclxuXHRcdFx0dGhpcy5fcG9wdXAgPSBudWxsO1xyXG5cdFx0XHR0aGlzXHJcblx0XHRcdCAgICAub2ZmKCdjbGljaycsIHRoaXMudG9nZ2xlUG9wdXAsIHRoaXMpXHJcblx0XHRcdCAgICAub2ZmKCdyZW1vdmUnLCB0aGlzLmNsb3NlUG9wdXAsIHRoaXMpXHJcblx0XHRcdCAgICAub2ZmKCdtb3ZlJywgdGhpcy5fbW92ZVBvcHVwLCB0aGlzKTtcclxuXHRcdFx0dGhpcy5fcG9wdXBIYW5kbGVyc0FkZGVkID0gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRnZXRQb3B1cDogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3BvcHVwO1xyXG5cdH0sXHJcblxyXG5cdF9tb3ZlUG9wdXA6IGZ1bmN0aW9uIChlKSB7XHJcblx0XHR0aGlzLl9wb3B1cC5zZXRMYXRMbmcoZS5sYXRsbmcpO1xyXG5cdH1cclxufSk7XHJcblxuXG4vKlxyXG4gKiBMLkxheWVyR3JvdXAgaXMgYSBjbGFzcyB0byBjb21iaW5lIHNldmVyYWwgbGF5ZXJzIGludG8gb25lIHNvIHRoYXRcclxuICogeW91IGNhbiBtYW5pcHVsYXRlIHRoZSBncm91cCAoZS5nLiBhZGQvcmVtb3ZlIGl0KSBhcyBvbmUgbGF5ZXIuXHJcbiAqL1xyXG5cclxuTC5MYXllckdyb3VwID0gTC5DbGFzcy5leHRlbmQoe1xyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXllcnMpIHtcclxuXHRcdHRoaXMuX2xheWVycyA9IHt9O1xyXG5cclxuXHRcdHZhciBpLCBsZW47XHJcblxyXG5cdFx0aWYgKGxheWVycykge1xyXG5cdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBsYXllcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLmFkZExheWVyKGxheWVyc1tpXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRhZGRMYXllcjogZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHR2YXIgaWQgPSB0aGlzLmdldExheWVySWQobGF5ZXIpO1xyXG5cclxuXHRcdHRoaXMuX2xheWVyc1tpZF0gPSBsYXllcjtcclxuXHJcblx0XHRpZiAodGhpcy5fbWFwKSB7XHJcblx0XHRcdHRoaXMuX21hcC5hZGRMYXllcihsYXllcik7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlTGF5ZXI6IGZ1bmN0aW9uIChsYXllcikge1xyXG5cdFx0dmFyIGlkID0gbGF5ZXIgaW4gdGhpcy5fbGF5ZXJzID8gbGF5ZXIgOiB0aGlzLmdldExheWVySWQobGF5ZXIpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9tYXAgJiYgdGhpcy5fbGF5ZXJzW2lkXSkge1xyXG5cdFx0XHR0aGlzLl9tYXAucmVtb3ZlTGF5ZXIodGhpcy5fbGF5ZXJzW2lkXSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZGVsZXRlIHRoaXMuX2xheWVyc1tpZF07XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0aGFzTGF5ZXI6IGZ1bmN0aW9uIChsYXllcikge1xyXG5cdFx0aWYgKCFsYXllcikgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcblx0XHRyZXR1cm4gKGxheWVyIGluIHRoaXMuX2xheWVycyB8fCB0aGlzLmdldExheWVySWQobGF5ZXIpIGluIHRoaXMuX2xheWVycyk7XHJcblx0fSxcclxuXHJcblx0Y2xlYXJMYXllcnM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuZWFjaExheWVyKHRoaXMucmVtb3ZlTGF5ZXIsIHRoaXMpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0aW52b2tlOiBmdW5jdGlvbiAobWV0aG9kTmFtZSkge1xyXG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxyXG5cdFx0ICAgIGksIGxheWVyO1xyXG5cclxuXHRcdGZvciAoaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuXHRcdFx0bGF5ZXIgPSB0aGlzLl9sYXllcnNbaV07XHJcblxyXG5cdFx0XHRpZiAobGF5ZXJbbWV0aG9kTmFtZV0pIHtcclxuXHRcdFx0XHRsYXllclttZXRob2ROYW1lXS5hcHBseShsYXllciwgYXJncyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0dGhpcy5fbWFwID0gbWFwO1xyXG5cdFx0dGhpcy5lYWNoTGF5ZXIobWFwLmFkZExheWVyLCBtYXApO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHR0aGlzLmVhY2hMYXllcihtYXAucmVtb3ZlTGF5ZXIsIG1hcCk7XHJcblx0XHR0aGlzLl9tYXAgPSBudWxsO1xyXG5cdH0sXHJcblxyXG5cdGFkZFRvOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHRtYXAuYWRkTGF5ZXIodGhpcyk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRlYWNoTGF5ZXI6IGZ1bmN0aW9uIChtZXRob2QsIGNvbnRleHQpIHtcclxuXHRcdGZvciAodmFyIGkgaW4gdGhpcy5fbGF5ZXJzKSB7XHJcblx0XHRcdG1ldGhvZC5jYWxsKGNvbnRleHQsIHRoaXMuX2xheWVyc1tpXSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRnZXRMYXllcjogZnVuY3Rpb24gKGlkKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbGF5ZXJzW2lkXTtcclxuXHR9LFxyXG5cclxuXHRnZXRMYXllcnM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBsYXllcnMgPSBbXTtcclxuXHJcblx0XHRmb3IgKHZhciBpIGluIHRoaXMuX2xheWVycykge1xyXG5cdFx0XHRsYXllcnMucHVzaCh0aGlzLl9sYXllcnNbaV0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGxheWVycztcclxuXHR9LFxyXG5cclxuXHRzZXRaSW5kZXg6IGZ1bmN0aW9uICh6SW5kZXgpIHtcclxuXHRcdHJldHVybiB0aGlzLmludm9rZSgnc2V0WkluZGV4JywgekluZGV4KTtcclxuXHR9LFxyXG5cclxuXHRnZXRMYXllcklkOiBmdW5jdGlvbiAobGF5ZXIpIHtcclxuXHRcdHJldHVybiBMLnN0YW1wKGxheWVyKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5sYXllckdyb3VwID0gZnVuY3Rpb24gKGxheWVycykge1xyXG5cdHJldHVybiBuZXcgTC5MYXllckdyb3VwKGxheWVycyk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBMLkZlYXR1cmVHcm91cCBleHRlbmRzIEwuTGF5ZXJHcm91cCBieSBpbnRyb2R1Y2luZyBtb3VzZSBldmVudHMgYW5kIGFkZGl0aW9uYWwgbWV0aG9kc1xyXG4gKiBzaGFyZWQgYmV0d2VlbiBhIGdyb3VwIG9mIGludGVyYWN0aXZlIGxheWVycyAobGlrZSB2ZWN0b3JzIG9yIG1hcmtlcnMpLlxyXG4gKi9cclxuXHJcbkwuRmVhdHVyZUdyb3VwID0gTC5MYXllckdyb3VwLmV4dGVuZCh7XHJcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxyXG5cclxuXHRzdGF0aWNzOiB7XHJcblx0XHRFVkVOVFM6ICdjbGljayBkYmxjbGljayBtb3VzZW92ZXIgbW91c2VvdXQgbW91c2Vtb3ZlIGNvbnRleHRtZW51IHBvcHVwb3BlbiBwb3B1cGNsb3NlJ1xyXG5cdH0sXHJcblxyXG5cdGFkZExheWVyOiBmdW5jdGlvbiAobGF5ZXIpIHtcclxuXHRcdGlmICh0aGlzLmhhc0xheWVyKGxheWVyKSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoJ29uJyBpbiBsYXllcikge1xyXG5cdFx0XHRsYXllci5vbihMLkZlYXR1cmVHcm91cC5FVkVOVFMsIHRoaXMuX3Byb3BhZ2F0ZUV2ZW50LCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRMLkxheWVyR3JvdXAucHJvdG90eXBlLmFkZExheWVyLmNhbGwodGhpcywgbGF5ZXIpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9wb3B1cENvbnRlbnQgJiYgbGF5ZXIuYmluZFBvcHVwKSB7XHJcblx0XHRcdGxheWVyLmJpbmRQb3B1cCh0aGlzLl9wb3B1cENvbnRlbnQsIHRoaXMuX3BvcHVwT3B0aW9ucyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXMuZmlyZSgnbGF5ZXJhZGQnLCB7bGF5ZXI6IGxheWVyfSk7XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlTGF5ZXI6IGZ1bmN0aW9uIChsYXllcikge1xyXG5cdFx0aWYgKCF0aGlzLmhhc0xheWVyKGxheWVyKSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHRcdGlmIChsYXllciBpbiB0aGlzLl9sYXllcnMpIHtcclxuXHRcdFx0bGF5ZXIgPSB0aGlzLl9sYXllcnNbbGF5ZXJdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxheWVyLm9mZihMLkZlYXR1cmVHcm91cC5FVkVOVFMsIHRoaXMuX3Byb3BhZ2F0ZUV2ZW50LCB0aGlzKTtcclxuXHJcblx0XHRMLkxheWVyR3JvdXAucHJvdG90eXBlLnJlbW92ZUxheWVyLmNhbGwodGhpcywgbGF5ZXIpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9wb3B1cENvbnRlbnQpIHtcclxuXHRcdFx0dGhpcy5pbnZva2UoJ3VuYmluZFBvcHVwJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXMuZmlyZSgnbGF5ZXJyZW1vdmUnLCB7bGF5ZXI6IGxheWVyfSk7XHJcblx0fSxcclxuXHJcblx0YmluZFBvcHVwOiBmdW5jdGlvbiAoY29udGVudCwgb3B0aW9ucykge1xyXG5cdFx0dGhpcy5fcG9wdXBDb250ZW50ID0gY29udGVudDtcclxuXHRcdHRoaXMuX3BvcHVwT3B0aW9ucyA9IG9wdGlvbnM7XHJcblx0XHRyZXR1cm4gdGhpcy5pbnZva2UoJ2JpbmRQb3B1cCcsIGNvbnRlbnQsIG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdG9wZW5Qb3B1cDogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cdFx0Ly8gb3BlbiBwb3B1cCBvbiB0aGUgZmlyc3QgbGF5ZXJcclxuXHRcdGZvciAodmFyIGlkIGluIHRoaXMuX2xheWVycykge1xyXG5cdFx0XHR0aGlzLl9sYXllcnNbaWRdLm9wZW5Qb3B1cChsYXRsbmcpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldFN0eWxlOiBmdW5jdGlvbiAoc3R5bGUpIHtcclxuXHRcdHJldHVybiB0aGlzLmludm9rZSgnc2V0U3R5bGUnLCBzdHlsZSk7XHJcblx0fSxcclxuXHJcblx0YnJpbmdUb0Zyb250OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5pbnZva2UoJ2JyaW5nVG9Gcm9udCcpO1xyXG5cdH0sXHJcblxyXG5cdGJyaW5nVG9CYWNrOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5pbnZva2UoJ2JyaW5nVG9CYWNrJyk7XHJcblx0fSxcclxuXHJcblx0Z2V0Qm91bmRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKCk7XHJcblxyXG5cdFx0dGhpcy5lYWNoTGF5ZXIoZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHRcdGJvdW5kcy5leHRlbmQobGF5ZXIgaW5zdGFuY2VvZiBMLk1hcmtlciA/IGxheWVyLmdldExhdExuZygpIDogbGF5ZXIuZ2V0Qm91bmRzKCkpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGJvdW5kcztcclxuXHR9LFxyXG5cclxuXHRfcHJvcGFnYXRlRXZlbnQ6IGZ1bmN0aW9uIChlKSB7XHJcblx0XHRlID0gTC5leHRlbmQoe1xyXG5cdFx0XHRsYXllcjogZS50YXJnZXQsXHJcblx0XHRcdHRhcmdldDogdGhpc1xyXG5cdFx0fSwgZSk7XHJcblx0XHR0aGlzLmZpcmUoZS50eXBlLCBlKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5mZWF0dXJlR3JvdXAgPSBmdW5jdGlvbiAobGF5ZXJzKSB7XHJcblx0cmV0dXJuIG5ldyBMLkZlYXR1cmVHcm91cChsYXllcnMpO1xyXG59O1xyXG5cblxuLypcclxuICogTC5QYXRoIGlzIGEgYmFzZSBjbGFzcyBmb3IgcmVuZGVyaW5nIHZlY3RvciBwYXRocyBvbiBhIG1hcC4gSW5oZXJpdGVkIGJ5IFBvbHlsaW5lLCBDaXJjbGUsIGV0Yy5cclxuICovXHJcblxyXG5MLlBhdGggPSBMLkNsYXNzLmV4dGVuZCh7XHJcblx0aW5jbHVkZXM6IFtMLk1peGluLkV2ZW50c10sXHJcblxyXG5cdHN0YXRpY3M6IHtcclxuXHRcdC8vIGhvdyBtdWNoIHRvIGV4dGVuZCB0aGUgY2xpcCBhcmVhIGFyb3VuZCB0aGUgbWFwIHZpZXdcclxuXHRcdC8vIChyZWxhdGl2ZSB0byBpdHMgc2l6ZSwgZS5nLiAwLjUgaXMgaGFsZiB0aGUgc2NyZWVuIGluIGVhY2ggZGlyZWN0aW9uKVxyXG5cdFx0Ly8gc2V0IGl0IHNvIHRoYXQgU1ZHIGVsZW1lbnQgZG9lc24ndCBleGNlZWQgMTI4MHB4ICh2ZWN0b3JzIGZsaWNrZXIgb24gZHJhZ2VuZCBpZiBpdCBpcylcclxuXHRcdENMSVBfUEFERElORzogKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0dmFyIG1heCA9IEwuQnJvd3Nlci5tb2JpbGUgPyAxMjgwIDogMjAwMCxcclxuXHRcdFx0ICAgIHRhcmdldCA9IChtYXggLyBNYXRoLm1heCh3aW5kb3cub3V0ZXJXaWR0aCwgd2luZG93Lm91dGVySGVpZ2h0KSAtIDEpIC8gMjtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDAuNSwgdGFyZ2V0KSk7XHJcblx0XHR9KSgpXHJcblx0fSxcclxuXHJcblx0b3B0aW9uczoge1xyXG5cdFx0c3Ryb2tlOiB0cnVlLFxyXG5cdFx0Y29sb3I6ICcjMDAzM2ZmJyxcclxuXHRcdGRhc2hBcnJheTogbnVsbCxcclxuXHRcdGxpbmVDYXA6IG51bGwsXHJcblx0XHRsaW5lSm9pbjogbnVsbCxcclxuXHRcdHdlaWdodDogNSxcclxuXHRcdG9wYWNpdHk6IDAuNSxcclxuXHJcblx0XHRmaWxsOiBmYWxzZSxcclxuXHRcdGZpbGxDb2xvcjogbnVsbCwgLy9zYW1lIGFzIGNvbG9yIGJ5IGRlZmF1bHRcclxuXHRcdGZpbGxPcGFjaXR5OiAwLjIsXHJcblxyXG5cdFx0Y2xpY2thYmxlOiB0cnVlXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0dGhpcy5fbWFwID0gbWFwO1xyXG5cclxuXHRcdGlmICghdGhpcy5fY29udGFpbmVyKSB7XHJcblx0XHRcdHRoaXMuX2luaXRFbGVtZW50cygpO1xyXG5cdFx0XHR0aGlzLl9pbml0RXZlbnRzKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5wcm9qZWN0TGF0bG5ncygpO1xyXG5cdFx0dGhpcy5fdXBkYXRlUGF0aCgpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9jb250YWluZXIpIHtcclxuXHRcdFx0dGhpcy5fbWFwLl9wYXRoUm9vdC5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZmlyZSgnYWRkJyk7XHJcblxyXG5cdFx0bWFwLm9uKHtcclxuXHRcdFx0J3ZpZXdyZXNldCc6IHRoaXMucHJvamVjdExhdGxuZ3MsXHJcblx0XHRcdCdtb3ZlZW5kJzogdGhpcy5fdXBkYXRlUGF0aFxyXG5cdFx0fSwgdGhpcyk7XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcC5hZGRMYXllcih0aGlzKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHRtYXAuX3BhdGhSb290LnJlbW92ZUNoaWxkKHRoaXMuX2NvbnRhaW5lcik7XHJcblxyXG5cdFx0Ly8gTmVlZCB0byBmaXJlIHJlbW92ZSBldmVudCBiZWZvcmUgd2Ugc2V0IF9tYXAgdG8gbnVsbCBhcyB0aGUgZXZlbnQgaG9va3MgbWlnaHQgbmVlZCB0aGUgb2JqZWN0XHJcblx0XHR0aGlzLmZpcmUoJ3JlbW92ZScpO1xyXG5cdFx0dGhpcy5fbWFwID0gbnVsbDtcclxuXHJcblx0XHRpZiAoTC5Ccm93c2VyLnZtbCkge1xyXG5cdFx0XHR0aGlzLl9jb250YWluZXIgPSBudWxsO1xyXG5cdFx0XHR0aGlzLl9zdHJva2UgPSBudWxsO1xyXG5cdFx0XHR0aGlzLl9maWxsID0gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHRtYXAub2ZmKHtcclxuXHRcdFx0J3ZpZXdyZXNldCc6IHRoaXMucHJvamVjdExhdGxuZ3MsXHJcblx0XHRcdCdtb3ZlZW5kJzogdGhpcy5fdXBkYXRlUGF0aFxyXG5cdFx0fSwgdGhpcyk7XHJcblx0fSxcclxuXHJcblx0cHJvamVjdExhdGxuZ3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vIGRvIGFsbCBwcm9qZWN0aW9uIHN0dWZmIGhlcmVcclxuXHR9LFxyXG5cclxuXHRzZXRTdHlsZTogZnVuY3Rpb24gKHN0eWxlKSB7XHJcblx0XHRMLnNldE9wdGlvbnModGhpcywgc3R5bGUpO1xyXG5cclxuXHRcdGlmICh0aGlzLl9jb250YWluZXIpIHtcclxuXHRcdFx0dGhpcy5fdXBkYXRlU3R5bGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZWRyYXc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9tYXApIHtcclxuXHRcdFx0dGhpcy5wcm9qZWN0TGF0bG5ncygpO1xyXG5cdFx0XHR0aGlzLl91cGRhdGVQYXRoKCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5NYXAuaW5jbHVkZSh7XHJcblx0X3VwZGF0ZVBhdGhWaWV3cG9ydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHAgPSBMLlBhdGguQ0xJUF9QQURESU5HLFxyXG5cdFx0ICAgIHNpemUgPSB0aGlzLmdldFNpemUoKSxcclxuXHRcdCAgICBwYW5lUG9zID0gTC5Eb21VdGlsLmdldFBvc2l0aW9uKHRoaXMuX21hcFBhbmUpLFxyXG5cdFx0ICAgIG1pbiA9IHBhbmVQb3MubXVsdGlwbHlCeSgtMSkuX3N1YnRyYWN0KHNpemUubXVsdGlwbHlCeShwKS5fcm91bmQoKSksXHJcblx0XHQgICAgbWF4ID0gbWluLmFkZChzaXplLm11bHRpcGx5QnkoMSArIHAgKiAyKS5fcm91bmQoKSk7XHJcblxyXG5cdFx0dGhpcy5fcGF0aFZpZXdwb3J0ID0gbmV3IEwuQm91bmRzKG1pbiwgbWF4KTtcclxuXHR9XHJcbn0pO1xyXG5cblxuLypcclxuICogRXh0ZW5kcyBMLlBhdGggd2l0aCBTVkctc3BlY2lmaWMgcmVuZGVyaW5nIGNvZGUuXHJcbiAqL1xyXG5cclxuTC5QYXRoLlNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcblxyXG5MLkJyb3dzZXIuc3ZnID0gISEoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhMLlBhdGguU1ZHX05TLCAnc3ZnJykuY3JlYXRlU1ZHUmVjdCk7XHJcblxyXG5MLlBhdGggPSBMLlBhdGguZXh0ZW5kKHtcclxuXHRzdGF0aWNzOiB7XHJcblx0XHRTVkc6IEwuQnJvd3Nlci5zdmdcclxuXHR9LFxyXG5cclxuXHRicmluZ1RvRnJvbnQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciByb290ID0gdGhpcy5fbWFwLl9wYXRoUm9vdCxcclxuXHRcdCAgICBwYXRoID0gdGhpcy5fY29udGFpbmVyO1xyXG5cclxuXHRcdGlmIChwYXRoICYmIHJvb3QubGFzdENoaWxkICE9PSBwYXRoKSB7XHJcblx0XHRcdHJvb3QuYXBwZW5kQ2hpbGQocGF0aCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRicmluZ1RvQmFjazogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHJvb3QgPSB0aGlzLl9tYXAuX3BhdGhSb290LFxyXG5cdFx0ICAgIHBhdGggPSB0aGlzLl9jb250YWluZXIsXHJcblx0XHQgICAgZmlyc3QgPSByb290LmZpcnN0Q2hpbGQ7XHJcblxyXG5cdFx0aWYgKHBhdGggJiYgZmlyc3QgIT09IHBhdGgpIHtcclxuXHRcdFx0cm9vdC5pbnNlcnRCZWZvcmUocGF0aCwgZmlyc3QpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0Z2V0UGF0aFN0cmluZzogZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gZm9ybSBwYXRoIHN0cmluZyBoZXJlXHJcblx0fSxcclxuXHJcblx0X2NyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0XHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKEwuUGF0aC5TVkdfTlMsIG5hbWUpO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0RWxlbWVudHM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX21hcC5faW5pdFBhdGhSb290KCk7XHJcblx0XHR0aGlzLl9pbml0UGF0aCgpO1xyXG5cdFx0dGhpcy5faW5pdFN0eWxlKCk7XHJcblx0fSxcclxuXHJcblx0X2luaXRQYXRoOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl9jb250YWluZXIgPSB0aGlzLl9jcmVhdGVFbGVtZW50KCdnJyk7XHJcblxyXG5cdFx0dGhpcy5fcGF0aCA9IHRoaXMuX2NyZWF0ZUVsZW1lbnQoJ3BhdGgnKTtcclxuXHJcblx0XHRpZiAodGhpcy5vcHRpb25zLmNsYXNzTmFtZSkge1xyXG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fcGF0aCwgdGhpcy5vcHRpb25zLmNsYXNzTmFtZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhdGgpO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0U3R5bGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMuc3Ryb2tlKSB7XHJcblx0XHRcdHRoaXMuX3BhdGguc2V0QXR0cmlidXRlKCdzdHJva2UtbGluZWpvaW4nLCAncm91bmQnKTtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1saW5lY2FwJywgJ3JvdW5kJyk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5vcHRpb25zLmZpbGwpIHtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ2ZpbGwtcnVsZScsICdldmVub2RkJyk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5vcHRpb25zLnBvaW50ZXJFdmVudHMpIHtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ3BvaW50ZXItZXZlbnRzJywgdGhpcy5vcHRpb25zLnBvaW50ZXJFdmVudHMpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMuY2xpY2thYmxlICYmICF0aGlzLm9wdGlvbnMucG9pbnRlckV2ZW50cykge1xyXG5cdFx0XHR0aGlzLl9wYXRoLnNldEF0dHJpYnV0ZSgncG9pbnRlci1ldmVudHMnLCAnbm9uZScpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5fdXBkYXRlU3R5bGUoKTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlU3R5bGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLm9wdGlvbnMuc3Ryb2tlKSB7XHJcblx0XHRcdHRoaXMuX3BhdGguc2V0QXR0cmlidXRlKCdzdHJva2UnLCB0aGlzLm9wdGlvbnMuY29sb3IpO1xyXG5cdFx0XHR0aGlzLl9wYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlLW9wYWNpdHknLCB0aGlzLm9wdGlvbnMub3BhY2l0eSk7XHJcblx0XHRcdHRoaXMuX3BhdGguc2V0QXR0cmlidXRlKCdzdHJva2Utd2lkdGgnLCB0aGlzLm9wdGlvbnMud2VpZ2h0KTtcclxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5kYXNoQXJyYXkpIHtcclxuXHRcdFx0XHR0aGlzLl9wYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlLWRhc2hhcnJheScsIHRoaXMub3B0aW9ucy5kYXNoQXJyYXkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3BhdGgucmVtb3ZlQXR0cmlidXRlKCdzdHJva2UtZGFzaGFycmF5Jyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5saW5lQ2FwKSB7XHJcblx0XHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS1saW5lY2FwJywgdGhpcy5vcHRpb25zLmxpbmVDYXApO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMubGluZUpvaW4pIHtcclxuXHRcdFx0XHR0aGlzLl9wYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlLWxpbmVqb2luJywgdGhpcy5vcHRpb25zLmxpbmVKb2luKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZScsICdub25lJyk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5vcHRpb25zLmZpbGwpIHtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ2ZpbGwnLCB0aGlzLm9wdGlvbnMuZmlsbENvbG9yIHx8IHRoaXMub3B0aW9ucy5jb2xvcik7XHJcblx0XHRcdHRoaXMuX3BhdGguc2V0QXR0cmlidXRlKCdmaWxsLW9wYWNpdHknLCB0aGlzLm9wdGlvbnMuZmlsbE9wYWNpdHkpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5fcGF0aC5zZXRBdHRyaWJ1dGUoJ2ZpbGwnLCAnbm9uZScpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVQYXRoOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgc3RyID0gdGhpcy5nZXRQYXRoU3RyaW5nKCk7XHJcblx0XHRpZiAoIXN0cikge1xyXG5cdFx0XHQvLyBmaXggd2Via2l0IGVtcHR5IHN0cmluZyBwYXJzaW5nIGJ1Z1xyXG5cdFx0XHRzdHIgPSAnTTAgMCc7XHJcblx0XHR9XHJcblx0XHR0aGlzLl9wYXRoLnNldEF0dHJpYnV0ZSgnZCcsIHN0cik7XHJcblx0fSxcclxuXHJcblx0Ly8gVE9ETyByZW1vdmUgZHVwbGljYXRpb24gd2l0aCBMLk1hcFxyXG5cdF9pbml0RXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5vcHRpb25zLmNsaWNrYWJsZSkge1xyXG5cdFx0XHRpZiAoTC5Ccm93c2VyLnN2ZyB8fCAhTC5Ccm93c2VyLnZtbCkge1xyXG5cdFx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9wYXRoLCAnbGVhZmxldC1jbGlja2FibGUnKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0TC5Eb21FdmVudC5vbih0aGlzLl9jb250YWluZXIsICdjbGljaycsIHRoaXMuX29uTW91c2VDbGljaywgdGhpcyk7XHJcblxyXG5cdFx0XHR2YXIgZXZlbnRzID0gWydkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2VvdmVyJyxcclxuXHRcdFx0ICAgICAgICAgICAgICAnbW91c2VvdXQnLCAnbW91c2Vtb3ZlJywgJ2NvbnRleHRtZW51J107XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0TC5Eb21FdmVudC5vbih0aGlzLl9jb250YWluZXIsIGV2ZW50c1tpXSwgdGhpcy5fZmlyZU1vdXNlRXZlbnQsIHRoaXMpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X29uTW91c2VDbGljazogZnVuY3Rpb24gKGUpIHtcclxuXHRcdGlmICh0aGlzLl9tYXAuZHJhZ2dpbmcgJiYgdGhpcy5fbWFwLmRyYWdnaW5nLm1vdmVkKCkpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dGhpcy5fZmlyZU1vdXNlRXZlbnQoZSk7XHJcblx0fSxcclxuXHJcblx0X2ZpcmVNb3VzZUV2ZW50OiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKCF0aGlzLmhhc0V2ZW50TGlzdGVuZXJzKGUudHlwZSkpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdCAgICBjb250YWluZXJQb2ludCA9IG1hcC5tb3VzZUV2ZW50VG9Db250YWluZXJQb2ludChlKSxcclxuXHRcdCAgICBsYXllclBvaW50ID0gbWFwLmNvbnRhaW5lclBvaW50VG9MYXllclBvaW50KGNvbnRhaW5lclBvaW50KSxcclxuXHRcdCAgICBsYXRsbmcgPSBtYXAubGF5ZXJQb2ludFRvTGF0TG5nKGxheWVyUG9pbnQpO1xyXG5cclxuXHRcdHRoaXMuZmlyZShlLnR5cGUsIHtcclxuXHRcdFx0bGF0bG5nOiBsYXRsbmcsXHJcblx0XHRcdGxheWVyUG9pbnQ6IGxheWVyUG9pbnQsXHJcblx0XHRcdGNvbnRhaW5lclBvaW50OiBjb250YWluZXJQb2ludCxcclxuXHRcdFx0b3JpZ2luYWxFdmVudDogZVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0aWYgKGUudHlwZSA9PT0gJ2NvbnRleHRtZW51Jykge1xyXG5cdFx0XHRMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGUudHlwZSAhPT0gJ21vdXNlbW92ZScpIHtcclxuXHRcdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxuXHJcbkwuTWFwLmluY2x1ZGUoe1xyXG5cdF9pbml0UGF0aFJvb3Q6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhpcy5fcGF0aFJvb3QpIHtcclxuXHRcdFx0dGhpcy5fcGF0aFJvb3QgPSBMLlBhdGgucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50KCdzdmcnKTtcclxuXHRcdFx0dGhpcy5fcGFuZXMub3ZlcmxheVBhbmUuYXBwZW5kQ2hpbGQodGhpcy5fcGF0aFJvb3QpO1xyXG5cclxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy56b29tQW5pbWF0aW9uICYmIEwuQnJvd3Nlci5hbnkzZCkge1xyXG5cdFx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9wYXRoUm9vdCwgJ2xlYWZsZXQtem9vbS1hbmltYXRlZCcpO1xyXG5cclxuXHRcdFx0XHR0aGlzLm9uKHtcclxuXHRcdFx0XHRcdCd6b29tYW5pbSc6IHRoaXMuX2FuaW1hdGVQYXRoWm9vbSxcclxuXHRcdFx0XHRcdCd6b29tZW5kJzogdGhpcy5fZW5kUGF0aFpvb21cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fcGF0aFJvb3QsICdsZWFmbGV0LXpvb20taGlkZScpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLm9uKCdtb3ZlZW5kJywgdGhpcy5fdXBkYXRlU3ZnVmlld3BvcnQpO1xyXG5cdFx0XHR0aGlzLl91cGRhdGVTdmdWaWV3cG9ydCgpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9hbmltYXRlUGF0aFpvb206IGZ1bmN0aW9uIChlKSB7XHJcblx0XHR2YXIgc2NhbGUgPSB0aGlzLmdldFpvb21TY2FsZShlLnpvb20pLFxyXG5cdFx0ICAgIG9mZnNldCA9IHRoaXMuX2dldENlbnRlck9mZnNldChlLmNlbnRlcikuX211bHRpcGx5QnkoLXNjYWxlKS5fYWRkKHRoaXMuX3BhdGhWaWV3cG9ydC5taW4pO1xyXG5cclxuXHRcdHRoaXMuX3BhdGhSb290LnN0eWxlW0wuRG9tVXRpbC5UUkFOU0ZPUk1dID1cclxuXHRcdCAgICAgICAgTC5Eb21VdGlsLmdldFRyYW5zbGF0ZVN0cmluZyhvZmZzZXQpICsgJyBzY2FsZSgnICsgc2NhbGUgKyAnKSAnO1xyXG5cclxuXHRcdHRoaXMuX3BhdGhab29taW5nID0gdHJ1ZTtcclxuXHR9LFxyXG5cclxuXHRfZW5kUGF0aFpvb206IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX3BhdGhab29taW5nID0gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVN2Z1ZpZXdwb3J0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG5cdFx0aWYgKHRoaXMuX3BhdGhab29taW5nKSB7XHJcblx0XHRcdC8vIERvIG5vdCB1cGRhdGUgU1ZHcyB3aGlsZSBhIHpvb20gYW5pbWF0aW9uIGlzIGdvaW5nIG9uIG90aGVyd2lzZSB0aGUgYW5pbWF0aW9uIHdpbGwgYnJlYWsuXHJcblx0XHRcdC8vIFdoZW4gdGhlIHpvb20gYW5pbWF0aW9uIGVuZHMgd2Ugd2lsbCBiZSB1cGRhdGVkIGFnYWluIGFueXdheVxyXG5cdFx0XHQvLyBUaGlzIGZpeGVzIHRoZSBjYXNlIHdoZXJlIHlvdSBkbyBhIG1vbWVudHVtIG1vdmUgYW5kIHpvb20gd2hpbGUgdGhlIG1vdmUgaXMgc3RpbGwgb25nb2luZy5cclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3VwZGF0ZVBhdGhWaWV3cG9ydCgpO1xyXG5cclxuXHRcdHZhciB2cCA9IHRoaXMuX3BhdGhWaWV3cG9ydCxcclxuXHRcdCAgICBtaW4gPSB2cC5taW4sXHJcblx0XHQgICAgbWF4ID0gdnAubWF4LFxyXG5cdFx0ICAgIHdpZHRoID0gbWF4LnggLSBtaW4ueCxcclxuXHRcdCAgICBoZWlnaHQgPSBtYXgueSAtIG1pbi55LFxyXG5cdFx0ICAgIHJvb3QgPSB0aGlzLl9wYXRoUm9vdCxcclxuXHRcdCAgICBwYW5lID0gdGhpcy5fcGFuZXMub3ZlcmxheVBhbmU7XHJcblxyXG5cdFx0Ly8gSGFjayB0byBtYWtlIGZsaWNrZXIgb24gZHJhZyBlbmQgb24gbW9iaWxlIHdlYmtpdCBsZXNzIGlycml0YXRpbmdcclxuXHRcdGlmIChMLkJyb3dzZXIubW9iaWxlV2Via2l0KSB7XHJcblx0XHRcdHBhbmUucmVtb3ZlQ2hpbGQocm9vdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHJvb3QsIG1pbik7XHJcblx0XHRyb290LnNldEF0dHJpYnV0ZSgnd2lkdGgnLCB3aWR0aCk7XHJcblx0XHRyb290LnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgaGVpZ2h0KTtcclxuXHRcdHJvb3Quc2V0QXR0cmlidXRlKCd2aWV3Qm94JywgW21pbi54LCBtaW4ueSwgd2lkdGgsIGhlaWdodF0uam9pbignICcpKTtcclxuXHJcblx0XHRpZiAoTC5Ccm93c2VyLm1vYmlsZVdlYmtpdCkge1xyXG5cdFx0XHRwYW5lLmFwcGVuZENoaWxkKHJvb3QpO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxuXG4vKlxyXG4gKiBQb3B1cCBleHRlbnNpb24gdG8gTC5QYXRoIChwb2x5bGluZXMsIHBvbHlnb25zLCBjaXJjbGVzKSwgYWRkaW5nIHBvcHVwLXJlbGF0ZWQgbWV0aG9kcy5cclxuICovXHJcblxyXG5MLlBhdGguaW5jbHVkZSh7XHJcblxyXG5cdGJpbmRQb3B1cDogZnVuY3Rpb24gKGNvbnRlbnQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRpZiAoY29udGVudCBpbnN0YW5jZW9mIEwuUG9wdXApIHtcclxuXHRcdFx0dGhpcy5fcG9wdXAgPSBjb250ZW50O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9wb3B1cCB8fCBvcHRpb25zKSB7XHJcblx0XHRcdFx0dGhpcy5fcG9wdXAgPSBuZXcgTC5Qb3B1cChvcHRpb25zLCB0aGlzKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLl9wb3B1cC5zZXRDb250ZW50KGNvbnRlbnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghdGhpcy5fcG9wdXBIYW5kbGVyc0FkZGVkKSB7XHJcblx0XHRcdHRoaXNcclxuXHRcdFx0ICAgIC5vbignY2xpY2snLCB0aGlzLl9vcGVuUG9wdXAsIHRoaXMpXHJcblx0XHRcdCAgICAub24oJ3JlbW92ZScsIHRoaXMuY2xvc2VQb3B1cCwgdGhpcyk7XHJcblxyXG5cdFx0XHR0aGlzLl9wb3B1cEhhbmRsZXJzQWRkZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHVuYmluZFBvcHVwOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAodGhpcy5fcG9wdXApIHtcclxuXHRcdFx0dGhpcy5fcG9wdXAgPSBudWxsO1xyXG5cdFx0XHR0aGlzXHJcblx0XHRcdCAgICAub2ZmKCdjbGljaycsIHRoaXMuX29wZW5Qb3B1cClcclxuXHRcdFx0ICAgIC5vZmYoJ3JlbW92ZScsIHRoaXMuY2xvc2VQb3B1cCk7XHJcblxyXG5cdFx0XHR0aGlzLl9wb3B1cEhhbmRsZXJzQWRkZWQgPSBmYWxzZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdG9wZW5Qb3B1cDogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cclxuXHRcdGlmICh0aGlzLl9wb3B1cCkge1xyXG5cdFx0XHQvLyBvcGVuIHRoZSBwb3B1cCBmcm9tIG9uZSBvZiB0aGUgcGF0aCdzIHBvaW50cyBpZiBub3Qgc3BlY2lmaWVkXHJcblx0XHRcdGxhdGxuZyA9IGxhdGxuZyB8fCB0aGlzLl9sYXRsbmcgfHxcclxuXHRcdFx0ICAgICAgICAgdGhpcy5fbGF0bG5nc1tNYXRoLmZsb29yKHRoaXMuX2xhdGxuZ3MubGVuZ3RoIC8gMildO1xyXG5cclxuXHRcdFx0dGhpcy5fb3BlblBvcHVwKHtsYXRsbmc6IGxhdGxuZ30pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGNsb3NlUG9wdXA6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9wb3B1cCkge1xyXG5cdFx0XHR0aGlzLl9wb3B1cC5fY2xvc2UoKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdF9vcGVuUG9wdXA6IGZ1bmN0aW9uIChlKSB7XHJcblx0XHR0aGlzLl9wb3B1cC5zZXRMYXRMbmcoZS5sYXRsbmcpO1xyXG5cdFx0dGhpcy5fbWFwLm9wZW5Qb3B1cCh0aGlzLl9wb3B1cCk7XHJcblx0fVxyXG59KTtcclxuXG5cbi8qXHJcbiAqIFZlY3RvciByZW5kZXJpbmcgZm9yIElFNi04IHRocm91Z2ggVk1MLlxyXG4gKiBUaGFua3MgdG8gRG1pdHJ5IEJhcmFub3Zza3kgYW5kIGhpcyBSYXBoYWVsIGxpYnJhcnkgZm9yIGluc3BpcmF0aW9uIVxyXG4gKi9cclxuXHJcbkwuQnJvd3Nlci52bWwgPSAhTC5Ccm93c2VyLnN2ZyAmJiAoZnVuY3Rpb24gKCkge1xyXG5cdHRyeSB7XHJcblx0XHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRkaXYuaW5uZXJIVE1MID0gJzx2OnNoYXBlIGFkaj1cIjFcIi8+JztcclxuXHJcblx0XHR2YXIgc2hhcGUgPSBkaXYuZmlyc3RDaGlsZDtcclxuXHRcdHNoYXBlLnN0eWxlLmJlaGF2aW9yID0gJ3VybCgjZGVmYXVsdCNWTUwpJztcclxuXHJcblx0XHRyZXR1cm4gc2hhcGUgJiYgKHR5cGVvZiBzaGFwZS5hZGogPT09ICdvYmplY3QnKTtcclxuXHJcblx0fSBjYXRjaCAoZSkge1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxufSgpKTtcclxuXHJcbkwuUGF0aCA9IEwuQnJvd3Nlci5zdmcgfHwgIUwuQnJvd3Nlci52bWwgPyBMLlBhdGggOiBMLlBhdGguZXh0ZW5kKHtcclxuXHRzdGF0aWNzOiB7XHJcblx0XHRWTUw6IHRydWUsXHJcblx0XHRDTElQX1BBRERJTkc6IDAuMDJcclxuXHR9LFxyXG5cclxuXHRfY3JlYXRlRWxlbWVudDogKGZ1bmN0aW9uICgpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdGRvY3VtZW50Lm5hbWVzcGFjZXMuYWRkKCdsdm1sJywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206dm1sJyk7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiAobmFtZSkge1xyXG5cdFx0XHRcdHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCc8bHZtbDonICsgbmFtZSArICcgY2xhc3M9XCJsdm1sXCI+Jyk7XHJcblx0XHRcdH07XHJcblx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbiAobmFtZSkge1xyXG5cdFx0XHRcdHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFxyXG5cdFx0XHRcdCAgICAgICAgJzwnICsgbmFtZSArICcgeG1sbnM9XCJ1cm46c2NoZW1hcy1taWNyb3NvZnQuY29tOnZtbFwiIGNsYXNzPVwibHZtbFwiPicpO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdH0oKSksXHJcblxyXG5cdF9pbml0UGF0aDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGNvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lciA9IHRoaXMuX2NyZWF0ZUVsZW1lbnQoJ3NoYXBlJyk7XHJcblxyXG5cdFx0TC5Eb21VdGlsLmFkZENsYXNzKGNvbnRhaW5lciwgJ2xlYWZsZXQtdm1sLXNoYXBlJyArXHJcblx0XHRcdCh0aGlzLm9wdGlvbnMuY2xhc3NOYW1lID8gJyAnICsgdGhpcy5vcHRpb25zLmNsYXNzTmFtZSA6ICcnKSk7XHJcblxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5jbGlja2FibGUpIHtcclxuXHRcdFx0TC5Eb21VdGlsLmFkZENsYXNzKGNvbnRhaW5lciwgJ2xlYWZsZXQtY2xpY2thYmxlJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29udGFpbmVyLmNvb3Jkc2l6ZSA9ICcxIDEnO1xyXG5cclxuXHRcdHRoaXMuX3BhdGggPSB0aGlzLl9jcmVhdGVFbGVtZW50KCdwYXRoJyk7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fcGF0aCk7XHJcblxyXG5cdFx0dGhpcy5fbWFwLl9wYXRoUm9vdC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0U3R5bGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX3VwZGF0ZVN0eWxlKCk7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVN0eWxlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgc3Ryb2tlID0gdGhpcy5fc3Ryb2tlLFxyXG5cdFx0ICAgIGZpbGwgPSB0aGlzLl9maWxsLFxyXG5cdFx0ICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXHJcblx0XHQgICAgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyO1xyXG5cclxuXHRcdGNvbnRhaW5lci5zdHJva2VkID0gb3B0aW9ucy5zdHJva2U7XHJcblx0XHRjb250YWluZXIuZmlsbGVkID0gb3B0aW9ucy5maWxsO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLnN0cm9rZSkge1xyXG5cdFx0XHRpZiAoIXN0cm9rZSkge1xyXG5cdFx0XHRcdHN0cm9rZSA9IHRoaXMuX3N0cm9rZSA9IHRoaXMuX2NyZWF0ZUVsZW1lbnQoJ3N0cm9rZScpO1xyXG5cdFx0XHRcdHN0cm9rZS5lbmRjYXAgPSAncm91bmQnO1xyXG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChzdHJva2UpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHN0cm9rZS53ZWlnaHQgPSBvcHRpb25zLndlaWdodCArICdweCc7XHJcblx0XHRcdHN0cm9rZS5jb2xvciA9IG9wdGlvbnMuY29sb3I7XHJcblx0XHRcdHN0cm9rZS5vcGFjaXR5ID0gb3B0aW9ucy5vcGFjaXR5O1xyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMuZGFzaEFycmF5KSB7XHJcblx0XHRcdFx0c3Ryb2tlLmRhc2hTdHlsZSA9IEwuVXRpbC5pc0FycmF5KG9wdGlvbnMuZGFzaEFycmF5KSA/XHJcblx0XHRcdFx0ICAgIG9wdGlvbnMuZGFzaEFycmF5LmpvaW4oJyAnKSA6XHJcblx0XHRcdFx0ICAgIG9wdGlvbnMuZGFzaEFycmF5LnJlcGxhY2UoLyggKiwgKikvZywgJyAnKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzdHJva2UuZGFzaFN0eWxlID0gJyc7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMubGluZUNhcCkge1xyXG5cdFx0XHRcdHN0cm9rZS5lbmRjYXAgPSBvcHRpb25zLmxpbmVDYXAucmVwbGFjZSgnYnV0dCcsICdmbGF0Jyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMubGluZUpvaW4pIHtcclxuXHRcdFx0XHRzdHJva2Uuam9pbnN0eWxlID0gb3B0aW9ucy5saW5lSm9pbjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH0gZWxzZSBpZiAoc3Ryb2tlKSB7XHJcblx0XHRcdGNvbnRhaW5lci5yZW1vdmVDaGlsZChzdHJva2UpO1xyXG5cdFx0XHR0aGlzLl9zdHJva2UgPSBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmZpbGwpIHtcclxuXHRcdFx0aWYgKCFmaWxsKSB7XHJcblx0XHRcdFx0ZmlsbCA9IHRoaXMuX2ZpbGwgPSB0aGlzLl9jcmVhdGVFbGVtZW50KCdmaWxsJyk7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZpbGwpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZpbGwuY29sb3IgPSBvcHRpb25zLmZpbGxDb2xvciB8fCBvcHRpb25zLmNvbG9yO1xyXG5cdFx0XHRmaWxsLm9wYWNpdHkgPSBvcHRpb25zLmZpbGxPcGFjaXR5O1xyXG5cclxuXHRcdH0gZWxzZSBpZiAoZmlsbCkge1xyXG5cdFx0XHRjb250YWluZXIucmVtb3ZlQ2hpbGQoZmlsbCk7XHJcblx0XHRcdHRoaXMuX2ZpbGwgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVQYXRoOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgc3R5bGUgPSB0aGlzLl9jb250YWluZXIuc3R5bGU7XHJcblxyXG5cdFx0c3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdHRoaXMuX3BhdGgudiA9IHRoaXMuZ2V0UGF0aFN0cmluZygpICsgJyAnOyAvLyB0aGUgc3BhY2UgZml4ZXMgSUUgZW1wdHkgcGF0aCBzdHJpbmcgYnVnXHJcblx0XHRzdHlsZS5kaXNwbGF5ID0gJyc7XHJcblx0fVxyXG59KTtcclxuXHJcbkwuTWFwLmluY2x1ZGUoTC5Ccm93c2VyLnN2ZyB8fCAhTC5Ccm93c2VyLnZtbCA/IHt9IDoge1xyXG5cdF9pbml0UGF0aFJvb3Q6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9wYXRoUm9vdCkgeyByZXR1cm47IH1cclxuXHJcblx0XHR2YXIgcm9vdCA9IHRoaXMuX3BhdGhSb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRyb290LmNsYXNzTmFtZSA9ICdsZWFmbGV0LXZtbC1jb250YWluZXInO1xyXG5cdFx0dGhpcy5fcGFuZXMub3ZlcmxheVBhbmUuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG5cdFx0dGhpcy5vbignbW92ZWVuZCcsIHRoaXMuX3VwZGF0ZVBhdGhWaWV3cG9ydCk7XHJcblx0XHR0aGlzLl91cGRhdGVQYXRoVmlld3BvcnQoKTtcclxuXHR9XHJcbn0pO1xyXG5cblxuLypcclxuICogVmVjdG9yIHJlbmRlcmluZyBmb3IgYWxsIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBjYW52YXMuXHJcbiAqL1xyXG5cclxuTC5Ccm93c2VyLmNhbnZhcyA9IChmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykuZ2V0Q29udGV4dDtcclxufSgpKTtcclxuXHJcbkwuUGF0aCA9IChMLlBhdGguU1ZHICYmICF3aW5kb3cuTF9QUkVGRVJfQ0FOVkFTKSB8fCAhTC5Ccm93c2VyLmNhbnZhcyA/IEwuUGF0aCA6IEwuUGF0aC5leHRlbmQoe1xyXG5cdHN0YXRpY3M6IHtcclxuXHRcdC8vQ0xJUF9QQURESU5HOiAwLjAyLCAvLyBub3Qgc3VyZSBpZiB0aGVyZSdzIGEgbmVlZCB0byBzZXQgaXQgdG8gYSBzbWFsbCB2YWx1ZVxyXG5cdFx0Q0FOVkFTOiB0cnVlLFxyXG5cdFx0U1ZHOiBmYWxzZVxyXG5cdH0sXHJcblxyXG5cdHJlZHJhdzogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX21hcCkge1xyXG5cdFx0XHR0aGlzLnByb2plY3RMYXRsbmdzKCk7XHJcblx0XHRcdHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHNldFN0eWxlOiBmdW5jdGlvbiAoc3R5bGUpIHtcclxuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBzdHlsZSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX21hcCkge1xyXG5cdFx0XHR0aGlzLl91cGRhdGVTdHlsZSgpO1xyXG5cdFx0XHR0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRvblJlbW92ZTogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0bWFwXHJcblx0XHQgICAgLm9mZigndmlld3Jlc2V0JywgdGhpcy5wcm9qZWN0TGF0bG5ncywgdGhpcylcclxuXHRcdCAgICAub2ZmKCdtb3ZlZW5kJywgdGhpcy5fdXBkYXRlUGF0aCwgdGhpcyk7XHJcblxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5jbGlja2FibGUpIHtcclxuXHRcdFx0dGhpcy5fbWFwLm9mZignY2xpY2snLCB0aGlzLl9vbkNsaWNrLCB0aGlzKTtcclxuXHRcdFx0dGhpcy5fbWFwLm9mZignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUsIHRoaXMpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcclxuXHRcdFxyXG5cdFx0dGhpcy5maXJlKCdyZW1vdmUnKTtcclxuXHRcdHRoaXMuX21hcCA9IG51bGw7XHJcblx0fSxcclxuXHJcblx0X3JlcXVlc3RVcGRhdGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9tYXAgJiYgIUwuUGF0aC5fdXBkYXRlUmVxdWVzdCkge1xyXG5cdFx0XHRMLlBhdGguX3VwZGF0ZVJlcXVlc3QgPSBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZSh0aGlzLl9maXJlTWFwTW92ZUVuZCwgdGhpcy5fbWFwKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfZmlyZU1hcE1vdmVFbmQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdEwuUGF0aC5fdXBkYXRlUmVxdWVzdCA9IG51bGw7XHJcblx0XHR0aGlzLmZpcmUoJ21vdmVlbmQnKTtcclxuXHR9LFxyXG5cclxuXHRfaW5pdEVsZW1lbnRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGlzLl9tYXAuX2luaXRQYXRoUm9vdCgpO1xyXG5cdFx0dGhpcy5fY3R4ID0gdGhpcy5fbWFwLl9jYW52YXNDdHg7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVN0eWxlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcclxuXHJcblx0XHRpZiAob3B0aW9ucy5zdHJva2UpIHtcclxuXHRcdFx0dGhpcy5fY3R4LmxpbmVXaWR0aCA9IG9wdGlvbnMud2VpZ2h0O1xyXG5cdFx0XHR0aGlzLl9jdHguc3Ryb2tlU3R5bGUgPSBvcHRpb25zLmNvbG9yO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG9wdGlvbnMuZmlsbCkge1xyXG5cdFx0XHR0aGlzLl9jdHguZmlsbFN0eWxlID0gb3B0aW9ucy5maWxsQ29sb3IgfHwgb3B0aW9ucy5jb2xvcjtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfZHJhd1BhdGg6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBpLCBqLCBsZW4sIGxlbjIsIHBvaW50LCBkcmF3TWV0aG9kO1xyXG5cclxuXHRcdHRoaXMuX2N0eC5iZWdpblBhdGgoKTtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRmb3IgKGogPSAwLCBsZW4yID0gdGhpcy5fcGFydHNbaV0ubGVuZ3RoOyBqIDwgbGVuMjsgaisrKSB7XHJcblx0XHRcdFx0cG9pbnQgPSB0aGlzLl9wYXJ0c1tpXVtqXTtcclxuXHRcdFx0XHRkcmF3TWV0aG9kID0gKGogPT09IDAgPyAnbW92ZScgOiAnbGluZScpICsgJ1RvJztcclxuXHJcblx0XHRcdFx0dGhpcy5fY3R4W2RyYXdNZXRob2RdKHBvaW50LngsIHBvaW50LnkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFRPRE8gcmVmYWN0b3IgdWdseSBoYWNrXHJcblx0XHRcdGlmICh0aGlzIGluc3RhbmNlb2YgTC5Qb2x5Z29uKSB7XHJcblx0XHRcdFx0dGhpcy5fY3R4LmNsb3NlUGF0aCgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X2NoZWNrSWZFbXB0eTogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuICF0aGlzLl9wYXJ0cy5sZW5ndGg7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVBhdGg6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9jaGVja0lmRW1wdHkoKSkgeyByZXR1cm47IH1cclxuXHJcblx0XHR2YXIgY3R4ID0gdGhpcy5fY3R4LFxyXG5cdFx0ICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XHJcblxyXG5cdFx0dGhpcy5fZHJhd1BhdGgoKTtcclxuXHRcdGN0eC5zYXZlKCk7XHJcblx0XHR0aGlzLl91cGRhdGVTdHlsZSgpO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLmZpbGwpIHtcclxuXHRcdFx0Y3R4Lmdsb2JhbEFscGhhID0gb3B0aW9ucy5maWxsT3BhY2l0eTtcclxuXHRcdFx0Y3R4LmZpbGwoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5zdHJva2UpIHtcclxuXHRcdFx0Y3R4Lmdsb2JhbEFscGhhID0gb3B0aW9ucy5vcGFjaXR5O1xyXG5cdFx0XHRjdHguc3Ryb2tlKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y3R4LnJlc3RvcmUoKTtcclxuXHJcblx0XHQvLyBUT0RPIG9wdGltaXphdGlvbjogMSBmaWxsL3N0cm9rZSBmb3IgYWxsIGZlYXR1cmVzIHdpdGggZXF1YWwgc3R5bGUgaW5zdGVhZCBvZiAxIGZvciBlYWNoIGZlYXR1cmVcclxuXHR9LFxyXG5cclxuXHRfaW5pdEV2ZW50czogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5jbGlja2FibGUpIHtcclxuXHRcdFx0Ly8gVE9ETyBkYmxjbGlja1xyXG5cdFx0XHR0aGlzLl9tYXAub24oJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlLCB0aGlzKTtcclxuXHRcdFx0dGhpcy5fbWFwLm9uKCdjbGljaycsIHRoaXMuX29uQ2xpY2ssIHRoaXMpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9vbkNsaWNrOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbnRhaW5zUG9pbnQoZS5sYXllclBvaW50KSkge1xyXG5cdFx0XHR0aGlzLmZpcmUoJ2NsaWNrJywgZSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X29uTW91c2VNb3ZlOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9tYXAgfHwgdGhpcy5fbWFwLl9hbmltYXRpbmdab29tKSB7IHJldHVybjsgfVxyXG5cclxuXHRcdC8vIFRPRE8gZG9uJ3QgZG8gb24gZWFjaCBtb3ZlXHJcblx0XHRpZiAodGhpcy5fY29udGFpbnNQb2ludChlLmxheWVyUG9pbnQpKSB7XHJcblx0XHRcdHRoaXMuX2N0eC5jYW52YXMuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xyXG5cdFx0XHR0aGlzLl9tb3VzZUluc2lkZSA9IHRydWU7XHJcblx0XHRcdHRoaXMuZmlyZSgnbW91c2VvdmVyJywgZSk7XHJcblxyXG5cdFx0fSBlbHNlIGlmICh0aGlzLl9tb3VzZUluc2lkZSkge1xyXG5cdFx0XHR0aGlzLl9jdHguY2FudmFzLnN0eWxlLmN1cnNvciA9ICcnO1xyXG5cdFx0XHR0aGlzLl9tb3VzZUluc2lkZSA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLmZpcmUoJ21vdXNlb3V0JywgZSk7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxuXHJcbkwuTWFwLmluY2x1ZGUoKEwuUGF0aC5TVkcgJiYgIXdpbmRvdy5MX1BSRUZFUl9DQU5WQVMpIHx8ICFMLkJyb3dzZXIuY2FudmFzID8ge30gOiB7XHJcblx0X2luaXRQYXRoUm9vdDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHJvb3QgPSB0aGlzLl9wYXRoUm9vdCxcclxuXHRcdCAgICBjdHg7XHJcblxyXG5cdFx0aWYgKCFyb290KSB7XHJcblx0XHRcdHJvb3QgPSB0aGlzLl9wYXRoUm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG5cdFx0XHRyb290LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuXHRcdFx0Y3R4ID0gdGhpcy5fY2FudmFzQ3R4ID0gcm9vdC5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuXHRcdFx0Y3R4LmxpbmVDYXAgPSAncm91bmQnO1xyXG5cdFx0XHRjdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG5cclxuXHRcdFx0dGhpcy5fcGFuZXMub3ZlcmxheVBhbmUuYXBwZW5kQ2hpbGQocm9vdCk7XHJcblxyXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnpvb21BbmltYXRpb24pIHtcclxuXHRcdFx0XHR0aGlzLl9wYXRoUm9vdC5jbGFzc05hbWUgPSAnbGVhZmxldC16b29tLWFuaW1hdGVkJztcclxuXHRcdFx0XHR0aGlzLm9uKCd6b29tYW5pbScsIHRoaXMuX2FuaW1hdGVQYXRoWm9vbSk7XHJcblx0XHRcdFx0dGhpcy5vbignem9vbWVuZCcsIHRoaXMuX2VuZFBhdGhab29tKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLm9uKCdtb3ZlZW5kJywgdGhpcy5fdXBkYXRlQ2FudmFzVmlld3BvcnQpO1xyXG5cdFx0XHR0aGlzLl91cGRhdGVDYW52YXNWaWV3cG9ydCgpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVDYW52YXNWaWV3cG9ydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gZG9uJ3QgcmVkcmF3IHdoaWxlIHpvb21pbmcuIFNlZSBfdXBkYXRlU3ZnVmlld3BvcnQgZm9yIG1vcmUgZGV0YWlsc1xyXG5cdFx0aWYgKHRoaXMuX3BhdGhab29taW5nKSB7IHJldHVybjsgfVxyXG5cdFx0dGhpcy5fdXBkYXRlUGF0aFZpZXdwb3J0KCk7XHJcblxyXG5cdFx0dmFyIHZwID0gdGhpcy5fcGF0aFZpZXdwb3J0LFxyXG5cdFx0ICAgIG1pbiA9IHZwLm1pbixcclxuXHRcdCAgICBzaXplID0gdnAubWF4LnN1YnRyYWN0KG1pbiksXHJcblx0XHQgICAgcm9vdCA9IHRoaXMuX3BhdGhSb290O1xyXG5cclxuXHRcdC8vVE9ETyBjaGVjayBpZiB0aGlzIHdvcmtzIHByb3Blcmx5IG9uIG1vYmlsZSB3ZWJraXRcclxuXHRcdEwuRG9tVXRpbC5zZXRQb3NpdGlvbihyb290LCBtaW4pO1xyXG5cdFx0cm9vdC53aWR0aCA9IHNpemUueDtcclxuXHRcdHJvb3QuaGVpZ2h0ID0gc2l6ZS55O1xyXG5cdFx0cm9vdC5nZXRDb250ZXh0KCcyZCcpLnRyYW5zbGF0ZSgtbWluLngsIC1taW4ueSk7XHJcblx0fVxyXG59KTtcclxuXG5cbi8qXHJcbiAqIEwuTGluZVV0aWwgY29udGFpbnMgZGlmZmVyZW50IHV0aWxpdHkgZnVuY3Rpb25zIGZvciBsaW5lIHNlZ21lbnRzXHJcbiAqIGFuZCBwb2x5bGluZXMgKGNsaXBwaW5nLCBzaW1wbGlmaWNhdGlvbiwgZGlzdGFuY2VzLCBldGMuKVxyXG4gKi9cclxuXHJcbi8qanNoaW50IGJpdHdpc2U6ZmFsc2UgKi8gLy8gYWxsb3cgYml0d2lzZSBvcGVyYXRpb25zIGZvciB0aGlzIGZpbGVcclxuXHJcbkwuTGluZVV0aWwgPSB7XHJcblxyXG5cdC8vIFNpbXBsaWZ5IHBvbHlsaW5lIHdpdGggdmVydGV4IHJlZHVjdGlvbiBhbmQgRG91Z2xhcy1QZXVja2VyIHNpbXBsaWZpY2F0aW9uLlxyXG5cdC8vIEltcHJvdmVzIHJlbmRlcmluZyBwZXJmb3JtYW5jZSBkcmFtYXRpY2FsbHkgYnkgbGVzc2VuaW5nIHRoZSBudW1iZXIgb2YgcG9pbnRzIHRvIGRyYXcuXHJcblxyXG5cdHNpbXBsaWZ5OiBmdW5jdGlvbiAoLypQb2ludFtdKi8gcG9pbnRzLCAvKk51bWJlciovIHRvbGVyYW5jZSkge1xyXG5cdFx0aWYgKCF0b2xlcmFuY2UgfHwgIXBvaW50cy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIHBvaW50cy5zbGljZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBzcVRvbGVyYW5jZSA9IHRvbGVyYW5jZSAqIHRvbGVyYW5jZTtcclxuXHJcblx0XHQvLyBzdGFnZSAxOiB2ZXJ0ZXggcmVkdWN0aW9uXHJcblx0XHRwb2ludHMgPSB0aGlzLl9yZWR1Y2VQb2ludHMocG9pbnRzLCBzcVRvbGVyYW5jZSk7XHJcblxyXG5cdFx0Ly8gc3RhZ2UgMjogRG91Z2xhcy1QZXVja2VyIHNpbXBsaWZpY2F0aW9uXHJcblx0XHRwb2ludHMgPSB0aGlzLl9zaW1wbGlmeURQKHBvaW50cywgc3FUb2xlcmFuY2UpO1xyXG5cclxuXHRcdHJldHVybiBwb2ludHM7XHJcblx0fSxcclxuXHJcblx0Ly8gZGlzdGFuY2UgZnJvbSBhIHBvaW50IHRvIGEgc2VnbWVudCBiZXR3ZWVuIHR3byBwb2ludHNcclxuXHRwb2ludFRvU2VnbWVudERpc3RhbmNlOiAgZnVuY3Rpb24gKC8qUG9pbnQqLyBwLCAvKlBvaW50Ki8gcDEsIC8qUG9pbnQqLyBwMikge1xyXG5cdFx0cmV0dXJuIE1hdGguc3FydCh0aGlzLl9zcUNsb3Nlc3RQb2ludE9uU2VnbWVudChwLCBwMSwgcDIsIHRydWUpKTtcclxuXHR9LFxyXG5cclxuXHRjbG9zZXN0UG9pbnRPblNlZ21lbnQ6IGZ1bmN0aW9uICgvKlBvaW50Ki8gcCwgLypQb2ludCovIHAxLCAvKlBvaW50Ki8gcDIpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zcUNsb3Nlc3RQb2ludE9uU2VnbWVudChwLCBwMSwgcDIpO1xyXG5cdH0sXHJcblxyXG5cdC8vIERvdWdsYXMtUGV1Y2tlciBzaW1wbGlmaWNhdGlvbiwgc2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRG91Z2xhcy1QZXVja2VyX2FsZ29yaXRobVxyXG5cdF9zaW1wbGlmeURQOiBmdW5jdGlvbiAocG9pbnRzLCBzcVRvbGVyYW5jZSkge1xyXG5cclxuXHRcdHZhciBsZW4gPSBwb2ludHMubGVuZ3RoLFxyXG5cdFx0ICAgIEFycmF5Q29uc3RydWN0b3IgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gdW5kZWZpbmVkICsgJycgPyBVaW50OEFycmF5IDogQXJyYXksXHJcblx0XHQgICAgbWFya2VycyA9IG5ldyBBcnJheUNvbnN0cnVjdG9yKGxlbik7XHJcblxyXG5cdFx0bWFya2Vyc1swXSA9IG1hcmtlcnNbbGVuIC0gMV0gPSAxO1xyXG5cclxuXHRcdHRoaXMuX3NpbXBsaWZ5RFBTdGVwKHBvaW50cywgbWFya2Vycywgc3FUb2xlcmFuY2UsIDAsIGxlbiAtIDEpO1xyXG5cclxuXHRcdHZhciBpLFxyXG5cdFx0ICAgIG5ld1BvaW50cyA9IFtdO1xyXG5cclxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRpZiAobWFya2Vyc1tpXSkge1xyXG5cdFx0XHRcdG5ld1BvaW50cy5wdXNoKHBvaW50c1tpXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbmV3UG9pbnRzO1xyXG5cdH0sXHJcblxyXG5cdF9zaW1wbGlmeURQU3RlcDogZnVuY3Rpb24gKHBvaW50cywgbWFya2Vycywgc3FUb2xlcmFuY2UsIGZpcnN0LCBsYXN0KSB7XHJcblxyXG5cdFx0dmFyIG1heFNxRGlzdCA9IDAsXHJcblx0XHQgICAgaW5kZXgsIGksIHNxRGlzdDtcclxuXHJcblx0XHRmb3IgKGkgPSBmaXJzdCArIDE7IGkgPD0gbGFzdCAtIDE7IGkrKykge1xyXG5cdFx0XHRzcURpc3QgPSB0aGlzLl9zcUNsb3Nlc3RQb2ludE9uU2VnbWVudChwb2ludHNbaV0sIHBvaW50c1tmaXJzdF0sIHBvaW50c1tsYXN0XSwgdHJ1ZSk7XHJcblxyXG5cdFx0XHRpZiAoc3FEaXN0ID4gbWF4U3FEaXN0KSB7XHJcblx0XHRcdFx0aW5kZXggPSBpO1xyXG5cdFx0XHRcdG1heFNxRGlzdCA9IHNxRGlzdDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChtYXhTcURpc3QgPiBzcVRvbGVyYW5jZSkge1xyXG5cdFx0XHRtYXJrZXJzW2luZGV4XSA9IDE7XHJcblxyXG5cdFx0XHR0aGlzLl9zaW1wbGlmeURQU3RlcChwb2ludHMsIG1hcmtlcnMsIHNxVG9sZXJhbmNlLCBmaXJzdCwgaW5kZXgpO1xyXG5cdFx0XHR0aGlzLl9zaW1wbGlmeURQU3RlcChwb2ludHMsIG1hcmtlcnMsIHNxVG9sZXJhbmNlLCBpbmRleCwgbGFzdCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Ly8gcmVkdWNlIHBvaW50cyB0aGF0IGFyZSB0b28gY2xvc2UgdG8gZWFjaCBvdGhlciB0byBhIHNpbmdsZSBwb2ludFxyXG5cdF9yZWR1Y2VQb2ludHM6IGZ1bmN0aW9uIChwb2ludHMsIHNxVG9sZXJhbmNlKSB7XHJcblx0XHR2YXIgcmVkdWNlZFBvaW50cyA9IFtwb2ludHNbMF1dO1xyXG5cclxuXHRcdGZvciAodmFyIGkgPSAxLCBwcmV2ID0gMCwgbGVuID0gcG9pbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdGlmICh0aGlzLl9zcURpc3QocG9pbnRzW2ldLCBwb2ludHNbcHJldl0pID4gc3FUb2xlcmFuY2UpIHtcclxuXHRcdFx0XHRyZWR1Y2VkUG9pbnRzLnB1c2gocG9pbnRzW2ldKTtcclxuXHRcdFx0XHRwcmV2ID0gaTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHByZXYgPCBsZW4gLSAxKSB7XHJcblx0XHRcdHJlZHVjZWRQb2ludHMucHVzaChwb2ludHNbbGVuIC0gMV0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHJlZHVjZWRQb2ludHM7XHJcblx0fSxcclxuXHJcblx0Ly8gQ29oZW4tU3V0aGVybGFuZCBsaW5lIGNsaXBwaW5nIGFsZ29yaXRobS5cclxuXHQvLyBVc2VkIHRvIGF2b2lkIHJlbmRlcmluZyBwYXJ0cyBvZiBhIHBvbHlsaW5lIHRoYXQgYXJlIG5vdCBjdXJyZW50bHkgdmlzaWJsZS5cclxuXHJcblx0Y2xpcFNlZ21lbnQ6IGZ1bmN0aW9uIChhLCBiLCBib3VuZHMsIHVzZUxhc3RDb2RlKSB7XHJcblx0XHR2YXIgY29kZUEgPSB1c2VMYXN0Q29kZSA/IHRoaXMuX2xhc3RDb2RlIDogdGhpcy5fZ2V0Qml0Q29kZShhLCBib3VuZHMpLFxyXG5cdFx0ICAgIGNvZGVCID0gdGhpcy5fZ2V0Qml0Q29kZShiLCBib3VuZHMpLFxyXG5cclxuXHRcdCAgICBjb2RlT3V0LCBwLCBuZXdDb2RlO1xyXG5cclxuXHRcdC8vIHNhdmUgMm5kIGNvZGUgdG8gYXZvaWQgY2FsY3VsYXRpbmcgaXQgb24gdGhlIG5leHQgc2VnbWVudFxyXG5cdFx0dGhpcy5fbGFzdENvZGUgPSBjb2RlQjtcclxuXHJcblx0XHR3aGlsZSAodHJ1ZSkge1xyXG5cdFx0XHQvLyBpZiBhLGIgaXMgaW5zaWRlIHRoZSBjbGlwIHdpbmRvdyAodHJpdmlhbCBhY2NlcHQpXHJcblx0XHRcdGlmICghKGNvZGVBIHwgY29kZUIpKSB7XHJcblx0XHRcdFx0cmV0dXJuIFthLCBiXTtcclxuXHRcdFx0Ly8gaWYgYSxiIGlzIG91dHNpZGUgdGhlIGNsaXAgd2luZG93ICh0cml2aWFsIHJlamVjdClcclxuXHRcdFx0fSBlbHNlIGlmIChjb2RlQSAmIGNvZGVCKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHQvLyBvdGhlciBjYXNlc1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvZGVPdXQgPSBjb2RlQSB8fCBjb2RlQjtcclxuXHRcdFx0XHRwID0gdGhpcy5fZ2V0RWRnZUludGVyc2VjdGlvbihhLCBiLCBjb2RlT3V0LCBib3VuZHMpO1xyXG5cdFx0XHRcdG5ld0NvZGUgPSB0aGlzLl9nZXRCaXRDb2RlKHAsIGJvdW5kcyk7XHJcblxyXG5cdFx0XHRcdGlmIChjb2RlT3V0ID09PSBjb2RlQSkge1xyXG5cdFx0XHRcdFx0YSA9IHA7XHJcblx0XHRcdFx0XHRjb2RlQSA9IG5ld0NvZGU7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGIgPSBwO1xyXG5cdFx0XHRcdFx0Y29kZUIgPSBuZXdDb2RlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9nZXRFZGdlSW50ZXJzZWN0aW9uOiBmdW5jdGlvbiAoYSwgYiwgY29kZSwgYm91bmRzKSB7XHJcblx0XHR2YXIgZHggPSBiLnggLSBhLngsXHJcblx0XHQgICAgZHkgPSBiLnkgLSBhLnksXHJcblx0XHQgICAgbWluID0gYm91bmRzLm1pbixcclxuXHRcdCAgICBtYXggPSBib3VuZHMubWF4O1xyXG5cclxuXHRcdGlmIChjb2RlICYgOCkgeyAvLyB0b3BcclxuXHRcdFx0cmV0dXJuIG5ldyBMLlBvaW50KGEueCArIGR4ICogKG1heC55IC0gYS55KSAvIGR5LCBtYXgueSk7XHJcblx0XHR9IGVsc2UgaWYgKGNvZGUgJiA0KSB7IC8vIGJvdHRvbVxyXG5cdFx0XHRyZXR1cm4gbmV3IEwuUG9pbnQoYS54ICsgZHggKiAobWluLnkgLSBhLnkpIC8gZHksIG1pbi55KTtcclxuXHRcdH0gZWxzZSBpZiAoY29kZSAmIDIpIHsgLy8gcmlnaHRcclxuXHRcdFx0cmV0dXJuIG5ldyBMLlBvaW50KG1heC54LCBhLnkgKyBkeSAqIChtYXgueCAtIGEueCkgLyBkeCk7XHJcblx0XHR9IGVsc2UgaWYgKGNvZGUgJiAxKSB7IC8vIGxlZnRcclxuXHRcdFx0cmV0dXJuIG5ldyBMLlBvaW50KG1pbi54LCBhLnkgKyBkeSAqIChtaW4ueCAtIGEueCkgLyBkeCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X2dldEJpdENvZGU6IGZ1bmN0aW9uICgvKlBvaW50Ki8gcCwgYm91bmRzKSB7XHJcblx0XHR2YXIgY29kZSA9IDA7XHJcblxyXG5cdFx0aWYgKHAueCA8IGJvdW5kcy5taW4ueCkgeyAvLyBsZWZ0XHJcblx0XHRcdGNvZGUgfD0gMTtcclxuXHRcdH0gZWxzZSBpZiAocC54ID4gYm91bmRzLm1heC54KSB7IC8vIHJpZ2h0XHJcblx0XHRcdGNvZGUgfD0gMjtcclxuXHRcdH1cclxuXHRcdGlmIChwLnkgPCBib3VuZHMubWluLnkpIHsgLy8gYm90dG9tXHJcblx0XHRcdGNvZGUgfD0gNDtcclxuXHRcdH0gZWxzZSBpZiAocC55ID4gYm91bmRzLm1heC55KSB7IC8vIHRvcFxyXG5cdFx0XHRjb2RlIHw9IDg7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNvZGU7XHJcblx0fSxcclxuXHJcblx0Ly8gc3F1YXJlIGRpc3RhbmNlICh0byBhdm9pZCB1bm5lY2Vzc2FyeSBNYXRoLnNxcnQgY2FsbHMpXHJcblx0X3NxRGlzdDogZnVuY3Rpb24gKHAxLCBwMikge1xyXG5cdFx0dmFyIGR4ID0gcDIueCAtIHAxLngsXHJcblx0XHQgICAgZHkgPSBwMi55IC0gcDEueTtcclxuXHRcdHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxuXHR9LFxyXG5cclxuXHQvLyByZXR1cm4gY2xvc2VzdCBwb2ludCBvbiBzZWdtZW50IG9yIGRpc3RhbmNlIHRvIHRoYXQgcG9pbnRcclxuXHRfc3FDbG9zZXN0UG9pbnRPblNlZ21lbnQ6IGZ1bmN0aW9uIChwLCBwMSwgcDIsIHNxRGlzdCkge1xyXG5cdFx0dmFyIHggPSBwMS54LFxyXG5cdFx0ICAgIHkgPSBwMS55LFxyXG5cdFx0ICAgIGR4ID0gcDIueCAtIHgsXHJcblx0XHQgICAgZHkgPSBwMi55IC0geSxcclxuXHRcdCAgICBkb3QgPSBkeCAqIGR4ICsgZHkgKiBkeSxcclxuXHRcdCAgICB0O1xyXG5cclxuXHRcdGlmIChkb3QgPiAwKSB7XHJcblx0XHRcdHQgPSAoKHAueCAtIHgpICogZHggKyAocC55IC0geSkgKiBkeSkgLyBkb3Q7XHJcblxyXG5cdFx0XHRpZiAodCA+IDEpIHtcclxuXHRcdFx0XHR4ID0gcDIueDtcclxuXHRcdFx0XHR5ID0gcDIueTtcclxuXHRcdFx0fSBlbHNlIGlmICh0ID4gMCkge1xyXG5cdFx0XHRcdHggKz0gZHggKiB0O1xyXG5cdFx0XHRcdHkgKz0gZHkgKiB0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZHggPSBwLnggLSB4O1xyXG5cdFx0ZHkgPSBwLnkgLSB5O1xyXG5cclxuXHRcdHJldHVybiBzcURpc3QgPyBkeCAqIGR4ICsgZHkgKiBkeSA6IG5ldyBMLlBvaW50KHgsIHkpO1xyXG5cdH1cclxufTtcclxuXG5cbi8qXHJcbiAqIEwuUG9seWxpbmUgaXMgdXNlZCB0byBkaXNwbGF5IHBvbHlsaW5lcyBvbiBhIG1hcC5cclxuICovXHJcblxyXG5MLlBvbHlsaW5lID0gTC5QYXRoLmV4dGVuZCh7XHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZ3MsIG9wdGlvbnMpIHtcclxuXHRcdEwuUGF0aC5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuXHRcdHRoaXMuX2xhdGxuZ3MgPSB0aGlzLl9jb252ZXJ0TGF0TG5ncyhsYXRsbmdzKTtcclxuXHR9LFxyXG5cclxuXHRvcHRpb25zOiB7XHJcblx0XHQvLyBob3cgbXVjaCB0byBzaW1wbGlmeSB0aGUgcG9seWxpbmUgb24gZWFjaCB6b29tIGxldmVsXHJcblx0XHQvLyBtb3JlID0gYmV0dGVyIHBlcmZvcm1hbmNlIGFuZCBzbW9vdGhlciBsb29rLCBsZXNzID0gbW9yZSBhY2N1cmF0ZVxyXG5cdFx0c21vb3RoRmFjdG9yOiAxLjAsXHJcblx0XHRub0NsaXA6IGZhbHNlXHJcblx0fSxcclxuXHJcblx0cHJvamVjdExhdGxuZ3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX29yaWdpbmFsUG9pbnRzID0gW107XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2xhdGxuZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dGhpcy5fb3JpZ2luYWxQb2ludHNbaV0gPSB0aGlzLl9tYXAubGF0TG5nVG9MYXllclBvaW50KHRoaXMuX2xhdGxuZ3NbaV0pO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGdldFBhdGhTdHJpbmc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGgsIHN0ciA9ICcnOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0c3RyICs9IHRoaXMuX2dldFBhdGhQYXJ0U3RyKHRoaXMuX3BhcnRzW2ldKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHI7XHJcblx0fSxcclxuXHJcblx0Z2V0TGF0TG5nczogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2xhdGxuZ3M7XHJcblx0fSxcclxuXHJcblx0c2V0TGF0TG5nczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcclxuXHRcdHRoaXMuX2xhdGxuZ3MgPSB0aGlzLl9jb252ZXJ0TGF0TG5ncyhsYXRsbmdzKTtcclxuXHRcdHJldHVybiB0aGlzLnJlZHJhdygpO1xyXG5cdH0sXHJcblxyXG5cdGFkZExhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cdFx0dGhpcy5fbGF0bG5ncy5wdXNoKEwubGF0TG5nKGxhdGxuZykpO1xyXG5cdFx0cmV0dXJuIHRoaXMucmVkcmF3KCk7XHJcblx0fSxcclxuXHJcblx0c3BsaWNlTGF0TG5nczogZnVuY3Rpb24gKCkgeyAvLyAoTnVtYmVyIGluZGV4LCBOdW1iZXIgaG93TWFueSlcclxuXHRcdHZhciByZW1vdmVkID0gW10uc3BsaWNlLmFwcGx5KHRoaXMuX2xhdGxuZ3MsIGFyZ3VtZW50cyk7XHJcblx0XHR0aGlzLl9jb252ZXJ0TGF0TG5ncyh0aGlzLl9sYXRsbmdzLCB0cnVlKTtcclxuXHRcdHRoaXMucmVkcmF3KCk7XHJcblx0XHRyZXR1cm4gcmVtb3ZlZDtcclxuXHR9LFxyXG5cclxuXHRjbG9zZXN0TGF5ZXJQb2ludDogZnVuY3Rpb24gKHApIHtcclxuXHRcdHZhciBtaW5EaXN0YW5jZSA9IEluZmluaXR5LCBwYXJ0cyA9IHRoaXMuX3BhcnRzLCBwMSwgcDIsIG1pblBvaW50ID0gbnVsbDtcclxuXHJcblx0XHRmb3IgKHZhciBqID0gMCwgakxlbiA9IHBhcnRzLmxlbmd0aDsgaiA8IGpMZW47IGorKykge1xyXG5cdFx0XHR2YXIgcG9pbnRzID0gcGFydHNbal07XHJcblx0XHRcdGZvciAodmFyIGkgPSAxLCBsZW4gPSBwb2ludHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRwMSA9IHBvaW50c1tpIC0gMV07XHJcblx0XHRcdFx0cDIgPSBwb2ludHNbaV07XHJcblx0XHRcdFx0dmFyIHNxRGlzdCA9IEwuTGluZVV0aWwuX3NxQ2xvc2VzdFBvaW50T25TZWdtZW50KHAsIHAxLCBwMiwgdHJ1ZSk7XHJcblx0XHRcdFx0aWYgKHNxRGlzdCA8IG1pbkRpc3RhbmNlKSB7XHJcblx0XHRcdFx0XHRtaW5EaXN0YW5jZSA9IHNxRGlzdDtcclxuXHRcdFx0XHRcdG1pblBvaW50ID0gTC5MaW5lVXRpbC5fc3FDbG9zZXN0UG9pbnRPblNlZ21lbnQocCwgcDEsIHAyKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChtaW5Qb2ludCkge1xyXG5cdFx0XHRtaW5Qb2ludC5kaXN0YW5jZSA9IE1hdGguc3FydChtaW5EaXN0YW5jZSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbWluUG9pbnQ7XHJcblx0fSxcclxuXHJcblx0Z2V0Qm91bmRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gbmV3IEwuTGF0TG5nQm91bmRzKHRoaXMuZ2V0TGF0TG5ncygpKTtcclxuXHR9LFxyXG5cclxuXHRfY29udmVydExhdExuZ3M6IGZ1bmN0aW9uIChsYXRsbmdzLCBvdmVyd3JpdGUpIHtcclxuXHRcdHZhciBpLCBsZW4sIHRhcmdldCA9IG92ZXJ3cml0ZSA/IGxhdGxuZ3MgOiBbXTtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBsYXRsbmdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdGlmIChMLlV0aWwuaXNBcnJheShsYXRsbmdzW2ldKSAmJiB0eXBlb2YgbGF0bG5nc1tpXVswXSAhPT0gJ251bWJlcicpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0dGFyZ2V0W2ldID0gTC5sYXRMbmcobGF0bG5nc1tpXSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH0sXHJcblxyXG5cdF9pbml0RXZlbnRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRMLlBhdGgucHJvdG90eXBlLl9pbml0RXZlbnRzLmNhbGwodGhpcyk7XHJcblx0fSxcclxuXHJcblx0X2dldFBhdGhQYXJ0U3RyOiBmdW5jdGlvbiAocG9pbnRzKSB7XHJcblx0XHR2YXIgcm91bmQgPSBMLlBhdGguVk1MO1xyXG5cclxuXHRcdGZvciAodmFyIGogPSAwLCBsZW4yID0gcG9pbnRzLmxlbmd0aCwgc3RyID0gJycsIHA7IGogPCBsZW4yOyBqKyspIHtcclxuXHRcdFx0cCA9IHBvaW50c1tqXTtcclxuXHRcdFx0aWYgKHJvdW5kKSB7XHJcblx0XHRcdFx0cC5fcm91bmQoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdHIgKz0gKGogPyAnTCcgOiAnTScpICsgcC54ICsgJyAnICsgcC55O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN0cjtcclxuXHR9LFxyXG5cclxuXHRfY2xpcFBvaW50czogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHBvaW50cyA9IHRoaXMuX29yaWdpbmFsUG9pbnRzLFxyXG5cdFx0ICAgIGxlbiA9IHBvaW50cy5sZW5ndGgsXHJcblx0XHQgICAgaSwgaywgc2VnbWVudDtcclxuXHJcblx0XHRpZiAodGhpcy5vcHRpb25zLm5vQ2xpcCkge1xyXG5cdFx0XHR0aGlzLl9wYXJ0cyA9IFtwb2ludHNdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fcGFydHMgPSBbXTtcclxuXHJcblx0XHR2YXIgcGFydHMgPSB0aGlzLl9wYXJ0cyxcclxuXHRcdCAgICB2cCA9IHRoaXMuX21hcC5fcGF0aFZpZXdwb3J0LFxyXG5cdFx0ICAgIGx1ID0gTC5MaW5lVXRpbDtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBrID0gMDsgaSA8IGxlbiAtIDE7IGkrKykge1xyXG5cdFx0XHRzZWdtZW50ID0gbHUuY2xpcFNlZ21lbnQocG9pbnRzW2ldLCBwb2ludHNbaSArIDFdLCB2cCwgaSk7XHJcblx0XHRcdGlmICghc2VnbWVudCkge1xyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwYXJ0c1trXSA9IHBhcnRzW2tdIHx8IFtdO1xyXG5cdFx0XHRwYXJ0c1trXS5wdXNoKHNlZ21lbnRbMF0pO1xyXG5cclxuXHRcdFx0Ly8gaWYgc2VnbWVudCBnb2VzIG91dCBvZiBzY3JlZW4sIG9yIGl0J3MgdGhlIGxhc3Qgb25lLCBpdCdzIHRoZSBlbmQgb2YgdGhlIGxpbmUgcGFydFxyXG5cdFx0XHRpZiAoKHNlZ21lbnRbMV0gIT09IHBvaW50c1tpICsgMV0pIHx8IChpID09PSBsZW4gLSAyKSkge1xyXG5cdFx0XHRcdHBhcnRzW2tdLnB1c2goc2VnbWVudFsxXSk7XHJcblx0XHRcdFx0aysrO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Ly8gc2ltcGxpZnkgZWFjaCBjbGlwcGVkIHBhcnQgb2YgdGhlIHBvbHlsaW5lXHJcblx0X3NpbXBsaWZ5UG9pbnRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgcGFydHMgPSB0aGlzLl9wYXJ0cyxcclxuXHRcdCAgICBsdSA9IEwuTGluZVV0aWw7XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHBhcnRzW2ldID0gbHUuc2ltcGxpZnkocGFydHNbaV0sIHRoaXMub3B0aW9ucy5zbW9vdGhGYWN0b3IpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVQYXRoOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX21hcCkgeyByZXR1cm47IH1cclxuXHJcblx0XHR0aGlzLl9jbGlwUG9pbnRzKCk7XHJcblx0XHR0aGlzLl9zaW1wbGlmeVBvaW50cygpO1xyXG5cclxuXHRcdEwuUGF0aC5wcm90b3R5cGUuX3VwZGF0ZVBhdGguY2FsbCh0aGlzKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5wb2x5bGluZSA9IGZ1bmN0aW9uIChsYXRsbmdzLCBvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLlBvbHlsaW5lKGxhdGxuZ3MsIG9wdGlvbnMpO1xyXG59O1xyXG5cblxuLypcclxuICogTC5Qb2x5VXRpbCBjb250YWlucyB1dGlsaXR5IGZ1bmN0aW9ucyBmb3IgcG9seWdvbnMgKGNsaXBwaW5nLCBldGMuKS5cclxuICovXHJcblxyXG4vKmpzaGludCBiaXR3aXNlOmZhbHNlICovIC8vIGFsbG93IGJpdHdpc2Ugb3BlcmF0aW9ucyBoZXJlXHJcblxyXG5MLlBvbHlVdGlsID0ge307XHJcblxyXG4vKlxyXG4gKiBTdXRoZXJsYW5kLUhvZGdlbWFuIHBvbHlnb24gY2xpcHBpbmcgYWxnb3JpdGhtLlxyXG4gKiBVc2VkIHRvIGF2b2lkIHJlbmRlcmluZyBwYXJ0cyBvZiBhIHBvbHlnb24gdGhhdCBhcmUgbm90IGN1cnJlbnRseSB2aXNpYmxlLlxyXG4gKi9cclxuTC5Qb2x5VXRpbC5jbGlwUG9seWdvbiA9IGZ1bmN0aW9uIChwb2ludHMsIGJvdW5kcykge1xyXG5cdHZhciBjbGlwcGVkUG9pbnRzLFxyXG5cdCAgICBlZGdlcyA9IFsxLCA0LCAyLCA4XSxcclxuXHQgICAgaSwgaiwgayxcclxuXHQgICAgYSwgYixcclxuXHQgICAgbGVuLCBlZGdlLCBwLFxyXG5cdCAgICBsdSA9IEwuTGluZVV0aWw7XHJcblxyXG5cdGZvciAoaSA9IDAsIGxlbiA9IHBvaW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0cG9pbnRzW2ldLl9jb2RlID0gbHUuX2dldEJpdENvZGUocG9pbnRzW2ldLCBib3VuZHMpO1xyXG5cdH1cclxuXHJcblx0Ly8gZm9yIGVhY2ggZWRnZSAobGVmdCwgYm90dG9tLCByaWdodCwgdG9wKVxyXG5cdGZvciAoayA9IDA7IGsgPCA0OyBrKyspIHtcclxuXHRcdGVkZ2UgPSBlZGdlc1trXTtcclxuXHRcdGNsaXBwZWRQb2ludHMgPSBbXTtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBwb2ludHMubGVuZ3RoLCBqID0gbGVuIC0gMTsgaSA8IGxlbjsgaiA9IGkrKykge1xyXG5cdFx0XHRhID0gcG9pbnRzW2ldO1xyXG5cdFx0XHRiID0gcG9pbnRzW2pdO1xyXG5cclxuXHRcdFx0Ly8gaWYgYSBpcyBpbnNpZGUgdGhlIGNsaXAgd2luZG93XHJcblx0XHRcdGlmICghKGEuX2NvZGUgJiBlZGdlKSkge1xyXG5cdFx0XHRcdC8vIGlmIGIgaXMgb3V0c2lkZSB0aGUgY2xpcCB3aW5kb3cgKGEtPmIgZ29lcyBvdXQgb2Ygc2NyZWVuKVxyXG5cdFx0XHRcdGlmIChiLl9jb2RlICYgZWRnZSkge1xyXG5cdFx0XHRcdFx0cCA9IGx1Ll9nZXRFZGdlSW50ZXJzZWN0aW9uKGIsIGEsIGVkZ2UsIGJvdW5kcyk7XHJcblx0XHRcdFx0XHRwLl9jb2RlID0gbHUuX2dldEJpdENvZGUocCwgYm91bmRzKTtcclxuXHRcdFx0XHRcdGNsaXBwZWRQb2ludHMucHVzaChwKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2xpcHBlZFBvaW50cy5wdXNoKGEpO1xyXG5cclxuXHRcdFx0Ly8gZWxzZSBpZiBiIGlzIGluc2lkZSB0aGUgY2xpcCB3aW5kb3cgKGEtPmIgZW50ZXJzIHRoZSBzY3JlZW4pXHJcblx0XHRcdH0gZWxzZSBpZiAoIShiLl9jb2RlICYgZWRnZSkpIHtcclxuXHRcdFx0XHRwID0gbHUuX2dldEVkZ2VJbnRlcnNlY3Rpb24oYiwgYSwgZWRnZSwgYm91bmRzKTtcclxuXHRcdFx0XHRwLl9jb2RlID0gbHUuX2dldEJpdENvZGUocCwgYm91bmRzKTtcclxuXHRcdFx0XHRjbGlwcGVkUG9pbnRzLnB1c2gocCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHBvaW50cyA9IGNsaXBwZWRQb2ludHM7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcG9pbnRzO1xyXG59O1xyXG5cblxuLypcclxuICogTC5Qb2x5Z29uIGlzIHVzZWQgdG8gZGlzcGxheSBwb2x5Z29ucyBvbiBhIG1hcC5cclxuICovXHJcblxyXG5MLlBvbHlnb24gPSBMLlBvbHlsaW5lLmV4dGVuZCh7XHJcblx0b3B0aW9uczoge1xyXG5cdFx0ZmlsbDogdHJ1ZVxyXG5cdH0sXHJcblxyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmdzLCBvcHRpb25zKSB7XHJcblx0XHRMLlBvbHlsaW5lLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbGF0bG5ncywgb3B0aW9ucyk7XHJcblx0XHR0aGlzLl9pbml0V2l0aEhvbGVzKGxhdGxuZ3MpO1xyXG5cdH0sXHJcblxyXG5cdF9pbml0V2l0aEhvbGVzOiBmdW5jdGlvbiAobGF0bG5ncykge1xyXG5cdFx0dmFyIGksIGxlbiwgaG9sZTtcclxuXHRcdGlmIChsYXRsbmdzICYmIEwuVXRpbC5pc0FycmF5KGxhdGxuZ3NbMF0pICYmICh0eXBlb2YgbGF0bG5nc1swXVswXSAhPT0gJ251bWJlcicpKSB7XHJcblx0XHRcdHRoaXMuX2xhdGxuZ3MgPSB0aGlzLl9jb252ZXJ0TGF0TG5ncyhsYXRsbmdzWzBdKTtcclxuXHRcdFx0dGhpcy5faG9sZXMgPSBsYXRsbmdzLnNsaWNlKDEpO1xyXG5cclxuXHRcdFx0Zm9yIChpID0gMCwgbGVuID0gdGhpcy5faG9sZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRob2xlID0gdGhpcy5faG9sZXNbaV0gPSB0aGlzLl9jb252ZXJ0TGF0TG5ncyh0aGlzLl9ob2xlc1tpXSk7XHJcblx0XHRcdFx0aWYgKGhvbGVbMF0uZXF1YWxzKGhvbGVbaG9sZS5sZW5ndGggLSAxXSkpIHtcclxuXHRcdFx0XHRcdGhvbGUucG9wKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gZmlsdGVyIG91dCBsYXN0IHBvaW50IGlmIGl0cyBlcXVhbCB0byB0aGUgZmlyc3Qgb25lXHJcblx0XHRsYXRsbmdzID0gdGhpcy5fbGF0bG5ncztcclxuXHJcblx0XHRpZiAobGF0bG5ncy5sZW5ndGggPj0gMiAmJiBsYXRsbmdzWzBdLmVxdWFscyhsYXRsbmdzW2xhdGxuZ3MubGVuZ3RoIC0gMV0pKSB7XHJcblx0XHRcdGxhdGxuZ3MucG9wKCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0cHJvamVjdExhdGxuZ3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdEwuUG9seWxpbmUucHJvdG90eXBlLnByb2plY3RMYXRsbmdzLmNhbGwodGhpcyk7XHJcblxyXG5cdFx0Ly8gcHJvamVjdCBwb2x5Z29uIGhvbGVzIHBvaW50c1xyXG5cdFx0Ly8gVE9ETyBtb3ZlIHRoaXMgbG9naWMgdG8gUG9seWxpbmUgdG8gZ2V0IHJpZCBvZiBkdXBsaWNhdGlvblxyXG5cdFx0dGhpcy5faG9sZVBvaW50cyA9IFtdO1xyXG5cclxuXHRcdGlmICghdGhpcy5faG9sZXMpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIGksIGosIGxlbiwgbGVuMjtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9ob2xlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR0aGlzLl9ob2xlUG9pbnRzW2ldID0gW107XHJcblxyXG5cdFx0XHRmb3IgKGogPSAwLCBsZW4yID0gdGhpcy5faG9sZXNbaV0ubGVuZ3RoOyBqIDwgbGVuMjsgaisrKSB7XHJcblx0XHRcdFx0dGhpcy5faG9sZVBvaW50c1tpXVtqXSA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQodGhpcy5faG9sZXNbaV1bal0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0c2V0TGF0TG5nczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcclxuXHRcdGlmIChsYXRsbmdzICYmIEwuVXRpbC5pc0FycmF5KGxhdGxuZ3NbMF0pICYmICh0eXBlb2YgbGF0bG5nc1swXVswXSAhPT0gJ251bWJlcicpKSB7XHJcblx0XHRcdHRoaXMuX2luaXRXaXRoSG9sZXMobGF0bG5ncyk7XHJcblx0XHRcdHJldHVybiB0aGlzLnJlZHJhdygpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIEwuUG9seWxpbmUucHJvdG90eXBlLnNldExhdExuZ3MuY2FsbCh0aGlzLCBsYXRsbmdzKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfY2xpcFBvaW50czogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHBvaW50cyA9IHRoaXMuX29yaWdpbmFsUG9pbnRzLFxyXG5cdFx0ICAgIG5ld1BhcnRzID0gW107XHJcblxyXG5cdFx0dGhpcy5fcGFydHMgPSBbcG9pbnRzXS5jb25jYXQodGhpcy5faG9sZVBvaW50cyk7XHJcblxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5ub0NsaXApIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3BhcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHZhciBjbGlwcGVkID0gTC5Qb2x5VXRpbC5jbGlwUG9seWdvbih0aGlzLl9wYXJ0c1tpXSwgdGhpcy5fbWFwLl9wYXRoVmlld3BvcnQpO1xyXG5cdFx0XHRpZiAoY2xpcHBlZC5sZW5ndGgpIHtcclxuXHRcdFx0XHRuZXdQYXJ0cy5wdXNoKGNsaXBwZWQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fcGFydHMgPSBuZXdQYXJ0cztcclxuXHR9LFxyXG5cclxuXHRfZ2V0UGF0aFBhcnRTdHI6IGZ1bmN0aW9uIChwb2ludHMpIHtcclxuXHRcdHZhciBzdHIgPSBMLlBvbHlsaW5lLnByb3RvdHlwZS5fZ2V0UGF0aFBhcnRTdHIuY2FsbCh0aGlzLCBwb2ludHMpO1xyXG5cdFx0cmV0dXJuIHN0ciArIChMLkJyb3dzZXIuc3ZnID8gJ3onIDogJ3gnKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5wb2x5Z29uID0gZnVuY3Rpb24gKGxhdGxuZ3MsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuUG9seWdvbihsYXRsbmdzLCBvcHRpb25zKTtcclxufTtcclxuXG5cbi8qXHJcbiAqIENvbnRhaW5zIEwuTXVsdGlQb2x5bGluZSBhbmQgTC5NdWx0aVBvbHlnb24gbGF5ZXJzLlxyXG4gKi9cclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcblx0ZnVuY3Rpb24gY3JlYXRlTXVsdGkoS2xhc3MpIHtcclxuXHJcblx0XHRyZXR1cm4gTC5GZWF0dXJlR3JvdXAuZXh0ZW5kKHtcclxuXHJcblx0XHRcdGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmdzLCBvcHRpb25zKSB7XHJcblx0XHRcdFx0dGhpcy5fbGF5ZXJzID0ge307XHJcblx0XHRcdFx0dGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XHJcblx0XHRcdFx0dGhpcy5zZXRMYXRMbmdzKGxhdGxuZ3MpO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0c2V0TGF0TG5nczogZnVuY3Rpb24gKGxhdGxuZ3MpIHtcclxuXHRcdFx0XHR2YXIgaSA9IDAsXHJcblx0XHRcdFx0ICAgIGxlbiA9IGxhdGxuZ3MubGVuZ3RoO1xyXG5cclxuXHRcdFx0XHR0aGlzLmVhY2hMYXllcihmdW5jdGlvbiAobGF5ZXIpIHtcclxuXHRcdFx0XHRcdGlmIChpIDwgbGVuKSB7XHJcblx0XHRcdFx0XHRcdGxheWVyLnNldExhdExuZ3MobGF0bG5nc1tpKytdKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGF5ZXIobGF5ZXIpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sIHRoaXMpO1xyXG5cclxuXHRcdFx0XHR3aGlsZSAoaSA8IGxlbikge1xyXG5cdFx0XHRcdFx0dGhpcy5hZGRMYXllcihuZXcgS2xhc3MobGF0bG5nc1tpKytdLCB0aGlzLl9vcHRpb25zKSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdGdldExhdExuZ3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR2YXIgbGF0bG5ncyA9IFtdO1xyXG5cclxuXHRcdFx0XHR0aGlzLmVhY2hMYXllcihmdW5jdGlvbiAobGF5ZXIpIHtcclxuXHRcdFx0XHRcdGxhdGxuZ3MucHVzaChsYXllci5nZXRMYXRMbmdzKCkpO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gbGF0bG5ncztcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRMLk11bHRpUG9seWxpbmUgPSBjcmVhdGVNdWx0aShMLlBvbHlsaW5lKTtcclxuXHRMLk11bHRpUG9seWdvbiA9IGNyZWF0ZU11bHRpKEwuUG9seWdvbik7XHJcblxyXG5cdEwubXVsdGlQb2x5bGluZSA9IGZ1bmN0aW9uIChsYXRsbmdzLCBvcHRpb25zKSB7XHJcblx0XHRyZXR1cm4gbmV3IEwuTXVsdGlQb2x5bGluZShsYXRsbmdzLCBvcHRpb25zKTtcclxuXHR9O1xyXG5cclxuXHRMLm11bHRpUG9seWdvbiA9IGZ1bmN0aW9uIChsYXRsbmdzLCBvcHRpb25zKSB7XHJcblx0XHRyZXR1cm4gbmV3IEwuTXVsdGlQb2x5Z29uKGxhdGxuZ3MsIG9wdGlvbnMpO1xyXG5cdH07XHJcbn0oKSk7XHJcblxuXG4vKlxyXG4gKiBMLlJlY3RhbmdsZSBleHRlbmRzIFBvbHlnb24gYW5kIGNyZWF0ZXMgYSByZWN0YW5nbGUgd2hlbiBwYXNzZWQgYSBMYXRMbmdCb3VuZHMgb2JqZWN0LlxyXG4gKi9cclxuXHJcbkwuUmVjdGFuZ2xlID0gTC5Qb2x5Z29uLmV4dGVuZCh7XHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdExuZ0JvdW5kcywgb3B0aW9ucykge1xyXG5cdFx0TC5Qb2x5Z29uLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgdGhpcy5fYm91bmRzVG9MYXRMbmdzKGxhdExuZ0JvdW5kcyksIG9wdGlvbnMpO1xyXG5cdH0sXHJcblxyXG5cdHNldEJvdW5kczogZnVuY3Rpb24gKGxhdExuZ0JvdW5kcykge1xyXG5cdFx0dGhpcy5zZXRMYXRMbmdzKHRoaXMuX2JvdW5kc1RvTGF0TG5ncyhsYXRMbmdCb3VuZHMpKTtcclxuXHR9LFxyXG5cclxuXHRfYm91bmRzVG9MYXRMbmdzOiBmdW5jdGlvbiAobGF0TG5nQm91bmRzKSB7XHJcblx0XHRsYXRMbmdCb3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhsYXRMbmdCb3VuZHMpO1xyXG5cdFx0cmV0dXJuIFtcclxuXHRcdFx0bGF0TG5nQm91bmRzLmdldFNvdXRoV2VzdCgpLFxyXG5cdFx0XHRsYXRMbmdCb3VuZHMuZ2V0Tm9ydGhXZXN0KCksXHJcblx0XHRcdGxhdExuZ0JvdW5kcy5nZXROb3J0aEVhc3QoKSxcclxuXHRcdFx0bGF0TG5nQm91bmRzLmdldFNvdXRoRWFzdCgpXHJcblx0XHRdO1xyXG5cdH1cclxufSk7XHJcblxyXG5MLnJlY3RhbmdsZSA9IGZ1bmN0aW9uIChsYXRMbmdCb3VuZHMsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuUmVjdGFuZ2xlKGxhdExuZ0JvdW5kcywgb3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBMLkNpcmNsZSBpcyBhIGNpcmNsZSBvdmVybGF5ICh3aXRoIGEgY2VydGFpbiByYWRpdXMgaW4gbWV0ZXJzKS5cclxuICovXHJcblxyXG5MLkNpcmNsZSA9IEwuUGF0aC5leHRlbmQoe1xyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHJhZGl1cywgb3B0aW9ucykge1xyXG5cdFx0TC5QYXRoLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgb3B0aW9ucyk7XHJcblxyXG5cdFx0dGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcclxuXHRcdHRoaXMuX21SYWRpdXMgPSByYWRpdXM7XHJcblx0fSxcclxuXHJcblx0b3B0aW9uczoge1xyXG5cdFx0ZmlsbDogdHJ1ZVxyXG5cdH0sXHJcblxyXG5cdHNldExhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xyXG5cdFx0dGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcclxuXHRcdHJldHVybiB0aGlzLnJlZHJhdygpO1xyXG5cdH0sXHJcblxyXG5cdHNldFJhZGl1czogZnVuY3Rpb24gKHJhZGl1cykge1xyXG5cdFx0dGhpcy5fbVJhZGl1cyA9IHJhZGl1cztcclxuXHRcdHJldHVybiB0aGlzLnJlZHJhdygpO1xyXG5cdH0sXHJcblxyXG5cdHByb2plY3RMYXRsbmdzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgbG5nUmFkaXVzID0gdGhpcy5fZ2V0TG5nUmFkaXVzKCksXHJcblx0XHQgICAgbGF0bG5nID0gdGhpcy5fbGF0bG5nLFxyXG5cdFx0ICAgIHBvaW50TGVmdCA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQoW2xhdGxuZy5sYXQsIGxhdGxuZy5sbmcgLSBsbmdSYWRpdXNdKTtcclxuXHJcblx0XHR0aGlzLl9wb2ludCA9IHRoaXMuX21hcC5sYXRMbmdUb0xheWVyUG9pbnQobGF0bG5nKTtcclxuXHRcdHRoaXMuX3JhZGl1cyA9IE1hdGgubWF4KHRoaXMuX3BvaW50LnggLSBwb2ludExlZnQueCwgMSk7XHJcblx0fSxcclxuXHJcblx0Z2V0Qm91bmRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgbG5nUmFkaXVzID0gdGhpcy5fZ2V0TG5nUmFkaXVzKCksXHJcblx0XHQgICAgbGF0UmFkaXVzID0gKHRoaXMuX21SYWRpdXMgLyA0MDA3NTAxNykgKiAzNjAsXHJcblx0XHQgICAgbGF0bG5nID0gdGhpcy5fbGF0bG5nO1xyXG5cclxuXHRcdHJldHVybiBuZXcgTC5MYXRMbmdCb3VuZHMoXHJcblx0XHQgICAgICAgIFtsYXRsbmcubGF0IC0gbGF0UmFkaXVzLCBsYXRsbmcubG5nIC0gbG5nUmFkaXVzXSxcclxuXHRcdCAgICAgICAgW2xhdGxuZy5sYXQgKyBsYXRSYWRpdXMsIGxhdGxuZy5sbmcgKyBsbmdSYWRpdXNdKTtcclxuXHR9LFxyXG5cclxuXHRnZXRMYXRMbmc6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9sYXRsbmc7XHJcblx0fSxcclxuXHJcblx0Z2V0UGF0aFN0cmluZzogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHAgPSB0aGlzLl9wb2ludCxcclxuXHRcdCAgICByID0gdGhpcy5fcmFkaXVzO1xyXG5cclxuXHRcdGlmICh0aGlzLl9jaGVja0lmRW1wdHkoKSkge1xyXG5cdFx0XHRyZXR1cm4gJyc7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKEwuQnJvd3Nlci5zdmcpIHtcclxuXHRcdFx0cmV0dXJuICdNJyArIHAueCArICcsJyArIChwLnkgLSByKSArXHJcblx0XHRcdCAgICAgICAnQScgKyByICsgJywnICsgciArICcsMCwxLDEsJyArXHJcblx0XHRcdCAgICAgICAocC54IC0gMC4xKSArICcsJyArIChwLnkgLSByKSArICcgeic7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRwLl9yb3VuZCgpO1xyXG5cdFx0XHRyID0gTWF0aC5yb3VuZChyKTtcclxuXHRcdFx0cmV0dXJuICdBTCAnICsgcC54ICsgJywnICsgcC55ICsgJyAnICsgciArICcsJyArIHIgKyAnIDAsJyArICg2NTUzNSAqIDM2MCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Z2V0UmFkaXVzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbVJhZGl1cztcclxuXHR9LFxyXG5cclxuXHQvLyBUT0RPIEVhcnRoIGhhcmRjb2RlZCwgbW92ZSBpbnRvIHByb2plY3Rpb24gY29kZSFcclxuXHJcblx0X2dldExhdFJhZGl1czogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9tUmFkaXVzIC8gNDAwNzUwMTcpICogMzYwO1xyXG5cdH0sXHJcblxyXG5cdF9nZXRMbmdSYWRpdXM6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9nZXRMYXRSYWRpdXMoKSAvIE1hdGguY29zKEwuTGF0TG5nLkRFR19UT19SQUQgKiB0aGlzLl9sYXRsbmcubGF0KTtcclxuXHR9LFxyXG5cclxuXHRfY2hlY2tJZkVtcHR5OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX21hcCkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHR2YXIgdnAgPSB0aGlzLl9tYXAuX3BhdGhWaWV3cG9ydCxcclxuXHRcdCAgICByID0gdGhpcy5fcmFkaXVzLFxyXG5cdFx0ICAgIHAgPSB0aGlzLl9wb2ludDtcclxuXHJcblx0XHRyZXR1cm4gcC54IC0gciA+IHZwLm1heC54IHx8IHAueSAtIHIgPiB2cC5tYXgueSB8fFxyXG5cdFx0ICAgICAgIHAueCArIHIgPCB2cC5taW4ueCB8fCBwLnkgKyByIDwgdnAubWluLnk7XHJcblx0fVxyXG59KTtcclxuXHJcbkwuY2lyY2xlID0gZnVuY3Rpb24gKGxhdGxuZywgcmFkaXVzLCBvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLkNpcmNsZShsYXRsbmcsIHJhZGl1cywgb3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBMLkNpcmNsZU1hcmtlciBpcyBhIGNpcmNsZSBvdmVybGF5IHdpdGggYSBwZXJtYW5lbnQgcGl4ZWwgcmFkaXVzLlxyXG4gKi9cclxuXHJcbkwuQ2lyY2xlTWFya2VyID0gTC5DaXJjbGUuZXh0ZW5kKHtcclxuXHRvcHRpb25zOiB7XHJcblx0XHRyYWRpdXM6IDEwLFxyXG5cdFx0d2VpZ2h0OiAyXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xyXG5cdFx0TC5DaXJjbGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBsYXRsbmcsIG51bGwsIG9wdGlvbnMpO1xyXG5cdFx0dGhpcy5fcmFkaXVzID0gdGhpcy5vcHRpb25zLnJhZGl1cztcclxuXHR9LFxyXG5cclxuXHRwcm9qZWN0TGF0bG5nczogZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhpcy5fcG9pbnQgPSB0aGlzLl9tYXAubGF0TG5nVG9MYXllclBvaW50KHRoaXMuX2xhdGxuZyk7XHJcblx0fSxcclxuXHJcblx0X3VwZGF0ZVN0eWxlIDogZnVuY3Rpb24gKCkge1xyXG5cdFx0TC5DaXJjbGUucHJvdG90eXBlLl91cGRhdGVTdHlsZS5jYWxsKHRoaXMpO1xyXG5cdFx0dGhpcy5zZXRSYWRpdXModGhpcy5vcHRpb25zLnJhZGl1cyk7XHJcblx0fSxcclxuXHJcblx0c2V0TGF0TG5nOiBmdW5jdGlvbiAobGF0bG5nKSB7XHJcblx0XHRMLkNpcmNsZS5wcm90b3R5cGUuc2V0TGF0TG5nLmNhbGwodGhpcywgbGF0bG5nKTtcclxuXHRcdGlmICh0aGlzLl9wb3B1cCAmJiB0aGlzLl9wb3B1cC5faXNPcGVuKSB7XHJcblx0XHRcdHRoaXMuX3BvcHVwLnNldExhdExuZyhsYXRsbmcpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0c2V0UmFkaXVzOiBmdW5jdGlvbiAocmFkaXVzKSB7XHJcblx0XHR0aGlzLm9wdGlvbnMucmFkaXVzID0gdGhpcy5fcmFkaXVzID0gcmFkaXVzO1xyXG5cdFx0cmV0dXJuIHRoaXMucmVkcmF3KCk7XHJcblx0fSxcclxuXHJcblx0Z2V0UmFkaXVzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fcmFkaXVzO1xyXG5cdH1cclxufSk7XHJcblxyXG5MLmNpcmNsZU1hcmtlciA9IGZ1bmN0aW9uIChsYXRsbmcsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuQ2lyY2xlTWFya2VyKGxhdGxuZywgb3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxyXG4gKiBFeHRlbmRzIEwuUG9seWxpbmUgdG8gYmUgYWJsZSB0byBtYW51YWxseSBkZXRlY3QgY2xpY2tzIG9uIENhbnZhcy1yZW5kZXJlZCBwb2x5bGluZXMuXHJcbiAqL1xyXG5cclxuTC5Qb2x5bGluZS5pbmNsdWRlKCFMLlBhdGguQ0FOVkFTID8ge30gOiB7XHJcblx0X2NvbnRhaW5zUG9pbnQ6IGZ1bmN0aW9uIChwLCBjbG9zZWQpIHtcclxuXHRcdHZhciBpLCBqLCBrLCBsZW4sIGxlbjIsIGRpc3QsIHBhcnQsXHJcblx0XHQgICAgdyA9IHRoaXMub3B0aW9ucy53ZWlnaHQgLyAyO1xyXG5cclxuXHRcdGlmIChMLkJyb3dzZXIudG91Y2gpIHtcclxuXHRcdFx0dyArPSAxMDsgLy8gcG9seWxpbmUgY2xpY2sgdG9sZXJhbmNlIG9uIHRvdWNoIGRldmljZXNcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRwYXJ0ID0gdGhpcy5fcGFydHNbaV07XHJcblx0XHRcdGZvciAoaiA9IDAsIGxlbjIgPSBwYXJ0Lmxlbmd0aCwgayA9IGxlbjIgLSAxOyBqIDwgbGVuMjsgayA9IGorKykge1xyXG5cdFx0XHRcdGlmICghY2xvc2VkICYmIChqID09PSAwKSkge1xyXG5cdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkaXN0ID0gTC5MaW5lVXRpbC5wb2ludFRvU2VnbWVudERpc3RhbmNlKHAsIHBhcnRba10sIHBhcnRbal0pO1xyXG5cclxuXHRcdFx0XHRpZiAoZGlzdCA8PSB3KSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn0pO1xyXG5cblxuLypcclxuICogRXh0ZW5kcyBMLlBvbHlnb24gdG8gYmUgYWJsZSB0byBtYW51YWxseSBkZXRlY3QgY2xpY2tzIG9uIENhbnZhcy1yZW5kZXJlZCBwb2x5Z29ucy5cclxuICovXHJcblxyXG5MLlBvbHlnb24uaW5jbHVkZSghTC5QYXRoLkNBTlZBUyA/IHt9IDoge1xyXG5cdF9jb250YWluc1BvaW50OiBmdW5jdGlvbiAocCkge1xyXG5cdFx0dmFyIGluc2lkZSA9IGZhbHNlLFxyXG5cdFx0ICAgIHBhcnQsIHAxLCBwMixcclxuXHRcdCAgICBpLCBqLCBrLFxyXG5cdFx0ICAgIGxlbiwgbGVuMjtcclxuXHJcblx0XHQvLyBUT0RPIG9wdGltaXphdGlvbjogY2hlY2sgaWYgd2l0aGluIGJvdW5kcyBmaXJzdFxyXG5cclxuXHRcdGlmIChMLlBvbHlsaW5lLnByb3RvdHlwZS5fY29udGFpbnNQb2ludC5jYWxsKHRoaXMsIHAsIHRydWUpKSB7XHJcblx0XHRcdC8vIGNsaWNrIG9uIHBvbHlnb24gYm9yZGVyXHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHJheSBjYXN0aW5nIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGlmIHBvaW50IGlzIGluIHBvbHlnb25cclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9wYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRwYXJ0ID0gdGhpcy5fcGFydHNbaV07XHJcblxyXG5cdFx0XHRmb3IgKGogPSAwLCBsZW4yID0gcGFydC5sZW5ndGgsIGsgPSBsZW4yIC0gMTsgaiA8IGxlbjI7IGsgPSBqKyspIHtcclxuXHRcdFx0XHRwMSA9IHBhcnRbal07XHJcblx0XHRcdFx0cDIgPSBwYXJ0W2tdO1xyXG5cclxuXHRcdFx0XHRpZiAoKChwMS55ID4gcC55KSAhPT0gKHAyLnkgPiBwLnkpKSAmJlxyXG5cdFx0XHRcdFx0XHQocC54IDwgKHAyLnggLSBwMS54KSAqIChwLnkgLSBwMS55KSAvIChwMi55IC0gcDEueSkgKyBwMS54KSkge1xyXG5cdFx0XHRcdFx0aW5zaWRlID0gIWluc2lkZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gaW5zaWRlO1xyXG5cdH1cclxufSk7XHJcblxuXG4vKlxyXG4gKiBFeHRlbmRzIEwuQ2lyY2xlIHdpdGggQ2FudmFzLXNwZWNpZmljIGNvZGUuXHJcbiAqL1xyXG5cclxuTC5DaXJjbGUuaW5jbHVkZSghTC5QYXRoLkNBTlZBUyA/IHt9IDoge1xyXG5cdF9kcmF3UGF0aDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHAgPSB0aGlzLl9wb2ludDtcclxuXHRcdHRoaXMuX2N0eC5iZWdpblBhdGgoKTtcclxuXHRcdHRoaXMuX2N0eC5hcmMocC54LCBwLnksIHRoaXMuX3JhZGl1cywgMCwgTWF0aC5QSSAqIDIsIGZhbHNlKTtcclxuXHR9LFxyXG5cclxuXHRfY29udGFpbnNQb2ludDogZnVuY3Rpb24gKHApIHtcclxuXHRcdHZhciBjZW50ZXIgPSB0aGlzLl9wb2ludCxcclxuXHRcdCAgICB3MiA9IHRoaXMub3B0aW9ucy5zdHJva2UgPyB0aGlzLm9wdGlvbnMud2VpZ2h0IC8gMiA6IDA7XHJcblxyXG5cdFx0cmV0dXJuIChwLmRpc3RhbmNlVG8oY2VudGVyKSA8PSB0aGlzLl9yYWRpdXMgKyB3Mik7XHJcblx0fVxyXG59KTtcclxuXG5cbi8qXG4gKiBDaXJjbGVNYXJrZXIgY2FudmFzIHNwZWNpZmljIGRyYXdpbmcgcGFydHMuXG4gKi9cblxuTC5DaXJjbGVNYXJrZXIuaW5jbHVkZSghTC5QYXRoLkNBTlZBUyA/IHt9IDoge1xuXHRfdXBkYXRlU3R5bGU6IGZ1bmN0aW9uICgpIHtcblx0XHRMLlBhdGgucHJvdG90eXBlLl91cGRhdGVTdHlsZS5jYWxsKHRoaXMpO1xuXHR9XG59KTtcblxuXG4vKlxyXG4gKiBMLkdlb0pTT04gdHVybnMgYW55IEdlb0pTT04gZGF0YSBpbnRvIGEgTGVhZmxldCBsYXllci5cclxuICovXHJcblxyXG5MLkdlb0pTT04gPSBMLkZlYXR1cmVHcm91cC5leHRlbmQoe1xyXG5cclxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAoZ2VvanNvbiwgb3B0aW9ucykge1xyXG5cdFx0TC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuXHRcdHRoaXMuX2xheWVycyA9IHt9O1xyXG5cclxuXHRcdGlmIChnZW9qc29uKSB7XHJcblx0XHRcdHRoaXMuYWRkRGF0YShnZW9qc29uKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRhZGREYXRhOiBmdW5jdGlvbiAoZ2VvanNvbikge1xyXG5cdFx0dmFyIGZlYXR1cmVzID0gTC5VdGlsLmlzQXJyYXkoZ2VvanNvbikgPyBnZW9qc29uIDogZ2VvanNvbi5mZWF0dXJlcyxcclxuXHRcdCAgICBpLCBsZW4sIGZlYXR1cmU7XHJcblxyXG5cdFx0aWYgKGZlYXR1cmVzKSB7XHJcblx0XHRcdGZvciAoaSA9IDAsIGxlbiA9IGZlYXR1cmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0Ly8gT25seSBhZGQgdGhpcyBpZiBnZW9tZXRyeSBvciBnZW9tZXRyaWVzIGFyZSBzZXQgYW5kIG5vdCBudWxsXHJcblx0XHRcdFx0ZmVhdHVyZSA9IGZlYXR1cmVzW2ldO1xyXG5cdFx0XHRcdGlmIChmZWF0dXJlLmdlb21ldHJpZXMgfHwgZmVhdHVyZS5nZW9tZXRyeSB8fCBmZWF0dXJlLmZlYXR1cmVzIHx8IGZlYXR1cmUuY29vcmRpbmF0ZXMpIHtcclxuXHRcdFx0XHRcdHRoaXMuYWRkRGF0YShmZWF0dXJlc1tpXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLmZpbHRlciAmJiAhb3B0aW9ucy5maWx0ZXIoZ2VvanNvbikpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0dmFyIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllcihnZW9qc29uLCBvcHRpb25zLnBvaW50VG9MYXllciwgb3B0aW9ucy5jb29yZHNUb0xhdExuZywgb3B0aW9ucyk7XHJcblx0XHRsYXllci5mZWF0dXJlID0gTC5HZW9KU09OLmFzRmVhdHVyZShnZW9qc29uKTtcclxuXHJcblx0XHRsYXllci5kZWZhdWx0T3B0aW9ucyA9IGxheWVyLm9wdGlvbnM7XHJcblx0XHR0aGlzLnJlc2V0U3R5bGUobGF5ZXIpO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLm9uRWFjaEZlYXR1cmUpIHtcclxuXHRcdFx0b3B0aW9ucy5vbkVhY2hGZWF0dXJlKGdlb2pzb24sIGxheWVyKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcy5hZGRMYXllcihsYXllcik7XHJcblx0fSxcclxuXHJcblx0cmVzZXRTdHlsZTogZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHR2YXIgc3R5bGUgPSB0aGlzLm9wdGlvbnMuc3R5bGU7XHJcblx0XHRpZiAoc3R5bGUpIHtcclxuXHRcdFx0Ly8gcmVzZXQgYW55IGN1c3RvbSBzdHlsZXNcclxuXHRcdFx0TC5VdGlsLmV4dGVuZChsYXllci5vcHRpb25zLCBsYXllci5kZWZhdWx0T3B0aW9ucyk7XHJcblxyXG5cdFx0XHR0aGlzLl9zZXRMYXllclN0eWxlKGxheWVyLCBzdHlsZSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0c2V0U3R5bGU6IGZ1bmN0aW9uIChzdHlsZSkge1xyXG5cdFx0dGhpcy5lYWNoTGF5ZXIoZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHRcdHRoaXMuX3NldExheWVyU3R5bGUobGF5ZXIsIHN0eWxlKTtcclxuXHRcdH0sIHRoaXMpO1xyXG5cdH0sXHJcblxyXG5cdF9zZXRMYXllclN0eWxlOiBmdW5jdGlvbiAobGF5ZXIsIHN0eWxlKSB7XHJcblx0XHRpZiAodHlwZW9mIHN0eWxlID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHN0eWxlID0gc3R5bGUobGF5ZXIuZmVhdHVyZSk7XHJcblx0XHR9XHJcblx0XHRpZiAobGF5ZXIuc2V0U3R5bGUpIHtcclxuXHRcdFx0bGF5ZXIuc2V0U3R5bGUoc3R5bGUpO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5MLmV4dGVuZChMLkdlb0pTT04sIHtcclxuXHRnZW9tZXRyeVRvTGF5ZXI6IGZ1bmN0aW9uIChnZW9qc29uLCBwb2ludFRvTGF5ZXIsIGNvb3Jkc1RvTGF0TG5nLCB2ZWN0b3JPcHRpb25zKSB7XHJcblx0XHR2YXIgZ2VvbWV0cnkgPSBnZW9qc29uLnR5cGUgPT09ICdGZWF0dXJlJyA/IGdlb2pzb24uZ2VvbWV0cnkgOiBnZW9qc29uLFxyXG5cdFx0ICAgIGNvb3JkcyA9IGdlb21ldHJ5LmNvb3JkaW5hdGVzLFxyXG5cdFx0ICAgIGxheWVycyA9IFtdLFxyXG5cdFx0ICAgIGxhdGxuZywgbGF0bG5ncywgaSwgbGVuO1xyXG5cclxuXHRcdGNvb3Jkc1RvTGF0TG5nID0gY29vcmRzVG9MYXRMbmcgfHwgdGhpcy5jb29yZHNUb0xhdExuZztcclxuXHJcblx0XHRzd2l0Y2ggKGdlb21ldHJ5LnR5cGUpIHtcclxuXHRcdGNhc2UgJ1BvaW50JzpcclxuXHRcdFx0bGF0bG5nID0gY29vcmRzVG9MYXRMbmcoY29vcmRzKTtcclxuXHRcdFx0cmV0dXJuIHBvaW50VG9MYXllciA/IHBvaW50VG9MYXllcihnZW9qc29uLCBsYXRsbmcpIDogbmV3IEwuTWFya2VyKGxhdGxuZyk7XHJcblxyXG5cdFx0Y2FzZSAnTXVsdGlQb2ludCc6XHJcblx0XHRcdGZvciAoaSA9IDAsIGxlbiA9IGNvb3Jkcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGxhdGxuZyA9IGNvb3Jkc1RvTGF0TG5nKGNvb3Jkc1tpXSk7XHJcblx0XHRcdFx0bGF5ZXJzLnB1c2gocG9pbnRUb0xheWVyID8gcG9pbnRUb0xheWVyKGdlb2pzb24sIGxhdGxuZykgOiBuZXcgTC5NYXJrZXIobGF0bG5nKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIG5ldyBMLkZlYXR1cmVHcm91cChsYXllcnMpO1xyXG5cclxuXHRcdGNhc2UgJ0xpbmVTdHJpbmcnOlxyXG5cdFx0XHRsYXRsbmdzID0gdGhpcy5jb29yZHNUb0xhdExuZ3MoY29vcmRzLCAwLCBjb29yZHNUb0xhdExuZyk7XHJcblx0XHRcdHJldHVybiBuZXcgTC5Qb2x5bGluZShsYXRsbmdzLCB2ZWN0b3JPcHRpb25zKTtcclxuXHJcblx0XHRjYXNlICdQb2x5Z29uJzpcclxuXHRcdFx0aWYgKGNvb3Jkcy5sZW5ndGggPT09IDIgJiYgIWNvb3Jkc1sxXS5sZW5ndGgpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgR2VvSlNPTiBvYmplY3QuJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0bGF0bG5ncyA9IHRoaXMuY29vcmRzVG9MYXRMbmdzKGNvb3JkcywgMSwgY29vcmRzVG9MYXRMbmcpO1xyXG5cdFx0XHRyZXR1cm4gbmV3IEwuUG9seWdvbihsYXRsbmdzLCB2ZWN0b3JPcHRpb25zKTtcclxuXHJcblx0XHRjYXNlICdNdWx0aUxpbmVTdHJpbmcnOlxyXG5cdFx0XHRsYXRsbmdzID0gdGhpcy5jb29yZHNUb0xhdExuZ3MoY29vcmRzLCAxLCBjb29yZHNUb0xhdExuZyk7XHJcblx0XHRcdHJldHVybiBuZXcgTC5NdWx0aVBvbHlsaW5lKGxhdGxuZ3MsIHZlY3Rvck9wdGlvbnMpO1xyXG5cclxuXHRcdGNhc2UgJ011bHRpUG9seWdvbic6XHJcblx0XHRcdGxhdGxuZ3MgPSB0aGlzLmNvb3Jkc1RvTGF0TG5ncyhjb29yZHMsIDIsIGNvb3Jkc1RvTGF0TG5nKTtcclxuXHRcdFx0cmV0dXJuIG5ldyBMLk11bHRpUG9seWdvbihsYXRsbmdzLCB2ZWN0b3JPcHRpb25zKTtcclxuXHJcblx0XHRjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxyXG5cdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBnZW9tZXRyeS5nZW9tZXRyaWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblxyXG5cdFx0XHRcdGxheWVycy5wdXNoKHRoaXMuZ2VvbWV0cnlUb0xheWVyKHtcclxuXHRcdFx0XHRcdGdlb21ldHJ5OiBnZW9tZXRyeS5nZW9tZXRyaWVzW2ldLFxyXG5cdFx0XHRcdFx0dHlwZTogJ0ZlYXR1cmUnLFxyXG5cdFx0XHRcdFx0cHJvcGVydGllczogZ2VvanNvbi5wcm9wZXJ0aWVzXHJcblx0XHRcdFx0fSwgcG9pbnRUb0xheWVyLCBjb29yZHNUb0xhdExuZywgdmVjdG9yT3B0aW9ucykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBuZXcgTC5GZWF0dXJlR3JvdXAobGF5ZXJzKTtcclxuXHJcblx0XHRkZWZhdWx0OlxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgR2VvSlNPTiBvYmplY3QuJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Y29vcmRzVG9MYXRMbmc6IGZ1bmN0aW9uIChjb29yZHMpIHsgLy8gKEFycmF5WywgQm9vbGVhbl0pIC0+IExhdExuZ1xyXG5cdFx0cmV0dXJuIG5ldyBMLkxhdExuZyhjb29yZHNbMV0sIGNvb3Jkc1swXSwgY29vcmRzWzJdKTtcclxuXHR9LFxyXG5cclxuXHRjb29yZHNUb0xhdExuZ3M6IGZ1bmN0aW9uIChjb29yZHMsIGxldmVsc0RlZXAsIGNvb3Jkc1RvTGF0TG5nKSB7IC8vIChBcnJheVssIE51bWJlciwgRnVuY3Rpb25dKSAtPiBBcnJheVxyXG5cdFx0dmFyIGxhdGxuZywgaSwgbGVuLFxyXG5cdFx0ICAgIGxhdGxuZ3MgPSBbXTtcclxuXHJcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjb29yZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0bGF0bG5nID0gbGV2ZWxzRGVlcCA/XHJcblx0XHRcdCAgICAgICAgdGhpcy5jb29yZHNUb0xhdExuZ3MoY29vcmRzW2ldLCBsZXZlbHNEZWVwIC0gMSwgY29vcmRzVG9MYXRMbmcpIDpcclxuXHRcdFx0ICAgICAgICAoY29vcmRzVG9MYXRMbmcgfHwgdGhpcy5jb29yZHNUb0xhdExuZykoY29vcmRzW2ldKTtcclxuXHJcblx0XHRcdGxhdGxuZ3MucHVzaChsYXRsbmcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBsYXRsbmdzO1xyXG5cdH0sXHJcblxyXG5cdGxhdExuZ1RvQ29vcmRzOiBmdW5jdGlvbiAobGF0bG5nKSB7XHJcblx0XHR2YXIgY29vcmRzID0gW2xhdGxuZy5sbmcsIGxhdGxuZy5sYXRdO1xyXG5cclxuXHRcdGlmIChsYXRsbmcuYWx0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0Y29vcmRzLnB1c2gobGF0bG5nLmFsdCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY29vcmRzO1xyXG5cdH0sXHJcblxyXG5cdGxhdExuZ3NUb0Nvb3JkczogZnVuY3Rpb24gKGxhdExuZ3MpIHtcclxuXHRcdHZhciBjb29yZHMgPSBbXTtcclxuXHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gbGF0TG5ncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRjb29yZHMucHVzaChMLkdlb0pTT04ubGF0TG5nVG9Db29yZHMobGF0TG5nc1tpXSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjb29yZHM7XHJcblx0fSxcclxuXHJcblx0Z2V0RmVhdHVyZTogZnVuY3Rpb24gKGxheWVyLCBuZXdHZW9tZXRyeSkge1xyXG5cdFx0cmV0dXJuIGxheWVyLmZlYXR1cmUgPyBMLmV4dGVuZCh7fSwgbGF5ZXIuZmVhdHVyZSwge2dlb21ldHJ5OiBuZXdHZW9tZXRyeX0pIDogTC5HZW9KU09OLmFzRmVhdHVyZShuZXdHZW9tZXRyeSk7XHJcblx0fSxcclxuXHJcblx0YXNGZWF0dXJlOiBmdW5jdGlvbiAoZ2VvSlNPTikge1xyXG5cdFx0aWYgKGdlb0pTT04udHlwZSA9PT0gJ0ZlYXR1cmUnKSB7XHJcblx0XHRcdHJldHVybiBnZW9KU09OO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHR5cGU6ICdGZWF0dXJlJyxcclxuXHRcdFx0cHJvcGVydGllczoge30sXHJcblx0XHRcdGdlb21ldHJ5OiBnZW9KU09OXHJcblx0XHR9O1xyXG5cdH1cclxufSk7XHJcblxyXG52YXIgUG9pbnRUb0dlb0pTT04gPSB7XHJcblx0dG9HZW9KU09OOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gTC5HZW9KU09OLmdldEZlYXR1cmUodGhpcywge1xyXG5cdFx0XHR0eXBlOiAnUG9pbnQnLFxyXG5cdFx0XHRjb29yZGluYXRlczogTC5HZW9KU09OLmxhdExuZ1RvQ29vcmRzKHRoaXMuZ2V0TGF0TG5nKCkpXHJcblx0XHR9KTtcclxuXHR9XHJcbn07XHJcblxyXG5MLk1hcmtlci5pbmNsdWRlKFBvaW50VG9HZW9KU09OKTtcclxuTC5DaXJjbGUuaW5jbHVkZShQb2ludFRvR2VvSlNPTik7XHJcbkwuQ2lyY2xlTWFya2VyLmluY2x1ZGUoUG9pbnRUb0dlb0pTT04pO1xyXG5cclxuTC5Qb2x5bGluZS5pbmNsdWRlKHtcclxuXHR0b0dlb0pTT046IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBMLkdlb0pTT04uZ2V0RmVhdHVyZSh0aGlzLCB7XHJcblx0XHRcdHR5cGU6ICdMaW5lU3RyaW5nJyxcclxuXHRcdFx0Y29vcmRpbmF0ZXM6IEwuR2VvSlNPTi5sYXRMbmdzVG9Db29yZHModGhpcy5nZXRMYXRMbmdzKCkpXHJcblx0XHR9KTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5Qb2x5Z29uLmluY2x1ZGUoe1xyXG5cdHRvR2VvSlNPTjogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGNvb3JkcyA9IFtMLkdlb0pTT04ubGF0TG5nc1RvQ29vcmRzKHRoaXMuZ2V0TGF0TG5ncygpKV0sXHJcblx0XHQgICAgaSwgbGVuLCBob2xlO1xyXG5cclxuXHRcdGNvb3Jkc1swXS5wdXNoKGNvb3Jkc1swXVswXSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2hvbGVzKSB7XHJcblx0XHRcdGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuX2hvbGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aG9sZSA9IEwuR2VvSlNPTi5sYXRMbmdzVG9Db29yZHModGhpcy5faG9sZXNbaV0pO1xyXG5cdFx0XHRcdGhvbGUucHVzaChob2xlWzBdKTtcclxuXHRcdFx0XHRjb29yZHMucHVzaChob2xlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBMLkdlb0pTT04uZ2V0RmVhdHVyZSh0aGlzLCB7XHJcblx0XHRcdHR5cGU6ICdQb2x5Z29uJyxcclxuXHRcdFx0Y29vcmRpbmF0ZXM6IGNvb3Jkc1xyXG5cdFx0fSk7XHJcblx0fVxyXG59KTtcclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcblx0ZnVuY3Rpb24gbXVsdGlUb0dlb0pTT04odHlwZSkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0dmFyIGNvb3JkcyA9IFtdO1xyXG5cclxuXHRcdFx0dGhpcy5lYWNoTGF5ZXIoZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHRcdFx0Y29vcmRzLnB1c2gobGF5ZXIudG9HZW9KU09OKCkuZ2VvbWV0cnkuY29vcmRpbmF0ZXMpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBMLkdlb0pTT04uZ2V0RmVhdHVyZSh0aGlzLCB7XHJcblx0XHRcdFx0dHlwZTogdHlwZSxcclxuXHRcdFx0XHRjb29yZGluYXRlczogY29vcmRzXHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdEwuTXVsdGlQb2x5bGluZS5pbmNsdWRlKHt0b0dlb0pTT046IG11bHRpVG9HZW9KU09OKCdNdWx0aUxpbmVTdHJpbmcnKX0pO1xyXG5cdEwuTXVsdGlQb2x5Z29uLmluY2x1ZGUoe3RvR2VvSlNPTjogbXVsdGlUb0dlb0pTT04oJ011bHRpUG9seWdvbicpfSk7XHJcblxyXG5cdEwuTGF5ZXJHcm91cC5pbmNsdWRlKHtcclxuXHRcdHRvR2VvSlNPTjogZnVuY3Rpb24gKCkge1xyXG5cclxuXHRcdFx0dmFyIGdlb21ldHJ5ID0gdGhpcy5mZWF0dXJlICYmIHRoaXMuZmVhdHVyZS5nZW9tZXRyeSxcclxuXHRcdFx0XHRqc29ucyA9IFtdLFxyXG5cdFx0XHRcdGpzb247XHJcblxyXG5cdFx0XHRpZiAoZ2VvbWV0cnkgJiYgZ2VvbWV0cnkudHlwZSA9PT0gJ011bHRpUG9pbnQnKSB7XHJcblx0XHRcdFx0cmV0dXJuIG11bHRpVG9HZW9KU09OKCdNdWx0aVBvaW50JykuY2FsbCh0aGlzKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGlzR2VvbWV0cnlDb2xsZWN0aW9uID0gZ2VvbWV0cnkgJiYgZ2VvbWV0cnkudHlwZSA9PT0gJ0dlb21ldHJ5Q29sbGVjdGlvbic7XHJcblxyXG5cdFx0XHR0aGlzLmVhY2hMYXllcihmdW5jdGlvbiAobGF5ZXIpIHtcclxuXHRcdFx0XHRpZiAobGF5ZXIudG9HZW9KU09OKSB7XHJcblx0XHRcdFx0XHRqc29uID0gbGF5ZXIudG9HZW9KU09OKCk7XHJcblx0XHRcdFx0XHRqc29ucy5wdXNoKGlzR2VvbWV0cnlDb2xsZWN0aW9uID8ganNvbi5nZW9tZXRyeSA6IEwuR2VvSlNPTi5hc0ZlYXR1cmUoanNvbikpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRpZiAoaXNHZW9tZXRyeUNvbGxlY3Rpb24pIHtcclxuXHRcdFx0XHRyZXR1cm4gTC5HZW9KU09OLmdldEZlYXR1cmUodGhpcywge1xyXG5cdFx0XHRcdFx0Z2VvbWV0cmllczoganNvbnMsXHJcblx0XHRcdFx0XHR0eXBlOiAnR2VvbWV0cnlDb2xsZWN0aW9uJ1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXHJcblx0XHRcdFx0ZmVhdHVyZXM6IGpzb25zXHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fSk7XHJcbn0oKSk7XHJcblxyXG5MLmdlb0pzb24gPSBmdW5jdGlvbiAoZ2VvanNvbiwgb3B0aW9ucykge1xyXG5cdHJldHVybiBuZXcgTC5HZW9KU09OKGdlb2pzb24sIG9wdGlvbnMpO1xyXG59O1xyXG5cblxuLypcclxuICogTC5Eb21FdmVudCBjb250YWlucyBmdW5jdGlvbnMgZm9yIHdvcmtpbmcgd2l0aCBET00gZXZlbnRzLlxyXG4gKi9cclxuXHJcbkwuRG9tRXZlbnQgPSB7XHJcblx0LyogaW5zcGlyZWQgYnkgSm9obiBSZXNpZywgRGVhbiBFZHdhcmRzIGFuZCBZVUkgYWRkRXZlbnQgaW1wbGVtZW50YXRpb25zICovXHJcblx0YWRkTGlzdGVuZXI6IGZ1bmN0aW9uIChvYmosIHR5cGUsIGZuLCBjb250ZXh0KSB7IC8vIChIVE1MRWxlbWVudCwgU3RyaW5nLCBGdW5jdGlvblssIE9iamVjdF0pXHJcblxyXG5cdFx0dmFyIGlkID0gTC5zdGFtcChmbiksXHJcblx0XHQgICAga2V5ID0gJ19sZWFmbGV0XycgKyB0eXBlICsgaWQsXHJcblx0XHQgICAgaGFuZGxlciwgb3JpZ2luYWxIYW5kbGVyLCBuZXdUeXBlO1xyXG5cclxuXHRcdGlmIChvYmpba2V5XSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHRcdGhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRyZXR1cm4gZm4uY2FsbChjb250ZXh0IHx8IG9iaiwgZSB8fCBMLkRvbUV2ZW50Ll9nZXRFdmVudCgpKTtcclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKEwuQnJvd3Nlci5wb2ludGVyICYmIHR5cGUuaW5kZXhPZigndG91Y2gnKSA9PT0gMCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5hZGRQb2ludGVyTGlzdGVuZXIob2JqLCB0eXBlLCBoYW5kbGVyLCBpZCk7XHJcblx0XHR9XHJcblx0XHRpZiAoTC5Ccm93c2VyLnRvdWNoICYmICh0eXBlID09PSAnZGJsY2xpY2snKSAmJiB0aGlzLmFkZERvdWJsZVRhcExpc3RlbmVyKSB7XHJcblx0XHRcdHRoaXMuYWRkRG91YmxlVGFwTGlzdGVuZXIob2JqLCBoYW5kbGVyLCBpZCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCdhZGRFdmVudExpc3RlbmVyJyBpbiBvYmopIHtcclxuXHJcblx0XHRcdGlmICh0eXBlID09PSAnbW91c2V3aGVlbCcpIHtcclxuXHRcdFx0XHRvYmouYWRkRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCBoYW5kbGVyLCBmYWxzZSk7XHJcblx0XHRcdFx0b2JqLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xyXG5cclxuXHRcdFx0fSBlbHNlIGlmICgodHlwZSA9PT0gJ21vdXNlZW50ZXInKSB8fCAodHlwZSA9PT0gJ21vdXNlbGVhdmUnKSkge1xyXG5cclxuXHRcdFx0XHRvcmlnaW5hbEhhbmRsZXIgPSBoYW5kbGVyO1xyXG5cdFx0XHRcdG5ld1R5cGUgPSAodHlwZSA9PT0gJ21vdXNlZW50ZXInID8gJ21vdXNlb3ZlcicgOiAnbW91c2VvdXQnKTtcclxuXHJcblx0XHRcdFx0aGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XHJcblx0XHRcdFx0XHRpZiAoIUwuRG9tRXZlbnQuX2NoZWNrTW91c2Uob2JqLCBlKSkgeyByZXR1cm47IH1cclxuXHRcdFx0XHRcdHJldHVybiBvcmlnaW5hbEhhbmRsZXIoZSk7XHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0b2JqLmFkZEV2ZW50TGlzdGVuZXIobmV3VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xyXG5cclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAnY2xpY2snICYmIEwuQnJvd3Nlci5hbmRyb2lkKSB7XHJcblx0XHRcdFx0b3JpZ2luYWxIYW5kbGVyID0gaGFuZGxlcjtcclxuXHRcdFx0XHRoYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcclxuXHRcdFx0XHRcdHJldHVybiBMLkRvbUV2ZW50Ll9maWx0ZXJDbGljayhlLCBvcmlnaW5hbEhhbmRsZXIpO1xyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdG9iai5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRvYmouYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9IGVsc2UgaWYgKCdhdHRhY2hFdmVudCcgaW4gb2JqKSB7XHJcblx0XHRcdG9iai5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgaGFuZGxlcik7XHJcblx0XHR9XHJcblxyXG5cdFx0b2JqW2tleV0gPSBoYW5kbGVyO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHJlbW92ZUxpc3RlbmVyOiBmdW5jdGlvbiAob2JqLCB0eXBlLCBmbikgeyAgLy8gKEhUTUxFbGVtZW50LCBTdHJpbmcsIEZ1bmN0aW9uKVxyXG5cclxuXHRcdHZhciBpZCA9IEwuc3RhbXAoZm4pLFxyXG5cdFx0ICAgIGtleSA9ICdfbGVhZmxldF8nICsgdHlwZSArIGlkLFxyXG5cdFx0ICAgIGhhbmRsZXIgPSBvYmpba2V5XTtcclxuXHJcblx0XHRpZiAoIWhhbmRsZXIpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcblx0XHRpZiAoTC5Ccm93c2VyLnBvaW50ZXIgJiYgdHlwZS5pbmRleE9mKCd0b3VjaCcpID09PSAwKSB7XHJcblx0XHRcdHRoaXMucmVtb3ZlUG9pbnRlckxpc3RlbmVyKG9iaiwgdHlwZSwgaWQpO1xyXG5cdFx0fSBlbHNlIGlmIChMLkJyb3dzZXIudG91Y2ggJiYgKHR5cGUgPT09ICdkYmxjbGljaycpICYmIHRoaXMucmVtb3ZlRG91YmxlVGFwTGlzdGVuZXIpIHtcclxuXHRcdFx0dGhpcy5yZW1vdmVEb3VibGVUYXBMaXN0ZW5lcihvYmosIGlkKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKCdyZW1vdmVFdmVudExpc3RlbmVyJyBpbiBvYmopIHtcclxuXHJcblx0XHRcdGlmICh0eXBlID09PSAnbW91c2V3aGVlbCcpIHtcclxuXHRcdFx0XHRvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NTW91c2VTY3JvbGwnLCBoYW5kbGVyLCBmYWxzZSk7XHJcblx0XHRcdFx0b2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xyXG5cclxuXHRcdFx0fSBlbHNlIGlmICgodHlwZSA9PT0gJ21vdXNlZW50ZXInKSB8fCAodHlwZSA9PT0gJ21vdXNlbGVhdmUnKSkge1xyXG5cdFx0XHRcdG9iai5yZW1vdmVFdmVudExpc3RlbmVyKCh0eXBlID09PSAnbW91c2VlbnRlcicgPyAnbW91c2VvdmVyJyA6ICdtb3VzZW91dCcpLCBoYW5kbGVyLCBmYWxzZSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0b2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKCdkZXRhY2hFdmVudCcgaW4gb2JqKSB7XHJcblx0XHRcdG9iai5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgaGFuZGxlcik7XHJcblx0XHR9XHJcblxyXG5cdFx0b2JqW2tleV0gPSBudWxsO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24gKGUpIHtcclxuXHJcblx0XHRpZiAoZS5zdG9wUHJvcGFnYXRpb24pIHtcclxuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdEwuRG9tRXZlbnQuX3NraXBwZWQoZSk7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0ZGlzYWJsZVNjcm9sbFByb3BhZ2F0aW9uOiBmdW5jdGlvbiAoZWwpIHtcclxuXHRcdHZhciBzdG9wID0gTC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb247XHJcblxyXG5cdFx0cmV0dXJuIEwuRG9tRXZlbnRcclxuXHRcdFx0Lm9uKGVsLCAnbW91c2V3aGVlbCcsIHN0b3ApXHJcblx0XHRcdC5vbihlbCwgJ01vek1vdXNlUGl4ZWxTY3JvbGwnLCBzdG9wKTtcclxuXHR9LFxyXG5cclxuXHRkaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbjogZnVuY3Rpb24gKGVsKSB7XHJcblx0XHR2YXIgc3RvcCA9IEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xyXG5cclxuXHRcdGZvciAodmFyIGkgPSBMLkRyYWdnYWJsZS5TVEFSVC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0XHRMLkRvbUV2ZW50Lm9uKGVsLCBMLkRyYWdnYWJsZS5TVEFSVFtpXSwgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIEwuRG9tRXZlbnRcclxuXHRcdFx0Lm9uKGVsLCAnY2xpY2snLCBMLkRvbUV2ZW50Ll9mYWtlU3RvcClcclxuXHRcdFx0Lm9uKGVsLCAnZGJsY2xpY2snLCBzdG9wKTtcclxuXHR9LFxyXG5cclxuXHRwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKGUpIHtcclxuXHJcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkge1xyXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRzdG9wOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0cmV0dXJuIEwuRG9tRXZlbnRcclxuXHRcdFx0LnByZXZlbnREZWZhdWx0KGUpXHJcblx0XHRcdC5zdG9wUHJvcGFnYXRpb24oZSk7XHJcblx0fSxcclxuXHJcblx0Z2V0TW91c2VQb3NpdGlvbjogZnVuY3Rpb24gKGUsIGNvbnRhaW5lcikge1xyXG5cdFx0aWYgKCFjb250YWluZXIpIHtcclxuXHRcdFx0cmV0dXJuIG5ldyBMLlBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgcmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcblx0XHRyZXR1cm4gbmV3IEwuUG9pbnQoXHJcblx0XHRcdGUuY2xpZW50WCAtIHJlY3QubGVmdCAtIGNvbnRhaW5lci5jbGllbnRMZWZ0LFxyXG5cdFx0XHRlLmNsaWVudFkgLSByZWN0LnRvcCAtIGNvbnRhaW5lci5jbGllbnRUb3ApO1xyXG5cdH0sXHJcblxyXG5cdGdldFdoZWVsRGVsdGE6IGZ1bmN0aW9uIChlKSB7XHJcblxyXG5cdFx0dmFyIGRlbHRhID0gMDtcclxuXHJcblx0XHRpZiAoZS53aGVlbERlbHRhKSB7XHJcblx0XHRcdGRlbHRhID0gZS53aGVlbERlbHRhIC8gMTIwO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGUuZGV0YWlsKSB7XHJcblx0XHRcdGRlbHRhID0gLWUuZGV0YWlsIC8gMztcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZWx0YTtcclxuXHR9LFxyXG5cclxuXHRfc2tpcEV2ZW50czoge30sXHJcblxyXG5cdF9mYWtlU3RvcDogZnVuY3Rpb24gKGUpIHtcclxuXHRcdC8vIGZha2VzIHN0b3BQcm9wYWdhdGlvbiBieSBzZXR0aW5nIGEgc3BlY2lhbCBldmVudCBmbGFnLCBjaGVja2VkL3Jlc2V0IHdpdGggTC5Eb21FdmVudC5fc2tpcHBlZChlKVxyXG5cdFx0TC5Eb21FdmVudC5fc2tpcEV2ZW50c1tlLnR5cGVdID0gdHJ1ZTtcclxuXHR9LFxyXG5cclxuXHRfc2tpcHBlZDogZnVuY3Rpb24gKGUpIHtcclxuXHRcdHZhciBza2lwcGVkID0gdGhpcy5fc2tpcEV2ZW50c1tlLnR5cGVdO1xyXG5cdFx0Ly8gcmVzZXQgd2hlbiBjaGVja2luZywgYXMgaXQncyBvbmx5IHVzZWQgaW4gbWFwIGNvbnRhaW5lciBhbmQgcHJvcGFnYXRlcyBvdXRzaWRlIG9mIHRoZSBtYXBcclxuXHRcdHRoaXMuX3NraXBFdmVudHNbZS50eXBlXSA9IGZhbHNlO1xyXG5cdFx0cmV0dXJuIHNraXBwZWQ7XHJcblx0fSxcclxuXHJcblx0Ly8gY2hlY2sgaWYgZWxlbWVudCByZWFsbHkgbGVmdC9lbnRlcmVkIHRoZSBldmVudCB0YXJnZXQgKGZvciBtb3VzZWVudGVyL21vdXNlbGVhdmUpXHJcblx0X2NoZWNrTW91c2U6IGZ1bmN0aW9uIChlbCwgZSkge1xyXG5cclxuXHRcdHZhciByZWxhdGVkID0gZS5yZWxhdGVkVGFyZ2V0O1xyXG5cclxuXHRcdGlmICghcmVsYXRlZCkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdHdoaWxlIChyZWxhdGVkICYmIChyZWxhdGVkICE9PSBlbCkpIHtcclxuXHRcdFx0XHRyZWxhdGVkID0gcmVsYXRlZC5wYXJlbnROb2RlO1xyXG5cdFx0XHR9XHJcblx0XHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIChyZWxhdGVkICE9PSBlbCk7XHJcblx0fSxcclxuXHJcblx0X2dldEV2ZW50OiBmdW5jdGlvbiAoKSB7IC8vIGV2aWwgbWFnaWMgZm9yIElFXHJcblx0XHQvKmpzaGludCBub2FyZzpmYWxzZSAqL1xyXG5cdFx0dmFyIGUgPSB3aW5kb3cuZXZlbnQ7XHJcblx0XHRpZiAoIWUpIHtcclxuXHRcdFx0dmFyIGNhbGxlciA9IGFyZ3VtZW50cy5jYWxsZWUuY2FsbGVyO1xyXG5cdFx0XHR3aGlsZSAoY2FsbGVyKSB7XHJcblx0XHRcdFx0ZSA9IGNhbGxlclsnYXJndW1lbnRzJ11bMF07XHJcblx0XHRcdFx0aWYgKGUgJiYgd2luZG93LkV2ZW50ID09PSBlLmNvbnN0cnVjdG9yKSB7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FsbGVyID0gY2FsbGVyLmNhbGxlcjtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGU7XHJcblx0fSxcclxuXHJcblx0Ly8gdGhpcyBpcyBhIGhvcnJpYmxlIHdvcmthcm91bmQgZm9yIGEgYnVnIGluIEFuZHJvaWQgd2hlcmUgYSBzaW5nbGUgdG91Y2ggdHJpZ2dlcnMgdHdvIGNsaWNrIGV2ZW50c1xyXG5cdF9maWx0ZXJDbGljazogZnVuY3Rpb24gKGUsIGhhbmRsZXIpIHtcclxuXHRcdHZhciB0aW1lU3RhbXAgPSAoZS50aW1lU3RhbXAgfHwgZS5vcmlnaW5hbEV2ZW50LnRpbWVTdGFtcCksXHJcblx0XHRcdGVsYXBzZWQgPSBMLkRvbUV2ZW50Ll9sYXN0Q2xpY2sgJiYgKHRpbWVTdGFtcCAtIEwuRG9tRXZlbnQuX2xhc3RDbGljayk7XHJcblxyXG5cdFx0Ly8gYXJlIHRoZXkgY2xvc2VyIHRvZ2V0aGVyIHRoYW4gNTAwbXMgeWV0IG1vcmUgdGhhbiAxMDBtcz9cclxuXHRcdC8vIEFuZHJvaWQgdHlwaWNhbGx5IHRyaWdnZXJzIHRoZW0gfjMwMG1zIGFwYXJ0IHdoaWxlIG11bHRpcGxlIGxpc3RlbmVyc1xyXG5cdFx0Ly8gb24gdGhlIHNhbWUgZXZlbnQgc2hvdWxkIGJlIHRyaWdnZXJlZCBmYXIgZmFzdGVyO1xyXG5cdFx0Ly8gb3IgY2hlY2sgaWYgY2xpY2sgaXMgc2ltdWxhdGVkIG9uIHRoZSBlbGVtZW50LCBhbmQgaWYgaXQgaXMsIHJlamVjdCBhbnkgbm9uLXNpbXVsYXRlZCBldmVudHNcclxuXHJcblx0XHRpZiAoKGVsYXBzZWQgJiYgZWxhcHNlZCA+IDEwMCAmJiBlbGFwc2VkIDwgNTAwKSB8fCAoZS50YXJnZXQuX3NpbXVsYXRlZENsaWNrICYmICFlLl9zaW11bGF0ZWQpKSB7XHJcblx0XHRcdEwuRG9tRXZlbnQuc3RvcChlKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0TC5Eb21FdmVudC5fbGFzdENsaWNrID0gdGltZVN0YW1wO1xyXG5cclxuXHRcdHJldHVybiBoYW5kbGVyKGUpO1xyXG5cdH1cclxufTtcclxuXHJcbkwuRG9tRXZlbnQub24gPSBMLkRvbUV2ZW50LmFkZExpc3RlbmVyO1xyXG5MLkRvbUV2ZW50Lm9mZiA9IEwuRG9tRXZlbnQucmVtb3ZlTGlzdGVuZXI7XHJcblxuXG4vKlxyXG4gKiBMLkRyYWdnYWJsZSBhbGxvd3MgeW91IHRvIGFkZCBkcmFnZ2luZyBjYXBhYmlsaXRpZXMgdG8gYW55IGVsZW1lbnQuIFN1cHBvcnRzIG1vYmlsZSBkZXZpY2VzIHRvby5cclxuICovXHJcblxyXG5MLkRyYWdnYWJsZSA9IEwuQ2xhc3MuZXh0ZW5kKHtcclxuXHRpbmNsdWRlczogTC5NaXhpbi5FdmVudHMsXHJcblxyXG5cdHN0YXRpY3M6IHtcclxuXHRcdFNUQVJUOiBMLkJyb3dzZXIudG91Y2ggPyBbJ3RvdWNoc3RhcnQnLCAnbW91c2Vkb3duJ10gOiBbJ21vdXNlZG93biddLFxyXG5cdFx0RU5EOiB7XHJcblx0XHRcdG1vdXNlZG93bjogJ21vdXNldXAnLFxyXG5cdFx0XHR0b3VjaHN0YXJ0OiAndG91Y2hlbmQnLFxyXG5cdFx0XHRwb2ludGVyZG93bjogJ3RvdWNoZW5kJyxcclxuXHRcdFx0TVNQb2ludGVyRG93bjogJ3RvdWNoZW5kJ1xyXG5cdFx0fSxcclxuXHRcdE1PVkU6IHtcclxuXHRcdFx0bW91c2Vkb3duOiAnbW91c2Vtb3ZlJyxcclxuXHRcdFx0dG91Y2hzdGFydDogJ3RvdWNobW92ZScsXHJcblx0XHRcdHBvaW50ZXJkb3duOiAndG91Y2htb3ZlJyxcclxuXHRcdFx0TVNQb2ludGVyRG93bjogJ3RvdWNobW92ZSdcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAoZWxlbWVudCwgZHJhZ1N0YXJ0VGFyZ2V0KSB7XHJcblx0XHR0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcclxuXHRcdHRoaXMuX2RyYWdTdGFydFRhcmdldCA9IGRyYWdTdGFydFRhcmdldCB8fCBlbGVtZW50O1xyXG5cdH0sXHJcblxyXG5cdGVuYWJsZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHRoaXMuX2VuYWJsZWQpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IEwuRHJhZ2dhYmxlLlNUQVJULmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdEwuRG9tRXZlbnQub24odGhpcy5fZHJhZ1N0YXJ0VGFyZ2V0LCBMLkRyYWdnYWJsZS5TVEFSVFtpXSwgdGhpcy5fb25Eb3duLCB0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9lbmFibGVkID0gdHJ1ZTtcclxuXHR9LFxyXG5cclxuXHRkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX2VuYWJsZWQpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IEwuRHJhZ2dhYmxlLlNUQVJULmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblx0XHRcdEwuRG9tRXZlbnQub2ZmKHRoaXMuX2RyYWdTdGFydFRhcmdldCwgTC5EcmFnZ2FibGUuU1RBUlRbaV0sIHRoaXMuX29uRG93biwgdGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xyXG5cdFx0dGhpcy5fbW92ZWQgPSBmYWxzZTtcclxuXHR9LFxyXG5cclxuXHRfb25Eb3duOiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0dGhpcy5fbW92ZWQgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoZS5zaGlmdEtleSB8fCAoKGUud2hpY2ggIT09IDEpICYmIChlLmJ1dHRvbiAhPT0gMSkgJiYgIWUudG91Y2hlcykpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7XHJcblxyXG5cdFx0aWYgKEwuRHJhZ2dhYmxlLl9kaXNhYmxlZCkgeyByZXR1cm47IH1cclxuXHJcblx0XHRMLkRvbVV0aWwuZGlzYWJsZUltYWdlRHJhZygpO1xyXG5cdFx0TC5Eb21VdGlsLmRpc2FibGVUZXh0U2VsZWN0aW9uKCk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX21vdmluZykgeyByZXR1cm47IH1cclxuXHJcblx0XHR2YXIgZmlyc3QgPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0gOiBlO1xyXG5cclxuXHRcdHRoaXMuX3N0YXJ0UG9pbnQgPSBuZXcgTC5Qb2ludChmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZKTtcclxuXHRcdHRoaXMuX3N0YXJ0UG9zID0gdGhpcy5fbmV3UG9zID0gTC5Eb21VdGlsLmdldFBvc2l0aW9uKHRoaXMuX2VsZW1lbnQpO1xyXG5cclxuXHRcdEwuRG9tRXZlbnRcclxuXHRcdCAgICAub24oZG9jdW1lbnQsIEwuRHJhZ2dhYmxlLk1PVkVbZS50eXBlXSwgdGhpcy5fb25Nb3ZlLCB0aGlzKVxyXG5cdFx0ICAgIC5vbihkb2N1bWVudCwgTC5EcmFnZ2FibGUuRU5EW2UudHlwZV0sIHRoaXMuX29uVXAsIHRoaXMpO1xyXG5cdH0sXHJcblxyXG5cdF9vbk1vdmU6IGZ1bmN0aW9uIChlKSB7XHJcblx0XHRpZiAoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGggPiAxKSB7XHJcblx0XHRcdHRoaXMuX21vdmVkID0gdHJ1ZTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBmaXJzdCA9IChlLnRvdWNoZXMgJiYgZS50b3VjaGVzLmxlbmd0aCA9PT0gMSA/IGUudG91Y2hlc1swXSA6IGUpLFxyXG5cdFx0ICAgIG5ld1BvaW50ID0gbmV3IEwuUG9pbnQoZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSksXHJcblx0XHQgICAgb2Zmc2V0ID0gbmV3UG9pbnQuc3VidHJhY3QodGhpcy5fc3RhcnRQb2ludCk7XHJcblxyXG5cdFx0aWYgKCFvZmZzZXQueCAmJiAhb2Zmc2V0LnkpIHsgcmV0dXJuOyB9XHJcblx0XHRpZiAoTC5Ccm93c2VyLnRvdWNoICYmIE1hdGguYWJzKG9mZnNldC54KSArIE1hdGguYWJzKG9mZnNldC55KSA8IDMpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0TC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcclxuXHJcblx0XHRpZiAoIXRoaXMuX21vdmVkKSB7XHJcblx0XHRcdHRoaXMuZmlyZSgnZHJhZ3N0YXJ0Jyk7XHJcblxyXG5cdFx0XHR0aGlzLl9tb3ZlZCA9IHRydWU7XHJcblx0XHRcdHRoaXMuX3N0YXJ0UG9zID0gTC5Eb21VdGlsLmdldFBvc2l0aW9uKHRoaXMuX2VsZW1lbnQpLnN1YnRyYWN0KG9mZnNldCk7XHJcblxyXG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ2xlYWZsZXQtZHJhZ2dpbmcnKTtcclxuXHRcdFx0dGhpcy5fbGFzdFRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHRcdFx0TC5Eb21VdGlsLmFkZENsYXNzKHRoaXMuX2xhc3RUYXJnZXQsICdsZWFmbGV0LWRyYWctdGFyZ2V0Jyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fbmV3UG9zID0gdGhpcy5fc3RhcnRQb3MuYWRkKG9mZnNldCk7XHJcblx0XHR0aGlzLl9tb3ZpbmcgPSB0cnVlO1xyXG5cclxuXHRcdEwuVXRpbC5jYW5jZWxBbmltRnJhbWUodGhpcy5fYW5pbVJlcXVlc3QpO1xyXG5cdFx0dGhpcy5fYW5pbVJlcXVlc3QgPSBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZSh0aGlzLl91cGRhdGVQb3NpdGlvbiwgdGhpcywgdHJ1ZSwgdGhpcy5fZHJhZ1N0YXJ0VGFyZ2V0KTtcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuZmlyZSgncHJlZHJhZycpO1xyXG5cdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX2VsZW1lbnQsIHRoaXMuX25ld1Bvcyk7XHJcblx0XHR0aGlzLmZpcmUoJ2RyYWcnKTtcclxuXHR9LFxyXG5cclxuXHRfb25VcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0TC5Eb21VdGlsLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksICdsZWFmbGV0LWRyYWdnaW5nJyk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2xhc3RUYXJnZXQpIHtcclxuXHRcdFx0TC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX2xhc3RUYXJnZXQsICdsZWFmbGV0LWRyYWctdGFyZ2V0Jyk7XHJcblx0XHRcdHRoaXMuX2xhc3RUYXJnZXQgPSBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAodmFyIGkgaW4gTC5EcmFnZ2FibGUuTU9WRSkge1xyXG5cdFx0XHRMLkRvbUV2ZW50XHJcblx0XHRcdCAgICAub2ZmKGRvY3VtZW50LCBMLkRyYWdnYWJsZS5NT1ZFW2ldLCB0aGlzLl9vbk1vdmUpXHJcblx0XHRcdCAgICAub2ZmKGRvY3VtZW50LCBMLkRyYWdnYWJsZS5FTkRbaV0sIHRoaXMuX29uVXApO1xyXG5cdFx0fVxyXG5cclxuXHRcdEwuRG9tVXRpbC5lbmFibGVJbWFnZURyYWcoKTtcclxuXHRcdEwuRG9tVXRpbC5lbmFibGVUZXh0U2VsZWN0aW9uKCk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX21vdmVkICYmIHRoaXMuX21vdmluZykge1xyXG5cdFx0XHQvLyBlbnN1cmUgZHJhZyBpcyBub3QgZmlyZWQgYWZ0ZXIgZHJhZ2VuZFxyXG5cdFx0XHRMLlV0aWwuY2FuY2VsQW5pbUZyYW1lKHRoaXMuX2FuaW1SZXF1ZXN0KTtcclxuXHJcblx0XHRcdHRoaXMuZmlyZSgnZHJhZ2VuZCcsIHtcclxuXHRcdFx0XHRkaXN0YW5jZTogdGhpcy5fbmV3UG9zLmRpc3RhbmNlVG8odGhpcy5fc3RhcnRQb3MpXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX21vdmluZyA9IGZhbHNlO1xyXG5cdH1cclxufSk7XHJcblxuXG4vKlxuXHRMLkhhbmRsZXIgaXMgYSBiYXNlIGNsYXNzIGZvciBoYW5kbGVyIGNsYXNzZXMgdGhhdCBhcmUgdXNlZCBpbnRlcm5hbGx5IHRvIGluamVjdFxuXHRpbnRlcmFjdGlvbiBmZWF0dXJlcyBsaWtlIGRyYWdnaW5nIHRvIGNsYXNzZXMgbGlrZSBNYXAgYW5kIE1hcmtlci5cbiovXG5cbkwuSGFuZGxlciA9IEwuQ2xhc3MuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKG1hcCkge1xuXHRcdHRoaXMuX21hcCA9IG1hcDtcblx0fSxcblxuXHRlbmFibGU6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fZW5hYmxlZCkgeyByZXR1cm47IH1cblxuXHRcdHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuXHRcdHRoaXMuYWRkSG9va3MoKTtcblx0fSxcblxuXHRkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCF0aGlzLl9lbmFibGVkKSB7IHJldHVybjsgfVxuXG5cdFx0dGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuXHRcdHRoaXMucmVtb3ZlSG9va3MoKTtcblx0fSxcblxuXHRlbmFibGVkOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuICEhdGhpcy5fZW5hYmxlZDtcblx0fVxufSk7XG5cblxuLypcbiAqIEwuSGFuZGxlci5NYXBEcmFnIGlzIHVzZWQgdG8gbWFrZSB0aGUgbWFwIGRyYWdnYWJsZSAod2l0aCBwYW5uaW5nIGluZXJ0aWEpLCBlbmFibGVkIGJ5IGRlZmF1bHQuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0ZHJhZ2dpbmc6IHRydWUsXG5cblx0aW5lcnRpYTogIUwuQnJvd3Nlci5hbmRyb2lkMjMsXG5cdGluZXJ0aWFEZWNlbGVyYXRpb246IDM0MDAsIC8vIHB4L3NeMlxuXHRpbmVydGlhTWF4U3BlZWQ6IEluZmluaXR5LCAvLyBweC9zXG5cdGluZXJ0aWFUaHJlc2hvbGQ6IEwuQnJvd3Nlci50b3VjaCA/IDMyIDogMTgsIC8vIG1zXG5cdGVhc2VMaW5lYXJpdHk6IDAuMjUsXG5cblx0Ly8gVE9ETyByZWZhY3RvciwgbW92ZSB0byBDUlNcblx0d29ybGRDb3B5SnVtcDogZmFsc2Vcbn0pO1xuXG5MLk1hcC5EcmFnID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGFkZEhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCF0aGlzLl9kcmFnZ2FibGUpIHtcblx0XHRcdHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cblx0XHRcdHRoaXMuX2RyYWdnYWJsZSA9IG5ldyBMLkRyYWdnYWJsZShtYXAuX21hcFBhbmUsIG1hcC5fY29udGFpbmVyKTtcblxuXHRcdFx0dGhpcy5fZHJhZ2dhYmxlLm9uKHtcblx0XHRcdFx0J2RyYWdzdGFydCc6IHRoaXMuX29uRHJhZ1N0YXJ0LFxuXHRcdFx0XHQnZHJhZyc6IHRoaXMuX29uRHJhZyxcblx0XHRcdFx0J2RyYWdlbmQnOiB0aGlzLl9vbkRyYWdFbmRcblx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRpZiAobWFwLm9wdGlvbnMud29ybGRDb3B5SnVtcCkge1xuXHRcdFx0XHR0aGlzLl9kcmFnZ2FibGUub24oJ3ByZWRyYWcnLCB0aGlzLl9vblByZURyYWcsIHRoaXMpO1xuXHRcdFx0XHRtYXAub24oJ3ZpZXdyZXNldCcsIHRoaXMuX29uVmlld1Jlc2V0LCB0aGlzKTtcblxuXHRcdFx0XHRtYXAud2hlblJlYWR5KHRoaXMuX29uVmlld1Jlc2V0LCB0aGlzKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fZHJhZ2dhYmxlLmVuYWJsZSgpO1xuXHR9LFxuXG5cdHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5fZHJhZ2dhYmxlLmRpc2FibGUoKTtcblx0fSxcblxuXHRtb3ZlZDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLl9kcmFnZ2FibGUgJiYgdGhpcy5fZHJhZ2dhYmxlLl9tb3ZlZDtcblx0fSxcblxuXHRfb25EcmFnU3RhcnQ6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwO1xuXG5cdFx0aWYgKG1hcC5fcGFuQW5pbSkge1xuXHRcdFx0bWFwLl9wYW5BbmltLnN0b3AoKTtcblx0XHR9XG5cblx0XHRtYXBcblx0XHQgICAgLmZpcmUoJ21vdmVzdGFydCcpXG5cdFx0ICAgIC5maXJlKCdkcmFnc3RhcnQnKTtcblxuXHRcdGlmIChtYXAub3B0aW9ucy5pbmVydGlhKSB7XG5cdFx0XHR0aGlzLl9wb3NpdGlvbnMgPSBbXTtcblx0XHRcdHRoaXMuX3RpbWVzID0gW107XG5cdFx0fVxuXHR9LFxuXG5cdF9vbkRyYWc6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAodGhpcy5fbWFwLm9wdGlvbnMuaW5lcnRpYSkge1xuXHRcdFx0dmFyIHRpbWUgPSB0aGlzLl9sYXN0VGltZSA9ICtuZXcgRGF0ZSgpLFxuXHRcdFx0ICAgIHBvcyA9IHRoaXMuX2xhc3RQb3MgPSB0aGlzLl9kcmFnZ2FibGUuX25ld1BvcztcblxuXHRcdFx0dGhpcy5fcG9zaXRpb25zLnB1c2gocG9zKTtcblx0XHRcdHRoaXMuX3RpbWVzLnB1c2godGltZSk7XG5cblx0XHRcdGlmICh0aW1lIC0gdGhpcy5fdGltZXNbMF0gPiAyMDApIHtcblx0XHRcdFx0dGhpcy5fcG9zaXRpb25zLnNoaWZ0KCk7XG5cdFx0XHRcdHRoaXMuX3RpbWVzLnNoaWZ0KCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5fbWFwXG5cdFx0ICAgIC5maXJlKCdtb3ZlJylcblx0XHQgICAgLmZpcmUoJ2RyYWcnKTtcblx0fSxcblxuXHRfb25WaWV3UmVzZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBUT0RPIGZpeCBoYXJkY29kZWQgRWFydGggdmFsdWVzXG5cdFx0dmFyIHB4Q2VudGVyID0gdGhpcy5fbWFwLmdldFNpemUoKS5fZGl2aWRlQnkoMiksXG5cdFx0ICAgIHB4V29ybGRDZW50ZXIgPSB0aGlzLl9tYXAubGF0TG5nVG9MYXllclBvaW50KFswLCAwXSk7XG5cblx0XHR0aGlzLl9pbml0aWFsV29ybGRPZmZzZXQgPSBweFdvcmxkQ2VudGVyLnN1YnRyYWN0KHB4Q2VudGVyKS54O1xuXHRcdHRoaXMuX3dvcmxkV2lkdGggPSB0aGlzLl9tYXAucHJvamVjdChbMCwgMTgwXSkueDtcblx0fSxcblxuXHRfb25QcmVEcmFnOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gVE9ETyByZWZhY3RvciB0byBiZSBhYmxlIHRvIGFkanVzdCBtYXAgcGFuZSBwb3NpdGlvbiBhZnRlciB6b29tXG5cdFx0dmFyIHdvcmxkV2lkdGggPSB0aGlzLl93b3JsZFdpZHRoLFxuXHRcdCAgICBoYWxmV2lkdGggPSBNYXRoLnJvdW5kKHdvcmxkV2lkdGggLyAyKSxcblx0XHQgICAgZHggPSB0aGlzLl9pbml0aWFsV29ybGRPZmZzZXQsXG5cdFx0ICAgIHggPSB0aGlzLl9kcmFnZ2FibGUuX25ld1Bvcy54LFxuXHRcdCAgICBuZXdYMSA9ICh4IC0gaGFsZldpZHRoICsgZHgpICUgd29ybGRXaWR0aCArIGhhbGZXaWR0aCAtIGR4LFxuXHRcdCAgICBuZXdYMiA9ICh4ICsgaGFsZldpZHRoICsgZHgpICUgd29ybGRXaWR0aCAtIGhhbGZXaWR0aCAtIGR4LFxuXHRcdCAgICBuZXdYID0gTWF0aC5hYnMobmV3WDEgKyBkeCkgPCBNYXRoLmFicyhuZXdYMiArIGR4KSA/IG5ld1gxIDogbmV3WDI7XG5cblx0XHR0aGlzLl9kcmFnZ2FibGUuX25ld1Bvcy54ID0gbmV3WDtcblx0fSxcblxuXHRfb25EcmFnRW5kOiBmdW5jdGlvbiAoZSkge1xuXHRcdHZhciBtYXAgPSB0aGlzLl9tYXAsXG5cdFx0ICAgIG9wdGlvbnMgPSBtYXAub3B0aW9ucyxcblx0XHQgICAgZGVsYXkgPSArbmV3IERhdGUoKSAtIHRoaXMuX2xhc3RUaW1lLFxuXG5cdFx0ICAgIG5vSW5lcnRpYSA9ICFvcHRpb25zLmluZXJ0aWEgfHwgZGVsYXkgPiBvcHRpb25zLmluZXJ0aWFUaHJlc2hvbGQgfHwgIXRoaXMuX3Bvc2l0aW9uc1swXTtcblxuXHRcdG1hcC5maXJlKCdkcmFnZW5kJywgZSk7XG5cblx0XHRpZiAobm9JbmVydGlhKSB7XG5cdFx0XHRtYXAuZmlyZSgnbW92ZWVuZCcpO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0dmFyIGRpcmVjdGlvbiA9IHRoaXMuX2xhc3RQb3Muc3VidHJhY3QodGhpcy5fcG9zaXRpb25zWzBdKSxcblx0XHRcdCAgICBkdXJhdGlvbiA9ICh0aGlzLl9sYXN0VGltZSArIGRlbGF5IC0gdGhpcy5fdGltZXNbMF0pIC8gMTAwMCxcblx0XHRcdCAgICBlYXNlID0gb3B0aW9ucy5lYXNlTGluZWFyaXR5LFxuXG5cdFx0XHQgICAgc3BlZWRWZWN0b3IgPSBkaXJlY3Rpb24ubXVsdGlwbHlCeShlYXNlIC8gZHVyYXRpb24pLFxuXHRcdFx0ICAgIHNwZWVkID0gc3BlZWRWZWN0b3IuZGlzdGFuY2VUbyhbMCwgMF0pLFxuXG5cdFx0XHQgICAgbGltaXRlZFNwZWVkID0gTWF0aC5taW4ob3B0aW9ucy5pbmVydGlhTWF4U3BlZWQsIHNwZWVkKSxcblx0XHRcdCAgICBsaW1pdGVkU3BlZWRWZWN0b3IgPSBzcGVlZFZlY3Rvci5tdWx0aXBseUJ5KGxpbWl0ZWRTcGVlZCAvIHNwZWVkKSxcblxuXHRcdFx0ICAgIGRlY2VsZXJhdGlvbkR1cmF0aW9uID0gbGltaXRlZFNwZWVkIC8gKG9wdGlvbnMuaW5lcnRpYURlY2VsZXJhdGlvbiAqIGVhc2UpLFxuXHRcdFx0ICAgIG9mZnNldCA9IGxpbWl0ZWRTcGVlZFZlY3Rvci5tdWx0aXBseUJ5KC1kZWNlbGVyYXRpb25EdXJhdGlvbiAvIDIpLnJvdW5kKCk7XG5cblx0XHRcdGlmICghb2Zmc2V0LnggfHwgIW9mZnNldC55KSB7XG5cdFx0XHRcdG1hcC5maXJlKCdtb3ZlZW5kJyk7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9mZnNldCA9IG1hcC5fbGltaXRPZmZzZXQob2Zmc2V0LCBtYXAub3B0aW9ucy5tYXhCb3VuZHMpO1xuXG5cdFx0XHRcdEwuVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRtYXAucGFuQnkob2Zmc2V0LCB7XG5cdFx0XHRcdFx0XHRkdXJhdGlvbjogZGVjZWxlcmF0aW9uRHVyYXRpb24sXG5cdFx0XHRcdFx0XHRlYXNlTGluZWFyaXR5OiBlYXNlLFxuXHRcdFx0XHRcdFx0bm9Nb3ZlU3RhcnQ6IHRydWVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcblxuTC5NYXAuYWRkSW5pdEhvb2soJ2FkZEhhbmRsZXInLCAnZHJhZ2dpbmcnLCBMLk1hcC5EcmFnKTtcblxuXG4vKlxuICogTC5IYW5kbGVyLkRvdWJsZUNsaWNrWm9vbSBpcyB1c2VkIHRvIGhhbmRsZSBkb3VibGUtY2xpY2sgem9vbSBvbiB0aGUgbWFwLCBlbmFibGVkIGJ5IGRlZmF1bHQuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0ZG91YmxlQ2xpY2tab29tOiB0cnVlXG59KTtcblxuTC5NYXAuRG91YmxlQ2xpY2tab29tID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGFkZEhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5fbWFwLm9uKCdkYmxjbGljaycsIHRoaXMuX29uRG91YmxlQ2xpY2ssIHRoaXMpO1xuXHR9LFxuXG5cdHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5fbWFwLm9mZignZGJsY2xpY2snLCB0aGlzLl9vbkRvdWJsZUNsaWNrLCB0aGlzKTtcblx0fSxcblxuXHRfb25Eb3VibGVDbGljazogZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwLFxuXHRcdCAgICB6b29tID0gbWFwLmdldFpvb20oKSArIChlLm9yaWdpbmFsRXZlbnQuc2hpZnRLZXkgPyAtMSA6IDEpO1xuXG5cdFx0aWYgKG1hcC5vcHRpb25zLmRvdWJsZUNsaWNrWm9vbSA9PT0gJ2NlbnRlcicpIHtcblx0XHRcdG1hcC5zZXRab29tKHpvb20pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXAuc2V0Wm9vbUFyb3VuZChlLmNvbnRhaW5lclBvaW50LCB6b29tKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5MLk1hcC5hZGRJbml0SG9vaygnYWRkSGFuZGxlcicsICdkb3VibGVDbGlja1pvb20nLCBMLk1hcC5Eb3VibGVDbGlja1pvb20pO1xuXG5cbi8qXG4gKiBMLkhhbmRsZXIuU2Nyb2xsV2hlZWxab29tIGlzIHVzZWQgYnkgTC5NYXAgdG8gZW5hYmxlIG1vdXNlIHNjcm9sbCB3aGVlbCB6b29tIG9uIHRoZSBtYXAuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0c2Nyb2xsV2hlZWxab29tOiB0cnVlXG59KTtcblxuTC5NYXAuU2Nyb2xsV2hlZWxab29tID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGFkZEhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5Eb21FdmVudC5vbih0aGlzLl9tYXAuX2NvbnRhaW5lciwgJ21vdXNld2hlZWwnLCB0aGlzLl9vbldoZWVsU2Nyb2xsLCB0aGlzKTtcblx0XHRMLkRvbUV2ZW50Lm9uKHRoaXMuX21hcC5fY29udGFpbmVyLCAnTW96TW91c2VQaXhlbFNjcm9sbCcsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpO1xuXHRcdHRoaXMuX2RlbHRhID0gMDtcblx0fSxcblxuXHRyZW1vdmVIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub2ZmKHRoaXMuX21hcC5fY29udGFpbmVyLCAnbW91c2V3aGVlbCcsIHRoaXMuX29uV2hlZWxTY3JvbGwpO1xuXHRcdEwuRG9tRXZlbnQub2ZmKHRoaXMuX21hcC5fY29udGFpbmVyLCAnTW96TW91c2VQaXhlbFNjcm9sbCcsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpO1xuXHR9LFxuXG5cdF9vbldoZWVsU2Nyb2xsOiBmdW5jdGlvbiAoZSkge1xuXHRcdHZhciBkZWx0YSA9IEwuRG9tRXZlbnQuZ2V0V2hlZWxEZWx0YShlKTtcblxuXHRcdHRoaXMuX2RlbHRhICs9IGRlbHRhO1xuXHRcdHRoaXMuX2xhc3RNb3VzZVBvcyA9IHRoaXMuX21hcC5tb3VzZUV2ZW50VG9Db250YWluZXJQb2ludChlKTtcblxuXHRcdGlmICghdGhpcy5fc3RhcnRUaW1lKSB7XG5cdFx0XHR0aGlzLl9zdGFydFRpbWUgPSArbmV3IERhdGUoKTtcblx0XHR9XG5cblx0XHR2YXIgbGVmdCA9IE1hdGgubWF4KDQwIC0gKCtuZXcgRGF0ZSgpIC0gdGhpcy5fc3RhcnRUaW1lKSwgMCk7XG5cblx0XHRjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuXHRcdHRoaXMuX3RpbWVyID0gc2V0VGltZW91dChMLmJpbmQodGhpcy5fcGVyZm9ybVpvb20sIHRoaXMpLCBsZWZ0KTtcblxuXHRcdEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQoZSk7XG5cdFx0TC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24oZSk7XG5cdH0sXG5cblx0X3BlcmZvcm1ab29tOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcblx0XHQgICAgZGVsdGEgPSB0aGlzLl9kZWx0YSxcblx0XHQgICAgem9vbSA9IG1hcC5nZXRab29tKCk7XG5cblx0XHRkZWx0YSA9IGRlbHRhID4gMCA/IE1hdGguY2VpbChkZWx0YSkgOiBNYXRoLmZsb29yKGRlbHRhKTtcblx0XHRkZWx0YSA9IE1hdGgubWF4KE1hdGgubWluKGRlbHRhLCA0KSwgLTQpO1xuXHRcdGRlbHRhID0gbWFwLl9saW1pdFpvb20oem9vbSArIGRlbHRhKSAtIHpvb207XG5cblx0XHR0aGlzLl9kZWx0YSA9IDA7XG5cdFx0dGhpcy5fc3RhcnRUaW1lID0gbnVsbDtcblxuXHRcdGlmICghZGVsdGEpIHsgcmV0dXJuOyB9XG5cblx0XHRpZiAobWFwLm9wdGlvbnMuc2Nyb2xsV2hlZWxab29tID09PSAnY2VudGVyJykge1xuXHRcdFx0bWFwLnNldFpvb20oem9vbSArIGRlbHRhKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWFwLnNldFpvb21Bcm91bmQodGhpcy5fbGFzdE1vdXNlUG9zLCB6b29tICsgZGVsdGEpO1xuXHRcdH1cblx0fVxufSk7XG5cbkwuTWFwLmFkZEluaXRIb29rKCdhZGRIYW5kbGVyJywgJ3Njcm9sbFdoZWVsWm9vbScsIEwuTWFwLlNjcm9sbFdoZWVsWm9vbSk7XG5cblxuLypcclxuICogRXh0ZW5kcyB0aGUgZXZlbnQgaGFuZGxpbmcgY29kZSB3aXRoIGRvdWJsZSB0YXAgc3VwcG9ydCBmb3IgbW9iaWxlIGJyb3dzZXJzLlxyXG4gKi9cclxuXHJcbkwuZXh0ZW5kKEwuRG9tRXZlbnQsIHtcclxuXHJcblx0X3RvdWNoc3RhcnQ6IEwuQnJvd3Nlci5tc1BvaW50ZXIgPyAnTVNQb2ludGVyRG93bicgOiBMLkJyb3dzZXIucG9pbnRlciA/ICdwb2ludGVyZG93bicgOiAndG91Y2hzdGFydCcsXHJcblx0X3RvdWNoZW5kOiBMLkJyb3dzZXIubXNQb2ludGVyID8gJ01TUG9pbnRlclVwJyA6IEwuQnJvd3Nlci5wb2ludGVyID8gJ3BvaW50ZXJ1cCcgOiAndG91Y2hlbmQnLFxyXG5cclxuXHQvLyBpbnNwaXJlZCBieSBaZXB0byB0b3VjaCBjb2RlIGJ5IFRob21hcyBGdWNoc1xyXG5cdGFkZERvdWJsZVRhcExpc3RlbmVyOiBmdW5jdGlvbiAob2JqLCBoYW5kbGVyLCBpZCkge1xyXG5cdFx0dmFyIGxhc3QsXHJcblx0XHQgICAgZG91YmxlVGFwID0gZmFsc2UsXHJcblx0XHQgICAgZGVsYXkgPSAyNTAsXHJcblx0XHQgICAgdG91Y2gsXHJcblx0XHQgICAgcHJlID0gJ19sZWFmbGV0XycsXHJcblx0XHQgICAgdG91Y2hzdGFydCA9IHRoaXMuX3RvdWNoc3RhcnQsXHJcblx0XHQgICAgdG91Y2hlbmQgPSB0aGlzLl90b3VjaGVuZCxcclxuXHRcdCAgICB0cmFja2VkVG91Y2hlcyA9IFtdO1xyXG5cclxuXHRcdGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XHJcblx0XHRcdHZhciBjb3VudDtcclxuXHJcblx0XHRcdGlmIChMLkJyb3dzZXIucG9pbnRlcikge1xyXG5cdFx0XHRcdHRyYWNrZWRUb3VjaGVzLnB1c2goZS5wb2ludGVySWQpO1xyXG5cdFx0XHRcdGNvdW50ID0gdHJhY2tlZFRvdWNoZXMubGVuZ3RoO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvdW50ID0gZS50b3VjaGVzLmxlbmd0aDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoY291bnQgPiAxKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgbm93ID0gRGF0ZS5ub3coKSxcclxuXHRcdFx0XHRkZWx0YSA9IG5vdyAtIChsYXN0IHx8IG5vdyk7XHJcblxyXG5cdFx0XHR0b3VjaCA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXSA6IGU7XHJcblx0XHRcdGRvdWJsZVRhcCA9IChkZWx0YSA+IDAgJiYgZGVsdGEgPD0gZGVsYXkpO1xyXG5cdFx0XHRsYXN0ID0gbm93O1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIG9uVG91Y2hFbmQoZSkge1xyXG5cdFx0XHRpZiAoTC5Ccm93c2VyLnBvaW50ZXIpIHtcclxuXHRcdFx0XHR2YXIgaWR4ID0gdHJhY2tlZFRvdWNoZXMuaW5kZXhPZihlLnBvaW50ZXJJZCk7XHJcblx0XHRcdFx0aWYgKGlkeCA9PT0gLTEpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dHJhY2tlZFRvdWNoZXMuc3BsaWNlKGlkeCwgMSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChkb3VibGVUYXApIHtcclxuXHRcdFx0XHRpZiAoTC5Ccm93c2VyLnBvaW50ZXIpIHtcclxuXHRcdFx0XHRcdC8vIHdvcmsgYXJvdW5kIC50eXBlIGJlaW5nIHJlYWRvbmx5IHdpdGggTVNQb2ludGVyKiBldmVudHNcclxuXHRcdFx0XHRcdHZhciBuZXdUb3VjaCA9IHsgfSxcclxuXHRcdFx0XHRcdFx0cHJvcDtcclxuXHJcblx0XHRcdFx0XHQvLyBqc2hpbnQgZm9yaW46ZmFsc2VcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgaW4gdG91Y2gpIHtcclxuXHRcdFx0XHRcdFx0cHJvcCA9IHRvdWNoW2ldO1xyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRuZXdUb3VjaFtpXSA9IHByb3AuYmluZCh0b3VjaCk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0bmV3VG91Y2hbaV0gPSBwcm9wO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR0b3VjaCA9IG5ld1RvdWNoO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0b3VjaC50eXBlID0gJ2RibGNsaWNrJztcclxuXHRcdFx0XHRoYW5kbGVyKHRvdWNoKTtcclxuXHRcdFx0XHRsYXN0ID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0b2JqW3ByZSArIHRvdWNoc3RhcnQgKyBpZF0gPSBvblRvdWNoU3RhcnQ7XHJcblx0XHRvYmpbcHJlICsgdG91Y2hlbmQgKyBpZF0gPSBvblRvdWNoRW5kO1xyXG5cclxuXHRcdC8vIG9uIHBvaW50ZXIgd2UgbmVlZCB0byBsaXN0ZW4gb24gdGhlIGRvY3VtZW50LCBvdGhlcndpc2UgYSBkcmFnIHN0YXJ0aW5nIG9uIHRoZSBtYXAgYW5kIG1vdmluZyBvZmYgc2NyZWVuXHJcblx0XHQvLyB3aWxsIG5vdCBjb21lIHRocm91Z2ggdG8gdXMsIHNvIHdlIHdpbGwgbG9zZSB0cmFjayBvZiBob3cgbWFueSB0b3VjaGVzIGFyZSBvbmdvaW5nXHJcblx0XHR2YXIgZW5kRWxlbWVudCA9IEwuQnJvd3Nlci5wb2ludGVyID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogb2JqO1xyXG5cclxuXHRcdG9iai5hZGRFdmVudExpc3RlbmVyKHRvdWNoc3RhcnQsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xyXG5cdFx0ZW5kRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRvdWNoZW5kLCBvblRvdWNoRW5kLCBmYWxzZSk7XHJcblxyXG5cdFx0aWYgKEwuQnJvd3Nlci5wb2ludGVyKSB7XHJcblx0XHRcdGVuZEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihMLkRvbUV2ZW50LlBPSU5URVJfQ0FOQ0VMLCBvblRvdWNoRW5kLCBmYWxzZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0cmVtb3ZlRG91YmxlVGFwTGlzdGVuZXI6IGZ1bmN0aW9uIChvYmosIGlkKSB7XHJcblx0XHR2YXIgcHJlID0gJ19sZWFmbGV0Xyc7XHJcblxyXG5cdFx0b2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5fdG91Y2hzdGFydCwgb2JqW3ByZSArIHRoaXMuX3RvdWNoc3RhcnQgKyBpZF0sIGZhbHNlKTtcclxuXHRcdChMLkJyb3dzZXIucG9pbnRlciA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IG9iaikucmVtb3ZlRXZlbnRMaXN0ZW5lcihcclxuXHRcdCAgICAgICAgdGhpcy5fdG91Y2hlbmQsIG9ialtwcmUgKyB0aGlzLl90b3VjaGVuZCArIGlkXSwgZmFsc2UpO1xyXG5cclxuXHRcdGlmIChMLkJyb3dzZXIucG9pbnRlcikge1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihMLkRvbUV2ZW50LlBPSU5URVJfQ0FOQ0VMLCBvYmpbcHJlICsgdGhpcy5fdG91Y2hlbmQgKyBpZF0sXHJcblx0XHRcdFx0ZmFsc2UpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxufSk7XHJcblxuXG4vKlxuICogRXh0ZW5kcyBMLkRvbUV2ZW50IHRvIHByb3ZpZGUgdG91Y2ggc3VwcG9ydCBmb3IgSW50ZXJuZXQgRXhwbG9yZXIgYW5kIFdpbmRvd3MtYmFzZWQgZGV2aWNlcy5cbiAqL1xuXG5MLmV4dGVuZChMLkRvbUV2ZW50LCB7XG5cblx0Ly9zdGF0aWNcblx0UE9JTlRFUl9ET1dOOiBMLkJyb3dzZXIubXNQb2ludGVyID8gJ01TUG9pbnRlckRvd24nIDogJ3BvaW50ZXJkb3duJyxcblx0UE9JTlRFUl9NT1ZFOiBMLkJyb3dzZXIubXNQb2ludGVyID8gJ01TUG9pbnRlck1vdmUnIDogJ3BvaW50ZXJtb3ZlJyxcblx0UE9JTlRFUl9VUDogTC5Ccm93c2VyLm1zUG9pbnRlciA/ICdNU1BvaW50ZXJVcCcgOiAncG9pbnRlcnVwJyxcblx0UE9JTlRFUl9DQU5DRUw6IEwuQnJvd3Nlci5tc1BvaW50ZXIgPyAnTVNQb2ludGVyQ2FuY2VsJyA6ICdwb2ludGVyY2FuY2VsJyxcblxuXHRfcG9pbnRlcnM6IFtdLFxuXHRfcG9pbnRlckRvY3VtZW50TGlzdGVuZXI6IGZhbHNlLFxuXG5cdC8vIFByb3ZpZGVzIGEgdG91Y2ggZXZlbnRzIHdyYXBwZXIgZm9yIChtcylwb2ludGVyIGV2ZW50cy5cblx0Ly8gQmFzZWQgb24gY2hhbmdlcyBieSB2ZXByb3phIGh0dHBzOi8vZ2l0aHViLmNvbS9DbG91ZE1hZGUvTGVhZmxldC9wdWxsLzEwMTlcblx0Ly9yZWYgaHR0cDovL3d3dy53My5vcmcvVFIvcG9pbnRlcmV2ZW50cy8gaHR0cHM6Ly93d3cudzMub3JnL0J1Z3MvUHVibGljL3Nob3dfYnVnLmNnaT9pZD0yMjg5MFxuXG5cdGFkZFBvaW50ZXJMaXN0ZW5lcjogZnVuY3Rpb24gKG9iaiwgdHlwZSwgaGFuZGxlciwgaWQpIHtcblxuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdGNhc2UgJ3RvdWNoc3RhcnQnOlxuXHRcdFx0cmV0dXJuIHRoaXMuYWRkUG9pbnRlckxpc3RlbmVyU3RhcnQob2JqLCB0eXBlLCBoYW5kbGVyLCBpZCk7XG5cdFx0Y2FzZSAndG91Y2hlbmQnOlxuXHRcdFx0cmV0dXJuIHRoaXMuYWRkUG9pbnRlckxpc3RlbmVyRW5kKG9iaiwgdHlwZSwgaGFuZGxlciwgaWQpO1xuXHRcdGNhc2UgJ3RvdWNobW92ZSc6XG5cdFx0XHRyZXR1cm4gdGhpcy5hZGRQb2ludGVyTGlzdGVuZXJNb3ZlKG9iaiwgdHlwZSwgaGFuZGxlciwgaWQpO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyAnVW5rbm93biB0b3VjaCBldmVudCB0eXBlJztcblx0XHR9XG5cdH0sXG5cblx0YWRkUG9pbnRlckxpc3RlbmVyU3RhcnQ6IGZ1bmN0aW9uIChvYmosIHR5cGUsIGhhbmRsZXIsIGlkKSB7XG5cdFx0dmFyIHByZSA9ICdfbGVhZmxldF8nLFxuXHRcdCAgICBwb2ludGVycyA9IHRoaXMuX3BvaW50ZXJzO1xuXG5cdFx0dmFyIGNiID0gZnVuY3Rpb24gKGUpIHtcblxuXHRcdFx0TC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcblxuXHRcdFx0dmFyIGFscmVhZHlJbkFycmF5ID0gZmFsc2U7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50ZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwb2ludGVyc1tpXS5wb2ludGVySWQgPT09IGUucG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0YWxyZWFkeUluQXJyYXkgPSB0cnVlO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWFscmVhZHlJbkFycmF5KSB7XG5cdFx0XHRcdHBvaW50ZXJzLnB1c2goZSk7XG5cdFx0XHR9XG5cblx0XHRcdGUudG91Y2hlcyA9IHBvaW50ZXJzLnNsaWNlKCk7XG5cdFx0XHRlLmNoYW5nZWRUb3VjaGVzID0gW2VdO1xuXG5cdFx0XHRoYW5kbGVyKGUpO1xuXHRcdH07XG5cblx0XHRvYmpbcHJlICsgJ3RvdWNoc3RhcnQnICsgaWRdID0gY2I7XG5cdFx0b2JqLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5QT0lOVEVSX0RPV04sIGNiLCBmYWxzZSk7XG5cblx0XHQvLyBuZWVkIHRvIGFsc28gbGlzdGVuIGZvciBlbmQgZXZlbnRzIHRvIGtlZXAgdGhlIF9wb2ludGVycyBsaXN0IGFjY3VyYXRlXG5cdFx0Ly8gdGhpcyBuZWVkcyB0byBiZSBvbiB0aGUgYm9keSBhbmQgbmV2ZXIgZ28gYXdheVxuXHRcdGlmICghdGhpcy5fcG9pbnRlckRvY3VtZW50TGlzdGVuZXIpIHtcblx0XHRcdHZhciBpbnRlcm5hbENiID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludGVycy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGlmIChwb2ludGVyc1tpXS5wb2ludGVySWQgPT09IGUucG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0XHRwb2ludGVycy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHQvL1dlIGxpc3RlbiBvbiB0aGUgZG9jdW1lbnRFbGVtZW50IGFzIGFueSBkcmFncyB0aGF0IGVuZCBieSBtb3ZpbmcgdGhlIHRvdWNoIG9mZiB0aGUgc2NyZWVuIGdldCBmaXJlZCB0aGVyZVxuXHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5QT0lOVEVSX1VQLCBpbnRlcm5hbENiLCBmYWxzZSk7XG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLlBPSU5URVJfQ0FOQ0VMLCBpbnRlcm5hbENiLCBmYWxzZSk7XG5cblx0XHRcdHRoaXMuX3BvaW50ZXJEb2N1bWVudExpc3RlbmVyID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRhZGRQb2ludGVyTGlzdGVuZXJNb3ZlOiBmdW5jdGlvbiAob2JqLCB0eXBlLCBoYW5kbGVyLCBpZCkge1xuXHRcdHZhciBwcmUgPSAnX2xlYWZsZXRfJyxcblx0XHQgICAgdG91Y2hlcyA9IHRoaXMuX3BvaW50ZXJzO1xuXG5cdFx0ZnVuY3Rpb24gY2IoZSkge1xuXG5cdFx0XHQvLyBkb24ndCBmaXJlIHRvdWNoIG1vdmVzIHdoZW4gbW91c2UgaXNuJ3QgZG93blxuXHRcdFx0aWYgKChlLnBvaW50ZXJUeXBlID09PSBlLk1TUE9JTlRFUl9UWVBFX01PVVNFIHx8IGUucG9pbnRlclR5cGUgPT09ICdtb3VzZScpICYmIGUuYnV0dG9ucyA9PT0gMCkgeyByZXR1cm47IH1cblxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmICh0b3VjaGVzW2ldLnBvaW50ZXJJZCA9PT0gZS5wb2ludGVySWQpIHtcblx0XHRcdFx0XHR0b3VjaGVzW2ldID0gZTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRlLnRvdWNoZXMgPSB0b3VjaGVzLnNsaWNlKCk7XG5cdFx0XHRlLmNoYW5nZWRUb3VjaGVzID0gW2VdO1xuXG5cdFx0XHRoYW5kbGVyKGUpO1xuXHRcdH1cblxuXHRcdG9ialtwcmUgKyAndG91Y2htb3ZlJyArIGlkXSA9IGNiO1xuXHRcdG9iai5hZGRFdmVudExpc3RlbmVyKHRoaXMuUE9JTlRFUl9NT1ZFLCBjYiwgZmFsc2UpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0YWRkUG9pbnRlckxpc3RlbmVyRW5kOiBmdW5jdGlvbiAob2JqLCB0eXBlLCBoYW5kbGVyLCBpZCkge1xuXHRcdHZhciBwcmUgPSAnX2xlYWZsZXRfJyxcblx0XHQgICAgdG91Y2hlcyA9IHRoaXMuX3BvaW50ZXJzO1xuXG5cdFx0dmFyIGNiID0gZnVuY3Rpb24gKGUpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAodG91Y2hlc1tpXS5wb2ludGVySWQgPT09IGUucG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0dG91Y2hlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZS50b3VjaGVzID0gdG91Y2hlcy5zbGljZSgpO1xuXHRcdFx0ZS5jaGFuZ2VkVG91Y2hlcyA9IFtlXTtcblxuXHRcdFx0aGFuZGxlcihlKTtcblx0XHR9O1xuXG5cdFx0b2JqW3ByZSArICd0b3VjaGVuZCcgKyBpZF0gPSBjYjtcblx0XHRvYmouYWRkRXZlbnRMaXN0ZW5lcih0aGlzLlBPSU5URVJfVVAsIGNiLCBmYWxzZSk7XG5cdFx0b2JqLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5QT0lOVEVSX0NBTkNFTCwgY2IsIGZhbHNlKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHJlbW92ZVBvaW50ZXJMaXN0ZW5lcjogZnVuY3Rpb24gKG9iaiwgdHlwZSwgaWQpIHtcblx0XHR2YXIgcHJlID0gJ19sZWFmbGV0XycsXG5cdFx0ICAgIGNiID0gb2JqW3ByZSArIHR5cGUgKyBpZF07XG5cblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRjYXNlICd0b3VjaHN0YXJ0Jzpcblx0XHRcdG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuUE9JTlRFUl9ET1dOLCBjYiwgZmFsc2UpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAndG91Y2htb3ZlJzpcblx0XHRcdG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuUE9JTlRFUl9NT1ZFLCBjYiwgZmFsc2UpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAndG91Y2hlbmQnOlxuXHRcdFx0b2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5QT0lOVEVSX1VQLCBjYiwgZmFsc2UpO1xuXHRcdFx0b2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5QT0lOVEVSX0NBTkNFTCwgY2IsIGZhbHNlKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxuXG4vKlxuICogTC5IYW5kbGVyLlRvdWNoWm9vbSBpcyB1c2VkIGJ5IEwuTWFwIHRvIGFkZCBwaW5jaCB6b29tIG9uIHN1cHBvcnRlZCBtb2JpbGUgYnJvd3NlcnMuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0dG91Y2hab29tOiBMLkJyb3dzZXIudG91Y2ggJiYgIUwuQnJvd3Nlci5hbmRyb2lkMjMsXG5cdGJvdW5jZUF0Wm9vbUxpbWl0czogdHJ1ZVxufSk7XG5cbkwuTWFwLlRvdWNoWm9vbSA9IEwuSGFuZGxlci5leHRlbmQoe1xuXHRhZGRIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub24odGhpcy5fbWFwLl9jb250YWluZXIsICd0b3VjaHN0YXJ0JywgdGhpcy5fb25Ub3VjaFN0YXJ0LCB0aGlzKTtcblx0fSxcblxuXHRyZW1vdmVIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub2ZmKHRoaXMuX21hcC5fY29udGFpbmVyLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVG91Y2hTdGFydCwgdGhpcyk7XG5cdH0sXG5cblx0X29uVG91Y2hTdGFydDogZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwO1xuXG5cdFx0aWYgKCFlLnRvdWNoZXMgfHwgZS50b3VjaGVzLmxlbmd0aCAhPT0gMiB8fCBtYXAuX2FuaW1hdGluZ1pvb20gfHwgdGhpcy5fem9vbWluZykgeyByZXR1cm47IH1cblxuXHRcdHZhciBwMSA9IG1hcC5tb3VzZUV2ZW50VG9MYXllclBvaW50KGUudG91Y2hlc1swXSksXG5cdFx0ICAgIHAyID0gbWFwLm1vdXNlRXZlbnRUb0xheWVyUG9pbnQoZS50b3VjaGVzWzFdKSxcblx0XHQgICAgdmlld0NlbnRlciA9IG1hcC5fZ2V0Q2VudGVyTGF5ZXJQb2ludCgpO1xuXG5cdFx0dGhpcy5fc3RhcnRDZW50ZXIgPSBwMS5hZGQocDIpLl9kaXZpZGVCeSgyKTtcblx0XHR0aGlzLl9zdGFydERpc3QgPSBwMS5kaXN0YW5jZVRvKHAyKTtcblxuXHRcdHRoaXMuX21vdmVkID0gZmFsc2U7XG5cdFx0dGhpcy5fem9vbWluZyA9IHRydWU7XG5cblx0XHR0aGlzLl9jZW50ZXJPZmZzZXQgPSB2aWV3Q2VudGVyLnN1YnRyYWN0KHRoaXMuX3N0YXJ0Q2VudGVyKTtcblxuXHRcdGlmIChtYXAuX3BhbkFuaW0pIHtcblx0XHRcdG1hcC5fcGFuQW5pbS5zdG9wKCk7XG5cdFx0fVxuXG5cdFx0TC5Eb21FdmVudFxuXHRcdCAgICAub24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSwgdGhpcylcblx0XHQgICAgLm9uKGRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9vblRvdWNoRW5kLCB0aGlzKTtcblxuXHRcdEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQoZSk7XG5cdH0sXG5cblx0X29uVG91Y2hNb3ZlOiBmdW5jdGlvbiAoZSkge1xuXHRcdHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cblx0XHRpZiAoIWUudG91Y2hlcyB8fCBlLnRvdWNoZXMubGVuZ3RoICE9PSAyIHx8ICF0aGlzLl96b29taW5nKSB7IHJldHVybjsgfVxuXG5cdFx0dmFyIHAxID0gbWFwLm1vdXNlRXZlbnRUb0xheWVyUG9pbnQoZS50b3VjaGVzWzBdKSxcblx0XHQgICAgcDIgPSBtYXAubW91c2VFdmVudFRvTGF5ZXJQb2ludChlLnRvdWNoZXNbMV0pO1xuXG5cdFx0dGhpcy5fc2NhbGUgPSBwMS5kaXN0YW5jZVRvKHAyKSAvIHRoaXMuX3N0YXJ0RGlzdDtcblx0XHR0aGlzLl9kZWx0YSA9IHAxLl9hZGQocDIpLl9kaXZpZGVCeSgyKS5fc3VidHJhY3QodGhpcy5fc3RhcnRDZW50ZXIpO1xuXG5cdFx0aWYgKHRoaXMuX3NjYWxlID09PSAxKSB7IHJldHVybjsgfVxuXG5cdFx0aWYgKCFtYXAub3B0aW9ucy5ib3VuY2VBdFpvb21MaW1pdHMpIHtcblx0XHRcdGlmICgobWFwLmdldFpvb20oKSA9PT0gbWFwLmdldE1pblpvb20oKSAmJiB0aGlzLl9zY2FsZSA8IDEpIHx8XG5cdFx0XHQgICAgKG1hcC5nZXRab29tKCkgPT09IG1hcC5nZXRNYXhab29tKCkgJiYgdGhpcy5fc2NhbGUgPiAxKSkgeyByZXR1cm47IH1cblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuX21vdmVkKSB7XG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3MobWFwLl9tYXBQYW5lLCAnbGVhZmxldC10b3VjaGluZycpO1xuXG5cdFx0XHRtYXBcblx0XHRcdCAgICAuZmlyZSgnbW92ZXN0YXJ0Jylcblx0XHRcdCAgICAuZmlyZSgnem9vbXN0YXJ0Jyk7XG5cblx0XHRcdHRoaXMuX21vdmVkID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRMLlV0aWwuY2FuY2VsQW5pbUZyYW1lKHRoaXMuX2FuaW1SZXF1ZXN0KTtcblx0XHR0aGlzLl9hbmltUmVxdWVzdCA9IEwuVXRpbC5yZXF1ZXN0QW5pbUZyYW1lKFxuXHRcdCAgICAgICAgdGhpcy5fdXBkYXRlT25Nb3ZlLCB0aGlzLCB0cnVlLCB0aGlzLl9tYXAuX2NvbnRhaW5lcik7XG5cblx0XHRMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xuXHR9LFxuXG5cdF91cGRhdGVPbk1vdmU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwLFxuXHRcdCAgICBvcmlnaW4gPSB0aGlzLl9nZXRTY2FsZU9yaWdpbigpLFxuXHRcdCAgICBjZW50ZXIgPSBtYXAubGF5ZXJQb2ludFRvTGF0TG5nKG9yaWdpbiksXG5cdFx0ICAgIHpvb20gPSBtYXAuZ2V0U2NhbGVab29tKHRoaXMuX3NjYWxlKTtcblxuXHRcdG1hcC5fYW5pbWF0ZVpvb20oY2VudGVyLCB6b29tLCB0aGlzLl9zdGFydENlbnRlciwgdGhpcy5fc2NhbGUsIHRoaXMuX2RlbHRhLCBmYWxzZSwgdHJ1ZSk7XG5cdH0sXG5cblx0X29uVG91Y2hFbmQ6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX21vdmVkIHx8ICF0aGlzLl96b29taW5nKSB7XG5cdFx0XHR0aGlzLl96b29taW5nID0gZmFsc2U7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcDtcblxuXHRcdHRoaXMuX3pvb21pbmcgPSBmYWxzZTtcblx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3MobWFwLl9tYXBQYW5lLCAnbGVhZmxldC10b3VjaGluZycpO1xuXHRcdEwuVXRpbC5jYW5jZWxBbmltRnJhbWUodGhpcy5fYW5pbVJlcXVlc3QpO1xuXG5cdFx0TC5Eb21FdmVudFxuXHRcdCAgICAub2ZmKGRvY3VtZW50LCAndG91Y2htb3ZlJywgdGhpcy5fb25Ub3VjaE1vdmUpXG5cdFx0ICAgIC5vZmYoZG9jdW1lbnQsICd0b3VjaGVuZCcsIHRoaXMuX29uVG91Y2hFbmQpO1xuXG5cdFx0dmFyIG9yaWdpbiA9IHRoaXMuX2dldFNjYWxlT3JpZ2luKCksXG5cdFx0ICAgIGNlbnRlciA9IG1hcC5sYXllclBvaW50VG9MYXRMbmcob3JpZ2luKSxcblxuXHRcdCAgICBvbGRab29tID0gbWFwLmdldFpvb20oKSxcblx0XHQgICAgZmxvYXRab29tRGVsdGEgPSBtYXAuZ2V0U2NhbGVab29tKHRoaXMuX3NjYWxlKSAtIG9sZFpvb20sXG5cdFx0ICAgIHJvdW5kWm9vbURlbHRhID0gKGZsb2F0Wm9vbURlbHRhID4gMCA/XG5cdFx0ICAgICAgICAgICAgTWF0aC5jZWlsKGZsb2F0Wm9vbURlbHRhKSA6IE1hdGguZmxvb3IoZmxvYXRab29tRGVsdGEpKSxcblxuXHRcdCAgICB6b29tID0gbWFwLl9saW1pdFpvb20ob2xkWm9vbSArIHJvdW5kWm9vbURlbHRhKSxcblx0XHQgICAgc2NhbGUgPSBtYXAuZ2V0Wm9vbVNjYWxlKHpvb20pIC8gdGhpcy5fc2NhbGU7XG5cblx0XHRtYXAuX2FuaW1hdGVab29tKGNlbnRlciwgem9vbSwgb3JpZ2luLCBzY2FsZSk7XG5cdH0sXG5cblx0X2dldFNjYWxlT3JpZ2luOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNlbnRlck9mZnNldCA9IHRoaXMuX2NlbnRlck9mZnNldC5zdWJ0cmFjdCh0aGlzLl9kZWx0YSkuZGl2aWRlQnkodGhpcy5fc2NhbGUpO1xuXHRcdHJldHVybiB0aGlzLl9zdGFydENlbnRlci5hZGQoY2VudGVyT2Zmc2V0KTtcblx0fVxufSk7XG5cbkwuTWFwLmFkZEluaXRIb29rKCdhZGRIYW5kbGVyJywgJ3RvdWNoWm9vbScsIEwuTWFwLlRvdWNoWm9vbSk7XG5cblxuLypcbiAqIEwuTWFwLlRhcCBpcyB1c2VkIHRvIGVuYWJsZSBtb2JpbGUgaGFja3MgbGlrZSBxdWljayB0YXBzIGFuZCBsb25nIGhvbGQuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0dGFwOiB0cnVlLFxuXHR0YXBUb2xlcmFuY2U6IDE1XG59KTtcblxuTC5NYXAuVGFwID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGFkZEhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5Eb21FdmVudC5vbih0aGlzLl9tYXAuX2NvbnRhaW5lciwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9vbkRvd24sIHRoaXMpO1xuXHR9LFxuXG5cdHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5Eb21FdmVudC5vZmYodGhpcy5fbWFwLl9jb250YWluZXIsICd0b3VjaHN0YXJ0JywgdGhpcy5fb25Eb3duLCB0aGlzKTtcblx0fSxcblxuXHRfb25Eb3duOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZS50b3VjaGVzKSB7IHJldHVybjsgfVxuXG5cdFx0TC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcblxuXHRcdHRoaXMuX2ZpcmVDbGljayA9IHRydWU7XG5cblx0XHQvLyBkb24ndCBzaW11bGF0ZSBjbGljayBvciB0cmFjayBsb25ncHJlc3MgaWYgbW9yZSB0aGFuIDEgdG91Y2hcblx0XHRpZiAoZS50b3VjaGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHRoaXMuX2ZpcmVDbGljayA9IGZhbHNlO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuX2hvbGRUaW1lb3V0KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgZmlyc3QgPSBlLnRvdWNoZXNbMF0sXG5cdFx0ICAgIGVsID0gZmlyc3QudGFyZ2V0O1xuXG5cdFx0dGhpcy5fc3RhcnRQb3MgPSB0aGlzLl9uZXdQb3MgPSBuZXcgTC5Qb2ludChmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZKTtcblxuXHRcdC8vIGlmIHRvdWNoaW5nIGEgbGluaywgaGlnaGxpZ2h0IGl0XG5cdFx0aWYgKGVsLnRhZ05hbWUgJiYgZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnYScpIHtcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyhlbCwgJ2xlYWZsZXQtYWN0aXZlJyk7XG5cdFx0fVxuXG5cdFx0Ly8gc2ltdWxhdGUgbG9uZyBob2xkIGJ1dCBzZXR0aW5nIGEgdGltZW91dFxuXHRcdHRoaXMuX2hvbGRUaW1lb3V0ID0gc2V0VGltZW91dChMLmJpbmQoZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX2lzVGFwVmFsaWQoKSkge1xuXHRcdFx0XHR0aGlzLl9maXJlQ2xpY2sgPSBmYWxzZTtcblx0XHRcdFx0dGhpcy5fb25VcCgpO1xuXHRcdFx0XHR0aGlzLl9zaW11bGF0ZUV2ZW50KCdjb250ZXh0bWVudScsIGZpcnN0KTtcblx0XHRcdH1cblx0XHR9LCB0aGlzKSwgMTAwMCk7XG5cblx0XHRMLkRvbUV2ZW50XG5cdFx0XHQub24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vbk1vdmUsIHRoaXMpXG5cdFx0XHQub24oZG9jdW1lbnQsICd0b3VjaGVuZCcsIHRoaXMuX29uVXAsIHRoaXMpO1xuXHR9LFxuXG5cdF9vblVwOiBmdW5jdGlvbiAoZSkge1xuXHRcdGNsZWFyVGltZW91dCh0aGlzLl9ob2xkVGltZW91dCk7XG5cblx0XHRMLkRvbUV2ZW50XG5cdFx0XHQub2ZmKGRvY3VtZW50LCAndG91Y2htb3ZlJywgdGhpcy5fb25Nb3ZlLCB0aGlzKVxuXHRcdFx0Lm9mZihkb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fb25VcCwgdGhpcyk7XG5cblx0XHRpZiAodGhpcy5fZmlyZUNsaWNrICYmIGUgJiYgZS5jaGFuZ2VkVG91Y2hlcykge1xuXG5cdFx0XHR2YXIgZmlyc3QgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLFxuXHRcdFx0ICAgIGVsID0gZmlyc3QudGFyZ2V0O1xuXG5cdFx0XHRpZiAoZWwgJiYgZWwudGFnTmFtZSAmJiBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdhJykge1xuXHRcdFx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3MoZWwsICdsZWFmbGV0LWFjdGl2ZScpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBzaW11bGF0ZSBjbGljayBpZiB0aGUgdG91Y2ggZGlkbid0IG1vdmUgdG9vIG11Y2hcblx0XHRcdGlmICh0aGlzLl9pc1RhcFZhbGlkKCkpIHtcblx0XHRcdFx0dGhpcy5fc2ltdWxhdGVFdmVudCgnY2xpY2snLCBmaXJzdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9pc1RhcFZhbGlkOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX25ld1Bvcy5kaXN0YW5jZVRvKHRoaXMuX3N0YXJ0UG9zKSA8PSB0aGlzLl9tYXAub3B0aW9ucy50YXBUb2xlcmFuY2U7XG5cdH0sXG5cblx0X29uTW92ZTogZnVuY3Rpb24gKGUpIHtcblx0XHR2YXIgZmlyc3QgPSBlLnRvdWNoZXNbMF07XG5cdFx0dGhpcy5fbmV3UG9zID0gbmV3IEwuUG9pbnQoZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSk7XG5cdH0sXG5cblx0X3NpbXVsYXRlRXZlbnQ6IGZ1bmN0aW9uICh0eXBlLCBlKSB7XG5cdFx0dmFyIHNpbXVsYXRlZEV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnRzJyk7XG5cblx0XHRzaW11bGF0ZWRFdmVudC5fc2ltdWxhdGVkID0gdHJ1ZTtcblx0XHRlLnRhcmdldC5fc2ltdWxhdGVkQ2xpY2sgPSB0cnVlO1xuXG5cdFx0c2ltdWxhdGVkRXZlbnQuaW5pdE1vdXNlRXZlbnQoXG5cdFx0ICAgICAgICB0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsXG5cdFx0ICAgICAgICBlLnNjcmVlblgsIGUuc2NyZWVuWSxcblx0XHQgICAgICAgIGUuY2xpZW50WCwgZS5jbGllbnRZLFxuXHRcdCAgICAgICAgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAsIG51bGwpO1xuXG5cdFx0ZS50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG5cdH1cbn0pO1xuXG5pZiAoTC5Ccm93c2VyLnRvdWNoICYmICFMLkJyb3dzZXIucG9pbnRlcikge1xuXHRMLk1hcC5hZGRJbml0SG9vaygnYWRkSGFuZGxlcicsICd0YXAnLCBMLk1hcC5UYXApO1xufVxuXG5cbi8qXG4gKiBMLkhhbmRsZXIuU2hpZnREcmFnWm9vbSBpcyB1c2VkIHRvIGFkZCBzaGlmdC1kcmFnIHpvb20gaW50ZXJhY3Rpb24gdG8gdGhlIG1hcFxuICAqICh6b29tIHRvIGEgc2VsZWN0ZWQgYm91bmRpbmcgYm94KSwgZW5hYmxlZCBieSBkZWZhdWx0LlxuICovXG5cbkwuTWFwLm1lcmdlT3B0aW9ucyh7XG5cdGJveFpvb206IHRydWVcbn0pO1xuXG5MLk1hcC5Cb3hab29tID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChtYXApIHtcblx0XHR0aGlzLl9tYXAgPSBtYXA7XG5cdFx0dGhpcy5fY29udGFpbmVyID0gbWFwLl9jb250YWluZXI7XG5cdFx0dGhpcy5fcGFuZSA9IG1hcC5fcGFuZXMub3ZlcmxheVBhbmU7XG5cdFx0dGhpcy5fbW92ZWQgPSBmYWxzZTtcblx0fSxcblxuXHRhZGRIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub24odGhpcy5fY29udGFpbmVyLCAnbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24sIHRoaXMpO1xuXHR9LFxuXG5cdHJlbW92ZUhvb2tzOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5Eb21FdmVudC5vZmYodGhpcy5fY29udGFpbmVyLCAnbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuXHRcdHRoaXMuX21vdmVkID0gZmFsc2U7XG5cdH0sXG5cblx0bW92ZWQ6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbW92ZWQ7XG5cdH0sXG5cblx0X29uTW91c2VEb3duOiBmdW5jdGlvbiAoZSkge1xuXHRcdHRoaXMuX21vdmVkID0gZmFsc2U7XG5cblx0XHRpZiAoIWUuc2hpZnRLZXkgfHwgKChlLndoaWNoICE9PSAxKSAmJiAoZS5idXR0b24gIT09IDEpKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRcdEwuRG9tVXRpbC5kaXNhYmxlVGV4dFNlbGVjdGlvbigpO1xuXHRcdEwuRG9tVXRpbC5kaXNhYmxlSW1hZ2VEcmFnKCk7XG5cblx0XHR0aGlzLl9zdGFydExheWVyUG9pbnQgPSB0aGlzLl9tYXAubW91c2VFdmVudFRvTGF5ZXJQb2ludChlKTtcblxuXHRcdEwuRG9tRXZlbnRcblx0XHQgICAgLm9uKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUsIHRoaXMpXG5cdFx0ICAgIC5vbihkb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9vbk1vdXNlVXAsIHRoaXMpXG5cdFx0ICAgIC5vbihkb2N1bWVudCwgJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24sIHRoaXMpO1xuXHR9LFxuXG5cdF9vbk1vdXNlTW92ZTogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIXRoaXMuX21vdmVkKSB7XG5cdFx0XHR0aGlzLl9ib3ggPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC16b29tLWJveCcsIHRoaXMuX3BhbmUpO1xuXHRcdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX2JveCwgdGhpcy5fc3RhcnRMYXllclBvaW50KTtcblxuXHRcdFx0Ly9UT0RPIHJlZmFjdG9yOiBtb3ZlIGN1cnNvciB0byBzdHlsZXNcblx0XHRcdHRoaXMuX2NvbnRhaW5lci5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcblx0XHRcdHRoaXMuX21hcC5maXJlKCdib3h6b29tc3RhcnQnKTtcblx0XHR9XG5cblx0XHR2YXIgc3RhcnRQb2ludCA9IHRoaXMuX3N0YXJ0TGF5ZXJQb2ludCxcblx0XHQgICAgYm94ID0gdGhpcy5fYm94LFxuXG5cdFx0ICAgIGxheWVyUG9pbnQgPSB0aGlzLl9tYXAubW91c2VFdmVudFRvTGF5ZXJQb2ludChlKSxcblx0XHQgICAgb2Zmc2V0ID0gbGF5ZXJQb2ludC5zdWJ0cmFjdChzdGFydFBvaW50KSxcblxuXHRcdCAgICBuZXdQb3MgPSBuZXcgTC5Qb2ludChcblx0XHQgICAgICAgIE1hdGgubWluKGxheWVyUG9pbnQueCwgc3RhcnRQb2ludC54KSxcblx0XHQgICAgICAgIE1hdGgubWluKGxheWVyUG9pbnQueSwgc3RhcnRQb2ludC55KSk7XG5cblx0XHRMLkRvbVV0aWwuc2V0UG9zaXRpb24oYm94LCBuZXdQb3MpO1xuXG5cdFx0dGhpcy5fbW92ZWQgPSB0cnVlO1xuXG5cdFx0Ly8gVE9ETyByZWZhY3RvcjogcmVtb3ZlIGhhcmRjb2RlZCA0IHBpeGVsc1xuXHRcdGJveC5zdHlsZS53aWR0aCAgPSAoTWF0aC5tYXgoMCwgTWF0aC5hYnMob2Zmc2V0LngpIC0gNCkpICsgJ3B4Jztcblx0XHRib3guc3R5bGUuaGVpZ2h0ID0gKE1hdGgubWF4KDAsIE1hdGguYWJzKG9mZnNldC55KSAtIDQpKSArICdweCc7XG5cdH0sXG5cblx0X2ZpbmlzaDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLl9tb3ZlZCkge1xuXHRcdFx0dGhpcy5fcGFuZS5yZW1vdmVDaGlsZCh0aGlzLl9ib3gpO1xuXHRcdFx0dGhpcy5fY29udGFpbmVyLnN0eWxlLmN1cnNvciA9ICcnO1xuXHRcdH1cblxuXHRcdEwuRG9tVXRpbC5lbmFibGVUZXh0U2VsZWN0aW9uKCk7XG5cdFx0TC5Eb21VdGlsLmVuYWJsZUltYWdlRHJhZygpO1xuXG5cdFx0TC5Eb21FdmVudFxuXHRcdCAgICAub2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpXG5cdFx0ICAgIC5vZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgdGhpcy5fb25Nb3VzZVVwKVxuXHRcdCAgICAub2ZmKGRvY3VtZW50LCAna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG5cdH0sXG5cblx0X29uTW91c2VVcDogZnVuY3Rpb24gKGUpIHtcblxuXHRcdHRoaXMuX2ZpbmlzaCgpO1xuXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcblx0XHQgICAgbGF5ZXJQb2ludCA9IG1hcC5tb3VzZUV2ZW50VG9MYXllclBvaW50KGUpO1xuXG5cdFx0aWYgKHRoaXMuX3N0YXJ0TGF5ZXJQb2ludC5lcXVhbHMobGF5ZXJQb2ludCkpIHsgcmV0dXJuOyB9XG5cblx0XHR2YXIgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKFxuXHRcdCAgICAgICAgbWFwLmxheWVyUG9pbnRUb0xhdExuZyh0aGlzLl9zdGFydExheWVyUG9pbnQpLFxuXHRcdCAgICAgICAgbWFwLmxheWVyUG9pbnRUb0xhdExuZyhsYXllclBvaW50KSk7XG5cblx0XHRtYXAuZml0Qm91bmRzKGJvdW5kcyk7XG5cblx0XHRtYXAuZmlyZSgnYm94em9vbWVuZCcsIHtcblx0XHRcdGJveFpvb21Cb3VuZHM6IGJvdW5kc1xuXHRcdH0pO1xuXHR9LFxuXG5cdF9vbktleURvd246IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKGUua2V5Q29kZSA9PT0gMjcpIHtcblx0XHRcdHRoaXMuX2ZpbmlzaCgpO1xuXHRcdH1cblx0fVxufSk7XG5cbkwuTWFwLmFkZEluaXRIb29rKCdhZGRIYW5kbGVyJywgJ2JveFpvb20nLCBMLk1hcC5Cb3hab29tKTtcblxuXG4vKlxuICogTC5NYXAuS2V5Ym9hcmQgaXMgaGFuZGxpbmcga2V5Ym9hcmQgaW50ZXJhY3Rpb24gd2l0aCB0aGUgbWFwLCBlbmFibGVkIGJ5IGRlZmF1bHQuXG4gKi9cblxuTC5NYXAubWVyZ2VPcHRpb25zKHtcblx0a2V5Ym9hcmQ6IHRydWUsXG5cdGtleWJvYXJkUGFuT2Zmc2V0OiA4MCxcblx0a2V5Ym9hcmRab29tT2Zmc2V0OiAxXG59KTtcblxuTC5NYXAuS2V5Ym9hcmQgPSBMLkhhbmRsZXIuZXh0ZW5kKHtcblxuXHRrZXlDb2Rlczoge1xuXHRcdGxlZnQ6ICAgIFszN10sXG5cdFx0cmlnaHQ6ICAgWzM5XSxcblx0XHRkb3duOiAgICBbNDBdLFxuXHRcdHVwOiAgICAgIFszOF0sXG5cdFx0em9vbUluOiAgWzE4NywgMTA3LCA2MSwgMTcxXSxcblx0XHR6b29tT3V0OiBbMTg5LCAxMDksIDE3M11cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAobWFwKSB7XG5cdFx0dGhpcy5fbWFwID0gbWFwO1xuXG5cdFx0dGhpcy5fc2V0UGFuT2Zmc2V0KG1hcC5vcHRpb25zLmtleWJvYXJkUGFuT2Zmc2V0KTtcblx0XHR0aGlzLl9zZXRab29tT2Zmc2V0KG1hcC5vcHRpb25zLmtleWJvYXJkWm9vbU9mZnNldCk7XG5cdH0sXG5cblx0YWRkSG9va3M6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY29udGFpbmVyID0gdGhpcy5fbWFwLl9jb250YWluZXI7XG5cblx0XHQvLyBtYWtlIHRoZSBjb250YWluZXIgZm9jdXNhYmxlIGJ5IHRhYmJpbmdcblx0XHRpZiAoY29udGFpbmVyLnRhYkluZGV4ID09PSAtMSkge1xuXHRcdFx0Y29udGFpbmVyLnRhYkluZGV4ID0gJzAnO1xuXHRcdH1cblxuXHRcdEwuRG9tRXZlbnRcblx0XHQgICAgLm9uKGNvbnRhaW5lciwgJ2ZvY3VzJywgdGhpcy5fb25Gb2N1cywgdGhpcylcblx0XHQgICAgLm9uKGNvbnRhaW5lciwgJ2JsdXInLCB0aGlzLl9vbkJsdXIsIHRoaXMpXG5cdFx0ICAgIC5vbihjb250YWluZXIsICdtb3VzZWRvd24nLCB0aGlzLl9vbk1vdXNlRG93biwgdGhpcyk7XG5cblx0XHR0aGlzLl9tYXBcblx0XHQgICAgLm9uKCdmb2N1cycsIHRoaXMuX2FkZEhvb2tzLCB0aGlzKVxuXHRcdCAgICAub24oJ2JsdXInLCB0aGlzLl9yZW1vdmVIb29rcywgdGhpcyk7XG5cdH0sXG5cblx0cmVtb3ZlSG9va3M6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLl9yZW1vdmVIb29rcygpO1xuXG5cdFx0dmFyIGNvbnRhaW5lciA9IHRoaXMuX21hcC5fY29udGFpbmVyO1xuXG5cdFx0TC5Eb21FdmVudFxuXHRcdCAgICAub2ZmKGNvbnRhaW5lciwgJ2ZvY3VzJywgdGhpcy5fb25Gb2N1cywgdGhpcylcblx0XHQgICAgLm9mZihjb250YWluZXIsICdibHVyJywgdGhpcy5fb25CbHVyLCB0aGlzKVxuXHRcdCAgICAub2ZmKGNvbnRhaW5lciwgJ21vdXNlZG93bicsIHRoaXMuX29uTW91c2VEb3duLCB0aGlzKTtcblxuXHRcdHRoaXMuX21hcFxuXHRcdCAgICAub2ZmKCdmb2N1cycsIHRoaXMuX2FkZEhvb2tzLCB0aGlzKVxuXHRcdCAgICAub2ZmKCdibHVyJywgdGhpcy5fcmVtb3ZlSG9va3MsIHRoaXMpO1xuXHR9LFxuXG5cdF9vbk1vdXNlRG93bjogZnVuY3Rpb24gKCkge1xuXHRcdGlmICh0aGlzLl9mb2N1c2VkKSB7IHJldHVybjsgfVxuXG5cdFx0dmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5LFxuXHRcdCAgICBkb2NFbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcblx0XHQgICAgdG9wID0gYm9keS5zY3JvbGxUb3AgfHwgZG9jRWwuc2Nyb2xsVG9wLFxuXHRcdCAgICBsZWZ0ID0gYm9keS5zY3JvbGxMZWZ0IHx8IGRvY0VsLnNjcm9sbExlZnQ7XG5cblx0XHR0aGlzLl9tYXAuX2NvbnRhaW5lci5mb2N1cygpO1xuXG5cdFx0d2luZG93LnNjcm9sbFRvKGxlZnQsIHRvcCk7XG5cdH0sXG5cblx0X29uRm9jdXM6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLl9mb2N1c2VkID0gdHJ1ZTtcblx0XHR0aGlzLl9tYXAuZmlyZSgnZm9jdXMnKTtcblx0fSxcblxuXHRfb25CbHVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5fZm9jdXNlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX21hcC5maXJlKCdibHVyJyk7XG5cdH0sXG5cblx0X3NldFBhbk9mZnNldDogZnVuY3Rpb24gKHBhbikge1xuXHRcdHZhciBrZXlzID0gdGhpcy5fcGFuS2V5cyA9IHt9LFxuXHRcdCAgICBjb2RlcyA9IHRoaXMua2V5Q29kZXMsXG5cdFx0ICAgIGksIGxlbjtcblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGNvZGVzLmxlZnQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGtleXNbY29kZXMubGVmdFtpXV0gPSBbLTEgKiBwYW4sIDBdO1xuXHRcdH1cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjb2Rlcy5yaWdodC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0a2V5c1tjb2Rlcy5yaWdodFtpXV0gPSBbcGFuLCAwXTtcblx0XHR9XG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY29kZXMuZG93bi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0a2V5c1tjb2Rlcy5kb3duW2ldXSA9IFswLCBwYW5dO1xuXHRcdH1cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjb2Rlcy51cC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0a2V5c1tjb2Rlcy51cFtpXV0gPSBbMCwgLTEgKiBwYW5dO1xuXHRcdH1cblx0fSxcblxuXHRfc2V0Wm9vbU9mZnNldDogZnVuY3Rpb24gKHpvb20pIHtcblx0XHR2YXIga2V5cyA9IHRoaXMuX3pvb21LZXlzID0ge30sXG5cdFx0ICAgIGNvZGVzID0gdGhpcy5rZXlDb2Rlcyxcblx0XHQgICAgaSwgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY29kZXMuem9vbUluLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRrZXlzW2NvZGVzLnpvb21JbltpXV0gPSB6b29tO1xuXHRcdH1cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjb2Rlcy56b29tT3V0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRrZXlzW2NvZGVzLnpvb21PdXRbaV1dID0gLXpvb207XG5cdFx0fVxuXHR9LFxuXG5cdF9hZGRIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub24oZG9jdW1lbnQsICdrZXlkb3duJywgdGhpcy5fb25LZXlEb3duLCB0aGlzKTtcblx0fSxcblxuXHRfcmVtb3ZlSG9va3M6IGZ1bmN0aW9uICgpIHtcblx0XHRMLkRvbUV2ZW50Lm9mZihkb2N1bWVudCwgJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24sIHRoaXMpO1xuXHR9LFxuXG5cdF9vbktleURvd246IGZ1bmN0aW9uIChlKSB7XG5cdFx0dmFyIGtleSA9IGUua2V5Q29kZSxcblx0XHQgICAgbWFwID0gdGhpcy5fbWFwO1xuXG5cdFx0aWYgKGtleSBpbiB0aGlzLl9wYW5LZXlzKSB7XG5cblx0XHRcdGlmIChtYXAuX3BhbkFuaW0gJiYgbWFwLl9wYW5BbmltLl9pblByb2dyZXNzKSB7IHJldHVybjsgfVxuXG5cdFx0XHRtYXAucGFuQnkodGhpcy5fcGFuS2V5c1trZXldKTtcblxuXHRcdFx0aWYgKG1hcC5vcHRpb25zLm1heEJvdW5kcykge1xuXHRcdFx0XHRtYXAucGFuSW5zaWRlQm91bmRzKG1hcC5vcHRpb25zLm1heEJvdW5kcyk7XG5cdFx0XHR9XG5cblx0XHR9IGVsc2UgaWYgKGtleSBpbiB0aGlzLl96b29tS2V5cykge1xuXHRcdFx0bWFwLnNldFpvb20obWFwLmdldFpvb20oKSArIHRoaXMuX3pvb21LZXlzW2tleV0pO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRMLkRvbUV2ZW50LnN0b3AoZSk7XG5cdH1cbn0pO1xuXG5MLk1hcC5hZGRJbml0SG9vaygnYWRkSGFuZGxlcicsICdrZXlib2FyZCcsIEwuTWFwLktleWJvYXJkKTtcblxuXG4vKlxuICogTC5IYW5kbGVyLk1hcmtlckRyYWcgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IEwuTWFya2VyIHRvIG1ha2UgdGhlIG1hcmtlcnMgZHJhZ2dhYmxlLlxuICovXG5cbkwuSGFuZGxlci5NYXJrZXJEcmFnID0gTC5IYW5kbGVyLmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChtYXJrZXIpIHtcblx0XHR0aGlzLl9tYXJrZXIgPSBtYXJrZXI7XG5cdH0sXG5cblx0YWRkSG9va3M6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaWNvbiA9IHRoaXMuX21hcmtlci5faWNvbjtcblx0XHRpZiAoIXRoaXMuX2RyYWdnYWJsZSkge1xuXHRcdFx0dGhpcy5fZHJhZ2dhYmxlID0gbmV3IEwuRHJhZ2dhYmxlKGljb24sIGljb24pO1xuXHRcdH1cblxuXHRcdHRoaXMuX2RyYWdnYWJsZVxuXHRcdFx0Lm9uKCdkcmFnc3RhcnQnLCB0aGlzLl9vbkRyYWdTdGFydCwgdGhpcylcblx0XHRcdC5vbignZHJhZycsIHRoaXMuX29uRHJhZywgdGhpcylcblx0XHRcdC5vbignZHJhZ2VuZCcsIHRoaXMuX29uRHJhZ0VuZCwgdGhpcyk7XG5cdFx0dGhpcy5fZHJhZ2dhYmxlLmVuYWJsZSgpO1xuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9tYXJrZXIuX2ljb24sICdsZWFmbGV0LW1hcmtlci1kcmFnZ2FibGUnKTtcblx0fSxcblxuXHRyZW1vdmVIb29rczogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuX2RyYWdnYWJsZVxuXHRcdFx0Lm9mZignZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQsIHRoaXMpXG5cdFx0XHQub2ZmKCdkcmFnJywgdGhpcy5fb25EcmFnLCB0aGlzKVxuXHRcdFx0Lm9mZignZHJhZ2VuZCcsIHRoaXMuX29uRHJhZ0VuZCwgdGhpcyk7XG5cblx0XHR0aGlzLl9kcmFnZ2FibGUuZGlzYWJsZSgpO1xuXHRcdEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9tYXJrZXIuX2ljb24sICdsZWFmbGV0LW1hcmtlci1kcmFnZ2FibGUnKTtcblx0fSxcblxuXHRtb3ZlZDogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLl9kcmFnZ2FibGUgJiYgdGhpcy5fZHJhZ2dhYmxlLl9tb3ZlZDtcblx0fSxcblxuXHRfb25EcmFnU3RhcnQ6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLl9tYXJrZXJcblx0XHQgICAgLmNsb3NlUG9wdXAoKVxuXHRcdCAgICAuZmlyZSgnbW92ZXN0YXJ0Jylcblx0XHQgICAgLmZpcmUoJ2RyYWdzdGFydCcpO1xuXHR9LFxuXG5cdF9vbkRyYWc6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbWFya2VyID0gdGhpcy5fbWFya2VyLFxuXHRcdCAgICBzaGFkb3cgPSBtYXJrZXIuX3NoYWRvdyxcblx0XHQgICAgaWNvblBvcyA9IEwuRG9tVXRpbC5nZXRQb3NpdGlvbihtYXJrZXIuX2ljb24pLFxuXHRcdCAgICBsYXRsbmcgPSBtYXJrZXIuX21hcC5sYXllclBvaW50VG9MYXRMbmcoaWNvblBvcyk7XG5cblx0XHQvLyB1cGRhdGUgc2hhZG93IHBvc2l0aW9uXG5cdFx0aWYgKHNoYWRvdykge1xuXHRcdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKHNoYWRvdywgaWNvblBvcyk7XG5cdFx0fVxuXG5cdFx0bWFya2VyLl9sYXRsbmcgPSBsYXRsbmc7XG5cblx0XHRtYXJrZXJcblx0XHQgICAgLmZpcmUoJ21vdmUnLCB7bGF0bG5nOiBsYXRsbmd9KVxuXHRcdCAgICAuZmlyZSgnZHJhZycpO1xuXHR9LFxuXG5cdF9vbkRyYWdFbmQ6IGZ1bmN0aW9uIChlKSB7XG5cdFx0dGhpcy5fbWFya2VyXG5cdFx0ICAgIC5maXJlKCdtb3ZlZW5kJylcblx0XHQgICAgLmZpcmUoJ2RyYWdlbmQnLCBlKTtcblx0fVxufSk7XG5cblxuLypcclxuICogTC5Db250cm9sIGlzIGEgYmFzZSBjbGFzcyBmb3IgaW1wbGVtZW50aW5nIG1hcCBjb250cm9scy4gSGFuZGxlcyBwb3NpdGlvbmluZy5cclxuICogQWxsIG90aGVyIGNvbnRyb2xzIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXHJcbiAqL1xyXG5cclxuTC5Db250cm9sID0gTC5DbGFzcy5leHRlbmQoe1xyXG5cdG9wdGlvbnM6IHtcclxuXHRcdHBvc2l0aW9uOiAndG9wcmlnaHQnXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHR9LFxyXG5cclxuXHRnZXRQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMub3B0aW9ucy5wb3NpdGlvbjtcclxuXHR9LFxyXG5cclxuXHRzZXRQb3NpdGlvbjogZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcblx0XHR2YXIgbWFwID0gdGhpcy5fbWFwO1xyXG5cclxuXHRcdGlmIChtYXApIHtcclxuXHRcdFx0bWFwLnJlbW92ZUNvbnRyb2wodGhpcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5vcHRpb25zLnBvc2l0aW9uID0gcG9zaXRpb247XHJcblxyXG5cdFx0aWYgKG1hcCkge1xyXG5cdFx0XHRtYXAuYWRkQ29udHJvbCh0aGlzKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRnZXRDb250YWluZXI6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb250YWluZXI7XHJcblx0fSxcclxuXHJcblx0YWRkVG86IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdHRoaXMuX21hcCA9IG1hcDtcclxuXHJcblx0XHR2YXIgY29udGFpbmVyID0gdGhpcy5fY29udGFpbmVyID0gdGhpcy5vbkFkZChtYXApLFxyXG5cdFx0ICAgIHBvcyA9IHRoaXMuZ2V0UG9zaXRpb24oKSxcclxuXHRcdCAgICBjb3JuZXIgPSBtYXAuX2NvbnRyb2xDb3JuZXJzW3Bvc107XHJcblxyXG5cdFx0TC5Eb21VdGlsLmFkZENsYXNzKGNvbnRhaW5lciwgJ2xlYWZsZXQtY29udHJvbCcpO1xyXG5cclxuXHRcdGlmIChwb3MuaW5kZXhPZignYm90dG9tJykgIT09IC0xKSB7XHJcblx0XHRcdGNvcm5lci5pbnNlcnRCZWZvcmUoY29udGFpbmVyLCBjb3JuZXIuZmlyc3RDaGlsZCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb3JuZXIuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmVGcm9tOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHR2YXIgcG9zID0gdGhpcy5nZXRQb3NpdGlvbigpLFxyXG5cdFx0ICAgIGNvcm5lciA9IG1hcC5fY29udHJvbENvcm5lcnNbcG9zXTtcclxuXHJcblx0XHRjb3JuZXIucmVtb3ZlQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcclxuXHRcdHRoaXMuX21hcCA9IG51bGw7XHJcblxyXG5cdFx0aWYgKHRoaXMub25SZW1vdmUpIHtcclxuXHRcdFx0dGhpcy5vblJlbW92ZShtYXApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdF9yZWZvY3VzT25NYXA6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICh0aGlzLl9tYXApIHtcclxuXHRcdFx0dGhpcy5fbWFwLmdldENvbnRhaW5lcigpLmZvY3VzKCk7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxuXHJcbkwuY29udHJvbCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLkNvbnRyb2wob3B0aW9ucyk7XHJcbn07XHJcblxyXG5cclxuLy8gYWRkcyBjb250cm9sLXJlbGF0ZWQgbWV0aG9kcyB0byBMLk1hcFxyXG5cclxuTC5NYXAuaW5jbHVkZSh7XHJcblx0YWRkQ29udHJvbDogZnVuY3Rpb24gKGNvbnRyb2wpIHtcclxuXHRcdGNvbnRyb2wuYWRkVG8odGhpcyk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmVDb250cm9sOiBmdW5jdGlvbiAoY29udHJvbCkge1xyXG5cdFx0Y29udHJvbC5yZW1vdmVGcm9tKHRoaXMpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0X2luaXRDb250cm9sUG9zOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgY29ybmVycyA9IHRoaXMuX2NvbnRyb2xDb3JuZXJzID0ge30sXHJcblx0XHQgICAgbCA9ICdsZWFmbGV0LScsXHJcblx0XHQgICAgY29udGFpbmVyID0gdGhpcy5fY29udHJvbENvbnRhaW5lciA9XHJcblx0XHQgICAgICAgICAgICBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBsICsgJ2NvbnRyb2wtY29udGFpbmVyJywgdGhpcy5fY29udGFpbmVyKTtcclxuXHJcblx0XHRmdW5jdGlvbiBjcmVhdGVDb3JuZXIodlNpZGUsIGhTaWRlKSB7XHJcblx0XHRcdHZhciBjbGFzc05hbWUgPSBsICsgdlNpZGUgKyAnICcgKyBsICsgaFNpZGU7XHJcblxyXG5cdFx0XHRjb3JuZXJzW3ZTaWRlICsgaFNpZGVdID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY2xhc3NOYW1lLCBjb250YWluZXIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNyZWF0ZUNvcm5lcigndG9wJywgJ2xlZnQnKTtcclxuXHRcdGNyZWF0ZUNvcm5lcigndG9wJywgJ3JpZ2h0Jyk7XHJcblx0XHRjcmVhdGVDb3JuZXIoJ2JvdHRvbScsICdsZWZ0Jyk7XHJcblx0XHRjcmVhdGVDb3JuZXIoJ2JvdHRvbScsICdyaWdodCcpO1xyXG5cdH0sXHJcblxyXG5cdF9jbGVhckNvbnRyb2xQb3M6IGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoaXMuX2NvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLl9jb250cm9sQ29udGFpbmVyKTtcclxuXHR9XHJcbn0pO1xyXG5cblxuLypcclxuICogTC5Db250cm9sLlpvb20gaXMgdXNlZCBmb3IgdGhlIGRlZmF1bHQgem9vbSBidXR0b25zIG9uIHRoZSBtYXAuXHJcbiAqL1xyXG5cclxuTC5Db250cm9sLlpvb20gPSBMLkNvbnRyb2wuZXh0ZW5kKHtcclxuXHRvcHRpb25zOiB7XHJcblx0XHRwb3NpdGlvbjogJ3RvcGxlZnQnLFxyXG5cdFx0em9vbUluVGV4dDogJysnLFxyXG5cdFx0em9vbUluVGl0bGU6ICdab29tIGluJyxcclxuXHRcdHpvb21PdXRUZXh0OiAnLScsXHJcblx0XHR6b29tT3V0VGl0bGU6ICdab29tIG91dCdcclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0dmFyIHpvb21OYW1lID0gJ2xlYWZsZXQtY29udHJvbC16b29tJyxcclxuXHRcdCAgICBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCB6b29tTmFtZSArICcgbGVhZmxldC1iYXInKTtcclxuXHJcblx0XHR0aGlzLl9tYXAgPSBtYXA7XHJcblxyXG5cdFx0dGhpcy5fem9vbUluQnV0dG9uICA9IHRoaXMuX2NyZWF0ZUJ1dHRvbihcclxuXHRcdCAgICAgICAgdGhpcy5vcHRpb25zLnpvb21JblRleHQsIHRoaXMub3B0aW9ucy56b29tSW5UaXRsZSxcclxuXHRcdCAgICAgICAgem9vbU5hbWUgKyAnLWluJywgIGNvbnRhaW5lciwgdGhpcy5fem9vbUluLCAgdGhpcyk7XHJcblx0XHR0aGlzLl96b29tT3V0QnV0dG9uID0gdGhpcy5fY3JlYXRlQnV0dG9uKFxyXG5cdFx0ICAgICAgICB0aGlzLm9wdGlvbnMuem9vbU91dFRleHQsIHRoaXMub3B0aW9ucy56b29tT3V0VGl0bGUsXHJcblx0XHQgICAgICAgIHpvb21OYW1lICsgJy1vdXQnLCBjb250YWluZXIsIHRoaXMuX3pvb21PdXQsIHRoaXMpO1xyXG5cclxuXHRcdHRoaXMuX3VwZGF0ZURpc2FibGVkKCk7XHJcblx0XHRtYXAub24oJ3pvb21lbmQgem9vbWxldmVsc2NoYW5nZScsIHRoaXMuX3VwZGF0ZURpc2FibGVkLCB0aGlzKTtcclxuXHJcblx0XHRyZXR1cm4gY29udGFpbmVyO1xyXG5cdH0sXHJcblxyXG5cdG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XHJcblx0XHRtYXAub2ZmKCd6b29tZW5kIHpvb21sZXZlbHNjaGFuZ2UnLCB0aGlzLl91cGRhdGVEaXNhYmxlZCwgdGhpcyk7XHJcblx0fSxcclxuXHJcblx0X3pvb21JbjogZnVuY3Rpb24gKGUpIHtcclxuXHRcdHRoaXMuX21hcC56b29tSW4oZS5zaGlmdEtleSA/IDMgOiAxKTtcclxuXHR9LFxyXG5cclxuXHRfem9vbU91dDogZnVuY3Rpb24gKGUpIHtcclxuXHRcdHRoaXMuX21hcC56b29tT3V0KGUuc2hpZnRLZXkgPyAzIDogMSk7XHJcblx0fSxcclxuXHJcblx0X2NyZWF0ZUJ1dHRvbjogZnVuY3Rpb24gKGh0bWwsIHRpdGxlLCBjbGFzc05hbWUsIGNvbnRhaW5lciwgZm4sIGNvbnRleHQpIHtcclxuXHRcdHZhciBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsIGNsYXNzTmFtZSwgY29udGFpbmVyKTtcclxuXHRcdGxpbmsuaW5uZXJIVE1MID0gaHRtbDtcclxuXHRcdGxpbmsuaHJlZiA9ICcjJztcclxuXHRcdGxpbmsudGl0bGUgPSB0aXRsZTtcclxuXHJcblx0XHR2YXIgc3RvcCA9IEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xyXG5cclxuXHRcdEwuRG9tRXZlbnRcclxuXHRcdCAgICAub24obGluaywgJ2NsaWNrJywgc3RvcClcclxuXHRcdCAgICAub24obGluaywgJ21vdXNlZG93bicsIHN0b3ApXHJcblx0XHQgICAgLm9uKGxpbmssICdkYmxjbGljaycsIHN0b3ApXHJcblx0XHQgICAgLm9uKGxpbmssICdjbGljaycsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpXHJcblx0XHQgICAgLm9uKGxpbmssICdjbGljaycsIGZuLCBjb250ZXh0KVxyXG5cdFx0ICAgIC5vbihsaW5rLCAnY2xpY2snLCB0aGlzLl9yZWZvY3VzT25NYXAsIGNvbnRleHQpO1xyXG5cclxuXHRcdHJldHVybiBsaW5rO1xyXG5cdH0sXHJcblxyXG5cdF91cGRhdGVEaXNhYmxlZDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIG1hcCA9IHRoaXMuX21hcCxcclxuXHRcdFx0Y2xhc3NOYW1lID0gJ2xlYWZsZXQtZGlzYWJsZWQnO1xyXG5cclxuXHRcdEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl96b29tSW5CdXR0b24sIGNsYXNzTmFtZSk7XHJcblx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fem9vbU91dEJ1dHRvbiwgY2xhc3NOYW1lKTtcclxuXHJcblx0XHRpZiAobWFwLl96b29tID09PSBtYXAuZ2V0TWluWm9vbSgpKSB7XHJcblx0XHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl96b29tT3V0QnV0dG9uLCBjbGFzc05hbWUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG1hcC5fem9vbSA9PT0gbWFwLmdldE1heFpvb20oKSkge1xyXG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fem9vbUluQnV0dG9uLCBjbGFzc05hbWUpO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG5MLk1hcC5tZXJnZU9wdGlvbnMoe1xyXG5cdHpvb21Db250cm9sOiB0cnVlXHJcbn0pO1xyXG5cclxuTC5NYXAuYWRkSW5pdEhvb2soZnVuY3Rpb24gKCkge1xyXG5cdGlmICh0aGlzLm9wdGlvbnMuem9vbUNvbnRyb2wpIHtcclxuXHRcdHRoaXMuem9vbUNvbnRyb2wgPSBuZXcgTC5Db250cm9sLlpvb20oKTtcclxuXHRcdHRoaXMuYWRkQ29udHJvbCh0aGlzLnpvb21Db250cm9sKTtcclxuXHR9XHJcbn0pO1xyXG5cclxuTC5jb250cm9sLnpvb20gPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdHJldHVybiBuZXcgTC5Db250cm9sLlpvb20ob3B0aW9ucyk7XHJcbn07XHJcblxyXG5cblxuLypcclxuICogTC5Db250cm9sLkF0dHJpYnV0aW9uIGlzIHVzZWQgZm9yIGRpc3BsYXlpbmcgYXR0cmlidXRpb24gb24gdGhlIG1hcCAoYWRkZWQgYnkgZGVmYXVsdCkuXHJcbiAqL1xyXG5cclxuTC5Db250cm9sLkF0dHJpYnV0aW9uID0gTC5Db250cm9sLmV4dGVuZCh7XHJcblx0b3B0aW9uczoge1xyXG5cdFx0cG9zaXRpb246ICdib3R0b21yaWdodCcsXHJcblx0XHRwcmVmaXg6ICc8YSBocmVmPVwiaHR0cDovL2xlYWZsZXRqcy5jb21cIiB0aXRsZT1cIkEgSlMgbGlicmFyeSBmb3IgaW50ZXJhY3RpdmUgbWFwc1wiPkxlYWZsZXQ8L2E+J1xyXG5cdH0sXHJcblxyXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblxyXG5cdFx0dGhpcy5fYXR0cmlidXRpb25zID0ge307XHJcblx0fSxcclxuXHJcblx0b25BZGQ6IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtYXR0cmlidXRpb24nKTtcclxuXHRcdEwuRG9tRXZlbnQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24odGhpcy5fY29udGFpbmVyKTtcclxuXHJcblx0XHRmb3IgKHZhciBpIGluIG1hcC5fbGF5ZXJzKSB7XHJcblx0XHRcdGlmIChtYXAuX2xheWVyc1tpXS5nZXRBdHRyaWJ1dGlvbikge1xyXG5cdFx0XHRcdHRoaXMuYWRkQXR0cmlidXRpb24obWFwLl9sYXllcnNbaV0uZ2V0QXR0cmlidXRpb24oKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0bWFwXHJcblx0XHQgICAgLm9uKCdsYXllcmFkZCcsIHRoaXMuX29uTGF5ZXJBZGQsIHRoaXMpXHJcblx0XHQgICAgLm9uKCdsYXllcnJlbW92ZScsIHRoaXMuX29uTGF5ZXJSZW1vdmUsIHRoaXMpO1xyXG5cclxuXHRcdHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzLl9jb250YWluZXI7XHJcblx0fSxcclxuXHJcblx0b25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcFxyXG5cdFx0ICAgIC5vZmYoJ2xheWVyYWRkJywgdGhpcy5fb25MYXllckFkZClcclxuXHRcdCAgICAub2ZmKCdsYXllcnJlbW92ZScsIHRoaXMuX29uTGF5ZXJSZW1vdmUpO1xyXG5cclxuXHR9LFxyXG5cclxuXHRzZXRQcmVmaXg6IGZ1bmN0aW9uIChwcmVmaXgpIHtcclxuXHRcdHRoaXMub3B0aW9ucy5wcmVmaXggPSBwcmVmaXg7XHJcblx0XHR0aGlzLl91cGRhdGUoKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGFkZEF0dHJpYnV0aW9uOiBmdW5jdGlvbiAodGV4dCkge1xyXG5cdFx0aWYgKCF0ZXh0KSB7IHJldHVybjsgfVxyXG5cclxuXHRcdGlmICghdGhpcy5fYXR0cmlidXRpb25zW3RleHRdKSB7XHJcblx0XHRcdHRoaXMuX2F0dHJpYnV0aW9uc1t0ZXh0XSA9IDA7XHJcblx0XHR9XHJcblx0XHR0aGlzLl9hdHRyaWJ1dGlvbnNbdGV4dF0rKztcclxuXHJcblx0XHR0aGlzLl91cGRhdGUoKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmVBdHRyaWJ1dGlvbjogZnVuY3Rpb24gKHRleHQpIHtcclxuXHRcdGlmICghdGV4dCkgeyByZXR1cm47IH1cclxuXHJcblx0XHRpZiAodGhpcy5fYXR0cmlidXRpb25zW3RleHRdKSB7XHJcblx0XHRcdHRoaXMuX2F0dHJpYnV0aW9uc1t0ZXh0XS0tO1xyXG5cdFx0XHR0aGlzLl91cGRhdGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX21hcCkgeyByZXR1cm47IH1cclxuXHJcblx0XHR2YXIgYXR0cmlicyA9IFtdO1xyXG5cclxuXHRcdGZvciAodmFyIGkgaW4gdGhpcy5fYXR0cmlidXRpb25zKSB7XHJcblx0XHRcdGlmICh0aGlzLl9hdHRyaWJ1dGlvbnNbaV0pIHtcclxuXHRcdFx0XHRhdHRyaWJzLnB1c2goaSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgcHJlZml4QW5kQXR0cmlicyA9IFtdO1xyXG5cclxuXHRcdGlmICh0aGlzLm9wdGlvbnMucHJlZml4KSB7XHJcblx0XHRcdHByZWZpeEFuZEF0dHJpYnMucHVzaCh0aGlzLm9wdGlvbnMucHJlZml4KTtcclxuXHRcdH1cclxuXHRcdGlmIChhdHRyaWJzLmxlbmd0aCkge1xyXG5cdFx0XHRwcmVmaXhBbmRBdHRyaWJzLnB1c2goYXR0cmlicy5qb2luKCcsICcpKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9jb250YWluZXIuaW5uZXJIVE1MID0gcHJlZml4QW5kQXR0cmlicy5qb2luKCcgfCAnKTtcclxuXHR9LFxyXG5cclxuXHRfb25MYXllckFkZDogZnVuY3Rpb24gKGUpIHtcclxuXHRcdGlmIChlLmxheWVyLmdldEF0dHJpYnV0aW9uKSB7XHJcblx0XHRcdHRoaXMuYWRkQXR0cmlidXRpb24oZS5sYXllci5nZXRBdHRyaWJ1dGlvbigpKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfb25MYXllclJlbW92ZTogZnVuY3Rpb24gKGUpIHtcclxuXHRcdGlmIChlLmxheWVyLmdldEF0dHJpYnV0aW9uKSB7XHJcblx0XHRcdHRoaXMucmVtb3ZlQXR0cmlidXRpb24oZS5sYXllci5nZXRBdHRyaWJ1dGlvbigpKTtcclxuXHRcdH1cclxuXHR9XHJcbn0pO1xyXG5cclxuTC5NYXAubWVyZ2VPcHRpb25zKHtcclxuXHRhdHRyaWJ1dGlvbkNvbnRyb2w6IHRydWVcclxufSk7XHJcblxyXG5MLk1hcC5hZGRJbml0SG9vayhmdW5jdGlvbiAoKSB7XHJcblx0aWYgKHRoaXMub3B0aW9ucy5hdHRyaWJ1dGlvbkNvbnRyb2wpIHtcclxuXHRcdHRoaXMuYXR0cmlidXRpb25Db250cm9sID0gKG5ldyBMLkNvbnRyb2wuQXR0cmlidXRpb24oKSkuYWRkVG8odGhpcyk7XHJcblx0fVxyXG59KTtcclxuXHJcbkwuY29udHJvbC5hdHRyaWJ1dGlvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0cmV0dXJuIG5ldyBMLkNvbnRyb2wuQXR0cmlidXRpb24ob3B0aW9ucyk7XHJcbn07XHJcblxuXG4vKlxuICogTC5Db250cm9sLlNjYWxlIGlzIHVzZWQgZm9yIGRpc3BsYXlpbmcgbWV0cmljL2ltcGVyaWFsIHNjYWxlIG9uIHRoZSBtYXAuXG4gKi9cblxuTC5Db250cm9sLlNjYWxlID0gTC5Db250cm9sLmV4dGVuZCh7XG5cdG9wdGlvbnM6IHtcblx0XHRwb3NpdGlvbjogJ2JvdHRvbWxlZnQnLFxuXHRcdG1heFdpZHRoOiAxMDAsXG5cdFx0bWV0cmljOiB0cnVlLFxuXHRcdGltcGVyaWFsOiB0cnVlLFxuXHRcdHVwZGF0ZVdoZW5JZGxlOiBmYWxzZVxuXHR9LFxuXG5cdG9uQWRkOiBmdW5jdGlvbiAobWFwKSB7XG5cdFx0dGhpcy5fbWFwID0gbWFwO1xuXG5cdFx0dmFyIGNsYXNzTmFtZSA9ICdsZWFmbGV0LWNvbnRyb2wtc2NhbGUnLFxuXHRcdCAgICBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUpLFxuXHRcdCAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG5cdFx0dGhpcy5fYWRkU2NhbGVzKG9wdGlvbnMsIGNsYXNzTmFtZSwgY29udGFpbmVyKTtcblxuXHRcdG1hcC5vbihvcHRpb25zLnVwZGF0ZVdoZW5JZGxlID8gJ21vdmVlbmQnIDogJ21vdmUnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xuXHRcdG1hcC53aGVuUmVhZHkodGhpcy5fdXBkYXRlLCB0aGlzKTtcblxuXHRcdHJldHVybiBjb250YWluZXI7XG5cdH0sXG5cblx0b25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcblx0XHRtYXAub2ZmKHRoaXMub3B0aW9ucy51cGRhdGVXaGVuSWRsZSA/ICdtb3ZlZW5kJyA6ICdtb3ZlJywgdGhpcy5fdXBkYXRlLCB0aGlzKTtcblx0fSxcblxuXHRfYWRkU2NhbGVzOiBmdW5jdGlvbiAob3B0aW9ucywgY2xhc3NOYW1lLCBjb250YWluZXIpIHtcblx0XHRpZiAob3B0aW9ucy5tZXRyaWMpIHtcblx0XHRcdHRoaXMuX21TY2FsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsIGNsYXNzTmFtZSArICctbGluZScsIGNvbnRhaW5lcik7XG5cdFx0fVxuXHRcdGlmIChvcHRpb25zLmltcGVyaWFsKSB7XG5cdFx0XHR0aGlzLl9pU2NhbGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUgKyAnLWxpbmUnLCBjb250YWluZXIpO1xuXHRcdH1cblx0fSxcblxuXHRfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGJvdW5kcyA9IHRoaXMuX21hcC5nZXRCb3VuZHMoKSxcblx0XHQgICAgY2VudGVyTGF0ID0gYm91bmRzLmdldENlbnRlcigpLmxhdCxcblx0XHQgICAgaGFsZldvcmxkTWV0ZXJzID0gNjM3ODEzNyAqIE1hdGguUEkgKiBNYXRoLmNvcyhjZW50ZXJMYXQgKiBNYXRoLlBJIC8gMTgwKSxcblx0XHQgICAgZGlzdCA9IGhhbGZXb3JsZE1ldGVycyAqIChib3VuZHMuZ2V0Tm9ydGhFYXN0KCkubG5nIC0gYm91bmRzLmdldFNvdXRoV2VzdCgpLmxuZykgLyAxODAsXG5cblx0XHQgICAgc2l6ZSA9IHRoaXMuX21hcC5nZXRTaXplKCksXG5cdFx0ICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG5cdFx0ICAgIG1heE1ldGVycyA9IDA7XG5cblx0XHRpZiAoc2l6ZS54ID4gMCkge1xuXHRcdFx0bWF4TWV0ZXJzID0gZGlzdCAqIChvcHRpb25zLm1heFdpZHRoIC8gc2l6ZS54KTtcblx0XHR9XG5cblx0XHR0aGlzLl91cGRhdGVTY2FsZXMob3B0aW9ucywgbWF4TWV0ZXJzKTtcblx0fSxcblxuXHRfdXBkYXRlU2NhbGVzOiBmdW5jdGlvbiAob3B0aW9ucywgbWF4TWV0ZXJzKSB7XG5cdFx0aWYgKG9wdGlvbnMubWV0cmljICYmIG1heE1ldGVycykge1xuXHRcdFx0dGhpcy5fdXBkYXRlTWV0cmljKG1heE1ldGVycyk7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuaW1wZXJpYWwgJiYgbWF4TWV0ZXJzKSB7XG5cdFx0XHR0aGlzLl91cGRhdGVJbXBlcmlhbChtYXhNZXRlcnMpO1xuXHRcdH1cblx0fSxcblxuXHRfdXBkYXRlTWV0cmljOiBmdW5jdGlvbiAobWF4TWV0ZXJzKSB7XG5cdFx0dmFyIG1ldGVycyA9IHRoaXMuX2dldFJvdW5kTnVtKG1heE1ldGVycyk7XG5cblx0XHR0aGlzLl9tU2NhbGUuc3R5bGUud2lkdGggPSB0aGlzLl9nZXRTY2FsZVdpZHRoKG1ldGVycyAvIG1heE1ldGVycykgKyAncHgnO1xuXHRcdHRoaXMuX21TY2FsZS5pbm5lckhUTUwgPSBtZXRlcnMgPCAxMDAwID8gbWV0ZXJzICsgJyBtJyA6IChtZXRlcnMgLyAxMDAwKSArICcga20nO1xuXHR9LFxuXG5cdF91cGRhdGVJbXBlcmlhbDogZnVuY3Rpb24gKG1heE1ldGVycykge1xuXHRcdHZhciBtYXhGZWV0ID0gbWF4TWV0ZXJzICogMy4yODA4Mzk5LFxuXHRcdCAgICBzY2FsZSA9IHRoaXMuX2lTY2FsZSxcblx0XHQgICAgbWF4TWlsZXMsIG1pbGVzLCBmZWV0O1xuXG5cdFx0aWYgKG1heEZlZXQgPiA1MjgwKSB7XG5cdFx0XHRtYXhNaWxlcyA9IG1heEZlZXQgLyA1MjgwO1xuXHRcdFx0bWlsZXMgPSB0aGlzLl9nZXRSb3VuZE51bShtYXhNaWxlcyk7XG5cblx0XHRcdHNjYWxlLnN0eWxlLndpZHRoID0gdGhpcy5fZ2V0U2NhbGVXaWR0aChtaWxlcyAvIG1heE1pbGVzKSArICdweCc7XG5cdFx0XHRzY2FsZS5pbm5lckhUTUwgPSBtaWxlcyArICcgbWknO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGZlZXQgPSB0aGlzLl9nZXRSb3VuZE51bShtYXhGZWV0KTtcblxuXHRcdFx0c2NhbGUuc3R5bGUud2lkdGggPSB0aGlzLl9nZXRTY2FsZVdpZHRoKGZlZXQgLyBtYXhGZWV0KSArICdweCc7XG5cdFx0XHRzY2FsZS5pbm5lckhUTUwgPSBmZWV0ICsgJyBmdCc7XG5cdFx0fVxuXHR9LFxuXG5cdF9nZXRTY2FsZVdpZHRoOiBmdW5jdGlvbiAocmF0aW8pIHtcblx0XHRyZXR1cm4gTWF0aC5yb3VuZCh0aGlzLm9wdGlvbnMubWF4V2lkdGggKiByYXRpbykgLSAxMDtcblx0fSxcblxuXHRfZ2V0Um91bmROdW06IGZ1bmN0aW9uIChudW0pIHtcblx0XHR2YXIgcG93MTAgPSBNYXRoLnBvdygxMCwgKE1hdGguZmxvb3IobnVtKSArICcnKS5sZW5ndGggLSAxKSxcblx0XHQgICAgZCA9IG51bSAvIHBvdzEwO1xuXG5cdFx0ZCA9IGQgPj0gMTAgPyAxMCA6IGQgPj0gNSA/IDUgOiBkID49IDMgPyAzIDogZCA+PSAyID8gMiA6IDE7XG5cblx0XHRyZXR1cm4gcG93MTAgKiBkO1xuXHR9XG59KTtcblxuTC5jb250cm9sLnNjYWxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0cmV0dXJuIG5ldyBMLkNvbnRyb2wuU2NhbGUob3B0aW9ucyk7XG59O1xuXG5cbi8qXHJcbiAqIEwuQ29udHJvbC5MYXllcnMgaXMgYSBjb250cm9sIHRvIGFsbG93IHVzZXJzIHRvIHN3aXRjaCBiZXR3ZWVuIGRpZmZlcmVudCBsYXllcnMgb24gdGhlIG1hcC5cclxuICovXHJcblxyXG5MLkNvbnRyb2wuTGF5ZXJzID0gTC5Db250cm9sLmV4dGVuZCh7XHJcblx0b3B0aW9uczoge1xyXG5cdFx0Y29sbGFwc2VkOiB0cnVlLFxyXG5cdFx0cG9zaXRpb246ICd0b3ByaWdodCcsXHJcblx0XHRhdXRvWkluZGV4OiB0cnVlXHJcblx0fSxcclxuXHJcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gKGJhc2VMYXllcnMsIG92ZXJsYXlzLCBvcHRpb25zKSB7XHJcblx0XHRMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblxyXG5cdFx0dGhpcy5fbGF5ZXJzID0ge307XHJcblx0XHR0aGlzLl9sYXN0WkluZGV4ID0gMDtcclxuXHRcdHRoaXMuX2hhbmRsaW5nQ2xpY2sgPSBmYWxzZTtcclxuXHJcblx0XHRmb3IgKHZhciBpIGluIGJhc2VMYXllcnMpIHtcclxuXHRcdFx0dGhpcy5fYWRkTGF5ZXIoYmFzZUxheWVyc1tpXSwgaSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yIChpIGluIG92ZXJsYXlzKSB7XHJcblx0XHRcdHRoaXMuX2FkZExheWVyKG92ZXJsYXlzW2ldLCBpLCB0cnVlKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRvbkFkZDogZnVuY3Rpb24gKG1hcCkge1xyXG5cdFx0dGhpcy5faW5pdExheW91dCgpO1xyXG5cdFx0dGhpcy5fdXBkYXRlKCk7XHJcblxyXG5cdFx0bWFwXHJcblx0XHQgICAgLm9uKCdsYXllcmFkZCcsIHRoaXMuX29uTGF5ZXJDaGFuZ2UsIHRoaXMpXHJcblx0XHQgICAgLm9uKCdsYXllcnJlbW92ZScsIHRoaXMuX29uTGF5ZXJDaGFuZ2UsIHRoaXMpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzLl9jb250YWluZXI7XHJcblx0fSxcclxuXHJcblx0b25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcclxuXHRcdG1hcFxyXG5cdFx0ICAgIC5vZmYoJ2xheWVyYWRkJywgdGhpcy5fb25MYXllckNoYW5nZSwgdGhpcylcclxuXHRcdCAgICAub2ZmKCdsYXllcnJlbW92ZScsIHRoaXMuX29uTGF5ZXJDaGFuZ2UsIHRoaXMpO1xyXG5cdH0sXHJcblxyXG5cdGFkZEJhc2VMYXllcjogZnVuY3Rpb24gKGxheWVyLCBuYW1lKSB7XHJcblx0XHR0aGlzLl9hZGRMYXllcihsYXllciwgbmFtZSk7XHJcblx0XHR0aGlzLl91cGRhdGUoKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdGFkZE92ZXJsYXk6IGZ1bmN0aW9uIChsYXllciwgbmFtZSkge1xyXG5cdFx0dGhpcy5fYWRkTGF5ZXIobGF5ZXIsIG5hbWUsIHRydWUpO1xyXG5cdFx0dGhpcy5fdXBkYXRlKCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRyZW1vdmVMYXllcjogZnVuY3Rpb24gKGxheWVyKSB7XHJcblx0XHR2YXIgaWQgPSBMLnN0YW1wKGxheWVyKTtcclxuXHRcdGRlbGV0ZSB0aGlzLl9sYXllcnNbaWRdO1xyXG5cdFx0dGhpcy5fdXBkYXRlKCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cclxuXHRfaW5pdExheW91dDogZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGNsYXNzTmFtZSA9ICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzJyxcclxuXHRcdCAgICBjb250YWluZXIgPSB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUpO1xyXG5cclxuXHRcdC8vTWFrZXMgdGhpcyB3b3JrIG9uIElFMTAgVG91Y2ggZGV2aWNlcyBieSBzdG9wcGluZyBpdCBmcm9tIGZpcmluZyBhIG1vdXNlb3V0IGV2ZW50IHdoZW4gdGhlIHRvdWNoIGlzIHJlbGVhc2VkXHJcblx0XHRjb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhhc3BvcHVwJywgdHJ1ZSk7XHJcblxyXG5cdFx0aWYgKCFMLkJyb3dzZXIudG91Y2gpIHtcclxuXHRcdFx0TC5Eb21FdmVudFxyXG5cdFx0XHRcdC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihjb250YWluZXIpXHJcblx0XHRcdFx0LmRpc2FibGVTY3JvbGxQcm9wYWdhdGlvbihjb250YWluZXIpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0TC5Eb21FdmVudC5vbihjb250YWluZXIsICdjbGljaycsIEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZm9ybSA9IHRoaXMuX2Zvcm0gPSBMLkRvbVV0aWwuY3JlYXRlKCdmb3JtJywgY2xhc3NOYW1lICsgJy1saXN0Jyk7XHJcblxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5jb2xsYXBzZWQpIHtcclxuXHRcdFx0aWYgKCFMLkJyb3dzZXIuYW5kcm9pZCkge1xyXG5cdFx0XHRcdEwuRG9tRXZlbnRcclxuXHRcdFx0XHQgICAgLm9uKGNvbnRhaW5lciwgJ21vdXNlb3ZlcicsIHRoaXMuX2V4cGFuZCwgdGhpcylcclxuXHRcdFx0XHQgICAgLm9uKGNvbnRhaW5lciwgJ21vdXNlb3V0JywgdGhpcy5fY29sbGFwc2UsIHRoaXMpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciBsaW5rID0gdGhpcy5fbGF5ZXJzTGluayA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCBjbGFzc05hbWUgKyAnLXRvZ2dsZScsIGNvbnRhaW5lcik7XHJcblx0XHRcdGxpbmsuaHJlZiA9ICcjJztcclxuXHRcdFx0bGluay50aXRsZSA9ICdMYXllcnMnO1xyXG5cclxuXHRcdFx0aWYgKEwuQnJvd3Nlci50b3VjaCkge1xyXG5cdFx0XHRcdEwuRG9tRXZlbnRcclxuXHRcdFx0XHQgICAgLm9uKGxpbmssICdjbGljaycsIEwuRG9tRXZlbnQuc3RvcClcclxuXHRcdFx0XHQgICAgLm9uKGxpbmssICdjbGljaycsIHRoaXMuX2V4cGFuZCwgdGhpcyk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0TC5Eb21FdmVudC5vbihsaW5rLCAnZm9jdXMnLCB0aGlzLl9leHBhbmQsIHRoaXMpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vV29yayBhcm91bmQgZm9yIEZpcmVmb3ggYW5kcm9pZCBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vTGVhZmxldC9MZWFmbGV0L2lzc3Vlcy8yMDMzXHJcblx0XHRcdEwuRG9tRXZlbnQub24oZm9ybSwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoTC5iaW5kKHRoaXMuX29uSW5wdXRDbGljaywgdGhpcyksIDApO1xyXG5cdFx0XHR9LCB0aGlzKTtcclxuXHJcblx0XHRcdHRoaXMuX21hcC5vbignY2xpY2snLCB0aGlzLl9jb2xsYXBzZSwgdGhpcyk7XHJcblx0XHRcdC8vIFRPRE8ga2V5Ym9hcmQgYWNjZXNzaWJpbGl0eVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5fZXhwYW5kKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fYmFzZUxheWVyc0xpc3QgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUgKyAnLWJhc2UnLCBmb3JtKTtcclxuXHRcdHRoaXMuX3NlcGFyYXRvciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsIGNsYXNzTmFtZSArICctc2VwYXJhdG9yJywgZm9ybSk7XHJcblx0XHR0aGlzLl9vdmVybGF5c0xpc3QgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUgKyAnLW92ZXJsYXlzJywgZm9ybSk7XHJcblxyXG5cdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGZvcm0pO1xyXG5cdH0sXHJcblxyXG5cdF9hZGRMYXllcjogZnVuY3Rpb24gKGxheWVyLCBuYW1lLCBvdmVybGF5KSB7XHJcblx0XHR2YXIgaWQgPSBMLnN0YW1wKGxheWVyKTtcclxuXHJcblx0XHR0aGlzLl9sYXllcnNbaWRdID0ge1xyXG5cdFx0XHRsYXllcjogbGF5ZXIsXHJcblx0XHRcdG5hbWU6IG5hbWUsXHJcblx0XHRcdG92ZXJsYXk6IG92ZXJsYXlcclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5hdXRvWkluZGV4ICYmIGxheWVyLnNldFpJbmRleCkge1xyXG5cdFx0XHR0aGlzLl9sYXN0WkluZGV4Kys7XHJcblx0XHRcdGxheWVyLnNldFpJbmRleCh0aGlzLl9sYXN0WkluZGV4KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoaXMuX2NvbnRhaW5lcikge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fYmFzZUxheWVyc0xpc3QuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9vdmVybGF5c0xpc3QuaW5uZXJIVE1MID0gJyc7XHJcblxyXG5cdFx0dmFyIGJhc2VMYXllcnNQcmVzZW50ID0gZmFsc2UsXHJcblx0XHQgICAgb3ZlcmxheXNQcmVzZW50ID0gZmFsc2UsXHJcblx0XHQgICAgaSwgb2JqO1xyXG5cclxuXHRcdGZvciAoaSBpbiB0aGlzLl9sYXllcnMpIHtcclxuXHRcdFx0b2JqID0gdGhpcy5fbGF5ZXJzW2ldO1xyXG5cdFx0XHR0aGlzLl9hZGRJdGVtKG9iaik7XHJcblx0XHRcdG92ZXJsYXlzUHJlc2VudCA9IG92ZXJsYXlzUHJlc2VudCB8fCBvYmoub3ZlcmxheTtcclxuXHRcdFx0YmFzZUxheWVyc1ByZXNlbnQgPSBiYXNlTGF5ZXJzUHJlc2VudCB8fCAhb2JqLm92ZXJsYXk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fc2VwYXJhdG9yLnN0eWxlLmRpc3BsYXkgPSBvdmVybGF5c1ByZXNlbnQgJiYgYmFzZUxheWVyc1ByZXNlbnQgPyAnJyA6ICdub25lJztcclxuXHR9LFxyXG5cclxuXHRfb25MYXllckNoYW5nZTogZnVuY3Rpb24gKGUpIHtcclxuXHRcdHZhciBvYmogPSB0aGlzLl9sYXllcnNbTC5zdGFtcChlLmxheWVyKV07XHJcblxyXG5cdFx0aWYgKCFvYmopIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0aWYgKCF0aGlzLl9oYW5kbGluZ0NsaWNrKSB7XHJcblx0XHRcdHRoaXMuX3VwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB0eXBlID0gb2JqLm92ZXJsYXkgP1xyXG5cdFx0XHQoZS50eXBlID09PSAnbGF5ZXJhZGQnID8gJ292ZXJsYXlhZGQnIDogJ292ZXJsYXlyZW1vdmUnKSA6XHJcblx0XHRcdChlLnR5cGUgPT09ICdsYXllcmFkZCcgPyAnYmFzZWxheWVyY2hhbmdlJyA6IG51bGwpO1xyXG5cclxuXHRcdGlmICh0eXBlKSB7XHJcblx0XHRcdHRoaXMuX21hcC5maXJlKHR5cGUsIG9iaik7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Ly8gSUU3IGJ1Z3Mgb3V0IGlmIHlvdSBjcmVhdGUgYSByYWRpbyBkeW5hbWljYWxseSwgc28geW91IGhhdmUgdG8gZG8gaXQgdGhpcyBoYWNreSB3YXkgKHNlZSBodHRwOi8vYml0Lmx5L1BxWUxCZSlcclxuXHRfY3JlYXRlUmFkaW9FbGVtZW50OiBmdW5jdGlvbiAobmFtZSwgY2hlY2tlZCkge1xyXG5cclxuXHRcdHZhciByYWRpb0h0bWwgPSAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIGNsYXNzPVwibGVhZmxldC1jb250cm9sLWxheWVycy1zZWxlY3RvclwiIG5hbWU9XCInICsgbmFtZSArICdcIic7XHJcblx0XHRpZiAoY2hlY2tlZCkge1xyXG5cdFx0XHRyYWRpb0h0bWwgKz0gJyBjaGVja2VkPVwiY2hlY2tlZFwiJztcclxuXHRcdH1cclxuXHRcdHJhZGlvSHRtbCArPSAnLz4nO1xyXG5cclxuXHRcdHZhciByYWRpb0ZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRyYWRpb0ZyYWdtZW50LmlubmVySFRNTCA9IHJhZGlvSHRtbDtcclxuXHJcblx0XHRyZXR1cm4gcmFkaW9GcmFnbWVudC5maXJzdENoaWxkO1xyXG5cdH0sXHJcblxyXG5cdF9hZGRJdGVtOiBmdW5jdGlvbiAob2JqKSB7XHJcblx0XHR2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpLFxyXG5cdFx0ICAgIGlucHV0LFxyXG5cdFx0ICAgIGNoZWNrZWQgPSB0aGlzLl9tYXAuaGFzTGF5ZXIob2JqLmxheWVyKTtcclxuXHJcblx0XHRpZiAob2JqLm92ZXJsYXkpIHtcclxuXHRcdFx0aW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG5cdFx0XHRpbnB1dC50eXBlID0gJ2NoZWNrYm94JztcclxuXHRcdFx0aW5wdXQuY2xhc3NOYW1lID0gJ2xlYWZsZXQtY29udHJvbC1sYXllcnMtc2VsZWN0b3InO1xyXG5cdFx0XHRpbnB1dC5kZWZhdWx0Q2hlY2tlZCA9IGNoZWNrZWQ7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpbnB1dCA9IHRoaXMuX2NyZWF0ZVJhZGlvRWxlbWVudCgnbGVhZmxldC1iYXNlLWxheWVycycsIGNoZWNrZWQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlucHV0LmxheWVySWQgPSBMLnN0YW1wKG9iai5sYXllcik7XHJcblxyXG5cdFx0TC5Eb21FdmVudC5vbihpbnB1dCwgJ2NsaWNrJywgdGhpcy5fb25JbnB1dENsaWNrLCB0aGlzKTtcclxuXHJcblx0XHR2YXIgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuXHRcdG5hbWUuaW5uZXJIVE1MID0gJyAnICsgb2JqLm5hbWU7XHJcblxyXG5cdFx0bGFiZWwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xyXG5cdFx0bGFiZWwuYXBwZW5kQ2hpbGQobmFtZSk7XHJcblxyXG5cdFx0dmFyIGNvbnRhaW5lciA9IG9iai5vdmVybGF5ID8gdGhpcy5fb3ZlcmxheXNMaXN0IDogdGhpcy5fYmFzZUxheWVyc0xpc3Q7XHJcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xyXG5cclxuXHRcdHJldHVybiBsYWJlbDtcclxuXHR9LFxyXG5cclxuXHRfb25JbnB1dENsaWNrOiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgaSwgaW5wdXQsIG9iaixcclxuXHRcdCAgICBpbnB1dHMgPSB0aGlzLl9mb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpLFxyXG5cdFx0ICAgIGlucHV0c0xlbiA9IGlucHV0cy5sZW5ndGg7XHJcblxyXG5cdFx0dGhpcy5faGFuZGxpbmdDbGljayA9IHRydWU7XHJcblxyXG5cdFx0Zm9yIChpID0gMDsgaSA8IGlucHV0c0xlbjsgaSsrKSB7XHJcblx0XHRcdGlucHV0ID0gaW5wdXRzW2ldO1xyXG5cdFx0XHRvYmogPSB0aGlzLl9sYXllcnNbaW5wdXQubGF5ZXJJZF07XHJcblxyXG5cdFx0XHRpZiAoaW5wdXQuY2hlY2tlZCAmJiAhdGhpcy5fbWFwLmhhc0xheWVyKG9iai5sYXllcikpIHtcclxuXHRcdFx0XHR0aGlzLl9tYXAuYWRkTGF5ZXIob2JqLmxheWVyKTtcclxuXHJcblx0XHRcdH0gZWxzZSBpZiAoIWlucHV0LmNoZWNrZWQgJiYgdGhpcy5fbWFwLmhhc0xheWVyKG9iai5sYXllcikpIHtcclxuXHRcdFx0XHR0aGlzLl9tYXAucmVtb3ZlTGF5ZXIob2JqLmxheWVyKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2hhbmRsaW5nQ2xpY2sgPSBmYWxzZTtcclxuXHJcblx0XHR0aGlzLl9yZWZvY3VzT25NYXAoKTtcclxuXHR9LFxyXG5cclxuXHRfZXhwYW5kOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnbGVhZmxldC1jb250cm9sLWxheWVycy1leHBhbmRlZCcpO1xyXG5cdH0sXHJcblxyXG5cdF9jb2xsYXBzZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhpcy5fY29udGFpbmVyLmNsYXNzTmFtZSA9IHRoaXMuX2NvbnRhaW5lci5jbGFzc05hbWUucmVwbGFjZSgnIGxlYWZsZXQtY29udHJvbC1sYXllcnMtZXhwYW5kZWQnLCAnJyk7XHJcblx0fVxyXG59KTtcclxuXHJcbkwuY29udHJvbC5sYXllcnMgPSBmdW5jdGlvbiAoYmFzZUxheWVycywgb3ZlcmxheXMsIG9wdGlvbnMpIHtcclxuXHRyZXR1cm4gbmV3IEwuQ29udHJvbC5MYXllcnMoYmFzZUxheWVycywgb3ZlcmxheXMsIG9wdGlvbnMpO1xyXG59O1xyXG5cblxuLypcbiAqIEwuUG9zQW5pbWF0aW9uIGlzIHVzZWQgYnkgTGVhZmxldCBpbnRlcm5hbGx5IGZvciBwYW4gYW5pbWF0aW9ucy5cbiAqL1xuXG5MLlBvc0FuaW1hdGlvbiA9IEwuQ2xhc3MuZXh0ZW5kKHtcblx0aW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxuXG5cdHJ1bjogZnVuY3Rpb24gKGVsLCBuZXdQb3MsIGR1cmF0aW9uLCBlYXNlTGluZWFyaXR5KSB7IC8vIChIVE1MRWxlbWVudCwgUG9pbnRbLCBOdW1iZXIsIE51bWJlcl0pXG5cdFx0dGhpcy5zdG9wKCk7XG5cblx0XHR0aGlzLl9lbCA9IGVsO1xuXHRcdHRoaXMuX2luUHJvZ3Jlc3MgPSB0cnVlO1xuXHRcdHRoaXMuX25ld1BvcyA9IG5ld1BvcztcblxuXHRcdHRoaXMuZmlyZSgnc3RhcnQnKTtcblxuXHRcdGVsLnN0eWxlW0wuRG9tVXRpbC5UUkFOU0lUSU9OXSA9ICdhbGwgJyArIChkdXJhdGlvbiB8fCAwLjI1KSArXG5cdFx0ICAgICAgICAncyBjdWJpYy1iZXppZXIoMCwwLCcgKyAoZWFzZUxpbmVhcml0eSB8fCAwLjUpICsgJywxKSc7XG5cblx0XHRMLkRvbUV2ZW50Lm9uKGVsLCBMLkRvbVV0aWwuVFJBTlNJVElPTl9FTkQsIHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgdGhpcyk7XG5cdFx0TC5Eb21VdGlsLnNldFBvc2l0aW9uKGVsLCBuZXdQb3MpO1xuXG5cdFx0Ly8gdG9nZ2xlIHJlZmxvdywgQ2hyb21lIGZsaWNrZXJzIGZvciBzb21lIHJlYXNvbiBpZiB5b3UgZG9uJ3QgZG8gdGhpc1xuXHRcdEwuVXRpbC5mYWxzZUZuKGVsLm9mZnNldFdpZHRoKTtcblxuXHRcdC8vIHRoZXJlJ3Mgbm8gbmF0aXZlIHdheSB0byB0cmFjayB2YWx1ZSB1cGRhdGVzIG9mIHRyYW5zaXRpb25lZCBwcm9wZXJ0aWVzLCBzbyB3ZSBpbWl0YXRlIHRoaXNcblx0XHR0aGlzLl9zdGVwVGltZXIgPSBzZXRJbnRlcnZhbChMLmJpbmQodGhpcy5fb25TdGVwLCB0aGlzKSwgNTApO1xuXHR9LFxuXG5cdHN0b3A6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuX2luUHJvZ3Jlc3MpIHsgcmV0dXJuOyB9XG5cblx0XHQvLyBpZiB3ZSBqdXN0IHJlbW92ZWQgdGhlIHRyYW5zaXRpb24gcHJvcGVydHksIHRoZSBlbGVtZW50IHdvdWxkIGp1bXAgdG8gaXRzIGZpbmFsIHBvc2l0aW9uLFxuXHRcdC8vIHNvIHdlIG5lZWQgdG8gbWFrZSBpdCBzdGF5IGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uXG5cblx0XHRMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fZWwsIHRoaXMuX2dldFBvcygpKTtcblx0XHR0aGlzLl9vblRyYW5zaXRpb25FbmQoKTtcblx0XHRMLlV0aWwuZmFsc2VGbih0aGlzLl9lbC5vZmZzZXRXaWR0aCk7IC8vIGZvcmNlIHJlZmxvdyBpbiBjYXNlIHdlIGFyZSBhYm91dCB0byBzdGFydCBhIG5ldyBhbmltYXRpb25cblx0fSxcblxuXHRfb25TdGVwOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHN0ZXBQb3MgPSB0aGlzLl9nZXRQb3MoKTtcblx0XHRpZiAoIXN0ZXBQb3MpIHtcblx0XHRcdHRoaXMuX29uVHJhbnNpdGlvbkVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHQvLyBqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxuXHRcdC8vIG1ha2UgTC5Eb21VdGlsLmdldFBvc2l0aW9uIHJldHVybiBpbnRlcm1lZGlhdGUgcG9zaXRpb24gdmFsdWUgZHVyaW5nIGFuaW1hdGlvblxuXHRcdHRoaXMuX2VsLl9sZWFmbGV0X3BvcyA9IHN0ZXBQb3M7XG5cblx0XHR0aGlzLmZpcmUoJ3N0ZXAnKTtcblx0fSxcblxuXHQvLyB5b3UgY2FuJ3QgZWFzaWx5IGdldCBpbnRlcm1lZGlhdGUgdmFsdWVzIG9mIHByb3BlcnRpZXMgYW5pbWF0ZWQgd2l0aCBDU1MzIFRyYW5zaXRpb25zLFxuXHQvLyB3ZSBuZWVkIHRvIHBhcnNlIGNvbXB1dGVkIHN0eWxlIChpbiBjYXNlIG9mIHRyYW5zZm9ybSBpdCByZXR1cm5zIG1hdHJpeCBzdHJpbmcpXG5cblx0X3RyYW5zZm9ybVJlOiAvKFstK10/KD86XFxkKlxcLik/XFxkKylcXEQqLCAoWy0rXT8oPzpcXGQqXFwuKT9cXGQrKVxcRCpcXCkvLFxuXG5cdF9nZXRQb3M6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgbGVmdCwgdG9wLCBtYXRjaGVzLFxuXHRcdCAgICBlbCA9IHRoaXMuX2VsLFxuXHRcdCAgICBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKTtcblxuXHRcdGlmIChMLkJyb3dzZXIuYW55M2QpIHtcblx0XHRcdG1hdGNoZXMgPSBzdHlsZVtMLkRvbVV0aWwuVFJBTlNGT1JNXS5tYXRjaCh0aGlzLl90cmFuc2Zvcm1SZSk7XG5cdFx0XHRpZiAoIW1hdGNoZXMpIHsgcmV0dXJuOyB9XG5cdFx0XHRsZWZ0ID0gcGFyc2VGbG9hdChtYXRjaGVzWzFdKTtcblx0XHRcdHRvcCAgPSBwYXJzZUZsb2F0KG1hdGNoZXNbMl0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZWZ0ID0gcGFyc2VGbG9hdChzdHlsZS5sZWZ0KTtcblx0XHRcdHRvcCAgPSBwYXJzZUZsb2F0KHN0eWxlLnRvcCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5ldyBMLlBvaW50KGxlZnQsIHRvcCwgdHJ1ZSk7XG5cdH0sXG5cblx0X29uVHJhbnNpdGlvbkVuZDogZnVuY3Rpb24gKCkge1xuXHRcdEwuRG9tRXZlbnQub2ZmKHRoaXMuX2VsLCBMLkRvbVV0aWwuVFJBTlNJVElPTl9FTkQsIHRoaXMuX29uVHJhbnNpdGlvbkVuZCwgdGhpcyk7XG5cblx0XHRpZiAoIXRoaXMuX2luUHJvZ3Jlc3MpIHsgcmV0dXJuOyB9XG5cdFx0dGhpcy5faW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5fZWwuc3R5bGVbTC5Eb21VdGlsLlRSQU5TSVRJT05dID0gJyc7XG5cblx0XHQvLyBqc2hpbnQgY2FtZWxjYXNlOiBmYWxzZVxuXHRcdC8vIG1ha2Ugc3VyZSBMLkRvbVV0aWwuZ2V0UG9zaXRpb24gcmV0dXJucyB0aGUgZmluYWwgcG9zaXRpb24gdmFsdWUgYWZ0ZXIgYW5pbWF0aW9uXG5cdFx0dGhpcy5fZWwuX2xlYWZsZXRfcG9zID0gdGhpcy5fbmV3UG9zO1xuXG5cdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLl9zdGVwVGltZXIpO1xuXG5cdFx0dGhpcy5maXJlKCdzdGVwJykuZmlyZSgnZW5kJyk7XG5cdH1cblxufSk7XG5cblxuLypcbiAqIEV4dGVuZHMgTC5NYXAgdG8gaGFuZGxlIHBhbm5pbmcgYW5pbWF0aW9ucy5cbiAqL1xuXG5MLk1hcC5pbmNsdWRlKHtcblxuXHRzZXRWaWV3OiBmdW5jdGlvbiAoY2VudGVyLCB6b29tLCBvcHRpb25zKSB7XG5cblx0XHR6b29tID0gem9vbSA9PT0gdW5kZWZpbmVkID8gdGhpcy5fem9vbSA6IHRoaXMuX2xpbWl0Wm9vbSh6b29tKTtcblx0XHRjZW50ZXIgPSB0aGlzLl9saW1pdENlbnRlcihMLmxhdExuZyhjZW50ZXIpLCB6b29tLCB0aGlzLm9wdGlvbnMubWF4Qm91bmRzKTtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdGlmICh0aGlzLl9wYW5BbmltKSB7XG5cdFx0XHR0aGlzLl9wYW5BbmltLnN0b3AoKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5fbG9hZGVkICYmICFvcHRpb25zLnJlc2V0ICYmIG9wdGlvbnMgIT09IHRydWUpIHtcblxuXHRcdFx0aWYgKG9wdGlvbnMuYW5pbWF0ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdG9wdGlvbnMuem9vbSA9IEwuZXh0ZW5kKHthbmltYXRlOiBvcHRpb25zLmFuaW1hdGV9LCBvcHRpb25zLnpvb20pO1xuXHRcdFx0XHRvcHRpb25zLnBhbiA9IEwuZXh0ZW5kKHthbmltYXRlOiBvcHRpb25zLmFuaW1hdGV9LCBvcHRpb25zLnBhbik7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHRyeSBhbmltYXRpbmcgcGFuIG9yIHpvb21cblx0XHRcdHZhciBhbmltYXRlZCA9ICh0aGlzLl96b29tICE9PSB6b29tKSA/XG5cdFx0XHRcdHRoaXMuX3RyeUFuaW1hdGVkWm9vbSAmJiB0aGlzLl90cnlBbmltYXRlZFpvb20oY2VudGVyLCB6b29tLCBvcHRpb25zLnpvb20pIDpcblx0XHRcdFx0dGhpcy5fdHJ5QW5pbWF0ZWRQYW4oY2VudGVyLCBvcHRpb25zLnBhbik7XG5cblx0XHRcdGlmIChhbmltYXRlZCkge1xuXHRcdFx0XHQvLyBwcmV2ZW50IHJlc2l6ZSBoYW5kbGVyIGNhbGwsIHRoZSB2aWV3IHdpbGwgcmVmcmVzaCBhZnRlciBhbmltYXRpb24gYW55d2F5XG5cdFx0XHRcdGNsZWFyVGltZW91dCh0aGlzLl9zaXplVGltZXIpO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBhbmltYXRpb24gZGlkbid0IHN0YXJ0LCBqdXN0IHJlc2V0IHRoZSBtYXAgdmlld1xuXHRcdHRoaXMuX3Jlc2V0VmlldyhjZW50ZXIsIHpvb20pO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cGFuQnk6IGZ1bmN0aW9uIChvZmZzZXQsIG9wdGlvbnMpIHtcblx0XHRvZmZzZXQgPSBMLnBvaW50KG9mZnNldCkucm91bmQoKTtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdGlmICghb2Zmc2V0LnggJiYgIW9mZnNldC55KSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuX3BhbkFuaW0pIHtcblx0XHRcdHRoaXMuX3BhbkFuaW0gPSBuZXcgTC5Qb3NBbmltYXRpb24oKTtcblxuXHRcdFx0dGhpcy5fcGFuQW5pbS5vbih7XG5cdFx0XHRcdCdzdGVwJzogdGhpcy5fb25QYW5UcmFuc2l0aW9uU3RlcCxcblx0XHRcdFx0J2VuZCc6IHRoaXMuX29uUGFuVHJhbnNpdGlvbkVuZFxuXHRcdFx0fSwgdGhpcyk7XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3QgZmlyZSBtb3Zlc3RhcnQgaWYgYW5pbWF0aW5nIGluZXJ0aWFcblx0XHRpZiAoIW9wdGlvbnMubm9Nb3ZlU3RhcnQpIHtcblx0XHRcdHRoaXMuZmlyZSgnbW92ZXN0YXJ0Jyk7XG5cdFx0fVxuXG5cdFx0Ly8gYW5pbWF0ZSBwYW4gdW5sZXNzIGFuaW1hdGU6IGZhbHNlIHNwZWNpZmllZFxuXHRcdGlmIChvcHRpb25zLmFuaW1hdGUgIT09IGZhbHNlKSB7XG5cdFx0XHRMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fbWFwUGFuZSwgJ2xlYWZsZXQtcGFuLWFuaW0nKTtcblxuXHRcdFx0dmFyIG5ld1BvcyA9IHRoaXMuX2dldE1hcFBhbmVQb3MoKS5zdWJ0cmFjdChvZmZzZXQpO1xuXHRcdFx0dGhpcy5fcGFuQW5pbS5ydW4odGhpcy5fbWFwUGFuZSwgbmV3UG9zLCBvcHRpb25zLmR1cmF0aW9uIHx8IDAuMjUsIG9wdGlvbnMuZWFzZUxpbmVhcml0eSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX3Jhd1BhbkJ5KG9mZnNldCk7XG5cdFx0XHR0aGlzLmZpcmUoJ21vdmUnKS5maXJlKCdtb3ZlZW5kJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0X29uUGFuVHJhbnNpdGlvblN0ZXA6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLmZpcmUoJ21vdmUnKTtcblx0fSxcblxuXHRfb25QYW5UcmFuc2l0aW9uRW5kOiBmdW5jdGlvbiAoKSB7XG5cdFx0TC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX21hcFBhbmUsICdsZWFmbGV0LXBhbi1hbmltJyk7XG5cdFx0dGhpcy5maXJlKCdtb3ZlZW5kJyk7XG5cdH0sXG5cblx0X3RyeUFuaW1hdGVkUGFuOiBmdW5jdGlvbiAoY2VudGVyLCBvcHRpb25zKSB7XG5cdFx0Ly8gZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBuZXcgYW5kIGN1cnJlbnQgY2VudGVycyBpbiBwaXhlbHNcblx0XHR2YXIgb2Zmc2V0ID0gdGhpcy5fZ2V0Q2VudGVyT2Zmc2V0KGNlbnRlcikuX2Zsb29yKCk7XG5cblx0XHQvLyBkb24ndCBhbmltYXRlIHRvbyBmYXIgdW5sZXNzIGFuaW1hdGU6IHRydWUgc3BlY2lmaWVkIGluIG9wdGlvbnNcblx0XHRpZiAoKG9wdGlvbnMgJiYgb3B0aW9ucy5hbmltYXRlKSAhPT0gdHJ1ZSAmJiAhdGhpcy5nZXRTaXplKCkuY29udGFpbnMob2Zmc2V0KSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRcdHRoaXMucGFuQnkob2Zmc2V0LCBvcHRpb25zKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcblxuXG4vKlxuICogTC5Qb3NBbmltYXRpb24gZmFsbGJhY2sgaW1wbGVtZW50YXRpb24gdGhhdCBwb3dlcnMgTGVhZmxldCBwYW4gYW5pbWF0aW9uc1xuICogaW4gYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IENTUzMgVHJhbnNpdGlvbnMuXG4gKi9cblxuTC5Qb3NBbmltYXRpb24gPSBMLkRvbVV0aWwuVFJBTlNJVElPTiA/IEwuUG9zQW5pbWF0aW9uIDogTC5Qb3NBbmltYXRpb24uZXh0ZW5kKHtcblxuXHRydW46IGZ1bmN0aW9uIChlbCwgbmV3UG9zLCBkdXJhdGlvbiwgZWFzZUxpbmVhcml0eSkgeyAvLyAoSFRNTEVsZW1lbnQsIFBvaW50WywgTnVtYmVyLCBOdW1iZXJdKVxuXHRcdHRoaXMuc3RvcCgpO1xuXG5cdFx0dGhpcy5fZWwgPSBlbDtcblx0XHR0aGlzLl9pblByb2dyZXNzID0gdHJ1ZTtcblx0XHR0aGlzLl9kdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDAuMjU7XG5cdFx0dGhpcy5fZWFzZU91dFBvd2VyID0gMSAvIE1hdGgubWF4KGVhc2VMaW5lYXJpdHkgfHwgMC41LCAwLjIpO1xuXG5cdFx0dGhpcy5fc3RhcnRQb3MgPSBMLkRvbVV0aWwuZ2V0UG9zaXRpb24oZWwpO1xuXHRcdHRoaXMuX29mZnNldCA9IG5ld1Bvcy5zdWJ0cmFjdCh0aGlzLl9zdGFydFBvcyk7XG5cdFx0dGhpcy5fc3RhcnRUaW1lID0gK25ldyBEYXRlKCk7XG5cblx0XHR0aGlzLmZpcmUoJ3N0YXJ0Jyk7XG5cblx0XHR0aGlzLl9hbmltYXRlKCk7XG5cdH0sXG5cblx0c3RvcDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICghdGhpcy5faW5Qcm9ncmVzcykgeyByZXR1cm47IH1cblxuXHRcdHRoaXMuX3N0ZXAoKTtcblx0XHR0aGlzLl9jb21wbGV0ZSgpO1xuXHR9LFxuXG5cdF9hbmltYXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gYW5pbWF0aW9uIGxvb3Bcblx0XHR0aGlzLl9hbmltSWQgPSBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZSh0aGlzLl9hbmltYXRlLCB0aGlzKTtcblx0XHR0aGlzLl9zdGVwKCk7XG5cdH0sXG5cblx0X3N0ZXA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxhcHNlZCA9ICgrbmV3IERhdGUoKSkgLSB0aGlzLl9zdGFydFRpbWUsXG5cdFx0ICAgIGR1cmF0aW9uID0gdGhpcy5fZHVyYXRpb24gKiAxMDAwO1xuXG5cdFx0aWYgKGVsYXBzZWQgPCBkdXJhdGlvbikge1xuXHRcdFx0dGhpcy5fcnVuRnJhbWUodGhpcy5fZWFzZU91dChlbGFwc2VkIC8gZHVyYXRpb24pKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fcnVuRnJhbWUoMSk7XG5cdFx0XHR0aGlzLl9jb21wbGV0ZSgpO1xuXHRcdH1cblx0fSxcblxuXHRfcnVuRnJhbWU6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuXHRcdHZhciBwb3MgPSB0aGlzLl9zdGFydFBvcy5hZGQodGhpcy5fb2Zmc2V0Lm11bHRpcGx5QnkocHJvZ3Jlc3MpKTtcblx0XHRMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fZWwsIHBvcyk7XG5cblx0XHR0aGlzLmZpcmUoJ3N0ZXAnKTtcblx0fSxcblxuXHRfY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcblx0XHRMLlV0aWwuY2FuY2VsQW5pbUZyYW1lKHRoaXMuX2FuaW1JZCk7XG5cblx0XHR0aGlzLl9pblByb2dyZXNzID0gZmFsc2U7XG5cdFx0dGhpcy5maXJlKCdlbmQnKTtcblx0fSxcblxuXHRfZWFzZU91dDogZnVuY3Rpb24gKHQpIHtcblx0XHRyZXR1cm4gMSAtIE1hdGgucG93KDEgLSB0LCB0aGlzLl9lYXNlT3V0UG93ZXIpO1xuXHR9XG59KTtcblxuXG4vKlxuICogRXh0ZW5kcyBMLk1hcCB0byBoYW5kbGUgem9vbSBhbmltYXRpb25zLlxuICovXG5cbkwuTWFwLm1lcmdlT3B0aW9ucyh7XG5cdHpvb21BbmltYXRpb246IHRydWUsXG5cdHpvb21BbmltYXRpb25UaHJlc2hvbGQ6IDRcbn0pO1xuXG5pZiAoTC5Eb21VdGlsLlRSQU5TSVRJT04pIHtcblxuXHRMLk1hcC5hZGRJbml0SG9vayhmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gZG9uJ3QgYW5pbWF0ZSBvbiBicm93c2VycyB3aXRob3V0IGhhcmR3YXJlLWFjY2VsZXJhdGVkIHRyYW5zaXRpb25zIG9yIG9sZCBBbmRyb2lkL09wZXJhXG5cdFx0dGhpcy5fem9vbUFuaW1hdGVkID0gdGhpcy5vcHRpb25zLnpvb21BbmltYXRpb24gJiYgTC5Eb21VdGlsLlRSQU5TSVRJT04gJiZcblx0XHRcdFx0TC5Ccm93c2VyLmFueTNkICYmICFMLkJyb3dzZXIuYW5kcm9pZDIzICYmICFMLkJyb3dzZXIubW9iaWxlT3BlcmE7XG5cblx0XHQvLyB6b29tIHRyYW5zaXRpb25zIHJ1biB3aXRoIHRoZSBzYW1lIGR1cmF0aW9uIGZvciBhbGwgbGF5ZXJzLCBzbyBpZiBvbmUgb2YgdHJhbnNpdGlvbmVuZCBldmVudHNcblx0XHQvLyBoYXBwZW5zIGFmdGVyIHN0YXJ0aW5nIHpvb20gYW5pbWF0aW9uIChwcm9wYWdhdGluZyB0byB0aGUgbWFwIHBhbmUpLCB3ZSBrbm93IHRoYXQgaXQgZW5kZWQgZ2xvYmFsbHlcblx0XHRpZiAodGhpcy5fem9vbUFuaW1hdGVkKSB7XG5cdFx0XHRMLkRvbUV2ZW50Lm9uKHRoaXMuX21hcFBhbmUsIEwuRG9tVXRpbC5UUkFOU0lUSU9OX0VORCwgdGhpcy5fY2F0Y2hUcmFuc2l0aW9uRW5kLCB0aGlzKTtcblx0XHR9XG5cdH0pO1xufVxuXG5MLk1hcC5pbmNsdWRlKCFMLkRvbVV0aWwuVFJBTlNJVElPTiA/IHt9IDoge1xuXG5cdF9jYXRjaFRyYW5zaXRpb25FbmQ6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKHRoaXMuX2FuaW1hdGluZ1pvb20gJiYgZS5wcm9wZXJ0eU5hbWUuaW5kZXhPZigndHJhbnNmb3JtJykgPj0gMCkge1xuXHRcdFx0dGhpcy5fb25ab29tVHJhbnNpdGlvbkVuZCgpO1xuXHRcdH1cblx0fSxcblxuXHRfbm90aGluZ1RvQW5pbWF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAhdGhpcy5fY29udGFpbmVyLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xlYWZsZXQtem9vbS1hbmltYXRlZCcpLmxlbmd0aDtcblx0fSxcblxuXHRfdHJ5QW5pbWF0ZWRab29tOiBmdW5jdGlvbiAoY2VudGVyLCB6b29tLCBvcHRpb25zKSB7XG5cblx0XHRpZiAodGhpcy5fYW5pbWF0aW5nWm9vbSkgeyByZXR1cm4gdHJ1ZTsgfVxuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvLyBkb24ndCBhbmltYXRlIGlmIGRpc2FibGVkLCBub3Qgc3VwcG9ydGVkIG9yIHpvb20gZGlmZmVyZW5jZSBpcyB0b28gbGFyZ2Vcblx0XHRpZiAoIXRoaXMuX3pvb21BbmltYXRlZCB8fCBvcHRpb25zLmFuaW1hdGUgPT09IGZhbHNlIHx8IHRoaXMuX25vdGhpbmdUb0FuaW1hdGUoKSB8fFxuXHRcdCAgICAgICAgTWF0aC5hYnMoem9vbSAtIHRoaXMuX3pvb20pID4gdGhpcy5vcHRpb25zLnpvb21BbmltYXRpb25UaHJlc2hvbGQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHQvLyBvZmZzZXQgaXMgdGhlIHBpeGVsIGNvb3JkcyBvZiB0aGUgem9vbSBvcmlnaW4gcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgY2VudGVyXG5cdFx0dmFyIHNjYWxlID0gdGhpcy5nZXRab29tU2NhbGUoem9vbSksXG5cdFx0ICAgIG9mZnNldCA9IHRoaXMuX2dldENlbnRlck9mZnNldChjZW50ZXIpLl9kaXZpZGVCeSgxIC0gMSAvIHNjYWxlKSxcblx0XHRcdG9yaWdpbiA9IHRoaXMuX2dldENlbnRlckxheWVyUG9pbnQoKS5fYWRkKG9mZnNldCk7XG5cblx0XHQvLyBkb24ndCBhbmltYXRlIGlmIHRoZSB6b29tIG9yaWdpbiBpc24ndCB3aXRoaW4gb25lIHNjcmVlbiBmcm9tIHRoZSBjdXJyZW50IGNlbnRlciwgdW5sZXNzIGZvcmNlZFxuXHRcdGlmIChvcHRpb25zLmFuaW1hdGUgIT09IHRydWUgJiYgIXRoaXMuZ2V0U2l6ZSgpLmNvbnRhaW5zKG9mZnNldCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHR0aGlzXG5cdFx0ICAgIC5maXJlKCdtb3Zlc3RhcnQnKVxuXHRcdCAgICAuZmlyZSgnem9vbXN0YXJ0Jyk7XG5cblx0XHR0aGlzLl9hbmltYXRlWm9vbShjZW50ZXIsIHpvb20sIG9yaWdpbiwgc2NhbGUsIG51bGwsIHRydWUpO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblx0X2FuaW1hdGVab29tOiBmdW5jdGlvbiAoY2VudGVyLCB6b29tLCBvcmlnaW4sIHNjYWxlLCBkZWx0YSwgYmFja3dhcmRzLCBmb3JUb3VjaFpvb20pIHtcblxuXHRcdGlmICghZm9yVG91Y2hab29tKSB7XG5cdFx0XHR0aGlzLl9hbmltYXRpbmdab29tID0gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBwdXQgdHJhbnNmb3JtIHRyYW5zaXRpb24gb24gYWxsIGxheWVycyB3aXRoIGxlYWZsZXQtem9vbS1hbmltYXRlZCBjbGFzc1xuXHRcdEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9tYXBQYW5lLCAnbGVhZmxldC16b29tLWFuaW0nKTtcblxuXHRcdC8vIHJlbWVtYmVyIHdoYXQgY2VudGVyL3pvb20gdG8gc2V0IGFmdGVyIGFuaW1hdGlvblxuXHRcdHRoaXMuX2FuaW1hdGVUb0NlbnRlciA9IGNlbnRlcjtcblx0XHR0aGlzLl9hbmltYXRlVG9ab29tID0gem9vbTtcblxuXHRcdC8vIGRpc2FibGUgYW55IGRyYWdnaW5nIGR1cmluZyBhbmltYXRpb25cblx0XHRpZiAoTC5EcmFnZ2FibGUpIHtcblx0XHRcdEwuRHJhZ2dhYmxlLl9kaXNhYmxlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0TC5VdGlsLnJlcXVlc3RBbmltRnJhbWUoZnVuY3Rpb24gKCkge1xuXHRcdFx0dGhpcy5maXJlKCd6b29tYW5pbScsIHtcblx0XHRcdFx0Y2VudGVyOiBjZW50ZXIsXG5cdFx0XHRcdHpvb206IHpvb20sXG5cdFx0XHRcdG9yaWdpbjogb3JpZ2luLFxuXHRcdFx0XHRzY2FsZTogc2NhbGUsXG5cdFx0XHRcdGRlbHRhOiBkZWx0YSxcblx0XHRcdFx0YmFja3dhcmRzOiBiYWNrd2FyZHNcblx0XHRcdH0pO1xuXHRcdH0sIHRoaXMpO1xuXHR9LFxuXG5cdF9vblpvb21UcmFuc2l0aW9uRW5kOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLl9hbmltYXRpbmdab29tID0gZmFsc2U7XG5cblx0XHRMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fbWFwUGFuZSwgJ2xlYWZsZXQtem9vbS1hbmltJyk7XG5cblx0XHR0aGlzLl9yZXNldFZpZXcodGhpcy5fYW5pbWF0ZVRvQ2VudGVyLCB0aGlzLl9hbmltYXRlVG9ab29tLCB0cnVlLCB0cnVlKTtcblxuXHRcdGlmIChMLkRyYWdnYWJsZSkge1xuXHRcdFx0TC5EcmFnZ2FibGUuX2Rpc2FibGVkID0gZmFsc2U7XG5cdFx0fVxuXHR9XG59KTtcblxuXG4vKlxuXHRab29tIGFuaW1hdGlvbiBsb2dpYyBmb3IgTC5UaWxlTGF5ZXIuXG4qL1xuXG5MLlRpbGVMYXllci5pbmNsdWRlKHtcblx0X2FuaW1hdGVab29tOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghdGhpcy5fYW5pbWF0aW5nKSB7XG5cdFx0XHR0aGlzLl9hbmltYXRpbmcgPSB0cnVlO1xuXHRcdFx0dGhpcy5fcHJlcGFyZUJnQnVmZmVyKCk7XG5cdFx0fVxuXG5cdFx0dmFyIGJnID0gdGhpcy5fYmdCdWZmZXIsXG5cdFx0ICAgIHRyYW5zZm9ybSA9IEwuRG9tVXRpbC5UUkFOU0ZPUk0sXG5cdFx0ICAgIGluaXRpYWxUcmFuc2Zvcm0gPSBlLmRlbHRhID8gTC5Eb21VdGlsLmdldFRyYW5zbGF0ZVN0cmluZyhlLmRlbHRhKSA6IGJnLnN0eWxlW3RyYW5zZm9ybV0sXG5cdFx0ICAgIHNjYWxlU3RyID0gTC5Eb21VdGlsLmdldFNjYWxlU3RyaW5nKGUuc2NhbGUsIGUub3JpZ2luKTtcblxuXHRcdGJnLnN0eWxlW3RyYW5zZm9ybV0gPSBlLmJhY2t3YXJkcyA/XG5cdFx0XHRcdHNjYWxlU3RyICsgJyAnICsgaW5pdGlhbFRyYW5zZm9ybSA6XG5cdFx0XHRcdGluaXRpYWxUcmFuc2Zvcm0gKyAnICcgKyBzY2FsZVN0cjtcblx0fSxcblxuXHRfZW5kWm9vbUFuaW06IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZnJvbnQgPSB0aGlzLl90aWxlQ29udGFpbmVyLFxuXHRcdCAgICBiZyA9IHRoaXMuX2JnQnVmZmVyO1xuXG5cdFx0ZnJvbnQuc3R5bGUudmlzaWJpbGl0eSA9ICcnO1xuXHRcdGZyb250LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoZnJvbnQpOyAvLyBCcmluZyB0byBmb3JlXG5cblx0XHQvLyBmb3JjZSByZWZsb3dcblx0XHRMLlV0aWwuZmFsc2VGbihiZy5vZmZzZXRXaWR0aCk7XG5cblx0XHR0aGlzLl9hbmltYXRpbmcgPSBmYWxzZTtcblx0fSxcblxuXHRfY2xlYXJCZ0J1ZmZlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cblx0XHRpZiAobWFwICYmICFtYXAuX2FuaW1hdGluZ1pvb20gJiYgIW1hcC50b3VjaFpvb20uX3pvb21pbmcpIHtcblx0XHRcdHRoaXMuX2JnQnVmZmVyLmlubmVySFRNTCA9ICcnO1xuXHRcdFx0dGhpcy5fYmdCdWZmZXIuc3R5bGVbTC5Eb21VdGlsLlRSQU5TRk9STV0gPSAnJztcblx0XHR9XG5cdH0sXG5cblx0X3ByZXBhcmVCZ0J1ZmZlcjogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIGZyb250ID0gdGhpcy5fdGlsZUNvbnRhaW5lcixcblx0XHQgICAgYmcgPSB0aGlzLl9iZ0J1ZmZlcjtcblxuXHRcdC8vIGlmIGZvcmVncm91bmQgbGF5ZXIgZG9lc24ndCBoYXZlIG1hbnkgdGlsZXMgYnV0IGJnIGxheWVyIGRvZXMsXG5cdFx0Ly8ga2VlcCB0aGUgZXhpc3RpbmcgYmcgbGF5ZXIgYW5kIGp1c3Qgem9vbSBpdCBzb21lIG1vcmVcblxuXHRcdHZhciBiZ0xvYWRlZCA9IHRoaXMuX2dldExvYWRlZFRpbGVzUGVyY2VudGFnZShiZyksXG5cdFx0ICAgIGZyb250TG9hZGVkID0gdGhpcy5fZ2V0TG9hZGVkVGlsZXNQZXJjZW50YWdlKGZyb250KTtcblxuXHRcdGlmIChiZyAmJiBiZ0xvYWRlZCA+IDAuNSAmJiBmcm9udExvYWRlZCA8IDAuNSkge1xuXG5cdFx0XHRmcm9udC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHR0aGlzLl9zdG9wTG9hZGluZ0ltYWdlcyhmcm9udCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gcHJlcGFyZSB0aGUgYnVmZmVyIHRvIGJlY29tZSB0aGUgZnJvbnQgdGlsZSBwYW5lXG5cdFx0Ymcuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuXHRcdGJnLnN0eWxlW0wuRG9tVXRpbC5UUkFOU0ZPUk1dID0gJyc7XG5cblx0XHQvLyBzd2l0Y2ggb3V0IHRoZSBjdXJyZW50IGxheWVyIHRvIGJlIHRoZSBuZXcgYmcgbGF5ZXIgKGFuZCB2aWNlLXZlcnNhKVxuXHRcdHRoaXMuX3RpbGVDb250YWluZXIgPSBiZztcblx0XHRiZyA9IHRoaXMuX2JnQnVmZmVyID0gZnJvbnQ7XG5cblx0XHR0aGlzLl9zdG9wTG9hZGluZ0ltYWdlcyhiZyk7XG5cblx0XHQvL3ByZXZlbnQgYmcgYnVmZmVyIGZyb20gY2xlYXJpbmcgcmlnaHQgYWZ0ZXIgem9vbVxuXHRcdGNsZWFyVGltZW91dCh0aGlzLl9jbGVhckJnQnVmZmVyVGltZXIpO1xuXHR9LFxuXG5cdF9nZXRMb2FkZWRUaWxlc1BlcmNlbnRhZ2U6IGZ1bmN0aW9uIChjb250YWluZXIpIHtcblx0XHR2YXIgdGlsZXMgPSBjb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpLFxuXHRcdCAgICBpLCBsZW4sIGNvdW50ID0gMDtcblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IHRpbGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAodGlsZXNbaV0uY29tcGxldGUpIHtcblx0XHRcdFx0Y291bnQrKztcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNvdW50IC8gbGVuO1xuXHR9LFxuXG5cdC8vIHN0b3BzIGxvYWRpbmcgYWxsIHRpbGVzIGluIHRoZSBiYWNrZ3JvdW5kIGxheWVyXG5cdF9zdG9wTG9hZGluZ0ltYWdlczogZnVuY3Rpb24gKGNvbnRhaW5lcikge1xuXHRcdHZhciB0aWxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGNvbnRhaW5lci5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJykpLFxuXHRcdCAgICBpLCBsZW4sIHRpbGU7XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aWxlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGlsZSA9IHRpbGVzW2ldO1xuXG5cdFx0XHRpZiAoIXRpbGUuY29tcGxldGUpIHtcblx0XHRcdFx0dGlsZS5vbmxvYWQgPSBMLlV0aWwuZmFsc2VGbjtcblx0XHRcdFx0dGlsZS5vbmVycm9yID0gTC5VdGlsLmZhbHNlRm47XG5cdFx0XHRcdHRpbGUuc3JjID0gTC5VdGlsLmVtcHR5SW1hZ2VVcmw7XG5cblx0XHRcdFx0dGlsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRpbGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSk7XG5cblxuLypcclxuICogUHJvdmlkZXMgTC5NYXAgd2l0aCBjb252ZW5pZW50IHNob3J0Y3V0cyBmb3IgdXNpbmcgYnJvd3NlciBnZW9sb2NhdGlvbiBmZWF0dXJlcy5cclxuICovXHJcblxyXG5MLk1hcC5pbmNsdWRlKHtcclxuXHRfZGVmYXVsdExvY2F0ZU9wdGlvbnM6IHtcclxuXHRcdHdhdGNoOiBmYWxzZSxcclxuXHRcdHNldFZpZXc6IGZhbHNlLFxyXG5cdFx0bWF4Wm9vbTogSW5maW5pdHksXHJcblx0XHR0aW1lb3V0OiAxMDAwMCxcclxuXHRcdG1heGltdW1BZ2U6IDAsXHJcblx0XHRlbmFibGVIaWdoQWNjdXJhY3k6IGZhbHNlXHJcblx0fSxcclxuXHJcblx0bG9jYXRlOiBmdW5jdGlvbiAoLypPYmplY3QqLyBvcHRpb25zKSB7XHJcblxyXG5cdFx0b3B0aW9ucyA9IHRoaXMuX2xvY2F0ZU9wdGlvbnMgPSBMLmV4dGVuZCh0aGlzLl9kZWZhdWx0TG9jYXRlT3B0aW9ucywgb3B0aW9ucyk7XHJcblxyXG5cdFx0aWYgKCFuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHRcdFx0dGhpcy5faGFuZGxlR2VvbG9jYXRpb25FcnJvcih7XHJcblx0XHRcdFx0Y29kZTogMCxcclxuXHRcdFx0XHRtZXNzYWdlOiAnR2VvbG9jYXRpb24gbm90IHN1cHBvcnRlZC4nXHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgb25SZXNwb25zZSA9IEwuYmluZCh0aGlzLl9oYW5kbGVHZW9sb2NhdGlvblJlc3BvbnNlLCB0aGlzKSxcclxuXHRcdFx0b25FcnJvciA9IEwuYmluZCh0aGlzLl9oYW5kbGVHZW9sb2NhdGlvbkVycm9yLCB0aGlzKTtcclxuXHJcblx0XHRpZiAob3B0aW9ucy53YXRjaCkge1xyXG5cdFx0XHR0aGlzLl9sb2NhdGlvbldhdGNoSWQgPVxyXG5cdFx0XHQgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKG9uUmVzcG9uc2UsIG9uRXJyb3IsIG9wdGlvbnMpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihvblJlc3BvbnNlLCBvbkVycm9yLCBvcHRpb25zKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH0sXHJcblxyXG5cdHN0b3BMb2NhdGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHRcdFx0bmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2godGhpcy5fbG9jYXRpb25XYXRjaElkKTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9sb2NhdGVPcHRpb25zKSB7XHJcblx0XHRcdHRoaXMuX2xvY2F0ZU9wdGlvbnMuc2V0VmlldyA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fSxcclxuXHJcblx0X2hhbmRsZUdlb2xvY2F0aW9uRXJyb3I6IGZ1bmN0aW9uIChlcnJvcikge1xyXG5cdFx0dmFyIGMgPSBlcnJvci5jb2RlLFxyXG5cdFx0ICAgIG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIHx8XHJcblx0XHQgICAgICAgICAgICAoYyA9PT0gMSA/ICdwZXJtaXNzaW9uIGRlbmllZCcgOlxyXG5cdFx0ICAgICAgICAgICAgKGMgPT09IDIgPyAncG9zaXRpb24gdW5hdmFpbGFibGUnIDogJ3RpbWVvdXQnKSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuX2xvY2F0ZU9wdGlvbnMuc2V0VmlldyAmJiAhdGhpcy5fbG9hZGVkKSB7XHJcblx0XHRcdHRoaXMuZml0V29ybGQoKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ2xvY2F0aW9uZXJyb3InLCB7XHJcblx0XHRcdGNvZGU6IGMsXHJcblx0XHRcdG1lc3NhZ2U6ICdHZW9sb2NhdGlvbiBlcnJvcjogJyArIG1lc3NhZ2UgKyAnLidcclxuXHRcdH0pO1xyXG5cdH0sXHJcblxyXG5cdF9oYW5kbGVHZW9sb2NhdGlvblJlc3BvbnNlOiBmdW5jdGlvbiAocG9zKSB7XHJcblx0XHR2YXIgbGF0ID0gcG9zLmNvb3Jkcy5sYXRpdHVkZSxcclxuXHRcdCAgICBsbmcgPSBwb3MuY29vcmRzLmxvbmdpdHVkZSxcclxuXHRcdCAgICBsYXRsbmcgPSBuZXcgTC5MYXRMbmcobGF0LCBsbmcpLFxyXG5cclxuXHRcdCAgICBsYXRBY2N1cmFjeSA9IDE4MCAqIHBvcy5jb29yZHMuYWNjdXJhY3kgLyA0MDA3NTAxNyxcclxuXHRcdCAgICBsbmdBY2N1cmFjeSA9IGxhdEFjY3VyYWN5IC8gTWF0aC5jb3MoTC5MYXRMbmcuREVHX1RPX1JBRCAqIGxhdCksXHJcblxyXG5cdFx0ICAgIGJvdW5kcyA9IEwubGF0TG5nQm91bmRzKFxyXG5cdFx0ICAgICAgICAgICAgW2xhdCAtIGxhdEFjY3VyYWN5LCBsbmcgLSBsbmdBY2N1cmFjeV0sXHJcblx0XHQgICAgICAgICAgICBbbGF0ICsgbGF0QWNjdXJhY3ksIGxuZyArIGxuZ0FjY3VyYWN5XSksXHJcblxyXG5cdFx0ICAgIG9wdGlvbnMgPSB0aGlzLl9sb2NhdGVPcHRpb25zO1xyXG5cclxuXHRcdGlmIChvcHRpb25zLnNldFZpZXcpIHtcclxuXHRcdFx0dmFyIHpvb20gPSBNYXRoLm1pbih0aGlzLmdldEJvdW5kc1pvb20oYm91bmRzKSwgb3B0aW9ucy5tYXhab29tKTtcclxuXHRcdFx0dGhpcy5zZXRWaWV3KGxhdGxuZywgem9vbSk7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGRhdGEgPSB7XHJcblx0XHRcdGxhdGxuZzogbGF0bG5nLFxyXG5cdFx0XHRib3VuZHM6IGJvdW5kcyxcclxuXHRcdFx0dGltZXN0YW1wOiBwb3MudGltZXN0YW1wXHJcblx0XHR9O1xyXG5cclxuXHRcdGZvciAodmFyIGkgaW4gcG9zLmNvb3Jkcykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHBvcy5jb29yZHNbaV0gPT09ICdudW1iZXInKSB7XHJcblx0XHRcdFx0ZGF0YVtpXSA9IHBvcy5jb29yZHNbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmZpcmUoJ2xvY2F0aW9uZm91bmQnLCBkYXRhKTtcclxuXHR9XHJcbn0pO1xyXG5cblxufSh3aW5kb3csIGRvY3VtZW50KSk7IiwiLyohXG4gKiBtdXN0YWNoZS5qcyAtIExvZ2ljLWxlc3Mge3ttdXN0YWNoZX19IHRlbXBsYXRlcyB3aXRoIEphdmFTY3JpcHRcbiAqIGh0dHA6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanNcbiAqL1xuXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlKi9cblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiBleHBvcnRzKSB7XG4gICAgZmFjdG9yeShleHBvcnRzKTsgLy8gQ29tbW9uSlNcbiAgfSBlbHNlIHtcbiAgICB2YXIgbXVzdGFjaGUgPSB7fTtcbiAgICBmYWN0b3J5KG11c3RhY2hlKTtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIGRlZmluZShtdXN0YWNoZSk7IC8vIEFNRFxuICAgIH0gZWxzZSB7XG4gICAgICByb290Lk11c3RhY2hlID0gbXVzdGFjaGU7IC8vIDxzY3JpcHQ+XG4gICAgfVxuICB9XG59KHRoaXMsIGZ1bmN0aW9uIChtdXN0YWNoZSkge1xuXG4gIHZhciB3aGl0ZVJlID0gL1xccyovO1xuICB2YXIgc3BhY2VSZSA9IC9cXHMrLztcbiAgdmFyIG5vblNwYWNlUmUgPSAvXFxTLztcbiAgdmFyIGVxUmUgPSAvXFxzKj0vO1xuICB2YXIgY3VybHlSZSA9IC9cXHMqXFx9LztcbiAgdmFyIHRhZ1JlID0gLyN8XFxefFxcL3w+fFxce3wmfD18IS87XG5cbiAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9pc3N1ZXMuYXBhY2hlLm9yZy9qaXJhL2Jyb3dzZS9DT1VDSERCLTU3N1xuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzE4OVxuICB2YXIgUmVnRXhwX3Rlc3QgPSBSZWdFeHAucHJvdG90eXBlLnRlc3Q7XG4gIGZ1bmN0aW9uIHRlc3RSZWdFeHAocmUsIHN0cmluZykge1xuICAgIHJldHVybiBSZWdFeHBfdGVzdC5jYWxsKHJlLCBzdHJpbmcpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNXaGl0ZXNwYWNlKHN0cmluZykge1xuICAgIHJldHVybiAhdGVzdFJlZ0V4cChub25TcGFjZVJlLCBzdHJpbmcpO1xuICB9XG5cbiAgdmFyIE9iamVjdF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdF90b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgZnVuY3Rpb24gaXNGdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gJ2Z1bmN0aW9uJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1tcXC1cXFtcXF17fSgpKis/LixcXFxcXFxeJHwjXFxzXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgXCImXCI6IFwiJmFtcDtcIixcbiAgICBcIjxcIjogXCImbHQ7XCIsXG4gICAgXCI+XCI6IFwiJmd0O1wiLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgIFwiL1wiOiAnJiN4MkY7J1xuICB9O1xuXG4gIGZ1bmN0aW9uIGVzY2FwZUh0bWwoc3RyaW5nKSB7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoL1smPD5cIidcXC9dL2csIGZ1bmN0aW9uIChzKSB7XG4gICAgICByZXR1cm4gZW50aXR5TWFwW3NdO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gU2Nhbm5lcihzdHJpbmcpIHtcbiAgICB0aGlzLnN0cmluZyA9IHN0cmluZztcbiAgICB0aGlzLnRhaWwgPSBzdHJpbmc7XG4gICAgdGhpcy5wb3MgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYHRydWVgIGlmIHRoZSB0YWlsIGlzIGVtcHR5IChlbmQgb2Ygc3RyaW5nKS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLmVvcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50YWlsID09PSBcIlwiO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUcmllcyB0byBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIHRleHQgaWYgaXQgY2FuIG1hdGNoLCB0aGUgZW1wdHkgc3RyaW5nIG90aGVyd2lzZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiAocmUpIHtcbiAgICB2YXIgbWF0Y2ggPSB0aGlzLnRhaWwubWF0Y2gocmUpO1xuXG4gICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwKSB7XG4gICAgICB2YXIgc3RyaW5nID0gbWF0Y2hbMF07XG4gICAgICB0aGlzLnRhaWwgPSB0aGlzLnRhaWwuc3Vic3RyaW5nKHN0cmluZy5sZW5ndGgpO1xuICAgICAgdGhpcy5wb3MgKz0gc3RyaW5nLmxlbmd0aDtcbiAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNraXBzIGFsbCB0ZXh0IHVudGlsIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24gY2FuIGJlIG1hdGNoZWQuIFJldHVybnNcbiAgICogdGhlIHNraXBwZWQgc3RyaW5nLCB3aGljaCBpcyB0aGUgZW50aXJlIHRhaWwgaWYgbm8gbWF0Y2ggY2FuIGJlIG1hZGUuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5zY2FuVW50aWwgPSBmdW5jdGlvbiAocmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnRhaWwuc2VhcmNoKHJlKSwgbWF0Y2g7XG5cbiAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgY2FzZSAtMTpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsO1xuICAgICAgdGhpcy50YWlsID0gXCJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMDpcbiAgICAgIG1hdGNoID0gXCJcIjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhpbmRleCk7XG4gICAgfVxuXG4gICAgdGhpcy5wb3MgKz0gbWF0Y2gubGVuZ3RoO1xuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9O1xuXG4gIGZ1bmN0aW9uIENvbnRleHQodmlldywgcGFyZW50KSB7XG4gICAgdGhpcy52aWV3ID0gdmlldyA9PSBudWxsID8ge30gOiB2aWV3O1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX2NhY2hlID0geyAnLic6IHRoaXMudmlldyB9O1xuICB9XG5cbiAgQ29udGV4dC5tYWtlID0gZnVuY3Rpb24gKHZpZXcpIHtcbiAgICByZXR1cm4gKHZpZXcgaW5zdGFuY2VvZiBDb250ZXh0KSA/IHZpZXcgOiBuZXcgQ29udGV4dCh2aWV3KTtcbiAgfTtcblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHZpZXcpIHtcbiAgICByZXR1cm4gbmV3IENvbnRleHQodmlldywgdGhpcyk7XG4gIH07XG5cbiAgQ29udGV4dC5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKG5hbWUgaW4gdGhpcy5fY2FjaGUpIHtcbiAgICAgIHZhbHVlID0gdGhpcy5fY2FjaGVbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuICAgICAgd2hpbGUgKGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignLicpID4gMCkge1xuICAgICAgICAgIHZhbHVlID0gY29udGV4dC52aWV3O1xuXG4gICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdCgnLicpLCBpID0gMDtcbiAgICAgICAgICB3aGlsZSAodmFsdWUgIT0gbnVsbCAmJiBpIDwgbmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlW25hbWVzW2krK11dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlld1tuYW1lXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBicmVhaztcblxuICAgICAgICBjb250ZXh0ID0gY29udGV4dC5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NhY2hlW25hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcy52aWV3KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgZnVuY3Rpb24gV3JpdGVyKCkge1xuICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuICB9XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jbGVhckNhY2hlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgdGhpcy5fcGFydGlhbENhY2hlID0ge307XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdmFyIGZuID0gdGhpcy5fY2FjaGVbdGVtcGxhdGVdO1xuXG4gICAgaWYgKCFmbikge1xuICAgICAgdmFyIHRva2VucyA9IG11c3RhY2hlLnBhcnNlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICAgIGZuID0gdGhpcy5fY2FjaGVbdGVtcGxhdGVdID0gdGhpcy5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmbjtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLmNvbXBpbGVQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUsIHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdmFyIGZuID0gdGhpcy5jb21waWxlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICB0aGlzLl9wYXJ0aWFsQ2FjaGVbbmFtZV0gPSBmbjtcbiAgICByZXR1cm4gZm47XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5nZXRQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoIShuYW1lIGluIHRoaXMuX3BhcnRpYWxDYWNoZSkgJiYgdGhpcy5fbG9hZFBhcnRpYWwpIHtcbiAgICAgIHRoaXMuY29tcGlsZVBhcnRpYWwobmFtZSwgdGhpcy5fbG9hZFBhcnRpYWwobmFtZSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wYXJ0aWFsQ2FjaGVbbmFtZV07XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2aWV3LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHBhcnRpYWxzKSB7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHBhcnRpYWxzKSkge1xuICAgICAgICAgIHNlbGYuX2xvYWRQYXJ0aWFsID0gcGFydGlhbHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBwYXJ0aWFscykge1xuICAgICAgICAgICAgc2VsZi5jb21waWxlUGFydGlhbChuYW1lLCBwYXJ0aWFsc1tuYW1lXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZW5kZXJUb2tlbnModG9rZW5zLCBzZWxmLCBDb250ZXh0Lm1ha2UodmlldyksIHRlbXBsYXRlKTtcbiAgICB9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscykge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGUodGVtcGxhdGUpKHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvKipcbiAgICogTG93LWxldmVsIGZ1bmN0aW9uIHRoYXQgcmVuZGVycyB0aGUgZ2l2ZW4gYHRva2Vuc2AgdXNpbmcgdGhlIGdpdmVuIGB3cml0ZXJgXG4gICAqIGFuZCBgY29udGV4dGAuIFRoZSBgdGVtcGxhdGVgIHN0cmluZyBpcyBvbmx5IG5lZWRlZCBmb3IgdGVtcGxhdGVzIHRoYXQgdXNlXG4gICAqIGhpZ2hlci1vcmRlciBzZWN0aW9ucyB0byBleHRyYWN0IHRoZSBwb3J0aW9uIG9mIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSB0aGF0XG4gICAqIHdhcyBjb250YWluZWQgaW4gdGhhdCBzZWN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVuZGVyVG9rZW5zKHRva2Vucywgd3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSkge1xuICAgIHZhciBidWZmZXIgPSAnJztcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byByZW5kZXIgYW4gYXJ0Yml0cmFyeSB0ZW1wbGF0ZVxuICAgIC8vIGluIHRoZSBjdXJyZW50IGNvbnRleHQgYnkgaGlnaGVyLW9yZGVyIGZ1bmN0aW9ucy5cbiAgICBmdW5jdGlvbiBzdWJSZW5kZXIodGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiB3cml0ZXIucmVuZGVyKHRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICB2YXIgdG9rZW4sIHRva2VuVmFsdWUsIHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgdG9rZW5WYWx1ZSA9IHRva2VuWzFdO1xuXG4gICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICBjYXNlICcjJzpcbiAgICAgICAgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblZhbHVlKTtcblxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHZhbHVlLmxlbmd0aDsgaiA8IGpsZW47ICsraikge1xuICAgICAgICAgICAgICBidWZmZXIgKz0gcmVuZGVyVG9rZW5zKHRva2VuWzRdLCB3cml0ZXIsIGNvbnRleHQucHVzaCh2YWx1ZVtqXSksIHRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBidWZmZXIgKz0gcmVuZGVyVG9rZW5zKHRva2VuWzRdLCB3cml0ZXIsIGNvbnRleHQucHVzaCh2YWx1ZSksIHRlbXBsYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgICB2YXIgdGV4dCA9IHRlbXBsYXRlID09IG51bGwgPyBudWxsIDogdGVtcGxhdGUuc2xpY2UodG9rZW5bM10sIHRva2VuWzVdKTtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwoY29udGV4dC52aWV3LCB0ZXh0LCBzdWJSZW5kZXIpO1xuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgICAgICBidWZmZXIgKz0gcmVuZGVyVG9rZW5zKHRva2VuWzRdLCB3cml0ZXIsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnXic6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5WYWx1ZSk7XG5cbiAgICAgICAgLy8gVXNlIEphdmFTY3JpcHQncyBkZWZpbml0aW9uIG9mIGZhbHN5LiBJbmNsdWRlIGVtcHR5IGFycmF5cy5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODZcbiAgICAgICAgaWYgKCF2YWx1ZSB8fCAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgIGJ1ZmZlciArPSByZW5kZXJUb2tlbnModG9rZW5bNF0sIHdyaXRlciwgY29udGV4dCwgdGVtcGxhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc+JzpcbiAgICAgICAgdmFsdWUgPSB3cml0ZXIuZ2V0UGFydGlhbCh0b2tlblZhbHVlKTtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSBidWZmZXIgKz0gdmFsdWUoY29udGV4dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnJic6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5WYWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbmFtZSc6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5WYWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSBidWZmZXIgKz0gbXVzdGFjaGUuZXNjYXBlKHZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgYnVmZmVyICs9IHRva2VuVmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBidWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogRm9ybXMgdGhlIGdpdmVuIGFycmF5IG9mIGB0b2tlbnNgIGludG8gYSBuZXN0ZWQgdHJlZSBzdHJ1Y3R1cmUgd2hlcmVcbiAgICogdG9rZW5zIHRoYXQgcmVwcmVzZW50IGEgc2VjdGlvbiBoYXZlIHR3byBhZGRpdGlvbmFsIGl0ZW1zOiAxKSBhbiBhcnJheSBvZlxuICAgKiBhbGwgdG9rZW5zIHRoYXQgYXBwZWFyIGluIHRoYXQgc2VjdGlvbiBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbFxuICAgKiB0ZW1wbGF0ZSB0aGF0IHJlcHJlc2VudHMgdGhlIGVuZCBvZiB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBuZXN0VG9rZW5zKHRva2Vucykge1xuICAgIHZhciB0cmVlID0gW107XG4gICAgdmFyIGNvbGxlY3RvciA9IHRyZWU7XG4gICAgdmFyIHNlY3Rpb25zID0gW107XG5cbiAgICB2YXIgdG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICBjYXNlICcjJzpcbiAgICAgIGNhc2UgJ14nOlxuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgICBjb2xsZWN0b3IgPSB0b2tlbls0XSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICB2YXIgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgICAgICBzZWN0aW9uWzVdID0gdG9rZW5bMl07XG4gICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IHRyZWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIHRoZSB2YWx1ZXMgb2YgY29uc2VjdXRpdmUgdGV4dCB0b2tlbnMgaW4gdGhlIGdpdmVuIGB0b2tlbnNgIGFycmF5XG4gICAqIHRvIGEgc2luZ2xlIHRva2VuLlxuICAgKi9cbiAgZnVuY3Rpb24gc3F1YXNoVG9rZW5zKHRva2Vucykge1xuICAgIHZhciBzcXVhc2hlZFRva2VucyA9IFtdO1xuXG4gICAgdmFyIHRva2VuLCBsYXN0VG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuWzBdID09PSAndGV4dCcgJiYgbGFzdFRva2VuICYmIGxhc3RUb2tlblswXSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgbGFzdFRva2VuWzFdICs9IHRva2VuWzFdO1xuICAgICAgICAgIGxhc3RUb2tlblszXSA9IHRva2VuWzNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2VuO1xuICAgICAgICAgIHNxdWFzaGVkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNxdWFzaGVkVG9rZW5zO1xuICB9XG5cbiAgZnVuY3Rpb24gZXNjYXBlVGFncyh0YWdzKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBSZWdFeHAoZXNjYXBlUmVnRXhwKHRhZ3NbMF0pICsgXCJcXFxccypcIiksXG4gICAgICBuZXcgUmVnRXhwKFwiXFxcXHMqXCIgKyBlc2NhcGVSZWdFeHAodGFnc1sxXSkpXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCcmVha3MgdXAgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgc3RyaW5nIGludG8gYSB0cmVlIG9mIHRva2VuIG9iamVjdHMuIElmXG4gICAqIGB0YWdzYCBpcyBnaXZlbiBoZXJlIGl0IG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gc3RyaW5nIHZhbHVlczogdGhlXG4gICAqIG9wZW5pbmcgYW5kIGNsb3NpbmcgdGFncyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSAoZS5nLiBbXCI8JVwiLCBcIiU+XCJdKS4gT2ZcbiAgICogY291cnNlLCB0aGUgZGVmYXVsdCBpcyB0byB1c2UgbXVzdGFjaGVzIChpLmUuIE11c3RhY2hlLnRhZ3MpLlxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgJyc7XG4gICAgdGFncyA9IHRhZ3MgfHwgbXVzdGFjaGUudGFncztcblxuICAgIGlmICh0eXBlb2YgdGFncyA9PT0gJ3N0cmluZycpIHRhZ3MgPSB0YWdzLnNwbGl0KHNwYWNlUmUpO1xuICAgIGlmICh0YWdzLmxlbmd0aCAhPT0gMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZ3M6ICcgKyB0YWdzLmpvaW4oJywgJykpO1xuXG4gICAgdmFyIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyk7XG4gICAgdmFyIHNjYW5uZXIgPSBuZXcgU2Nhbm5lcih0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgc2VjdGlvbnMgPSBbXTsgICAgIC8vIFN0YWNrIHRvIGhvbGQgc2VjdGlvbiB0b2tlbnNcbiAgICB2YXIgdG9rZW5zID0gW107ICAgICAgIC8vIEJ1ZmZlciB0byBob2xkIHRoZSB0b2tlbnNcbiAgICB2YXIgc3BhY2VzID0gW107ICAgICAgIC8vIEluZGljZXMgb2Ygd2hpdGVzcGFjZSB0b2tlbnMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgIHZhciBoYXNUYWcgPSBmYWxzZTsgICAgLy8gSXMgdGhlcmUgYSB7e3RhZ319IG9uIHRoZSBjdXJyZW50IGxpbmU/XG4gICAgdmFyIG5vblNwYWNlID0gZmFsc2U7ICAvLyBJcyB0aGVyZSBhIG5vbi1zcGFjZSBjaGFyIG9uIHRoZSBjdXJyZW50IGxpbmU/XG5cbiAgICAvLyBTdHJpcHMgYWxsIHdoaXRlc3BhY2UgdG9rZW5zIGFycmF5IGZvciB0aGUgY3VycmVudCBsaW5lXG4gICAgLy8gaWYgdGhlcmUgd2FzIGEge3sjdGFnfX0gb24gaXQgYW5kIG90aGVyd2lzZSBvbmx5IHNwYWNlLlxuICAgIGZ1bmN0aW9uIHN0cmlwU3BhY2UoKSB7XG4gICAgICBpZiAoaGFzVGFnICYmICFub25TcGFjZSkge1xuICAgICAgICB3aGlsZSAoc3BhY2VzLmxlbmd0aCkge1xuICAgICAgICAgIGRlbGV0ZSB0b2tlbnNbc3BhY2VzLnBvcCgpXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VzID0gW107XG4gICAgICB9XG5cbiAgICAgIGhhc1RhZyA9IGZhbHNlO1xuICAgICAgbm9uU3BhY2UgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcnQsIHR5cGUsIHZhbHVlLCBjaHIsIHRva2VuLCBvcGVuU2VjdGlvbjtcbiAgICB3aGlsZSAoIXNjYW5uZXIuZW9zKCkpIHtcbiAgICAgIHN0YXJ0ID0gc2Nhbm5lci5wb3M7XG5cbiAgICAgIC8vIE1hdGNoIGFueSB0ZXh0IGJldHdlZW4gdGFncy5cbiAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzBdKTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBjaHIgPSB2YWx1ZS5jaGFyQXQoaSk7XG5cbiAgICAgICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNocikpIHtcbiAgICAgICAgICAgIHNwYWNlcy5wdXNoKHRva2Vucy5sZW5ndGgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub25TcGFjZSA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9rZW5zLnB1c2goWyd0ZXh0JywgY2hyLCBzdGFydCwgc3RhcnQgKyAxXSk7XG4gICAgICAgICAgc3RhcnQgKz0gMTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciB3aGl0ZXNwYWNlIG9uIHRoZSBjdXJyZW50IGxpbmUuXG4gICAgICAgICAgaWYgKGNociA9PSAnXFxuJykgc3RyaXBTcGFjZSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBvcGVuaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKHRhZ1Jlc1swXSkpIGJyZWFrO1xuICAgICAgaGFzVGFnID0gdHJ1ZTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdHlwZS5cbiAgICAgIHR5cGUgPSBzY2FubmVyLnNjYW4odGFnUmUpIHx8ICduYW1lJztcbiAgICAgIHNjYW5uZXIuc2Nhbih3aGl0ZVJlKTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdmFsdWUuXG4gICAgICBpZiAodHlwZSA9PT0gJz0nKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoZXFSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihlcVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzFdKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3snKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwobmV3IFJlZ0V4cCgnXFxcXHMqJyArIGVzY2FwZVJlZ0V4cCgnfScgKyB0YWdzWzFdKSkpO1xuICAgICAgICBzY2FubmVyLnNjYW4oY3VybHlSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICAgIHR5cGUgPSAnJic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBjbG9zaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKHRhZ1Jlc1sxXSkpIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgdGFnIGF0ICcgKyBzY2FubmVyLnBvcyk7XG5cbiAgICAgIHRva2VuID0gW3R5cGUsIHZhbHVlLCBzdGFydCwgc2Nhbm5lci5wb3NdO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuXG4gICAgICBpZiAodHlwZSA9PT0gJyMnIHx8IHR5cGUgPT09ICdeJykge1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIENoZWNrIHNlY3Rpb24gbmVzdGluZy5cbiAgICAgICAgb3BlblNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICAgICAgaWYgKCFvcGVuU2VjdGlvbikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5vcGVuZWQgc2VjdGlvbiBcIicgKyB2YWx1ZSArICdcIiBhdCAnICsgc3RhcnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcGVuU2VjdGlvblsxXSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuY2xvc2VkIHNlY3Rpb24gXCInICsgb3BlblNlY3Rpb25bMV0gKyAnXCIgYXQgJyArIHN0YXJ0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnbmFtZScgfHwgdHlwZSA9PT0gJ3snIHx8IHR5cGUgPT09ICcmJykge1xuICAgICAgICBub25TcGFjZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICc9Jykge1xuICAgICAgICAvLyBTZXQgdGhlIHRhZ3MgZm9yIHRoZSBuZXh0IHRpbWUgYXJvdW5kLlxuICAgICAgICB0YWdzID0gdmFsdWUuc3BsaXQoc3BhY2VSZSk7XG4gICAgICAgIGlmICh0YWdzLmxlbmd0aCAhPT0gMikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0YWdzIGF0ICcgKyBzdGFydCArICc6ICcgKyB0YWdzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRoZXJlIGFyZSBubyBvcGVuIHNlY3Rpb25zIHdoZW4gd2UncmUgZG9uZS5cbiAgICBvcGVuU2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgIGlmIChvcGVuU2VjdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIG9wZW5TZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzY2FubmVyLnBvcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RUb2tlbnMoc3F1YXNoVG9rZW5zKHRva2VucykpO1xuICB9XG5cbiAgbXVzdGFjaGUubmFtZSA9IFwibXVzdGFjaGUuanNcIjtcbiAgbXVzdGFjaGUudmVyc2lvbiA9IFwiMC43LjNcIjtcbiAgbXVzdGFjaGUudGFncyA9IFtcInt7XCIsIFwifX1cIl07XG5cbiAgbXVzdGFjaGUuU2Nhbm5lciA9IFNjYW5uZXI7XG4gIG11c3RhY2hlLkNvbnRleHQgPSBDb250ZXh0O1xuICBtdXN0YWNoZS5Xcml0ZXIgPSBXcml0ZXI7XG5cbiAgbXVzdGFjaGUucGFyc2UgPSBwYXJzZVRlbXBsYXRlO1xuXG4gIC8vIEV4cG9ydCB0aGUgZXNjYXBpbmcgZnVuY3Rpb24gc28gdGhhdCB0aGUgdXNlciBtYXkgb3ZlcnJpZGUgaXQuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMjQ0XG4gIG11c3RhY2hlLmVzY2FwZSA9IGVzY2FwZUh0bWw7XG5cbiAgLy8gQWxsIE11c3RhY2hlLiogZnVuY3Rpb25zIHVzZSB0aGlzIHdyaXRlci5cbiAgdmFyIGRlZmF1bHRXcml0ZXIgPSBuZXcgV3JpdGVyKCk7XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgY2FjaGVkIHRlbXBsYXRlcyBhbmQgcGFydGlhbHMgaW4gdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgbXVzdGFjaGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jbGVhckNhY2hlKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBgdGVtcGxhdGVgIHRvIGEgcmV1c2FibGUgZnVuY3Rpb24gdXNpbmcgdGhlIGRlZmF1bHRcbiAgICogd3JpdGVyLlxuICAgKi9cbiAgbXVzdGFjaGUuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLmNvbXBpbGUodGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgcGFydGlhbCB3aXRoIHRoZSBnaXZlbiBgbmFtZWAgYW5kIGB0ZW1wbGF0ZWAgdG8gYSByZXVzYWJsZVxuICAgKiBmdW5jdGlvbiB1c2luZyB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5jb21waWxlUGFydGlhbCA9IGZ1bmN0aW9uIChuYW1lLCB0ZW1wbGF0ZSwgdGFncykge1xuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLmNvbXBpbGVQYXJ0aWFsKG5hbWUsIHRlbXBsYXRlLCB0YWdzKTtcbiAgfTtcblxuICAvKipcbiAgICogQ29tcGlsZXMgdGhlIGdpdmVuIGFycmF5IG9mIHRva2VucyAodGhlIG91dHB1dCBvZiBhIHBhcnNlKSB0byBhIHJldXNhYmxlXG4gICAqIGZ1bmN0aW9uIHVzaW5nIHRoZSBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLmNvbXBpbGVUb2tlbnMgPSBmdW5jdGlvbiAodG9rZW5zLCB0ZW1wbGF0ZSkge1xuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLmNvbXBpbGVUb2tlbnModG9rZW5zLCB0ZW1wbGF0ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgdGhlIGB0ZW1wbGF0ZWAgd2l0aCB0aGUgZ2l2ZW4gYHZpZXdgIGFuZCBgcGFydGlhbHNgIHVzaW5nIHRoZVxuICAgKiBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLnJlbmRlciA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggMC40LnguXG4gIG11c3RhY2hlLnRvX2h0bWwgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzLCBzZW5kKSB7XG4gICAgdmFyIHJlc3VsdCA9IG11c3RhY2hlLnJlbmRlcih0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VuZCkpIHtcbiAgICAgIHNlbmQocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH07XG5cbn0pKTtcbiIsInZhciBodG1sX3Nhbml0aXplID0gcmVxdWlyZSgnLi9zYW5pdGl6ZXItYnVuZGxlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXykge1xuICAgIGlmICghXykgcmV0dXJuICcnO1xuICAgIHJldHVybiBodG1sX3Nhbml0aXplKF8sIGNsZWFuVXJsLCBjbGVhbklkKTtcbn07XG5cbi8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTI1NTEwN1xuZnVuY3Rpb24gY2xlYW5VcmwodXJsKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGlmICgvXmh0dHBzPy8udGVzdCh1cmwuZ2V0U2NoZW1lKCkpKSByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgaWYgKC9ebWFpbHRvPy8udGVzdCh1cmwuZ2V0U2NoZW1lKCkpKSByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgaWYgKCdkYXRhJyA9PSB1cmwuZ2V0U2NoZW1lKCkgJiYgL15pbWFnZS8udGVzdCh1cmwuZ2V0UGF0aCgpKSkge1xuICAgICAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhbklkKGlkKSB7IHJldHVybiBpZDsgfVxuIiwiXG4vLyBDb3B5cmlnaHQgKEMpIDIwMTAgR29vZ2xlIEluYy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEltcGxlbWVudHMgUkZDIDM5ODYgZm9yIHBhcnNpbmcvZm9ybWF0dGluZyBVUklzLlxuICpcbiAqIEBhdXRob3IgbWlrZXNhbXVlbEBnbWFpbC5jb21cbiAqIFxcQHByb3ZpZGVzIFVSSVxuICogXFxAb3ZlcnJpZGVzIHdpbmRvd1xuICovXG5cbnZhciBVUkkgPSAoZnVuY3Rpb24gKCkge1xuXG4vKipcbiAqIGNyZWF0ZXMgYSB1cmkgZnJvbSB0aGUgc3RyaW5nIGZvcm0uICBUaGUgcGFyc2VyIGlzIHJlbGF4ZWQsIHNvIHNwZWNpYWxcbiAqIGNoYXJhY3RlcnMgdGhhdCBhcmVuJ3QgZXNjYXBlZCBidXQgZG9uJ3QgY2F1c2UgYW1iaWd1aXRpZXMgd2lsbCBub3QgY2F1c2VcbiAqIHBhcnNlIGZhaWx1cmVzLlxuICpcbiAqIEByZXR1cm4ge1VSSXxudWxsfVxuICovXG5mdW5jdGlvbiBwYXJzZSh1cmlTdHIpIHtcbiAgdmFyIG0gPSAoJycgKyB1cmlTdHIpLm1hdGNoKFVSSV9SRV8pO1xuICBpZiAoIW0pIHsgcmV0dXJuIG51bGw7IH1cbiAgcmV0dXJuIG5ldyBVUkkoXG4gICAgICBudWxsSWZBYnNlbnQobVsxXSksXG4gICAgICBudWxsSWZBYnNlbnQobVsyXSksXG4gICAgICBudWxsSWZBYnNlbnQobVszXSksXG4gICAgICBudWxsSWZBYnNlbnQobVs0XSksXG4gICAgICBudWxsSWZBYnNlbnQobVs1XSksXG4gICAgICBudWxsSWZBYnNlbnQobVs2XSksXG4gICAgICBudWxsSWZBYnNlbnQobVs3XSkpO1xufVxuXG5cbi8qKlxuICogY3JlYXRlcyBhIHVyaSBmcm9tIHRoZSBnaXZlbiBwYXJ0cy5cbiAqXG4gKiBAcGFyYW0gc2NoZW1lIHtzdHJpbmd9IGFuIHVuZW5jb2RlZCBzY2hlbWUgc3VjaCBhcyBcImh0dHBcIiBvciBudWxsXG4gKiBAcGFyYW0gY3JlZGVudGlhbHMge3N0cmluZ30gdW5lbmNvZGVkIHVzZXIgY3JlZGVudGlhbHMgb3IgbnVsbFxuICogQHBhcmFtIGRvbWFpbiB7c3RyaW5nfSBhbiB1bmVuY29kZWQgZG9tYWluIG5hbWUgb3IgbnVsbFxuICogQHBhcmFtIHBvcnQge251bWJlcn0gYSBwb3J0IG51bWJlciBpbiBbMSwgMzI3NjhdLlxuICogICAgLTEgaW5kaWNhdGVzIG5vIHBvcnQsIGFzIGRvZXMgbnVsbC5cbiAqIEBwYXJhbSBwYXRoIHtzdHJpbmd9IGFuIHVuZW5jb2RlZCBwYXRoXG4gKiBAcGFyYW0gcXVlcnkge0FycmF5LjxzdHJpbmc+fHN0cmluZ3xudWxsfSBhIGxpc3Qgb2YgdW5lbmNvZGVkIGNnaVxuICogICBwYXJhbWV0ZXJzIHdoZXJlIGV2ZW4gdmFsdWVzIGFyZSBrZXlzIGFuZCBvZGRzIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICogICBvciBhbiB1bmVuY29kZWQgcXVlcnkuXG4gKiBAcGFyYW0gZnJhZ21lbnQge3N0cmluZ30gYW4gdW5lbmNvZGVkIGZyYWdtZW50IHdpdGhvdXQgdGhlIFwiI1wiIG9yIG51bGwuXG4gKiBAcmV0dXJuIHtVUkl9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZShzY2hlbWUsIGNyZWRlbnRpYWxzLCBkb21haW4sIHBvcnQsIHBhdGgsIHF1ZXJ5LCBmcmFnbWVudCkge1xuICB2YXIgdXJpID0gbmV3IFVSSShcbiAgICAgIGVuY29kZUlmRXhpc3RzMihzY2hlbWUsIFVSSV9ESVNBTExPV0VEX0lOX1NDSEVNRV9PUl9DUkVERU5USUFMU18pLFxuICAgICAgZW5jb2RlSWZFeGlzdHMyKFxuICAgICAgICAgIGNyZWRlbnRpYWxzLCBVUklfRElTQUxMT1dFRF9JTl9TQ0hFTUVfT1JfQ1JFREVOVElBTFNfKSxcbiAgICAgIGVuY29kZUlmRXhpc3RzKGRvbWFpbiksXG4gICAgICBwb3J0ID4gMCA/IHBvcnQudG9TdHJpbmcoKSA6IG51bGwsXG4gICAgICBlbmNvZGVJZkV4aXN0czIocGF0aCwgVVJJX0RJU0FMTE9XRURfSU5fUEFUSF8pLFxuICAgICAgbnVsbCxcbiAgICAgIGVuY29kZUlmRXhpc3RzKGZyYWdtZW50KSk7XG4gIGlmIChxdWVyeSkge1xuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHF1ZXJ5KSB7XG4gICAgICB1cmkuc2V0UmF3UXVlcnkocXVlcnkucmVwbGFjZSgvW14/Jj0wLTlBLVphLXpfXFwtfi4lXS9nLCBlbmNvZGVPbmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXJpLnNldEFsbFBhcmFtZXRlcnMocXVlcnkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdXJpO1xufVxuZnVuY3Rpb24gZW5jb2RlSWZFeGlzdHModW5lc2NhcGVkUGFydCkge1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHVuZXNjYXBlZFBhcnQpIHtcbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHVuZXNjYXBlZFBhcnQpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcbi8qKlxuICogaWYgdW5lc2NhcGVkUGFydCBpcyBub24gbnVsbCwgdGhlbiBlc2NhcGVzIGFueSBjaGFyYWN0ZXJzIGluIGl0IHRoYXQgYXJlbid0XG4gKiB2YWxpZCBjaGFyYWN0ZXJzIGluIGEgdXJsIGFuZCBhbHNvIGVzY2FwZXMgYW55IHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0XG4gKiBhcHBlYXIgaW4gZXh0cmEuXG4gKlxuICogQHBhcmFtIHVuZXNjYXBlZFBhcnQge3N0cmluZ31cbiAqIEBwYXJhbSBleHRyYSB7UmVnRXhwfSBhIGNoYXJhY3RlciBzZXQgb2YgY2hhcmFjdGVycyBpbiBbXFwwMS1cXDE3N10uXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gbnVsbCBpZmYgdW5lc2NhcGVkUGFydCA9PSBudWxsLlxuICovXG5mdW5jdGlvbiBlbmNvZGVJZkV4aXN0czIodW5lc2NhcGVkUGFydCwgZXh0cmEpIHtcbiAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB1bmVzY2FwZWRQYXJ0KSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSSh1bmVzY2FwZWRQYXJ0KS5yZXBsYWNlKGV4dHJhLCBlbmNvZGVPbmUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcbi8qKiBjb252ZXJ0cyBhIGNoYXJhY3RlciBpbiBbXFwwMS1cXDE3N10gdG8gaXRzIHVybCBlbmNvZGVkIGVxdWl2YWxlbnQuICovXG5mdW5jdGlvbiBlbmNvZGVPbmUoY2gpIHtcbiAgdmFyIG4gPSBjaC5jaGFyQ29kZUF0KDApO1xuICByZXR1cm4gJyUnICsgJzAxMjM0NTY3ODlBQkNERUYnLmNoYXJBdCgobiA+PiA0KSAmIDB4ZikgK1xuICAgICAgJzAxMjM0NTY3ODlBQkNERUYnLmNoYXJBdChuICYgMHhmKTtcbn1cblxuLyoqXG4gKiB7QHVwZG9jXG4gKiAgJCBub3JtUGF0aCgnZm9vLy4vYmFyJylcbiAqICAjICdmb28vYmFyJ1xuICogICQgbm9ybVBhdGgoJy4vZm9vJylcbiAqICAjICdmb28nXG4gKiAgJCBub3JtUGF0aCgnZm9vLy4nKVxuICogICMgJ2ZvbydcbiAqICAkIG5vcm1QYXRoKCdmb28vL2JhcicpXG4gKiAgIyAnZm9vL2JhcidcbiAqIH1cbiAqL1xuZnVuY3Rpb24gbm9ybVBhdGgocGF0aCkge1xuICByZXR1cm4gcGF0aC5yZXBsYWNlKC8oXnxcXC8pXFwuKD86XFwvfCQpL2csICckMScpLnJlcGxhY2UoL1xcL3syLH0vZywgJy8nKTtcbn1cblxudmFyIFBBUkVOVF9ESVJFQ1RPUllfSEFORExFUiA9IG5ldyBSZWdFeHAoXG4gICAgJydcbiAgICAvLyBBIHBhdGggYnJlYWtcbiAgICArICcoL3xeKSdcbiAgICAvLyBmb2xsb3dlZCBieSBhIG5vbiAuLiBwYXRoIGVsZW1lbnRcbiAgICAvLyAoY2Fubm90IGJlIC4gYmVjYXVzZSBub3JtUGF0aCBpcyB1c2VkIHByaW9yIHRvIHRoaXMgUmVnRXhwKVxuICAgICsgJyg/OlteLi9dW14vXSp8XFxcXC57Mix9KD86W14uL11bXi9dKil8XFxcXC57Myx9W14vXSopJ1xuICAgIC8vIGZvbGxvd2VkIGJ5IC4uIGZvbGxvd2VkIGJ5IGEgcGF0aCBicmVhay5cbiAgICArICcvXFxcXC5cXFxcLig/Oi98JCknKTtcblxudmFyIFBBUkVOVF9ESVJFQ1RPUllfSEFORExFUl9SRSA9IG5ldyBSZWdFeHAoUEFSRU5UX0RJUkVDVE9SWV9IQU5ETEVSKTtcblxudmFyIEVYVFJBX1BBUkVOVF9QQVRIU19SRSA9IC9eKD86XFwuXFwuXFwvKSooPzpcXC5cXC4kKT8vO1xuXG4vKipcbiAqIE5vcm1hbGl6ZXMgaXRzIGlucHV0IHBhdGggYW5kIGNvbGxhcHNlcyBhbGwgLiBhbmQgLi4gc2VxdWVuY2VzIGV4Y2VwdCBmb3JcbiAqIC4uIHNlcXVlbmNlcyB0aGF0IHdvdWxkIHRha2UgaXQgYWJvdmUgdGhlIHJvb3Qgb2YgdGhlIGN1cnJlbnQgcGFyZW50XG4gKiBkaXJlY3RvcnkuXG4gKiB7QHVwZG9jXG4gKiAgJCBjb2xsYXBzZV9kb3RzKCdmb28vLi4vYmFyJylcbiAqICAjICdiYXInXG4gKiAgJCBjb2xsYXBzZV9kb3RzKCdmb28vLi9iYXInKVxuICogICMgJ2Zvby9iYXInXG4gKiAgJCBjb2xsYXBzZV9kb3RzKCdmb28vLi4vYmFyLy4vLi4vLi4vYmF6JylcbiAqICAjICdiYXonXG4gKiAgJCBjb2xsYXBzZV9kb3RzKCcuLi9mb28nKVxuICogICMgJy4uL2ZvbydcbiAqICAkIGNvbGxhcHNlX2RvdHMoJy4uL2ZvbycpLnJlcGxhY2UoRVhUUkFfUEFSRU5UX1BBVEhTX1JFLCAnJylcbiAqICAjICdmb28nXG4gKiB9XG4gKi9cbmZ1bmN0aW9uIGNvbGxhcHNlX2RvdHMocGF0aCkge1xuICBpZiAocGF0aCA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuICB2YXIgcCA9IG5vcm1QYXRoKHBhdGgpO1xuICAvLyBPbmx5IC8uLi8gbGVmdCB0byBmbGF0dGVuXG4gIHZhciByID0gUEFSRU5UX0RJUkVDVE9SWV9IQU5ETEVSX1JFO1xuICAvLyBXZSByZXBsYWNlIHdpdGggJDEgd2hpY2ggbWF0Y2hlcyBhIC8gYmVmb3JlIHRoZSAuLiBiZWNhdXNlIHRoaXNcbiAgLy8gZ3VhcmFudGVlcyB0aGF0OlxuICAvLyAoMSkgd2UgaGF2ZSBhdCBtb3N0IDEgLyBiZXR3ZWVuIHRoZSBhZGphY2VudCBwbGFjZSxcbiAgLy8gKDIpIGFsd2F5cyBoYXZlIGEgc2xhc2ggaWYgdGhlcmUgaXMgYSBwcmVjZWRpbmcgcGF0aCBzZWN0aW9uLCBhbmRcbiAgLy8gKDMpIHdlIG5ldmVyIHR1cm4gYSByZWxhdGl2ZSBwYXRoIGludG8gYW4gYWJzb2x1dGUgcGF0aC5cbiAgZm9yICh2YXIgcTsgKHEgPSBwLnJlcGxhY2UociwgJyQxJykpICE9IHA7IHAgPSBxKSB7fTtcbiAgcmV0dXJuIHA7XG59XG5cbi8qKlxuICogcmVzb2x2ZXMgYSByZWxhdGl2ZSB1cmwgc3RyaW5nIHRvIGEgYmFzZSB1cmkuXG4gKiBAcmV0dXJuIHtVUkl9XG4gKi9cbmZ1bmN0aW9uIHJlc29sdmUoYmFzZVVyaSwgcmVsYXRpdmVVcmkpIHtcbiAgLy8gdGhlcmUgYXJlIHNldmVyYWwga2luZHMgb2YgcmVsYXRpdmUgdXJsczpcbiAgLy8gMS4gLy9mb28gLSByZXBsYWNlcyBldmVyeXRoaW5nIGZyb20gdGhlIGRvbWFpbiBvbi4gIGZvbyBpcyBhIGRvbWFpbiBuYW1lXG4gIC8vIDIuIGZvbyAtIHJlcGxhY2VzIHRoZSBsYXN0IHBhcnQgb2YgdGhlIHBhdGgsIHRoZSB3aG9sZSBxdWVyeSBhbmQgZnJhZ21lbnRcbiAgLy8gMy4gL2ZvbyAtIHJlcGxhY2VzIHRoZSB0aGUgcGF0aCwgdGhlIHF1ZXJ5IGFuZCBmcmFnbWVudFxuICAvLyA0LiA/Zm9vIC0gcmVwbGFjZSB0aGUgcXVlcnkgYW5kIGZyYWdtZW50XG4gIC8vIDUuICNmb28gLSByZXBsYWNlIHRoZSBmcmFnbWVudCBvbmx5XG5cbiAgdmFyIGFic29sdXRlVXJpID0gYmFzZVVyaS5jbG9uZSgpO1xuICAvLyB3ZSBzYXRpc2Z5IHRoZXNlIGNvbmRpdGlvbnMgYnkgbG9va2luZyBmb3IgdGhlIGZpcnN0IHBhcnQgb2YgcmVsYXRpdmVVcmlcbiAgLy8gdGhhdCBpcyBub3QgYmxhbmsgYW5kIGFwcGx5aW5nIGRlZmF1bHRzIHRvIHRoZSByZXN0XG5cbiAgdmFyIG92ZXJyaWRkZW4gPSByZWxhdGl2ZVVyaS5oYXNTY2hlbWUoKTtcblxuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFJhd1NjaGVtZShyZWxhdGl2ZVVyaS5nZXRSYXdTY2hlbWUoKSk7XG4gIH0gZWxzZSB7XG4gICAgb3ZlcnJpZGRlbiA9IHJlbGF0aXZlVXJpLmhhc0NyZWRlbnRpYWxzKCk7XG4gIH1cblxuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFJhd0NyZWRlbnRpYWxzKHJlbGF0aXZlVXJpLmdldFJhd0NyZWRlbnRpYWxzKCkpO1xuICB9IGVsc2Uge1xuICAgIG92ZXJyaWRkZW4gPSByZWxhdGl2ZVVyaS5oYXNEb21haW4oKTtcbiAgfVxuXG4gIGlmIChvdmVycmlkZGVuKSB7XG4gICAgYWJzb2x1dGVVcmkuc2V0UmF3RG9tYWluKHJlbGF0aXZlVXJpLmdldFJhd0RvbWFpbigpKTtcbiAgfSBlbHNlIHtcbiAgICBvdmVycmlkZGVuID0gcmVsYXRpdmVVcmkuaGFzUG9ydCgpO1xuICB9XG5cbiAgdmFyIHJhd1BhdGggPSByZWxhdGl2ZVVyaS5nZXRSYXdQYXRoKCk7XG4gIHZhciBzaW1wbGlmaWVkUGF0aCA9IGNvbGxhcHNlX2RvdHMocmF3UGF0aCk7XG4gIGlmIChvdmVycmlkZGVuKSB7XG4gICAgYWJzb2x1dGVVcmkuc2V0UG9ydChyZWxhdGl2ZVVyaS5nZXRQb3J0KCkpO1xuICAgIHNpbXBsaWZpZWRQYXRoID0gc2ltcGxpZmllZFBhdGhcbiAgICAgICAgJiYgc2ltcGxpZmllZFBhdGgucmVwbGFjZShFWFRSQV9QQVJFTlRfUEFUSFNfUkUsICcnKTtcbiAgfSBlbHNlIHtcbiAgICBvdmVycmlkZGVuID0gISFyYXdQYXRoO1xuICAgIGlmIChvdmVycmlkZGVuKSB7XG4gICAgICAvLyByZXNvbHZlIHBhdGggcHJvcGVybHlcbiAgICAgIGlmIChzaW1wbGlmaWVkUGF0aC5jaGFyQ29kZUF0KDApICE9PSAweDJmIC8qIC8gKi8pIHsgIC8vIHBhdGggaXMgcmVsYXRpdmVcbiAgICAgICAgdmFyIGFic1Jhd1BhdGggPSBjb2xsYXBzZV9kb3RzKGFic29sdXRlVXJpLmdldFJhd1BhdGgoKSB8fCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKEVYVFJBX1BBUkVOVF9QQVRIU19SRSwgJycpO1xuICAgICAgICB2YXIgc2xhc2ggPSBhYnNSYXdQYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICBzaW1wbGlmaWVkUGF0aCA9IGNvbGxhcHNlX2RvdHMoXG4gICAgICAgICAgICAoc2xhc2ggPyBhYnNSYXdQYXRoLnN1YnN0cmluZygwLCBzbGFzaCkgOiAnJylcbiAgICAgICAgICAgICsgY29sbGFwc2VfZG90cyhyYXdQYXRoKSlcbiAgICAgICAgICAgIC5yZXBsYWNlKEVYVFJBX1BBUkVOVF9QQVRIU19SRSwgJycpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzaW1wbGlmaWVkUGF0aCA9IHNpbXBsaWZpZWRQYXRoXG4gICAgICAgICAgJiYgc2ltcGxpZmllZFBhdGgucmVwbGFjZShFWFRSQV9QQVJFTlRfUEFUSFNfUkUsICcnKTtcbiAgICAgIGlmIChzaW1wbGlmaWVkUGF0aCAhPT0gcmF3UGF0aCkge1xuICAgICAgICBhYnNvbHV0ZVVyaS5zZXRSYXdQYXRoKHNpbXBsaWZpZWRQYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFJhd1BhdGgoc2ltcGxpZmllZFBhdGgpO1xuICB9IGVsc2Uge1xuICAgIG92ZXJyaWRkZW4gPSByZWxhdGl2ZVVyaS5oYXNRdWVyeSgpO1xuICB9XG5cbiAgaWYgKG92ZXJyaWRkZW4pIHtcbiAgICBhYnNvbHV0ZVVyaS5zZXRSYXdRdWVyeShyZWxhdGl2ZVVyaS5nZXRSYXdRdWVyeSgpKTtcbiAgfSBlbHNlIHtcbiAgICBvdmVycmlkZGVuID0gcmVsYXRpdmVVcmkuaGFzRnJhZ21lbnQoKTtcbiAgfVxuXG4gIGlmIChvdmVycmlkZGVuKSB7XG4gICAgYWJzb2x1dGVVcmkuc2V0UmF3RnJhZ21lbnQocmVsYXRpdmVVcmkuZ2V0UmF3RnJhZ21lbnQoKSk7XG4gIH1cblxuICByZXR1cm4gYWJzb2x1dGVVcmk7XG59XG5cbi8qKlxuICogYSBtdXRhYmxlIFVSSS5cbiAqXG4gKiBUaGlzIGNsYXNzIGNvbnRhaW5zIHNldHRlcnMgYW5kIGdldHRlcnMgZm9yIHRoZSBwYXJ0cyBvZiB0aGUgVVJJLlxuICogVGhlIDx0dD5nZXRYWVo8L3R0Pi88dHQ+c2V0WFlaPC90dD4gbWV0aG9kcyByZXR1cm4gdGhlIGRlY29kZWQgcGFydCAtLSBzb1xuICogPGNvZGU+dXJpLnBhcnNlKCcvZm9vJTIwYmFyJykuZ2V0UGF0aCgpPC9jb2RlPiB3aWxsIHJldHVybiB0aGUgZGVjb2RlZCBwYXRoLFxuICogPHR0Pi9mb28gYmFyPC90dD4uXG4gKlxuICogPHA+VGhlIHJhdyB2ZXJzaW9ucyBvZiBmaWVsZHMgYXJlIGF2YWlsYWJsZSB0b28uXG4gKiA8Y29kZT51cmkucGFyc2UoJy9mb28lMjBiYXInKS5nZXRSYXdQYXRoKCk8L2NvZGU+IHdpbGwgcmV0dXJuIHRoZSByYXcgcGF0aCxcbiAqIDx0dD4vZm9vJTIwYmFyPC90dD4uICBVc2UgdGhlIHJhdyBzZXR0ZXJzIHdpdGggY2FyZSwgc2luY2VcbiAqIDxjb2RlPlVSSTo6dG9TdHJpbmc8L2NvZGU+IGlzIG5vdCBndWFyYW50ZWVkIHRvIHJldHVybiBhIHZhbGlkIHVybCBpZiBhXG4gKiByYXcgc2V0dGVyIHdhcyB1c2VkLlxuICpcbiAqIDxwPkFsbCBzZXR0ZXJzIHJldHVybiA8dHQ+dGhpczwvdHQ+IGFuZCBzbyBtYXkgYmUgY2hhaW5lZCwgYSBsYVxuICogPGNvZGU+dXJpLnBhcnNlKCcvZm9vJykuc2V0RnJhZ21lbnQoJ3BhcnQnKS50b1N0cmluZygpPC9jb2RlPi5cbiAqXG4gKiA8cD5Zb3Ugc2hvdWxkIG5vdCB1c2UgdGhpcyBjb25zdHJ1Y3RvciBkaXJlY3RseSAtLSBwbGVhc2UgcHJlZmVyIHRoZSBmYWN0b3J5XG4gKiBmdW5jdGlvbnMge0BsaW5rIHVyaS5wYXJzZX0sIHtAbGluayB1cmkuY3JlYXRlfSwge0BsaW5rIHVyaS5yZXNvbHZlfVxuICogaW5zdGVhZC48L3A+XG4gKlxuICogPHA+VGhlIHBhcmFtZXRlcnMgYXJlIGFsbCByYXcgKGFzc3VtZWQgdG8gYmUgcHJvcGVybHkgZXNjYXBlZCkgcGFydHMsIGFuZFxuICogYW55IChidXQgbm90IGFsbCkgbWF5IGJlIG51bGwuICBVbmRlZmluZWQgaXMgbm90IGFsbG93ZWQuPC9wPlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBVUkkoXG4gICAgcmF3U2NoZW1lLFxuICAgIHJhd0NyZWRlbnRpYWxzLCByYXdEb21haW4sIHBvcnQsXG4gICAgcmF3UGF0aCwgcmF3UXVlcnksIHJhd0ZyYWdtZW50KSB7XG4gIHRoaXMuc2NoZW1lXyA9IHJhd1NjaGVtZTtcbiAgdGhpcy5jcmVkZW50aWFsc18gPSByYXdDcmVkZW50aWFscztcbiAgdGhpcy5kb21haW5fID0gcmF3RG9tYWluO1xuICB0aGlzLnBvcnRfID0gcG9ydDtcbiAgdGhpcy5wYXRoXyA9IHJhd1BhdGg7XG4gIHRoaXMucXVlcnlfID0gcmF3UXVlcnk7XG4gIHRoaXMuZnJhZ21lbnRfID0gcmF3RnJhZ21lbnQ7XG4gIC8qKlxuICAgKiBAdHlwZSB7QXJyYXl8bnVsbH1cbiAgICovXG4gIHRoaXMucGFyYW1DYWNoZV8gPSBudWxsO1xufVxuXG4vKiogcmV0dXJucyB0aGUgc3RyaW5nIGZvcm0gb2YgdGhlIHVybC4gKi9cblVSSS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXTtcbiAgaWYgKG51bGwgIT09IHRoaXMuc2NoZW1lXykgeyBvdXQucHVzaCh0aGlzLnNjaGVtZV8sICc6Jyk7IH1cbiAgaWYgKG51bGwgIT09IHRoaXMuZG9tYWluXykge1xuICAgIG91dC5wdXNoKCcvLycpO1xuICAgIGlmIChudWxsICE9PSB0aGlzLmNyZWRlbnRpYWxzXykgeyBvdXQucHVzaCh0aGlzLmNyZWRlbnRpYWxzXywgJ0AnKTsgfVxuICAgIG91dC5wdXNoKHRoaXMuZG9tYWluXyk7XG4gICAgaWYgKG51bGwgIT09IHRoaXMucG9ydF8pIHsgb3V0LnB1c2goJzonLCB0aGlzLnBvcnRfLnRvU3RyaW5nKCkpOyB9XG4gIH1cbiAgaWYgKG51bGwgIT09IHRoaXMucGF0aF8pIHsgb3V0LnB1c2godGhpcy5wYXRoXyk7IH1cbiAgaWYgKG51bGwgIT09IHRoaXMucXVlcnlfKSB7IG91dC5wdXNoKCc/JywgdGhpcy5xdWVyeV8pOyB9XG4gIGlmIChudWxsICE9PSB0aGlzLmZyYWdtZW50XykgeyBvdXQucHVzaCgnIycsIHRoaXMuZnJhZ21lbnRfKTsgfVxuICByZXR1cm4gb3V0LmpvaW4oJycpO1xufTtcblxuVVJJLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBVUkkodGhpcy5zY2hlbWVfLCB0aGlzLmNyZWRlbnRpYWxzXywgdGhpcy5kb21haW5fLCB0aGlzLnBvcnRfLFxuICAgICAgICAgICAgICAgICB0aGlzLnBhdGhfLCB0aGlzLnF1ZXJ5XywgdGhpcy5mcmFnbWVudF8pO1xufTtcblxuVVJJLnByb3RvdHlwZS5nZXRTY2hlbWUgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIEhUTUw1IHNwZWMgZG9lcyBub3QgcmVxdWlyZSB0aGUgc2NoZW1lIHRvIGJlIGxvd2VyY2FzZWQgYnV0XG4gIC8vIGFsbCBjb21tb24gYnJvd3NlcnMgZXhjZXB0IFNhZmFyaSBsb3dlcmNhc2UgdGhlIHNjaGVtZS5cbiAgcmV0dXJuIHRoaXMuc2NoZW1lXyAmJiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5zY2hlbWVfKS50b0xvd2VyQ2FzZSgpO1xufTtcblVSSS5wcm90b3R5cGUuZ2V0UmF3U2NoZW1lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5zY2hlbWVfO1xufTtcblVSSS5wcm90b3R5cGUuc2V0U2NoZW1lID0gZnVuY3Rpb24gKG5ld1NjaGVtZSkge1xuICB0aGlzLnNjaGVtZV8gPSBlbmNvZGVJZkV4aXN0czIoXG4gICAgICBuZXdTY2hlbWUsIFVSSV9ESVNBTExPV0VEX0lOX1NDSEVNRV9PUl9DUkVERU5USUFMU18pO1xuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLnNldFJhd1NjaGVtZSA9IGZ1bmN0aW9uIChuZXdTY2hlbWUpIHtcbiAgdGhpcy5zY2hlbWVfID0gbmV3U2NoZW1lID8gbmV3U2NoZW1lIDogbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNTY2hlbWUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBudWxsICE9PSB0aGlzLnNjaGVtZV87XG59O1xuXG5cblVSSS5wcm90b3R5cGUuZ2V0Q3JlZGVudGlhbHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmNyZWRlbnRpYWxzXyAmJiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5jcmVkZW50aWFsc18pO1xufTtcblVSSS5wcm90b3R5cGUuZ2V0UmF3Q3JlZGVudGlhbHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmNyZWRlbnRpYWxzXztcbn07XG5VUkkucHJvdG90eXBlLnNldENyZWRlbnRpYWxzID0gZnVuY3Rpb24gKG5ld0NyZWRlbnRpYWxzKSB7XG4gIHRoaXMuY3JlZGVudGlhbHNfID0gZW5jb2RlSWZFeGlzdHMyKFxuICAgICAgbmV3Q3JlZGVudGlhbHMsIFVSSV9ESVNBTExPV0VEX0lOX1NDSEVNRV9PUl9DUkVERU5USUFMU18pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UmF3Q3JlZGVudGlhbHMgPSBmdW5jdGlvbiAobmV3Q3JlZGVudGlhbHMpIHtcbiAgdGhpcy5jcmVkZW50aWFsc18gPSBuZXdDcmVkZW50aWFscyA/IG5ld0NyZWRlbnRpYWxzIDogbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNDcmVkZW50aWFscyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG51bGwgIT09IHRoaXMuY3JlZGVudGlhbHNfO1xufTtcblxuXG5VUkkucHJvdG90eXBlLmdldERvbWFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZG9tYWluXyAmJiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5kb21haW5fKTtcbn07XG5VUkkucHJvdG90eXBlLmdldFJhd0RvbWFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZG9tYWluXztcbn07XG5VUkkucHJvdG90eXBlLnNldERvbWFpbiA9IGZ1bmN0aW9uIChuZXdEb21haW4pIHtcbiAgcmV0dXJuIHRoaXMuc2V0UmF3RG9tYWluKG5ld0RvbWFpbiAmJiBlbmNvZGVVUklDb21wb25lbnQobmV3RG9tYWluKSk7XG59O1xuVVJJLnByb3RvdHlwZS5zZXRSYXdEb21haW4gPSBmdW5jdGlvbiAobmV3RG9tYWluKSB7XG4gIHRoaXMuZG9tYWluXyA9IG5ld0RvbWFpbiA/IG5ld0RvbWFpbiA6IG51bGw7XG4gIC8vIE1haW50YWluIHRoZSBpbnZhcmlhbnQgdGhhdCBwYXRocyBtdXN0IHN0YXJ0IHdpdGggYSBzbGFzaCB3aGVuIHRoZSBVUklcbiAgLy8gaXMgbm90IHBhdGgtcmVsYXRpdmUuXG4gIHJldHVybiB0aGlzLnNldFJhd1BhdGgodGhpcy5wYXRoXyk7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNEb21haW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBudWxsICE9PSB0aGlzLmRvbWFpbl87XG59O1xuXG5cblVSSS5wcm90b3R5cGUuZ2V0UG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMucG9ydF8gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMucG9ydF8pO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UG9ydCA9IGZ1bmN0aW9uIChuZXdQb3J0KSB7XG4gIGlmIChuZXdQb3J0KSB7XG4gICAgbmV3UG9ydCA9IE51bWJlcihuZXdQb3J0KTtcbiAgICBpZiAobmV3UG9ydCAhPT0gKG5ld1BvcnQgJiAweGZmZmYpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBwb3J0IG51bWJlciAnICsgbmV3UG9ydCk7XG4gICAgfVxuICAgIHRoaXMucG9ydF8gPSAnJyArIG5ld1BvcnQ7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wb3J0XyA9IG51bGw7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNQb3J0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbnVsbCAhPT0gdGhpcy5wb3J0Xztcbn07XG5cblxuVVJJLnByb3RvdHlwZS5nZXRQYXRoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5wYXRoXyAmJiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5wYXRoXyk7XG59O1xuVVJJLnByb3RvdHlwZS5nZXRSYXdQYXRoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5wYXRoXztcbn07XG5VUkkucHJvdG90eXBlLnNldFBhdGggPSBmdW5jdGlvbiAobmV3UGF0aCkge1xuICByZXR1cm4gdGhpcy5zZXRSYXdQYXRoKGVuY29kZUlmRXhpc3RzMihuZXdQYXRoLCBVUklfRElTQUxMT1dFRF9JTl9QQVRIXykpO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UmF3UGF0aCA9IGZ1bmN0aW9uIChuZXdQYXRoKSB7XG4gIGlmIChuZXdQYXRoKSB7XG4gICAgbmV3UGF0aCA9IFN0cmluZyhuZXdQYXRoKTtcbiAgICB0aGlzLnBhdGhfID0gXG4gICAgICAvLyBQYXRocyBtdXN0IHN0YXJ0IHdpdGggJy8nIHVubGVzcyB0aGlzIGlzIGEgcGF0aC1yZWxhdGl2ZSBVUkwuXG4gICAgICAoIXRoaXMuZG9tYWluXyB8fCAvXlxcLy8udGVzdChuZXdQYXRoKSkgPyBuZXdQYXRoIDogJy8nICsgbmV3UGF0aDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhdGhfID0gbnVsbDtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLmhhc1BhdGggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBudWxsICE9PSB0aGlzLnBhdGhfO1xufTtcblxuXG5VUkkucHJvdG90eXBlLmdldFF1ZXJ5ID0gZnVuY3Rpb24gKCkge1xuICAvLyBGcm9tIGh0dHA6Ly93d3cudzMub3JnL0FkZHJlc3NpbmcvVVJMLzRfVVJJX1JlY29tbWVudGF0aW9ucy5odG1sXG4gIC8vIFdpdGhpbiB0aGUgcXVlcnkgc3RyaW5nLCB0aGUgcGx1cyBzaWduIGlzIHJlc2VydmVkIGFzIHNob3J0aGFuZCBub3RhdGlvblxuICAvLyBmb3IgYSBzcGFjZS5cbiAgcmV0dXJuIHRoaXMucXVlcnlfICYmIGRlY29kZVVSSUNvbXBvbmVudCh0aGlzLnF1ZXJ5XykucmVwbGFjZSgvXFwrL2csICcgJyk7XG59O1xuVVJJLnByb3RvdHlwZS5nZXRSYXdRdWVyeSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMucXVlcnlfO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UXVlcnkgPSBmdW5jdGlvbiAobmV3UXVlcnkpIHtcbiAgdGhpcy5wYXJhbUNhY2hlXyA9IG51bGw7XG4gIHRoaXMucXVlcnlfID0gZW5jb2RlSWZFeGlzdHMobmV3UXVlcnkpO1xuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLnNldFJhd1F1ZXJ5ID0gZnVuY3Rpb24gKG5ld1F1ZXJ5KSB7XG4gIHRoaXMucGFyYW1DYWNoZV8gPSBudWxsO1xuICB0aGlzLnF1ZXJ5XyA9IG5ld1F1ZXJ5ID8gbmV3UXVlcnkgOiBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLmhhc1F1ZXJ5ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbnVsbCAhPT0gdGhpcy5xdWVyeV87XG59O1xuXG4vKipcbiAqIHNldHMgdGhlIHF1ZXJ5IGdpdmVuIGEgbGlzdCBvZiBzdHJpbmdzIG9mIHRoZSBmb3JtXG4gKiBbIGtleTAsIHZhbHVlMCwga2V5MSwgdmFsdWUxLCAuLi4gXS5cbiAqXG4gKiA8cD48Y29kZT51cmkuc2V0QWxsUGFyYW1ldGVycyhbJ2EnLCAnYicsICdjJywgJ2QnXSkuZ2V0UXVlcnkoKTwvY29kZT5cbiAqIHdpbGwgeWllbGQgPGNvZGU+J2E9YiZjPWQnPC9jb2RlPi5cbiAqL1xuVVJJLnByb3RvdHlwZS5zZXRBbGxQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAoIShwYXJhbXMgaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgICAgJiYgKHBhcmFtcyBpbnN0YW5jZW9mIE9iamVjdFxuICAgICAgICAgICAgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHBhcmFtcykgIT09ICdbb2JqZWN0IEFycmF5XScpKSB7XG4gICAgICB2YXIgbmV3UGFyYW1zID0gW107XG4gICAgICB2YXIgaSA9IC0xO1xuICAgICAgZm9yICh2YXIgayBpbiBwYXJhbXMpIHtcbiAgICAgICAgdmFyIHYgPSBwYXJhbXNba107XG4gICAgICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHYpIHtcbiAgICAgICAgICBuZXdQYXJhbXNbKytpXSA9IGs7XG4gICAgICAgICAgbmV3UGFyYW1zWysraV0gPSB2O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwYXJhbXMgPSBuZXdQYXJhbXM7XG4gICAgfVxuICB9XG4gIHRoaXMucGFyYW1DYWNoZV8gPSBudWxsO1xuICB2YXIgcXVlcnlCdWYgPSBbXTtcbiAgdmFyIHNlcGFyYXRvciA9ICcnO1xuICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcmFtcy5sZW5ndGg7KSB7XG4gICAgdmFyIGsgPSBwYXJhbXNbaisrXTtcbiAgICB2YXIgdiA9IHBhcmFtc1tqKytdO1xuICAgIHF1ZXJ5QnVmLnB1c2goc2VwYXJhdG9yLCBlbmNvZGVVUklDb21wb25lbnQoay50b1N0cmluZygpKSk7XG4gICAgc2VwYXJhdG9yID0gJyYnO1xuICAgIGlmICh2KSB7XG4gICAgICBxdWVyeUJ1Zi5wdXNoKCc9JywgZW5jb2RlVVJJQ29tcG9uZW50KHYudG9TdHJpbmcoKSkpO1xuICAgIH1cbiAgfVxuICB0aGlzLnF1ZXJ5XyA9IHF1ZXJ5QnVmLmpvaW4oJycpO1xuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLmNoZWNrUGFyYW1ldGVyQ2FjaGVfID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMucGFyYW1DYWNoZV8pIHtcbiAgICB2YXIgcSA9IHRoaXMucXVlcnlfO1xuICAgIGlmICghcSkge1xuICAgICAgdGhpcy5wYXJhbUNhY2hlXyA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY2dpUGFyYW1zID0gcS5zcGxpdCgvWyZcXD9dLyk7XG4gICAgICB2YXIgb3V0ID0gW107XG4gICAgICB2YXIgayA9IC0xO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjZ2lQYXJhbXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIG0gPSBjZ2lQYXJhbXNbaV0ubWF0Y2goL14oW149XSopKD86PSguKikpPyQvKTtcbiAgICAgICAgLy8gRnJvbSBodHRwOi8vd3d3LnczLm9yZy9BZGRyZXNzaW5nL1VSTC80X1VSSV9SZWNvbW1lbnRhdGlvbnMuaHRtbFxuICAgICAgICAvLyBXaXRoaW4gdGhlIHF1ZXJ5IHN0cmluZywgdGhlIHBsdXMgc2lnbiBpcyByZXNlcnZlZCBhcyBzaG9ydGhhbmRcbiAgICAgICAgLy8gbm90YXRpb24gZm9yIGEgc3BhY2UuXG4gICAgICAgIG91dFsrK2tdID0gZGVjb2RlVVJJQ29tcG9uZW50KG1bMV0pLnJlcGxhY2UoL1xcKy9nLCAnICcpO1xuICAgICAgICBvdXRbKytrXSA9IGRlY29kZVVSSUNvbXBvbmVudChtWzJdIHx8ICcnKS5yZXBsYWNlKC9cXCsvZywgJyAnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFyYW1DYWNoZV8gPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuLyoqXG4gKiBzZXRzIHRoZSB2YWx1ZXMgb2YgdGhlIG5hbWVkIGNnaSBwYXJhbWV0ZXJzLlxuICpcbiAqIDxwPlNvLCA8Y29kZT51cmkucGFyc2UoJ2Zvbz9hPWImYz1kJmU9ZicpLnNldFBhcmFtZXRlclZhbHVlcygnYycsIFsnbmV3J10pXG4gKiA8L2NvZGU+IHlpZWxkcyA8dHQ+Zm9vP2E9YiZjPW5ldyZlPWY8L3R0Pi48L3A+XG4gKlxuICogQHBhcmFtIGtleSB7c3RyaW5nfVxuICogQHBhcmFtIHZhbHVlcyB7QXJyYXkuPHN0cmluZz59IHRoZSBuZXcgdmFsdWVzLiAgSWYgdmFsdWVzIGlzIGEgc2luZ2xlIHN0cmluZ1xuICogICB0aGVuIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyB0aGUgc29sZSB2YWx1ZS5cbiAqL1xuVVJJLnByb3RvdHlwZS5zZXRQYXJhbWV0ZXJWYWx1ZXMgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcbiAgLy8gYmUgbmljZSBhbmQgYXZvaWQgc3VidGxlIGJ1Z3Mgd2hlcmUgW10gb3BlcmF0b3Igb24gc3RyaW5nIHBlcmZvcm1zIGNoYXJBdFxuICAvLyBvbiBzb21lIGJyb3dzZXJzIGFuZCBjcmFzaGVzIG9uIElFXG4gIGlmICh0eXBlb2YgdmFsdWVzID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlcyA9IFsgdmFsdWVzIF07XG4gIH1cblxuICB0aGlzLmNoZWNrUGFyYW1ldGVyQ2FjaGVfKCk7XG4gIHZhciBuZXdWYWx1ZUluZGV4ID0gMDtcbiAgdmFyIHBjID0gdGhpcy5wYXJhbUNhY2hlXztcbiAgdmFyIHBhcmFtcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgayA9IDA7IGkgPCBwYy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGlmIChrZXkgPT09IHBjW2ldKSB7XG4gICAgICBpZiAobmV3VmFsdWVJbmRleCA8IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgcGFyYW1zLnB1c2goa2V5LCB2YWx1ZXNbbmV3VmFsdWVJbmRleCsrXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5wdXNoKHBjW2ldLCBwY1tpICsgMV0pO1xuICAgIH1cbiAgfVxuICB3aGlsZSAobmV3VmFsdWVJbmRleCA8IHZhbHVlcy5sZW5ndGgpIHtcbiAgICBwYXJhbXMucHVzaChrZXksIHZhbHVlc1tuZXdWYWx1ZUluZGV4KytdKTtcbiAgfVxuICB0aGlzLnNldEFsbFBhcmFtZXRlcnMocGFyYW1zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5yZW1vdmVQYXJhbWV0ZXIgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLnNldFBhcmFtZXRlclZhbHVlcyhrZXksIFtdKTtcbn07XG4vKipcbiAqIHJldHVybnMgdGhlIHBhcmFtZXRlcnMgc3BlY2lmaWVkIGluIHRoZSBxdWVyeSBwYXJ0IG9mIHRoZSB1cmkgYXMgYSBsaXN0IG9mXG4gKiBrZXlzIGFuZCB2YWx1ZXMgbGlrZSBbIGtleTAsIHZhbHVlMCwga2V5MSwgdmFsdWUxLCAuLi4gXS5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn1cbiAqL1xuVVJJLnByb3RvdHlwZS5nZXRBbGxQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmNoZWNrUGFyYW1ldGVyQ2FjaGVfKCk7XG4gIHJldHVybiB0aGlzLnBhcmFtQ2FjaGVfLnNsaWNlKDAsIHRoaXMucGFyYW1DYWNoZV8ubGVuZ3RoKTtcbn07XG4vKipcbiAqIHJldHVybnMgdGhlIHZhbHVlPGI+czwvYj4gZm9yIGEgZ2l2ZW4gY2dpIHBhcmFtZXRlciBhcyBhIGxpc3Qgb2YgZGVjb2RlZFxuICogcXVlcnkgcGFyYW1ldGVyIHZhbHVlcy5cbiAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fVxuICovXG5VUkkucHJvdG90eXBlLmdldFBhcmFtZXRlclZhbHVlcyA9IGZ1bmN0aW9uIChwYXJhbU5hbWVVbmVzY2FwZWQpIHtcbiAgdGhpcy5jaGVja1BhcmFtZXRlckNhY2hlXygpO1xuICB2YXIgdmFsdWVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wYXJhbUNhY2hlXy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGlmIChwYXJhbU5hbWVVbmVzY2FwZWQgPT09IHRoaXMucGFyYW1DYWNoZV9baV0pIHtcbiAgICAgIHZhbHVlcy5wdXNoKHRoaXMucGFyYW1DYWNoZV9baSArIDFdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlcztcbn07XG4vKipcbiAqIHJldHVybnMgYSBtYXAgb2YgY2dpIHBhcmFtZXRlciBuYW1lcyB0byAobm9uLWVtcHR5KSBsaXN0cyBvZiB2YWx1ZXMuXG4gKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZyxBcnJheS48c3RyaW5nPj59XG4gKi9cblVSSS5wcm90b3R5cGUuZ2V0UGFyYW1ldGVyTWFwID0gZnVuY3Rpb24gKHBhcmFtTmFtZVVuZXNjYXBlZCkge1xuICB0aGlzLmNoZWNrUGFyYW1ldGVyQ2FjaGVfKCk7XG4gIHZhciBwYXJhbU1hcCA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1DYWNoZV8ubGVuZ3RoOyBpICs9IDIpIHtcbiAgICB2YXIga2V5ID0gdGhpcy5wYXJhbUNhY2hlX1tpKytdLFxuICAgICAgdmFsdWUgPSB0aGlzLnBhcmFtQ2FjaGVfW2krK107XG4gICAgaWYgKCEoa2V5IGluIHBhcmFtTWFwKSkge1xuICAgICAgcGFyYW1NYXBba2V5XSA9IFt2YWx1ZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtTWFwW2tleV0ucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXJhbU1hcDtcbn07XG4vKipcbiAqIHJldHVybnMgdGhlIGZpcnN0IHZhbHVlIGZvciBhIGdpdmVuIGNnaSBwYXJhbWV0ZXIgb3IgbnVsbCBpZiB0aGUgZ2l2ZW5cbiAqIHBhcmFtZXRlciBuYW1lIGRvZXMgbm90IGFwcGVhciBpbiB0aGUgcXVlcnkgc3RyaW5nLlxuICogSWYgdGhlIGdpdmVuIHBhcmFtZXRlciBuYW1lIGRvZXMgYXBwZWFyLCBidXQgaGFzIG5vICc8dHQ+PTwvdHQ+JyBmb2xsb3dpbmdcbiAqIGl0LCB0aGVuIHRoZSBlbXB0eSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZC5cbiAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxuICovXG5VUkkucHJvdG90eXBlLmdldFBhcmFtZXRlclZhbHVlID0gZnVuY3Rpb24gKHBhcmFtTmFtZVVuZXNjYXBlZCkge1xuICB0aGlzLmNoZWNrUGFyYW1ldGVyQ2FjaGVfKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wYXJhbUNhY2hlXy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGlmIChwYXJhbU5hbWVVbmVzY2FwZWQgPT09IHRoaXMucGFyYW1DYWNoZV9baV0pIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcmFtQ2FjaGVfW2kgKyAxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5VUkkucHJvdG90eXBlLmdldEZyYWdtZW50ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5mcmFnbWVudF8gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuZnJhZ21lbnRfKTtcbn07XG5VUkkucHJvdG90eXBlLmdldFJhd0ZyYWdtZW50ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5mcmFnbWVudF87XG59O1xuVVJJLnByb3RvdHlwZS5zZXRGcmFnbWVudCA9IGZ1bmN0aW9uIChuZXdGcmFnbWVudCkge1xuICB0aGlzLmZyYWdtZW50XyA9IG5ld0ZyYWdtZW50ID8gZW5jb2RlVVJJQ29tcG9uZW50KG5ld0ZyYWdtZW50KSA6IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UmF3RnJhZ21lbnQgPSBmdW5jdGlvbiAobmV3RnJhZ21lbnQpIHtcbiAgdGhpcy5mcmFnbWVudF8gPSBuZXdGcmFnbWVudCA/IG5ld0ZyYWdtZW50IDogbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNGcmFnbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG51bGwgIT09IHRoaXMuZnJhZ21lbnRfO1xufTtcblxuZnVuY3Rpb24gbnVsbElmQWJzZW50KG1hdGNoUGFydCkge1xuICByZXR1cm4gKCdzdHJpbmcnID09IHR5cGVvZiBtYXRjaFBhcnQpICYmIChtYXRjaFBhcnQubGVuZ3RoID4gMClcbiAgICAgICAgID8gbWF0Y2hQYXJ0XG4gICAgICAgICA6IG51bGw7XG59XG5cblxuXG5cbi8qKlxuICogYSByZWd1bGFyIGV4cHJlc3Npb24gZm9yIGJyZWFraW5nIGEgVVJJIGludG8gaXRzIGNvbXBvbmVudCBwYXJ0cy5cbiAqXG4gKiA8cD5odHRwOi8vd3d3LmdiaXYuY29tL3Byb3RvY29scy91cmkvcmZjL3JmYzM5ODYuaHRtbCNSRkMyMjM0IHNheXNcbiAqIEFzIHRoZSBcImZpcnN0LW1hdGNoLXdpbnNcIiBhbGdvcml0aG0gaXMgaWRlbnRpY2FsIHRvIHRoZSBcImdyZWVkeVwiXG4gKiBkaXNhbWJpZ3VhdGlvbiBtZXRob2QgdXNlZCBieSBQT1NJWCByZWd1bGFyIGV4cHJlc3Npb25zLCBpdCBpcyBuYXR1cmFsIGFuZFxuICogY29tbW9ucGxhY2UgdG8gdXNlIGEgcmVndWxhciBleHByZXNzaW9uIGZvciBwYXJzaW5nIHRoZSBwb3RlbnRpYWwgZml2ZVxuICogY29tcG9uZW50cyBvZiBhIFVSSSByZWZlcmVuY2UuXG4gKlxuICogPHA+VGhlIGZvbGxvd2luZyBsaW5lIGlzIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gZm9yIGJyZWFraW5nLWRvd24gYVxuICogd2VsbC1mb3JtZWQgVVJJIHJlZmVyZW5jZSBpbnRvIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIDxwcmU+XG4gKiBeKChbXjovPyNdKyk6KT8oLy8oW14vPyNdKikpPyhbXj8jXSopKFxcPyhbXiNdKikpPygjKC4qKSk/XG4gKiAgMTIgICAgICAgICAgICAzICA0ICAgICAgICAgIDUgICAgICAgNiAgNyAgICAgICAgOCA5XG4gKiA8L3ByZT5cbiAqXG4gKiA8cD5UaGUgbnVtYmVycyBpbiB0aGUgc2Vjb25kIGxpbmUgYWJvdmUgYXJlIG9ubHkgdG8gYXNzaXN0IHJlYWRhYmlsaXR5OyB0aGV5XG4gKiBpbmRpY2F0ZSB0aGUgcmVmZXJlbmNlIHBvaW50cyBmb3IgZWFjaCBzdWJleHByZXNzaW9uIChpLmUuLCBlYWNoIHBhaXJlZFxuICogcGFyZW50aGVzaXMpLiBXZSByZWZlciB0byB0aGUgdmFsdWUgbWF0Y2hlZCBmb3Igc3ViZXhwcmVzc2lvbiA8bj4gYXMgJDxuPi5cbiAqIEZvciBleGFtcGxlLCBtYXRjaGluZyB0aGUgYWJvdmUgZXhwcmVzc2lvbiB0b1xuICogPHByZT5cbiAqICAgICBodHRwOi8vd3d3Lmljcy51Y2kuZWR1L3B1Yi9pZXRmL3VyaS8jUmVsYXRlZFxuICogPC9wcmU+XG4gKiByZXN1bHRzIGluIHRoZSBmb2xsb3dpbmcgc3ViZXhwcmVzc2lvbiBtYXRjaGVzOlxuICogPHByZT5cbiAqICAgICQxID0gaHR0cDpcbiAqICAgICQyID0gaHR0cFxuICogICAgJDMgPSAvL3d3dy5pY3MudWNpLmVkdVxuICogICAgJDQgPSB3d3cuaWNzLnVjaS5lZHVcbiAqICAgICQ1ID0gL3B1Yi9pZXRmL3VyaS9cbiAqICAgICQ2ID0gPHVuZGVmaW5lZD5cbiAqICAgICQ3ID0gPHVuZGVmaW5lZD5cbiAqICAgICQ4ID0gI1JlbGF0ZWRcbiAqICAgICQ5ID0gUmVsYXRlZFxuICogPC9wcmU+XG4gKiB3aGVyZSA8dW5kZWZpbmVkPiBpbmRpY2F0ZXMgdGhhdCB0aGUgY29tcG9uZW50IGlzIG5vdCBwcmVzZW50LCBhcyBpcyB0aGVcbiAqIGNhc2UgZm9yIHRoZSBxdWVyeSBjb21wb25lbnQgaW4gdGhlIGFib3ZlIGV4YW1wbGUuIFRoZXJlZm9yZSwgd2UgY2FuXG4gKiBkZXRlcm1pbmUgdGhlIHZhbHVlIG9mIHRoZSBmaXZlIGNvbXBvbmVudHMgYXNcbiAqIDxwcmU+XG4gKiAgICBzY2hlbWUgICAgPSAkMlxuICogICAgYXV0aG9yaXR5ID0gJDRcbiAqICAgIHBhdGggICAgICA9ICQ1XG4gKiAgICBxdWVyeSAgICAgPSAkN1xuICogICAgZnJhZ21lbnQgID0gJDlcbiAqIDwvcHJlPlxuICpcbiAqIDxwPm1zYW11ZWw6IEkgaGF2ZSBtb2RpZmllZCB0aGUgcmVndWxhciBleHByZXNzaW9uIHNsaWdodGx5IHRvIGV4cG9zZSB0aGVcbiAqIGNyZWRlbnRpYWxzLCBkb21haW4sIGFuZCBwb3J0IHNlcGFyYXRlbHkgZnJvbSB0aGUgYXV0aG9yaXR5LlxuICogVGhlIG1vZGlmaWVkIHZlcnNpb24geWllbGRzXG4gKiA8cHJlPlxuICogICAgJDEgPSBodHRwICAgICAgICAgICAgICBzY2hlbWVcbiAqICAgICQyID0gPHVuZGVmaW5lZD4gICAgICAgY3JlZGVudGlhbHMgLVxcXG4gKiAgICAkMyA9IHd3dy5pY3MudWNpLmVkdSAgIGRvbWFpbiAgICAgICB8IGF1dGhvcml0eVxuICogICAgJDQgPSA8dW5kZWZpbmVkPiAgICAgICBwb3J0ICAgICAgICAtL1xuICogICAgJDUgPSAvcHViL2lldGYvdXJpLyAgICBwYXRoXG4gKiAgICAkNiA9IDx1bmRlZmluZWQ+ICAgICAgIHF1ZXJ5IHdpdGhvdXQgP1xuICogICAgJDcgPSBSZWxhdGVkICAgICAgICAgICBmcmFnbWVudCB3aXRob3V0ICNcbiAqIDwvcHJlPlxuICovXG52YXIgVVJJX1JFXyA9IG5ldyBSZWdFeHAoXG4gICAgICBcIl5cIiArXG4gICAgICBcIig/OlwiICtcbiAgICAgICAgXCIoW146Lz8jXSspXCIgKyAgICAgICAgIC8vIHNjaGVtZVxuICAgICAgXCI6KT9cIiArXG4gICAgICBcIig/Oi8vXCIgK1xuICAgICAgICBcIig/OihbXi8/I10qKUApP1wiICsgICAgLy8gY3JlZGVudGlhbHNcbiAgICAgICAgXCIoW14vPyM6QF0qKVwiICsgICAgICAgIC8vIGRvbWFpblxuICAgICAgICBcIig/OjooWzAtOV0rKSk/XCIgKyAgICAgLy8gcG9ydFxuICAgICAgXCIpP1wiICtcbiAgICAgIFwiKFtePyNdKyk/XCIgKyAgICAgICAgICAgIC8vIHBhdGhcbiAgICAgIFwiKD86XFxcXD8oW14jXSopKT9cIiArICAgICAgLy8gcXVlcnlcbiAgICAgIFwiKD86IyguKikpP1wiICsgICAgICAgICAgIC8vIGZyYWdtZW50XG4gICAgICBcIiRcIlxuICAgICAgKTtcblxudmFyIFVSSV9ESVNBTExPV0VEX0lOX1NDSEVNRV9PUl9DUkVERU5USUFMU18gPSAvWyNcXC9cXD9AXS9nO1xudmFyIFVSSV9ESVNBTExPV0VEX0lOX1BBVEhfID0gL1tcXCNcXD9dL2c7XG5cblVSSS5wYXJzZSA9IHBhcnNlO1xuVVJJLmNyZWF0ZSA9IGNyZWF0ZTtcblVSSS5yZXNvbHZlID0gcmVzb2x2ZTtcblVSSS5jb2xsYXBzZV9kb3RzID0gY29sbGFwc2VfZG90czsgIC8vIFZpc2libGUgZm9yIHRlc3RpbmcuXG5cbi8vIGxpZ2h0d2VpZ2h0IHN0cmluZy1iYXNlZCBhcGkgZm9yIGxvYWRNb2R1bGVNYWtlclxuVVJJLnV0aWxzID0ge1xuICBtaW1lVHlwZU9mOiBmdW5jdGlvbiAodXJpKSB7XG4gICAgdmFyIHVyaU9iaiA9IHBhcnNlKHVyaSk7XG4gICAgaWYgKC9cXC5odG1sJC8udGVzdCh1cmlPYmouZ2V0UGF0aCgpKSkge1xuICAgICAgcmV0dXJuICd0ZXh0L2h0bWwnO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnO1xuICAgIH1cbiAgfSxcbiAgcmVzb2x2ZTogZnVuY3Rpb24gKGJhc2UsIHVyaSkge1xuICAgIGlmIChiYXNlKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZShwYXJzZShiYXNlKSwgcGFyc2UodXJpKSkudG9TdHJpbmcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnICsgdXJpO1xuICAgIH1cbiAgfVxufTtcblxuXG5yZXR1cm4gVVJJO1xufSkoKTtcblxuLy8gQ29weXJpZ2h0IEdvb2dsZSBJbmMuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2VuY2UgVmVyc2lvbiAyLjBcbi8vIEF1dG9nZW5lcmF0ZWQgYXQgTW9uIEZlYiAyNSAxMzowNTo0MiBFU1QgMjAxM1xuLy8gQG92ZXJyaWRlcyB3aW5kb3dcbi8vIEBwcm92aWRlcyBodG1sNFxudmFyIGh0bWw0ID0ge307XG5odG1sNC5hdHlwZSA9IHtcbiAgJ05PTkUnOiAwLFxuICAnVVJJJzogMSxcbiAgJ1VSSV9GUkFHTUVOVCc6IDExLFxuICAnU0NSSVBUJzogMixcbiAgJ1NUWUxFJzogMyxcbiAgJ0hUTUwnOiAxMixcbiAgJ0lEJzogNCxcbiAgJ0lEUkVGJzogNSxcbiAgJ0lEUkVGUyc6IDYsXG4gICdHTE9CQUxfTkFNRSc6IDcsXG4gICdMT0NBTF9OQU1FJzogOCxcbiAgJ0NMQVNTRVMnOiA5LFxuICAnRlJBTUVfVEFSR0VUJzogMTAsXG4gICdNRURJQV9RVUVSWSc6IDEzXG59O1xuaHRtbDRbICdhdHlwZScgXSA9IGh0bWw0LmF0eXBlO1xuaHRtbDQuQVRUUklCUyA9IHtcbiAgJyo6OmNsYXNzJzogOSxcbiAgJyo6OmRpcic6IDAsXG4gICcqOjpkcmFnZ2FibGUnOiAwLFxuICAnKjo6aGlkZGVuJzogMCxcbiAgJyo6OmlkJzogNCxcbiAgJyo6OmluZXJ0JzogMCxcbiAgJyo6Oml0ZW1wcm9wJzogMCxcbiAgJyo6Oml0ZW1yZWYnOiA2LFxuICAnKjo6aXRlbXNjb3BlJzogMCxcbiAgJyo6OmxhbmcnOiAwLFxuICAnKjo6b25ibHVyJzogMixcbiAgJyo6Om9uY2hhbmdlJzogMixcbiAgJyo6Om9uY2xpY2snOiAyLFxuICAnKjo6b25kYmxjbGljayc6IDIsXG4gICcqOjpvbmZvY3VzJzogMixcbiAgJyo6Om9ua2V5ZG93bic6IDIsXG4gICcqOjpvbmtleXByZXNzJzogMixcbiAgJyo6Om9ua2V5dXAnOiAyLFxuICAnKjo6b25sb2FkJzogMixcbiAgJyo6Om9ubW91c2Vkb3duJzogMixcbiAgJyo6Om9ubW91c2Vtb3ZlJzogMixcbiAgJyo6Om9ubW91c2VvdXQnOiAyLFxuICAnKjo6b25tb3VzZW92ZXInOiAyLFxuICAnKjo6b25tb3VzZXVwJzogMixcbiAgJyo6Om9ucmVzZXQnOiAyLFxuICAnKjo6b25zY3JvbGwnOiAyLFxuICAnKjo6b25zZWxlY3QnOiAyLFxuICAnKjo6b25zdWJtaXQnOiAyLFxuICAnKjo6b251bmxvYWQnOiAyLFxuICAnKjo6c3BlbGxjaGVjayc6IDAsXG4gICcqOjpzdHlsZSc6IDMsXG4gICcqOjp0aXRsZSc6IDAsXG4gICcqOjp0cmFuc2xhdGUnOiAwLFxuICAnYTo6YWNjZXNza2V5JzogMCxcbiAgJ2E6OmNvb3Jkcyc6IDAsXG4gICdhOjpocmVmJzogMSxcbiAgJ2E6OmhyZWZsYW5nJzogMCxcbiAgJ2E6Om5hbWUnOiA3LFxuICAnYTo6b25ibHVyJzogMixcbiAgJ2E6Om9uZm9jdXMnOiAyLFxuICAnYTo6c2hhcGUnOiAwLFxuICAnYTo6dGFiaW5kZXgnOiAwLFxuICAnYTo6dGFyZ2V0JzogMTAsXG4gICdhOjp0eXBlJzogMCxcbiAgJ2FyZWE6OmFjY2Vzc2tleSc6IDAsXG4gICdhcmVhOjphbHQnOiAwLFxuICAnYXJlYTo6Y29vcmRzJzogMCxcbiAgJ2FyZWE6OmhyZWYnOiAxLFxuICAnYXJlYTo6bm9ocmVmJzogMCxcbiAgJ2FyZWE6Om9uYmx1cic6IDIsXG4gICdhcmVhOjpvbmZvY3VzJzogMixcbiAgJ2FyZWE6OnNoYXBlJzogMCxcbiAgJ2FyZWE6OnRhYmluZGV4JzogMCxcbiAgJ2FyZWE6OnRhcmdldCc6IDEwLFxuICAnYXVkaW86OmNvbnRyb2xzJzogMCxcbiAgJ2F1ZGlvOjpsb29wJzogMCxcbiAgJ2F1ZGlvOjptZWRpYWdyb3VwJzogNSxcbiAgJ2F1ZGlvOjptdXRlZCc6IDAsXG4gICdhdWRpbzo6cHJlbG9hZCc6IDAsXG4gICdiZG86OmRpcic6IDAsXG4gICdibG9ja3F1b3RlOjpjaXRlJzogMSxcbiAgJ2JyOjpjbGVhcic6IDAsXG4gICdidXR0b246OmFjY2Vzc2tleSc6IDAsXG4gICdidXR0b246OmRpc2FibGVkJzogMCxcbiAgJ2J1dHRvbjo6bmFtZSc6IDgsXG4gICdidXR0b246Om9uYmx1cic6IDIsXG4gICdidXR0b246Om9uZm9jdXMnOiAyLFxuICAnYnV0dG9uOjp0YWJpbmRleCc6IDAsXG4gICdidXR0b246OnR5cGUnOiAwLFxuICAnYnV0dG9uOjp2YWx1ZSc6IDAsXG4gICdjYW52YXM6OmhlaWdodCc6IDAsXG4gICdjYW52YXM6OndpZHRoJzogMCxcbiAgJ2NhcHRpb246OmFsaWduJzogMCxcbiAgJ2NvbDo6YWxpZ24nOiAwLFxuICAnY29sOjpjaGFyJzogMCxcbiAgJ2NvbDo6Y2hhcm9mZic6IDAsXG4gICdjb2w6OnNwYW4nOiAwLFxuICAnY29sOjp2YWxpZ24nOiAwLFxuICAnY29sOjp3aWR0aCc6IDAsXG4gICdjb2xncm91cDo6YWxpZ24nOiAwLFxuICAnY29sZ3JvdXA6OmNoYXInOiAwLFxuICAnY29sZ3JvdXA6OmNoYXJvZmYnOiAwLFxuICAnY29sZ3JvdXA6OnNwYW4nOiAwLFxuICAnY29sZ3JvdXA6OnZhbGlnbic6IDAsXG4gICdjb2xncm91cDo6d2lkdGgnOiAwLFxuICAnY29tbWFuZDo6Y2hlY2tlZCc6IDAsXG4gICdjb21tYW5kOjpjb21tYW5kJzogNSxcbiAgJ2NvbW1hbmQ6OmRpc2FibGVkJzogMCxcbiAgJ2NvbW1hbmQ6Omljb24nOiAxLFxuICAnY29tbWFuZDo6bGFiZWwnOiAwLFxuICAnY29tbWFuZDo6cmFkaW9ncm91cCc6IDAsXG4gICdjb21tYW5kOjp0eXBlJzogMCxcbiAgJ2RhdGE6OnZhbHVlJzogMCxcbiAgJ2RlbDo6Y2l0ZSc6IDEsXG4gICdkZWw6OmRhdGV0aW1lJzogMCxcbiAgJ2RldGFpbHM6Om9wZW4nOiAwLFxuICAnZGlyOjpjb21wYWN0JzogMCxcbiAgJ2Rpdjo6YWxpZ24nOiAwLFxuICAnZGw6OmNvbXBhY3QnOiAwLFxuICAnZmllbGRzZXQ6OmRpc2FibGVkJzogMCxcbiAgJ2ZvbnQ6OmNvbG9yJzogMCxcbiAgJ2ZvbnQ6OmZhY2UnOiAwLFxuICAnZm9udDo6c2l6ZSc6IDAsXG4gICdmb3JtOjphY2NlcHQnOiAwLFxuICAnZm9ybTo6YWN0aW9uJzogMSxcbiAgJ2Zvcm06OmF1dG9jb21wbGV0ZSc6IDAsXG4gICdmb3JtOjplbmN0eXBlJzogMCxcbiAgJ2Zvcm06Om1ldGhvZCc6IDAsXG4gICdmb3JtOjpuYW1lJzogNyxcbiAgJ2Zvcm06Om5vdmFsaWRhdGUnOiAwLFxuICAnZm9ybTo6b25yZXNldCc6IDIsXG4gICdmb3JtOjpvbnN1Ym1pdCc6IDIsXG4gICdmb3JtOjp0YXJnZXQnOiAxMCxcbiAgJ2gxOjphbGlnbic6IDAsXG4gICdoMjo6YWxpZ24nOiAwLFxuICAnaDM6OmFsaWduJzogMCxcbiAgJ2g0OjphbGlnbic6IDAsXG4gICdoNTo6YWxpZ24nOiAwLFxuICAnaDY6OmFsaWduJzogMCxcbiAgJ2hyOjphbGlnbic6IDAsXG4gICdocjo6bm9zaGFkZSc6IDAsXG4gICdocjo6c2l6ZSc6IDAsXG4gICdocjo6d2lkdGgnOiAwLFxuICAnaWZyYW1lOjphbGlnbic6IDAsXG4gICdpZnJhbWU6OmZyYW1lYm9yZGVyJzogMCxcbiAgJ2lmcmFtZTo6aGVpZ2h0JzogMCxcbiAgJ2lmcmFtZTo6bWFyZ2luaGVpZ2h0JzogMCxcbiAgJ2lmcmFtZTo6bWFyZ2lud2lkdGgnOiAwLFxuICAnaWZyYW1lOjp3aWR0aCc6IDAsXG4gICdpbWc6OmFsaWduJzogMCxcbiAgJ2ltZzo6YWx0JzogMCxcbiAgJ2ltZzo6Ym9yZGVyJzogMCxcbiAgJ2ltZzo6aGVpZ2h0JzogMCxcbiAgJ2ltZzo6aHNwYWNlJzogMCxcbiAgJ2ltZzo6aXNtYXAnOiAwLFxuICAnaW1nOjpuYW1lJzogNyxcbiAgJ2ltZzo6c3JjJzogMSxcbiAgJ2ltZzo6dXNlbWFwJzogMTEsXG4gICdpbWc6OnZzcGFjZSc6IDAsXG4gICdpbWc6OndpZHRoJzogMCxcbiAgJ2lucHV0OjphY2NlcHQnOiAwLFxuICAnaW5wdXQ6OmFjY2Vzc2tleSc6IDAsXG4gICdpbnB1dDo6YWxpZ24nOiAwLFxuICAnaW5wdXQ6OmFsdCc6IDAsXG4gICdpbnB1dDo6YXV0b2NvbXBsZXRlJzogMCxcbiAgJ2lucHV0OjpjaGVja2VkJzogMCxcbiAgJ2lucHV0OjpkaXNhYmxlZCc6IDAsXG4gICdpbnB1dDo6aW5wdXRtb2RlJzogMCxcbiAgJ2lucHV0Ojppc21hcCc6IDAsXG4gICdpbnB1dDo6bGlzdCc6IDUsXG4gICdpbnB1dDo6bWF4JzogMCxcbiAgJ2lucHV0OjptYXhsZW5ndGgnOiAwLFxuICAnaW5wdXQ6Om1pbic6IDAsXG4gICdpbnB1dDo6bXVsdGlwbGUnOiAwLFxuICAnaW5wdXQ6Om5hbWUnOiA4LFxuICAnaW5wdXQ6Om9uYmx1cic6IDIsXG4gICdpbnB1dDo6b25jaGFuZ2UnOiAyLFxuICAnaW5wdXQ6Om9uZm9jdXMnOiAyLFxuICAnaW5wdXQ6Om9uc2VsZWN0JzogMixcbiAgJ2lucHV0OjpwbGFjZWhvbGRlcic6IDAsXG4gICdpbnB1dDo6cmVhZG9ubHknOiAwLFxuICAnaW5wdXQ6OnJlcXVpcmVkJzogMCxcbiAgJ2lucHV0OjpzaXplJzogMCxcbiAgJ2lucHV0OjpzcmMnOiAxLFxuICAnaW5wdXQ6OnN0ZXAnOiAwLFxuICAnaW5wdXQ6OnRhYmluZGV4JzogMCxcbiAgJ2lucHV0Ojp0eXBlJzogMCxcbiAgJ2lucHV0Ojp1c2VtYXAnOiAxMSxcbiAgJ2lucHV0Ojp2YWx1ZSc6IDAsXG4gICdpbnM6OmNpdGUnOiAxLFxuICAnaW5zOjpkYXRldGltZSc6IDAsXG4gICdsYWJlbDo6YWNjZXNza2V5JzogMCxcbiAgJ2xhYmVsOjpmb3InOiA1LFxuICAnbGFiZWw6Om9uYmx1cic6IDIsXG4gICdsYWJlbDo6b25mb2N1cyc6IDIsXG4gICdsZWdlbmQ6OmFjY2Vzc2tleSc6IDAsXG4gICdsZWdlbmQ6OmFsaWduJzogMCxcbiAgJ2xpOjp0eXBlJzogMCxcbiAgJ2xpOjp2YWx1ZSc6IDAsXG4gICdtYXA6Om5hbWUnOiA3LFxuICAnbWVudTo6Y29tcGFjdCc6IDAsXG4gICdtZW51OjpsYWJlbCc6IDAsXG4gICdtZW51Ojp0eXBlJzogMCxcbiAgJ21ldGVyOjpoaWdoJzogMCxcbiAgJ21ldGVyOjpsb3cnOiAwLFxuICAnbWV0ZXI6Om1heCc6IDAsXG4gICdtZXRlcjo6bWluJzogMCxcbiAgJ21ldGVyOjp2YWx1ZSc6IDAsXG4gICdvbDo6Y29tcGFjdCc6IDAsXG4gICdvbDo6cmV2ZXJzZWQnOiAwLFxuICAnb2w6OnN0YXJ0JzogMCxcbiAgJ29sOjp0eXBlJzogMCxcbiAgJ29wdGdyb3VwOjpkaXNhYmxlZCc6IDAsXG4gICdvcHRncm91cDo6bGFiZWwnOiAwLFxuICAnb3B0aW9uOjpkaXNhYmxlZCc6IDAsXG4gICdvcHRpb246OmxhYmVsJzogMCxcbiAgJ29wdGlvbjo6c2VsZWN0ZWQnOiAwLFxuICAnb3B0aW9uOjp2YWx1ZSc6IDAsXG4gICdvdXRwdXQ6OmZvcic6IDYsXG4gICdvdXRwdXQ6Om5hbWUnOiA4LFxuICAncDo6YWxpZ24nOiAwLFxuICAncHJlOjp3aWR0aCc6IDAsXG4gICdwcm9ncmVzczo6bWF4JzogMCxcbiAgJ3Byb2dyZXNzOjptaW4nOiAwLFxuICAncHJvZ3Jlc3M6OnZhbHVlJzogMCxcbiAgJ3E6OmNpdGUnOiAxLFxuICAnc2VsZWN0OjphdXRvY29tcGxldGUnOiAwLFxuICAnc2VsZWN0OjpkaXNhYmxlZCc6IDAsXG4gICdzZWxlY3Q6Om11bHRpcGxlJzogMCxcbiAgJ3NlbGVjdDo6bmFtZSc6IDgsXG4gICdzZWxlY3Q6Om9uYmx1cic6IDIsXG4gICdzZWxlY3Q6Om9uY2hhbmdlJzogMixcbiAgJ3NlbGVjdDo6b25mb2N1cyc6IDIsXG4gICdzZWxlY3Q6OnJlcXVpcmVkJzogMCxcbiAgJ3NlbGVjdDo6c2l6ZSc6IDAsXG4gICdzZWxlY3Q6OnRhYmluZGV4JzogMCxcbiAgJ3NvdXJjZTo6dHlwZSc6IDAsXG4gICd0YWJsZTo6YWxpZ24nOiAwLFxuICAndGFibGU6OmJnY29sb3InOiAwLFxuICAndGFibGU6OmJvcmRlcic6IDAsXG4gICd0YWJsZTo6Y2VsbHBhZGRpbmcnOiAwLFxuICAndGFibGU6OmNlbGxzcGFjaW5nJzogMCxcbiAgJ3RhYmxlOjpmcmFtZSc6IDAsXG4gICd0YWJsZTo6cnVsZXMnOiAwLFxuICAndGFibGU6OnN1bW1hcnknOiAwLFxuICAndGFibGU6OndpZHRoJzogMCxcbiAgJ3Rib2R5OjphbGlnbic6IDAsXG4gICd0Ym9keTo6Y2hhcic6IDAsXG4gICd0Ym9keTo6Y2hhcm9mZic6IDAsXG4gICd0Ym9keTo6dmFsaWduJzogMCxcbiAgJ3RkOjphYmJyJzogMCxcbiAgJ3RkOjphbGlnbic6IDAsXG4gICd0ZDo6YXhpcyc6IDAsXG4gICd0ZDo6Ymdjb2xvcic6IDAsXG4gICd0ZDo6Y2hhcic6IDAsXG4gICd0ZDo6Y2hhcm9mZic6IDAsXG4gICd0ZDo6Y29sc3Bhbic6IDAsXG4gICd0ZDo6aGVhZGVycyc6IDYsXG4gICd0ZDo6aGVpZ2h0JzogMCxcbiAgJ3RkOjpub3dyYXAnOiAwLFxuICAndGQ6OnJvd3NwYW4nOiAwLFxuICAndGQ6OnNjb3BlJzogMCxcbiAgJ3RkOjp2YWxpZ24nOiAwLFxuICAndGQ6OndpZHRoJzogMCxcbiAgJ3RleHRhcmVhOjphY2Nlc3NrZXknOiAwLFxuICAndGV4dGFyZWE6OmF1dG9jb21wbGV0ZSc6IDAsXG4gICd0ZXh0YXJlYTo6Y29scyc6IDAsXG4gICd0ZXh0YXJlYTo6ZGlzYWJsZWQnOiAwLFxuICAndGV4dGFyZWE6OmlucHV0bW9kZSc6IDAsXG4gICd0ZXh0YXJlYTo6bmFtZSc6IDgsXG4gICd0ZXh0YXJlYTo6b25ibHVyJzogMixcbiAgJ3RleHRhcmVhOjpvbmNoYW5nZSc6IDIsXG4gICd0ZXh0YXJlYTo6b25mb2N1cyc6IDIsXG4gICd0ZXh0YXJlYTo6b25zZWxlY3QnOiAyLFxuICAndGV4dGFyZWE6OnBsYWNlaG9sZGVyJzogMCxcbiAgJ3RleHRhcmVhOjpyZWFkb25seSc6IDAsXG4gICd0ZXh0YXJlYTo6cmVxdWlyZWQnOiAwLFxuICAndGV4dGFyZWE6OnJvd3MnOiAwLFxuICAndGV4dGFyZWE6OnRhYmluZGV4JzogMCxcbiAgJ3RleHRhcmVhOjp3cmFwJzogMCxcbiAgJ3Rmb290OjphbGlnbic6IDAsXG4gICd0Zm9vdDo6Y2hhcic6IDAsXG4gICd0Zm9vdDo6Y2hhcm9mZic6IDAsXG4gICd0Zm9vdDo6dmFsaWduJzogMCxcbiAgJ3RoOjphYmJyJzogMCxcbiAgJ3RoOjphbGlnbic6IDAsXG4gICd0aDo6YXhpcyc6IDAsXG4gICd0aDo6Ymdjb2xvcic6IDAsXG4gICd0aDo6Y2hhcic6IDAsXG4gICd0aDo6Y2hhcm9mZic6IDAsXG4gICd0aDo6Y29sc3Bhbic6IDAsXG4gICd0aDo6aGVhZGVycyc6IDYsXG4gICd0aDo6aGVpZ2h0JzogMCxcbiAgJ3RoOjpub3dyYXAnOiAwLFxuICAndGg6OnJvd3NwYW4nOiAwLFxuICAndGg6OnNjb3BlJzogMCxcbiAgJ3RoOjp2YWxpZ24nOiAwLFxuICAndGg6OndpZHRoJzogMCxcbiAgJ3RoZWFkOjphbGlnbic6IDAsXG4gICd0aGVhZDo6Y2hhcic6IDAsXG4gICd0aGVhZDo6Y2hhcm9mZic6IDAsXG4gICd0aGVhZDo6dmFsaWduJzogMCxcbiAgJ3RyOjphbGlnbic6IDAsXG4gICd0cjo6Ymdjb2xvcic6IDAsXG4gICd0cjo6Y2hhcic6IDAsXG4gICd0cjo6Y2hhcm9mZic6IDAsXG4gICd0cjo6dmFsaWduJzogMCxcbiAgJ3RyYWNrOjpkZWZhdWx0JzogMCxcbiAgJ3RyYWNrOjpraW5kJzogMCxcbiAgJ3RyYWNrOjpsYWJlbCc6IDAsXG4gICd0cmFjazo6c3JjbGFuZyc6IDAsXG4gICd1bDo6Y29tcGFjdCc6IDAsXG4gICd1bDo6dHlwZSc6IDAsXG4gICd2aWRlbzo6Y29udHJvbHMnOiAwLFxuICAndmlkZW86OmhlaWdodCc6IDAsXG4gICd2aWRlbzo6bG9vcCc6IDAsXG4gICd2aWRlbzo6bWVkaWFncm91cCc6IDUsXG4gICd2aWRlbzo6bXV0ZWQnOiAwLFxuICAndmlkZW86OnBvc3Rlcic6IDEsXG4gICd2aWRlbzo6cHJlbG9hZCc6IDAsXG4gICd2aWRlbzo6d2lkdGgnOiAwXG59O1xuaHRtbDRbICdBVFRSSUJTJyBdID0gaHRtbDQuQVRUUklCUztcbmh0bWw0LmVmbGFncyA9IHtcbiAgJ09QVElPTkFMX0VORFRBRyc6IDEsXG4gICdFTVBUWSc6IDIsXG4gICdDREFUQSc6IDQsXG4gICdSQ0RBVEEnOiA4LFxuICAnVU5TQUZFJzogMTYsXG4gICdGT0xEQUJMRSc6IDMyLFxuICAnU0NSSVBUJzogNjQsXG4gICdTVFlMRSc6IDEyOCxcbiAgJ1ZJUlRVQUxJWkVEJzogMjU2XG59O1xuaHRtbDRbICdlZmxhZ3MnIF0gPSBodG1sNC5lZmxhZ3M7XG5odG1sNC5FTEVNRU5UUyA9IHtcbiAgJ2EnOiAwLFxuICAnYWJicic6IDAsXG4gICdhY3JvbnltJzogMCxcbiAgJ2FkZHJlc3MnOiAwLFxuICAnYXBwbGV0JzogMjcyLFxuICAnYXJlYSc6IDIsXG4gICdhcnRpY2xlJzogMCxcbiAgJ2FzaWRlJzogMCxcbiAgJ2F1ZGlvJzogMCxcbiAgJ2InOiAwLFxuICAnYmFzZSc6IDI3NCxcbiAgJ2Jhc2Vmb250JzogMjc0LFxuICAnYmRpJzogMCxcbiAgJ2Jkbyc6IDAsXG4gICdiaWcnOiAwLFxuICAnYmxvY2txdW90ZSc6IDAsXG4gICdib2R5JzogMzA1LFxuICAnYnInOiAyLFxuICAnYnV0dG9uJzogMCxcbiAgJ2NhbnZhcyc6IDAsXG4gICdjYXB0aW9uJzogMCxcbiAgJ2NlbnRlcic6IDAsXG4gICdjaXRlJzogMCxcbiAgJ2NvZGUnOiAwLFxuICAnY29sJzogMixcbiAgJ2NvbGdyb3VwJzogMSxcbiAgJ2NvbW1hbmQnOiAyLFxuICAnZGF0YSc6IDAsXG4gICdkYXRhbGlzdCc6IDAsXG4gICdkZCc6IDEsXG4gICdkZWwnOiAwLFxuICAnZGV0YWlscyc6IDAsXG4gICdkZm4nOiAwLFxuICAnZGlhbG9nJzogMjcyLFxuICAnZGlyJzogMCxcbiAgJ2Rpdic6IDAsXG4gICdkbCc6IDAsXG4gICdkdCc6IDEsXG4gICdlbSc6IDAsXG4gICdmaWVsZHNldCc6IDAsXG4gICdmaWdjYXB0aW9uJzogMCxcbiAgJ2ZpZ3VyZSc6IDAsXG4gICdmb250JzogMCxcbiAgJ2Zvb3Rlcic6IDAsXG4gICdmb3JtJzogMCxcbiAgJ2ZyYW1lJzogMjc0LFxuICAnZnJhbWVzZXQnOiAyNzIsXG4gICdoMSc6IDAsXG4gICdoMic6IDAsXG4gICdoMyc6IDAsXG4gICdoNCc6IDAsXG4gICdoNSc6IDAsXG4gICdoNic6IDAsXG4gICdoZWFkJzogMzA1LFxuICAnaGVhZGVyJzogMCxcbiAgJ2hncm91cCc6IDAsXG4gICdocic6IDIsXG4gICdodG1sJzogMzA1LFxuICAnaSc6IDAsXG4gICdpZnJhbWUnOiA0LFxuICAnaW1nJzogMixcbiAgJ2lucHV0JzogMixcbiAgJ2lucyc6IDAsXG4gICdpc2luZGV4JzogMjc0LFxuICAna2JkJzogMCxcbiAgJ2tleWdlbic6IDI3NCxcbiAgJ2xhYmVsJzogMCxcbiAgJ2xlZ2VuZCc6IDAsXG4gICdsaSc6IDEsXG4gICdsaW5rJzogMjc0LFxuICAnbWFwJzogMCxcbiAgJ21hcmsnOiAwLFxuICAnbWVudSc6IDAsXG4gICdtZXRhJzogMjc0LFxuICAnbWV0ZXInOiAwLFxuICAnbmF2JzogMCxcbiAgJ25vYnInOiAwLFxuICAnbm9lbWJlZCc6IDI3NixcbiAgJ25vZnJhbWVzJzogMjc2LFxuICAnbm9zY3JpcHQnOiAyNzYsXG4gICdvYmplY3QnOiAyNzIsXG4gICdvbCc6IDAsXG4gICdvcHRncm91cCc6IDAsXG4gICdvcHRpb24nOiAxLFxuICAnb3V0cHV0JzogMCxcbiAgJ3AnOiAxLFxuICAncGFyYW0nOiAyNzQsXG4gICdwcmUnOiAwLFxuICAncHJvZ3Jlc3MnOiAwLFxuICAncSc6IDAsXG4gICdzJzogMCxcbiAgJ3NhbXAnOiAwLFxuICAnc2NyaXB0JzogODQsXG4gICdzZWN0aW9uJzogMCxcbiAgJ3NlbGVjdCc6IDAsXG4gICdzbWFsbCc6IDAsXG4gICdzb3VyY2UnOiAyLFxuICAnc3Bhbic6IDAsXG4gICdzdHJpa2UnOiAwLFxuICAnc3Ryb25nJzogMCxcbiAgJ3N0eWxlJzogMTQ4LFxuICAnc3ViJzogMCxcbiAgJ3N1bW1hcnknOiAwLFxuICAnc3VwJzogMCxcbiAgJ3RhYmxlJzogMCxcbiAgJ3Rib2R5JzogMSxcbiAgJ3RkJzogMSxcbiAgJ3RleHRhcmVhJzogOCxcbiAgJ3Rmb290JzogMSxcbiAgJ3RoJzogMSxcbiAgJ3RoZWFkJzogMSxcbiAgJ3RpbWUnOiAwLFxuICAndGl0bGUnOiAyODAsXG4gICd0cic6IDEsXG4gICd0cmFjayc6IDIsXG4gICd0dCc6IDAsXG4gICd1JzogMCxcbiAgJ3VsJzogMCxcbiAgJ3Zhcic6IDAsXG4gICd2aWRlbyc6IDAsXG4gICd3YnInOiAyXG59O1xuaHRtbDRbICdFTEVNRU5UUycgXSA9IGh0bWw0LkVMRU1FTlRTO1xuaHRtbDQuRUxFTUVOVF9ET01fSU5URVJGQUNFUyA9IHtcbiAgJ2EnOiAnSFRNTEFuY2hvckVsZW1lbnQnLFxuICAnYWJicic6ICdIVE1MRWxlbWVudCcsXG4gICdhY3JvbnltJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2FkZHJlc3MnOiAnSFRNTEVsZW1lbnQnLFxuICAnYXBwbGV0JzogJ0hUTUxBcHBsZXRFbGVtZW50JyxcbiAgJ2FyZWEnOiAnSFRNTEFyZWFFbGVtZW50JyxcbiAgJ2FydGljbGUnOiAnSFRNTEVsZW1lbnQnLFxuICAnYXNpZGUnOiAnSFRNTEVsZW1lbnQnLFxuICAnYXVkaW8nOiAnSFRNTEF1ZGlvRWxlbWVudCcsXG4gICdiJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2Jhc2UnOiAnSFRNTEJhc2VFbGVtZW50JyxcbiAgJ2Jhc2Vmb250JzogJ0hUTUxCYXNlRm9udEVsZW1lbnQnLFxuICAnYmRpJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2Jkbyc6ICdIVE1MRWxlbWVudCcsXG4gICdiaWcnOiAnSFRNTEVsZW1lbnQnLFxuICAnYmxvY2txdW90ZSc6ICdIVE1MUXVvdGVFbGVtZW50JyxcbiAgJ2JvZHknOiAnSFRNTEJvZHlFbGVtZW50JyxcbiAgJ2JyJzogJ0hUTUxCUkVsZW1lbnQnLFxuICAnYnV0dG9uJzogJ0hUTUxCdXR0b25FbGVtZW50JyxcbiAgJ2NhbnZhcyc6ICdIVE1MQ2FudmFzRWxlbWVudCcsXG4gICdjYXB0aW9uJzogJ0hUTUxUYWJsZUNhcHRpb25FbGVtZW50JyxcbiAgJ2NlbnRlcic6ICdIVE1MRWxlbWVudCcsXG4gICdjaXRlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2NvZGUnOiAnSFRNTEVsZW1lbnQnLFxuICAnY29sJzogJ0hUTUxUYWJsZUNvbEVsZW1lbnQnLFxuICAnY29sZ3JvdXAnOiAnSFRNTFRhYmxlQ29sRWxlbWVudCcsXG4gICdjb21tYW5kJzogJ0hUTUxDb21tYW5kRWxlbWVudCcsXG4gICdkYXRhJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2RhdGFsaXN0JzogJ0hUTUxEYXRhTGlzdEVsZW1lbnQnLFxuICAnZGQnOiAnSFRNTEVsZW1lbnQnLFxuICAnZGVsJzogJ0hUTUxNb2RFbGVtZW50JyxcbiAgJ2RldGFpbHMnOiAnSFRNTERldGFpbHNFbGVtZW50JyxcbiAgJ2Rmbic6ICdIVE1MRWxlbWVudCcsXG4gICdkaWFsb2cnOiAnSFRNTERpYWxvZ0VsZW1lbnQnLFxuICAnZGlyJzogJ0hUTUxEaXJlY3RvcnlFbGVtZW50JyxcbiAgJ2Rpdic6ICdIVE1MRGl2RWxlbWVudCcsXG4gICdkbCc6ICdIVE1MRExpc3RFbGVtZW50JyxcbiAgJ2R0JzogJ0hUTUxFbGVtZW50JyxcbiAgJ2VtJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2ZpZWxkc2V0JzogJ0hUTUxGaWVsZFNldEVsZW1lbnQnLFxuICAnZmlnY2FwdGlvbic6ICdIVE1MRWxlbWVudCcsXG4gICdmaWd1cmUnOiAnSFRNTEVsZW1lbnQnLFxuICAnZm9udCc6ICdIVE1MRm9udEVsZW1lbnQnLFxuICAnZm9vdGVyJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2Zvcm0nOiAnSFRNTEZvcm1FbGVtZW50JyxcbiAgJ2ZyYW1lJzogJ0hUTUxGcmFtZUVsZW1lbnQnLFxuICAnZnJhbWVzZXQnOiAnSFRNTEZyYW1lU2V0RWxlbWVudCcsXG4gICdoMSc6ICdIVE1MSGVhZGluZ0VsZW1lbnQnLFxuICAnaDInOiAnSFRNTEhlYWRpbmdFbGVtZW50JyxcbiAgJ2gzJzogJ0hUTUxIZWFkaW5nRWxlbWVudCcsXG4gICdoNCc6ICdIVE1MSGVhZGluZ0VsZW1lbnQnLFxuICAnaDUnOiAnSFRNTEhlYWRpbmdFbGVtZW50JyxcbiAgJ2g2JzogJ0hUTUxIZWFkaW5nRWxlbWVudCcsXG4gICdoZWFkJzogJ0hUTUxIZWFkRWxlbWVudCcsXG4gICdoZWFkZXInOiAnSFRNTEVsZW1lbnQnLFxuICAnaGdyb3VwJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2hyJzogJ0hUTUxIUkVsZW1lbnQnLFxuICAnaHRtbCc6ICdIVE1MSHRtbEVsZW1lbnQnLFxuICAnaSc6ICdIVE1MRWxlbWVudCcsXG4gICdpZnJhbWUnOiAnSFRNTElGcmFtZUVsZW1lbnQnLFxuICAnaW1nJzogJ0hUTUxJbWFnZUVsZW1lbnQnLFxuICAnaW5wdXQnOiAnSFRNTElucHV0RWxlbWVudCcsXG4gICdpbnMnOiAnSFRNTE1vZEVsZW1lbnQnLFxuICAnaXNpbmRleCc6ICdIVE1MVW5rbm93bkVsZW1lbnQnLFxuICAna2JkJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2tleWdlbic6ICdIVE1MS2V5Z2VuRWxlbWVudCcsXG4gICdsYWJlbCc6ICdIVE1MTGFiZWxFbGVtZW50JyxcbiAgJ2xlZ2VuZCc6ICdIVE1MTGVnZW5kRWxlbWVudCcsXG4gICdsaSc6ICdIVE1MTElFbGVtZW50JyxcbiAgJ2xpbmsnOiAnSFRNTExpbmtFbGVtZW50JyxcbiAgJ21hcCc6ICdIVE1MTWFwRWxlbWVudCcsXG4gICdtYXJrJzogJ0hUTUxFbGVtZW50JyxcbiAgJ21lbnUnOiAnSFRNTE1lbnVFbGVtZW50JyxcbiAgJ21ldGEnOiAnSFRNTE1ldGFFbGVtZW50JyxcbiAgJ21ldGVyJzogJ0hUTUxNZXRlckVsZW1lbnQnLFxuICAnbmF2JzogJ0hUTUxFbGVtZW50JyxcbiAgJ25vYnInOiAnSFRNTEVsZW1lbnQnLFxuICAnbm9lbWJlZCc6ICdIVE1MRWxlbWVudCcsXG4gICdub2ZyYW1lcyc6ICdIVE1MRWxlbWVudCcsXG4gICdub3NjcmlwdCc6ICdIVE1MRWxlbWVudCcsXG4gICdvYmplY3QnOiAnSFRNTE9iamVjdEVsZW1lbnQnLFxuICAnb2wnOiAnSFRNTE9MaXN0RWxlbWVudCcsXG4gICdvcHRncm91cCc6ICdIVE1MT3B0R3JvdXBFbGVtZW50JyxcbiAgJ29wdGlvbic6ICdIVE1MT3B0aW9uRWxlbWVudCcsXG4gICdvdXRwdXQnOiAnSFRNTE91dHB1dEVsZW1lbnQnLFxuICAncCc6ICdIVE1MUGFyYWdyYXBoRWxlbWVudCcsXG4gICdwYXJhbSc6ICdIVE1MUGFyYW1FbGVtZW50JyxcbiAgJ3ByZSc6ICdIVE1MUHJlRWxlbWVudCcsXG4gICdwcm9ncmVzcyc6ICdIVE1MUHJvZ3Jlc3NFbGVtZW50JyxcbiAgJ3EnOiAnSFRNTFF1b3RlRWxlbWVudCcsXG4gICdzJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3NhbXAnOiAnSFRNTEVsZW1lbnQnLFxuICAnc2NyaXB0JzogJ0hUTUxTY3JpcHRFbGVtZW50JyxcbiAgJ3NlY3Rpb24nOiAnSFRNTEVsZW1lbnQnLFxuICAnc2VsZWN0JzogJ0hUTUxTZWxlY3RFbGVtZW50JyxcbiAgJ3NtYWxsJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3NvdXJjZSc6ICdIVE1MU291cmNlRWxlbWVudCcsXG4gICdzcGFuJzogJ0hUTUxTcGFuRWxlbWVudCcsXG4gICdzdHJpa2UnOiAnSFRNTEVsZW1lbnQnLFxuICAnc3Ryb25nJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3N0eWxlJzogJ0hUTUxTdHlsZUVsZW1lbnQnLFxuICAnc3ViJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3N1bW1hcnknOiAnSFRNTEVsZW1lbnQnLFxuICAnc3VwJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3RhYmxlJzogJ0hUTUxUYWJsZUVsZW1lbnQnLFxuICAndGJvZHknOiAnSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQnLFxuICAndGQnOiAnSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50JyxcbiAgJ3RleHRhcmVhJzogJ0hUTUxUZXh0QXJlYUVsZW1lbnQnLFxuICAndGZvb3QnOiAnSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQnLFxuICAndGgnOiAnSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQnLFxuICAndGhlYWQnOiAnSFRNTFRhYmxlU2VjdGlvbkVsZW1lbnQnLFxuICAndGltZSc6ICdIVE1MVGltZUVsZW1lbnQnLFxuICAndGl0bGUnOiAnSFRNTFRpdGxlRWxlbWVudCcsXG4gICd0cic6ICdIVE1MVGFibGVSb3dFbGVtZW50JyxcbiAgJ3RyYWNrJzogJ0hUTUxUcmFja0VsZW1lbnQnLFxuICAndHQnOiAnSFRNTEVsZW1lbnQnLFxuICAndSc6ICdIVE1MRWxlbWVudCcsXG4gICd1bCc6ICdIVE1MVUxpc3RFbGVtZW50JyxcbiAgJ3Zhcic6ICdIVE1MRWxlbWVudCcsXG4gICd2aWRlbyc6ICdIVE1MVmlkZW9FbGVtZW50JyxcbiAgJ3dicic6ICdIVE1MRWxlbWVudCdcbn07XG5odG1sNFsgJ0VMRU1FTlRfRE9NX0lOVEVSRkFDRVMnIF0gPSBodG1sNC5FTEVNRU5UX0RPTV9JTlRFUkZBQ0VTO1xuaHRtbDQudWVmZmVjdHMgPSB7XG4gICdOT1RfTE9BREVEJzogMCxcbiAgJ1NBTUVfRE9DVU1FTlQnOiAxLFxuICAnTkVXX0RPQ1VNRU5UJzogMlxufTtcbmh0bWw0WyAndWVmZmVjdHMnIF0gPSBodG1sNC51ZWZmZWN0cztcbmh0bWw0LlVSSUVGRkVDVFMgPSB7XG4gICdhOjpocmVmJzogMixcbiAgJ2FyZWE6OmhyZWYnOiAyLFxuICAnYmxvY2txdW90ZTo6Y2l0ZSc6IDAsXG4gICdjb21tYW5kOjppY29uJzogMSxcbiAgJ2RlbDo6Y2l0ZSc6IDAsXG4gICdmb3JtOjphY3Rpb24nOiAyLFxuICAnaW1nOjpzcmMnOiAxLFxuICAnaW5wdXQ6OnNyYyc6IDEsXG4gICdpbnM6OmNpdGUnOiAwLFxuICAncTo6Y2l0ZSc6IDAsXG4gICd2aWRlbzo6cG9zdGVyJzogMVxufTtcbmh0bWw0WyAnVVJJRUZGRUNUUycgXSA9IGh0bWw0LlVSSUVGRkVDVFM7XG5odG1sNC5sdHlwZXMgPSB7XG4gICdVTlNBTkRCT1hFRCc6IDIsXG4gICdTQU5EQk9YRUQnOiAxLFxuICAnREFUQSc6IDBcbn07XG5odG1sNFsgJ2x0eXBlcycgXSA9IGh0bWw0Lmx0eXBlcztcbmh0bWw0LkxPQURFUlRZUEVTID0ge1xuICAnYTo6aHJlZic6IDIsXG4gICdhcmVhOjpocmVmJzogMixcbiAgJ2Jsb2NrcXVvdGU6OmNpdGUnOiAyLFxuICAnY29tbWFuZDo6aWNvbic6IDEsXG4gICdkZWw6OmNpdGUnOiAyLFxuICAnZm9ybTo6YWN0aW9uJzogMixcbiAgJ2ltZzo6c3JjJzogMSxcbiAgJ2lucHV0OjpzcmMnOiAxLFxuICAnaW5zOjpjaXRlJzogMixcbiAgJ3E6OmNpdGUnOiAyLFxuICAndmlkZW86OnBvc3Rlcic6IDFcbn07XG5odG1sNFsgJ0xPQURFUlRZUEVTJyBdID0gaHRtbDQuTE9BREVSVFlQRVM7XG5cbi8vIENvcHlyaWdodCAoQykgMjAwNiBHb29nbGUgSW5jLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8qKlxuICogQGZpbGVvdmVydmlld1xuICogQW4gSFRNTCBzYW5pdGl6ZXIgdGhhdCBjYW4gc2F0aXNmeSBhIHZhcmlldHkgb2Ygc2VjdXJpdHkgcG9saWNpZXMuXG4gKlxuICogPHA+XG4gKiBUaGUgSFRNTCBzYW5pdGl6ZXIgaXMgYnVpbHQgYXJvdW5kIGEgU0FYIHBhcnNlciBhbmQgSFRNTCBlbGVtZW50IGFuZFxuICogYXR0cmlidXRlcyBzY2hlbWFzLlxuICpcbiAqIElmIHRoZSBjc3NwYXJzZXIgaXMgbG9hZGVkLCBpbmxpbmUgc3R5bGVzIGFyZSBzYW5pdGl6ZWQgdXNpbmcgdGhlXG4gKiBjc3MgcHJvcGVydHkgYW5kIHZhbHVlIHNjaGVtYXMuICBFbHNlIHRoZXkgYXJlIHJlbW92ZSBkdXJpbmdcbiAqIHNhbml0aXphdGlvbi5cbiAqXG4gKiBJZiBpdCBleGlzdHMsIHVzZXMgcGFyc2VDc3NEZWNsYXJhdGlvbnMsIHNhbml0aXplQ3NzUHJvcGVydHksICBjc3NTY2hlbWFcbiAqXG4gKiBAYXV0aG9yIG1pa2VzYW11ZWxAZ21haWwuY29tXG4gKiBAYXV0aG9yIGphc3ZpckBnbWFpbC5jb21cbiAqIFxcQHJlcXVpcmVzIGh0bWw0LCBVUklcbiAqIFxcQG92ZXJyaWRlcyB3aW5kb3dcbiAqIFxcQHByb3ZpZGVzIGh0bWwsIGh0bWxfc2FuaXRpemVcbiAqL1xuXG4vLyBUaGUgVHVya2lzaCBpIHNlZW1zIHRvIGJlIGEgbm9uLWlzc3VlLCBidXQgYWJvcnQgaW4gY2FzZSBpdCBpcy5cbmlmICgnSScudG9Mb3dlckNhc2UoKSAhPT0gJ2knKSB7IHRocm93ICdJL2kgcHJvYmxlbSc7IH1cblxuLyoqXG4gKiBcXEBuYW1lc3BhY2VcbiAqL1xudmFyIGh0bWwgPSAoZnVuY3Rpb24oaHRtbDQpIHtcblxuICAvLyBGb3IgY2xvc3VyZSBjb21waWxlclxuICB2YXIgcGFyc2VDc3NEZWNsYXJhdGlvbnMsIHNhbml0aXplQ3NzUHJvcGVydHksIGNzc1NjaGVtYTtcbiAgaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KSB7XG4gICAgcGFyc2VDc3NEZWNsYXJhdGlvbnMgPSB3aW5kb3dbJ3BhcnNlQ3NzRGVjbGFyYXRpb25zJ107XG4gICAgc2FuaXRpemVDc3NQcm9wZXJ0eSA9IHdpbmRvd1snc2FuaXRpemVDc3NQcm9wZXJ0eSddO1xuICAgIGNzc1NjaGVtYSA9IHdpbmRvd1snY3NzU2NoZW1hJ107XG4gIH1cblxuICAvLyBUaGUga2V5cyBvZiB0aGlzIG9iamVjdCBtdXN0IGJlICdxdW90ZWQnIG9yIEpTQ29tcGlsZXIgd2lsbCBtYW5nbGUgdGhlbSFcbiAgLy8gVGhpcyBpcyBhIHBhcnRpYWwgbGlzdCAtLSBsb29rdXBFbnRpdHkoKSB1c2VzIHRoZSBob3N0IGJyb3dzZXIncyBwYXJzZXJcbiAgLy8gKHdoZW4gYXZhaWxhYmxlKSB0byBpbXBsZW1lbnQgZnVsbCBlbnRpdHkgbG9va3VwLlxuICAvLyBOb3RlIHRoYXQgZW50aXRpZXMgYXJlIGluIGdlbmVyYWwgY2FzZS1zZW5zaXRpdmU7IHRoZSB1cHBlcmNhc2Ugb25lcyBhcmVcbiAgLy8gZXhwbGljaXRseSBkZWZpbmVkIGJ5IEhUTUw1IChwcmVzdW1hYmx5IGFzIGNvbXBhdGliaWxpdHkpLlxuICB2YXIgRU5USVRJRVMgPSB7XG4gICAgJ2x0JzogJzwnLFxuICAgICdMVCc6ICc8JyxcbiAgICAnZ3QnOiAnPicsXG4gICAgJ0dUJzogJz4nLFxuICAgICdhbXAnOiAnJicsXG4gICAgJ0FNUCc6ICcmJyxcbiAgICAncXVvdCc6ICdcIicsXG4gICAgJ2Fwb3MnOiAnXFwnJyxcbiAgICAnbmJzcCc6ICdcXDI0MCdcbiAgfTtcblxuICAvLyBQYXR0ZXJucyBmb3IgdHlwZXMgb2YgZW50aXR5L2NoYXJhY3RlciByZWZlcmVuY2UgbmFtZXMuXG4gIHZhciBkZWNpbWFsRXNjYXBlUmUgPSAvXiMoXFxkKykkLztcbiAgdmFyIGhleEVzY2FwZVJlID0gL14jeChbMC05QS1GYS1mXSspJC87XG4gIC8vIGNvbnRhaW5zIGV2ZXJ5IGVudGl0eSBwZXIgaHR0cDovL3d3dy53My5vcmcvVFIvMjAxMS9XRC1odG1sNS0yMDExMDExMy9uYW1lZC1jaGFyYWN0ZXItcmVmZXJlbmNlcy5odG1sXG4gIHZhciBzYWZlRW50aXR5TmFtZVJlID0gL15bQS1aYS16XVtBLXphLXowLTldKyQvO1xuICAvLyBVc2VkIGFzIGEgaG9vayB0byBpbnZva2UgdGhlIGJyb3dzZXIncyBlbnRpdHkgcGFyc2luZy4gPHRleHRhcmVhPiBpcyB1c2VkXG4gIC8vIGJlY2F1c2UgaXRzIGNvbnRlbnQgaXMgcGFyc2VkIGZvciBlbnRpdGllcyBidXQgbm90IHRhZ3MuXG4gIC8vIFRPRE8oa3ByZWlkKTogVGhpcyByZXRyaWV2YWwgaXMgYSBrbHVkZ2UgYW5kIGxlYWRzIHRvIHNpbGVudCBsb3NzIG9mXG4gIC8vIGZ1bmN0aW9uYWxpdHkgaWYgdGhlIGRvY3VtZW50IGlzbid0IGF2YWlsYWJsZS5cbiAgdmFyIGVudGl0eUxvb2t1cEVsZW1lbnQgPVxuICAgICAgKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93ICYmIHdpbmRvd1snZG9jdW1lbnQnXSlcbiAgICAgICAgICA/IHdpbmRvd1snZG9jdW1lbnQnXS5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpIDogbnVsbDtcbiAgLyoqXG4gICAqIERlY29kZXMgYW4gSFRNTCBlbnRpdHkuXG4gICAqXG4gICAqIHtcXEB1cGRvY1xuICAgKiAkIGxvb2t1cEVudGl0eSgnbHQnKVxuICAgKiAjICc8J1xuICAgKiAkIGxvb2t1cEVudGl0eSgnR1QnKVxuICAgKiAjICc+J1xuICAgKiAkIGxvb2t1cEVudGl0eSgnYW1wJylcbiAgICogIyAnJidcbiAgICogJCBsb29rdXBFbnRpdHkoJ25ic3AnKVxuICAgKiAjICdcXHhBMCdcbiAgICogJCBsb29rdXBFbnRpdHkoJ2Fwb3MnKVxuICAgKiAjIFwiJ1wiXG4gICAqICQgbG9va3VwRW50aXR5KCdxdW90JylcbiAgICogIyAnXCInXG4gICAqICQgbG9va3VwRW50aXR5KCcjeGEnKVxuICAgKiAjICdcXG4nXG4gICAqICQgbG9va3VwRW50aXR5KCcjMTAnKVxuICAgKiAjICdcXG4nXG4gICAqICQgbG9va3VwRW50aXR5KCcjeDBhJylcbiAgICogIyAnXFxuJ1xuICAgKiAkIGxvb2t1cEVudGl0eSgnIzAxMCcpXG4gICAqICMgJ1xcbidcbiAgICogJCBsb29rdXBFbnRpdHkoJyN4MDBBJylcbiAgICogIyAnXFxuJ1xuICAgKiAkIGxvb2t1cEVudGl0eSgnUGknKSAgICAgIC8vIEtub3duIGZhaWx1cmVcbiAgICogIyAnXFx1MDNBMCdcbiAgICogJCBsb29rdXBFbnRpdHkoJ3BpJykgICAgICAvLyBLbm93biBmYWlsdXJlXG4gICAqICMgJ1xcdTAzQzAnXG4gICAqIH1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIGNvbnRlbnQgYmV0d2VlbiB0aGUgJyYnIGFuZCB0aGUgJzsnLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGEgc2luZ2xlIHVuaWNvZGUgY29kZS1wb2ludCBhcyBhIHN0cmluZy5cbiAgICovXG4gIGZ1bmN0aW9uIGxvb2t1cEVudGl0eShuYW1lKSB7XG4gICAgLy8gVE9ETzogZW50aXR5IGxvb2t1cCBhcyBzcGVjaWZpZWQgYnkgSFRNTDUgYWN0dWFsbHkgZGVwZW5kcyBvbiB0aGVcbiAgICAvLyBwcmVzZW5jZSBvZiB0aGUgXCI7XCIuXG4gICAgaWYgKEVOVElUSUVTLmhhc093blByb3BlcnR5KG5hbWUpKSB7IHJldHVybiBFTlRJVElFU1tuYW1lXTsgfVxuICAgIHZhciBtID0gbmFtZS5tYXRjaChkZWNpbWFsRXNjYXBlUmUpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChtWzFdLCAxMCkpO1xuICAgIH0gZWxzZSBpZiAoISEobSA9IG5hbWUubWF0Y2goaGV4RXNjYXBlUmUpKSkge1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobVsxXSwgMTYpKTtcbiAgICB9IGVsc2UgaWYgKGVudGl0eUxvb2t1cEVsZW1lbnQgJiYgc2FmZUVudGl0eU5hbWVSZS50ZXN0KG5hbWUpKSB7XG4gICAgICBlbnRpdHlMb29rdXBFbGVtZW50LmlubmVySFRNTCA9ICcmJyArIG5hbWUgKyAnOyc7XG4gICAgICB2YXIgdGV4dCA9IGVudGl0eUxvb2t1cEVsZW1lbnQudGV4dENvbnRlbnQ7XG4gICAgICBFTlRJVElFU1tuYW1lXSA9IHRleHQ7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcmJyArIG5hbWUgKyAnOyc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlT25lRW50aXR5KF8sIG5hbWUpIHtcbiAgICByZXR1cm4gbG9va3VwRW50aXR5KG5hbWUpO1xuICB9XG5cbiAgdmFyIG51bFJlID0gL1xcMC9nO1xuICBmdW5jdGlvbiBzdHJpcE5VTHMocykge1xuICAgIHJldHVybiBzLnJlcGxhY2UobnVsUmUsICcnKTtcbiAgfVxuXG4gIHZhciBFTlRJVFlfUkVfMSA9IC8mKCNbMC05XSt8I1t4WF1bMC05QS1GYS1mXSt8XFx3Kyk7L2c7XG4gIHZhciBFTlRJVFlfUkVfMiA9IC9eKCNbMC05XSt8I1t4WF1bMC05QS1GYS1mXSt8XFx3Kyk7LztcbiAgLyoqXG4gICAqIFRoZSBwbGFpbiB0ZXh0IG9mIGEgY2h1bmsgb2YgSFRNTCBDREFUQSB3aGljaCBwb3NzaWJseSBjb250YWluaW5nLlxuICAgKlxuICAgKiB7XFxAdXBkb2NcbiAgICogJCB1bmVzY2FwZUVudGl0aWVzKCcnKVxuICAgKiAjICcnXG4gICAqICQgdW5lc2NhcGVFbnRpdGllcygnaGVsbG8gV29ybGQhJylcbiAgICogIyAnaGVsbG8gV29ybGQhJ1xuICAgKiAkIHVuZXNjYXBlRW50aXRpZXMoJzEgJmx0OyAyICZhbXA7JkFNUDsgNCAmZ3Q7IDMmIzEwOycpXG4gICAqICMgJzEgPCAyICYmIDQgPiAzXFxuJ1xuICAgKiAkIHVuZXNjYXBlRW50aXRpZXMoJyZsdDsmbHQgPC0gdW5maW5pc2hlZCBlbnRpdHkmZ3Q7JylcbiAgICogIyAnPCZsdCA8LSB1bmZpbmlzaGVkIGVudGl0eT4nXG4gICAqICQgdW5lc2NhcGVFbnRpdGllcygnL2Zvbz9iYXI9YmF6JmNvcHk9dHJ1ZScpICAvLyAmIG9mdGVuIHVuZXNjYXBlZCBpbiBVUkxTXG4gICAqICMgJy9mb28/YmFyPWJheiZjb3B5PXRydWUnXG4gICAqICQgdW5lc2NhcGVFbnRpdGllcygncGk9JnBpOyYjeDNjMDssIFBpPSZQaTtcXHUwM0EwJykgLy8gRklYTUU6IGtub3duIGZhaWx1cmVcbiAgICogIyAncGk9XFx1MDNDMFxcdTAzYzAsIFBpPVxcdTAzQTBcXHUwM0EwJ1xuICAgKiB9XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzIGEgY2h1bmsgb2YgSFRNTCBDREFUQS4gIEl0IG11c3Qgbm90IHN0YXJ0IG9yIGVuZCBpbnNpZGVcbiAgICogICAgIGFuIEhUTUwgZW50aXR5LlxuICAgKi9cbiAgZnVuY3Rpb24gdW5lc2NhcGVFbnRpdGllcyhzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZShFTlRJVFlfUkVfMSwgZGVjb2RlT25lRW50aXR5KTtcbiAgfVxuXG4gIHZhciBhbXBSZSA9IC8mL2c7XG4gIHZhciBsb29zZUFtcFJlID0gLyYoW15hLXojXXwjKD86W14wLTl4XXx4KD86W14wLTlhLWZdfCQpfCQpfCQpL2dpO1xuICB2YXIgbHRSZSA9IC9bPF0vZztcbiAgdmFyIGd0UmUgPSAvPi9nO1xuICB2YXIgcXVvdFJlID0gL1xcXCIvZztcblxuICAvKipcbiAgICogRXNjYXBlcyBIVE1MIHNwZWNpYWwgY2hhcmFjdGVycyBpbiBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgKlxuICAgKiB7XFxAdXBkb2NcbiAgICogJCBlc2NhcGVBdHRyaWIoJycpXG4gICAqICMgJydcbiAgICogJCBlc2NhcGVBdHRyaWIoJ1wiPDwmPT0mPj5cIicpICAvLyBEbyBub3QganVzdCBlc2NhcGUgdGhlIGZpcnN0IG9jY3VycmVuY2UuXG4gICAqICMgJyYjMzQ7Jmx0OyZsdDsmYW1wOyYjNjE7JiM2MTsmYW1wOyZndDsmZ3Q7JiMzNDsnXG4gICAqICQgZXNjYXBlQXR0cmliKCdIZWxsbyA8V29ybGQ+IScpXG4gICAqICMgJ0hlbGxvICZsdDtXb3JsZCZndDshJ1xuICAgKiB9XG4gICAqL1xuICBmdW5jdGlvbiBlc2NhcGVBdHRyaWIocykge1xuICAgIHJldHVybiAoJycgKyBzKS5yZXBsYWNlKGFtcFJlLCAnJmFtcDsnKS5yZXBsYWNlKGx0UmUsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2UoZ3RSZSwgJyZndDsnKS5yZXBsYWNlKHF1b3RSZSwgJyYjMzQ7Jyk7XG4gIH1cblxuICAvKipcbiAgICogRXNjYXBlIGVudGl0aWVzIGluIFJDREFUQSB0aGF0IGNhbiBiZSBlc2NhcGVkIHdpdGhvdXQgY2hhbmdpbmcgdGhlIG1lYW5pbmcuXG4gICAqIHtcXEB1cGRvY1xuICAgKiAkIG5vcm1hbGl6ZVJDRGF0YSgnMSA8IDIgJiZhbXA7IDMgPiA0ICZhbXA7JiA1ICZsdDsgNyY4JylcbiAgICogIyAnMSAmbHQ7IDIgJmFtcDsmYW1wOyAzICZndDsgNCAmYW1wOyZhbXA7IDUgJmx0OyA3JmFtcDs4J1xuICAgKiB9XG4gICAqL1xuICBmdW5jdGlvbiBub3JtYWxpemVSQ0RhdGEocmNkYXRhKSB7XG4gICAgcmV0dXJuIHJjZGF0YVxuICAgICAgICAucmVwbGFjZShsb29zZUFtcFJlLCAnJmFtcDskMScpXG4gICAgICAgIC5yZXBsYWNlKGx0UmUsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2UoZ3RSZSwgJyZndDsnKTtcbiAgfVxuXG4gIC8vIFRPRE8oZmVsaXg4YSk6IHZhbGlkYXRlIHNhbml0aXplciByZWdleHMgYWdhaW5zdCB0aGUgSFRNTDUgZ3JhbW1hciBhdFxuICAvLyBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9zeW50YXguaHRtbFxuICAvLyBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9wYXJzaW5nLmh0bWxcbiAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdG9rZW5pemF0aW9uLmh0bWxcbiAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdHJlZS1jb25zdHJ1Y3Rpb24uaHRtbFxuXG4gIC8vIFdlIGluaXRpYWxseSBzcGxpdCBpbnB1dCBzbyB0aGF0IHBvdGVudGlhbGx5IG1lYW5pbmdmdWwgY2hhcmFjdGVyc1xuICAvLyBsaWtlICc8JyBhbmQgJz4nIGFyZSBzZXBhcmF0ZSB0b2tlbnMsIHVzaW5nIGEgZmFzdCBkdW1iIHByb2Nlc3MgdGhhdFxuICAvLyBpZ25vcmVzIHF1b3RpbmcuICBUaGVuIHdlIHdhbGsgdGhhdCB0b2tlbiBzdHJlYW0sIGFuZCB3aGVuIHdlIHNlZSBhXG4gIC8vICc8JyB0aGF0J3MgdGhlIHN0YXJ0IG9mIGEgdGFnLCB3ZSB1c2UgQVRUUl9SRSB0byBleHRyYWN0IHRhZ1xuICAvLyBhdHRyaWJ1dGVzIGZyb20gdGhlIG5leHQgdG9rZW4uICBUaGF0IHRva2VuIHdpbGwgbmV2ZXIgaGF2ZSBhICc+J1xuICAvLyBjaGFyYWN0ZXIuICBIb3dldmVyLCBpdCBtaWdodCBoYXZlIGFuIHVuYmFsYW5jZWQgcXVvdGUgY2hhcmFjdGVyLCBhbmRcbiAgLy8gd2hlbiB3ZSBzZWUgdGhhdCwgd2UgY29tYmluZSBhZGRpdGlvbmFsIHRva2VucyB0byBiYWxhbmNlIHRoZSBxdW90ZS5cblxuICB2YXIgQVRUUl9SRSA9IG5ldyBSZWdFeHAoXG4gICAgJ15cXFxccyonICtcbiAgICAnKFstLjpcXFxcd10rKScgKyAgICAgICAgICAgICAvLyAxID0gQXR0cmlidXRlIG5hbWVcbiAgICAnKD86JyArIChcbiAgICAgICdcXFxccyooPSlcXFxccyonICsgICAgICAgICAgIC8vIDIgPSBJcyB0aGVyZSBhIHZhbHVlP1xuICAgICAgJygnICsgKCAgICAgICAgICAgICAgICAgICAvLyAzID0gQXR0cmlidXRlIHZhbHVlXG4gICAgICAgIC8vIFRPRE8oZmVsaXg4YSk6IG1heWJlIHVzZSBiYWNrcmVmIHRvIG1hdGNoIHF1b3Rlc1xuICAgICAgICAnKFxcXCIpW15cXFwiXSooXFxcInwkKScgKyAgICAvLyA0LCA1ID0gRG91YmxlLXF1b3RlZCBzdHJpbmdcbiAgICAgICAgJ3wnICtcbiAgICAgICAgJyhcXCcpW15cXCddKihcXCd8JCknICsgICAgLy8gNiwgNyA9IFNpbmdsZS1xdW90ZWQgc3RyaW5nXG4gICAgICAgICd8JyArXG4gICAgICAgIC8vIFBvc2l0aXZlIGxvb2thaGVhZCB0byBwcmV2ZW50IGludGVycHJldGF0aW9uIG9mXG4gICAgICAgIC8vIDxmb28gYT0gYj1jPiBhcyA8Zm9vIGE9J2I9Yyc+XG4gICAgICAgIC8vIFRPRE8oZmVsaXg4YSk6IG1pZ2h0IGJlIGFibGUgdG8gZHJvcCB0aGlzIGNhc2VcbiAgICAgICAgJyg/PVthLXpdWy1cXFxcd10qXFxcXHMqPSknICtcbiAgICAgICAgJ3wnICtcbiAgICAgICAgLy8gVW5xdW90ZWQgdmFsdWUgdGhhdCBpc24ndCBhbiBhdHRyaWJ1dGUgbmFtZVxuICAgICAgICAvLyAoc2luY2Ugd2UgZGlkbid0IG1hdGNoIHRoZSBwb3NpdGl2ZSBsb29rYWhlYWQgYWJvdmUpXG4gICAgICAgICdbXlxcXCJcXCdcXFxcc10qJyApICtcbiAgICAgICcpJyApICtcbiAgICAnKT8nLFxuICAgICdpJyk7XG5cbiAgLy8gZmFsc2Ugb24gSUU8PTgsIHRydWUgb24gbW9zdCBvdGhlciBicm93c2Vyc1xuICB2YXIgc3BsaXRXaWxsQ2FwdHVyZSA9ICgnYSxiJy5zcGxpdCgvKCwpLykubGVuZ3RoID09PSAzKTtcblxuICAvLyBiaXRtYXNrIGZvciB0YWdzIHdpdGggc3BlY2lhbCBwYXJzaW5nLCBsaWtlIDxzY3JpcHQ+IGFuZCA8dGV4dGFyZWE+XG4gIHZhciBFRkxBR1NfVEVYVCA9IGh0bWw0LmVmbGFnc1snQ0RBVEEnXSB8IGh0bWw0LmVmbGFnc1snUkNEQVRBJ107XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgU0FYLWxpa2UgZXZlbnQgaGFuZGxlciwgcHJvZHVjZSBhIGZ1bmN0aW9uIHRoYXQgZmVlZHMgdGhvc2VcbiAgICogZXZlbnRzIGFuZCBhIHBhcmFtZXRlciB0byB0aGUgZXZlbnQgaGFuZGxlci5cbiAgICpcbiAgICogVGhlIGV2ZW50IGhhbmRsZXIgaGFzIHRoZSBmb3JtOntAY29kZVxuICAgKiB7XG4gICAqICAgLy8gTmFtZSBpcyBhbiB1cHBlci1jYXNlIEhUTUwgdGFnIG5hbWUuICBBdHRyaWJzIGlzIGFuIGFycmF5IG9mXG4gICAqICAgLy8gYWx0ZXJuYXRpbmcgdXBwZXItY2FzZSBhdHRyaWJ1dGUgbmFtZXMsIGFuZCBhdHRyaWJ1dGUgdmFsdWVzLiAgVGhlXG4gICAqICAgLy8gYXR0cmlicyBhcnJheSBpcyByZXVzZWQgYnkgdGhlIHBhcnNlci4gIFBhcmFtIGlzIHRoZSB2YWx1ZSBwYXNzZWQgdG9cbiAgICogICAvLyB0aGUgc2F4UGFyc2VyLlxuICAgKiAgIHN0YXJ0VGFnOiBmdW5jdGlvbiAobmFtZSwgYXR0cmlicywgcGFyYW0pIHsgLi4uIH0sXG4gICAqICAgZW5kVGFnOiAgIGZ1bmN0aW9uIChuYW1lLCBwYXJhbSkgeyAuLi4gfSxcbiAgICogICBwY2RhdGE6ICAgZnVuY3Rpb24gKHRleHQsIHBhcmFtKSB7IC4uLiB9LFxuICAgKiAgIHJjZGF0YTogICBmdW5jdGlvbiAodGV4dCwgcGFyYW0pIHsgLi4uIH0sXG4gICAqICAgY2RhdGE6ICAgIGZ1bmN0aW9uICh0ZXh0LCBwYXJhbSkgeyAuLi4gfSxcbiAgICogICBzdGFydERvYzogZnVuY3Rpb24gKHBhcmFtKSB7IC4uLiB9LFxuICAgKiAgIGVuZERvYzogICBmdW5jdGlvbiAocGFyYW0pIHsgLi4uIH1cbiAgICogfX1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGhhbmRsZXIgYSByZWNvcmQgY29udGFpbmluZyBldmVudCBoYW5kbGVycy5cbiAgICogQHJldHVybiB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBjaHVuayBvZiBIVE1MXG4gICAqICAgICBhbmQgYSBwYXJhbWV0ZXIuICBUaGUgcGFyYW1ldGVyIGlzIHBhc3NlZCBvbiB0byB0aGUgaGFuZGxlciBtZXRob2RzLlxuICAgKi9cbiAgZnVuY3Rpb24gbWFrZVNheFBhcnNlcihoYW5kbGVyKSB7XG4gICAgLy8gQWNjZXB0IHF1b3RlZCBvciB1bnF1b3RlZCBrZXlzIChDbG9zdXJlIGNvbXBhdClcbiAgICB2YXIgaGNvcHkgPSB7XG4gICAgICBjZGF0YTogaGFuZGxlci5jZGF0YSB8fCBoYW5kbGVyWydjZGF0YSddLFxuICAgICAgY29tbWVudDogaGFuZGxlci5jb21tZW50IHx8IGhhbmRsZXJbJ2NvbW1lbnQnXSxcbiAgICAgIGVuZERvYzogaGFuZGxlci5lbmREb2MgfHwgaGFuZGxlclsnZW5kRG9jJ10sXG4gICAgICBlbmRUYWc6IGhhbmRsZXIuZW5kVGFnIHx8IGhhbmRsZXJbJ2VuZFRhZyddLFxuICAgICAgcGNkYXRhOiBoYW5kbGVyLnBjZGF0YSB8fCBoYW5kbGVyWydwY2RhdGEnXSxcbiAgICAgIHJjZGF0YTogaGFuZGxlci5yY2RhdGEgfHwgaGFuZGxlclsncmNkYXRhJ10sXG4gICAgICBzdGFydERvYzogaGFuZGxlci5zdGFydERvYyB8fCBoYW5kbGVyWydzdGFydERvYyddLFxuICAgICAgc3RhcnRUYWc6IGhhbmRsZXIuc3RhcnRUYWcgfHwgaGFuZGxlclsnc3RhcnRUYWcnXVxuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGh0bWxUZXh0LCBwYXJhbSkge1xuICAgICAgcmV0dXJuIHBhcnNlKGh0bWxUZXh0LCBoY29weSwgcGFyYW0pO1xuICAgIH07XG4gIH1cblxuICAvLyBQYXJzaW5nIHN0cmF0ZWd5IGlzIHRvIHNwbGl0IGlucHV0IGludG8gcGFydHMgdGhhdCBtaWdodCBiZSBsZXhpY2FsbHlcbiAgLy8gbWVhbmluZ2Z1bCAoZXZlcnkgXCI+XCIgYmVjb21lcyBhIHNlcGFyYXRlIHBhcnQpLCBhbmQgdGhlbiByZWNvbWJpbmVcbiAgLy8gcGFydHMgaWYgd2UgZGlzY292ZXIgdGhleSdyZSBpbiBhIGRpZmZlcmVudCBjb250ZXh0LlxuXG4gIC8vIFRPRE8oZmVsaXg4YSk6IFNpZ25pZmljYW50IHBlcmZvcm1hbmNlIHJlZ3Jlc3Npb25zIGZyb20gLWxlZ2FjeSxcbiAgLy8gdGVzdGVkIG9uXG4gIC8vICAgIENocm9tZSAxOC4wXG4gIC8vICAgIEZpcmVmb3ggMTEuMFxuICAvLyAgICBJRSA2LCA3LCA4LCA5XG4gIC8vICAgIE9wZXJhIDExLjYxXG4gIC8vICAgIFNhZmFyaSA1LjEuM1xuICAvLyBNYW55IG9mIHRoZXNlIGFyZSB1bnVzdWFsIHBhdHRlcm5zIHRoYXQgYXJlIGxpbmVhcmx5IHNsb3dlciBhbmQgc3RpbGxcbiAgLy8gcHJldHR5IGZhc3QgKGVnIDFtcyB0byA1bXMpLCBzbyBub3QgbmVjZXNzYXJpbHkgd29ydGggZml4aW5nLlxuXG4gIC8vIFRPRE8oZmVsaXg4YSk6IFwiPHNjcmlwdD4gJiYgJiYgJiYgLi4uIDxcXC9zY3JpcHQ+XCIgaXMgc2xvd2VyIG9uIGFsbFxuICAvLyBicm93c2Vycy4gIFRoZSBob3RzcG90IGlzIGh0bWxTcGxpdC5cblxuICAvLyBUT0RPKGZlbGl4OGEpOiBcIjxwIHRpdGxlPSc+Pj4+Li4uJz48XFwvcD5cIiBpcyBzbG93ZXIgb24gYWxsIGJyb3dzZXJzLlxuICAvLyBUaGlzIGlzIHBhcnRseSBodG1sU3BsaXQsIGJ1dCB0aGUgaG90c3BvdCBpcyBwYXJzZVRhZ0FuZEF0dHJzLlxuXG4gIC8vIFRPRE8oZmVsaXg4YSk6IFwiPGE+PFxcL2E+PGE+PFxcL2E+Li4uXCIgaXMgc2xvd2VyIG9uIElFOS5cbiAgLy8gXCI8YT4xPFxcL2E+PGE+MTxcXC9hPi4uLlwiIGlzIGZhc3RlciwgXCI8YT48XFwvYT4yPGE+PFxcL2E+Mi4uLlwiIGlzIGZhc3Rlci5cblxuICAvLyBUT0RPKGZlbGl4OGEpOiBcIjxwPHA8cC4uLlwiIGlzIHNsb3dlciBvbiBJRVs2LThdXG5cbiAgdmFyIGNvbnRpbnVhdGlvbk1hcmtlciA9IHt9O1xuICBmdW5jdGlvbiBwYXJzZShodG1sVGV4dCwgaGFuZGxlciwgcGFyYW0pIHtcbiAgICB2YXIgbSwgcCwgdGFnTmFtZTtcbiAgICB2YXIgcGFydHMgPSBodG1sU3BsaXQoaHRtbFRleHQpO1xuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgIG5vTW9yZUdUOiBmYWxzZSxcbiAgICAgIG5vTW9yZUVuZENvbW1lbnRzOiBmYWxzZVxuICAgIH07XG4gICAgcGFyc2VDUFMoaGFuZGxlciwgcGFydHMsIDAsIHN0YXRlLCBwYXJhbSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgaW5pdGlhbCwgc3RhdGUsIHBhcmFtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHBhcnNlQ1BTKGgsIHBhcnRzLCBpbml0aWFsLCBzdGF0ZSwgcGFyYW0pO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUNQUyhoLCBwYXJ0cywgaW5pdGlhbCwgc3RhdGUsIHBhcmFtKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChoLnN0YXJ0RG9jICYmIGluaXRpYWwgPT0gMCkgeyBoLnN0YXJ0RG9jKHBhcmFtKTsgfVxuICAgICAgdmFyIG0sIHAsIHRhZ05hbWU7XG4gICAgICBmb3IgKHZhciBwb3MgPSBpbml0aWFsLCBlbmQgPSBwYXJ0cy5sZW5ndGg7IHBvcyA8IGVuZDspIHtcbiAgICAgICAgdmFyIGN1cnJlbnQgPSBwYXJ0c1twb3MrK107XG4gICAgICAgIHZhciBuZXh0ID0gcGFydHNbcG9zXTtcbiAgICAgICAgc3dpdGNoIChjdXJyZW50KSB7XG4gICAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgIGlmIChFTlRJVFlfUkVfMi50ZXN0KG5leHQpKSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgICAgaC5wY2RhdGEoJyYnICsgbmV4dCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHsgaC5wY2RhdGEoXCImYW1wO1wiLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPFxcLyc6XG4gICAgICAgICAgaWYgKG0gPSAvXihbLVxcdzpdKylbXlxcJ1xcXCJdKi8uZXhlYyhuZXh0KSkge1xuICAgICAgICAgICAgaWYgKG1bMF0ubGVuZ3RoID09PSBuZXh0Lmxlbmd0aCAmJiBwYXJ0c1twb3MgKyAxXSA9PT0gJz4nKSB7XG4gICAgICAgICAgICAgIC8vIGZhc3QgY2FzZSwgbm8gYXR0cmlidXRlIHBhcnNpbmcgbmVlZGVkXG4gICAgICAgICAgICAgIHBvcyArPSAyO1xuICAgICAgICAgICAgICB0YWdOYW1lID0gbVsxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBpZiAoaC5lbmRUYWcpIHtcbiAgICAgICAgICAgICAgICBoLmVuZFRhZyh0YWdOYW1lLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIHNsb3cgY2FzZSwgbmVlZCB0byBwYXJzZSBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgIC8vIFRPRE8oZmVsaXg4YSk6IGRvIHdlIHJlYWxseSBjYXJlIGFib3V0IG1pc3BhcnNpbmcgdGhpcz9cbiAgICAgICAgICAgICAgcG9zID0gcGFyc2VFbmRUYWcoXG4gICAgICAgICAgICAgICAgcGFydHMsIHBvcywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgICAgaC5wY2RhdGEoJyZsdDsvJywgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzwnOlxuICAgICAgICAgIGlmIChtID0gL14oWy1cXHc6XSspXFxzKlxcLz8vLmV4ZWMobmV4dCkpIHtcbiAgICAgICAgICAgIGlmIChtWzBdLmxlbmd0aCA9PT0gbmV4dC5sZW5ndGggJiYgcGFydHNbcG9zICsgMV0gPT09ICc+Jykge1xuICAgICAgICAgICAgICAvLyBmYXN0IGNhc2UsIG5vIGF0dHJpYnV0ZSBwYXJzaW5nIG5lZWRlZFxuICAgICAgICAgICAgICBwb3MgKz0gMjtcbiAgICAgICAgICAgICAgdGFnTmFtZSA9IG1bMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgaWYgKGguc3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICBoLnN0YXJ0VGFnKHRhZ05hbWUsIFtdLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gdGFncyBsaWtlIDxzY3JpcHQ+IGFuZCA8dGV4dGFyZWE+IGhhdmUgc3BlY2lhbCBwYXJzaW5nXG4gICAgICAgICAgICAgIHZhciBlZmxhZ3MgPSBodG1sNC5FTEVNRU5UU1t0YWdOYW1lXTtcbiAgICAgICAgICAgICAgaWYgKGVmbGFncyAmIEVGTEFHU19URVhUKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhZyA9IHsgbmFtZTogdGFnTmFtZSwgbmV4dDogcG9zLCBlZmxhZ3M6IGVmbGFncyB9O1xuICAgICAgICAgICAgICAgIHBvcyA9IHBhcnNlVGV4dChcbiAgICAgICAgICAgICAgICAgIHBhcnRzLCB0YWcsIGgsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsIHN0YXRlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gc2xvdyBjYXNlLCBuZWVkIHRvIHBhcnNlIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgcG9zID0gcGFyc2VTdGFydFRhZyhcbiAgICAgICAgICAgICAgICBwYXJ0cywgcG9zLCBoLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLCBzdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChoLnBjZGF0YSkge1xuICAgICAgICAgICAgICBoLnBjZGF0YSgnJmx0OycsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc8XFwhLS0nOlxuICAgICAgICAgIC8vIFRoZSBwYXRob2xvZ2ljYWwgY2FzZSBpcyBuIGNvcGllcyBvZiAnPFxcIS0tJyB3aXRob3V0ICctLT4nLCBhbmRcbiAgICAgICAgICAvLyByZXBlYXRlZCBmYWlsdXJlIHRvIGZpbmQgJy0tPicgaXMgcXVhZHJhdGljLiAgV2UgYXZvaWQgdGhhdCBieVxuICAgICAgICAgIC8vIHJlbWVtYmVyaW5nIHdoZW4gc2VhcmNoIGZvciAnLS0+JyBmYWlscy5cbiAgICAgICAgICBpZiAoIXN0YXRlLm5vTW9yZUVuZENvbW1lbnRzKSB7XG4gICAgICAgICAgICAvLyBBIGNvbW1lbnQgPFxcIS0teC0tPiBpcyBzcGxpdCBpbnRvIHRocmVlIHRva2VuczpcbiAgICAgICAgICAgIC8vICAgJzxcXCEtLScsICd4LS0nLCAnPidcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gZmluZCB0aGUgbmV4dCAnPicgdG9rZW4gdGhhdCBoYXMgYSBwcmVjZWRpbmcgJy0tJy5cbiAgICAgICAgICAgIC8vIHBvcyBpcyBhdCB0aGUgJ3gtLScuXG4gICAgICAgICAgICBmb3IgKHAgPSBwb3MgKyAxOyBwIDwgZW5kOyBwKyspIHtcbiAgICAgICAgICAgICAgaWYgKHBhcnRzW3BdID09PSAnPicgJiYgLy0tJC8udGVzdChwYXJ0c1twIC0gMV0pKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocCA8IGVuZCkge1xuICAgICAgICAgICAgICBpZiAoaC5jb21tZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbW1lbnQgPSBwYXJ0cy5zbGljZShwb3MsIHApLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIGguY29tbWVudChcbiAgICAgICAgICAgICAgICAgIGNvbW1lbnQuc3Vic3RyKDAsIGNvbW1lbnQubGVuZ3RoIC0gMiksIHBhcmFtLFxuICAgICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHAgKyAxLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwb3MgPSBwICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0YXRlLm5vTW9yZUVuZENvbW1lbnRzID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXRlLm5vTW9yZUVuZENvbW1lbnRzKSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgICAgaC5wY2RhdGEoJyZsdDshLS0nLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPFxcISc6XG4gICAgICAgICAgaWYgKCEvXlxcdy8udGVzdChuZXh0KSkge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgIGgucGNkYXRhKCcmbHQ7IScsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNpbWlsYXIgdG8gbm9Nb3JlRW5kQ29tbWVudCBsb2dpY1xuICAgICAgICAgICAgaWYgKCFzdGF0ZS5ub01vcmVHVCkge1xuICAgICAgICAgICAgICBmb3IgKHAgPSBwb3MgKyAxOyBwIDwgZW5kOyBwKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocGFydHNbcF0gPT09ICc+JykgeyBicmVhazsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChwIDwgZW5kKSB7XG4gICAgICAgICAgICAgICAgcG9zID0gcCArIDE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGUubm9Nb3JlR1QgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RhdGUubm9Nb3JlR1QpIHtcbiAgICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgICAgaC5wY2RhdGEoJyZsdDshJywgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc8Pyc6XG4gICAgICAgICAgLy8gc2ltaWxhciB0byBub01vcmVFbmRDb21tZW50IGxvZ2ljXG4gICAgICAgICAgaWYgKCFzdGF0ZS5ub01vcmVHVCkge1xuICAgICAgICAgICAgZm9yIChwID0gcG9zICsgMTsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICAgICAgICAgIGlmIChwYXJ0c1twXSA9PT0gJz4nKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocCA8IGVuZCkge1xuICAgICAgICAgICAgICBwb3MgPSBwICsgMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0YXRlLm5vTW9yZUdUID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXRlLm5vTW9yZUdUKSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgICAgaC5wY2RhdGEoJyZsdDs/JywgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgIGlmIChoLnBjZGF0YSkge1xuICAgICAgICAgICAgaC5wY2RhdGEoXCImZ3Q7XCIsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnJzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgIGgucGNkYXRhKGN1cnJlbnQsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGguZW5kRG9jKSB7IGguZW5kRG9jKHBhcmFtKTsgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlICE9PSBjb250aW51YXRpb25NYXJrZXIpIHsgdGhyb3cgZTsgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFNwbGl0IHN0ciBpbnRvIHBhcnRzIGZvciB0aGUgaHRtbCBwYXJzZXIuXG4gIGZ1bmN0aW9uIGh0bWxTcGxpdChzdHIpIHtcbiAgICAvLyBjYW4ndCBob2lzdCB0aGlzIG91dCBvZiB0aGUgZnVuY3Rpb24gYmVjYXVzZSBvZiB0aGUgcmUuZXhlYyBsb29wLlxuICAgIHZhciByZSA9IC8oPFxcL3w8XFwhLS18PFshP118WyY8Pl0pL2c7XG4gICAgc3RyICs9ICcnO1xuICAgIGlmIChzcGxpdFdpbGxDYXB0dXJlKSB7XG4gICAgICByZXR1cm4gc3RyLnNwbGl0KHJlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHBhcnRzID0gW107XG4gICAgICB2YXIgbGFzdFBvcyA9IDA7XG4gICAgICB2YXIgbTtcbiAgICAgIHdoaWxlICgobSA9IHJlLmV4ZWMoc3RyKSkgIT09IG51bGwpIHtcbiAgICAgICAgcGFydHMucHVzaChzdHIuc3Vic3RyaW5nKGxhc3RQb3MsIG0uaW5kZXgpKTtcbiAgICAgICAgcGFydHMucHVzaChtWzBdKTtcbiAgICAgICAgbGFzdFBvcyA9IG0uaW5kZXggKyBtWzBdLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHBhcnRzLnB1c2goc3RyLnN1YnN0cmluZyhsYXN0UG9zKSk7XG4gICAgICByZXR1cm4gcGFydHM7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VFbmRUYWcocGFydHMsIHBvcywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpIHtcbiAgICB2YXIgdGFnID0gcGFyc2VUYWdBbmRBdHRycyhwYXJ0cywgcG9zKTtcbiAgICAvLyBkcm9wIHVuY2xvc2VkIHRhZ3NcbiAgICBpZiAoIXRhZykgeyByZXR1cm4gcGFydHMubGVuZ3RoOyB9XG4gICAgaWYgKGguZW5kVGFnKSB7XG4gICAgICBoLmVuZFRhZyh0YWcubmFtZSwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgfVxuICAgIHJldHVybiB0YWcubmV4dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlU3RhcnRUYWcocGFydHMsIHBvcywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpIHtcbiAgICB2YXIgdGFnID0gcGFyc2VUYWdBbmRBdHRycyhwYXJ0cywgcG9zKTtcbiAgICAvLyBkcm9wIHVuY2xvc2VkIHRhZ3NcbiAgICBpZiAoIXRhZykgeyByZXR1cm4gcGFydHMubGVuZ3RoOyB9XG4gICAgaWYgKGguc3RhcnRUYWcpIHtcbiAgICAgIGguc3RhcnRUYWcodGFnLm5hbWUsIHRhZy5hdHRycywgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHRhZy5uZXh0LCBzdGF0ZSwgcGFyYW0pKTtcbiAgICB9XG4gICAgLy8gdGFncyBsaWtlIDxzY3JpcHQ+IGFuZCA8dGV4dGFyZWE+IGhhdmUgc3BlY2lhbCBwYXJzaW5nXG4gICAgaWYgKHRhZy5lZmxhZ3MgJiBFRkxBR1NfVEVYVCkge1xuICAgICAgcmV0dXJuIHBhcnNlVGV4dChwYXJ0cywgdGFnLCBoLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLCBzdGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0YWcubmV4dDtcbiAgICB9XG4gIH1cblxuICB2YXIgZW5kVGFnUmUgPSB7fTtcblxuICAvLyBUYWdzIGxpa2UgPHNjcmlwdD4gYW5kIDx0ZXh0YXJlYT4gYXJlIGZsYWdnZWQgYXMgQ0RBVEEgb3IgUkNEQVRBLFxuICAvLyB3aGljaCBtZWFucyBldmVyeXRoaW5nIGlzIHRleHQgdW50aWwgd2Ugc2VlIHRoZSBjb3JyZWN0IGNsb3NpbmcgdGFnLlxuICBmdW5jdGlvbiBwYXJzZVRleHQocGFydHMsIHRhZywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpIHtcbiAgICB2YXIgZW5kID0gcGFydHMubGVuZ3RoO1xuICAgIGlmICghZW5kVGFnUmUuaGFzT3duUHJvcGVydHkodGFnLm5hbWUpKSB7XG4gICAgICBlbmRUYWdSZVt0YWcubmFtZV0gPSBuZXcgUmVnRXhwKCdeJyArIHRhZy5uYW1lICsgJyg/OltcXFxcc1xcXFwvXXwkKScsICdpJyk7XG4gICAgfVxuICAgIHZhciByZSA9IGVuZFRhZ1JlW3RhZy5uYW1lXTtcbiAgICB2YXIgZmlyc3QgPSB0YWcubmV4dDtcbiAgICB2YXIgcCA9IHRhZy5uZXh0ICsgMTtcbiAgICBmb3IgKDsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICBpZiAocGFydHNbcCAtIDFdID09PSAnPFxcLycgJiYgcmUudGVzdChwYXJ0c1twXSkpIHsgYnJlYWs7IH1cbiAgICB9XG4gICAgaWYgKHAgPCBlbmQpIHsgcCAtPSAxOyB9XG4gICAgdmFyIGJ1ZiA9IHBhcnRzLnNsaWNlKGZpcnN0LCBwKS5qb2luKCcnKTtcbiAgICBpZiAodGFnLmVmbGFncyAmIGh0bWw0LmVmbGFnc1snQ0RBVEEnXSkge1xuICAgICAgaWYgKGguY2RhdGEpIHtcbiAgICAgICAgaC5jZGF0YShidWYsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHAsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGFnLmVmbGFncyAmIGh0bWw0LmVmbGFnc1snUkNEQVRBJ10pIHtcbiAgICAgIGlmIChoLnJjZGF0YSkge1xuICAgICAgICBoLnJjZGF0YShub3JtYWxpemVSQ0RhdGEoYnVmKSwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcCwgc3RhdGUsIHBhcmFtKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYnVnJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLy8gYXQgdGhpcyBwb2ludCwgcGFydHNbcG9zLTFdIGlzIGVpdGhlciBcIjxcIiBvciBcIjxcXC9cIi5cbiAgZnVuY3Rpb24gcGFyc2VUYWdBbmRBdHRycyhwYXJ0cywgcG9zKSB7XG4gICAgdmFyIG0gPSAvXihbLVxcdzpdKykvLmV4ZWMocGFydHNbcG9zXSk7XG4gICAgdmFyIHRhZyA9IHt9O1xuICAgIHRhZy5uYW1lID0gbVsxXS50b0xvd2VyQ2FzZSgpO1xuICAgIHRhZy5lZmxhZ3MgPSBodG1sNC5FTEVNRU5UU1t0YWcubmFtZV07XG4gICAgdmFyIGJ1ZiA9IHBhcnRzW3Bvc10uc3Vic3RyKG1bMF0ubGVuZ3RoKTtcbiAgICAvLyBGaW5kIHRoZSBuZXh0ICc+Jy4gIFdlIG9wdGltaXN0aWNhbGx5IGFzc3VtZSB0aGlzICc+JyBpcyBub3QgaW4gYVxuICAgIC8vIHF1b3RlZCBjb250ZXh0LCBhbmQgZnVydGhlciBkb3duIHdlIGZpeCB0aGluZ3MgdXAgaWYgaXQgdHVybnMgb3V0IHRvXG4gICAgLy8gYmUgcXVvdGVkLlxuICAgIHZhciBwID0gcG9zICsgMTtcbiAgICB2YXIgZW5kID0gcGFydHMubGVuZ3RoO1xuICAgIGZvciAoOyBwIDwgZW5kOyBwKyspIHtcbiAgICAgIGlmIChwYXJ0c1twXSA9PT0gJz4nKSB7IGJyZWFrOyB9XG4gICAgICBidWYgKz0gcGFydHNbcF07XG4gICAgfVxuICAgIGlmIChlbmQgPD0gcCkgeyByZXR1cm4gdm9pZCAwOyB9XG4gICAgdmFyIGF0dHJzID0gW107XG4gICAgd2hpbGUgKGJ1ZiAhPT0gJycpIHtcbiAgICAgIG0gPSBBVFRSX1JFLmV4ZWMoYnVmKTtcbiAgICAgIGlmICghbSkge1xuICAgICAgICAvLyBObyBhdHRyaWJ1dGUgZm91bmQ6IHNraXAgZ2FyYmFnZVxuICAgICAgICBidWYgPSBidWYucmVwbGFjZSgvXltcXHNcXFNdW15hLXpcXHNdKi8sICcnKTtcblxuICAgICAgfSBlbHNlIGlmICgobVs0XSAmJiAhbVs1XSkgfHwgKG1bNl0gJiYgIW1bN10pKSB7XG4gICAgICAgIC8vIFVudGVybWluYXRlZCBxdW90ZTogc2x1cnAgdG8gdGhlIG5leHQgdW5xdW90ZWQgJz4nXG4gICAgICAgIHZhciBxdW90ZSA9IG1bNF0gfHwgbVs2XTtcbiAgICAgICAgdmFyIHNhd1F1b3RlID0gZmFsc2U7XG4gICAgICAgIHZhciBhYnVmID0gW2J1ZiwgcGFydHNbcCsrXV07XG4gICAgICAgIGZvciAoOyBwIDwgZW5kOyBwKyspIHtcbiAgICAgICAgICBpZiAoc2F3UXVvdGUpIHtcbiAgICAgICAgICAgIGlmIChwYXJ0c1twXSA9PT0gJz4nKSB7IGJyZWFrOyB9XG4gICAgICAgICAgfSBlbHNlIGlmICgwIDw9IHBhcnRzW3BdLmluZGV4T2YocXVvdGUpKSB7XG4gICAgICAgICAgICBzYXdRdW90ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFidWYucHVzaChwYXJ0c1twXSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2x1cnAgZmFpbGVkOiBsb3NlIHRoZSBnYXJiYWdlXG4gICAgICAgIGlmIChlbmQgPD0gcCkgeyBicmVhazsgfVxuICAgICAgICAvLyBPdGhlcndpc2UgcmV0cnkgYXR0cmlidXRlIHBhcnNpbmdcbiAgICAgICAgYnVmID0gYWJ1Zi5qb2luKCcnKTtcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGhhdmUgYW4gYXR0cmlidXRlXG4gICAgICAgIHZhciBhTmFtZSA9IG1bMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGFWYWx1ZSA9IG1bMl0gPyBkZWNvZGVWYWx1ZShtWzNdKSA6ICcnO1xuICAgICAgICBhdHRycy5wdXNoKGFOYW1lLCBhVmFsdWUpO1xuICAgICAgICBidWYgPSBidWYuc3Vic3RyKG1bMF0ubGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGFnLmF0dHJzID0gYXR0cnM7XG4gICAgdGFnLm5leHQgPSBwICsgMTtcbiAgICByZXR1cm4gdGFnO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlVmFsdWUodikge1xuICAgIHZhciBxID0gdi5jaGFyQ29kZUF0KDApO1xuICAgIGlmIChxID09PSAweDIyIHx8IHEgPT09IDB4MjcpIHsgLy8gXCIgb3IgJ1xuICAgICAgdiA9IHYuc3Vic3RyKDEsIHYubGVuZ3RoIC0gMik7XG4gICAgfVxuICAgIHJldHVybiB1bmVzY2FwZUVudGl0aWVzKHN0cmlwTlVMcyh2KSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgc3RyaXBzIHVuc2FmZSB0YWdzIGFuZCBhdHRyaWJ1dGVzIGZyb20gaHRtbC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIEFycmF5LjxzdHJpbmc+KTogP0FycmF5LjxzdHJpbmc+fSB0YWdQb2xpY3lcbiAgICogICAgIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyAodGFnTmFtZSwgYXR0cmlic1tdKSwgd2hlcmUgdGFnTmFtZSBpcyBhIGtleSBpblxuICAgKiAgICAgaHRtbDQuRUxFTUVOVFMgYW5kIGF0dHJpYnMgaXMgYW4gYXJyYXkgb2YgYWx0ZXJuYXRpbmcgYXR0cmlidXRlIG5hbWVzXG4gICAqICAgICBhbmQgdmFsdWVzLiAgSXQgc2hvdWxkIHJldHVybiBhIHJlY29yZCAoYXMgZm9sbG93cyksIG9yIG51bGwgdG8gZGVsZXRlXG4gICAqICAgICB0aGUgZWxlbWVudC4gIEl0J3Mgb2theSBmb3IgdGFnUG9saWN5IHRvIG1vZGlmeSB0aGUgYXR0cmlicyBhcnJheSxcbiAgICogICAgIGJ1dCB0aGUgc2FtZSBhcnJheSBpcyByZXVzZWQsIHNvIGl0IHNob3VsZCBub3QgYmUgaGVsZCBiZXR3ZWVuIGNhbGxzLlxuICAgKiAgICAgUmVjb3JkIGtleXM6XG4gICAqICAgICAgICBhdHRyaWJzOiAocmVxdWlyZWQpIFNhbml0aXplZCBhdHRyaWJ1dGVzIGFycmF5LlxuICAgKiAgICAgICAgdGFnTmFtZTogUmVwbGFjZW1lbnQgdGFnIG5hbWUuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uKHN0cmluZywgQXJyYXkpfSBBIGZ1bmN0aW9uIHRoYXQgc2FuaXRpemVzIGEgc3RyaW5nIG9mXG4gICAqICAgICBIVE1MIGFuZCBhcHBlbmRzIHJlc3VsdCBzdHJpbmdzIHRvIHRoZSBzZWNvbmQgYXJndW1lbnQsIGFuIGFycmF5LlxuICAgKi9cbiAgZnVuY3Rpb24gbWFrZUh0bWxTYW5pdGl6ZXIodGFnUG9saWN5KSB7XG4gICAgdmFyIHN0YWNrO1xuICAgIHZhciBpZ25vcmluZztcbiAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uICh0ZXh0LCBvdXQpIHtcbiAgICAgIGlmICghaWdub3JpbmcpIHsgb3V0LnB1c2godGV4dCk7IH1cbiAgICB9O1xuICAgIHJldHVybiBtYWtlU2F4UGFyc2VyKHtcbiAgICAgICdzdGFydERvYyc6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgc3RhY2sgPSBbXTtcbiAgICAgICAgaWdub3JpbmcgPSBmYWxzZTtcbiAgICAgIH0sXG4gICAgICAnc3RhcnRUYWcnOiBmdW5jdGlvbih0YWdOYW1lT3JpZywgYXR0cmlicywgb3V0KSB7XG4gICAgICAgIGlmIChpZ25vcmluZykgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCFodG1sNC5FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lT3JpZykpIHsgcmV0dXJuOyB9XG4gICAgICAgIHZhciBlZmxhZ3NPcmlnID0gaHRtbDQuRUxFTUVOVFNbdGFnTmFtZU9yaWddO1xuICAgICAgICBpZiAoZWZsYWdzT3JpZyAmIGh0bWw0LmVmbGFnc1snRk9MREFCTEUnXSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZWNpc2lvbiA9IHRhZ1BvbGljeSh0YWdOYW1lT3JpZywgYXR0cmlicyk7XG4gICAgICAgIGlmICghZGVjaXNpb24pIHtcbiAgICAgICAgICBpZ25vcmluZyA9ICEoZWZsYWdzT3JpZyAmIGh0bWw0LmVmbGFnc1snRU1QVFknXSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWNpc2lvbiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RhZ1BvbGljeSBkaWQgbm90IHJldHVybiBvYmplY3QgKG9sZCBBUEk/KScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnYXR0cmlicycgaW4gZGVjaXNpb24pIHtcbiAgICAgICAgICBhdHRyaWJzID0gZGVjaXNpb25bJ2F0dHJpYnMnXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RhZ1BvbGljeSBnYXZlIG5vIGF0dHJpYnMnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWZsYWdzUmVwO1xuICAgICAgICB2YXIgdGFnTmFtZVJlcDtcbiAgICAgICAgaWYgKCd0YWdOYW1lJyBpbiBkZWNpc2lvbikge1xuICAgICAgICAgIHRhZ05hbWVSZXAgPSBkZWNpc2lvblsndGFnTmFtZSddO1xuICAgICAgICAgIGVmbGFnc1JlcCA9IGh0bWw0LkVMRU1FTlRTW3RhZ05hbWVSZXBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhZ05hbWVSZXAgPSB0YWdOYW1lT3JpZztcbiAgICAgICAgICBlZmxhZ3NSZXAgPSBlZmxhZ3NPcmlnO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE8obWlrZXNhbXVlbCk6IHJlbHlpbmcgb24gdGFnUG9saWN5IG5vdCB0byBpbnNlcnQgdW5zYWZlXG4gICAgICAgIC8vIGF0dHJpYnV0ZSBuYW1lcy5cblxuICAgICAgICAvLyBJZiB0aGlzIGlzIGFuIG9wdGlvbmFsLWVuZC10YWcgZWxlbWVudCBhbmQgZWl0aGVyIHRoaXMgZWxlbWVudCBvciBpdHNcbiAgICAgICAgLy8gcHJldmlvdXMgbGlrZSBzaWJsaW5nIHdhcyByZXdyaXR0ZW4sIHRoZW4gaW5zZXJ0IGEgY2xvc2UgdGFnIHRvXG4gICAgICAgIC8vIHByZXNlcnZlIHN0cnVjdHVyZS5cbiAgICAgICAgaWYgKGVmbGFnc09yaWcgJiBodG1sNC5lZmxhZ3NbJ09QVElPTkFMX0VORFRBRyddKSB7XG4gICAgICAgICAgdmFyIG9uU3RhY2sgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgICBpZiAob25TdGFjayAmJiBvblN0YWNrLm9yaWcgPT09IHRhZ05hbWVPcmlnICYmXG4gICAgICAgICAgICAgIChvblN0YWNrLnJlcCAhPT0gdGFnTmFtZVJlcCB8fCB0YWdOYW1lT3JpZyAhPT0gdGFnTmFtZVJlcCkpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaCgnPFxcLycsIG9uU3RhY2sucmVwLCAnPicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKGVmbGFnc09yaWcgJiBodG1sNC5lZmxhZ3NbJ0VNUFRZJ10pKSB7XG4gICAgICAgICAgc3RhY2sucHVzaCh7b3JpZzogdGFnTmFtZU9yaWcsIHJlcDogdGFnTmFtZVJlcH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0LnB1c2goJzwnLCB0YWdOYW1lUmVwKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhdHRyaWJzLmxlbmd0aDsgaSA8IG47IGkgKz0gMikge1xuICAgICAgICAgIHZhciBhdHRyaWJOYW1lID0gYXR0cmlic1tpXSxcbiAgICAgICAgICAgICAgdmFsdWUgPSBhdHRyaWJzW2kgKyAxXTtcbiAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCkge1xuICAgICAgICAgICAgb3V0LnB1c2goJyAnLCBhdHRyaWJOYW1lLCAnPVwiJywgZXNjYXBlQXR0cmliKHZhbHVlKSwgJ1wiJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG91dC5wdXNoKCc+Jyk7XG5cbiAgICAgICAgaWYgKChlZmxhZ3NPcmlnICYgaHRtbDQuZWZsYWdzWydFTVBUWSddKVxuICAgICAgICAgICAgJiYgIShlZmxhZ3NSZXAgJiBodG1sNC5lZmxhZ3NbJ0VNUFRZJ10pKSB7XG4gICAgICAgICAgLy8gcmVwbGFjZW1lbnQgaXMgbm9uLWVtcHR5LCBzeW50aGVzaXplIGVuZCB0YWdcbiAgICAgICAgICBvdXQucHVzaCgnPFxcLycsIHRhZ05hbWVSZXAsICc+Jyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnZW5kVGFnJzogZnVuY3Rpb24odGFnTmFtZSwgb3V0KSB7XG4gICAgICAgIGlmIChpZ25vcmluZykge1xuICAgICAgICAgIGlnbm9yaW5nID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaHRtbDQuRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHsgcmV0dXJuOyB9XG4gICAgICAgIHZhciBlZmxhZ3MgPSBodG1sNC5FTEVNRU5UU1t0YWdOYW1lXTtcbiAgICAgICAgaWYgKCEoZWZsYWdzICYgKGh0bWw0LmVmbGFnc1snRU1QVFknXSB8IGh0bWw0LmVmbGFnc1snRk9MREFCTEUnXSkpKSB7XG4gICAgICAgICAgdmFyIGluZGV4O1xuICAgICAgICAgIGlmIChlZmxhZ3MgJiBodG1sNC5lZmxhZ3NbJ09QVElPTkFMX0VORFRBRyddKSB7XG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gc3RhY2subGVuZ3RoOyAtLWluZGV4ID49IDA7KSB7XG4gICAgICAgICAgICAgIHZhciBzdGFja0VsT3JpZ1RhZyA9IHN0YWNrW2luZGV4XS5vcmlnO1xuICAgICAgICAgICAgICBpZiAoc3RhY2tFbE9yaWdUYWcgPT09IHRhZ05hbWUpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgaWYgKCEoaHRtbDQuRUxFTUVOVFNbc3RhY2tFbE9yaWdUYWddICZcbiAgICAgICAgICAgICAgICAgICAgaHRtbDQuZWZsYWdzWydPUFRJT05BTF9FTkRUQUcnXSkpIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBwb3Agbm9uIG9wdGlvbmFsIGVuZCB0YWdzIGxvb2tpbmcgZm9yIGEgbWF0Y2guXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaW5kZXggPSBzdGFjay5sZW5ndGg7IC0taW5kZXggPj0gMDspIHtcbiAgICAgICAgICAgICAgaWYgKHN0YWNrW2luZGV4XS5vcmlnID09PSB0YWdOYW1lKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpbmRleCA8IDApIHsgcmV0dXJuOyB9ICAvLyBOb3Qgb3BlbmVkLlxuICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFjay5sZW5ndGg7IC0taSA+IGluZGV4Oykge1xuICAgICAgICAgICAgdmFyIHN0YWNrRWxSZXBUYWcgPSBzdGFja1tpXS5yZXA7XG4gICAgICAgICAgICBpZiAoIShodG1sNC5FTEVNRU5UU1tzdGFja0VsUmVwVGFnXSAmXG4gICAgICAgICAgICAgICAgICBodG1sNC5lZmxhZ3NbJ09QVElPTkFMX0VORFRBRyddKSkge1xuICAgICAgICAgICAgICBvdXQucHVzaCgnPFxcLycsIHN0YWNrRWxSZXBUYWcsICc+Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpbmRleCA8IHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFnTmFtZSA9IHN0YWNrW2luZGV4XS5yZXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YWNrLmxlbmd0aCA9IGluZGV4O1xuICAgICAgICAgIG91dC5wdXNoKCc8XFwvJywgdGFnTmFtZSwgJz4nKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdwY2RhdGEnOiBlbWl0LFxuICAgICAgJ3JjZGF0YSc6IGVtaXQsXG4gICAgICAnY2RhdGEnOiBlbWl0LFxuICAgICAgJ2VuZERvYyc6IGZ1bmN0aW9uKG91dCkge1xuICAgICAgICBmb3IgKDsgc3RhY2subGVuZ3RoOyBzdGFjay5sZW5ndGgtLSkge1xuICAgICAgICAgIG91dC5wdXNoKCc8XFwvJywgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ucmVwLCAnPicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB2YXIgQUxMT1dFRF9VUklfU0NIRU1FUyA9IC9eKD86aHR0cHM/fG1haWx0b3xkYXRhKSQvaTtcblxuICBmdW5jdGlvbiBzYWZlVXJpKHVyaSwgZWZmZWN0LCBsdHlwZSwgaGludHMsIG5haXZlVXJpUmV3cml0ZXIpIHtcbiAgICBpZiAoIW5haXZlVXJpUmV3cml0ZXIpIHsgcmV0dXJuIG51bGw7IH1cbiAgICB0cnkge1xuICAgICAgdmFyIHBhcnNlZCA9IFVSSS5wYXJzZSgnJyArIHVyaSk7XG4gICAgICBpZiAocGFyc2VkKSB7XG4gICAgICAgIGlmICghcGFyc2VkLmhhc1NjaGVtZSgpIHx8XG4gICAgICAgICAgICBBTExPV0VEX1VSSV9TQ0hFTUVTLnRlc3QocGFyc2VkLmdldFNjaGVtZSgpKSkge1xuICAgICAgICAgIHZhciBzYWZlID0gbmFpdmVVcmlSZXdyaXRlcihwYXJzZWQsIGVmZmVjdCwgbHR5cGUsIGhpbnRzKTtcbiAgICAgICAgICByZXR1cm4gc2FmZSA/IHNhZmUudG9TdHJpbmcoKSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBsb2cobG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAoIWF0dHJpYk5hbWUpIHtcbiAgICAgIGxvZ2dlcih0YWdOYW1lICsgXCIgcmVtb3ZlZFwiLCB7XG4gICAgICAgIGNoYW5nZTogXCJyZW1vdmVkXCIsXG4gICAgICAgIHRhZ05hbWU6IHRhZ05hbWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICB2YXIgY2hhbmdlZCA9IFwiY2hhbmdlZFwiO1xuICAgICAgaWYgKG9sZFZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgICBjaGFuZ2VkID0gXCJyZW1vdmVkXCI7XG4gICAgICB9IGVsc2UgaWYgKCFvbGRWYWx1ZSAmJiBuZXdWYWx1ZSkgIHtcbiAgICAgICAgY2hhbmdlZCA9IFwiYWRkZWRcIjtcbiAgICAgIH1cbiAgICAgIGxvZ2dlcih0YWdOYW1lICsgXCIuXCIgKyBhdHRyaWJOYW1lICsgXCIgXCIgKyBjaGFuZ2VkLCB7XG4gICAgICAgIGNoYW5nZTogY2hhbmdlZCxcbiAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgYXR0cmliTmFtZTogYXR0cmliTmFtZSxcbiAgICAgICAgb2xkVmFsdWU6IG9sZFZhbHVlLFxuICAgICAgICBuZXdWYWx1ZTogbmV3VmFsdWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvb2t1cEF0dHJpYnV0ZShtYXAsIHRhZ05hbWUsIGF0dHJpYk5hbWUpIHtcbiAgICB2YXIgYXR0cmliS2V5O1xuICAgIGF0dHJpYktleSA9IHRhZ05hbWUgKyAnOjonICsgYXR0cmliTmFtZTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGF0dHJpYktleSkpIHtcbiAgICAgIHJldHVybiBtYXBbYXR0cmliS2V5XTtcbiAgICB9XG4gICAgYXR0cmliS2V5ID0gJyo6OicgKyBhdHRyaWJOYW1lO1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkoYXR0cmliS2V5KSkge1xuICAgICAgcmV0dXJuIG1hcFthdHRyaWJLZXldO1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG4gIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZVR5cGUodGFnTmFtZSwgYXR0cmliTmFtZSkge1xuICAgIHJldHVybiBsb29rdXBBdHRyaWJ1dGUoaHRtbDQuQVRUUklCUywgdGFnTmFtZSwgYXR0cmliTmFtZSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0TG9hZGVyVHlwZSh0YWdOYW1lLCBhdHRyaWJOYW1lKSB7XG4gICAgcmV0dXJuIGxvb2t1cEF0dHJpYnV0ZShodG1sNC5MT0FERVJUWVBFUywgdGFnTmFtZSwgYXR0cmliTmFtZSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0VXJpRWZmZWN0KHRhZ05hbWUsIGF0dHJpYk5hbWUpIHtcbiAgICByZXR1cm4gbG9va3VwQXR0cmlidXRlKGh0bWw0LlVSSUVGRkVDVFMsIHRhZ05hbWUsIGF0dHJpYk5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhbml0aXplcyBhdHRyaWJ1dGVzIG9uIGFuIEhUTUwgdGFnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBBbiBIVE1MIHRhZyBuYW1lIGluIGxvd2VyY2FzZS5cbiAgICogQHBhcmFtIHtBcnJheS48P3N0cmluZz59IGF0dHJpYnMgQW4gYXJyYXkgb2YgYWx0ZXJuYXRpbmcgbmFtZXMgYW5kIHZhbHVlcy5cbiAgICogQHBhcmFtIHs/ZnVuY3Rpb24oP3N0cmluZyk6ID9zdHJpbmd9IG9wdF9uYWl2ZVVyaVJld3JpdGVyIEEgdHJhbnNmb3JtIHRvXG4gICAqICAgICBhcHBseSB0byBVUkkgYXR0cmlidXRlczsgaXQgY2FuIHJldHVybiBhIG5ldyBzdHJpbmcgdmFsdWUsIG9yIG51bGwgdG9cbiAgICogICAgIGRlbGV0ZSB0aGUgYXR0cmlidXRlLiAgSWYgdW5zcGVjaWZpZWQsIFVSSSBhdHRyaWJ1dGVzIGFyZSBkZWxldGVkLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKD9zdHJpbmcpOiA/c3RyaW5nfSBvcHRfbm1Ub2tlblBvbGljeSBBIHRyYW5zZm9ybSB0byBhcHBseVxuICAgKiAgICAgdG8gYXR0cmlidXRlcyBjb250YWluaW5nIEhUTUwgbmFtZXMsIGVsZW1lbnQgSURzLCBhbmQgc3BhY2Utc2VwYXJhdGVkXG4gICAqICAgICBsaXN0cyBvZiBjbGFzc2VzOyBpdCBjYW4gcmV0dXJuIGEgbmV3IHN0cmluZyB2YWx1ZSwgb3IgbnVsbCB0byBkZWxldGVcbiAgICogICAgIHRoZSBhdHRyaWJ1dGUuICBJZiB1bnNwZWNpZmllZCwgdGhlc2UgYXR0cmlidXRlcyBhcmUga2VwdCB1bmNoYW5nZWQuXG4gICAqIEByZXR1cm4ge0FycmF5Ljw/c3RyaW5nPn0gVGhlIHNhbml0aXplZCBhdHRyaWJ1dGVzIGFzIGEgbGlzdCBvZiBhbHRlcm5hdGluZ1xuICAgKiAgICAgbmFtZXMgYW5kIHZhbHVlcywgd2hlcmUgYSBudWxsIHZhbHVlIG1lYW5zIHRvIG9taXQgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIGZ1bmN0aW9uIHNhbml0aXplQXR0cmlicyh0YWdOYW1lLCBhdHRyaWJzLFxuICAgIG9wdF9uYWl2ZVVyaVJld3JpdGVyLCBvcHRfbm1Ub2tlblBvbGljeSwgb3B0X2xvZ2dlcikge1xuICAgIC8vIFRPRE8oZmVsaXg4YSk6IGl0J3Mgb2Jub3hpb3VzIHRoYXQgZG9tYWRvIGR1cGxpY2F0ZXMgbXVjaCBvZiB0aGlzXG4gICAgLy8gVE9ETyhmZWxpeDhhKTogbWF5YmUgY29uc2lzdGVudGx5IGVuZm9yY2UgY29uc3RyYWludHMgbGlrZSB0YXJnZXQ9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB2YXIgYXR0cmliTmFtZSA9IGF0dHJpYnNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBhdHRyaWJzW2kgKyAxXTtcbiAgICAgIHZhciBvbGRWYWx1ZSA9IHZhbHVlO1xuICAgICAgdmFyIGF0eXBlID0gbnVsbCwgYXR0cmliS2V5O1xuICAgICAgaWYgKChhdHRyaWJLZXkgPSB0YWdOYW1lICsgJzo6JyArIGF0dHJpYk5hbWUsXG4gICAgICAgICAgIGh0bWw0LkFUVFJJQlMuaGFzT3duUHJvcGVydHkoYXR0cmliS2V5KSkgfHxcbiAgICAgICAgICAoYXR0cmliS2V5ID0gJyo6OicgKyBhdHRyaWJOYW1lLFxuICAgICAgICAgICBodG1sNC5BVFRSSUJTLmhhc093blByb3BlcnR5KGF0dHJpYktleSkpKSB7XG4gICAgICAgIGF0eXBlID0gaHRtbDQuQVRUUklCU1thdHRyaWJLZXldO1xuICAgICAgfVxuICAgICAgaWYgKGF0eXBlICE9PSBudWxsKSB7XG4gICAgICAgIHN3aXRjaCAoYXR5cGUpIHtcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydOT05FJ106IGJyZWFrO1xuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ1NDUklQVCddOlxuICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG9wdF9sb2dnZXIpIHtcbiAgICAgICAgICAgICAgbG9nKG9wdF9sb2dnZXIsIHRhZ05hbWUsIGF0dHJpYk5hbWUsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydTVFlMRSddOlxuICAgICAgICAgICAgaWYgKCd1bmRlZmluZWQnID09PSB0eXBlb2YgcGFyc2VDc3NEZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuXHQgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHNhbml0aXplZERlY2xhcmF0aW9ucyA9IFtdO1xuICAgICAgICAgICAgcGFyc2VDc3NEZWNsYXJhdGlvbnMoXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb246IGZ1bmN0aW9uIChwcm9wZXJ0eSwgdG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3JtUHJvcCA9IHByb3BlcnR5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2hlbWEgPSBjc3NTY2hlbWFbbm9ybVByb3BdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNjaGVtYSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzYW5pdGl6ZUNzc1Byb3BlcnR5KFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9ybVByb3AsIHNjaGVtYSwgdG9rZW5zLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0X25haXZlVXJpUmV3cml0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzYWZlVXJpKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmwsIGh0bWw0LnVlZmZlY3RzLlNBTUVfRE9DVU1FTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw0Lmx0eXBlcy5TQU5EQk9YRUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRZUEVcIjogXCJDU1NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkNTU19QUk9QXCI6IG5vcm1Qcm9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIG9wdF9uYWl2ZVVyaVJld3JpdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgc2FuaXRpemVkRGVjbGFyYXRpb25zLnB1c2gocHJvcGVydHkgKyAnOiAnICsgdG9rZW5zLmpvaW4oJyAnKSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YWx1ZSA9IHNhbml0aXplZERlY2xhcmF0aW9ucy5sZW5ndGggPiAwID9cbiAgICAgICAgICAgICAgc2FuaXRpemVkRGVjbGFyYXRpb25zLmpvaW4oJyA7ICcpIDogbnVsbDtcbiAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnSUQnXTpcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydJRFJFRiddOlxuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ0lEUkVGUyddOlxuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ0dMT0JBTF9OQU1FJ106XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnTE9DQUxfTkFNRSddOlxuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ0NMQVNTRVMnXTpcbiAgICAgICAgICAgIHZhbHVlID0gb3B0X25tVG9rZW5Qb2xpY3kgPyBvcHRfbm1Ub2tlblBvbGljeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnVVJJJ106XG4gICAgICAgICAgICB2YWx1ZSA9IHNhZmVVcmkodmFsdWUsXG4gICAgICAgICAgICAgIGdldFVyaUVmZmVjdCh0YWdOYW1lLCBhdHRyaWJOYW1lKSxcbiAgICAgICAgICAgICAgZ2V0TG9hZGVyVHlwZSh0YWdOYW1lLCBhdHRyaWJOYW1lKSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwiVFlQRVwiOiBcIk1BUktVUFwiLFxuICAgICAgICAgICAgICAgIFwiWE1MX0FUVFJcIjogYXR0cmliTmFtZSxcbiAgICAgICAgICAgICAgICBcIlhNTF9UQUdcIjogdGFnTmFtZVxuICAgICAgICAgICAgICB9LCBvcHRfbmFpdmVVcmlSZXdyaXRlcik7XG4gICAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnVVJJX0ZSQUdNRU5UJ106XG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgJyMnID09PSB2YWx1ZS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMSk7ICAvLyByZW1vdmUgdGhlIGxlYWRpbmcgJyMnXG4gICAgICAgICAgICAgIHZhbHVlID0gb3B0X25tVG9rZW5Qb2xpY3kgPyBvcHRfbm1Ub2tlblBvbGljeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICcjJyArIHZhbHVlOyAgLy8gcmVzdG9yZSB0aGUgbGVhZGluZyAnIydcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdF9sb2dnZXIpIHtcbiAgICAgICAgICAgICAgbG9nKG9wdF9sb2dnZXIsIHRhZ05hbWUsIGF0dHJpYk5hbWUsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG9wdF9sb2dnZXIpIHtcbiAgICAgICAgICAgICAgbG9nKG9wdF9sb2dnZXIsIHRhZ05hbWUsIGF0dHJpYk5hbWUsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhdHRyaWJzW2kgKyAxXSA9IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cmlicztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdGFnIHBvbGljeSB0aGF0IG9taXRzIGFsbCB0YWdzIG1hcmtlZCBVTlNBRkUgaW4gaHRtbDQtZGVmcy5qc1xuICAgKiBhbmQgYXBwbGllcyB0aGUgZGVmYXVsdCBhdHRyaWJ1dGUgc2FuaXRpemVyIHdpdGggdGhlIHN1cHBsaWVkIHBvbGljeSBmb3JcbiAgICogVVJJIGF0dHJpYnV0ZXMgYW5kIE5NVE9LRU4gYXR0cmlidXRlcy5cbiAgICogQHBhcmFtIHs/ZnVuY3Rpb24oP3N0cmluZyk6ID9zdHJpbmd9IG9wdF9uYWl2ZVVyaVJld3JpdGVyIEEgdHJhbnNmb3JtIHRvXG4gICAqICAgICBhcHBseSB0byBVUkkgYXR0cmlidXRlcy4gIElmIG5vdCBnaXZlbiwgVVJJIGF0dHJpYnV0ZXMgYXJlIGRlbGV0ZWQuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oP3N0cmluZyk6ID9zdHJpbmd9IG9wdF9ubVRva2VuUG9saWN5IEEgdHJhbnNmb3JtIHRvIGFwcGx5XG4gICAqICAgICB0byBhdHRyaWJ1dGVzIGNvbnRhaW5pbmcgSFRNTCBuYW1lcywgZWxlbWVudCBJRHMsIGFuZCBzcGFjZS1zZXBhcmF0ZWRcbiAgICogICAgIGxpc3RzIG9mIGNsYXNzZXMuICBJZiBub3QgZ2l2ZW4sIHN1Y2ggYXR0cmlidXRlcyBhcmUgbGVmdCB1bmNoYW5nZWQuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uKHN0cmluZywgQXJyYXkuPD9zdHJpbmc+KX0gQSB0YWdQb2xpY3kgc3VpdGFibGUgZm9yXG4gICAqICAgICBwYXNzaW5nIHRvIGh0bWwuc2FuaXRpemUuXG4gICAqL1xuICBmdW5jdGlvbiBtYWtlVGFnUG9saWN5KFxuICAgIG9wdF9uYWl2ZVVyaVJld3JpdGVyLCBvcHRfbm1Ub2tlblBvbGljeSwgb3B0X2xvZ2dlcikge1xuICAgIHJldHVybiBmdW5jdGlvbih0YWdOYW1lLCBhdHRyaWJzKSB7XG4gICAgICBpZiAoIShodG1sNC5FTEVNRU5UU1t0YWdOYW1lXSAmIGh0bWw0LmVmbGFnc1snVU5TQUZFJ10pKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgJ2F0dHJpYnMnOiBzYW5pdGl6ZUF0dHJpYnModGFnTmFtZSwgYXR0cmlicyxcbiAgICAgICAgICAgIG9wdF9uYWl2ZVVyaVJld3JpdGVyLCBvcHRfbm1Ub2tlblBvbGljeSwgb3B0X2xvZ2dlcilcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgbG9nKG9wdF9sb2dnZXIsIHRhZ05hbWUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYW5pdGl6ZXMgSFRNTCB0YWdzIGFuZCBhdHRyaWJ1dGVzIGFjY29yZGluZyB0byBhIGdpdmVuIHBvbGljeS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0SHRtbCBUaGUgSFRNTCB0byBzYW5pdGl6ZS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIEFycmF5Ljw/c3RyaW5nPil9IHRhZ1BvbGljeSBBIGZ1bmN0aW9uIHRoYXRcbiAgICogICAgIGRlY2lkZXMgd2hpY2ggdGFncyB0byBhY2NlcHQgYW5kIHNhbml0aXplcyB0aGVpciBhdHRyaWJ1dGVzIChzZWVcbiAgICogICAgIG1ha2VIdG1sU2FuaXRpemVyIGFib3ZlIGZvciBkZXRhaWxzKS5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgc2FuaXRpemVkIEhUTUwuXG4gICAqL1xuICBmdW5jdGlvbiBzYW5pdGl6ZVdpdGhQb2xpY3koaW5wdXRIdG1sLCB0YWdQb2xpY3kpIHtcbiAgICB2YXIgb3V0cHV0QXJyYXkgPSBbXTtcbiAgICBtYWtlSHRtbFNhbml0aXplcih0YWdQb2xpY3kpKGlucHV0SHRtbCwgb3V0cHV0QXJyYXkpO1xuICAgIHJldHVybiBvdXRwdXRBcnJheS5qb2luKCcnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJpcHMgdW5zYWZlIHRhZ3MgYW5kIGF0dHJpYnV0ZXMgZnJvbSBIVE1MLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRIdG1sIFRoZSBIVE1MIHRvIHNhbml0aXplLlxuICAgKiBAcGFyYW0gez9mdW5jdGlvbig/c3RyaW5nKTogP3N0cmluZ30gb3B0X25haXZlVXJpUmV3cml0ZXIgQSB0cmFuc2Zvcm0gdG9cbiAgICogICAgIGFwcGx5IHRvIFVSSSBhdHRyaWJ1dGVzLiAgSWYgbm90IGdpdmVuLCBVUkkgYXR0cmlidXRlcyBhcmUgZGVsZXRlZC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbig/c3RyaW5nKTogP3N0cmluZ30gb3B0X25tVG9rZW5Qb2xpY3kgQSB0cmFuc2Zvcm0gdG8gYXBwbHlcbiAgICogICAgIHRvIGF0dHJpYnV0ZXMgY29udGFpbmluZyBIVE1MIG5hbWVzLCBlbGVtZW50IElEcywgYW5kIHNwYWNlLXNlcGFyYXRlZFxuICAgKiAgICAgbGlzdHMgb2YgY2xhc3Nlcy4gIElmIG5vdCBnaXZlbiwgc3VjaCBhdHRyaWJ1dGVzIGFyZSBsZWZ0IHVuY2hhbmdlZC5cbiAgICovXG4gIGZ1bmN0aW9uIHNhbml0aXplKGlucHV0SHRtbCxcbiAgICBvcHRfbmFpdmVVcmlSZXdyaXRlciwgb3B0X25tVG9rZW5Qb2xpY3ksIG9wdF9sb2dnZXIpIHtcbiAgICB2YXIgdGFnUG9saWN5ID0gbWFrZVRhZ1BvbGljeShcbiAgICAgIG9wdF9uYWl2ZVVyaVJld3JpdGVyLCBvcHRfbm1Ub2tlblBvbGljeSwgb3B0X2xvZ2dlcik7XG4gICAgcmV0dXJuIHNhbml0aXplV2l0aFBvbGljeShpbnB1dEh0bWwsIHRhZ1BvbGljeSk7XG4gIH1cblxuICAvLyBFeHBvcnQgYm90aCBxdW90ZWQgYW5kIHVucXVvdGVkIG5hbWVzIGZvciBDbG9zdXJlIGxpbmthZ2UuXG4gIHZhciBodG1sID0ge307XG4gIGh0bWwuZXNjYXBlQXR0cmliID0gaHRtbFsnZXNjYXBlQXR0cmliJ10gPSBlc2NhcGVBdHRyaWI7XG4gIGh0bWwubWFrZUh0bWxTYW5pdGl6ZXIgPSBodG1sWydtYWtlSHRtbFNhbml0aXplciddID0gbWFrZUh0bWxTYW5pdGl6ZXI7XG4gIGh0bWwubWFrZVNheFBhcnNlciA9IGh0bWxbJ21ha2VTYXhQYXJzZXInXSA9IG1ha2VTYXhQYXJzZXI7XG4gIGh0bWwubWFrZVRhZ1BvbGljeSA9IGh0bWxbJ21ha2VUYWdQb2xpY3knXSA9IG1ha2VUYWdQb2xpY3k7XG4gIGh0bWwubm9ybWFsaXplUkNEYXRhID0gaHRtbFsnbm9ybWFsaXplUkNEYXRhJ10gPSBub3JtYWxpemVSQ0RhdGE7XG4gIGh0bWwuc2FuaXRpemUgPSBodG1sWydzYW5pdGl6ZSddID0gc2FuaXRpemU7XG4gIGh0bWwuc2FuaXRpemVBdHRyaWJzID0gaHRtbFsnc2FuaXRpemVBdHRyaWJzJ10gPSBzYW5pdGl6ZUF0dHJpYnM7XG4gIGh0bWwuc2FuaXRpemVXaXRoUG9saWN5ID0gaHRtbFsnc2FuaXRpemVXaXRoUG9saWN5J10gPSBzYW5pdGl6ZVdpdGhQb2xpY3k7XG4gIGh0bWwudW5lc2NhcGVFbnRpdGllcyA9IGh0bWxbJ3VuZXNjYXBlRW50aXRpZXMnXSA9IHVuZXNjYXBlRW50aXRpZXM7XG4gIHJldHVybiBodG1sO1xufSkoaHRtbDQpO1xuXG52YXIgaHRtbF9zYW5pdGl6ZSA9IGh0bWxbJ3Nhbml0aXplJ107XG5cbi8vIExvb3NlbiByZXN0cmljdGlvbnMgb2YgQ2FqYSdzXG4vLyBodG1sLXNhbml0aXplciB0byBhbGxvdyBmb3Igc3R5bGluZ1xuaHRtbDQuQVRUUklCU1snKjo6c3R5bGUnXSA9IDA7XG5odG1sNC5FTEVNRU5UU1snc3R5bGUnXSA9IDA7XG5odG1sNC5BVFRSSUJTWydhOjp0YXJnZXQnXSA9IDA7XG5odG1sNC5FTEVNRU5UU1sndmlkZW8nXSA9IDA7XG5odG1sNC5BVFRSSUJTWyd2aWRlbzo6c3JjJ10gPSAwO1xuaHRtbDQuQVRUUklCU1sndmlkZW86OnBvc3RlciddID0gMDtcbmh0bWw0LkFUVFJJQlNbJ3ZpZGVvOjpjb250cm9scyddID0gMDtcbmh0bWw0LkVMRU1FTlRTWydhdWRpbyddID0gMDtcbmh0bWw0LkFUVFJJQlNbJ2F1ZGlvOjpzcmMnXSA9IDA7XG5odG1sNC5BVFRSSUJTWyd2aWRlbzo6YXV0b3BsYXknXSA9IDA7XG5odG1sNC5BVFRSSUJTWyd2aWRlbzo6Y29udHJvbHMnXSA9IDA7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gaHRtbF9zYW5pdGl6ZTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJhdXRob3JcIjogXCJNYXBib3hcIixcbiAgXCJuYW1lXCI6IFwibWFwYm94LmpzXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJtYXBib3ggamF2YXNjcmlwdCBhcGlcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMi4wLjFcIixcbiAgXCJob21lcGFnZVwiOiBcImh0dHA6Ly9tYXBib3guY29tL1wiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiZ2l0Oi8vZ2l0aHViLmNvbS9tYXBib3gvbWFwYm94LmpzLmdpdFwiXG4gIH0sXG4gIFwibWFpblwiOiBcInNyYy9pbmRleC5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsZWFmbGV0XCI6IFwiMC43LjNcIixcbiAgICBcIm11c3RhY2hlXCI6IFwiMC43LjNcIixcbiAgICBcImNvcnNsaXRlXCI6IFwiMC4wLjZcIixcbiAgICBcInNhbml0aXplLWNhamFcIjogXCIwLjEuMlwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJ0ZXN0XCI6IFwianNoaW50IHNyYy8qLmpzICYmIG1vY2hhLXBoYW50b21qcyB0ZXN0L2luZGV4Lmh0bWxcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsZWFmbGV0LWhhc2hcIjogXCIwLjIuMVwiLFxuICAgIFwibGVhZmxldC1mdWxsc2NyZWVuXCI6IFwiMC4wLjBcIixcbiAgICBcInVnbGlmeS1qc1wiOiBcIjIuNC44XCIsXG4gICAgXCJtb2NoYVwiOiBcIjEuMTcuMVwiLFxuICAgIFwiZXhwZWN0LmpzXCI6IFwiMC4zLjFcIixcbiAgICBcInNpbm9uXCI6IFwiMS4xMC4yXCIsXG4gICAgXCJtb2NoYS1waGFudG9tanNcIjogXCIzLjEuNlwiLFxuICAgIFwiaGFwcGVuXCI6IFwiMC4xLjNcIixcbiAgICBcImJyb3dzZXJpZnlcIjogXCIzLjIzLjFcIixcbiAgICBcImpzaGludFwiOiBcIjIuNC40XCIsXG4gICAgXCJjbGVhbi1jc3NcIjogXCJ+Mi4wLjdcIixcbiAgICBcIm1pbmltaXN0XCI6IFwiMC4wLjVcIixcbiAgICBcIm1hcmtlZFwiOiBcIn4wLjMuMFwiXG4gIH0sXG4gIFwib3B0aW9uYWxEZXBlbmRlbmNpZXNcIjoge30sXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiKlwiXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgSFRUUF9VUkw6ICdodHRwOi8vYS50aWxlcy5tYXBib3guY29tL3Y0JyxcbiAgICBIVFRQU19VUkw6ICdodHRwczovL2EudGlsZXMubWFwYm94LmNvbS92NCcsXG4gICAgRk9SQ0VfSFRUUFM6IGZhbHNlLFxuICAgIFJFUVVJUkVfQUNDRVNTX1RPS0VOOiB0cnVlXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybGhlbHBlciA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLFxuICAgIG1hcmtlciA9IHJlcXVpcmUoJy4vbWFya2VyJyksXG4gICAgc2ltcGxlc3R5bGUgPSByZXF1aXJlKCcuL3NpbXBsZXN0eWxlJyk7XG5cbi8vICMgZmVhdHVyZUxheWVyXG4vL1xuLy8gQSBsYXllciBvZiBmZWF0dXJlcywgbG9hZGVkIGZyb20gTWFwYm94IG9yIGVsc2UuIEFkZHMgdGhlIGFiaWxpdHlcbi8vIHRvIHJlc2V0IGZlYXR1cmVzLCBmaWx0ZXIgdGhlbSwgYW5kIGxvYWQgdGhlbSBmcm9tIGEgR2VvSlNPTiBVUkwuXG52YXIgRmVhdHVyZUxheWVyID0gTC5GZWF0dXJlR3JvdXAuZXh0ZW5kKHtcbiAgICBvcHRpb25zOiB7XG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24oKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgICBzYW5pdGl6ZXI6IHJlcXVpcmUoJ3Nhbml0aXplLWNhamEnKSxcbiAgICAgICAgc3R5bGU6IHNpbXBsZXN0eWxlLnN0eWxlXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2xheWVycyA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlb2YgXyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHV0aWwuaWRVcmwoXywgdGhpcyk7XG4gICAgICAgIC8vIGphdmFzY3JpcHQgb2JqZWN0IG9mIFRpbGVKU09OIGRhdGFcbiAgICAgICAgfSBlbHNlIGlmIChfICYmIHR5cGVvZiBfID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhpcy5zZXRHZW9KU09OKF8pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldEdlb0pTT046IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5fZ2VvanNvbiA9IF87XG4gICAgICAgIHRoaXMuY2xlYXJMYXllcnMoKTtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZShfKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldEdlb0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2VvanNvbjtcbiAgICB9LFxuXG4gICAgbG9hZFVSTDogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZXF1ZXN0ICYmICdhYm9ydCcgaW4gdGhpcy5fcmVxdWVzdCkgdGhpcy5fcmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdCh1cmwsIEwuYmluZChmdW5jdGlvbihlcnIsIGpzb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3QgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIudHlwZSAhPT0gJ2Fib3J0Jykge1xuICAgICAgICAgICAgICAgIHV0aWwubG9nKCdjb3VsZCBub3QgbG9hZCBmZWF0dXJlcyBhdCAnICsgdXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge2Vycm9yOiBlcnJ9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VvSlNPTihqc29uKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlYWR5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGxvYWRJRDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZFVSTCh1cmxoZWxwZXIoJy8nICsgaWQgKyAnL2ZlYXR1cmVzLmpzb24nLCB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW4pKTtcbiAgICB9LFxuXG4gICAgc2V0RmlsdGVyOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5maWx0ZXIgPSBfO1xuICAgICAgICBpZiAodGhpcy5fZ2VvanNvbikge1xuICAgICAgICAgICAgdGhpcy5jbGVhckxheWVycygpO1xuICAgICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZSh0aGlzLl9nZW9qc29uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0RmlsdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5maWx0ZXI7XG4gICAgfSxcblxuICAgIF9pbml0aWFsaXplOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIHZhciBmZWF0dXJlcyA9IEwuVXRpbC5pc0FycmF5KGpzb24pID8ganNvbiA6IGpzb24uZmVhdHVyZXMsXG4gICAgICAgICAgICBpLCBsZW47XG5cbiAgICAgICAgaWYgKGZlYXR1cmVzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBmZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgYWRkIHRoaXMgaWYgZ2VvbWV0cnkgb3IgZ2VvbWV0cmllcyBhcmUgc2V0IGFuZCBub3QgbnVsbFxuICAgICAgICAgICAgICAgIGlmIChmZWF0dXJlc1tpXS5nZW9tZXRyaWVzIHx8IGZlYXR1cmVzW2ldLmdlb21ldHJ5IHx8IGZlYXR1cmVzW2ldLmZlYXR1cmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luaXRpYWxpemUoZmVhdHVyZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZmlsdGVyKGpzb24pKSB7XG5cbiAgICAgICAgICAgIHZhciBvcHRzID0ge2FjY2Vzc1Rva2VuOiB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW59LFxuICAgICAgICAgICAgICAgIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllcihqc29uLCBmdW5jdGlvbihmZWF0dXJlLCBsYXRsb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlci5zdHlsZShmZWF0dXJlLCBsYXRsb24sIG9wdHMpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIHBvcHVwSHRtbCA9IG1hcmtlci5jcmVhdGVQb3B1cChqc29uLCB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKTtcblxuICAgICAgICAgICAgaWYgKCdzZXRTdHlsZScgaW4gbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBsYXllci5zZXRTdHlsZShzaW1wbGVzdHlsZS5zdHlsZShqc29uKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxheWVyLmZlYXR1cmUgPSBqc29uO1xuXG4gICAgICAgICAgICBpZiAocG9wdXBIdG1sKSB7XG4gICAgICAgICAgICAgICAgbGF5ZXIuYmluZFBvcHVwKHBvcHVwSHRtbCwge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZUJ1dHRvbjogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcihsYXllcik7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMuRmVhdHVyZUxheWVyID0gRmVhdHVyZUxheWVyO1xuXG5tb2R1bGUuZXhwb3J0cy5mZWF0dXJlTGF5ZXIgPSBmdW5jdGlvbihfLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBGZWF0dXJlTGF5ZXIoXywgb3B0aW9ucyk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybGhlbHBlciA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpO1xuXG4vLyBMb3ctbGV2ZWwgZ2VvY29kaW5nIGludGVyZmFjZSAtIHdyYXBzIHNwZWNpZmljIEFQSSBjYWxscyBhbmQgdGhlaXJcbi8vIHJldHVybiB2YWx1ZXMuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVybCwgb3B0aW9ucykge1xuXG4gICAgdmFyIGdlb2NvZGVyID0ge307XG5cbiAgICB1dGlsLnN0cmljdCh1cmwsICdzdHJpbmcnKTtcblxuICAgIGlmICh1cmwuaW5kZXhPZignLycpID09PSAtMSkge1xuICAgICAgICB1cmwgPSB1cmxoZWxwZXIoJy9nZW9jb2RlLycgKyB1cmwgKyAnL3txdWVyeX0uanNvbicsIG9wdGlvbnMgJiYgb3B0aW9ucy5hY2Nlc3NUb2tlbik7XG4gICAgfVxuXG4gICAgZ2VvY29kZXIuZ2V0VVJMID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIGdlb2NvZGVyLnF1ZXJ5VVJMID0gZnVuY3Rpb24oXykge1xuICAgICAgICBpZiAodHlwZW9mIF8gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgXy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhcnRzW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KF9baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEwuVXRpbC50ZW1wbGF0ZShnZW9jb2Rlci5nZXRVUkwoKSwge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBwYXJ0cy5qb2luKCc7JylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEwuVXRpbC50ZW1wbGF0ZShnZW9jb2Rlci5nZXRVUkwoKSwge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBlbmNvZGVVUklDb21wb25lbnQoXylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdlb2NvZGVyLnF1ZXJ5ID0gZnVuY3Rpb24oXywgY2FsbGJhY2spIHtcbiAgICAgICAgdXRpbC5zdHJpY3QoY2FsbGJhY2ssICdmdW5jdGlvbicpO1xuICAgICAgICByZXF1ZXN0KGdlb2NvZGVyLnF1ZXJ5VVJMKF8pLCBmdW5jdGlvbihlcnIsIGpzb24pIHtcbiAgICAgICAgICAgIGlmIChqc29uICYmIChqc29uLmxlbmd0aCB8fCBqc29uLmZlYXR1cmVzKSkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHM6IGpzb25cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChqc29uLmZlYXR1cmVzICYmIGpzb24uZmVhdHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5sYXRsbmcgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uLmZlYXR1cmVzWzBdLmNlbnRlclsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzb24uZmVhdHVyZXNbMF0uY2VudGVyWzBdXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoanNvbi5mZWF0dXJlc1swXS5iYm94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuYm91bmRzID0ganNvbi5mZWF0dXJlc1swXS5iYm94O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmxib3VuZHMgPSB1dGlsLmxib3VuZHMocmVzLmJvdW5kcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICAgICAgICAgIH0gZWxzZSBjYWxsYmFjayhlcnIgfHwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBnZW9jb2RlcjtcbiAgICB9O1xuXG4gICAgLy8gYSByZXZlcnNlIGdlb2NvZGU6XG4gICAgLy9cbiAgICAvLyAgZ2VvY29kZXIucmV2ZXJzZVF1ZXJ5KFs4MCwgMjBdKVxuICAgIGdlb2NvZGVyLnJldmVyc2VRdWVyeSA9IGZ1bmN0aW9uKF8sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBxID0gJyc7XG5cbiAgICAgICAgLy8gc29ydCB0aHJvdWdoIGRpZmZlcmVudCB3YXlzIHBlb3BsZSByZXByZXNlbnQgbGF0IGFuZCBsb24gcGFpcnNcbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKHgpIHtcbiAgICAgICAgICAgIGlmICh4LmxhdCAhPT0gdW5kZWZpbmVkICYmIHgubG5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5sbmcgKyAnLCcgKyB4LmxhdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeC5sYXQgIT09IHVuZGVmaW5lZCAmJiB4LmxvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHgubG9uICsgJywnICsgeC5sYXQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB4WzBdICsgJywnICsgeFsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLmxlbmd0aCAmJiBfWzBdLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHB0cyA9IFtdOyBpIDwgXy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHB0cy5wdXNoKG5vcm1hbGl6ZShfW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxID0gcHRzLmpvaW4oJzsnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEgPSBub3JtYWxpemUoXyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0KGdlb2NvZGVyLnF1ZXJ5VVJMKHEpLCBmdW5jdGlvbihlcnIsIGpzb24pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwganNvbik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBnZW9jb2RlcjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdlb2NvZGVyO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdlb2NvZGVyID0gcmVxdWlyZSgnLi9nZW9jb2RlcicpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIEdlb2NvZGVyQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBMLk1peGluLkV2ZW50cyxcblxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgcG9zaXRpb246ICd0b3BsZWZ0JyxcbiAgICAgICAgcG9pbnRab29tOiAxNixcbiAgICAgICAga2VlcE9wZW46IGZhbHNlXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc2V0VVJMKF8pO1xuICAgIH0sXG5cbiAgICBzZXRVUkw6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5nZW9jb2RlciA9IGdlb2NvZGVyKF8sIHthY2Nlc3NUb2tlbjogdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VufSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW9jb2Rlci5nZXRVUkwoKTtcbiAgICB9LFxuXG4gICAgc2V0SUQ6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0VVJMKF8pO1xuICAgIH0sXG5cbiAgICBzZXRUaWxlSlNPTjogZnVuY3Rpb24oXykge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXRVUkwoXy5nZW9jb2Rlcik7XG4gICAgfSxcblxuICAgIF90b2dnbGU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUpIEwuRG9tRXZlbnQuc3RvcChlKTtcbiAgICAgICAgaWYgKEwuRG9tVXRpbC5oYXNDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKSkge1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ2FjdGl2ZScpO1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LmJsdXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC5zZWxlY3QoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY2xvc2VJZk9wZW46IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKEwuRG9tVXRpbC5oYXNDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKSAmJlxuICAgICAgICAgICAgIXRoaXMub3B0aW9ucy5rZWVwT3Blbikge1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ2FjdGl2ZScpO1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LmJsdXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG5cbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtbWFwYm94LWdlb2NvZGVyIGxlYWZsZXQtYmFyIGxlYWZsZXQtY29udHJvbCcpLFxuICAgICAgICAgICAgbGluayA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1nZW9jb2Rlci10b2dnbGUgbWFwYm94LWljb24gbWFwYm94LWljb24tZ2VvY29kZXInLCBjb250YWluZXIpLFxuICAgICAgICAgICAgcmVzdWx0cyA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtbWFwYm94LWdlb2NvZGVyLXJlc3VsdHMnLCBjb250YWluZXIpLFxuICAgICAgICAgICAgd3JhcCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtbWFwYm94LWdlb2NvZGVyLXdyYXAnLCBjb250YWluZXIpLFxuICAgICAgICAgICAgZm9ybSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2Zvcm0nLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1nZW9jb2Rlci1mb3JtJywgd3JhcCksXG4gICAgICAgICAgICBpbnB1dCAgPSBMLkRvbVV0aWwuY3JlYXRlKCdpbnB1dCcsICcnLCBmb3JtKTtcblxuICAgICAgICBsaW5rLmhyZWYgPSAnIyc7XG4gICAgICAgIGxpbmsuaW5uZXJIVE1MID0gJyZuYnNwOyc7XG5cbiAgICAgICAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicsICdTZWFyY2gnKTtcblxuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGZvcm0sICdzdWJtaXQnLCB0aGlzLl9nZW9jb2RlLCB0aGlzKTtcbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihjb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMuX21hcCA9IG1hcDtcbiAgICAgICAgdGhpcy5fcmVzdWx0cyA9IHJlc3VsdHM7XG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgICAgIHRoaXMuX2Zvcm0gPSBmb3JtO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMua2VlcE9wZW4pIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyhjb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21hcC5vbignY2xpY2snLCB0aGlzLl9jbG9zZUlmT3BlbiwgdGhpcyk7XG4gICAgICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGxpbmssICdjbGljaycsIHRoaXMuX3RvZ2dsZSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH0sXG5cbiAgICBfZ2VvY29kZTogZnVuY3Rpb24oZSkge1xuICAgICAgICBMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xuICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnc2VhcmNoaW5nJyk7XG5cbiAgICAgICAgdmFyIG1hcCA9IHRoaXMuX21hcDtcbiAgICAgICAgdmFyIG9ubG9hZCA9IEwuYmluZChmdW5jdGlvbihlcnIsIHJlc3ApIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9jb250YWluZXIsICdzZWFyY2hpbmcnKTtcbiAgICAgICAgICAgIGlmIChlcnIgfHwgIXJlc3AgfHwgIXJlc3AucmVzdWx0cyB8fCAhcmVzcC5yZXN1bHRzLmZlYXR1cmVzIHx8ICFyZXNwLnJlc3VsdHMuZmVhdHVyZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdlcnJvcicsIHtlcnJvcjogZXJyfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIGZlYXR1cmVzID0gcmVzcC5yZXN1bHRzLmZlYXR1cmVzO1xuICAgICAgICAgICAgICAgIGlmIChmZWF0dXJlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdhdXRvc2VsZWN0JywgeyBmZWF0dXJlOiBmZWF0dXJlc1swXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgY2hvb3NlUmVzdWx0KGZlYXR1cmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VJZk9wZW4oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IE1hdGgubWluKGZlYXR1cmVzLmxlbmd0aCwgNSk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmZWF0dXJlID0gZmVhdHVyZXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGZlYXR1cmUucGxhY2VfbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmFtZS5sZW5ndGgpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnJywgdGhpcy5fcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9ICgnaW5uZXJUZXh0JyBpbiByKSA/ICdpbm5lclRleHQnIDogJ3RleHRDb250ZW50JztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbdGV4dF0gPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgci5ocmVmID0gJyMnO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAoTC5iaW5kKGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKHIsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvb3NlUmVzdWx0KGZlYXR1cmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMLkRvbUV2ZW50LnN0b3AoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnc2VsZWN0JywgeyBmZWF0dXJlOiBmZWF0dXJlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgdGhpcykpKGZlYXR1cmUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChmZWF0dXJlcy5sZW5ndGggPiA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3V0b2YgPSBMLkRvbVV0aWwuY3JlYXRlKCdzcGFuJywgJycsIHRoaXMuX3Jlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0b2YuaW5uZXJIVE1MID0gJ1RvcCA1IG9mICcgKyBmZWF0dXJlcy5sZW5ndGggKyAnICByZXN1bHRzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2ZvdW5kJywge3Jlc3VsdHM6IHJlc3AucmVzdWx0c30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB2YXIgY2hvb3NlUmVzdWx0ID0gTC5iaW5kKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5iYm94KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwLmZpdEJvdW5kcyh1dGlsLmxib3VuZHMocmVzdWx0LmJib3gpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmNlbnRlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcC5zZXRWaWV3KFtyZXN1bHQuY2VudGVyWzFdLCByZXN1bHQuY2VudGVyWzBdXSwgKG1hcC5nZXRab29tKCkgPT09IHVuZGVmaW5lZCkgP1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9pbnRab29tIDpcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgobWFwLmdldFpvb20oKSwgdGhpcy5vcHRpb25zLnBvaW50Wm9vbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmdlb2NvZGVyLnF1ZXJ5KHRoaXMuX2lucHV0LnZhbHVlLCBvbmxvYWQpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cy5HZW9jb2RlckNvbnRyb2wgPSBHZW9jb2RlckNvbnRyb2w7XG5cbm1vZHVsZS5leHBvcnRzLmdlb2NvZGVyQ29udHJvbCA9IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IEdlb2NvZGVyQ29udHJvbChfLCBvcHRpb25zKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHV0ZkRlY29kZShjKSB7XG4gICAgaWYgKGMgPj0gOTMpIGMtLTtcbiAgICBpZiAoYyA+PSAzNSkgYy0tO1xuICAgIHJldHVybiBjIC0gMzI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgICAgICB2YXIgaWR4ID0gdXRmRGVjb2RlKGRhdGEuZ3JpZFt5XS5jaGFyQ29kZUF0KHgpKSxcbiAgICAgICAgICAgIGtleSA9IGRhdGEua2V5c1tpZHhdO1xuICAgICAgICByZXR1cm4gZGF0YS5kYXRhW2tleV07XG4gICAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgTXVzdGFjaGUgPSByZXF1aXJlKCdtdXN0YWNoZScpO1xuXG52YXIgR3JpZENvbnRyb2wgPSBMLkNvbnRyb2wuZXh0ZW5kKHtcblxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgcGlubmFibGU6IHRydWUsXG4gICAgICAgIGZvbGxvdzogZmFsc2UsXG4gICAgICAgIHNhbml0aXplcjogcmVxdWlyZSgnc2FuaXRpemUtY2FqYScpLFxuICAgICAgICB0b3VjaFRlYXNlcjogdHJ1ZSxcbiAgICAgICAgbG9jYXRpb246IHRydWVcbiAgICB9LFxuXG4gICAgX2N1cnJlbnRDb250ZW50OiAnJyxcblxuICAgIC8vIHBpbm5lZCBtZWFucyB0aGF0IHRoaXMgY29udHJvbCBpcyBvbiBhIGZlYXR1cmUgYW5kIHRoZSB1c2VyIGhhcyBsaWtlbHlcbiAgICAvLyBjbGlja2VkLiBwaW5uZWQgd2lsbCBub3QgYmVjb21lIGZhbHNlIHVubGVzcyB0aGUgdXNlciBjbGlja3Mgb2ZmXG4gICAgLy8gb2YgdGhlIGZlYXR1cmUgb250byBhbm90aGVyIG9yIGNsaWNrcyB4XG4gICAgX3Bpbm5lZDogZmFsc2UsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihfLCBvcHRpb25zKSB7XG4gICAgICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB1dGlsLnN0cmljdF9pbnN0YW5jZShfLCBMLkNsYXNzLCAnTC5tYXBib3guZ3JpZExheWVyJyk7XG4gICAgICAgIHRoaXMuX2xheWVyID0gXztcbiAgICB9LFxuXG4gICAgc2V0VGVtcGxhdGU6IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgIHV0aWwuc3RyaWN0KHRlbXBsYXRlLCAnc3RyaW5nJyk7XG4gICAgICAgIHRoaXMub3B0aW9ucy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3RlbXBsYXRlOiBmdW5jdGlvbihmb3JtYXQsIGRhdGEpIHtcbiAgICAgICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZSB8fCB0aGlzLl9sYXllci5nZXRUaWxlSlNPTigpLnRlbXBsYXRlO1xuICAgICAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHZhciBkID0ge307XG4gICAgICAgICAgICBkWydfXycgKyBmb3JtYXQgKyAnX18nXSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnNhbml0aXplcihcbiAgICAgICAgICAgICAgICBNdXN0YWNoZS50b19odG1sKHRlbXBsYXRlLCBMLmV4dGVuZChkLCBkYXRhKSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIGNoYW5nZSB0aGUgY29udGVudCBvZiB0aGUgdG9vbHRpcCBIVE1MIGlmIGl0IGhhcyBjaGFuZ2VkLCBvdGhlcndpc2VcbiAgICAvLyBub29wXG4gICAgX3Nob3c6IGZ1bmN0aW9uKGNvbnRlbnQsIG8pIHtcbiAgICAgICAgaWYgKGNvbnRlbnQgPT09IHRoaXMuX2N1cnJlbnRDb250ZW50KSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fY3VycmVudENvbnRlbnQgPSBjb250ZW50O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZm9sbG93KSB7XG4gICAgICAgICAgICB0aGlzLl9wb3B1cC5zZXRDb250ZW50KGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgLnNldExhdExuZyhvLmxhdExuZyk7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFwLl9wb3B1cCAhPT0gdGhpcy5fcG9wdXApIHRoaXMuX3BvcHVwLm9wZW5Pbih0aGlzLl9tYXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgdGhpcy5fY29udGVudFdyYXBwZXIuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcGlubmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRDb250ZW50ID0gJyc7XG5cbiAgICAgICAgdGhpcy5fbWFwLmNsb3NlUG9wdXAoKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyLmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9jb250YWluZXIsICdjbG9zYWJsZScpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfbW91c2VvdmVyOiBmdW5jdGlvbihvKSB7XG4gICAgICAgIGlmIChvLmRhdGEpIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9tYXAuX2NvbnRhaW5lciwgJ21hcC1jbGlja2FibGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9tYXAuX2NvbnRhaW5lciwgJ21hcC1jbGlja2FibGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9waW5uZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgY29udGVudCA9IHRoaXMuX3RlbXBsYXRlKCd0ZWFzZXInLCBvLmRhdGEpO1xuICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvdyhjb250ZW50LCBvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9tb3VzZW1vdmU6IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgaWYgKHRoaXMuX3Bpbm5lZCkgcmV0dXJuO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5mb2xsb3cpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9wb3B1cC5zZXRMYXRMbmcoby5sYXRMbmcpO1xuICAgIH0sXG5cbiAgICBfbmF2aWdhdGVUbzogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIHdpbmRvdy50b3AubG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICB9LFxuXG4gICAgX2NsaWNrOiBmdW5jdGlvbihvKSB7XG5cbiAgICAgICAgdmFyIGxvY2F0aW9uX2Zvcm1hdHRlZCA9IHRoaXMuX3RlbXBsYXRlKCdsb2NhdGlvbicsIG8uZGF0YSk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubG9jYXRpb24gJiYgbG9jYXRpb25fZm9ybWF0dGVkICYmXG4gICAgICAgICAgICBsb2NhdGlvbl9mb3JtYXR0ZWQuc2VhcmNoKC9eaHR0cHM/Oi8pID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmF2aWdhdGVUbyh0aGlzLl90ZW1wbGF0ZSgnbG9jYXRpb24nLCBvLmRhdGEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnBpbm5hYmxlKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzLl90ZW1wbGF0ZSgnZnVsbCcsIG8uZGF0YSk7XG5cbiAgICAgICAgaWYgKCFjb250ZW50ICYmIHRoaXMub3B0aW9ucy50b3VjaFRlYXNlciAmJiBMLkJyb3dzZXIudG91Y2gpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLl90ZW1wbGF0ZSgndGVhc2VyJywgby5kYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnY2xvc2FibGUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Bpbm5lZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9zaG93KGNvbnRlbnQsIG8pO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3Bpbm5lZCkge1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ2Nsb3NhYmxlJyk7XG4gICAgICAgICAgICB0aGlzLl9waW5uZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vblBvcHVwQ2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jdXJyZW50Q29udGVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Bpbm5lZCA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBfY3JlYXRlQ2xvc2VidXR0b246IGZ1bmN0aW9uKGNvbnRhaW5lciwgZm4pIHtcbiAgICAgICAgdmFyIGxpbmsgPSBMLkRvbVV0aWwuY3JlYXRlKCdhJywgJ2Nsb3NlJywgY29udGFpbmVyKTtcblxuICAgICAgICBsaW5rLmlubmVySFRNTCA9ICdjbG9zZSc7XG4gICAgICAgIGxpbmsuaHJlZiA9ICcjJztcbiAgICAgICAgbGluay50aXRsZSA9ICdjbG9zZSc7XG5cbiAgICAgICAgTC5Eb21FdmVudFxuICAgICAgICAgICAgLm9uKGxpbmssICdjbGljaycsIEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uKVxuICAgICAgICAgICAgLm9uKGxpbmssICdtb3VzZWRvd24nLCBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbilcbiAgICAgICAgICAgIC5vbihsaW5rLCAnZGJsY2xpY2snLCBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbilcbiAgICAgICAgICAgIC5vbihsaW5rLCAnY2xpY2snLCBMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KVxuICAgICAgICAgICAgLm9uKGxpbmssICdjbGljaycsIGZuLCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gbGluaztcbiAgICB9LFxuXG4gICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XG5cbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9ICdsZWFmbGV0LWNvbnRyb2wtZ3JpZCBtYXAtdG9vbHRpcCcsXG4gICAgICAgICAgICBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCBjbGFzc05hbWUpLFxuICAgICAgICAgICAgY29udGVudFdyYXBwZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwLXRvb2x0aXAtY29udGVudCcpO1xuXG4gICAgICAgIC8vIGhpZGUgdGhlIGNvbnRhaW5lciBlbGVtZW50IGluaXRpYWxseVxuICAgICAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5fY3JlYXRlQ2xvc2VidXR0b24oY29udGFpbmVyLCB0aGlzLmhpZGUpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY29udGVudFdyYXBwZXIpO1xuXG4gICAgICAgIHRoaXMuX2NvbnRlbnRXcmFwcGVyID0gY29udGVudFdyYXBwZXI7XG4gICAgICAgIHRoaXMuX3BvcHVwID0gbmV3IEwuUG9wdXAoeyBhdXRvUGFuOiBmYWxzZSwgY2xvc2VPbkNsaWNrOiBmYWxzZSB9KTtcblxuICAgICAgICBtYXAub24oJ3BvcHVwY2xvc2UnLCB0aGlzLl9vblBvcHVwQ2xvc2UsIHRoaXMpO1xuXG4gICAgICAgIEwuRG9tRXZlbnRcbiAgICAgICAgICAgIC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihjb250YWluZXIpXG4gICAgICAgICAgICAvLyBhbGxvdyBwZW9wbGUgdG8gc2Nyb2xsIHRvb2x0aXBzIHdpdGggbW91c2V3aGVlbFxuICAgICAgICAgICAgLmFkZExpc3RlbmVyKGNvbnRhaW5lciwgJ21vdXNld2hlZWwnLCBMLkRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbik7XG5cbiAgICAgICAgdGhpcy5fbGF5ZXJcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgdGhpcy5fbW91c2VvdmVyLCB0aGlzKVxuICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUnLCB0aGlzLl9tb3VzZW1vdmUsIHRoaXMpXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgdGhpcy5fY2xpY2ssIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlOiBmdW5jdGlvbiAobWFwKSB7XG5cbiAgICAgICAgbWFwLm9mZigncG9wdXBjbG9zZScsIHRoaXMuX29uUG9wdXBDbG9zZSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fbGF5ZXJcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlb3ZlcicsIHRoaXMuX21vdXNlb3ZlciwgdGhpcylcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlbW92ZScsIHRoaXMuX21vdXNlbW92ZSwgdGhpcylcbiAgICAgICAgICAgIC5vZmYoJ2NsaWNrJywgdGhpcy5fY2xpY2ssIHRoaXMpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cy5HcmlkQ29udHJvbCA9IEdyaWRDb250cm9sO1xuXG5tb2R1bGUuZXhwb3J0cy5ncmlkQ29udHJvbCA9IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IEdyaWRDb250cm9sKF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICB1cmwgPSByZXF1aXJlKCcuL3VybCcpLFxuICAgIHJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKSxcbiAgICBncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5cbi8vIGZvcmtlZCBmcm9tIGRhbnplbC9MLlVURkdyaWRcbnZhciBHcmlkTGF5ZXIgPSBMLkNsYXNzLmV4dGVuZCh7XG4gICAgaW5jbHVkZXM6IFtMLk1peGluLkV2ZW50cywgcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7IHJldHVybiAnJzsgfVxuICAgIH0sXG5cbiAgICBfbW91c2VPbjogbnVsbCxcbiAgICBfdGlsZWpzb246IHt9LFxuICAgIF9jYWNoZToge30sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihfLCBvcHRpb25zKSB7XG4gICAgICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9sb2FkVGlsZUpTT04oXyk7XG4gICAgfSxcblxuICAgIF9zZXRUaWxlSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgICB1dGlsLnN0cmljdChqc29uLCAnb2JqZWN0Jyk7XG5cbiAgICAgICAgTC5leHRlbmQodGhpcy5vcHRpb25zLCB7XG4gICAgICAgICAgICBncmlkczoganNvbi5ncmlkcyxcbiAgICAgICAgICAgIG1pblpvb206IGpzb24ubWluem9vbSxcbiAgICAgICAgICAgIG1heFpvb206IGpzb24ubWF4em9vbSxcbiAgICAgICAgICAgIGJvdW5kczoganNvbi5ib3VuZHMgJiYgdXRpbC5sYm91bmRzKGpzb24uYm91bmRzKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl90aWxlanNvbiA9IGpzb247XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRUaWxlSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aWxlanNvbjtcbiAgICB9LFxuXG4gICAgYWN0aXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhKHRoaXMuX21hcCAmJiB0aGlzLm9wdGlvbnMuZ3JpZHMgJiYgdGhpcy5vcHRpb25zLmdyaWRzLmxlbmd0aCk7XG4gICAgfSxcblxuICAgIGFkZFRvOiBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIG1hcC5hZGRMYXllcih0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuICAgICAgICB0aGlzLl91cGRhdGUoKTtcblxuICAgICAgICB0aGlzLl9tYXBcbiAgICAgICAgICAgIC5vbignY2xpY2snLCB0aGlzLl9jbGljaywgdGhpcylcbiAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlJywgdGhpcy5fbW92ZSwgdGhpcylcbiAgICAgICAgICAgIC5vbignbW92ZWVuZCcsIHRoaXMuX3VwZGF0ZSwgdGhpcyk7XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fbWFwXG4gICAgICAgICAgICAub2ZmKCdjbGljaycsIHRoaXMuX2NsaWNrLCB0aGlzKVxuICAgICAgICAgICAgLm9mZignbW91c2Vtb3ZlJywgdGhpcy5fbW92ZSwgdGhpcylcbiAgICAgICAgICAgIC5vZmYoJ21vdmVlbmQnLCB0aGlzLl91cGRhdGUsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBnZXREYXRhOiBmdW5jdGlvbihsYXRsbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUoKSkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBtYXAgPSB0aGlzLl9tYXAsXG4gICAgICAgICAgICBwb2ludCA9IG1hcC5wcm9qZWN0KGxhdGxuZy53cmFwKCkpLFxuICAgICAgICAgICAgdGlsZVNpemUgPSAyNTYsXG4gICAgICAgICAgICByZXNvbHV0aW9uID0gNCxcbiAgICAgICAgICAgIHggPSBNYXRoLmZsb29yKHBvaW50LnggLyB0aWxlU2l6ZSksXG4gICAgICAgICAgICB5ID0gTWF0aC5mbG9vcihwb2ludC55IC8gdGlsZVNpemUpLFxuICAgICAgICAgICAgbWF4ID0gbWFwLm9wdGlvbnMuY3JzLnNjYWxlKG1hcC5nZXRab29tKCkpIC8gdGlsZVNpemU7XG5cbiAgICAgICAgeCA9ICh4ICsgbWF4KSAlIG1heDtcbiAgICAgICAgeSA9ICh5ICsgbWF4KSAlIG1heDtcblxuICAgICAgICB0aGlzLl9nZXRUaWxlKG1hcC5nZXRab29tKCksIHgsIHksIGZ1bmN0aW9uKGdyaWQpIHtcbiAgICAgICAgICAgIHZhciBncmlkWCA9IE1hdGguZmxvb3IoKHBvaW50LnggLSAoeCAqIHRpbGVTaXplKSkgLyByZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICBncmlkWSA9IE1hdGguZmxvb3IoKHBvaW50LnkgLSAoeSAqIHRpbGVTaXplKSkgLyByZXNvbHV0aW9uKTtcblxuICAgICAgICAgICAgY2FsbGJhY2soZ3JpZChncmlkWCwgZ3JpZFkpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9jbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLmdldERhdGEoZS5sYXRsbmcsIEwuYmluZChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLmZpcmUoJ2NsaWNrJywge1xuICAgICAgICAgICAgICAgIGxhdExuZzogZS5sYXRsbmcsXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX21vdmU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5nZXREYXRhKGUubGF0bG5nLCBMLmJpbmQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEgIT09IHRoaXMuX21vdXNlT24pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbW91c2VPbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ21vdXNlb3V0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF0TG5nOiBlLmxhdGxuZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXMuX21vdXNlT25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdtb3VzZW92ZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIGxhdExuZzogZS5sYXRsbmcsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlT24gPSBkYXRhO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ21vdXNlbW92ZScsIHtcbiAgICAgICAgICAgICAgICAgICAgbGF0TG5nOiBlLmxhdGxuZyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIF9nZXRUaWxlVVJMOiBmdW5jdGlvbih0aWxlUG9pbnQpIHtcbiAgICAgICAgdmFyIHVybHMgPSB0aGlzLm9wdGlvbnMuZ3JpZHMsXG4gICAgICAgICAgICBpbmRleCA9ICh0aWxlUG9pbnQueCArIHRpbGVQb2ludC55KSAlIHVybHMubGVuZ3RoLFxuICAgICAgICAgICAgdXJsID0gdXJsc1tpbmRleF07XG5cbiAgICAgICAgcmV0dXJuIEwuVXRpbC50ZW1wbGF0ZSh1cmwsIHRpbGVQb2ludCk7XG4gICAgfSxcblxuICAgIC8vIExvYWQgdXAgYWxsIHJlcXVpcmVkIGpzb24gZ3JpZCBmaWxlc1xuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKCkpIHJldHVybjtcblxuICAgICAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCksXG4gICAgICAgICAgICB6ID0gdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgIHRpbGVTaXplID0gMjU2O1xuXG4gICAgICAgIGlmICh6ID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHwgeiA8IHRoaXMub3B0aW9ucy5taW5ab29tKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHRpbGVCb3VuZHMgPSBMLmJvdW5kcyhcbiAgICAgICAgICAgICAgICBib3VuZHMubWluLmRpdmlkZUJ5KHRpbGVTaXplKS5fZmxvb3IoKSxcbiAgICAgICAgICAgICAgICBib3VuZHMubWF4LmRpdmlkZUJ5KHRpbGVTaXplKS5fZmxvb3IoKSksXG4gICAgICAgICAgICBtYXggPSB0aGlzLl9tYXAub3B0aW9ucy5jcnMuc2NhbGUoeikgLyB0aWxlU2l6ZTtcblxuICAgICAgICBmb3IgKHZhciB4ID0gdGlsZUJvdW5kcy5taW4ueDsgeCA8PSB0aWxlQm91bmRzLm1heC54OyB4KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSB0aWxlQm91bmRzLm1pbi55OyB5IDw9IHRpbGVCb3VuZHMubWF4Lnk7IHkrKykge1xuICAgICAgICAgICAgICAgIC8vIHggd3JhcHBlZFxuICAgICAgICAgICAgICAgIHRoaXMuX2dldFRpbGUoeiwgKCh4ICUgbWF4KSArIG1heCkgJSBtYXgsICgoeSAlIG1heCkgKyBtYXgpICUgbWF4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZ2V0VGlsZTogZnVuY3Rpb24oeiwgeCwgeSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGtleSA9IHogKyAnXycgKyB4ICsgJ18nICsgeSxcbiAgICAgICAgICAgIHRpbGVQb2ludCA9IEwucG9pbnQoeCwgeSk7XG5cbiAgICAgICAgdGlsZVBvaW50LnogPSB6O1xuXG4gICAgICAgIGlmICghdGhpcy5fdGlsZVNob3VsZEJlTG9hZGVkKHRpbGVQb2ludCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgaW4gdGhpcy5fY2FjaGUpIHtcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jYWNoZVtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5fY2FjaGVba2V5XSk7IC8vIEFscmVhZHkgbG9hZGVkXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlW2tleV0ucHVzaChjYWxsYmFjayk7IC8vIFBlbmRpbmdcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2FjaGVba2V5XSA9IFtdO1xuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5fY2FjaGVba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3QodGhpcy5fZ2V0VGlsZVVSTCh0aWxlUG9pbnQpLCBMLmJpbmQoZnVuY3Rpb24oZXJyLCBqc29uKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FjaGVba2V5XTtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlW2tleV0gPSBncmlkKGpzb24pO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0odGhpcy5fY2FjaGVba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX3RpbGVTaG91bGRCZUxvYWRlZDogZnVuY3Rpb24odGlsZVBvaW50KSB7XG4gICAgICAgIGlmICh0aWxlUG9pbnQueiA+IHRoaXMub3B0aW9ucy5tYXhab29tIHx8IHRpbGVQb2ludC56IDwgdGhpcy5vcHRpb25zLm1pblpvb20pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYm91bmRzKSB7XG4gICAgICAgICAgICB2YXIgdGlsZVNpemUgPSAyNTYsXG4gICAgICAgICAgICAgICAgbndQb2ludCA9IHRpbGVQb2ludC5tdWx0aXBseUJ5KHRpbGVTaXplKSxcbiAgICAgICAgICAgICAgICBzZVBvaW50ID0gbndQb2ludC5hZGQobmV3IEwuUG9pbnQodGlsZVNpemUsIHRpbGVTaXplKSksXG4gICAgICAgICAgICAgICAgbncgPSB0aGlzLl9tYXAudW5wcm9qZWN0KG53UG9pbnQpLFxuICAgICAgICAgICAgICAgIHNlID0gdGhpcy5fbWFwLnVucHJvamVjdChzZVBvaW50KSxcbiAgICAgICAgICAgICAgICBib3VuZHMgPSBuZXcgTC5MYXRMbmdCb3VuZHMoW253LCBzZV0pO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5ib3VuZHMuaW50ZXJzZWN0cyhib3VuZHMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzLkdyaWRMYXllciA9IEdyaWRMYXllcjtcblxubW9kdWxlLmV4cG9ydHMuZ3JpZExheWVyID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgR3JpZExheWVyKF8sIG9wdGlvbnMpO1xufTtcbiIsInJlcXVpcmUoJy4vbGVhZmxldCcpO1xucmVxdWlyZSgnLi9tYXBib3gnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEluZm9Db250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG4gICAgb3B0aW9uczoge1xuICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbXJpZ2h0JyxcbiAgICAgICAgc2FuaXRpemVyOiByZXF1aXJlKCdzYW5pdGl6ZS1jYWphJylcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2luZm8gPSB7fTtcbiAgICB9LFxuXG4gICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwYm94LWNvbnRyb2wtaW5mbyBtYXBib3gtc21hbGwnKTtcbiAgICAgICAgdGhpcy5fY29udGVudCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXAtaW5mby1jb250YWluZXInLCB0aGlzLl9jb250YWluZXIpO1xuXG4gICAgICAgIHZhciBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICdtYXBib3gtaW5mby10b2dnbGUgbWFwYm94LWljb24gbWFwYm94LWljb24taW5mbycsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIGxpbmsuaHJlZiA9ICcjJztcblxuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGxpbmssICdjbGljaycsIHRoaXMuX3Nob3dJbmZvLCB0aGlzKTtcbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbih0aGlzLl9jb250YWluZXIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gbWFwLl9sYXllcnMpIHtcbiAgICAgICAgICAgIGlmIChtYXAuX2xheWVyc1tpXS5nZXRBdHRyaWJ1dGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5mbyhtYXAuX2xheWVyc1tpXS5nZXRBdHRyaWJ1dGlvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hcFxuICAgICAgICAgICAgLm9uKCdsYXllcmFkZCcsIHRoaXMuX29uTGF5ZXJBZGQsIHRoaXMpXG4gICAgICAgICAgICAub24oJ2xheWVycmVtb3ZlJywgdGhpcy5fb25MYXllclJlbW92ZSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgbWFwXG4gICAgICAgICAgICAub2ZmKCdsYXllcmFkZCcsIHRoaXMuX29uTGF5ZXJBZGQsIHRoaXMpXG4gICAgICAgICAgICAub2ZmKCdsYXllcnJlbW92ZScsIHRoaXMuX29uTGF5ZXJSZW1vdmUsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBhZGRJbmZvOiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIGlmICghdGV4dCkgcmV0dXJuIHRoaXM7XG4gICAgICAgIGlmICghdGhpcy5faW5mb1t0ZXh0XSkgdGhpcy5faW5mb1t0ZXh0XSA9IDA7XG4gICAgICAgIHRoaXMuX2luZm9bdGV4dF0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5fdXBkYXRlKCk7XG4gICAgfSxcblxuICAgIHJlbW92ZUluZm86IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgIGlmICghdGV4dCkgcmV0dXJuIHRoaXM7XG4gICAgICAgIGlmICh0aGlzLl9pbmZvW3RleHRdKSB0aGlzLl9pbmZvW3RleHRdID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgX3Nob3dJbmZvOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQoZSk7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUgPT09IHRydWUpIHJldHVybiB0aGlzLl9oaWRlY29udGVudCgpO1xuXG4gICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgfSxcblxuICAgIF9oaWRlY29udGVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnYWN0aXZlJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWFwKSB7IHJldHVybiB0aGlzOyB9XG4gICAgICAgIHRoaXMuX2NvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHZhciBoaWRlID0gJ25vbmUnO1xuICAgICAgICB2YXIgaW5mbyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5faW5mbykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luZm8uaGFzT3duUHJvcGVydHkoaSkgJiYgdGhpcy5faW5mb1tpXSkge1xuICAgICAgICAgICAgICAgIGluZm8ucHVzaCh0aGlzLm9wdGlvbnMuc2FuaXRpemVyKGkpKTtcbiAgICAgICAgICAgICAgICBoaWRlID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRlbnQuaW5uZXJIVE1MICs9IGluZm8uam9pbignIHwgJyk7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIHJlc3VsdHMgaW4gX2luZm8gdGhlbiBoaWRlIHRoaXMuXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gaGlkZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9vbkxheWVyQWRkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLmxheWVyLmdldEF0dHJpYnV0aW9uICYmIGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRJbmZvKGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoJ29uJyBpbiBlLmxheWVyICYmIGUubGF5ZXIuZ2V0QXR0cmlidXRpb24pIHtcbiAgICAgICAgICAgIGUubGF5ZXIub24oJ3JlYWR5JywgTC5iaW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5mbyhlLmxheWVyLmdldEF0dHJpYnV0aW9uKCkpO1xuICAgICAgICAgICAgfSwgdGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkxheWVyUmVtb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZS5sYXllci5nZXRBdHRyaWJ1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVJbmZvKGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMuSW5mb0NvbnRyb2wgPSBJbmZvQ29udHJvbDtcblxubW9kdWxlLmV4cG9ydHMuaW5mb0NvbnRyb2wgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZvQ29udHJvbChvcHRpb25zKTtcbn07XG4iLCJ3aW5kb3cuTCA9IHJlcXVpcmUoJ2xlYWZsZXQvZGlzdC9sZWFmbGV0LXNyYycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGVnZW5kQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbXJpZ2h0JyxcbiAgICAgICAgc2FuaXRpemVyOiByZXF1aXJlKCdzYW5pdGl6ZS1jYWphJylcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2xlZ2VuZHMgPSB7fTtcbiAgICB9LFxuXG4gICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwLWxlZ2VuZHMgd2F4LWxlZ2VuZHMnKTtcbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbih0aGlzLl9jb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gICAgfSxcblxuICAgIGFkZExlZ2VuZDogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICBpZiAoIXRleHQpIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICBpZiAoIXRoaXMuX2xlZ2VuZHNbdGV4dF0pIHtcbiAgICAgICAgICAgIHRoaXMuX2xlZ2VuZHNbdGV4dF0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbGVnZW5kc1t0ZXh0XSsrO1xuICAgICAgICByZXR1cm4gdGhpcy5fdXBkYXRlKCk7XG4gICAgfSxcblxuICAgIHJlbW92ZUxlZ2VuZDogZnVuY3Rpb24odGV4dCkge1xuICAgICAgICBpZiAoIXRleHQpIHsgcmV0dXJuIHRoaXM7IH1cbiAgICAgICAgaWYgKHRoaXMuX2xlZ2VuZHNbdGV4dF0pIHRoaXMuX2xlZ2VuZHNbdGV4dF0tLTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXApIHsgcmV0dXJuIHRoaXM7IH1cblxuICAgICAgICB0aGlzLl9jb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHZhciBoaWRlID0gJ25vbmUnO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5fbGVnZW5kcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xlZ2VuZHMuaGFzT3duUHJvcGVydHkoaSkgJiYgdGhpcy5fbGVnZW5kc1tpXSkge1xuICAgICAgICAgICAgICAgIHZhciBkaXYgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwLWxlZ2VuZCB3YXgtbGVnZW5kJywgdGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLnNhbml0aXplcihpKTtcbiAgICAgICAgICAgICAgICBoaWRlID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhpZGUgdGhlIGNvbnRyb2wgZW50aXJlbHkgdW5sZXNzIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBsZWdlbmQ7XG4gICAgICAgIC8vIG90aGVyd2lzZSB0aGVyZSB3aWxsIGJlIGEgc21hbGwgZ3JleSBibGVtaXNoIG9uIHRoZSBtYXAuXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gaGlkZTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMuTGVnZW5kQ29udHJvbCA9IExlZ2VuZENvbnRyb2w7XG5cbm1vZHVsZS5leHBvcnRzLmxlZ2VuZENvbnRyb2wgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBMZWdlbmRDb250cm9sKG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKSxcbiAgICB1cmwgPSByZXF1aXJlKCcuL3VybCcpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgX2xvYWRUaWxlSlNPTjogZnVuY3Rpb24oXykge1xuICAgICAgICBpZiAodHlwZW9mIF8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBfID0gdXJsLnRpbGVKU09OKF8sIHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW4pO1xuICAgICAgICAgICAgcmVxdWVzdChfLCBMLmJpbmQoZnVuY3Rpb24oZXJyLCBqc29uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICB1dGlsLmxvZygnY291bGQgbm90IGxvYWQgVGlsZUpTT04gYXQgJyArIF8pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge2Vycm9yOiBlcnJ9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGpzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0VGlsZUpTT04oanNvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgncmVhZHknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXyAmJiB0eXBlb2YgXyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldFRpbGVKU09OKF8pO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICB0aWxlTGF5ZXIgPSByZXF1aXJlKCcuL3RpbGVfbGF5ZXInKS50aWxlTGF5ZXIsXG4gICAgZmVhdHVyZUxheWVyID0gcmVxdWlyZSgnLi9mZWF0dXJlX2xheWVyJykuZmVhdHVyZUxheWVyLFxuICAgIGdyaWRMYXllciA9IHJlcXVpcmUoJy4vZ3JpZF9sYXllcicpLmdyaWRMYXllcixcbiAgICBncmlkQ29udHJvbCA9IHJlcXVpcmUoJy4vZ3JpZF9jb250cm9sJykuZ3JpZENvbnRyb2wsXG4gICAgaW5mb0NvbnRyb2wgPSByZXF1aXJlKCcuL2luZm9fY29udHJvbCcpLmluZm9Db250cm9sLFxuICAgIHNoYXJlQ29udHJvbCA9IHJlcXVpcmUoJy4vc2hhcmVfY29udHJvbCcpLnNoYXJlQ29udHJvbCxcbiAgICBsZWdlbmRDb250cm9sID0gcmVxdWlyZSgnLi9sZWdlbmRfY29udHJvbCcpLmxlZ2VuZENvbnRyb2w7XG5cbmZ1bmN0aW9uIHdpdGhBY2Nlc3NUb2tlbihvcHRpb25zLCBhY2Nlc3NUb2tlbikge1xuICAgIGlmICghYWNjZXNzVG9rZW4gfHwgb3B0aW9ucy5hY2Nlc3NUb2tlbilcbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgcmV0dXJuIEwuZXh0ZW5kKHthY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW59LCBvcHRpb25zKTtcbn1cblxudmFyIExNYXAgPSBMLk1hcC5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBbcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICB0aWxlTGF5ZXI6IHt9LFxuICAgICAgICBmZWF0dXJlTGF5ZXI6IHt9LFxuICAgICAgICBncmlkTGF5ZXI6IHt9LFxuICAgICAgICBsZWdlbmRDb250cm9sOiB7fSxcbiAgICAgICAgZ3JpZENvbnRyb2w6IHt9LFxuICAgICAgICBpbmZvQ29udHJvbDogZmFsc2UsXG4gICAgICAgIHNoYXJlQ29udHJvbDogZmFsc2VcbiAgICB9LFxuXG4gICAgX3RpbGVqc29uOiB7fSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKGVsZW1lbnQsIF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5NYXAucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgICAvLyBkaXNhYmxlIHRoZSBkZWZhdWx0ICdMZWFmbGV0JyB0ZXh0XG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0aW9uQ29udHJvbCkgdGhpcy5hdHRyaWJ1dGlvbkNvbnRyb2wuc2V0UHJlZml4KCcnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpbGVMYXllcikge1xuICAgICAgICAgICAgdGhpcy50aWxlTGF5ZXIgPSB0aWxlTGF5ZXIodW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHdpdGhBY2Nlc3NUb2tlbih0aGlzLm9wdGlvbnMudGlsZUxheWVyLCB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW4pKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXIodGhpcy50aWxlTGF5ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mZWF0dXJlTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZUxheWVyID0gZmVhdHVyZUxheWVyKHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB3aXRoQWNjZXNzVG9rZW4odGhpcy5vcHRpb25zLmZlYXR1cmVMYXllciwgdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VuKSk7XG4gICAgICAgICAgICB0aGlzLmFkZExheWVyKHRoaXMuZmVhdHVyZUxheWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZExheWVyKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRMYXllciA9IGdyaWRMYXllcih1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgd2l0aEFjY2Vzc1Rva2VuKHRoaXMub3B0aW9ucy5ncmlkTGF5ZXIsIHRoaXMub3B0aW9ucy5hY2Nlc3NUb2tlbikpO1xuICAgICAgICAgICAgdGhpcy5hZGRMYXllcih0aGlzLmdyaWRMYXllcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmdyaWRMYXllciAmJiB0aGlzLm9wdGlvbnMuZ3JpZENvbnRyb2wpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZENvbnRyb2wgPSBncmlkQ29udHJvbCh0aGlzLmdyaWRMYXllciwgdGhpcy5vcHRpb25zLmdyaWRDb250cm9sKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQ29udHJvbCh0aGlzLmdyaWRDb250cm9sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5mb0NvbnRyb2wpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRyb2wgPSBpbmZvQ29udHJvbCh0aGlzLm9wdGlvbnMuaW5mb0NvbnRyb2wpO1xuICAgICAgICAgICAgdGhpcy5hZGRDb250cm9sKHRoaXMuaW5mb0NvbnRyb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sZWdlbmRDb250cm9sKSB7XG4gICAgICAgICAgICB0aGlzLmxlZ2VuZENvbnRyb2wgPSBsZWdlbmRDb250cm9sKHRoaXMub3B0aW9ucy5sZWdlbmRDb250cm9sKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQ29udHJvbCh0aGlzLmxlZ2VuZENvbnRyb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaGFyZUNvbnRyb2wpIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcmVDb250cm9sID0gc2hhcmVDb250cm9sKHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB3aXRoQWNjZXNzVG9rZW4odGhpcy5vcHRpb25zLnNoYXJlQ29udHJvbCwgdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VuKSk7XG4gICAgICAgICAgICB0aGlzLmFkZENvbnRyb2wodGhpcy5zaGFyZUNvbnRyb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbG9hZFRpbGVKU09OKF8pO1xuICAgIH0sXG5cbiAgICAvLyBVcGRhdGUgY2VydGFpbiBwcm9wZXJ0aWVzIG9uICdyZWFkeScgZXZlbnRcbiAgICBhZGRMYXllcjogZnVuY3Rpb24obGF5ZXIpIHtcbiAgICAgICAgaWYgKCdvbicgaW4gbGF5ZXIpIHsgbGF5ZXIub24oJ3JlYWR5JywgTC5iaW5kKGZ1bmN0aW9uKCkgeyB0aGlzLl91cGRhdGVMYXllcihsYXllcik7IH0sIHRoaXMpKTsgfVxuICAgICAgICByZXR1cm4gTC5NYXAucHJvdG90eXBlLmFkZExheWVyLmNhbGwodGhpcywgbGF5ZXIpO1xuICAgIH0sXG5cbiAgICAvLyB1c2UgYSBqYXZhc2NyaXB0IG9iamVjdCBvZiB0aWxlanNvbiBkYXRhIHRvIGNvbmZpZ3VyZSB0aGlzIGxheWVyXG4gICAgX3NldFRpbGVKU09OOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHRoaXMuX3RpbGVqc29uID0gXztcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZShfKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFRpbGVKU09OOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RpbGVqc29uO1xuICAgIH0sXG5cbiAgICBfaW5pdGlhbGl6ZTogZnVuY3Rpb24oanNvbikge1xuICAgICAgICBpZiAodGhpcy50aWxlTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMudGlsZUxheWVyLl9zZXRUaWxlSlNPTihqc29uKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUxheWVyKHRoaXMudGlsZUxheWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmZlYXR1cmVMYXllciAmJiAhdGhpcy5mZWF0dXJlTGF5ZXIuZ2V0R2VvSlNPTigpICYmIGpzb24uZGF0YSAmJiBqc29uLmRhdGFbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuZmVhdHVyZUxheWVyLmxvYWRVUkwoanNvbi5kYXRhWzBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdyaWRMYXllcikge1xuICAgICAgICAgICAgdGhpcy5ncmlkTGF5ZXIuX3NldFRpbGVKU09OKGpzb24pO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGF5ZXIodGhpcy5ncmlkTGF5ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaW5mb0NvbnRyb2wgJiYganNvbi5hdHRyaWJ1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5pbmZvQ29udHJvbC5hZGRJbmZvKGpzb24uYXR0cmlidXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubGVnZW5kQ29udHJvbCAmJiBqc29uLmxlZ2VuZCkge1xuICAgICAgICAgICAgdGhpcy5sZWdlbmRDb250cm9sLmFkZExlZ2VuZChqc29uLmxlZ2VuZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zaGFyZUNvbnRyb2wpIHtcbiAgICAgICAgICAgIHRoaXMuc2hhcmVDb250cm9sLl9zZXRUaWxlSlNPTihqc29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fbG9hZGVkICYmIGpzb24uY2VudGVyKSB7XG4gICAgICAgICAgICB2YXIgem9vbSA9IGpzb24uY2VudGVyWzJdLFxuICAgICAgICAgICAgICAgIGNlbnRlciA9IEwubGF0TG5nKGpzb24uY2VudGVyWzFdLCBqc29uLmNlbnRlclswXSk7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0VmlldyhjZW50ZXIsIHpvb20pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9lZGl0TGluazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fY29udHJvbENvbnRhaW5lci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKSByZXR1cm47XG4gICAgICAgIHZhciBsaW5rID0gdGhpcy5fY29udHJvbENvbnRhaW5lci5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYXBib3gtaW1wcm92ZS1tYXAnKTtcbiAgICAgICAgaWYgKGxpbmsubGVuZ3RoICYmIHRoaXMuX2xvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGNlbnRlciA9IHRoaXMuZ2V0Q2VudGVyKCkud3JhcCgpO1xuICAgICAgICAgICAgdmFyIHRpbGVqc29uID0gdGhpcy5fdGlsZWpzb24gfHwge307XG4gICAgICAgICAgICB2YXIgaWQgPSB0aWxlanNvbi5pZCB8fCAnJztcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGlua1tpXS5ocmVmID0gbGlua1tpXS5ocmVmLnNwbGl0KCcjJylbMF0gKyAnIycgKyBpZCArICcvJyArXG4gICAgICAgICAgICAgICAgICAgIGNlbnRlci5sbmcudG9GaXhlZCgzKSArICcvJyArXG4gICAgICAgICAgICAgICAgICAgIGNlbnRlci5sYXQudG9GaXhlZCgzKSArICcvJyArXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVMYXllcjogZnVuY3Rpb24obGF5ZXIpIHtcbiAgICAgICAgaWYgKCFsYXllci5vcHRpb25zKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuaW5mb0NvbnRyb2wgJiYgdGhpcy5fbG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmluZm9Db250cm9sLmFkZEluZm8obGF5ZXIub3B0aW9ucy5pbmZvQ29udHJvbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5hdHRyaWJ1dGlvbkNvbnRyb2wgJiYgdGhpcy5fbG9hZGVkICYmIGxheWVyLmdldEF0dHJpYnV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0aW9uQ29udHJvbC5hZGRBdHRyaWJ1dGlvbihsYXllci5nZXRBdHRyaWJ1dGlvbigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub24oJ21vdmVlbmQnLCB0aGlzLl9lZGl0TGluaywgdGhpcyk7XG5cbiAgICAgICAgaWYgKCEoTC5zdGFtcChsYXllcikgaW4gdGhpcy5fem9vbUJvdW5kTGF5ZXJzKSAmJlxuICAgICAgICAgICAgICAgIChsYXllci5vcHRpb25zLm1heFpvb20gfHwgbGF5ZXIub3B0aW9ucy5taW5ab29tKSkge1xuICAgICAgICAgICAgdGhpcy5fem9vbUJvdW5kTGF5ZXJzW0wuc3RhbXAobGF5ZXIpXSA9IGxheWVyO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZWRpdExpbmsoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlWm9vbUxldmVscygpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cy5NYXAgPSBMTWFwO1xuXG5tb2R1bGUuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbihlbGVtZW50LCBfLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBMTWFwKGVsZW1lbnQsIF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gSGFyZGNvZGUgaW1hZ2UgcGF0aCwgYmVjYXVzZSBMZWFmbGV0J3MgYXV0b2RldGVjdGlvblxuLy8gZmFpbHMsIGJlY2F1c2UgbWFwYm94LmpzIGlzIG5vdCBuYW1lZCBsZWFmbGV0LmpzXG53aW5kb3cuTC5JY29uLkRlZmF1bHQuaW1hZ2VQYXRoID0gJy8vYXBpLnRpbGVzLm1hcGJveC5jb20vbWFwYm94LmpzLycgKyAndicgK1xuICAgIHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb24gKyAnL2ltYWdlcyc7XG5cbnZhciBnZW9jb2RlckNvbnRyb2wgPSByZXF1aXJlKCcuL2dlb2NvZGVyX2NvbnRyb2wnKSxcbiAgICBncmlkQ29udHJvbCA9IHJlcXVpcmUoJy4vZ3JpZF9jb250cm9sJyksXG4gICAgZmVhdHVyZUxheWVyID0gcmVxdWlyZSgnLi9mZWF0dXJlX2xheWVyJyksXG4gICAgbGVnZW5kQ29udHJvbCA9IHJlcXVpcmUoJy4vbGVnZW5kX2NvbnRyb2wnKSxcbiAgICBzaGFyZUNvbnRyb2wgPSByZXF1aXJlKCcuL3NoYXJlX2NvbnRyb2wnKSxcbiAgICB0aWxlTGF5ZXIgPSByZXF1aXJlKCcuL3RpbGVfbGF5ZXInKSxcbiAgICBpbmZvQ29udHJvbCA9IHJlcXVpcmUoJy4vaW5mb19jb250cm9sJyksXG4gICAgbWFwID0gcmVxdWlyZSgnLi9tYXAnKSxcbiAgICBncmlkTGF5ZXIgPSByZXF1aXJlKCcuL2dyaWRfbGF5ZXInKTtcblxuTC5tYXBib3ggPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBWRVJTSU9OOiByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLFxuICAgIGdlb2NvZGVyOiByZXF1aXJlKCcuL2dlb2NvZGVyJyksXG4gICAgbWFya2VyOiByZXF1aXJlKCcuL21hcmtlcicpLFxuICAgIHNpbXBsZXN0eWxlOiByZXF1aXJlKCcuL3NpbXBsZXN0eWxlJyksXG4gICAgdGlsZUxheWVyOiB0aWxlTGF5ZXIudGlsZUxheWVyLFxuICAgIFRpbGVMYXllcjogdGlsZUxheWVyLlRpbGVMYXllcixcbiAgICBpbmZvQ29udHJvbDogaW5mb0NvbnRyb2wuaW5mb0NvbnRyb2wsXG4gICAgSW5mb0NvbnRyb2w6IGluZm9Db250cm9sLkluZm9Db250cm9sLFxuICAgIHNoYXJlQ29udHJvbDogc2hhcmVDb250cm9sLnNoYXJlQ29udHJvbCxcbiAgICBTaGFyZUNvbnRyb2w6IHNoYXJlQ29udHJvbC5TaGFyZUNvbnRyb2wsXG4gICAgbGVnZW5kQ29udHJvbDogbGVnZW5kQ29udHJvbC5sZWdlbmRDb250cm9sLFxuICAgIExlZ2VuZENvbnRyb2w6IGxlZ2VuZENvbnRyb2wuTGVnZW5kQ29udHJvbCxcbiAgICBnZW9jb2RlckNvbnRyb2w6IGdlb2NvZGVyQ29udHJvbC5nZW9jb2RlckNvbnRyb2wsXG4gICAgR2VvY29kZXJDb250cm9sOiBnZW9jb2RlckNvbnRyb2wuR2VvY29kZXJDb250cm9sLFxuICAgIGdyaWRDb250cm9sOiBncmlkQ29udHJvbC5ncmlkQ29udHJvbCxcbiAgICBHcmlkQ29udHJvbDogZ3JpZENvbnRyb2wuR3JpZENvbnRyb2wsXG4gICAgZ3JpZExheWVyOiBncmlkTGF5ZXIuZ3JpZExheWVyLFxuICAgIEdyaWRMYXllcjogZ3JpZExheWVyLkdyaWRMYXllcixcbiAgICBmZWF0dXJlTGF5ZXI6IGZlYXR1cmVMYXllci5mZWF0dXJlTGF5ZXIsXG4gICAgRmVhdHVyZUxheWVyOiBmZWF0dXJlTGF5ZXIuRmVhdHVyZUxheWVyLFxuICAgIG1hcDogbWFwLm1hcCxcbiAgICBNYXA6IG1hcC5NYXAsXG4gICAgY29uZmlnOiByZXF1aXJlKCcuL2NvbmZpZycpLFxuICAgIHNhbml0aXplOiByZXF1aXJlKCdzYW5pdGl6ZS1jYWphJyksXG4gICAgdGVtcGxhdGU6IHJlcXVpcmUoJ211c3RhY2hlJykudG9faHRtbFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHVybCA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHNhbml0aXplID0gcmVxdWlyZSgnc2FuaXRpemUtY2FqYScpO1xuXG4vLyBtYXBib3gtcmVsYXRlZCBtYXJrZXJzIGZ1bmN0aW9uYWxpdHlcbi8vIHByb3ZpZGUgYW4gaWNvbiBmcm9tIG1hcGJveCdzIHNpbXBsZS1zdHlsZSBzcGVjIGFuZCBob3N0ZWQgbWFya2Vyc1xuLy8gc2VydmljZVxuZnVuY3Rpb24gaWNvbihmcCwgb3B0aW9ucykge1xuICAgIGZwID0gZnAgfHwge307XG5cbiAgICB2YXIgc2l6ZXMgPSB7XG4gICAgICAgICAgICBzbWFsbDogWzIwLCA1MF0sXG4gICAgICAgICAgICBtZWRpdW06IFszMCwgNzBdLFxuICAgICAgICAgICAgbGFyZ2U6IFszNSwgOTBdXG4gICAgICAgIH0sXG4gICAgICAgIHNpemUgPSBmcFsnbWFya2VyLXNpemUnXSB8fCAnbWVkaXVtJyxcbiAgICAgICAgc3ltYm9sID0gKGZwWydtYXJrZXItc3ltYm9sJ10pID8gJy0nICsgZnBbJ21hcmtlci1zeW1ib2wnXSA6ICcnLFxuICAgICAgICBjb2xvciA9IChmcFsnbWFya2VyLWNvbG9yJ10gfHwgJzdlN2U3ZScpLnJlcGxhY2UoJyMnLCAnJyk7XG5cbiAgICByZXR1cm4gTC5pY29uKHtcbiAgICAgICAgaWNvblVybDogdXJsKCcvbWFya2VyLycgK1xuICAgICAgICAgICAgJ3Bpbi0nICsgc2l6ZS5jaGFyQXQoMCkgKyBzeW1ib2wgKyAnKycgKyBjb2xvciArXG4gICAgICAgICAgICAvLyBkZXRlY3QgYW5kIHVzZSByZXRpbmEgbWFya2Vycywgd2hpY2ggYXJlIHgyIHJlc29sdXRpb25cbiAgICAgICAgICAgIChMLkJyb3dzZXIucmV0aW5hID8gJ0AyeCcgOiAnJykgKyAnLnBuZycsIG9wdGlvbnMgJiYgb3B0aW9ucy5hY2Nlc3NUb2tlbiksXG4gICAgICAgIGljb25TaXplOiBzaXplc1tzaXplXSxcbiAgICAgICAgaWNvbkFuY2hvcjogW3NpemVzW3NpemVdWzBdIC8gMiwgc2l6ZXNbc2l6ZV1bMV0gLyAyXSxcbiAgICAgICAgcG9wdXBBbmNob3I6IFswLCAtc2l6ZXNbc2l6ZV1bMV0gLyAyXVxuICAgIH0pO1xufVxuXG4vLyBhIGZhY3RvcnkgdGhhdCBwcm92aWRlcyBtYXJrZXJzIGZvciBMZWFmbGV0IGZyb20gTWFwYm94J3Ncbi8vIFtzaW1wbGUtc3R5bGUgc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9zaW1wbGVzdHlsZS1zcGVjKVxuLy8gYW5kIFtNYXJrZXJzIEFQSV0oaHR0cDovL21hcGJveC5jb20vZGV2ZWxvcGVycy9hcGkvI21hcmtlcnMpLlxuZnVuY3Rpb24gc3R5bGUoZiwgbGF0bG9uLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIEwubWFya2VyKGxhdGxvbiwge1xuICAgICAgICBpY29uOiBpY29uKGYucHJvcGVydGllcywgb3B0aW9ucyksXG4gICAgICAgIHRpdGxlOiB1dGlsLnN0cmlwX3RhZ3MoXG4gICAgICAgICAgICBzYW5pdGl6ZSgoZi5wcm9wZXJ0aWVzICYmIGYucHJvcGVydGllcy50aXRsZSkgfHwgJycpKVxuICAgIH0pO1xufVxuXG4vLyBTYW5pdGl6ZSBhbmQgZm9ybWF0IHByb3BlcnRpZXMgb2YgYSBHZW9KU09OIEZlYXR1cmUgb2JqZWN0IGluIG9yZGVyXG4vLyB0byBmb3JtIHRoZSBIVE1MIHN0cmluZyB1c2VkIGFzIHRoZSBhcmd1bWVudCBmb3IgYEwuY3JlYXRlUG9wdXBgXG5mdW5jdGlvbiBjcmVhdGVQb3B1cChmLCBzYW5pdGl6ZXIpIHtcbiAgICBpZiAoIWYgfHwgIWYucHJvcGVydGllcykgcmV0dXJuICcnO1xuICAgIHZhciBwb3B1cCA9ICcnO1xuXG4gICAgaWYgKGYucHJvcGVydGllcy50aXRsZSkge1xuICAgICAgICBwb3B1cCArPSAnPGRpdiBjbGFzcz1cIm1hcmtlci10aXRsZVwiPicgKyBmLnByb3BlcnRpZXMudGl0bGUgKyAnPC9kaXY+JztcbiAgICB9XG5cbiAgICBpZiAoZi5wcm9wZXJ0aWVzLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHBvcHVwICs9ICc8ZGl2IGNsYXNzPVwibWFya2VyLWRlc2NyaXB0aW9uXCI+JyArIGYucHJvcGVydGllcy5kZXNjcmlwdGlvbiArICc8L2Rpdj4nO1xuICAgIH1cblxuICAgIHJldHVybiAoc2FuaXRpemVyIHx8IHNhbml0aXplKShwb3B1cCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGljb246IGljb24sXG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIGNyZWF0ZVBvcHVwOiBjcmVhdGVQb3B1cFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvcnNsaXRlID0gcmVxdWlyZSgnY29yc2xpdGUnKSxcbiAgICBzdHJpY3QgPSByZXF1aXJlKCcuL3V0aWwnKS5zdHJpY3QsXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKSxcbiAgICBwcm90b2NvbCA9IC9eKGh0dHBzPzopPyg/PVxcL1xcLygufGFwaSlcXC50aWxlc1xcLm1hcGJveFxcLmNvbVxcLykvO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICBzdHJpY3QodXJsLCAnc3RyaW5nJyk7XG4gICAgc3RyaWN0KGNhbGxiYWNrLCAnZnVuY3Rpb24nKTtcblxuICAgIHVybCA9IHVybC5yZXBsYWNlKHByb3RvY29sLCBmdW5jdGlvbihtYXRjaCwgcHJvdG9jb2wpIHtcbiAgICAgICAgaWYgKCEoJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpKSkge1xuICAgICAgICAgICAgLy8gWERvbWFpblJlcXVlc3QgaW4gdXNlOyBkb2Vzbid0IHN1cHBvcnQgY3Jvc3MtcHJvdG9jb2wgcmVxdWVzdHNcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbDtcbiAgICAgICAgfSBlbHNlIGlmICgnaHR0cHM6JyA9PT0gcHJvdG9jb2wgfHwgJ2h0dHBzOicgPT09IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sIHx8IGNvbmZpZy5GT1JDRV9IVFRQUykge1xuICAgICAgICAgICAgcmV0dXJuICdodHRwczonO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICdodHRwOic7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjb3JzbGl0ZSh1cmwsIG9ubG9hZCk7XG4gICAgZnVuY3Rpb24gb25sb2FkKGVyciwgcmVzcCkge1xuICAgICAgICBpZiAoIWVyciAmJiByZXNwKSB7XG4gICAgICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soZXJyLCByZXNwKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXJsaGVscGVyID0gcmVxdWlyZSgnLi91cmwnKTtcblxudmFyIFNoYXJlQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBbcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgICAgICB1cmw6ICcnXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9sb2FkVGlsZUpTT04oXyk7XG4gICAgfSxcblxuICAgIF9zZXRUaWxlSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgICB0aGlzLl90aWxlanNvbiA9IGpzb247XG4gICAgfSxcblxuICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuXG4gICAgICAgIHZhciBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1zaGFyZSBsZWFmbGV0LWJhcicpO1xuICAgICAgICB2YXIgbGluayA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnbWFwYm94LXNoYXJlIG1hcGJveC1pY29uIG1hcGJveC1pY29uLXNoYXJlJywgY29udGFpbmVyKTtcbiAgICAgICAgbGluay5ocmVmID0gJyMnO1xuXG4gICAgICAgIHRoaXMuX21vZGFsID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ21hcGJveC1tb2RhbCcsIHRoaXMuX21hcC5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fbWFzayA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXBib3gtbW9kYWwtbWFzaycsIHRoaXMuX21vZGFsKTtcbiAgICAgICAgdGhpcy5fY29udGVudCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXBib3gtbW9kYWwtY29udGVudCcsIHRoaXMuX21vZGFsKTtcblxuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGxpbmssICdjbGljaycsIHRoaXMuX3NoYXJlQ2xpY2ssIHRoaXMpO1xuICAgICAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKGNvbnRhaW5lcik7XG5cbiAgICAgICAgdGhpcy5fbWFwLm9uKCdtb3VzZWRvd24nLCB0aGlzLl9jbGlja091dCwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9LFxuXG4gICAgX2NsaWNrT3V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zaGFyaW5nKSB7XG4gICAgICAgICAgICBMLkRvbUV2ZW50LnByZXZlbnREZWZhdWx0KGUpO1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX21vZGFsLCAnYWN0aXZlJyk7XG4gICAgICAgICAgICB0aGlzLl9jb250ZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5fc2hhcmluZyA9IG51bGw7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3NoYXJlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgTC5Eb21FdmVudC5zdG9wKGUpO1xuICAgICAgICBpZiAodGhpcy5fc2hhcmluZykgcmV0dXJuIHRoaXMuX2NsaWNrT3V0KGUpO1xuXG4gICAgICAgIHZhciB0aWxlanNvbiA9IHRoaXMuX3RpbGVqc29uIHx8IHRoaXMuX21hcC5fdGlsZWpzb24gfHwge30sXG4gICAgICAgICAgICB1cmwgPSBlbmNvZGVVUklDb21wb25lbnQodGhpcy5vcHRpb25zLnVybCB8fCB0aWxlanNvbi53ZWJwYWdlIHx8IHdpbmRvdy5sb2NhdGlvbiksXG4gICAgICAgICAgICBuYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KHRpbGVqc29uLm5hbWUpLFxuICAgICAgICAgICAgaW1hZ2UgPSB1cmxoZWxwZXIodGlsZWpzb24uaWQgKyAnLycgKyB0aGlzLl9tYXAuZ2V0Q2VudGVyKCkubG5nICsgJywnICsgdGhpcy5fbWFwLmdldENlbnRlcigpLmxhdCArICcsJyArIHRoaXMuX21hcC5nZXRab29tKCkgKyAnLzYwMHg2MDAucG5nJywgdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VuKSxcbiAgICAgICAgICAgIGVtYmVkID0gdXJsaGVscGVyKHRpbGVqc29uLmlkICsgJy5odG1sJywgdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VuKSxcbiAgICAgICAgICAgIHR3aXR0ZXIgPSAnLy90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/c3RhdHVzPScgKyBuYW1lICsgJyAnICsgdXJsLFxuICAgICAgICAgICAgZmFjZWJvb2sgPSAnLy93d3cuZmFjZWJvb2suY29tL3NoYXJlci5waHA/dT0nICsgdXJsICsgJyZ0PScgKyBlbmNvZGVVUklDb21wb25lbnQodGlsZWpzb24ubmFtZSksXG4gICAgICAgICAgICBwaW50ZXJlc3QgPSAnLy93d3cucGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2J1dHRvbi8/dXJsPScgKyB1cmwgKyAnJm1lZGlhPScgKyBpbWFnZSArICcmZGVzY3JpcHRpb249JyArIHRpbGVqc29uLm5hbWUsXG4gICAgICAgICAgICBzaGFyZSA9IChcIjxoMz5TaGFyZSB0aGlzIG1hcDwvaDM+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J21hcGJveC1zaGFyZS1idXR0b25zJz48YSBjbGFzcz0nbWFwYm94LWJ1dHRvbiBtYXBib3gtYnV0dG9uLWljb24gbWFwYm94LWljb24tZmFjZWJvb2snIHRhcmdldD0nX2JsYW5rJyBocmVmPSd7e2ZhY2Vib29rfX0nPkZhY2Vib29rPC9hPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0nbWFwYm94LWJ1dHRvbiBtYXBib3gtYnV0dG9uLWljb24gbWFwYm94LWljb24tdHdpdHRlcicgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9J3t7dHdpdHRlcn19Jz5Ud2l0dGVyPC9hPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0nbWFwYm94LWJ1dHRvbiBtYXBib3gtYnV0dG9uLWljb24gbWFwYm94LWljb24tcGludGVyZXN0JyB0YXJnZXQ9J19ibGFuaycgaHJlZj0ne3twaW50ZXJlc3R9fSc+UGludGVyZXN0PC9hPjwvZGl2PlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgne3t0d2l0dGVyfX0nLCB0d2l0dGVyKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgne3tmYWNlYm9va319JywgZmFjZWJvb2spXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCd7e3BpbnRlcmVzdH19JywgcGludGVyZXN0KSxcbiAgICAgICAgICAgIGVtYmVkVmFsdWUgPSAnPGlmcmFtZSB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCI1MDBweFwiIGZyYW1lQm9yZGVyPVwiMFwiIHNyYz1cInt7ZW1iZWR9fVwiPjwvaWZyYW1lPicucmVwbGFjZSgne3tlbWJlZH19JywgZW1iZWQpLFxuICAgICAgICAgICAgZW1iZWRMYWJlbCA9ICdDb3B5IGFuZCBwYXN0ZSB0aGlzIDxzdHJvbmc+SFRNTCBjb2RlPC9zdHJvbmc+IGludG8gZG9jdW1lbnRzIHRvIGVtYmVkIHRoaXMgbWFwIG9uIHdlYiBwYWdlcy4nO1xuXG4gICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9tb2RhbCwgJ2FjdGl2ZScpO1xuXG4gICAgICAgIHRoaXMuX3NoYXJpbmcgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwYm94LW1vZGFsLWJvZHknLCB0aGlzLl9jb250ZW50KTtcbiAgICAgICAgdGhpcy5fc2hhcmluZy5pbm5lckhUTUwgPSBzaGFyZTtcblxuICAgICAgICB2YXIgaW5wdXQgPSBMLkRvbVV0aWwuY3JlYXRlKCdpbnB1dCcsICdtYXBib3gtZW1iZWQnLCB0aGlzLl9zaGFyaW5nKTtcbiAgICAgICAgaW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgaW5wdXQudmFsdWUgPSBlbWJlZFZhbHVlO1xuXG4gICAgICAgIHZhciBsYWJlbCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2xhYmVsJywgJ21hcGJveC1lbWJlZC1kZXNjcmlwdGlvbicsIHRoaXMuX3NoYXJpbmcpO1xuICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSBlbWJlZExhYmVsO1xuXG4gICAgICAgIHZhciBjbG9zZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnbGVhZmxldC1wb3B1cC1jbG9zZS1idXR0b24nLCB0aGlzLl9zaGFyaW5nKTtcbiAgICAgICAgY2xvc2UuaHJlZiA9ICcjJztcblxuICAgICAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKHRoaXMuX3NoYXJpbmcpO1xuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGNsb3NlLCAnY2xpY2snLCB0aGlzLl9jbGlja091dCwgdGhpcyk7XG4gICAgICAgIEwuRG9tRXZlbnQuYWRkTGlzdGVuZXIoaW5wdXQsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUudGFyZ2V0LmZvY3VzKCk7XG4gICAgICAgICAgICBlLnRhcmdldC5zZWxlY3QoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzLlNoYXJlQ29udHJvbCA9IFNoYXJlQ29udHJvbDtcblxubW9kdWxlLmV4cG9ydHMuc2hhcmVDb250cm9sID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgU2hhcmVDb250cm9sKF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlIHNpbXBsZXN0eWxlIHNwZWMgZm9yIHBvbHlnb24gYW5kIGxpbmVzdHJpbmcgZmVhdHVyZXNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXBib3gvc2ltcGxlc3R5bGUtc3BlY1xudmFyIGRlZmF1bHRzID0ge1xuICAgIHN0cm9rZTogJyM1NTU1NTUnLFxuICAgICdzdHJva2Utd2lkdGgnOiAyLFxuICAgICdzdHJva2Utb3BhY2l0eSc6IDEsXG4gICAgZmlsbDogJyM1NTU1NTUnLFxuICAgICdmaWxsLW9wYWNpdHknOiAwLjVcbn07XG5cbnZhciBtYXBwaW5nID0gW1xuICAgIFsnc3Ryb2tlJywgJ2NvbG9yJ10sXG4gICAgWydzdHJva2Utd2lkdGgnLCAnd2VpZ2h0J10sXG4gICAgWydzdHJva2Utb3BhY2l0eScsICdvcGFjaXR5J10sXG4gICAgWydmaWxsJywgJ2ZpbGxDb2xvciddLFxuICAgIFsnZmlsbC1vcGFjaXR5JywgJ2ZpbGxPcGFjaXR5J11cbl07XG5cbmZ1bmN0aW9uIGZhbGxiYWNrKGEsIGIpIHtcbiAgICB2YXIgYyA9IHt9O1xuICAgIGZvciAodmFyIGsgaW4gYikge1xuICAgICAgICBpZiAoYVtrXSA9PT0gdW5kZWZpbmVkKSBjW2tdID0gYltrXTtcbiAgICAgICAgZWxzZSBjW2tdID0gYVtrXTtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG59XG5cbmZ1bmN0aW9uIHJlbWFwKGEpIHtcbiAgICB2YXIgZCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFwcGluZy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkW21hcHBpbmdbaV1bMV1dID0gYVttYXBwaW5nW2ldWzBdXTtcbiAgICB9XG4gICAgcmV0dXJuIGQ7XG59XG5cbmZ1bmN0aW9uIHN0eWxlKGZlYXR1cmUpIHtcbiAgICByZXR1cm4gcmVtYXAoZmFsbGJhY2soZmVhdHVyZS5wcm9wZXJ0aWVzIHx8IHt9LCBkZWZhdWx0cykpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdHlsZTogc3R5bGUsXG4gICAgZGVmYXVsdHM6IGRlZmF1bHRzXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybCA9IHJlcXVpcmUoJy4vdXJsJyk7XG5cbnZhciBUaWxlTGF5ZXIgPSBMLlRpbGVMYXllci5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBbcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBmb3JtYXQ6ICdwbmcnXG4gICAgfSxcblxuICAgIC8vIGh0dHA6Ly9tYXBib3guY29tL2RldmVsb3BlcnMvYXBpLyNpbWFnZV9xdWFsaXR5XG4gICAgZm9ybWF0czogW1xuICAgICAgICAncG5nJyxcbiAgICAgICAgLy8gUE5HXG4gICAgICAgICdwbmczMicsICdwbmc2NCcsICdwbmcxMjgnLCAncG5nMjU2JyxcbiAgICAgICAgLy8gSlBHXG4gICAgICAgICdqcGc3MCcsICdqcGc4MCcsICdqcGc5MCddLFxuXG4gICAgc2NhbGVQcmVmaXg6ICdAMnguJyxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5UaWxlTGF5ZXIucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCB1bmRlZmluZWQsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3RpbGVqc29uID0ge307XG5cbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5mb3JtYXQpIHtcbiAgICAgICAgICAgIHV0aWwuc3RyaWN0X29uZW9mKG9wdGlvbnMuZm9ybWF0LCB0aGlzLmZvcm1hdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbG9hZFRpbGVKU09OKF8pO1xuICAgIH0sXG5cbiAgICBzZXRGb3JtYXQ6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdXRpbC5zdHJpY3QoXywgJ3N0cmluZycpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuZm9ybWF0ID0gXztcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIGRpc2FibGUgdGhlIHNldFVybCBmdW5jdGlvbiwgd2hpY2ggaXMgbm90IGF2YWlsYWJsZSBvbiBtYXBib3ggdGlsZWxheWVyc1xuICAgIHNldFVybDogbnVsbCxcblxuICAgIF9zZXRUaWxlSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgICB1dGlsLnN0cmljdChqc29uLCAnb2JqZWN0Jyk7XG5cbiAgICAgICAgTC5leHRlbmQodGhpcy5vcHRpb25zLCB7XG4gICAgICAgICAgICB0aWxlczoganNvbi50aWxlcyxcbiAgICAgICAgICAgIGF0dHJpYnV0aW9uOiBqc29uLmF0dHJpYnV0aW9uLFxuICAgICAgICAgICAgbWluWm9vbToganNvbi5taW56b29tIHx8IDAsXG4gICAgICAgICAgICBtYXhab29tOiBqc29uLm1heHpvb20gfHwgMTgsXG4gICAgICAgICAgICB0bXM6IGpzb24uc2NoZW1lID09PSAndG1zJyxcbiAgICAgICAgICAgIGJvdW5kczoganNvbi5ib3VuZHMgJiYgdXRpbC5sYm91bmRzKGpzb24uYm91bmRzKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl90aWxlanNvbiA9IGpzb247XG4gICAgICAgIHRoaXMucmVkcmF3KCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRUaWxlSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aWxlanNvbjtcbiAgICB9LFxuXG4gICAgLy8gdGhpcyBpcyBhbiBleGNlcHRpb24gdG8gbWFwYm94LmpzIG5hbWluZyBydWxlcyBiZWNhdXNlIGl0J3MgY2FsbGVkXG4gICAgLy8gYnkgYEwubWFwYFxuICAgIGdldFRpbGVVcmw6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICB2YXIgdGlsZXMgPSB0aGlzLm9wdGlvbnMudGlsZXMsXG4gICAgICAgICAgICBpbmRleCA9IE1hdGguZmxvb3IoTWF0aC5hYnModGlsZVBvaW50LnggKyB0aWxlUG9pbnQueSkgJSB0aWxlcy5sZW5ndGgpLFxuICAgICAgICAgICAgdXJsID0gdGlsZXNbaW5kZXhdO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZWQgPSBMLlV0aWwudGVtcGxhdGUodXJsLCB0aWxlUG9pbnQpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZWQucmVwbGFjZSgnLnBuZycsXG4gICAgICAgICAgICAgICAgKEwuQnJvd3Nlci5yZXRpbmEgPyB0aGlzLnNjYWxlUHJlZml4IDogJy4nKSArIHRoaXMub3B0aW9ucy5mb3JtYXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIFRpbGVKU09OLlRpbGVMYXllcnMgYXJlIGFkZGVkIHRvIHRoZSBtYXAgaW1tZWRpYXRlbHksIHNvIHRoYXQgdGhleSBnZXRcbiAgICAvLyB0aGUgZGVzaXJlZCB6LWluZGV4LCBidXQgZG8gbm90IHVwZGF0ZSB1bnRpbCB0aGUgVGlsZUpTT04gaGFzIGJlZW4gbG9hZGVkLlxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpbGVzKSB7XG4gICAgICAgICAgICBMLlRpbGVMYXllci5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzLlRpbGVMYXllciA9IFRpbGVMYXllcjtcblxubW9kdWxlLmV4cG9ydHMudGlsZUxheWVyID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgVGlsZUxheWVyKF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyksXG4gICAgdmVyc2lvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpLnZlcnNpb247XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocGF0aCwgYWNjZXNzVG9rZW4pIHtcbiAgICBhY2Nlc3NUb2tlbiA9IGFjY2Vzc1Rva2VuIHx8IEwubWFwYm94LmFjY2Vzc1Rva2VuO1xuXG4gICAgaWYgKCFhY2Nlc3NUb2tlbiAmJiBjb25maWcuUkVRVUlSRV9BQ0NFU1NfVE9LRU4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbiBBUEkgYWNjZXNzIHRva2VuIGlzIHJlcXVpcmVkIHRvIHVzZSBNYXBib3guanMuICcgK1xuICAgICAgICAgICAgJ1NlZSBodHRwczovL3d3dy5tYXBib3guY29tL21hcGJveC5qcy9hcGkvdicgKyB2ZXJzaW9uICsgJy9hcGktYWNjZXNzLXRva2Vucy8nKTtcbiAgICB9XG5cbiAgICB2YXIgdXJsID0gKCdodHRwczonID09PSBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbCB8fCBjb25maWcuRk9SQ0VfSFRUUFMpID8gY29uZmlnLkhUVFBTX1VSTCA6IGNvbmZpZy5IVFRQX1VSTDtcbiAgICB1cmwgKz0gcGF0aDtcbiAgICB1cmwgKz0gdXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJmFjY2Vzc190b2tlbj0nIDogJz9hY2Nlc3NfdG9rZW49JztcblxuICAgIGlmIChjb25maWcuUkVRVUlSRV9BQ0NFU1NfVE9LRU4pIHtcbiAgICAgICAgaWYgKGFjY2Vzc1Rva2VuWzBdID09PSAncycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlIGEgcHVibGljIGFjY2VzcyB0b2tlbiAocGsuKikgd2l0aCBNYXBib3guanMsIG5vdCBhIHNlY3JldCBhY2Nlc3MgdG9rZW4gKHNrLiopLiAnICtcbiAgICAgICAgICAgICAgICAnU2VlIGh0dHBzOi8vd3d3Lm1hcGJveC5jb20vbWFwYm94LmpzL2FwaS92JyArIHZlcnNpb24gKyAnL2FwaS1hY2Nlc3MtdG9rZW5zLycpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXJsICs9IGFjY2Vzc1Rva2VuO1xuICAgIH1cblxuICAgIHJldHVybiB1cmw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy50aWxlSlNPTiA9IGZ1bmN0aW9uKHVybE9yTWFwSUQsIGFjY2Vzc1Rva2VuKSB7XG4gICAgaWYgKHVybE9yTWFwSUQuaW5kZXhPZignLycpICE9PSAtMSlcbiAgICAgICAgcmV0dXJuIHVybE9yTWFwSUQ7XG5cbiAgICB2YXIgdXJsID0gbW9kdWxlLmV4cG9ydHMoJy8nICsgdXJsT3JNYXBJRCArICcuanNvbicsIGFjY2Vzc1Rva2VuKTtcblxuICAgIC8vIFRpbGVKU09OIHJlcXVlc3RzIG5lZWQgYSBzZWN1cmUgZmxhZyBhcHBlbmRlZCB0byB0aGVpciBVUkxzIHNvXG4gICAgLy8gdGhhdCB0aGUgc2VydmVyIGtub3dzIHRvIHNlbmQgU1NMLWlmaWVkIHJlc291cmNlIHJlZmVyZW5jZXMuXG4gICAgaWYgKHVybC5pbmRleE9mKCdodHRwcycpID09PSAwKVxuICAgICAgICB1cmwgKz0gJyZzZWN1cmUnO1xuXG4gICAgcmV0dXJuIHVybDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGlkVXJsOiBmdW5jdGlvbihfLCB0KSB7XG4gICAgICAgIGlmIChfLmluZGV4T2YoJy8nKSA9PSAtMSkgdC5sb2FkSUQoXyk7XG4gICAgICAgIGVsc2UgdC5sb2FkVVJMKF8pO1xuICAgIH0sXG4gICAgbG9nOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKF8pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzdHJpY3Q6IGZ1bmN0aW9uKF8sIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBfICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXJndW1lbnQ6ICcgKyB0eXBlICsgJyBleHBlY3RlZCcpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzdHJpY3RfaW5zdGFuY2U6IGZ1bmN0aW9uKF8sIGtsYXNzLCBuYW1lKSB7XG4gICAgICAgIGlmICghKF8gaW5zdGFuY2VvZiBrbGFzcykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudDogJyArIG5hbWUgKyAnIGV4cGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN0cmljdF9vbmVvZjogZnVuY3Rpb24oXywgdmFsdWVzKSB7XG4gICAgICAgIGlmICghY29udGFpbnMoXywgdmFsdWVzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50OiAnICsgXyArICcgZ2l2ZW4sIHZhbGlkIHZhbHVlcyBhcmUgJyArXG4gICAgICAgICAgICAgICAgdmFsdWVzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzdHJpcF90YWdzOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHJldHVybiBfLnJlcGxhY2UoLzxbXjxdKz4vZywgJycpO1xuICAgIH0sXG4gICAgbGJvdW5kczogZnVuY3Rpb24oXykge1xuICAgICAgICAvLyBsZWFmbGV0LWNvbXBhdGlibGUgYm91bmRzLCBzaW5jZSBsZWFmbGV0IGRvZXMgbm90IGRvIGdlb2pzb25cbiAgICAgICAgcmV0dXJuIG5ldyBMLkxhdExuZ0JvdW5kcyhbW19bMV0sIF9bMF1dLCBbX1szXSwgX1syXV1dKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBjb250YWlucyhpdGVtLCBsaXN0KSB7XG4gICAgaWYgKCFsaXN0IHx8ICFsaXN0Lmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGlzdFtpXSA9PSBpdGVtKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuIl19
