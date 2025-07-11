if (!customElements.get('recently-viewed-products')) {
  class RecentlyViewed extends customElements.get(
    'card-product-slider'
  ) {
    constructor() {
      super();

      this.section = this.closest('.js-section');
      this.sliderWrapper = this.querySelector('.swiper-wrapper');
      this.productHandle = this.dataset.productHandle;

      this.fetchRecentProducts();

      if (document.querySelector("quick-cart-drawer") && this.querySelector('.swiper-slide')) {
        document.querySelector("quick-cart-drawer").init();
      }

      if (Shopify.designMode) {
        if (document.querySelector("quick-cart-drawer") && this.querySelector('.swiper-slide')) {
          document.querySelector("quick-cart-drawer").init();
        }
      }
    }

    fetchRecentProducts() {
      const productHandles = localStorage.getItem('recently-viewed');

      if (!productHandles) {
        return;
      }

      const productHandlesArray = productHandles
        .split(',')
        .filter(
          productHandle =>
            productHandle &&
            productHandle !== this.productHandle &&
            productHandle !== 'undefined'
        );

      if (productHandlesArray.length === 0) {
        return;
      }

      productHandlesArray.forEach((productHandle, i) => {
        const addRecentProducts = async () => {
          try {
            const productCardResponse = await fetch(
              `${window.Shopify.routes.root}products/${productHandle}?view=card`
            );

            if (!productCardResponse.ok) {
              const productHandles =
                localStorage.getItem('recently-viewed');
              const updatedProductHandles = productHandles
                .replace(`${productHandle},`, '')
                .replace(productHandle, '');

              localStorage.setItem(
                'recently-viewed',
                updatedProductHandles
              );

              return;
            }

            const productCardHTML = await productCardResponse.text();

            const productSlide = document.createElement('DIV');

            productSlide.classList.add(
              'swiper-slide',
              'card-product-slider__slide'
            );
            productSlide.insertAdjacentHTML(
              'beforeend',
              productCardHTML
            );
            if (
              !productSlide.querySelector('product-card') ||
              !productSlide.querySelector('.product-card')
            )
              return;

            this.sliderWrapper.append(productSlide);
          } catch (error) {
            // console.log(error);
          } finally {
            const isLastIteration =
              i === productHandlesArray.length - 1;

            if (!isLastIteration) {
              return;
            }

            this.initSlider();
            this.section?.classList.remove('hidden');
          }
        };

        addRecentProducts();
      });
    }
  }

  customElements.define('recently-viewed-products', RecentlyViewed);
}
