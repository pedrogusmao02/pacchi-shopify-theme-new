if (!customElements.get('collection-view')) {
  class CollectionView extends HTMLElement {
    constructor() {
      super();

      this.setInitialStates();

      this.addEventListener('click', e => {
        const isBtn = e.target.classList.contains('js-btn');

        if (!isBtn) {
          return;
        }

        const productGrid = document.querySelector('#product-grid');

        if (!productGrid) {
          return;
        }

        const btnTarget = e.target;
        const btnSelected = this.querySelector('.js-btn[disabled]');

        this.updateStates(btnTarget, btnSelected, productGrid);

        if (Shopify.designMode) {
          return;
        }

        localStorage.setItem(
          'collection-grid-cols',
          btnTarget.dataset.cols
        );
      });
    }

    setInitialStates() {
      const storedCols = localStorage.getItem('collection-grid-cols');

      if (Shopify.designMode || !storedCols) {
        return;
      }

      const productGrid = document.querySelector('#product-grid');

      if (!productGrid || productGrid.dataset.cols === storedCols) {
        return;
      }

      const newBtn = this.querySelector(
        `.js-btn[data-cols="${storedCols}"]`
      );
      const btnSelected = this.querySelector('.js-btn[disabled]');

      this.updateStates(newBtn, btnSelected, productGrid);
    }

    updateStates(newBtn, initialBtn, productGrid) {
      newBtn.setAttribute('disabled', true);
      initialBtn.removeAttribute('disabled');
      productGrid.dataset.cols = newBtn.dataset.cols;

      this.updateGridItems();
    }

    updateGridItems() {
      const collectionLoadMore = document.querySelector(
        'collection-load-more'
      );

      if (!collectionLoadMore) {
        return;
      }

      // collectionLoadMore.setGridColsNumber();
      collectionLoadMore.toggleProductsVisibility();
    }
  }

  customElements.define('collection-view', CollectionView);
}
