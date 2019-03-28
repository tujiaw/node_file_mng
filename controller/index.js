const path = require('path')
const fs = require('fs-extra')
const moment = require('moment')
const util = require('../common/util')
const FileSort = require('../common/FileSort')
const send = require('koa-send')
const url = require('url');
const uuidV1 = require('uuid/v1');

const downloadDir = path.join(__dirname, '..', 'download')
fs.existsSync(downloadDir) || fs.mkdir(downloadDir)
console.log('download dir:' + downloadDir)

async function handleFiles(ctx, handlder) {
  const files = ctx.request.body
  if (files && files.length) {
    try {
      for (const file of files) {
        const fullpath = path.join(downloadDir, file)
        await handlder(fullpath)
      }
      return {success: true }
    } catch (err) {
      return { error: err }
    }
  } else {
    return { error: 'params error!' }
  }
}

exports.startRoute = async function(ctx, next) {
  try {
    await next()
  } catch (err) {
    if (err.errno === -4058) {
      ctx.response.status = 404
      ctx.response.body = 404
    } else {
      ctx.response.status = err.statusCode || err.status || 500
      ctx.response.body = err
      console.log('error:' + err)
    }
    ctx.app.emit('error', err, ctx)
  }
}

exports.download = async function(ctx, name) {
  console.log(name)
  if (name && name.length) {
    name = decodeURIComponent(name)
    ctx.attachment(name)
    await send(ctx, name, { root: downloadDir })
  } else {
    ctx.body = { error: 'params error!' }
  }
}

exports.delete = async function(ctx) {
  ctx.body = await handleFiles(ctx, async (fullpath) => {
    await fs.remove(fullpath)
  })
}

exports.upload = async function(ctx) {
  const referer = ctx.request.header.referer
  let fileList = []
  if (Array.isArray(ctx.request.files.file)) {
    fileList = ctx.request.files.file
  } else {
    fileList.push(ctx.request.files.file)
  }

  for (const file of fileList) {
    const dstPath = path.join(downloadDir, url.parse(referer).pathname, file.name)
    console.log(`upload from:${file.path}, to:${dstPath}`)
    const reader = fs.createReadStream(decodeURIComponent(file.path))
    const stream = fs.createWriteStream(decodeURIComponent(dstPath))
    await util.promisePipe(reader, stream)
  }
  ctx.redirect(referer)
}

exports.new = async function(ctx) {
  const referer = ctx.request.header.referer
  const name = ctx.request.body.name
  if (name && name.length) {
    const dstPath = path.join(downloadDir, url.parse(referer).pathname, name)
    await fs.mkdir(decodeURIComponent(dstPath))
  }
  ctx.redirect(referer)
}

exports.move = async function(ctx) {
  const referer = ctx.request.header.referer
  let frompath = ctx.request.body.frompath
  const name = ctx.request.body.name
  if (frompath && frompath.length && name && name.length) {
    frompath = path.join(downloadDir, frompath)
    const topath = path.join(downloadDir, name)
    await fs.move(decodeURIComponent(frompath), decodeURIComponent(topath))
  }
  ctx.redirect(referer)
}

exports.archive = async function(ctx) {
  let pathlist = ctx.request.body.pathlist
  const name = ctx.request.body.name
  if (pathlist && pathlist.length && name && name.length) {
    pathlist = JSON.parse(pathlist)
    pathlist = pathlist.map((str) => {
      return path.join(downloadDir, str)
    })

    const randomdir = path.join(__dirname, '../temp', uuidV1())
    fs.mkdirpSync(randomdir)
    await util.archiveList(pathlist, path.join(randomdir, name))
    ctx.attachment(name)
    await send(ctx, name, { root: randomdir })
  }
}

exports.main = async function(ctx) {
    const curPath = decodeURIComponent(path.join(downloadDir, ctx.path))
    console.log(curPath)
    const curStat = await fs.lstat(curPath)
    if (curStat.isFile()) {
      console.log('download', ctx.path)
      const sendpath = decodeURIComponent(ctx.path)
      ctx.attachment(sendpath)
      await send(ctx, sendpath, { root: downloadDir })
    } else if (curStat.isDirectory()) {
      const nameList = await fs.readdir(curPath)
      const files = []
      for (const name of nameList) {
        const stat = await fs.lstat(path.join(curPath, name))
        if (stat.isFile() || stat.isDirectory()) {
          files.push({
            name: name,
            path: decodeURIComponent(path.join(ctx.path, name)),
            type: stat.isFile() ? "oi-document" : "oi-folder",
            isDir: stat.isDirectory(),
            byte: stat.size,
            size: util.sizeFormat(stat.size),
            time: moment(stat.mtime).format('YYYY-MM-DD HH:mm:ss')
          })
        }
      }
  
      const pathList = ctx.path.split('/')
      const nav = [{ path: '/', name: 'Home' }]
      let s = ''
      for (const path of pathList) {
        if (path.length) {
          s += '/' + path
          nav.push({ path: s, name: path })
        }
      }

      const curSort = ctx.request.query.s || ''
      const curOrder = ctx.request.query.o || 'asc'
      const filesort = new FileSort()
      filesort.sort(files, curSort, curOrder)
      const sort = filesort.getShowData(ctx.path, curSort, curOrder)
      await ctx.render('index', { sort, nav, files })
    } else {
      ctx.redirect('/')
    }
}
