const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

exports.sizeFormat = function(size) {
    let str = ''
    if (size < 1024) {
        str = size + 'B'
    } else if (size < 1024 * 1024) {
        str = (size / 1024).toFixed(2) + 'KB'
    } else if (size < 1024 * 1024 * 1024) {
        str = (size / 1024 / 1024).toFixed(2) + 'MB'
    } else {
        str = (size / 1024 / 1024 / 1024).toFixed(2) + 'GB'
    }
    return str
}

exports.archiveList = function(pathList, zipName) {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 6 }})
        archive.on('end', function() {
            resolve()
        })
        archive.on('error', function(err) {
            reject(err)
        })
    
        var output = fs.createWriteStream(zipName)
        archive.pipe(output)
        for (const str of pathList) {
            const stat = fs.lstatSync(str)
            if (stat.isFile()) {
                archive.file(str, { name: path.parse(str).base })
            } else if (stat.isDirectory()) {
                archive.directory(str, path.parse(str).name )
            }
        }
        archive.finalize()  
    })
}
