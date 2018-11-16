;(function ($, window, document) {
  function updateButtonsStatus() {
    let fileCount = 0,
      dirCount = 0
    $('.file-row').each(function () {
      if ($(this).find('input').is(':checked')) {
        console.log($(this).find('a').text())
        if ($(this).find('.oi').hasClass('oi-document')) {
          fileCount++
        } else {
          dirCount++
        }
        $('.frompath').val($(this).find('a').attr('href'))
      }
    })
    $('#download').prop('disabled', dirCount > 0 || fileCount === 0)
    $('#delete').prop('disabled', dirCount === 0 && fileCount === 0)
    $('#move').prop('disabled', (dirCount + fileCount) !== 1)
    $('#archive').prop('disabled', dirCount === 0 && fileCount === 0)
  }

  $('.selectAll').change(function () {
    const checked = $(this).is(':checked')
    $('.select').each(function (i) {
      $(this).prop('checked', checked)
    })
    updateButtonsStatus();
  })
  $('.select').change(updateButtonsStatus)
  updateButtonsStatus()

  function getSelectFiles() {
    let selectFiles = []
    $('.file-row').each(function () {
      if ($(this).find('input').is(':checked')) {
        selectFiles.push($(this).find('a').attr('href'))
      }
    })
    return selectFiles
  }

  function download(url) {
    let start = url.lastIndexOf('\\')
    start = start < 0 ? url.lastIndexOf('/') : start
    const name = url.substr(start + 1)
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
        a.click();
        a.remove(); //afterwards we remove the element again 
      })
  }

  $('#download').click(function () {
    const spanList = []
    let i = 1
    $('.file-row').each(function () {
      if ($(this).find('input').is(':checked')) {
        const downloadUrl = function(index, obj) {
          setTimeout(function() {
            obj.trigger('click')
          }, index * 100)
        }
        downloadUrl(i++, $(this).find('a span'))
      }
    })
  })

  $('#delete').click(function () {
    if (confirm('确定要删除选中的文件吗？')) {
      const selectFiles = getSelectFiles()
      if (selectFiles.length) {
        fetch('/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectFiles)
        }).then(function () {
          location.reload()
        }).catch(function (err) {
          alert(err)
        })
      }
    }
  })

  $('#move').click(function () {
    let frompath = $('.frompath').val()
    $('#moveInput').val(frompath.replace(/\\/g, '/'))
    return true
  })

  $('#rename').click(function () {
    let name = $('.frompath').val()
    let start = (name.lastIndexOf('\\') >= 0 ? name.lastIndexOf('\\') : name.lastIndexOf('/')) + 1
    $('#renameInput').val(name.substr(start))
    return true
  })

  $('.sort-item').click(function () {
    const defaultSort = $('.default-sort').text().trim();
    const curSort = $(this).text().trim()
    if (defaultSort == curSort) {
      let url = $(this).attr('href').toLowerCase()
      if (url.includes('o=desc')) {
        $(this).attr('href', url.replace("o=desc", 'o=asc'))
      } else if (url.includes('o=asc')) {
        $(this).attr('href', url.replace("o=asc", 'o=desc'))
      }
    }
    return true
  })

  $('#archive').click(function () {
    $('#pathlist').val(JSON.stringify(getSelectFiles()))
    $('#archiveInput').val('files-' + new Date().toISOString().replace(/:/g, '') + '.zip')
    return true
  })
  $('#archiveOk').click(function () {
    $('#archiveSubmit').click()
  })
  $('#moveOk').click(function () {
    $('#moveSubmit').click()
  })
  $('#newOk').click(function () {
    $('#newSubmit').click()
  })
  $('#uploadOk').click(function () {
    $('#uploadSubmit').click()
  })
})(jQuery, window, window.document);