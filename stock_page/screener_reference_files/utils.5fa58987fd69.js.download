(() => {
  function handleResponse(xhr, onSuccess, onError) {
    const redirectUrl = xhr.getResponseHeader("X-Redirect-To");
    // XHR follows 302 redirects internally, so AJAX redirects use 403 with this header.
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
    if (xhr.status === 200) {
      onSuccess(xhr.responseText);
    } else {
      onError(xhr.statusText);
    }
  }

  function ajax(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => {
      handleResponse(xhr, onSuccess, onError);
    };
    xhr.onerror = () => {
      onError(xhr.statusText);
    };
    // for is_ajax to work in Django
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send();
    return xhr;
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
  }

  function eraseCookie(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }

  function getCsrf() {
    // eslint-disable-line no-unused-vars
    return document.cookie.replace(
      /(?:(?:^|.*;\s*)csrftoken\s*=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
  }

  function encodePostData(data) {
    return Object.keys(data)
      .map((key) => {
        var value = data[key];
        if (value === undefined) value = "";
        return `${key}=${encodeURIComponent(value)}`;
      })
      .join("&");
  }

  function ajaxPost(url, data, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("X-CSRFToken", getCsrf());
    xhr.onreadystatechange = function() {
      if (this.readyState !== XMLHttpRequest.DONE) return;
      handleResponse(xhr, onSuccess, onError);
    };
    // for is_ajax to work in Django
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send(encodePostData(data));
  }

  function ajaxLoad(event, url) {
    var button = event.currentTarget;
    var targetEl = document.querySelector(button.dataset.swap);

    targetEl.classList.remove("highlight");
    ajax(
      url,
      (resp) => {
        setInnerHTML(targetEl, resp);
        targetEl.classList.add("highlight");
      },
      (err) => {
        renderError(button, err);
      },
    );
  }

  function renderError(button, err) {
    // append error message before the targetEl
    var errorEl = document.createElement("div");
    errorEl.classList.add("red");
    errorEl.innerText = err;
    button.parentNode.insertBefore(errorEl, button);
  }

  function ajaxSubmit(event) {
    // FormData.entries is supported only on newer browsers. Thus not part of Utils.
    event.preventDefault();
    var form = event.target;
    var url = form.action;

    // works on new browsers only
    var data = Object.fromEntries(new FormData(form).entries());
    if (event.submitter) {
      data[event.submitter.name] = event.submitter.value;
    }

    var outputEl = document.querySelector(form.dataset.swap) || form;
    outputEl.classList.remove("highlight");
    ajaxPost(
      url,
      data,
      (resp) => {
        setInnerHTML(outputEl, resp);
        outputEl.classList.add("highlight");
      },
      (err) => {
        renderError(form, err);
      },
    );
  }

  function setInnerHTML(el, html) {
    // get already loaded javascript files
    var existingScripts = document.querySelectorAll("script");
    var existingSources = new Set();
    existingScripts.forEach((script) => {
      var src = script.src;
      if (!src) return;
      var srcUrl = new URL(src, document.baseURI).href;
      existingSources.add(srcUrl);
    });

    // update content
    el.innerHTML = html;

    // execute new scripts
    var scripts = el.querySelectorAll("script");
    scripts.forEach((script) => {
      var src = script.src;
      if (!src) {
        const scriptType = script.type.trim().toLowerCase();
        const isJavaScript =
          !scriptType ||
          scriptType === "text/javascript" ||
          scriptType === "application/javascript" ||
          scriptType === "module";
        if (!isJavaScript) return;

        // Re-insert inline script node to execute without using eval.
        const scriptEl = document.createElement("script");
        const scriptAttrs = script.attributes;
        for (let i = 0; i < scriptAttrs.length; i++) {
          const attr = scriptAttrs[i];
          scriptEl.setAttribute(attr.name, attr.value);
        }
        scriptEl.textContent = script.textContent;
        script.parentNode.replaceChild(scriptEl, script);
      } else {
        const srcUrl = new URL(src, document.baseURI).href;
        const alreadyProcessed = existingSources.has(srcUrl);
        if (!alreadyProcessed) {
          // load script
          const scriptEl = document.createElement("script");
          const scriptAttrs = script.attributes;
          for (let i = 0; i < scriptAttrs.length; i++) {
            const attr = scriptAttrs[i];
            scriptEl.setAttribute(attr.name, attr.value);
          }
          document.body.appendChild(scriptEl);
          existingSources.add(srcUrl);
        }
      }
    });
  }

  function resizeIframe(obj) {
    obj.style.height = `${obj.contentWindow.document.body.scrollHeight}px`;
  }

  function dateDelta(period, days) {
    period = new Date(period);
    period.setDate(period.getDate() + days);
    return period;
  }

  function dateFormatter(options) {
    try {
      // Available only on IE11+ and Safari 10+
      return new Intl.DateTimeFormat("en-IN", options);
    } catch (_error) {
      return {
        format: (date) => {
          return date.toDateString();
        },
      };
    }
  }

  function isDesktop() {
    return window.screen.width > 992;
  }

  function formatUrl(url, data) {
    // Clone data
    var context = {};
    if (data === undefined) data = {};
    Object.keys(data).forEach((key) => {
      context[key] = data[key];
    });

    // Replace curls
    let parsed = url;
    let curls = parsed.match(/{[^}]+}/g);
    if (curls === null) curls = [];
    for (let i = 0; i < curls.length; i++) {
      const curlyKey = curls[i];
      const key = curlyKey.replace(/{|}/g, "");
      const value = context[key];
      delete context[key];
      if (value === undefined || value === null) {
        parsed = parsed.replace(`${curlyKey}/`, "");
      } else {
        parsed = parsed.replace(curlyKey, value);
      }
    }

    // Remaining context goes into get params
    if (Object.keys(context).length > 0) {
      const params = new URLSearchParams(context);
      parsed = `${parsed}?${params.toString()}`;
    }
    return parsed;
  }

  function getUrls() {
    var urls = {
      searchCompany: "/api/company/search/",
      addCompany: "/api/company/{companyId}/add/{listId}/",
      removeCompany: "/api/company/{companyId}/remove/{listId}/",
      quickRatios: "/api/company/{warehouseId}/quick_ratios/",
      peers: "/api/company/{warehouseId}/peers/",
      schedules: "/api/company/{companyId}/schedules/",
      searchRatio: "/api/ratio/search/",
      getChartMetric: "/api/company/{companyId}/chart/",
      searchHsCode: "/api/hs/search/",
      tradeData: "/api/hs/{hsCode}/data/",
      ratioGallery: "/ratios/gallery/",
      getSegments: "/api/segments/{companyId}/{section}/{segtype}/",
      addPushSubscription: "/api/notifications/add_push_subscription/",
      companyInSublists: "/api/company/sublists/{companyId}/",
      getShareholders:
        "/api/3/{companyId}/investors/{classification}/{period}/",
      filterAnnualReports: "/annual-reports/filter/",
      fiiInvestmentData: "/api/fii/",
      notes: "/notebook/{companyId}/",
      notesUpload: "/notebook/upload/",
    };
    return urls;
  }

  function getUrl(name, data) {
    var urls = getUrls();
    var url = urls[name];
    return formatUrl(url, data);
  }

  function searchCompanies(name, processOptions, fts) {
    var args = { q: name, v: 5 };
    if (fts) args.fts = 1;
    var url = getUrl("searchCompany", args);
    return ajax(url, processOptions);
  }

  function searchCompaniesFts(name, processOptions) {
    var fts = 1;
    return searchCompanies(name, processOptions, fts);
  }

  function getChartColors() {
    var bodyColors = getComputedStyle(document.body);
    var chartColors = {
      red: bodyColors.getPropertyValue("--red").trim() || "red",
      price: bodyColors.getPropertyValue("--chart-price").trim() || "purple",
      volume:
        bodyColors.getPropertyValue("--chart-volume").trim() || "lightblue",
      ink700: bodyColors.getPropertyValue("--ink-700").trim() || "grey",
      yellow: "rgb(255, 205, 86)",
      green: "rgb(75, 192, 192)",
      blue: "rgb(54, 162, 235)",
      purple: "rgb(153, 102, 255)",
      grey500: "hsl(0, 0%, 75%)",
      grey300: "hsl(0, 0%, 85%)",
      dark: "hsl(202, 59%, 23%)",
      light: "hsl(202, 86%, 80%)",
      lightRed: "#f3aeaa",
      lightBlue: "#5cdbf3",
      white: "rgba(255, 255, 255, 0.95)",
      default: "rgba(0, 0, 0, 0.1)",
    };
    chartColors.lightRedBlueGradient = [
      chartColors.lightRed,
      "#5CE6F3",
      chartColors.lightBlue,
    ];
    return chartColors;
  }

  function hideElement(element, addClass, removeClass) {
    if (!addClass && !removeClass) {
      addClass = "hidden";
    }

    setTimeout(() => {
      if (addClass && !element.classList.contains(addClass)) {
        element.classList.add(addClass);
      }
      if (removeClass && element.classList.contains(removeClass)) {
        element.classList.remove(removeClass);
      }
    }, 100);
  }

  function addHideOnEscape(element, addClass, removeClass) {
    if (element.dataset.hasEscapeListener) return;

    document.addEventListener("keydown", (event) => {
      // detect escape key
      if (event.which === 27) {
        hideElement(element, addClass, removeClass);
      }
    });

    // add a data attribute to the element to prevent multiple listeners
    element.dataset.hasEscapeListener = true;
  }

  function addHideOnOutsideClick(element, addClass, removeClass) {
    if (element.dataset.hasOutsideClickListener) return;

    document.addEventListener("click", (event) => {
      // check if the click was outside the element
      if (!element.contains(event.target)) {
        hideElement(element, addClass, removeClass);
      }
    });

    // add data attribute to prevent multiple listeners
    element.dataset.hasOutsideClickListener = true;
  }

  function toggleClass(element, klass) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if (!element) return;

    if (element.classList.contains(klass)) {
      element.classList.remove(klass);
    } else {
      element.classList.add(klass);
    }
  }

  function localStorageSet(key, value) {
    // user can disable localStorage
    try {
      localStorage.setItem(key, value);
    } catch (_exception) {
      console.log("couldn't save in local storage");
    }
  }

  function localStorageGet(key) {
    // some versions of safari disable localStorage in private mode
    try {
      return localStorage.getItem(key);
    } catch (_exception) {
      return null;
    }
  }

  function addFormListeners() {
    var forms = document.querySelectorAll("[data-submit-once-form]");
    forms.forEach((form) => {
      var alreadySubmitted = false;
      form.addEventListener("submit", (event) => {
        if (alreadySubmitted) {
          event.preventDefault();
        } else {
          alreadySubmitted = true;
        }
      });
    });
  }

  // scroll tables to right
  function scrollTablesToRight(selector) {
    if (!selector) selector = ".responsive-holder";
    var tables = document.querySelectorAll(selector);
    tables.forEach((table) => {
      if (table.classList.contains("no-scroll-right")) return;
      table.scrollLeft = table.scrollWidth;
    });
  }

  // set active tab
  function setActiveTab(event) {
    var selectedOption = event.currentTarget;
    var options = selectedOption
      .closest(".options")
      .querySelectorAll("a,button");

    // set selected option as active
    options.forEach((option) => {
      var targetTabId = option.getAttribute("data-tab-id");
      var targetTabEl = document.getElementById(targetTabId);
      if (!targetTabEl) {
        console.log(`could not find tab with id: ${targetTabId}`);
        return;
      }

      var isSelected = option === selectedOption;
      if (isSelected) {
        option.classList.add("active");
        targetTabEl.classList.remove("hidden");
      } else {
        option.classList.remove("active");
        targetTabEl.classList.add("hidden");
      }
    });
  }

  function showHoverMenu(event) {
    var menu = event.target.closest(".hover-menu");
    if (!menu) return;
    menu.classList.remove("hover-inactive");

    // add outside click listener to menu
    if (!menu.dataset.hasListeners) {
      addHideOnOutsideClick(menu, "hover-inactive");
      menu.dataset.hasListeners = true;
    }
  }

  function addSubmitShortcut(el) {
    el.addEventListener("keydown", (e) => {
      var isMeta = e.metaKey || e.ctrlKey;
      var isEnter = e.keyCode === 13;
      if (isMeta && isEnter) {
        el.inputElement.form.dispatchEvent(new Event("submit"));
      }
    });
  }

  // handle show more sections
  function handleShowMore(event) {
    var box = event.target.closest(".show-more-box");
    box.style.flexBasis = "auto";
    box.classList.add("highlight");
    event.target.classList.add("hidden");
  }

  function checkAndAddShowMoreButton(boxEl) {
    var isOverflowing = boxEl.scrollHeight > boxEl.clientHeight;

    if (isOverflowing) {
      // add show more button if needs scrolling after flex-basis
      const showMoreButton = document.createElement("button");
      showMoreButton.classList.add("a");
      showMoreButton.classList.add("show-more-button");
      showMoreButton.addEventListener("click", handleShowMore);
      showMoreButton.setAttribute("aria-label", "show more");

      const icon = document.createElement("i");
      icon.classList.add("icon-down");
      icon.classList.add("ink-600");
      showMoreButton.appendChild(icon);

      boxEl.appendChild(showMoreButton);
    } else {
      // remove flex-basis and grow if needs no scroll
      boxEl.style.flexBasis = "auto";
      boxEl.style.flexGrow = "0";
    }
  }

  function setupShowMoreBoxes() {
    var boxes = document.querySelectorAll(".show-more-box");
    boxes.forEach((box) => {
      checkAndAddShowMoreButton(box);
    });
  }

  // toggle dropdown menu
  function toggleDropdown(event) {
    var button = event.currentTarget;
    var menu = button.closest(".dropdown-menu");
    addHideOnOutsideClick(menu, null, "open");
    addHideOnEscape(menu, null, "open");
    toggleClass(menu, "open");
  }

  function setupUtils() {
    window.Utils = {
      ajax: ajax,
      ajaxPost: ajaxPost,
      ajaxLoad: ajaxLoad,
      ajaxSubmit: ajaxSubmit,
      setInnerHTML: setInnerHTML,
      renderError: renderError,
      setCookie: setCookie,
      eraseCookie: eraseCookie,
      getUrl: getUrl,
      getCsrf: getCsrf,
      searchCompanies: searchCompanies,
      searchCompaniesFts: searchCompaniesFts,
      chartColors: getChartColors(),
      resizeIframe: resizeIframe,
      dateDelta: dateDelta,
      dateFormatter: dateFormatter,
      isDesktop: isDesktop,
      addHideOnEscape: addHideOnEscape,
      addHideOnOutsideClick: addHideOnOutsideClick,
      toggleClass: toggleClass,
      localStorageGet: localStorageGet,
      localStorageSet: localStorageSet,
      scrollTablesToRight: scrollTablesToRight,
      setActiveTab: setActiveTab,
      showHoverMenu: showHoverMenu,
      addSubmitShortcut: addSubmitShortcut,
      setupShowMoreBoxes: setupShowMoreBoxes,
      toggleDropdown: toggleDropdown,
    };
    addFormListeners();
  }

  setupUtils();
})();
