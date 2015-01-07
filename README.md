Router
======

Create a Router
---------------

```javascript
var router = new Router()
```

Attach to an app
----------------
Add the routing/mounting capabilities to a koa app
```javascript
var app = Router(koa())

app.get('/users/:id', function*(){})
```

Use as Middleware
----------------
Create a router and use it as middleware in a koa app
```javascript
var app = koa()
  , router = new Router()

router.get('/users/:id', function*(){})

app.use(router.compose())
```

Use as a Standalone Router
--------------------------
If you're not using the router with koa, the `route` method is provided.  The `route` method takes an object that is similar to a koa context.  The only two required keys are `method` and `path`.  
```javascript
var router = new Router()
router.get('/users/:id', function*(){
	this.body = 'test'
})
router.route({ method:'GET', path:'/users/123' }).then(function(ctx) {})
```

You may also pass a path string instead of a context object, and a context will be created for you defaulting to the `GET` method.
```javascript
router.route('/users').then(function(ctx) {
	assert(ctx.path = )
})
```

Specify Routes & Parameters
---------------------------

```javascript
router.get('/users/:id', function*() {
	var id = this.params.id
})
router.post('/users/edit/:id', function*() {
	var id = this.params.id
})
router.all('/users', function*() {
	
})
```

Standard Middleware
-------------------
```javascript
router.use(require('koa-gzip')())
```

Route Middleware
----------------
```javascript
router.get('/users/:id', function*(next) {
	if(!permission) this.status = 403
    else yield next
}, function*() {
	var user = yield Users.find({ _id:this.params.id })
	this.body = UserView({ user:user })
})
```

Mounted Middleware
------------------
```javascript
// user-router.js
var users = module.exports = new Router()
users.get('/', listUsers)
users.get('/:id', viewUser)

// main-router.js
var router = new Router()
router.use('/users', require('./user-router'))
```

Async Goodness
--------------
```javascript
router.get('/users/:id', function*() {
	var user = yield Users.find({ _id:this.params.id })
})
```

Response
--------
```javascript
router.get('/users/:id', function*() {
	var user = yield Users.find({ _id:this.params.id })
	this.body = UserView({ user:user })
})

router.post('/users/edit/:id', function*() {
	this.redirect('/users/'+this.params.id)
})
```