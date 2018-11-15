const Koa = require('koa')
const Router = require('koa-router')
const render = require('koa-ejs')
const body = require('koa-body');
const path = require('path')
const app = new Koa()
const router = new Router()
const controller = require('./controller')

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
router.post('/delete', controller.delete)
router.post('/upload', controller.upload)
router.post('/new', controller.new)
router.post('/move', controller.move)
router.post('/archive', controller.archive)
app.use(router.routes()).use(router.allowedMethods())
app.use(controller.main)

const port = 5000;
app.listen(port, () => {
  console.log(`starting at port ${port}`)
})

app.on('error', function (err) {
  console.log(err.stack)
})
