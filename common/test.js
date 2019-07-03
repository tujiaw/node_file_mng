const fs = require('fs')
const path = require('path')

const DIR = path.normalize(__dirname)

function fetchFiles(dir, fn) {
    const ls = fs.readdirSync(dir)
    if (!ls) return
    ls.forEach(name => {
        const subfile = path.join(dir, name)
        const st = fs.lstatSync(subfile)
        if (st && st.isDirectory()) {
            fetchFiles(subfile, fn)
        } else if (st && st.isFile()) {
            fn(subfile)
        }
    })
}

const SEARCH_TEXT = '-std=c++03'
const REPLACE_TEXT = '-std=c++98'
const MATCH_LIST = ['Makefile']
fetchFiles(DIR, filepath => {
    if (!MATCH_LIST.includes(path.basename(filepath))) return
    const content = fs.readFileSync(filepath, 'utf-8')
    if (content && content.indexOf(SEARCH_TEXT) >= 0) {
        const result = content.replace(SEARCH_TEXT, REPLACE_TEXT)
        console.log(result)
        fs.writeFileSync(filepath, result)
    }
})
