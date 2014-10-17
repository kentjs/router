Router
======

Create a Router
---------------

```javascript
var router = new Router()
```

Attach to an app
----------------
Add the routing/mounting capabilities to an app
```javascript
var app = Router(koa())
```

Use as Middleware
----------------
Add the routing/mounting capabilities to an app
```javascript
var app = koa()
  , router = new Router()

app.use(router.compose())
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