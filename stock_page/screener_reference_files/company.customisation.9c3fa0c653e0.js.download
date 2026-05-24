(() => {
  function getInfo() {
    const infoEl = document.getElementById("company-info");
    return {
      companyId: infoEl.getAttribute("data-company-id"),
      warehouseId: infoEl.getAttribute("data-warehouse-id"),
      isConsolidated: infoEl.hasAttribute("data-consolidated"),
      userIsRegistered: infoEl.hasAttribute("data-user-is-registered"),
    };
  }

  function getQuickRatiosUrl(warehouseId) {
    return Utils.getUrl("quickRatios", { warehouseId: warehouseId });
  }

  function updateQuickRatios(html) {
    const topRatios = document.getElementById("top-ratios");
    const quickRatios = topRatios.querySelectorAll(
      '[data-source="quick-ratio"]',
    );
    for (let i = quickRatios.length - 1; i >= 0; --i) {
      quickRatios[i].remove();
    }
    topRatios.insertAdjacentHTML("beforeend", html);
  }

  function loadQuickRatios(userIsRegistered, warehouseId) {
    if (!userIsRegistered || !warehouseId) {
      Utils.setupShowMoreBoxes("main");
      return;
    }

    const quickRatiosUrl = getQuickRatiosUrl(warehouseId);

    Utils.ajax(quickRatiosUrl, (response) => {
      updateQuickRatios(response);
      Utils.setupShowMoreBoxes("main");
    });
  }

  // Handle quick ratios typeahead
  function addQuickRatio(
    userIsRegistered,
    searchEl,
    warehouseId,
    options,
    index,
  ) {
    if (!userIsRegistered) {
      window.location.href = "/login/";
      return;
    }
    const name = options[index].name;
    searchEl.value = "";
    const quickRatiosUrl = getQuickRatiosUrl(warehouseId);
    Utils.ajaxPost(quickRatiosUrl, { ratio_name: name }, (response) => {
      updateQuickRatios(response);
    });
  }

  function getRatioOptions(term, processOptions) {
    const url = Utils.getUrl("searchRatio", { q: term });
    return Utils.ajax(url, processOptions);
  }

  function setupQuickRatiosSearch(userIsRegistered, warehouseId) {
    const searchEl = document.getElementById("quick-ratio-search");
    if (!searchEl || !warehouseId) return;
    Typeahead(searchEl, getRatioOptions, (options, index) => {
      addQuickRatio(userIsRegistered, searchEl, warehouseId, options, index);
    });
  }

  // Peers table and search
  function loadPeersTable(warehouseId) {
    if (!warehouseId) return;
    const peersTableUrl = Utils.getUrl("peers", {
      warehouseId: warehouseId,
    });
    Utils.ajax(peersTableUrl, (response) => {
      const el = document.getElementById("peers-table-placeholder");
      el.innerHTML = response;
    });
  }

  function addPeersComparison(options, selected) {
    const peer = options[selected];
    const info = getInfo();
    const url = "/company/compare/";
    const codes = `?codes=${info.companyId},${peer.id}`;
    window.location.href = url + codes;
  }

  function setupPeersSearch() {
    const searchPeerComparison = document.getElementById(
      "search-peer-comparison",
    );
    if (searchPeerComparison) {
      Typeahead(
        searchPeerComparison,
        Utils.searchCompanies,
        addPeersComparison,
      );
    }
  }

  // click and expand for schedules
  function _toButton(cell, onclick) {
    const button = document.createElement("button");
    button.classList.add("button-plain");
    button.innerText = `${cell.innerText} `;
    button.setAttribute("onclick", onclick);

    const span = document.createElement("span");
    span.classList.add("blue-icon");
    span.innerText = "+";

    button.appendChild(span);

    // replace cell content with button
    cell.innerText = "";
    cell.appendChild(button);
  }

  function _insertRows(data, target) {
    const table = target.closest("table");
    const parentRow = target.closest("tr");
    let rowIndex = parentRow.rowIndex;
    parentRow.classList.add("strong");

    // Get table dates
    const dateElements = table.tHead.querySelectorAll("th:not(.text)");
    const dates = [];
    for (const element of dateElements) {
      dates.push(element.textContent.trim());
    }

    // Add Rows
    const rowsAdded = [];
    for (const key of Object.keys(data)) {
      const row = table.insertRow(++rowIndex);
      // same highlight of schedules as the parent
      row.className = parentRow.classList.contains("stripe") ? "stripe" : "";
      // add ratio name cell
      const cell = row.insertCell();
      if (key.length < 60) {
        cell.innerText = key;
      } else {
        cell.innerText = `${key.substring(0, 50)}...`;
        cell.title = key;
      }
      cell.className = "text";
      cell.style.paddingLeft = "2.5rem";
      const values = data[key];
      dates.forEach((dt) => {
        let cellContent = values[dt];
        if (cellContent === undefined || cellContent === null) cellContent = "";
        const cell = row.insertCell();
        cell.innerText = cellContent;
      });

      // handle extra data
      if (values.setAttributes) {
        for (const k in values.setAttributes) {
          const value = values.setAttributes[k];
          if (k === "class") row.classList.add(value);
          else row.setAttribute(k, value);
        }
      }

      // handle child button
      if (values.isExpandable) _toButton(cell, values.isExpandable);

      rowsAdded.push(row);
    }

    // add info about children to target
    target.setAttribute("data-child-count", rowsAdded.length);
    return rowsAdded;
  }

  function _setExpandButtonState(target, isExpanded) {
    target.removeAttribute("disabled");
    target.querySelector("span").textContent = isExpanded ? "-" : "+";
    const from = isExpanded ? "show" : "hide";
    const to = isExpanded ? "hide" : "show";
    target.setAttribute(
      "onclick",
      target.getAttribute("onclick").replace(from, to),
    );
  }

  function _collapse(target) {
    const childCount = Number.parseInt(
      target.getAttribute("data-child-count") || "0",
      10,
    );
    const table = target.closest("table");
    const parentRow = target.closest("tr");
    parentRow.classList.remove("strong");
    const rowIndex = parentRow.rowIndex;
    for (let i = 0; i < childCount; i++) {
      // first delete all child rows of this row if any
      const row = table.rows[rowIndex + 1];
      const childTarget = row.querySelector("button[data-child-count]");
      if (childTarget) _collapse(childTarget);
      // then delete this row itself
      table.deleteRow(rowIndex + 1);
    }
    _setExpandButtonState(target, false);
    target.removeAttribute("data-child-count");
  }

  function hideSchedule(_parent, _section, target) {
    _collapse(target);
  }

  function _loadRows(url, target, afterInsert) {
    target.setAttribute("disabled", true);
    Utils.ajax(
      url,
      (response) => {
        const rows = _insertRows(JSON.parse(response), target);
        if (afterInsert) {
          afterInsert(rows);
        }
        highlightInsertedRows(rows);
        _setExpandButtonState(target, true);
      },
      (err) => {
        target.removeAttribute("disabled");
        Utils.renderError(target, err);
      },
    );
  }

  function showSchedule(parent, section, target) {
    const info = getInfo();
    const context = {
      companyId: info.companyId,
      parent: parent,
      section: section,
    };
    if (info.isConsolidated) context.consolidated = "";

    _loadRows(Utils.getUrl("schedules", context), target);
  }

  function hideShareholders(_classification, _period, target) {
    _collapse(target);
  }

  function _insertShareholderLinks(rows) {
    rows.forEach((row) => {
      const cell = row.querySelector("td");
      const shareholderName = cell.innerText;
      cell.innerText = "";

      const a = document.createElement("a");
      a.href = row.getAttribute("data-person-url");
      a.classList.add("ink-900", "hover-link");

      const span = document.createElement("span");
      span.innerText = shareholderName;
      a.appendChild(span);

      const i = document.createElement("i");
      i.classList.add("icon-right", "a");
      a.appendChild(i);

      cell.appendChild(a);
    });
  }

  function showShareholders(classification, period, target) {
    const info = getInfo();
    const context = {
      companyId: info.companyId,
      classification: classification,
      period: period,
    };

    _loadRows(
      Utils.getUrl("getShareholders", context),
      target,
      _insertShareholderLinks,
    );
  }

  function setWatchlistListLabel(idx, prefix, suffix) {
    const labelEl = document.querySelector(`[data-idx="${idx}"] span`);
    labelEl.innerText = prefix;
    const suffixEl = document.createElement("span");
    suffixEl.classList.add("ink-700", "strong", "smaller", "highlight");
    suffixEl.style.paddingLeft = "1rem";
    suffixEl.innerText = suffix;
    labelEl.appendChild(suffixEl);
  }

  function handleSublistSelect(initialSublists, checkedSublists) {
    const updatedSublistIds = checkedSublists.map((sublist) => sublist.id);

    const info = getInfo();
    initialSublists.forEach((sublist, idx) => {
      let url;
      let suffix;
      const data = {
        companyId: info.companyId,
        listId: sublist.id,
      };
      const hasNow = updatedSublistIds.includes(sublist.id) ? 1 : 0;
      if (sublist.has_company === hasNow) {
        return;
      }
      if (hasNow) {
        url = Utils.getUrl("addCompany", data);
        suffix = "added";
      } else {
        url = Utils.getUrl("removeCompany", data);
        suffix = "removed";
      }
      Utils.ajaxPost(url, {}, (_response) => {
        setWatchlistListLabel(idx, sublist.name, suffix);
      });
      sublist.has_company = hasNow;
    });
  }

  function loadSublistsBoxes(sublistsEl, companyId) {
    const url = Utils.getUrl("companyInSublists", { companyId: companyId });
    Utils.ajax(url, (response) => {
      const sublists = JSON.parse(response);
      if (!sublists) return;
      const checkedObjects = sublists.filter((sublist) => sublist.has_company);
      const options = {
        checkedObjects: checkedObjects,
        noCheckAll: true,
      };
      const menuEl = ShowAsFilter(sublists, options, (checkedObjects) => {
        handleSublistSelect(sublists, checkedObjects);
      });
      menuEl.classList.add("visible");
      menuEl.style.width = "100%";
      menuEl.style.right = "0";
      sublistsEl.appendChild(menuEl);
    });
  }

  function showSublistOptions(event) {
    const info = getInfo();
    if (!info.userIsRegistered) return;

    const button = event.currentTarget;
    const sublistsEl = document.getElementById("company-in-sublists");
    const icon = button.querySelector("i");

    const hasHiddenClass = sublistsEl.classList.contains("hidden");
    if (hasHiddenClass) {
      icon.classList.remove("icon-down");
      icon.classList.add("icon-cancel");
      sublistsEl.classList.remove("hidden");
    } else {
      icon.classList.add("icon-down");
      icon.classList.remove("icon-cancel");
      sublistsEl.classList.add("hidden");
    }

    const sublistsLoaded = sublistsEl.dataset.loaded;
    if (sublistsLoaded) return;
    sublistsEl.dataset.loaded = true;
    loadSublistsBoxes(sublistsEl, info.companyId);
  }

  function toggleRows(checkbox, toggleSelector) {
    const rows = document.querySelectorAll(toggleSelector);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      row.hidden = checkbox.checked;
      if (checkbox.checked) {
        row.classList.remove("highlight");
      } else {
        row.classList.add("highlight");
      }
    }
  }

  function replayClass(element, className) {
    element.classList.remove(className);
    // trigger reflow so animation can replay
    // eslint-disable-next-line no-unused-expressions
    element.offsetWidth;
    element.classList.add(className);
  }

  function highlightInsertedRows(rows) {
    rows.forEach((row) => {
      Array.from(row.cells).forEach((cell) => {
        replayClass(cell, "highlight");
      });
    });
  }

  function highlightNewInsightsColumns(previousTabId, currentTabId) {
    // highlight only newly added date columns on period switch.
    if (!previousTabId || previousTabId === currentTabId) return;

    const currentTabEl = document.getElementById(currentTabId);
    const previousDateKeys = new Set(
      Array.from(
        document.querySelectorAll(`#${previousTabId} thead th[data-date-key]`),
        (header) => header.dataset.dateKey,
      ),
    );
    const newHeaders = Array.from(
      currentTabEl.querySelectorAll("thead th[data-date-key]"),
    ).filter((header) => !previousDateKeys.has(header.dataset.dateKey));

    if (!newHeaders.length) {
      replayClass(currentTabEl, "highlight");
      return;
    }

    const rows = currentTabEl.querySelectorAll("tbody tr");
    newHeaders.forEach((header) => {
      replayClass(header, "highlight");
      const columnIndex = header.cellIndex;
      rows.forEach((row) => {
        replayClass(row.children[columnIndex], "highlight");
      });
    });
  }

  function setInsightsPeriodTogglesEnabled(insightsCard, isEnabled) {
    const periodToggles = insightsCard.querySelectorAll(
      '.options button[data-tab-id]:not([data-tab-id="yearly-insights"])',
    );
    periodToggles.forEach((periodToggle) => {
      periodToggle.disabled = !isEnabled;
    });
  }

  function setInsightsFlagButtonEnabled(insightsCard, isEnabled) {
    const flagButton = insightsCard.querySelector(
      "[data-insights-flag-button]",
    );
    if (flagButton) {
      flagButton.disabled = !isEnabled;
    }
  }

  function getActiveTabId(button) {
    const optionsHolder = button.closest(".options");
    const activeOption = optionsHolder.querySelector(".active");
    return activeOption.dataset.tabId || "";
  }

  function updateInsightsTab(event, options = {}) {
    const button = event.currentTarget;
    const targetEl = document.getElementById(button.dataset.tabId);
    const enablePeriodToggles = options.enablePeriodToggles === true;
    const previousTabId = enablePeriodToggles ? "" : getActiveTabId(button);
    const insightsCard = button.closest("#insights");

    button.disabled = true;

    Utils.ajaxPost(
      button.dataset.url,
      {},
      (response) => {
        Utils.setInnerHTML(targetEl, response);
        if (!enablePeriodToggles) {
          // rebuild event because original event.currentTarget is unreliable in async callbacks.
          const event = { currentTarget: button };
          Utils.setActiveTab(event);
        }

        // enable toggles only when unlock response contains a real table.
        const hasInsightsTable = !!targetEl.querySelector(
          "[data-result-table]",
        );
        if (hasInsightsTable) {
          if (enablePeriodToggles) {
            setInsightsPeriodTogglesEnabled(insightsCard, true);
            setInsightsFlagButtonEnabled(insightsCard, true);
          }
          button.dataset.loaded = "true";
          highlightNewInsightsColumns(previousTabId, button.dataset.tabId);
        } else {
          replayClass(targetEl, "highlight");
        }
        button.disabled = false;
      },
      (err) => {
        Utils.renderError(button, err);
        button.disabled = false;
      },
    );
  }

  function setInsightsTab(event) {
    const button = event.currentTarget;
    if (button.classList.contains("active")) {
      return;
    }

    const previousTabId = getActiveTabId(button);
    if (button.dataset.loaded === "true") {
      Utils.setActiveTab(event);
      highlightNewInsightsColumns(previousTabId, button.dataset.tabId);
      return;
    }

    updateInsightsTab(event);
  }

  function unlockInsights(event) {
    // unlock yearly first, then enable period toggles if allowed.
    updateInsightsTab(event, { enablePeriodToggles: true });
  }

  function getInsightsPeriod(insightsCard) {
    const activeButton = insightsCard.querySelector(
      ".options button.active[data-tab-id]",
    );
    if (!activeButton) {
      return "year";
    }

    const periodByTab = {
      "yearly-insights": "year",
      "quarterly-insights": "quarter",
      "monthly-insights": "month",
    };
    return periodByTab[activeButton.dataset.tabId] || "year";
  }

  function openInsightsFlagModal(event) {
    const button = event.currentTarget;
    const insightsCard = button.closest("#insights");
    const period = getInsightsPeriod(insightsCard);
    const url = new URL(button.dataset.url, window.location.origin);
    url.searchParams.set("period", period);

    const info = getInfo();
    if (info.isConsolidated) {
      url.searchParams.set("is_consolidated", "1");
    }

    // always fetch latest fields for active period.
    if (button.dataset.modalId) {
      const oldModal = document.getElementById(button.dataset.modalId);
      if (oldModal) {
        oldModal.remove();
      }
      delete button.dataset.modalId;
    }

    button.dataset.url = `${url.pathname}${url.search}`;
    Modal.openInModal(event);
  }

  function setup() {
    const info = getInfo();
    Utils.scrollTablesToRight();
    loadQuickRatios(info.userIsRegistered, info.warehouseId);
    setupQuickRatiosSearch(info.userIsRegistered, info.warehouseId);
    loadPeersTable(info.warehouseId);
    setupPeersSearch();

    window.Company = {
      info: info,
      showSublistOptions: showSublistOptions,
      hideSchedule: hideSchedule,
      showSchedule: showSchedule,
      hideShareholders: hideShareholders,
      showShareholders: showShareholders,
      toggleRows: toggleRows,
      setInsightsTab: setInsightsTab,
      unlockInsights: unlockInsights,
      openInsightsFlagModal: openInsightsFlagModal,
    };
  }

  setup();
})();
