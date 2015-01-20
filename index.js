var co = require('co')
  , compose = require('koa-compose')
  , methods = require('methods')
  , route = require('path-match')()
  , extend = require('extend-object')

module.exports = Router

/**
 * Initialize Router.
 *
 * @param {Application} app Optional. 
 *                      Injects router capability into app
 * @return {Router|Application}
 * @api public
 */

function Router(fn) {
	if(fn && fn.listen)
		return Router.injectInto(fn)
	if(!(this instanceof Router))
		return new Router(fn)

	this.middleware = []
	this.needs_composition = true

	if(fn) fn.call(this)
}


/**
 * Patch koa `app`, adding router methods
 *
 * @param {Application} app
 * @return {Application} 
 * @api public
 */

Router.injectInto = function(app) {
	['all', 'use', 'del', 'param']
	.concat(methods)
	.forEach(function(method) {
		app[method] = router[method]
	})

	return app
}


/**
 * Router prototype
 */

var router = Router.prototype


/**
 * Router composition. Composes the router's internal middleware/routes
 * for use as middleware in a koa application
 *
 * @return {GeneratorFunction}
 * @api public
 */

router.compose = function() {
	this.needs_composition = false
	return this.composed = compose(this.middleware)
}


/**
 * Router composition. Composes the router's internal middleware/routes
 * for use as middleware in a koa application
 *
 * @return {GeneratorFunction}
 * @api public
 */

router.route = function(ctx) {
	if(this.needs_composition) this.compose()
	if(typeof ctx == 'string') ctx = { path:ctx }
	ctx.method = (ctx.method || 'GET').toUpperCase()
	var promise = co.wrap(this.composed).call(ctx)
	return new Promise(function(resolve, reject) {
		promise.then(function() { resolve(ctx) }, reject)
	})
}

/**
 * Create `router.verb()` methods, 
 * where *verb* is one of the HTTP verbes such
 * as `router.get()` or `router.post()`.
 */

;['all'].concat(methods).forEach(function(method) {
	var METHOD = method == 'all' 
	           ? null 
	           : method.toUpperCase()

	router[method] = function(path) {
		var match = route(path)
		  , handler = arguments.length == 2 
		            ? arguments[1] 
		            : compose([].slice.call(arguments, 1))
		
		this.middleware.push(function* routePath(next) {
			if(METHOD && this.method != METHOD) 
				return yield* next
			
			this.params = match(this.path)

			if(!this.params) 
				return yield* next

			yield* handler.call(this, next)
		})

		this.needs_composition = true

		return this
	}
})


/**
 * Alias for `router.delete()` because delete is a reserved word
 */

router.del = router['delete']


/**
 * Mount `router` with `prefix`, `app`
 * may be a Koa application or
 * middleware function.
 *
 * @param {String} prefix Optional.
 * @param {Application|Router|GeneratorFunction} app
 * @return {Router}
 * @api public
 */

router.use = function(prefix, app) {
	var downstream
	  , prefix_regex

	if(typeof prefix != 'string') {
		app = prefix
		prefix = '/'
	}

	if(prefix[0] != '/')
		throw new Error('mount path must begin with "/"')

	downstream = app.middleware
	           ? compose(app.middleware)
	           : app

	if(!downstream || downstream.constructor.name != 'GeneratorFunction')
		throw new Error('router.use() requires a generator function')

	if(prefix == '/') {
		this.middleware.push(downstream)
		return this
	}

	prefix = prefix.replace(/\/$/, '')
	prefix_regex = new RegExp('^'+prefix+'(/|$)', 'i')

	this.middleware.push(function*(upstream) {
		if(!prefix_regex.test(this.path))
			return yield* upstream

		var old_ctx = {
				  mount: this.mount
				, path: this.path
		    }
		  , new_ctx = {
		    	  mount: (this.mount || '') + prefix
				, path: this.path.replace(prefix_regex, '/')
		    }
		
		extend(this, new_ctx)

		yield* downstream.call(this, function*() {
			extend(this, old_ctx)
			yield* upstream
			extend(this, new_ctx)
		}.call(this))

		extend(this, old_ctx)
	})

	return this
}