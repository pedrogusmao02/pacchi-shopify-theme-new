class AgeVerificationPopup extends ModalDialog {
  constructor() {
    super();
    if (Shopify.designMode) {
      window.addEventListener('shopify:section:load', this.init.bind(this));
    }
    this.init();
  }

  init() {
    this.ageVerified = getCookie("age-verified");

    this.noButton = this.querySelector(".button-no");
    this.yesButton = this.querySelector(".button-yes");

    // other popup elements
    this.newsletterPopup = document.getElementById(
      "NewsletterModal-newsletter-popup"
    );

    this.attachButtonListeners();

    setTimeout(() => {
      if (this.hasAttribute("open") && this.classList.contains('age-verification-popup--blurred')) {
        document.body.classList.add("age-verification-popup-is-open");
      }
    }, 5000);
  }

  connectedCallback() {
    if (Shopify.designMode) {
      if (this.dataset.openInDesignMode === "true") {
        this.show();
      }
      return;
    }

    this.showPopupIfNecessary();
  }

  showPopupIfNecessary() {
    if (!this.ageVerified || this.ageVerified === "false") {
      if (this.newsletterPopup) {
        this.newsletterPopup.classList.add(
          "newsletter-popup-is-hidden"
        );
      }
      this.show();
    }
  }

  attachButtonListeners() {
    if (this.noButton) {
      this.noButton.addEventListener("click", () => {
        setCookie("age-verified", "false");
        this.handleNoButtonClick();
      });
    }

    if (this.yesButton) {
      this.yesButton.addEventListener("click", () => {
        this.setAgeVerifiedTrue();
        this.hide();
      });
    }
  }

  setAgeVerifiedTrue() {
    setCookie("age-verified", "true");
  }

  handleNoButtonClick() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = this.noButton.href;
    }
  }

  show() {
    super.show();

    if (this.classList.contains('age-verification-popup--blurred')) {
      document.body.classList.add("age-verification-popup-is-open");
    }
  }

  hide() {
    super.hide();

    document.body.classList.remove("age-verification-popup-is-open");

    if (this.getAttribute("data-open-in-design-mode")) {
      this.removeAttribute("data-open-in-design-mode");
    }

    if (this.newsletterPopup) {
      this.newsletterPopup.classList.remove(
        "newsletter-popup-is-hidden"
      );
    }
  }
}

customElements.define("age-verification-popup", AgeVerificationPopup);
