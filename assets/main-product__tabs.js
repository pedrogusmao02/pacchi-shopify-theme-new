if (!customElements.get("product-tabs")) {
  class ProductTabs extends HTMLElement {
    constructor() {
      super();
      this.id = this.getAttribute("id");

      if (Shopify.designMode) {
        window.addEventListener(
          "shopify:section:load",
          this.init.bind(this)
        );
      }
    }

    connectedCallback() {
      this.init();
    }

    init() {
      this.querySelectorAll(".product__tab--trigger").forEach(
        tabTrigger => {
          tabTrigger.addEventListener("click", evt => {
            this.openTab(
              evt,
              tabTrigger.dataset.tab
            );
          });
        }
      );

      this.openDefaultTab();
    }

    openDefaultTab() {
      const event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true
      });

      this.querySelector(
        ".product__tab[data-default-open]"
      )?.dispatchEvent(event);
    }

    openTab(evt, tabName) {
      const tabcontents = this.querySelectorAll(
        ".product__tab-content"
      );
      tabcontents.forEach(content => {
        content.style.display = "none";
      });

      const tablinks = this.querySelectorAll(".product__tab");
      tablinks.forEach(link => {
        link.classList.remove("active");
      });

      const currentTabContent = this.querySelector(`#${tabName}`);

      if (currentTabContent) {
        currentTabContent.style.display = "block";
        if (evt.currentTarget) {
          evt.currentTarget.classList.add("active");
        }
      }
    }
  }
  customElements.define("product-tabs", ProductTabs);
}
