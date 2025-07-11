if (!customElements.get("product-asseenon-slider")) {
  class ProductAsSeenOnSlider extends HTMLElement {
    constructor() {
      super();
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
      this.slider = new Swiper(this, {
        centeredSlides: true,
        loop: false,
        slidesPerView: "auto",
        navigation: {
          prevEl: ".swiper-button--prev",
          nextEl: ".swiper-button--next"
        },
        on: {
          activeIndexChange: swiper => {
            this.querySelector(
              "[data-asseenon-media-counter-index]"
            ).textContent = swiper.activeIndex + 1;
          }
        }
      });
    }
  }

  customElements.define(
    "product-asseenon-slider",
    ProductAsSeenOnSlider
  );
}
