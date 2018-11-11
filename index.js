const Koa = require('koa')
const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const async = require('./async')
const render = require('koa-ejs');

const app = new Koa()
const router = new Router()

render(app, {
    root: path.join(__dirname, 'view'),
    layout: 'template',
    viewExt: 'html',
    cache: false,
    debug: false,
})

const publicDir = path.join(__dirname, 'public')
app.use(require('koa-static')(publicDir));

router.get('/', async (ctx) => {
    //const files = await async.readdir(publicDir, 'utf8')
    const files = [{name: "1111"}, {name: "2222"}, {name: "33333"}]
    await ctx.render('index', { files })
})

app.use(router.routes()).use(router.allowedMethods())
app.use(async (ctx) => { ctx.body = '404' })

const port = 3000;
app.listen(port, () => {
    console.log(`starting at port ${port}`)
})

app.on('error', function(err) {
    console.log(err.stack)
})