const fs = require('fs')

exports.readdir = function(path, opt) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, opt, function(err, files) {
            if (err) {
                reject(err)
            } else {
                resolve(files)
            }
        })
    })
}
