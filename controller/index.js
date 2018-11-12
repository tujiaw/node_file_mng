const path = require('path')
const fs = require("bluebird").promisifyAll(require('fs'))
const moment = require('moment')
const util = require('../common/util')
const send = require('koa-send')
const url = require('url');

const downloadDir = path.join(__dirname, '..', 'download')

async function handleFiles(ctx, handlder) {
  const files = ctx.request.body
  if (files && files.length) {
    try {
      for (const file of files) {
        const fullpath = path.join(downloadDir, file)
        await handlder(fullpath)
      }
      return { }
    } catch (err) {
      return { error: err }
    }
  } else {
    return { error: 'params error!' }
  }
}

async function waitpipe(reader, writer) {
  return new Promise((resolve, reject) => {
    reader.pipe(writer, { end: false})
    reader.on('end', () => {
      resolve()
    })
  })
  
}

exports.download = async function(ctx, name) {
  console.log(name)
  if (name && name.length) {
    ctx.attachment(name)
    await send(ctx, name, { root: downloadDir })
  } else {
    ctx.body = { error: 'params error!' }
  }
}

exports.delete = async function(ctx) {
  ctx.body = await handleFiles(ctx, async (fullpath) => {
    await util.rm_rf(fullpath)
  })
}

exports.upload = async function(ctx) {
  try {
    const referer = ctx.request.header.referer
    if (referer && referer.length) {
      const file = ctx.request.files.file
      const dstPath = path.join(downloadDir, url.parse(referer).path, file.name)
      console.log(`upload from:${file.path}, to:${dstPath}`)
      const reader = fs.createReadStream(file.path)
      const stream = fs.createWriteStream(dstPath)
      await waitpipe(reader, stream)
      ctx.redirect(referer)
    } else {
      ctx.body = { error: 'referer error' }  
    }
  } catch (err) {
    ctx.body = { error: err }
  }
}

exports.main = async function(ctx) {
    const curPath = path.join(downloadDir, ctx.path)
    console.log(curPath)
    const curStat = await fs.lstatAsync(curPath)
    if (curStat.isFile()) {
      ctx.attachment(ctx.path)
      await send(ctx, ctx.path, { root: downloadDir })
    } else if (curStat.isDirectory()) {
      const nameList = await fs.readdirAsync(curPath)
      const files = []
      for (const name of nameList) {
        const stat = await fs.lstatAsync(path.join(curPath, name))
        if (stat.isFile() || stat.isDirectory()) {
          files.push({
            name: name,
            path: path.join(ctx.path, name),
            type: stat.isFile() ? "oi-document" : "oi-folder",
            isDir: stat.isDirectory(),
            size: util.sizeFormat(stat.size),
            time: moment(stat.mtime).format('YYYY-MM-DD HH:mm:ss')
          })
        }
      }
  
      const pathList = ctx.path.split('/')
      let s = ''
      const nav = [{ path: '/', name: 'Home' }]
      for (const path of pathList) {
        if (path.length) {
          s += '/' + path
          nav.push({ path: s, name: path })
        }
      }
      await ctx.render('index', { nav, files })
    } else {
      ctx.body = '404'
    }
}
