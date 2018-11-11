const Koa = require('koa')
const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const render = require('koa-ejs')
const moment = require('moment')
const async = require('./async')

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
app.use(require('koa-static')(publicDir))

app.use(async (ctx) => {
    const curPath = path.join(publicDir, ctx.path)
    try {
        const nameList = await async.readdir(curPath)
        const files = []
        for (const name of nameList) {
            const stat = fs.lstatSync(path.join(curPath, name))
            if (stat.isFile() || stat.isDirectory()) {
                let size = ''
                if (stat.size < 1024) {
                    size = stat.size + 'B'
                } else if (stat.size < 1024 * 1024) {
                    size = parseInt(stat.size / 1024) + 'KB'
                } else if (stat.size < 1024 * 1024 * 1024) {
                    size = parseInt(stat.size / 1024 / 1024) + 'MB'
                } else {
                    size = parseInt(stat.size / 1024 / 1024 / 1024) + 'GB'
                }
    
                files.push({
                    name: name,
                    path: path.join(ctx.path, name),
                    type: stat.isFile() ? "oi-document" : "oi-folder",
                    isDir: stat.isDirectory(),
                    size: size,
                    time: moment(stat.mtime).format('YYYY-MM-DD HH:mm:ss')
                })
            }
        }
        
        const pathList = ctx.path.split('/')
        let s = ''
        const nav = [{ path: '/', name: 'Home'}]
        for (const path of pathList) {
            if (path.length) {
                s += '/' + path
                nav.push({
                    path: s,
                    name: path
                })
            }
        }
        await ctx.render('index', { nav, files })
    } catch (err) {
        console.log(err)
        ctx.body = '404'
    }
})

//app.use(router.routes()).use(router.allowedMethods())

const port = 3000;
app.listen(port, () => {
    console.log(`starting at port ${port}`)
})

app.on('error', function(err) {
    console.log(err.stack)
})