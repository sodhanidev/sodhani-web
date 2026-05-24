// Uses concepts of Closures and lexical scoping
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures

(function () {
  function Typeahead (input, getOptions, selectOption) { // eslint-disable-line
    var self = { input: input }
    var menuOptions = []
    var menuIndex = -1
    var _req

    // Add Methods
    function handleKeyDown (event) {
      var maxIndex = menuOptions.length - 1
      if (maxIndex < 0 || menuIndex < 0) return event // Do not interfere if no menu
      switch (event.which) {
        case 40: // down
          event.preventDefault()
          menuIndex++
          if (menuIndex > maxIndex) { menuIndex = maxIndex }
          updateActiveInMenu()
          break
        case 38: // up
          event.preventDefault()
          menuIndex--
          if (menuIndex < 0) { menuIndex = maxIndex }
          updateActiveInMenu()
          break
        case 9: // tab
        case 13: // enter
          event.preventDefault()
          handleOptionSelect(menuIndex)
          break
        case 27: // esc
          event.preventDefault()
          resetMenu()
          break
      }
    }

    function handleInput (event) {
      var onGettingOptions = function (options) {
        // parse to json if string
        if (typeof options === 'string') { options = JSON.parse(options) }
        // Replace options in menu
        menuOptions = options
        menuIndex = 0
        var newMenu = getNewMenu()
        var parent = self.menu.parentNode
        parent.replaceChild(newMenu, self.menu)
        self.menu = newMenu
      }
      if (_req) { _req.abort() }
      _req = getOptions(event.target.value, onGettingOptions)
    }

    function handleOptionSelect (index) {
      menuIndex = index
      updateActiveInMenu()
      selectOption(menuOptions, menuIndex)
      resetMenu()
    }

    function handleBlur (event) {
      setTimeout(function () {
        resetMenu()
      }, 200)
    }

    function updateActiveInMenu () {
      var lis = self.menu.querySelectorAll('li')
      for (var i = 0; i < lis.length; i++) {
        lis[i].className = menuIndex === i ? 'active' : ''
      }
    }

    function getNewMenu () {
      var menu = document.createElement('ul')
      menu.classList.add('dropdown-content', 'visible')
      for (var i = 0; i < menuOptions.length; i++) {
        (function () {
          var index = i
          var li = document.createElement('li')
          li.textContent = menuOptions[i].name
          if (index === menuIndex) { li.className = 'active' }
          li.addEventListener('mousedown', function () { handleOptionSelect(index) })
          menu.appendChild(li)
        })()
      }
      return menu
    }

    function resetMenu () {
      menuIndex = -1
      menuOptions = []
      self.menu.classList.remove('visible')
    }

    // make the parent position default relative to set dropdown position
    var parent = input.parentNode
    // Add Menu
    input.style.marginBottom = 0
    self.menu = getNewMenu()
    parent.appendChild(self.menu)
    // hide menu is starting
    resetMenu()

    // Add listeners
    input.addEventListener('keydown', handleKeyDown)
    input.addEventListener('input', handleInput)
    input.addEventListener('blur', handleBlur)
    return self
  }

  // Typeahead Utility Functions

  function getTillCursor (textarea) {
    var fullVal = textarea.value
    var cursorPos = textarea.selectionStart
    var tillCursor = fullVal.substring(0, cursorPos)
    return tillCursor
  }

  function getLastWordBeforeCursor (textarea) {
    var tillCursor = getTillCursor(textarea)
    if (tillCursor.toLowerCase().endsWith(' and')) {
      return tillCursor.substring(tillCursor.length - 3)
    }
    if (tillCursor.toLowerCase().endsWith(' or')) {
      return tillCursor.substring(tillCursor.length - 2)
    }
    var pattern = /\sand\s|\sor\s|[^a-z0-9 ]|\n/gi
    var parts = tillCursor.split(pattern)
    if (parts.length) return parts[parts.length - 1].trim()
    return ''
  }

  function insertWord (textarea, text, appendOnly) {
    // Inserts the given word in the query-builder at cursor position
    var fullVal = textarea.value
    var cursorPos = textarea.selectionStart
    var tillCursor = fullVal.substring(0, cursorPos)
    var lastWord = getLastWordBeforeCursor(textarea)
    var insertPos = tillCursor.lastIndexOf(lastWord)
    if (appendOnly) insertPos = cursorPos
    if (insertPos === -1) return
    var before = fullVal.substring(0, insertPos)
    var after = fullVal.substring(cursorPos)
    var newVal = before + text + after
    var newPos = newVal.length - after.length
    textarea.value = newVal
    textarea.selectionStart = newPos
    textarea.selectionEnd = newPos
  }

  window.Typeahead = Typeahead
  window.TypeaheadUtils = {
    insertWord: insertWord,
    getLastWordBeforeCursor: getLastWordBeforeCursor,
    getTillCursor: getTillCursor
  }
})()
