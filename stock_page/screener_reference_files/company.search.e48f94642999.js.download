/* global Utils, Typeahead */

(function () {
  function handleCompanySelect(options, selected) {
    window.location.href = options[selected].url;
  }

  var searches = document.querySelectorAll("[data-company-search]");
  searches.forEach(function (searchElement) {
    Typeahead(searchElement, Utils.searchCompaniesFts, handleCompanySelect);
  });
})();
