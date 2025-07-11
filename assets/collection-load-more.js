if (!customElements.get('collection-load-more')) {
  class CollectionLoadMore extends HTMLElement {
    constructor() {
      super();

      this.btnLoadMore = this.querySelector(
        ".js-btn-load-more"
      ); /* check */
      this.productGrid =
        document.querySelector("#product-grid"); /* check */

      this.setProperties();
      this.toggleProductsVisibility();

      window.addEventListener("shopify:section:load", () => {
        this.setProperties();
        this.toggleProductsVisibility();
      });

      const updateProductCount = () => {
        const productCount = document.querySelectorAll('.collection__grid .product-card').length;
        const productCountOfAll = document.querySelector('.collection-facets__product-count .product-count-of-all');
        if (productCountOfAll) {
          productCountOfAll.innerText = productCount;
        }
      };
      updateProductCount();

      this.btnLoadMore.addEventListener("click", e => {
        e.preventDefault();
        this.btnLoadMore.setAttribute("disabled", true);

        this.loadMoreProducts().then(() => {
          updateProductCount();
          this.btnLoadMore.removeAttribute("disabled");
        });
      });

      if (this.cardText) {
        window.addEventListener("resize", () => {
          // this.setGridColsNumber();

          if (window.innerWidth < mobileWidth) {
            this.resetHiddenProducts();

            return;
          }

          this.toggleProductsVisibility();
        });
      }
    }

    setProperties() {
      this.productGrid = document.querySelector("#product-grid");
      this.cardText = this.productGrid.querySelector(".js-card-text");
      this.btnLoadMore = this.querySelector(".js-btn-load-more");
      this.hiddenProducts = [];
      this.cardTextIndexOffset = 2;
      this.isLastPage = this.classList.contains("hidden");
      this.cardProduct = document.querySelector("card-product");
      this.setGridColsNumber();
    }

    setGridColsNumber() {
      // prettier-ignore
      this.productGridCols = Math.round(this.productGrid.getBoundingClientRect().width / this.cardProduct?.getBoundingClientRect().width);
    }

    toggleProductsVisibility() {
      if (!this.cardText || this.isLastPage) {
        return;
      }

      const items = Array.from(this.productGrid.children);
      const visibleItems = items
        .filter(item => !item.classList.contains("hidden"))
        .reverse();
      const productRect = visibleItems
        .find(item => !item.classList.contains("js-card-text"))
        .getBoundingClientRect();
      const lastItem = visibleItems[0];

      const productGridRect =
        this.productGrid.getBoundingClientRect();
      const lastItemRect = lastItem.getBoundingClientRect();

      const productGridCols = Math.round(
        productGridRect.width / productRect.width
      );
      const productGridOffset =
        productGridRect.x + productGridRect.width;
      const lastItemOffset = lastItemRect.x + lastItemRect.width;

      const isLastItemCardText =
        items[items.length - 1].classList.contains("js-card-text");

      if (isLastItemCardText) {
        const prevProduct = visibleItems[1];
        const prevProductRect = prevProduct.getBoundingClientRect();
        const prevProductOffset =
          prevProductRect.x + prevProductRect.width;

        if (
          lastItemRect.y !== prevProductRect.y &&
          productGridOffset !== prevProductOffset
        ) {
          this.hiddenProducts[0].classList.remove("hidden");
          this.hiddenProducts.shift();
        }
      }

      const isLastColumn = productGridOffset === lastItemOffset;

      if (isLastColumn) {
        if (this.hiddenProducts.length >= productGridCols) {
          this.resetHiddenProducts(productGridCols);
        }

        return;
      }

      // prettier-ignore
      const gridGaps = Math.round((productGridRect.width - (lastItemOffset - productGridRect.x)) / productRect.width);

      if (this.hiddenProducts.length >= gridGaps) {
        const hiddenProductsLimit =
          this.hiddenProducts.length - gridGaps;

        this.resetHiddenProducts(hiddenProductsLimit);

        return;
      }

      let productsLooped = 0;

      for (const product of visibleItems) {
        if (product.classList.contains("js-card-text")) {
          continue;
        }

        productsLooped++;
        this.hiddenProducts.unshift(product);
        product.classList.add("hidden");

        if (productsLooped === productGridCols - gridGaps) {
          break;
        }
      }
    }

    resetHiddenProducts(limit) {
      if (!this.cardText) {
        return;
      }

      const hiddenProducts = [...this.hiddenProducts];
      let i = 0;

      for (const product of hiddenProducts) {
        i++;

        product.classList.remove("hidden");
        this.hiddenProducts.shift();

        if (limit && limit === i) {
          break;
        }
      }
    }

    async loadMoreProducts() {
      try {
        const nextPageResponse = await fetch(
          `${this.btnLoadMore.dataset.href}`
        );
        const nextPageText = await nextPageResponse.text();
        const nextPageHTML = new DOMParser().parseFromString(
          nextPageText,
          "text/html"
        );

        // Select the fetched product grid within .collection__grid
        const newProductsContainer = nextPageHTML.querySelector('.collection__grid');
        const newProducts = Array.from(newProductsContainer.children);

        // Target the existing .collection__grid element in the current document
        const existingProductContainer = document.querySelector('.collection__grid');

        // Append each new product directly into the existing container
        newProducts.forEach(product =>
          existingProductContainer.appendChild(product)
        );

        const loadMoreContainer = nextPageHTML.querySelector(
          "collection-load-more"
        );
        const btnLoadMore = loadMoreContainer?.querySelector(
          ".js-btn-load-more"
        );
        const isLoadMoreHidden =
          loadMoreContainer.classList.contains("hidden");

        if (this.cardText) {
          if (this.cardTextIndexOffset > 0) {
            const cardTextIndex = newProducts.findIndex(product =>
              product.classList.contains("js-card-text")
            );
            const elementAfterCardText =
              newProducts[cardTextIndex - this.cardTextIndexOffset];

            this.cardTextIndexOffset = 0;

            if (elementAfterCardText) {
              const cardText = newProducts[cardTextIndex];
              cardText.remove();
              elementAfterCardText.insertAdjacentElement(
                "beforebegin",
                cardText
              );
            }
          } else {
            this.cardTextIndexOffset = 2;
          }
        }

        this.resetHiddenProducts();
        history.replaceState({}, "", this.btnLoadMore.dataset.href);

        if (isLoadMoreHidden) {
          this.isLastPage = true;
          this.classList.add("hidden");
          return;
        }

        this.toggleProductsVisibility();
        if (btnLoadMore) {
          this.btnLoadMore.dataset.href = btnLoadMore.dataset.href;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.btnLoadMore.removeAttribute("disabled");
      }
    }
  }

  customElements.define('collection-load-more', CollectionLoadMore);
}
