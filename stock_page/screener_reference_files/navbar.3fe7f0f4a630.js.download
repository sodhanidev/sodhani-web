/* global Utils */

(function () {
  function handleTheme (theme) {
    // set selected theme
    document.body.classList.remove('light')
    document.body.classList.remove('dark')
    document.body.classList.remove('auto')
    document.body.classList.add(theme)

    // Save the choice in a cookie
    Utils.eraseCookie('theme')
    Utils.setCookie('theme', theme, 60)
  }

  function toggleSearch (source) {
    var search = document.getElementById('mobile-search')
    var sourceIcon = source.querySelector('i')

    var visibilityClass = 'visible'
    var isVisible = search.classList.contains(visibilityClass)
    if (isVisible) {
      search.classList.remove(visibilityClass)
      sourceIcon.className = 'icon-search'
    } else {
      search.classList.add(visibilityClass)
      var input = search.querySelector('input')
      input.focus()
      sourceIcon.className = 'icon-cancel-thin'
    }
  }

  function addSearchShortcut () {
    document.addEventListener('keyup', function (event) {
      if (event.target !== document.body) return
      if (event.key !== '/') return
      var searchEl = document.querySelector('#desktop-search [data-company-search]')
      if (searchEl) searchEl.focus()
    })
  }

  function setupEverything () {
    window.MobileMenu = {
      toggleSearch: toggleSearch
    }
    window.SetTheme = handleTheme
    addSearchShortcut()
  }

  setupEverything()
})()
