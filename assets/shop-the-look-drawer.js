
if (!customElements.get("shop-the-look-drawer")) {
  class ShopTheLookDrawer extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener("shopify:section:load", this.init.bind(this));
      }
      this.init();
    }

    init() {
      this.toggleState = false;
      if (!this.classList.contains("is--open")) {
        document.querySelector("body").classList.remove("overflow-hidden");
      }
      this.querySelector(".button--close").addEventListener("click", this.close.bind(this));
      this.querySelector(".shop-the-look-drawer__backdrop").addEventListener("click", this.close.bind(this));
      document.querySelectorAll(".shop-the-look-drawer__trigger").forEach(element => {
        element.addEventListener("click", this.open.bind(this));
      });
    }

    toggle() {
      if (!this.toggleState) {
        this.open();
      } else {
        this.close();
      }
    }

    open() {
      this.toggleState = true;
      document.querySelector("body").classList.add("overflow-hidden");
      this.classList.add("is--open");
    }

    close() {
      this.toggleState = false;
      document.querySelector("body").classList.remove("overflow-hidden");
      this.classList.remove("is--open");
      this.toggleAriaExpanded();
    }

    toggleAriaExpanded(event) {
      if (event) {
        if (event.target.closest("button"))
          event.target.closest("button").setAttribute("aria-expanded", true);
        this.querySelector(".button--close").setAttribute("aria-expanded", true);
      } else {
        document
          .querySelectorAll('[aria-controls="shop-the-look-drawer"]')
          .forEach(button => {
            button.setAttribute("aria-expanded", false);
          });
      }
    }

  }

  customElements.define("shop-the-look-drawer", ShopTheLookDrawer);
}
