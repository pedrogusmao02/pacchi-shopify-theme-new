if (!customElements.get('announcement-bar-slider')) {
  class AnnouncementBarSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);

      window.addEventListener('shopify:section:load', e => {
        this.initSlider(swiperOptions);
      });
    }

    initSlider(swiperOptions) {

      /*
      // swiperOptions.disabledOnMobile = true;
      if (swiperOptions.disabledOnMobile && window.innerWidth < mobileWidth) {
        return;
      }

      // swiperOptions.disabledOnDesktop = true;
      if (swiperOptions.disabledOnDesktop && window.innerWidth > mobileWidth) {
        return;
      }
      */

      let sliderOptions = {
        slidesPerView: swiperOptions.slidesPerView || 1,
        resistanceRatio: 0.72,
        loop: swiperOptions.loop || false,
        allowTouchMove: swiperOptions.allowTouchMove || true,
        autoplay: swiperOptions.autoplay || false,
        breakpoints: {
          750: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 'auto',
            loop: swiperOptions.loopDesktop || swiperOptions.loop || false,
          }
        }
      };

      this.slider = new Swiper(this, sliderOptions);
    }
  }

  customElements.define('announcement-bar-slider', AnnouncementBarSlider);
}
