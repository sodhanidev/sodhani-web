/* global Utils  */

(function () {
  function getCompanyInfo () {
    var element = document.getElementById('company-info')
    var companyId = element.getAttribute('data-company-id')
    var isConsolidated = element.getAttribute('data-consolidated')
    return {
      companyId: companyId,
      isConsolidated: isConsolidated
    }
  }

  function getElements (section) {
    var sectionEl = document.getElementById(section)
    var segmentEl = sectionEl.querySelector('[data-segment-table]')
    var resultEl = sectionEl.querySelector('[data-result-table]')

    return {
      sectionEl: sectionEl,
      segmentEl: segmentEl,
      resultEl: resultEl
    }
  }

  function setActiveTable (section, active) {
    var el = getElements(section)

    if (active === 'segment') {
      el.resultEl.classList.add('hidden')
      el.segmentEl.classList.remove('hidden')
    } else {
      el.resultEl.classList.remove('hidden')
      el.segmentEl.classList.add('hidden')
    }
  }

  function setActiveButtons (section, segtype) {
    var el = getElements(section)
    var closeButton = el.sectionEl.querySelector('[data-segment-button-close]')
    var segmentButtons = el.sectionEl.querySelectorAll('[data-segment-button]')

    if (segtype === 'close') {
      closeButton.classList.add('hidden')
      segmentButtons.forEach(function (button) {
        button.classList.remove('hidden')
      })
    } else {
      closeButton.classList.remove('hidden')
      segmentButtons.forEach(function (button) {
        var buttonSeg = button.getAttribute('data-segment-button')
        if (buttonSeg === segtype) {
          button.classList.add('hidden')
        } else {
          button.classList.remove('hidden')
        }
      })
    }
  }

  function renderSegmentTable (section, html) {
    var el = getElements(section)
    el.segmentEl.innerHTML = html
  }

  function getSegmentResult (section, segtype) {
    var companyInfo = getCompanyInfo()
    var params = {
      'companyId': companyInfo.companyId,
      'section': section,
      'segtype': segtype
    }
    if (companyInfo.isConsolidated) {
      params['consolidated'] = 'true'
    }
    var url = Utils.getUrl('getSegments', params)
    Utils.ajax(url, function (html) {
      renderSegmentTable(section, html)
      setActiveLineItems(section, ['Sales', 'Profit %', 'ROCE %'])
      setActiveTable(section, 'segment')
      setActiveButtons(section, segtype)
    })
  }

  // Functions for handling lineItem toggles

  function setActiveLineItems (section, lineItems) {
    // Hide others in group
    var el = getElements(section)
    var allLineItems = el.segmentEl.querySelectorAll('[data-segment-line]')
    allLineItems.forEach(function (lineItem) {
      var title = lineItem.getAttribute('data-segment-line')
      if (lineItems.indexOf(title) >= 0) {
        lineItem.classList.remove('hidden')
      } else {
        lineItem.classList.add('hidden')
      }
    })
  }

  function changeActive (section, oldActive, newActive) {
    // Hide others in group
    var el = getElements(section)
    var allLineItems = el.segmentEl.querySelectorAll('[data-segment-line]')
    allLineItems.forEach(function (lineItem) {
      var title = lineItem.getAttribute('data-segment-line')
      if (title === newActive) {
        lineItem.classList.remove('hidden')
      } else if (title === oldActive) {
        lineItem.classList.add('hidden')
      }
    })
  }

  function showSegment (section, segtype) {
    getSegmentResult(section, segtype)
  }

  function closeSegments (section, segtype) {
    setActiveTable(section, 'results')
    setActiveButtons(section, 'close')
  }

  window.Segment = {
    showSegment: showSegment,
    closeSegments: closeSegments,
    changeActive: changeActive
  }
})()
