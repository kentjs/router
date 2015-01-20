var Router = require('./')
  , should = require('should-eventually')
  , request = require('supertest')
  , http = require('http')
  , koa = require('koa')

describe('Router', function() {
	beforeEach(function() {
		this.router = new Router()
	})
	it('should match the correct route', function(done) {
		this.router.get('/', function*() {
			this.failure = true
		})
		this.router.get('/user', function*() {
			this.success = true
		})
		this.router.route({ path:'/user', method:'GET' }).then(function(ctx) {
			ctx.success.should.be.true
			should(ctx.failure).not.exist
			done()
		})
	})
	it('should match the correct method', function(done) {
		this.router.get('/', function*() {
			this.failure = true
		})
		this.router.post('/', function*() {
			this.success = true
		})
		this.router.route({ path:'/', method:'POST' }).then(function(ctx) {
			ctx.success.should.be.true
			should(ctx.failure).not.exist
			done()
		})
	})
	it('should allow shorthand path call (default to GET method)', function(done) {
		this.router.get('/', function*() {})
		this.router.route('/').then(function(ctx) {
			ctx.path.should.equal('/')
			ctx.method.should.equal('GET')
			done()
		})
	})
	it('should handle parameters', function(done) {
		this.router.get('/user/:id', function*() {
			this.params.id.should.equal('123')
			done()
		})
		this.router.route('/user/123')
	})
	it('should allow mounting', function(done) {
		var user_router = new Router()
		user_router.get('/:id', function*() {
			this.params.id.should.equal('123')
			done()
		})
		this.router.use('/user', user_router)
		this.router.route('/user/123')
	})
	it('should allow route middleware', function(done) {
		this.router.get('/(.*)*', function*(next) {
			this.test_value = true
			yield next
		})
		this.router.get('/user/:id', function*() {
			this.test_value.should.be.true
			done()
		})
		this.router.route('/user/123')
	})
	it('should allow param handlers')
})

describe('Koa Integration', function() {
	beforeEach(function() {
		this.router = new Router()
		this.app = koa()

		this.request = function() {
			this.app.use(this.router.compose())
			this.server = http.createServer(this.app.callback())
			return request(this.server)
		}.bind(this)
	})
	it('should extend a koa instance', function() {
		Router(this.app)
		this.app.use.should.equal(Router.prototype.use)
		this.app.get.should.equal(Router.prototype.get)
		this.app.post.should.equal(Router.prototype.post)
		//etc.
	})
	it('should compose to koa middleware', function(done) {
		this.router.get('/', function*() {
			this.body = 'hello'
		})
		this.request().get('/').expect(200, 'hello', done)
	})
})