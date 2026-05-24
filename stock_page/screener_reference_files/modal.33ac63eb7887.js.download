(() => {
  function openModal(modal) {
    window.document.body.classList.add("noScroll");
    modal.showModal();
  }

  function handleClose() {
    window.document.body.classList.remove("noScroll");
  }

  function addOutsideClickListener(modal) {
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) {
        return;
      }

      // close only when click is outside dialog box, not on empty area inside it.
      const rect = modal.getBoundingClientRect();
      const isInsideDialog =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInsideDialog) {
        modal.close();
      }
    });
  }

  function getRandomId() {
    const uid = Math.random().toString(16).slice(2);
    return `modal-${uid}`;
  }

  function createModal(title, side) {
    const modal = document.createElement("dialog");
    modal.classList.add("modal");
    if (side?.right) {
      modal.classList.add("modal-right");
    } else if (side?.bottom) {
      modal.classList.add("modal-bottom");
    }

    const modalBody = document.createElement("div");
    modalBody.classList.add("modal-body");
    modal.appendChild(modalBody);

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("flex", "flex-space-between", "modal-header");
    modalBody.appendChild(modalHeader);

    const modalTitle = document.createElement("div");
    modalTitle.classList.add("modal-title");
    modalTitle.innerText = title || "";
    modalHeader.appendChild(modalTitle);

    const modalHeaderButtons = document.createElement("div");
    modalHeaderButtons.classList.add("flex", "gap-8", "modal-header-buttons");
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    const icon = document.createElement("i");
    icon.setAttribute("class", "icon-cancel-thin font-size-18 ink-700");
    closeButton.append(icon);
    modalHeaderButtons.appendChild(closeButton);
    modalHeader.appendChild(modalHeaderButtons);

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");
    modalBody.appendChild(modalContent);

    // event listeners
    dialogPolyfill.registerDialog(modal);

    closeButton.addEventListener("click", () => {
      modal.close();
    });

    modal.addEventListener("close", handleClose);
    addOutsideClickListener(modal);

    // append to document
    document.body.append(modal);
    modal.id = getRandomId();
    return modal;
  }

  function openInModal(event, callback) {
    const button = event.currentTarget;
    const side = {};
    side.right = button.dataset.isRightModal;
    side.bottom = button.dataset.isBottomModal;
    const title = button.dataset.title;
    const url = button.dataset.url;

    // open if modal is already created
    if (button.dataset.modalId) {
      const oldModal = document.getElementById(button.dataset.modalId);
      openModal(oldModal);
      return;
    }

    const xhr = Utils.ajax(url, (html) => {
      const requestUrl = new URL(url, document.baseURI).href;
      // No Modal content in case of redirect
      if (!xhr.responseURL || xhr.responseURL !== requestUrl) {
        window.location = url;
        return;
      }

      // save modal reference
      const modal = createModal(title, side);
      button.dataset.modalId = modal.id;

      // update modal content
      const modalContent = modal.querySelector(".modal-content");
      openModal(modal);
      Utils.setInnerHTML(modalContent, html);
      if (callback) {
        callback(modal);
      }
    });
  }

  function showInModal(selector, button) {
    const modal = createModal();
    modal.classList.add("show-in-modal");
    const targetEl = document.querySelector(selector);

    // copy targetEl in modal
    const copyEl = targetEl.cloneNode(true);
    copyEl.id = "";
    const modalContent = modal.querySelector(".modal-content");
    modalContent.appendChild(copyEl);

    if (button?.dataset.title) {
      const modalTitle = modal.querySelector(".modal-title");
      modalTitle.innerText = button.dataset.title;
    }

    openModal(modal);
  }

  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    openModal(modal);
  }

  function closeThis(event) {
    const modal = event.currentTarget.closest("dialog.modal");
    modal.close();
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.close();
  }

  function getModal(anyChildSelector) {
    const el = document.querySelector(anyChildSelector);
    const modal = el.closest("dialog");
    return modal;
  }

  function setupEverything() {
    window.Modal = {
      createModal: createModal,
      openInModal: openInModal,
      showInModal: showInModal,
      showModal: showModal,
      hideModal: hideModal,
      closeThis: closeThis,
      getModal: getModal,
    };
  }

  setupEverything();
})();
