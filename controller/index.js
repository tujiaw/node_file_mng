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
      return {success: true }
    } catch (err) {
      return { error: err }
    }
  } else {
    return { error: 'params error!' }
  }
}

async function promisePipe(reader, writer) {
  return new Promise((resolve, reject) => {
    try {
      reader.pipe(writer)
      reader.on('end', () => {
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}

class FileSort {
  constructor() {
    this.defaultSort = 'Default sort'
    this.list = [
      { type: 'type', name: 'Type sort' },
      { type: 'name', name: 'Name sort' },
      { type: 'size', name: 'Size sort' },
      { type: 'time', name: 'Time sort' },
    ]
  }

  getShowData(path, sort, order) {
    const result = {
      defaultSort: '',
      list: []
    }
    for (const item of this.list) {
      if (item.type === sort) {
        result.defaultSort = item.name
      }
      result.list.push({
        name: item.name,
        href: path + '?s=' + item.type + ((order && order.length) ? ('&o=' + order) : '')
      })
    }
    if (result.defaultSort.length === 0) {
      result.defaultSort = this.defaultSort
    }
    return result
  }

  sort(files, type, order) {
    if (type === 'type') {
      files.sort((a, b) => { return order==='asc' ? (a.type > b.type) : (a.type < b.type) })
    } else if (type === 'name') {
      files.sort((a, b) => { return order==='asc' ? (a.name > b.name) : (a.name < b.name) })
    } else if (type === 'size') {
      files.sort((a, b) => { return order==='asc' ? (a.byte > b.byte) : (a.byte < b.byte) })
    } else if (type === 'time') {
      files.sort((a, b) => { return order==='asc' ? (a.time > b.time) : (a.time < b.time) })
    }
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
    await util.rm_rf(fullpath)
  })
}

exports.upload = async function(ctx) {
  try {
    const referer = ctx.request.header.referer
    if (referer && referer.length) {
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
        await promisePipe(reader, stream)
      }
      ctx.redirect(referer)
    } else {
      ctx.body = { error: 'referer error' }  
    }
  } catch (err) {
    ctx.body = { error: err }
  }
}

exports.new = async function(ctx) {
  try {
    const referer = ctx.request.header.referer
    if (referer && referer.length) {
      const name = ctx.request.body.name
      if (name && name.length) {
        const dstPath = path.join(downloadDir, url.parse(referer).pathname, name)
        await fs.mkdirSync(decodeURIComponent(dstPath))
      }
      ctx.redirect(referer)
    } else {
      ctx.body = { error: 'referer error' }  
    }
  } catch (err) {
    ctx.body = { error: err }
  }
}

exports.rename = async function(ctx) {
  try {
    const referer = ctx.request.header.referer
    if (referer && referer.length) {
      let frompath = ctx.request.body.frompath
      const name = ctx.request.body.name
      if (frompath && frompath.length && name && name.length) {
        frompath = path.join(downloadDir, frompath)
        const topath = path.join(path.dirname(frompath), name)
        await fs.renameAsync(decodeURIComponent(frompath), decodeURIComponent(topath))
      }
      ctx.redirect(referer)
    } else {
      ctx.body = { error: 'referer error' }  
    }
  } catch (err) {
    ctx.body = { error: err }
  }
}

exports.main = async function(ctx) {
    const curPath = decodeURIComponent(path.join(downloadDir, ctx.path))
    console.log(curPath)
    const curStat = await fs.lstatAsync(curPath)
    if (curStat.isFile()) {
      console.log('download', ctx.path)
      const sendpath = decodeURIComponent(ctx.path)
      ctx.attachment(sendpath)
      await send(ctx, sendpath, { root: downloadDir })
    } else if (curStat.isDirectory()) {
      const nameList = await fs.readdirAsync(curPath)
      const files = []
      for (const name of nameList) {
        const stat = await fs.lstatAsync(path.join(curPath, name))
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
      ctx.body = '404'
    }
}
