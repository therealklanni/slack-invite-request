(function () {
  var po = document.createElement('script');
  po.type = 'text/javascript';
  po.async = true;
  po.src = 'https://plus.google.com/js/client:plusone.js?onload=start';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(po, s);
}());

function signInCallback(authResult) {
  if (authResult.code) {
    $.ajax({
      url: 'https://www.googleapis.com/plus/v1/people/me',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization','Bearer ' + authResult.access_token);
      }
    }).done(function (user) {
      $.post('/signin', {
        code: authResult.code,
        user: user
      }).done(function () {
        window.location.replace('/apply')
      });
    });
  } else if (authResult.error) {
    console.error('Google+ Signin: ' + authResult.error);
  }
}
