if (!customElements.get("card-slider")) {
  class CardSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute("data-swiper-options")) || {};

      window.addEventListener("shopify:section:load", () => {
        this.initSlider(swiperOptions);
      });

      this.initSlider(swiperOptions);

      if (this.classList.contains("js-testimonials")) {
        const initOrUpdateSlider = () => {
          const isMobile = window.innerWidth < mobileWidth;
          const isSlideEffect = this.slider && this.slider.params.effect === "slide";

          if ((isMobile && !isSlideEffect) || (!isMobile && isSlideEffect)) {
            this.reInitSlider(swiperOptions);
          }
        };

        initOrUpdateSlider();

        window.addEventListener("resize", initOrUpdateSlider);
      }

      // if window is resized, re-init slider
      window.addEventListener("resize", () => {
        if (swiperOptions.disabledOnMobile && window.innerWidth < mobileWidth) {
          if (this.slider) {
            this.slider.destroy();
          }
        } else if (!this.slider) {
          this.initSlider(swiperOptions);
        }
      });
    }

    reInitSlider(swiperOptions) {
      this.slider.destroy();
      this.initSlider(swiperOptions);
    }

    initSlider(swiperOptions) {
      const progressCircle = document.querySelector(
        `.autoplay-progress--${swiperOptions.sectionId} svg`
      );
      const progressContent = document.querySelector(
        `.autoplay-progress--${swiperOptions.sectionId} span`
      );

      // swiperOptions.disabledOnMobile = true;
      if (
        swiperOptions.disabledOnMobile &&
        window.innerWidth < mobileWidth
      ) {
        return;
      }

      // Swiper Pagination Option
      if (swiperOptions.pagination == "render_bullet") {
        swiperOptions.pagination = {
          el: ".swiper-pagination",
          clickable: true,
          renderBullet: function (i, className) {
            return `
              <button class="${className}">
                <span>${i + 1}</span>
              </button>
            `;
          }
        };
      } else if (swiperOptions.pagination == "progressbar") {
        swiperOptions.pagination = {
          el: ".swiper-pagination",
          type: "progressbar"
        };
      } else if (swiperOptions.pagination == "bullets") {
        swiperOptions.pagination = {
          el: ".swiper-pagination",
          clickable: true
        };
      } else {
        swiperOptions.pagination = false;
      }

      // Swiper Loop Option Check - if swiperOptions.slideCount is less than 2, then loop is disabled
      if (swiperOptions.loop && swiperOptions.slideCount < 2) {
        swiperOptions.loop = false;
      }

      let sliderOptions = {
        slidesPerView: swiperOptions.slidesPerView || 1.1,
        spaceBetween: swiperOptions.spaceBetweenMobile ?? 16,
        resistanceRatio: 0.72,
        navigation: swiperOptions.navigation || { nextEl: ".swiper-button--next", prevEl: ".swiper-button--prev" },
        breakpoints: {
          480: {
            slidesPerView: "auto",
            spaceBetween: swiperOptions.spaceBetweenMobile || 2
          },
          750: {
            slidesPerView: swiperOptions.slidesPerViewDesktop || 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop ?? 16
          }
        }
      };

      const isArticlesSlider = this.classList.contains("js-articles");
      const isCollectionSlider =
        this.classList.contains("js-collections");
      const isFeaturedProductsSlider = this.classList.contains(
        "js-featured-products"
      );

      if (isArticlesSlider || isCollectionSlider || isFeaturedProductsSlider) {
        sliderOptions.breakpoints[575] = {
          slidesPerView: 2
        };
      } else if (this.classList.contains("horizontal-w-media")) {
        sliderOptions = {
          slidesPerView: swiperOptions.slidesPerView || 1.1,
          rewind: swiperOptions.rewind || false,
          followFinger: swiperOptions.followFinger || false,
          spaceBetween: swiperOptions.spaceBetweenMobile || 16,
          pagination: swiperOptions.pagination || false,
          navigation: swiperOptions.navigation || {
            nextEl: ".swiper-button--next",
            prevEl: ".swiper-button--prev"
          },
          loop: swiperOptions.loop || false,
          autoplay: swiperOptions.autoplay || false,
          breakpoints: {
            750: {
              slidesPerView: 2.2,
              spaceBetween: swiperOptions.spaceBetweenDesktop || 16
            },
            990: {
              slidesPerView: 1
            }
          },
          on: {
            autoplayTimeLeft(_s, time, progress) {
              progressCircle.style.setProperty("--progress", 1 - progress);
              progressContent.textContent = `${Math.ceil(time / 1000)}s`;
            }
          }
        };
      } else if (this.classList.contains("vertical-w-media")) {

        if (window.innerWidth > 750) {

        sliderOptions = {
          slidesPerView: swiperOptions.slidesPerView || 1.1,
          rewind: swiperOptions.rewind || false,
          followFinger: swiperOptions.followFinger || false,
          spaceBetween: swiperOptions.spaceBetweenMobile || 16,
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
            renderBullet: function (i, className) {
              return `<button class="${className}"><span>${
                i + 1
              }</span></button>`;
            }
          },
          navigation: swiperOptions.navigation || {
            nextEl: ".swiper-button--next",
            prevEl: ".swiper-button--prev"
          },
          loop: swiperOptions.loop || false,
          autoplay: swiperOptions.autoplay || false,
          breakpoints: {
            750: {
              slidesPerView: 2.2,
              spaceBetween: swiperOptions.spaceBetweenDesktop || 16,
              pagination: {
                el: ".swiper-pagination",
                clickable: true,
                renderBullet: function (i, className) {
                  return `<button class="${className}"><span>${
                    i + 1
                  }</span></button>`;
                }
              }
            },
            990: {
              slidesPerView: 1,
              grid: {
                rows: 3
              }
            }
          }
        };

      } else {
        sliderOptions = {
          slidesPerView: swiperOptions.slidesPerView || 1.1,
          rewind: swiperOptions.rewind || false,
          followFinger: swiperOptions.followFinger || false,
          spaceBetween: swiperOptions.spaceBetweenMobile || 16,
          navigation: swiperOptions.navigation || {
            nextEl: ".swiper-button--next",
            prevEl: ".swiper-button--prev"
          },
          loop: swiperOptions.loop || false,
          autoplay: swiperOptions.autoplay || false,
          on: {
            autoplayTimeLeft(_s, time, progress) {
              progressCircle.style.setProperty(
                "--progress",
                1 - progress
              );
              progressContent.textContent = `${Math.ceil(
                time / 1000
              )}s`;
            }
          }
        };
      }


      } else if (this.classList.contains("carousel-none-media")) {
        sliderOptions = {
          slidesPerView: swiperOptions.slidesPerView || 1.1,
          rewind: swiperOptions.rewind || false,
          followFinger: swiperOptions.followFinger || false,
          spaceBetween: swiperOptions.spaceBetweenMobile || 16,
          pagination: swiperOptions.pagination || false,
          navigation: swiperOptions.navigation || {
            nextEl: ".swiper-button--next",
            prevEl: ".swiper-button--prev"
          },
          loop: swiperOptions.loop || false,
          autoplay: swiperOptions.autoplay || false,
          breakpoints: {
            750: {
              slidesPerView: 2.2,
              spaceBetween: swiperOptions.spaceBetweenDesktop || 16
            },
            990: {
              slidesPerView: 3.2
            }
          },
          on: {
            autoplayTimeLeft(_s, time, progress) {
              progressCircle.style.setProperty(
                "--progress",
                1 - progress
              );
              progressContent.textContent = `${Math.ceil(
                time / 1000
              )}s`;
            }
          }
        };
      } else {
        sliderOptions = {
          effect: "fade",
          slidesPerView: 1,
          rewind: true,
          followFinger: false,
          navigation: {
            nextEl: ".swiper-button--next",
            prevEl: ".swiper-button--prev"
          }
        };
      }

      this.slider = new Swiper(this, sliderOptions);
    }
  }

  customElements.define("card-slider", CardSlider);
}
