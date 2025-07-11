if (!customElements.get('highlighted-collections')) {
  class HighlightedCollections extends HTMLElement {
    constructor() {
      super();

      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', () => {
          this.init();
        });
      }
      if (window.innerWidth >= 990) {
        this.init();
      }
    }

    init() {
      this.displayImages();
    }

    displayImages() {
      const collectionItems = this.querySelectorAll('.highlighted__collections-item-box');
      const collectionImages = this.querySelectorAll('.highlighted__collections-image');

      collectionItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          collectionItems.forEach(item =>
            item.classList.remove('highlighted__collections-active')
          );

          collectionImages.forEach(img => {
            img.classList.remove("highlighted-img--active");
          });

          const dataImageValue = item.getAttribute('data-image');

          const collectionImage = this.querySelector(
            `[data-hover="image-${dataImageValue}"]`
          );

          if (collectionImage) {
            collectionImage.classList.add('highlighted-img--active');
          }
        });
      });
    }
  }

  customElements.define('highlighted-collections', HighlightedCollections);
}
