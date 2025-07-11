if (!customElements.get("store-locator-slider")) {
  class StoreLocatorSlider extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener(
          "shopify:section:load",
          this.init.bind(this)
        );
      }
      this.handleResize = this.handleResize.bind(this);
    }

    connectedCallback() {
      this.init();
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("orientationchange", this.handleResize);
    }

    disconnectedCallback() {
      window.removeEventListener("resize", this.handleResize);
      window.removeEventListener("orientationchange", this.handleResize);
    }

    init() {
      this.hasMapLayout = this.classList.contains("store-locator__map-cards");
      this.updateSwiper();
    }

    handleResize() {
      this.updateSwiper();
    }

    updateSwiper() {
      const screenWidth = window.innerWidth;

      if (this.slider) {
        this.slider.destroy(true, true);
        this.slider = null;
      }

      if (this.hasMapLayout && screenWidth > 990) {
        return;
      }

      const swiperSettings = {
        slidesPerView: 1,
        navigation: {
          nextEl: `.swiper-button--next-${this.dataset.sectionId}`,
          prevEl: `.swiper-button--prev-${this.dataset.sectionId}`
        },
        spaceBetween: parseInt(this.dataset.spaceBetween) || 12,
      };

      if (!this.hasMapLayout) {
        swiperSettings.breakpoints = {
          1200: {
            slidesPerView: (parseInt(this.dataset.slidesPerView) * 1.02) || 2,
          },
          750: {
            slidesPerView: 2,
          },
          360: {
            slidesPerView: 1.08,
          },
        };
      }

      this.slider = new Swiper(this, swiperSettings);

      this.slider.on("slideChange transitionEnd", () => {
        const slides = this.querySelectorAll(
          ".store-locator-card.swiper-slide"
        );
        slides.forEach((slide) => {
          slide.style.display = "block";
        });
      });
    }
  }

  customElements.define("store-locator-slider", StoreLocatorSlider);
}
