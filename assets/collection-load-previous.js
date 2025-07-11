if (!customElements.get("collection-load-previous")) {
  class CollectionLoadPrevious extends HTMLElement {
    constructor() {
      super();

      this.btnLoadPrevious = this.querySelector(
        ".js-btn-load-previous"
      );
      this.productGrid = document.querySelector("#product-grid");

      this.setProperties();

      const updateProductCount = () => {
        const productCount = document.querySelectorAll('.collection__grid .product-card').length;
        const productCountOfAll = document.querySelector('.collection-facets__product-count .product-count-of-all');
        if (productCountOfAll) {
          productCountOfAll.innerText = productCount;
        }
      };
      updateProductCount();

      this.btnLoadPrevious.addEventListener('click', e => {
        e.preventDefault();
        this.btnLoadPrevious.setAttribute('disabled', true);

        this.loadPreviousProducts().then(() => {
          updateProductCount();
          this.btnLoadPrevious.removeAttribute('disabled');
        });
      });
      this.checkPageParameter();
    }

    checkPageParameter() {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get("page") || "1";
      const previousButton = document.querySelector(
        "collection-load-previous"
      );

      if (page === "1" && previousButton) {
        previousButton.style.display = "none";
      }
    }

    setProperties() {
      this.productGrid = document.querySelector("#product-grid");
      this.btnLoadPrevious = this.querySelector(
        ".js-btn-load-previous"
      );
    }

    async loadPreviousProducts() {
      try {
        const prevPageResponse = await fetch(
          `${this.btnLoadPrevious.dataset.href}`
        );
        const prevPageText = await prevPageResponse.text();

        const prevPageHTML = new DOMParser().parseFromString(
          prevPageText,
          "text/html"
        );

        const productGridContainer = prevPageHTML.querySelector(
          "#ProductGridContainer"
        );
        const productGrid =
          productGridContainer.querySelector("#product-grid");

        this.productGrid.insertAdjacentHTML(
          "afterbegin",
          productGrid.innerHTML
        );

        const prevButtonOnNewPage = prevPageHTML.querySelector(
          ".js-btn-load-previous"
        );
        if (prevButtonOnNewPage) {
          const prevPageLink = prevButtonOnNewPage.dataset.href;
          this.btnLoadPrevious.dataset.href = prevPageLink;
        }

        const currentUrl = new URL(window.location.href);
        const currentUrlParams = new URLSearchParams(
          currentUrl.search
        );
        const currentPage =
          parseInt(currentUrlParams.get("page"), 10) || 1;

        currentUrlParams.set("page", currentPage - 1);
        currentUrl.search = currentUrlParams.toString();

        history.replaceState({}, "", currentUrl.toString());

        this.checkPageParameter();
      } catch (error) {
        console.error(error);
        alert(error.message);
      } finally {
        this.btnLoadPrevious.removeAttribute("disabled");
      }
    }
  }

  customElements.define(
    "collection-load-previous",
    CollectionLoadPrevious
  );
}
