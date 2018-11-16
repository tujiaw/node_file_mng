class FileSort {
  constructor() {
    this.defaultSort = 'Default sort'
    this.list = [{
        type: 'type',
        name: 'Type sort'
      },
      {
        type: 'name',
        name: 'Name sort'
      },
      {
        type: 'size',
        name: 'Size sort'
      },
      {
        type: 'time',
        name: 'Time sort'
      }
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
    const strComp = function (a, b) {
      a = a.toLowerCase()
      b = b.toLowerCase()
      if (a < b) {
        return (order === 'asc') ? -1 : 1
      } else if (a > b) {
        return (order === 'asc') ? 1 : -1
      }
      return 0
    }
    const intComp = function (a, b) {
      return order === 'asc' ? a - b : b - a
    }

    if (type === 'type') {
      files.sort((a, b) => strComp(a.type, b.type))
    } else if (type === 'name') {
      files.sort((a, b) => strComp(a.name, b.name))
    } else if (type === 'size') {
      files.sort((a, b) => intComp(a.byte, b.byte))
    } else if (type === 'time') {
      files.sort((a, b) => strComp(a.time, b.time))
    }
  }
}

module.exports = FileSort