function updateButtonsStatus() {
    let fileCount = 0, dirCount = 0
    $('.file-row').each(function() {
        if ($(this).find('input').is(':checked')) {
            console.log($(this).find('a').text())
            if ($(this).find('.oi').hasClass('oi-document')) {
                fileCount++
            } else {
                dirCount++
            }
        }
    })
    $('#download').prop('disabled', dirCount > 0 || fileCount === 0)
    $('#delete').prop('disabled', dirCount === 0 && fileCount === 0)
    $('#rename').prop('disabled', (dirCount + fileCount) !== 1)
}

$('.selectAll').change(function() {
    const checked = $(this).is(':checked')
    $('.select').each(function(i) {
        $(this).prop('checked', checked)
    })
    updateButtonsStatus();
})
$('.select').change(updateButtonsStatus)
updateButtonsStatus()

function getSelectFiles() {
    let selectFiles = []
    $('.file-row').each(function() {
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
        a.remove();  //afterwards we remove the element again 
    })
}

$('#download').click(function() {
    const spanList = []
    $('.file-row').each(function() {
        if ($(this).find('input').is(':checked')) {
            spanList.push($(this).find('a>span'))
            const url = $(this).find('a').attr('href')
            download(url)
        }
    })
})

$('#delete').click(function() {
    const selectFiles = getSelectFiles()
    if (selectFiles.length) {
        fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectFiles)
        }).then(function() {
            location.reload()
        }).catch(function(err) {
            alert(err)
        })
    }
})

$('.referrer').val(document.referrer);