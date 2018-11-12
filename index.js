const Koa = require('koa')
const Router = require('koa-router')
const render = require('koa-ejs')
const body = require('koa-body');
const path = require('path')
const app = new Koa()
const router = new Router()
const controller = require('./controller')

app.use(body({ multipart: true }))
render(app, {
  root: path.join(__dirname, 'view'),
  layout: 'template',
  viewExt: 'html',
  cache: false,
  debug: false,
})

const publicDir = path.join(__dirname, 'public')
app.use(require('koa-static')(publicDir))
router.post('/delete', controller.delete)
router.post('/upload', controller.upload)
router.post('/new', controller.new)
app.use(router.routes()).use(router.allowedMethods())
app.use(controller.main)

const port = 3000;
app.listen(port, () => {
  console.log(`starting at port ${port}`)
})

app.on('error', function (err) {
  console.log(err.stack)
})