const rimraf = require('rimraf');

exports.sizeFormat = function(size) {
    let str = ''
    if (size < 1024) {
        str = size + 'B'
    } else if (size < 1024 * 1024) {
        str = parseInt(size / 1024) + 'KB'
    } else if (size < 1024 * 1024 * 1024) {
        str = parseInt(size / 1024 / 1024) + 'MB'
    } else {
        str = parseInt(size / 1024 / 1024 / 1024) + 'GB'
    }
    return str
}

exports.rm_rf = async function(path) {
    return new Promise((resolve, reject) => {
        rimraf(path, function(err) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}
