const Koa = require('koa')
const Router = require('koa-router')
const render = require('koa-ejs')
const body = require('koa-body');
const path = require('path')
const app = new Koa()
const router = new Router()
const controller = require('./controller')
const session = require('koa-session');

app.keys = ['HELLO, world!'];
app.use(session(app));
app.use(body({
  multipart: true,
  formidable: {
    maxFileSize: 1024 * 1024 * 1024
  }
}))

render(app, {
  root: path.join(__dirname, 'view'),
  layout: 'template',
  viewExt: 'html',
  cache: false,
  debug: false,
})

const publicDir = path.join(__dirname, 'public')
app.use(require('koa-static')(publicDir))
app.use(controller.startRoute)
app.use(router.routes()).use(router.allowedMethods())
router.post('/upload', controller.upload)
router.post('/new', controller.new)
router.post('/archive', controller.archive)
router.post('/delete', controller.delete)
router.post('/move', controller.move)
router.get('/ningto', controller.ningto)
app.use(controller.main)

const port = 5000;
app.listen(port, () => {
  console.log(`starting at port ${port}`)
})

app.on('error', function (err) {
  console.log(err.stack)
})
