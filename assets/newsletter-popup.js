class NewsletterPopup extends ModalDialog {
  constructor() {
    super();
    this.init();
    this.attachEventListeners();
  }

  // Moved all event listeners to a separate method for better organization
  attachEventListeners() {
    this.buttonClose = this.querySelector(".js-button-close");
    this.buttonClose.addEventListener("click", this.closeNewsletter.bind(this));

    if (this.form) {
      this.form.addEventListener("submit", this.onSubscribe.bind(this));
    }
  }

  init() {
    this.delay = this.dataset.delay * 1000;
    this.closed = getCookie("newsletter-closed");
    this.subscribed = getCookie("newsletter-subscribed");
    this.form = this.querySelector(".js-form");
    this.ageVerificationPopup = document.querySelector("age-verification-popup");
  }

  closeNewsletter() {
    setCookie("newsletter-closed", "true");
    this.hide();
  }

  connectedCallback() {
    if (Shopify.designMode) {
      if (this.dataset.openInDesignMode === "true") {
      this.show();
      }
      return;
    }

    this.handlePopupVisibility();
  }

  handlePopupVisibility() {
    if (getCookie("age-verified") !== "true" && this.ageVerificationPopup) {
      this.handleAgeVerificationPopup();
    } else {
      this.showPopupWithDelay();
    }
  }

  handleAgeVerificationPopup() {
    let prevClassState = this.classList.contains("newsletter-popup-is-hidden");

    const observer = new MutationObserver(mutations => {
      const mutation = mutations[0];
      if (mutation.attributeName !== "class") return;

      const currentClassState = mutation.target.classList.contains("newsletter-popup-is-hidden");

      if (prevClassState !== currentClassState) {
        prevClassState = currentClassState;
        if (!currentClassState) {
          this.showPopupWithDelay();
        }
      }
    });

    observer.observe(this, { attributes: true });
  }

  showPopupWithDelay() {
    setTimeout(() => {
      if (this.closed !== "true" && this.subscribed !== "true") {
        this.show();
      }
    }, this.delay);
  }

  onSubscribe() {
    setCookie("newsletter-subscribed", "true");
    this.hide();
  }
}

customElements.define("newsletter-popup", NewsletterPopup);
