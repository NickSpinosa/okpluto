exports.getInfo = function() {
  return new Promise((resolve, reject) => {
    $.ajax({
        url: 'api/shareKeys',
        type: 'GET',
        success: resolve,
        error: reject
    })
  })
}