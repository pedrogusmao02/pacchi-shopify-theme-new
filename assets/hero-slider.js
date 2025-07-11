if(!customElements.get('hero-slider')) {
  class HeroSlider extends HTMLElement {
    constructor() {
      super();

      if (Shopify.designMode) {
        window.addEventListener("shopify:section:load", e => {
          this.mountSlider();
        });
      }

      this.mountSlider();

      window.addEventListener("shopify:block:select", e => {
        const selectedSlideIndex = +e.target.dataset.index;
        this.slider.slideTo(selectedSlideIndex, 600);
      });
      this.lastActiveIndex = null;
      this.addKeyboardNavigation();
    }

    mountSlider() {
      const autoplayOptions = {
        delay: this.dataset.autoplayInterval
      };

      this.slider = new Swiper(this, {
        rewind: true,
        slidesPerView: 1,
        speed: 600,
        followFinger: false,
        navigation: {
          nextEl: ".swiper-button--next",
          prevEl: ".swiper-button--prev"
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          renderBullet: function (i, className) {
            return `
            <button class="${className}">
              <span>0${i + 1}</span>
              <svg class="square-progress" width="26" height="26">
                <rect class="square-origin" width="26" height="26" rx="5" ry="5" />
              </svg>
              <svg class="progress" width="18" height="18" style="inset-inline-start: ${
                0 - (i * 2.4 + 3.4)
              }rem">
                <circle class="circle-origin" r="8" cx="9.5" cy="9.5"></circle>
              </svg>
            </button>
            `;
          }
        },
        autoplay:
          this.dataset.autoplay === "true" ? autoplayOptions : false,
        on: {
          init: this.handleSlideChange.bind(this),
          slideChange: this.handleSlideChange.bind(this)
        }
      });
    }

    handleSlideChange(swiper) {
      this.handleSlideChangeAnimations(swiper);

      /** change header menu color for active slide */
      let headerInner = document.querySelector(".header__inner");
      let heroInners = document.querySelectorAll(".hero__inner");

      if (!headerInner || !heroInners) {
        return;
      }

      // change --transparent-header-menu-text-color value on document style attributes
      document.documentElement.style.setProperty(
        "--transparent-header-menu-text-color",
        heroInners[swiper.activeIndex].dataset.headerMenuTextColor
      );
    }
    /**
     * get direction & set custom transitions
     * with delay for content animation items
     * */
    handleSlideChangeAnimations(swiper) {
      let delay = 300;
      const queryElement = `[data-index="${swiper.activeIndex}"]`;
      const queryArray = [
        ...swiper.wrapperEl.querySelector(queryElement).querySelectorAll('.hero__animation') || []
      ];
      if (!queryArray.length) {
        return;
      }

      // set all element in delay
      queryArray.forEach((element) => {
        element.classList.add('in-delay');
      });

      // get direction and set transitions
      if (this.lastActiveIndex > swiper.activeIndex) {
        delay = 650 + delay;
        swiper.wrapperEl.style.transitionDuration = '1000ms';
        swiper.wrapperEl.style.transitionTimingFunction = 'cubic-bezier(0.45, 0.00, 0.15, 0.95)';
      } else if (this.lastActiveIndex < swiper.activeIndex) {
        delay = 1000 + delay;
        swiper.wrapperEl.style.transitionDuration = '1000ms';
        swiper.wrapperEl.style.transitionTimingFunction = 'cubic-bezier(0.45, 0.00, 0.15, 0.95)';
      }

      // set delay calculated per item
      setTimeout(() => {
        if (this.lastActiveIndex > swiper.activeIndex) {
          delay = 325 + delay;
        } else if (this.lastActiveIndex < swiper.activeIndex) {
          delay = 500 + delay;
        }
        queryArray.forEach((element, index) => {
          if (index === 1) {
            delay = delay + 50;
          } else if (index === 2) {
            delay = delay + 175;
          } else if (index === 3) {
            delay = delay + 300;
          }
          element.classList.remove("in-delay");
        });
      }, delay);

      // set last active global
      this.lastActiveIndex = swiper.activeIndex;
    }
    addKeyboardNavigation() {
      document.addEventListener("keydown", event => {
        if (this.isInViewport()) {
          if (event.key === "ArrowRight") {
            const nextButton = this.querySelector(
              ".swiper-button--next"
            );
            if (nextButton) {
              nextButton.click();
            }
          }
          if (event.key === "ArrowLeft") {
            const prevButton = this.querySelector(
              ".swiper-button--prev"
            );
            if (prevButton) {
              prevButton.click();
            }
          }
        }
      });
    }

    isInViewport() {
      const rect = this.getBoundingClientRect();
      return (
        rect.top < window.innerHeight && // top part in viewport
        rect.bottom > 0 && // bottom part in viewport
        rect.left < window.innerWidth && // left part in viewport
        rect.right > 0 // right part in viewport
      );
    }

  }
  customElements.define('hero-slider', HeroSlider);
}
