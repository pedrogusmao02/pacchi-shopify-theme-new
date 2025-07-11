if (!customElements.get('product-recommendations')) {
  class ProductRecommendations extends HTMLElement {
    constructor() {
      super();
      this.slider = null;
    }

    connectedCallback() {
      this.performRecommendations();
    }

    performRecommendations() {
      const recommendations = this.querySelector(
        '[data-recommendations]'
      );
      if (!recommendations) return;
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const recommendationsHTML = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('[data-recommendations]')?.innerHTML;
          if (!recommendationsHTML) return;
          this.classList.remove('hidden');
          var cartDrawerItemsFull = document.querySelector('.cart-drawer-items__full');
          if(cartDrawerItemsFull) {
            cartDrawerItemsFull.classList.remove('.cart-drawer-items__full');
          }
          recommendations.innerHTML = recommendationsHTML;
          this.initSlider();

          // initiate quick cart after fetch
          // to activate trigger button events
          setTimeout(() => {
            if (document.querySelector("quick-cart-drawer")) {
              document.querySelector("quick-cart-drawer").init();
            } else {
              // if quick-cart-drawer does not exists, remove trigger buttons
              this.querySelectorAll(".quick-cart-drawer__trigger").forEach(el => {
                el?.remove();
              })
            }
          }, 500);

        });
    }

    initSlider() {
      this.slider = new Swiper(this.querySelector('.swiper'), {
        slidesPerView: 'auto',
        spaceBetween: 16,
      });
    }
  }

  customElements.define('product-recommendations', ProductRecommendations);
}
