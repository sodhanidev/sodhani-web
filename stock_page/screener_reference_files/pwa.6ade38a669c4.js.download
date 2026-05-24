(() => {
  function installServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers not supported");
      return;
    }

    // registering service worker again is noop if already installed
    // we need to change the file url to update
    navigator.serviceWorker.register("/service-worker.js?v2", { scope: "/" });
  }

  function setupA2HS() {
    var deferredPrompt;
    var buttons = document.querySelectorAll(".a2hs");
    buttons.forEach((button) => {
      button.classList.add("hidden");
    });

    console.log("setupA2HS");
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Stash the event so it can be triggered later.
      deferredPrompt = e;

      // Update UI to notify the user they can add to home screen
      buttons.forEach((button) => {
        button.classList.remove("hidden");
        button.addEventListener("click", () => {
          // hide our user interface that shows our A2HS button
          button.style.display = "none";
          // Show the prompt
          deferredPrompt.prompt();
          // Wait for the user to respond to the prompt
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
              console.log("User accepted the A2HS prompt");
            } else {
              console.log("User dismissed the A2HS prompt");
            }
            deferredPrompt = null;
          });
        });
      });
    });
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }

  function isPWA() {
    try {
      if (
        window.matchMedia &&
        !window.matchMedia("(display-mode: tabbed)").matches &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: minimal-ui)").matches)
      )
        return true;
    } catch (error) {
      console.log("matchMedia not supported", error);
    }

    if (typeof navigator.standalone === "boolean" && navigator.standalone)
      return true;

    return false;
  }

  function isInternalLink(url) {
    try {
      const link = new URL(url, window.location.origin);
      return link.origin === window.location.origin;
    } catch (_error) {
      console.log("URL parsing failed, treating as internal:", url);
      return true;
    }
  }

  function setupLinkInterception() {
    var pwa = isPWA();
    if (!pwa || !isMobileDevice()) return;

    document.addEventListener(
      "click",
      (e) => {
        var target = e.target;
        if (!target || typeof target.closest !== "function") return;

        var a = target.closest('a[target="_blank"]');
        if (!a) return;

        if (!isInternalLink(a.href)) return;

        var isModified =
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
        if (isModified) return;

        e.preventDefault();
        window.location.assign(a.href);
      },
      true,
    );
  }

  function setupFormInterception() {
    var pwa = isPWA();
    if (!pwa || !isMobileDevice()) return;

    document.addEventListener(
      "submit",
      (e) => {
        var form = e.target;
        // This listener is global; ignore synthetic or unexpected non-form events.
        if (!form || typeof form.getAttribute !== "function") return;
        if (form.getAttribute("target") !== "_blank") return;

        var submitter = e.submitter;
        var action =
          (submitter && submitter.getAttribute("formaction")) ||
          form.getAttribute("action") ||
          window.location.href;

        if (!isInternalLink(action)) return;

        form.setAttribute("target", "_top");
      },
      true,
    );
  }

  function setup() {
    installServiceWorker();
    // add add to home screen
    setupA2HS();
    setupLinkInterception();
    setupFormInterception();
  }

  setup();
})();
