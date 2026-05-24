/* global Chart, Utils */

(() => {
  function ScreenerException(message) {
    this.message = message;
    this.name = "ScreenerException";
  }

  // Functions for rendering tooltip
  function volumeInK(value) {
    return value > 1000 ? `${Math.round(value / 1000)}k` : value;
  }

  function getTooltipElements() {
    return {
      tooltipEl: document.getElementById("chart-tooltip"),
      titleEl: document.getElementById("chart-tooltip-title"),
      infoEl: document.getElementById("chart-tooltip-info"),
      metaEl: document.getElementById("chart-tooltip-meta"),

      crossHair: document.getElementById("chart-crosshair"),
      customInfo: document.getElementById("chart-info"),
      dateFormatter: Utils.dateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  }

  function getLastValue(chart, metric, asOnDate) {
    let metricDataset = chart.data.datasets.filter(
      (dataset) => dataset.metric === metric,
    );

    if (metricDataset.length === 0) return;
    else metricDataset = metricDataset[0];

    let lastValue;
    for (let index = 0; index < metricDataset.data.length; index++) {
      const point = metricDataset.data[index];
      if (point.x > asOnDate) break;
      lastValue = point.y;
    }

    return lastValue;
  }

  function getTooltipText(metric, point, chart) {
    let text;
    switch (metric) {
      case "Price":
        text = `₹ ${point.y}`;
        break;

      case "Volume":
        text = `Vol: ${volumeInK(point.y)}`;
        if (point.meta.delivery) {
          text += `<span class="ink-700"> D: ${point.meta.delivery}%</span>`;
        }
        break;

      case "Quarter Sales":
        text = `Sales: ${point.y}`;
        break;

      case "GPM":
      case "OPM":
      case "NPM":
        text = `${metric}: ${point.y}%`;
        break;

      case "Price to Earning": {
        text = `PE: ${point.y}`;
        const peDate = point.x;
        const epsValue = getLastValue(chart, "EPS", peDate);
        if (epsValue) {
          text += `<br><span class="font-weight-400">EPS: ${epsValue}</span>`;
        }
        break;
      }

      case "Median PE":
        text = "";
        break;

      default:
        text = `${metric}: ${point.y}`;
        break;
    }
    return text;
  }

  function updateTooltipText(chart, tooltipElements, tooltipModel) {
    var texts = [];
    tooltipModel.dataPoints.map((dataPoint) => {
      const dataset = dataPoint.dataset;
      const point = dataset.data[dataPoint.dataIndex];
      const metric = dataset.metric;
      const text = getTooltipText(metric, point, chart);
      texts.push(text);
    });

    // pop first text from texts
    var titleHTML = texts.shift();
    var infoHTML = texts.join("<br>");
    var metaHTML = tooltipModel.dataPoints[0].label;

    tooltipElements.titleEl.innerHTML = titleHTML;
    tooltipElements.infoEl.innerHTML = infoHTML;
    tooltipElements.metaEl.innerHTML = metaHTML;
  }

  function updateTooltip(tooltipElements, context) {
    // Hide if no tooltip
    var tooltipModel = context.tooltip;
    var chart = context.chart;
    if (tooltipModel.opacity === 0) {
      tooltipElements.customInfo.classList.add("invisible");
      return;
    }
    tooltipElements.customInfo.classList.remove("invisible");

    // prepare text to be shown
    updateTooltipText(chart, tooltipElements, tooltipModel);

    // set x position
    // y position is updated based on cursor position
    var primaryDataPoint = tooltipModel.dataPoints[0];
    var chartElement = primaryDataPoint.element;

    // update crosshair position
    var crossHair = tooltipElements.crossHair;
    crossHair.style.left = `${chartElement.x}px`;

    // update tooltip position
    var tooltipEl = tooltipElements.tooltipEl;
    // Get tooltip size
    var tipWidth = tooltipEl.offsetWidth;

    // Keep tooltip inside chart area
    var left = chartElement.x - tipWidth / 2;
    if (left < chart.chartArea.left) left = chart.chartArea.left;
    var totalWidth = left + tipWidth;
    if (totalWidth > chart.chartArea.right) {
      left = chart.chartArea.right - tipWidth;
    }

    // Set tooltip position
    tooltipEl.style.left = `${left}px`;
  }

  function setCustomTooltipPosition(
    _tooltipModel,
    tooltipElements,
    eventPosition,
  ) {
    var tooltipEl = tooltipElements.tooltipEl;

    // set y position at 16px above cursor
    var tipHeight = tooltipEl.offsetHeight;
    var top = eventPosition.y - 16 - tipHeight;

    // // keep tooltip inside chart area
    // var chartArea = tooltipModel.chart.chartArea
    // if (top < chartArea.top) top = chartArea.top
    // if (top > chartArea.bottom) top = chartArea.bottom

    tooltipEl.style.top = `${top}px`;
    return { x: eventPosition.x, y: top };
  }

  function getStorageKey(text) {
    return text.toLowerCase().replace(" ", "");
  }

  // functions for drawing chart legend
  function legendClickCallback(chart, _label, dataset) {
    dataset.hidden = !dataset.hidden;
    chart.update();

    // save DMA settings
    var rememberMetric = [
      "DMA50",
      "DMA200",
      "Index DMA200",
      "Index DMA50",
      "GPM",
      "NPM",
      "OPM",
    ];
    if (rememberMetric.indexOf(dataset.metric) >= 0) {
      const key = getStorageKey(`show${dataset.metric}`);
      const value = dataset.hidden ? 0 : 1;
      Utils.localStorageSet(key, value);
    }
  }

  function drawLegend(chart) {
    // draw left and right legend labels
    var leftLabels = [];
    var rightLabels = [];
    chart.data.datasets.map((dataset) => {
      if (dataset.hidden) return;
      if (dataset.yAxisID === "y-axis-left") leftLabels.push(dataset.label);
      else if (dataset.yAxisID === "y-axis-right") {
        rightLabels.push(dataset.label);
      } else console.log(dataset.metric, "axis not found");
    });
    var el;
    if (leftLabels.length > 0) {
      el = document.getElementById("chart-label-left");
      el.innerText = leftLabels[0];
    }
    el = document.getElementById("chart-label-right");
    var rightLabel = rightLabels[0];
    if (rightLabel === "GPM") rightLabel = "Margin %";
    el.innerText = rightLabel;

    // draw legend below chart
    var datasets = chart.data.datasets;
    var legendsEl = document.createElement("div");
    legendsEl.classList.add("flex");
    legendsEl.classList.add("flex-wrap");
    legendsEl.style.justifyContent = "center";
    chart.legend.legendItems.forEach((legendItem) => {
      var dataset = datasets[legendItem.datasetIndex];

      var checkBox = document.createElement("input");
      checkBox.classList.add("chart-checkbox");
      checkBox.type = "checkbox";
      checkBox.style.background = legendItem.fillStyle;
      checkBox.addEventListener("change", (_event) => {
        legendClickCallback(chart, label, dataset);
      });
      if (!legendItem.hidden) {
        checkBox.checked = true;
      }

      var label = document.createElement("label");
      label.style.boxSizing = "border-box";
      label.style.padding = "6px 8px";
      label.style.fontSize = "14px";
      label.style.fontWeight = "500";
      label.style.cursor = "pointer";

      var span = document.createElement("span");
      span.innerText = legendItem.text;

      label.append(checkBox);
      label.appendChild(span);
      legendsEl.appendChild(label);
    });

    var oldLegendEl = document.getElementById("chart-legend");
    oldLegendEl.parentNode.replaceChild(legendsEl, oldLegendEl);
    legendsEl.id = "chart-legend";
    legendsEl.style.marginTop = "2rem";
  }

  // Functions for rendering chart
  function updateTooltipCrosshairSize(chart, tooltipElements) {
    var crossHair = tooltipElements.crossHair;
    crossHair.style.top = `${chart.chartArea.top}px`;
    var height = chart.chartArea.bottom - chart.chartArea.top;
    crossHair.style.height = `${height}px`;
  }

  function getChartOptions(tooltipElements) {
    var options = {
      hover: {
        animationDuration: 0, // disable animation on hover
      },
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "timeseries",
          // offset and grid-offset is set to false
          // because bar-charts set it true by default
          offset: false,
          time: {
            tooltipFormat: "dd MMM yy",
            displayFormats: {
              year: "MMM yyyy",
              day: "d MMM",
            },
          },
          ticks: {
            autoSkip: true,
            autoSkipPadding: 100,
            display: true,
            maxRotation: 0,
          },
          grid: {
            display: true,
            drawOnChartArea: false,
            drawTicks: true,
            offset: false,
          },
        },
      },
      interaction: {
        // pick nearest value for datasets on x axis
        mode: "index",
        axis: "x",
        // intersection of mouse is not required.
        // Always show hover points and tooltips
        intersect: false,
      },
      plugins: {
        tooltip: {
          enabled: false,
          external: (context) => {
            updateTooltip(tooltipElements, context);
          },
          position: "setCustomTooltipPosition",
        },
        legend: {
          display: false,
        },
      },
    };
    return options;
  }

  function drawChart(target, state) {
    // create canvas
    var canvas = document.createElement("canvas");
    target.appendChild(canvas);

    // get options for chart
    var tooltipElements = getTooltipElements();
    var options = getChartOptions(tooltipElements);
    // prepare scales (axes) based on rawDataSets
    var chartData = getDataForChart(state);
    options.scales = Object.assign({}, options.scales, chartData.scales);

    // add custom tooltip mode to ChartJS
    Chart.Tooltip.positioners.setCustomTooltipPosition = function (
      _elements,
      eventPosition,
    ) {
      // tooltipModel = this;
      // default elements is elements used by Chart.js
      return setCustomTooltipPosition(this, tooltipElements, eventPosition);
    };

    // draw chart
    var ctx = canvas.getContext("2d");
    var chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: chartData.datasets,
      },
      options: options,
    });

    // draw custom legend buttons and labels
    drawLegend(chart);
    updateTooltipCrosshairSize(chart, tooltipElements);
    return chart;
  }

  function inPercent(x) {
    return Number.parseFloat(x).toFixed(1);
  }

  function getDataPoints(values, isNormalized) {
    var base = null;
    if (isNormalized && values.length) {
      base = values[0][1];
    }
    var data = values.map((dateVal) => {
      var dt = dateVal[0];
      var y = dateVal[1];
      var meta = dateVal[2];
      if (base) {
        y = inPercent((y / base) * 100);
      }
      return {
        x: dt,
        y: y,
        meta: meta,
      };
    });
    return data;
  }

  function getMinimumY(data) {
    if (data.length === 0) return 0;
    var minimum = data.reduce(
      (prevMin, current) => (current.y < prevMin ? current.y : prevMin),
      data[0].y,
    );
    return minimum;
  }

  function getYAxes(id, datasets) {
    if (id !== "y-axis-right" && id !== "y-axis-left") {
      throw new ScreenerException(
        "Y-axis id should either be y-axis-right or y-axis-left",
      );
    }

    var yAxes = {
      type: "linear",
      display: "auto",
      position: id === "y-axis-right" ? "right" : "left",
      grid: {
        drawBorder: false,
        drawOnChartArea: id === "y-axis-right",
      },
    };

    // label specific configs
    datasets.map((dataset) => {
      if (dataset.metric === "Volume") {
        yAxes.ticks = {
          callback: volumeInK,
        };
      }

      if (dataset.metric === "NPM") {
        const minimumNPM = getMinimumY(dataset.data);
        if (minimumNPM < -25) {
          yAxes.min = 0;
        }
      }

      if (dataset.metric === "EPS") {
        const minimumEPS = getMinimumY(dataset.data);
        if (minimumEPS >= 0) {
          yAxes.min = minimumEPS * 0.9;
        }
      }
    });

    return yAxes;
  }

  function getFromLocalStorage(metric, defaultVal) {
    var key = getStorageKey(`show${metric}`);
    var value = Utils.localStorageGet(key);
    if (value === null) return defaultVal;
    var isHidden = value === "0";
    return isHidden;
  }

  function getChartDataset(dataset) {
    var isNormalized = false;
    var data = getDataPoints(dataset.values, isNormalized);

    var macros = ["chartType"];
    // Default config
    var chartDataset = {
      metric: dataset.metric,
      label: dataset.label,
      data: data,
      chartType: "line",
      yAxisID: "y-axis-right",
      borderColor: Utils.chartColors.price,
      backgroundColor: Utils.chartColors.price,
    };

    // Label specific overrides
    var metricConfig;
    switch (dataset.metric) {
      case "DMA50":
      case "Index DMA50":
        metricConfig = {
          hidden: getFromLocalStorage(dataset.metric, true),
          borderWidth: 1.5,
          borderColor: "hsl(38, 85%, 65%)",
          backgroundColor: "hsl(38, 85%, 65%)",
        };
        break;

      case "DMA200":
      case "Index DMA200":
        metricConfig = {
          hidden: getFromLocalStorage(dataset.metric, true),
          borderWidth: 1.5,
          borderColor: "hsl(207, 12%, 50%)",
          backgroundColor: "hsl(207, 12%, 50%)",
        };
        break;

      case "Quarter Sales":
        metricConfig = {
          yAxisID: "y-axis-left",
          chartType: "bar",
          borderColor: "hsl(244, 92%, 80%)",
          backgroundColor: "hsl(244, 92%, 80%)",
        };
        break;

      case "GPM":
        metricConfig = {
          hidden: getFromLocalStorage(dataset.metric, false),
          borderColor: "hsl(338, 92%, 65%)",
          backgroundColor: "hsl(338, 92%, 65%)",
        };
        break;

      case "OPM":
        metricConfig = {
          hidden: getFromLocalStorage(dataset.metric, false),
          borderColor: "hsl(66, 100%, 45%)",
          backgroundColor: "hsl(66, 100%, 45%)",
        };
        break;

      case "NPM":
        metricConfig = {
          hidden: getFromLocalStorage(dataset.metric, false),
          borderColor: "hsl(158, 100%, 28%)",
          backgroundColor: "hsl(158, 100%, 28%)",
        };
        break;

      case "Volume":
        metricConfig = {
          yAxisID: "y-axis-left",
          chartType: "bar",
          borderColor: Utils.chartColors.volume,
          backgroundColor: Utils.chartColors.volume,
        };
        break;

      case "Sales":
      case "Book value":
      case "Quarter EBITDA":
      case "EBITDA":
      case "EPS":
        metricConfig = {
          yAxisID: "y-axis-left",
          chartType: "bar",
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          borderColor: Utils.chartColors.light,
          backgroundColor: Utils.chartColors.light,
        };
        break;

      case "Median Market Cap to Sales":
      case "Median PBV":
      case "Median EV Multiple":
      case "Median PE":
      case "Median Index PE":
      case "Median Index PBV":
      case "Median Index Dividend Yield":
        metricConfig = {
          borderDash: [5, 5],
          borderWidth: 1.5,
          borderColor: Utils.chartColors.grey500,
          backgroundColor: Utils.chartColors.grey500,
        };
        break;

      default:
        metricConfig = {};
        break;
    }

    // handle macros
    var chartType = metricConfig.chartType || chartDataset.chartType;
    if (chartType === "line") {
      chartDataset.type = "line";
      chartDataset.fill = false;
      chartDataset.borderWidth = 2;
      chartDataset.tension = 0.4;
      chartDataset.pointRadius = 0;
      chartDataset.pointHoverRadius = 4;
    } else if (chartType === "step-line") {
      chartDataset.type = "line";
      chartDataset.steppedLine = "before";
      chartDataset.fill = true;
      chartDataset.borderWidth = 0;
      chartDataset.pointRadius = 0;
      chartDataset.pointHoverRadius = 0;
    } else if (chartType === "bar") {
      chartDataset.type = "bar";
      chartDataset.barThickness = "flex";
    }

    // merge metric config
    for (var prop in metricConfig) {
      if (Object.hasOwn(metricConfig, prop)) {
        chartDataset[prop] = metricConfig[prop];
      }
    }

    // remove macros
    for (let index = 0; index < macros.length; index++) {
      const macro = macros[index];
      delete chartDataset[macro];
    }

    return chartDataset;
  }

  function getDataForChart(state) {
    var activeMetrics = state.metrics;
    // select working datasets based on active metrics
    var rawDatasets = state.rawDatasets.filter(
      (dataset) => activeMetrics.indexOf(dataset.metric) >= 0,
    );

    // sort data sets by order
    rawDatasets.sort(
      (a, b) =>
        activeMetrics.indexOf(a.metric) - activeMetrics.indexOf(b.metric),
    );

    var datasets = rawDatasets.map((dataset, idx) =>
      getChartDataset(dataset, idx, state),
    );

    // Prepare yAxes based on yAxisID of datasets
    // group datasets by yAxisID
    var yAxisIDs = {};
    datasets.forEach((dataset) => {
      if (!Object.hasOwn(yAxisIDs, dataset.yAxisID)) {
        yAxisIDs[dataset.yAxisID] = [];
      }
      yAxisIDs[dataset.yAxisID].push(dataset);
    });

    // Axes is plural of axis
    var scales = {};
    for (var yAxisId in yAxisIDs) {
      if (Object.hasOwn(yAxisIDs, yAxisId)) {
        const axesDatasets = yAxisIDs[yAxisId];
        const yAxis = getYAxes(yAxisId, axesDatasets);
        scales[yAxisId] = yAxis;
      }
    }

    return {
      scales: scales,
      datasets: datasets,
    };
  }

  function areSameLength(datasets) {
    if (!datasets) {
      return false;
    }

    if (datasets.length < 2) {
      return true;
    }

    var len = datasets[0].data.length;
    for (let i = 1; i < datasets.length; i++) {
      if (datasets[i].data.length !== len) {
        return false;
      }
    }
    return true;
  }

  function updateChart(chart, state) {
    if (state.rawDatasets.length === 0 || state.metrics.length === 0) return;

    var chartData = getDataForChart(state);
    chart.data.datasets = chartData.datasets;
    if (!chartData.scales["y-axis-left"]) {
      if (chart.options.scales["y-axis-left"]) {
        delete chart.options.scales["y-axis-left"];
      }
    } else {
      chart.options.scales["y-axis-left"] = chartData.scales["y-axis-left"];
    }
    chart.options.scales["y-axis-right"] = chartData.scales["y-axis-right"];

    // Set interaction mode
    var mode = areSameLength(chartData.datasets) ? "index" : "nearest";
    chart.options.interaction.mode = mode;

    chart.update();
    drawLegend(chart);
    updateMetricsIndicator(state.metrics);
    updatePeriodIndicator(state.days);
  }

  // Functions for selecting elements
  function getCompanyInfo() {
    var infoEl = document.getElementById("company-info");
    var companyId = infoEl.getAttribute("data-company-id");
    var isConsolidated = infoEl.getAttribute("data-consolidated");
    return {
      companyId: companyId,
      isConsolidated: isConsolidated,
    };
  }

  function getRawDatasets(days, metrics) {
    var info = getCompanyInfo();
    var params = {
      companyId: info.companyId,
      q: metrics.join("-"),
      days: days,
    };
    if (info.isConsolidated) {
      params.consolidated = "true";
    }
    var url = Utils.getUrl("getChartMetric", params);
    var promise = new Promise((resolve) => {
      Utils.ajax(url, (response) => {
        response = JSON.parse(response);
        resolve(response.datasets);
      });
    });
    return promise;
  }

  // functions for setting periods
  function updatePeriodIndicator(activeDays) {
    var buttons = document.querySelectorAll("#company-chart-days button");
    buttons.forEach((button) => {
      if (parseInt(button.value) === activeDays) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  async function handleActiveDays(chart, state, newDays) {
    state.rawDatasets = await getRawDatasets(newDays, state.metrics);
    state.days = newDays;
    updateChart(chart, state);
  }

  // Functions for plotting metrics
  function updateMetricsIndicator(metrics) {
    metrics = metrics.join("-");
    var allButtons = document.querySelectorAll("#company-chart-metrics button");
    var activeMetricName;
    allButtons.forEach((button) => {
      if (button.value === metrics) activeMetricName = button.innerText;
    });

    // add metric button to focus area if not there
    var focusButtons = document.querySelectorAll(
      "#company-chart-metrics > button",
    );
    var isInFocus = false;
    focusButtons.forEach((button) => {
      if (button.value === metrics) isInFocus = true;
    });
    if (!isInFocus) {
      // change more-active button
      const moreActiveButton = document.getElementById(
        "company-chart-metrics-more-active",
      );
      moreActiveButton.value = metrics;
      moreActiveButton.innerText = activeMetricName;
      moreActiveButton.classList.remove("hidden");

      // hide in dropdown
      const dropdown = document.querySelector(
        "#company-chart-metrics .dropdown-menu",
      );
      const moreButtons = dropdown.querySelectorAll("button");
      moreButtons.forEach((button) => {
        if (button.value === metrics) {
          button.classList.add("hidden");
        } else {
          button.classList.remove("hidden");
        }
      });
      dropdown.classList.remove("open");
    }

    // set active class
    var buttons = document.querySelectorAll("#company-chart-metrics button");
    buttons.forEach((button) => {
      if (button.value === metrics) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  async function handleActiveMetrics(chart, state, optionMetrics) {
    var metrics = optionMetrics.split("-");
    var days = state.days;

    // open all charts except price for max period
    var maxPeriodCharts = ["Quarter Sales"];
    var midPeriodCharts = [
      "Price to Earning",
      "Price to book value",
      "EV Multiple",
      "Market Cap to Sales",
    ];
    var isMaxPeriod =
      metrics.filter((metric) => maxPeriodCharts.includes(metric)).length >= 1;
    var isMidPeriod =
      metrics.filter((metric) => midPeriodCharts.includes(metric)).length >= 1;

    if (isMaxPeriod && days < 500) {
      days = 10000;
    } else if (isMidPeriod && days < 500) {
      days = 1825;
    }

    state.rawDatasets = await getRawDatasets(days, metrics);
    state.metrics = metrics;
    state.days = days;
    updateChart(chart, state);
  }

  function setActive(chart, state, event) {
    var button = event.currentTarget;
    if (button.name === "days") {
      handleActiveDays(chart, state, parseInt(button.value));
    } else if (button.name === "metrics") {
      handleActiveMetrics(chart, state, button.value);
    } else {
      console.error(`Unknown button name: ${button.name}`);
    }
  }

  async function setUpEverything() {
    // set and load data for last 365 days
    const firstButton = document.querySelector('#chart button[name="metrics"]');
    var state = {
      days: 365,
      metrics: firstButton.value.split("-"),
      rawDatasets: [],
    };
    state.rawDatasets = await getRawDatasets(state.days, state.metrics);

    // render first chart
    var target = document.getElementById("canvas-chart-holder");
    var chart = drawChart(target, state);
    updateMetricsIndicator(state.metrics);
    updatePeriodIndicator(state.days);

    window.CompanyChart = {
      setActive: (event) => {
        setActive(chart, state, event);
      },
    };
  }

  setUpEverything();
})();
