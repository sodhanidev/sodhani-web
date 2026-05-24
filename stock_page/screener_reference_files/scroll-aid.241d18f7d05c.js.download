(function () {
  function scrollIntoView(tab) {
    var tabContainer = document.querySelector('.sub-nav-tabs')
    var tabRect = tab.getBoundingClientRect()
    var containerRect = tabContainer.getBoundingClientRect()

    var offsetLeft = tabRect.left - containerRect.left
    var offsetRight = containerRect.right - tabRect.right

    if (offsetLeft < 0 || offsetRight < 0) {
      var scrollLeft = tabContainer.scrollLeft + offsetLeft - (containerRect.width / 2) + (tabRect.width / 2)
      tabContainer.scrollTo({
        behavior: 'smooth',
        left: scrollLeft
      })
    }
  }

  function updateActive (entries, idNavLinks, idRatios) {
    entries.forEach(function (entry) {
      idRatios[entry.target.id] = entry.intersectionRatio
    })

    var highestId = Object.entries(idRatios).reduce((a, b) => a[1] > b[1] ? a : b)[0]

    // keep previously selected as active if nothing is active
    if (idRatios[highestId] === 0) return

    Object.entries(idNavLinks).forEach(function (idNavLink) {
      var navLinkId = idNavLink[0]
      var navLink = idNavLink[1]
      if(navLinkId === highestId) {
        if (!navLink.classList.contains('active')) {
          navLink.classList.add('active')
          scrollIntoView(navLink)
        }
      } else {
        if (navLink.classList.contains('active')) {
          navLink.classList.remove('active')
        }
      }
    })
  }

  function setupScrollAid () {
    var options = {
      root: null,
      threshold: [.9, .75, .5, .25, .1]
    }

    // dictionary of target ids and corresponding indicator element
    var navLinks = document.querySelectorAll('.sub-nav-tabs a')
    var idNavLinks = {}
    var targets = []
    var idRatios = {}
    navLinks.forEach(function (navLink, i) {
      var targetId = navLink.getAttribute('href').replace('#', '')
      var target = document.getElementById(targetId)
      if (target) {
        targets.push(target)
        idNavLinks[targetId] = navLink
        idRatios[targetId] = i === 0 ? 1 : 0
      }
    })

    var observer = new IntersectionObserver(function (entries) {
      updateActive(entries, idNavLinks, idRatios)
    }, options)

    targets.forEach(function (target) {
      observer.observe(target)
    })
  }

  setupScrollAid()
})()
