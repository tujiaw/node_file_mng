const rimraf = require('rimraf')
const fs = require('fs')

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
