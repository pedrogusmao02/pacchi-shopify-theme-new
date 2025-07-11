if (!customElements.get("social-media-highlights-slider")) {
  class SocialMediaHighlightsSlider extends HTMLElement {
    constructor() {
      super();

      /** Store Content Card before initilation */
      this.slideContent = this.querySelector('.section__social-media-highlights--content-card');

      /** Swiper opts & init */
      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};
      const swiperLayout = this.getAttribute("data-swiper-layout") || "default";

      this.sliderItem = this.querySelector('.swiper');

      this.sliderOptions = {
        slidesPerView: 1,
        spaceBetween: swiperOptions.spaceBetweenMobile || 2,
        breakpoints: {
          750: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2
          },
          1100: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 4,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2
          }
        },
        on: {
          afterInit: () =>
            this.querySelector(".swiper-smh").removeAttribute("style")
        }
      };

      if (swiperOptions.autoplaySpeed != 0 && swiperLayout === "default") {
        this.sliderOptions = {
          speed: swiperOptions.autoplaySpeed || 10000,
          autoplay: {
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          ...this.sliderOptions
        };
      }

      if (swiperLayout === "default" ) {
        this.sliderOptions = {
          loop: true,
          ...this.sliderOptions
        };
      }

      if (swiperLayout === "stacked") {
        this.sliderOptions = {
          navigation: {
            prevEl: ".swiper-button--prev",
            nextEl: ".swiper-button--next"
          },
          ...this.sliderOptions
        };
      }

      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', this.init.bind(this));
      }
    }

    connectedCallback() {
      this.init();
    }

    init() {
      this.swiper = new Swiper(this.sliderItem, this.sliderOptions);
      this.toggleSlideContentCard();
    }

    /** Hide / Show Content Card */
    toggleSlideContentCard() {
      let swiperInitialized = false;
      if (window.innerWidth < 750) {
        this.swiper.removeSlide(2);
      }

      const updateSlideContent = () => {
        if (swiperInitialized) {
          if (window.innerWidth < 750) {
            this.swiper.removeSlide(2);
          } else {
            this.swiper.addSlide(2, this.slideContent)
          }
        }
      };

      updateSlideContent();

      window.addEventListener(
        "resize",
        debounce(() => {
          updateSlideContent();
        }, 200)
      );

      this.addEventListener("swiper:init", () => {
        swiperInitialized = true;
      });
    }
  }

  customElements.define("social-media-highlights-slider", SocialMediaHighlightsSlider);
}
