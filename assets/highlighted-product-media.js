if (!customElements.get('product-media')) {
 class ProductMedia extends HTMLElement {
    constructor() {
      super();

      this.selectors = {
        slider: '[data-slider]',
        mediaItem: '[data-media-id]',
        modalOpeners: '[data-modal-opener-id]',
        zoomImages: '[data-pswp-image]',
        btnXr: '[data-shopify-xr]',
        mediaCounterIndex: '[data-media-counter-index]'
      };
      this.selectedMediaIndex =
        Number(
          this.querySelector(this.selectors.slider).querySelector(
            '[data-selected]'
          )?.dataset.index
        ) || 0;

      const swiperOptions = JSON.parse(
        this.querySelector(this.selectors.slider).getAttribute(
          'data-swiper-options'
        )
      );

      const withThumbs = this.dataset.withThumbs;

      this.settings = {
        sliderElement: () => {
          const slider = this.querySelector(this.selectors.slider);
          if (!slider) return;
          const sliderId = slider.dataset.slider;
          if (sliderId !== '') {
            return document.getElementById(sliderId);
          }
          return slider;
        },
        sliderInstance: null,
        options: {
          initialSlide: 0,
          navigation: {
            prevEl: this.querySelector('.swiper-button--prev'),
            nextEl: this.querySelector('.swiper-button--next')
          },

          pagination: {
            el: '.swiper-pagination',
            clickable: true
          },

          spaceBetween: 8,
          watchOverflow: true,

          watchSlidesVisibility: true,
          watchSlidesProgress: true,
          preventInteractionOnTransition: true,

          autoHeight: this.dataset.autoHeight,

          on: {
            afterInit: swiper => {
              this.settings.sliderElement().removeAttribute('style');
              const isSwiperGenerated =
                swiper.slides.length > 1 ? true : false;

              if (isSwiperGenerated) {
                const firstSlide = swiper.slides[0];

                const firstSlideVideo =
                  firstSlide.querySelector('video');

                if (firstSlideVideo) {
                  this.playPromise(firstSlideVideo);
                }

                // if firstSlide has youtube, play it
                const firstSlideYoutube =
                  firstSlide.querySelector('.js-youtube');
                if (firstSlideYoutube) {
                  this.playYoutubeVideo(firstSlideYoutube);
                }

                // if firstSlide has vimeo, play it
                const firstSlideVimeo =
                  firstSlide.querySelector('.js-vimeo');
                if (firstSlideVimeo) {
                  this.playVimeoVideo(firstSlideVimeo);
                }
              }
              this.addFocusListeners();
            },
            slideChangeTransitionEnd: swiper => {
              this.setActiveModalOpener(swiper);
            },
            transitionStart: swiper => {
              const videos = swiper.el.querySelectorAll('video');
              Array.from(videos).forEach(video => {
                video.pause();
              });
            },
            transitionEnd: swiper => {


              const isSwiperGenerated =
                swiper.slides.length > 1 ? true : false;

              if (isSwiperGenerated) {
                let slideIndex = swiper.activeIndex;

                const swiperCardWidth = swiper.slides[0].offsetWidth;

                slideIndex = Math.abs(
                  Math.floor(swiper.translate / [swiperCardWidth])
                );

                const activeSlide = Array.from(swiper.slides).find(
                  sliderSlide =>
                    sliderSlide.classList.contains(
                      'swiper-slide-active'
                    )
                );

                // play or pause videos in active and next slides
                const activeSlideVideo =
                  activeSlide.querySelector('video');
                const nextSlideVideo =
                  activeSlide.nextElementSibling?.querySelector(
                    'video'
                  );

                const playVideo = video => {
                  if (video && video.paused) {
                    this.playPromise(video);
                  } else if (video) {
                    video.pause();
                  }
                };

                playVideo(activeSlideVideo);
                playVideo(nextSlideVideo);

                const activeSlideYoutube =
                  activeSlide.querySelector('.js-youtube');
                if (activeSlideYoutube) {
                  this.playYoutubeVideo(activeSlideYoutube);
                }

                const activeSlideVimeo =
                  activeSlide.querySelector('.js-vimeo');
                if (activeSlideVimeo) {
                  this.playVimeoVideo(activeSlideVimeo);
                }
              }
            },
            activeIndexChange: swiper => {
              if (this.querySelector(this.selectors.mediaCounterIndex)) {
                this.querySelector(this.selectors.mediaCounterIndex).textContent = swiper.activeIndex + 1;
              }
            },
            // to prevent vide controls issue on swipe
            touchStart: () => {
              this.querySelectorAll('.media video').forEach(video => {
                video.removeAttribute("controls");
              });
            },
            touchEnd: () => {
              this.querySelectorAll('.media video').forEach(video => {
                video.setAttribute("controls","controls");
              });
            }
          }
        }
      };

      if (swiperOptions) {
        this.settings.options.breakpoints = {
          750: {
            slidesPerView: swiperOptions.slidesPerViewDesktop
          }
        };
      }

      if (withThumbs === 'true') {
        const thumbSettings = {
          swiper: {
            el: ".swiper-thumbs",
            initialSlide: this.selectedMediaIndex,
            centeredSlides: true,
            centeredSlidesBounds: true,
            centerInsufficientSlides: true,
            freeMode: {
              enabled: true
            },
            direction: "horizontal",
            mousewheel: true,
            slidesPerView: 6,
            spaceBetween: 2,
            breakpoints: {
              750: {
                direction: swiperOptions.thumbsDirectionDesktop,
                spaceBetween: 16,
                slidesPerView: "auto",
                slidesOffsetAfter: 400
              }
            },
            on: {
              afterInit: swiper => {
                if (swiper.activeIndex !== 0) swiper.slideTo(0);
                const swiperWrapper = swiper.wrapperEl;
                const observer = new MutationObserver(
                  resetSwiperWrapperTransform
                );

                observer.observe(swiperWrapper, {
                  attributes: true
                });

                function resetSwiperWrapperTransform() {
                  if (
                    swiperWrapper.hasAttribute("style") &&
                    swiperWrapper.style?.transform &&
                    swiperWrapper.style?.transform !==
                      "translate3d(0px, 0px, 0px)"
                  ) {
                    swiperWrapper.style.transform =
                      "translate3d(0px, 0px, 0px)";
                  } else if (
                    swiperWrapper.hasAttribute("style") &&
                    swiperWrapper.style?.transform &&
                    swiperWrapper.style?.transform ===
                      "translate3d(0px, 0px, 0px)"
                  ) {
                    setTimeout(
                      () => {
                        if (
                          swiperWrapper.hasAttribute("style") &&
                          swiperWrapper.style?.transform &&
                          swiperWrapper.style?.transform ===
                            "translate3d(0px, 0px, 0px)"
                        ) {
                          observer.disconnect();
                        }
                      },

                      500
                    );
                  }
                }
              }
            }
          }
        };

        this.settings.options.thumbs = thumbSettings;
        this.settings.options.breakpoints = {
          990: {
            slidesPerView: swiperOptions.slidesPerViewDesktop
          }
        };

        // Add the thumbs-specific event handlers
        this.settings.options.on.init = swiper => {
          setTimeout(() => {
            swiper.thumbs.swiper.el.classList.add(
              'swiper-thumbs--visible'
            );
          }, 10);
        };

        this.settings.options.on.slideChangeTransitionStart =
          swiper => {
            const thumbsSwiper = swiper.thumbs.swiper;
            const activeIndex = swiper.activeIndex;
            const thumbsActiveIndex = thumbsSwiper.activeIndex;
            if (activeIndex !== thumbsActiveIndex) {
              thumbsSwiper.slideTo(activeIndex);
            }
          };
      } else {
        this.settings.options.slidesPerView = 1;
      }

      if (Shopify.designMode) {
        window.addEventListener("shopify:section:load", this.init.bind(this));
      }
    }

    connectedCallback() {
      this.init();
    }

    init() {
      if (this.dataset.mediaZoom  === 'false') this.photoSwipeLightboxInit();
      this.swiperInit();
      window.onresize = () => {
        this.swiperInit();
      }
    }

    swiperInit() {
      this.settings.sliderInstance = new Swiper(
        this.settings.sliderElement(),
        this.settings.options
      );
    }

    addFocusListeners() {
      const slides = this.settings.sliderElement().querySelectorAll('.swiper-slide');
      slides.forEach((slide, index) => {
        slide.setAttribute("tabindex", "0");
        slide.addEventListener("focus", () => {
          this.settings.sliderInstance.slideTo(index + 1);
        });
      });
    }

    photoSwipeLightboxInit() {
      const [
        zoomContainerWidth,
        zoomContainerHeight,
        closeIcon,
        prevIcon,
        nextIcon
      ] = [
        this.offsetWidth,
        this.offsetHeight,
        this.querySelector('[data-close-icon]'),
        this.querySelector('[data-prev-icon]'),
        this.querySelector('[data-next-icon]')
      ];

      function isPhone() {
        return window.innerWidth < 750;
      }

      const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
        gallery: `#product-media--photoswipe`,
        children: "a.product__gallery-toggle",
        mainClass: "pswp--product-media-gallery",

        loop: false,
        showHideAnimationType: "zoom",

        initialZoomLevel: zoomLevelObject => {
          if (isPhone()) {
            return zoomLevelObject.vFill;
          } else {
            return zoomLevelObject.fit;
          }
        },
        secondaryZoomLevel: zoomLevelObject => {
          if (isPhone()) {
            return zoomLevelObject.fit;
          } else {
            return 1;
          }
        },
        pswpModule: PhotoSwipe
      });
      photoSwipeLightboxInstance.addFilter(
        'uiElement',
        (element, data) => {
          if (data.name === 'close') {
            element.innerHTML = closeIcon.innerHTML;
          } else if (data.name === 'arrowPrev') {
            element.innerHTML = prevIcon.innerHTML;
          } else if (data.name === 'arrowNext') {
            element.innerHTML = nextIcon.innerHTML;
          }
          return element;
        }
      );

      // html for video
      photoSwipeLightboxInstance.addFilter(
        'itemData',
        (itemData, index) => {
          if (itemData.type === 'html' && itemData.element) {
            return {
              html: itemData.element.dataset.pswpHtml
            };
          }
          return itemData;
        }
      );

      photoSwipeLightboxInstance.init();

      photoSwipeLightboxInstance.on('beforeOpen', () => {
        document.body.classList.add("oveflow-hidden")
        const videos = this.querySelectorAll('video');
        Array.from(videos).forEach(video => {
          // if video is not playing, call playPromise
          // force to play
            video.play().then(() => {
              // Automatic playback started!
              // Show playing UI.
              // video.play();
            }).catch(error => {
              // Auto-play was prevented
              // Show paused UI.
              video.pause();
            });

        });
      });

      photoSwipeLightboxInstance.on("closingAnimationStart", () => {
        document.body.classList.remove("oveflow-hidden");
      });

      this.addEventListener('dragstart', event => {
        event.preventDefault();
      });
    }

    setActiveMedia(id) {
      const mediaFound = Array.from(
        this.querySelectorAll(this.selectors.mediaItem)
      ).find(media => Number(media.dataset.mediaId) === id);
      if (!mediaFound) return;
      this.settings.sliderInstance.slideTo(
        Number(mediaFound.dataset.index)
      );
    }

    setActiveModalOpener(swiper) {
      const activeSlide = swiper.slides.filter(sliderSlide =>
        sliderSlide.classList.contains('swiper-slide-active')
      )[0];
      if (!activeSlide) return;
      const activeMediaId = activeSlide.dataset.mediaId;
      this.querySelector(
        `${this.selectors.modalOpeners}.is-active`
      )?.classList.remove('is-active');
      this.querySelector(
        `${this.selectors.modalOpeners} [data-media-id="${activeMediaId}"]`
      )?.parentElement.classList.add('is-active');
      const isModel = activeSlide.dataset.mediaType === 'model';
      if (!isModel) return;
      const btnXr = this.querySelector(this.selectors.btnXr);
      btnXr.dataset.shopifyModel3dId = activeMediaId;
    }

    playPromise(video) {
      let playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Automatic playback started!
            // Show playing UI.
            // video.play();
          })
          .catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            video.pause();
          });
      }
    }

    playYoutubeVideo(element) {
      element.contentWindow.postMessage(
        '{"event":"command","func":"' + 'playVideo' + '","args":""}',
        '*'
      );
    }

    playVimeoVideo(element) {
      element.contentWindow.postMessage('{"method":"play"}', '*');
    }
  }
  customElements.define('product-media', ProductMedia);
}

