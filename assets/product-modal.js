class ProductModal extends ModalDialog {
  constructor() {
    super();
    this.sliderInstance = new Swiper(
      this.querySelector('[data-modal-slider]'),
      {
        slidesPerView: 1,
        navigation: {
          prevEl: this.querySelector('.swiper-button--prev'),
          nextEl: this.querySelector('.swiper-button--next')
        },
        on: {
          slideChangeTransitionEnd: swiper => {
            this.playActiveSlideVideo(swiper);
          }
        }
      }
    );
  }

  show(opener) {
    this.openedBy = opener;
    this.setAttribute('open', '');
    trapFocus(this, this.dialogHolder);
    window.pauseAllMedia();

    if (opener.hasAttribute('data-model-opener')) {
      this.showActiveMedia(opener.dataset.mediaId);
      return;
    }

    this.showActiveMedia();
  }

  hide() {
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }

  connectedCallback() {
    const swiperContainer = this.querySelector('[data-modal-slider]');

    const hideModalOnClickOutside = event => {
      const clickedOutsideModal = !this.contains(event.target);
      const clickedInsideSwiper = swiperContainer.contains(
        event.target
      );
      if (
        !this.openedBy ||
        (clickedOutsideModal && !clickedInsideSwiper)
      ) {
        this.hide();
      }
    };

    document.addEventListener('click', hideModalOnClickOutside);

    // Remove the click event listener when the modal is closed
    document.body.addEventListener('modalClosed', () => {
      document.removeEventListener('click', hideModalOnClickOutside);
    });

    // this.dialogHolder.addEventListener('click', event => {
    //   event.stopPropagation();
    // });
  }

  showActiveMedia(activeMedia = 'videos') {
    if (activeMedia !== 'videos') {
      const activeMediaId =
        this.openedBy.getAttribute('data-media-id');
      const activeMedia = this.querySelector(
        `[data-media-id="${activeMediaId}"]`
      );
      activeMedia?.loadContent();
      activeMedia.parentElement.classList.add('swiper-slide');
      activeMedia.parentElement.classList.remove('hidden');
      this.querySelectorAll('[data-media-id]').forEach(media => {
        if (media === activeMedia) {
          return;
        }
        media.parentElement.classList.remove('swiper-slide');
        media.parentElement.classList.add('hidden');
      });
      this.sliderInstance.update();
      return;
    }

    const modalMedia = this.querySelectorAll('[data-media-id]');
    modalMedia.forEach(media => {
      if (media.tagName.toLowerCase() === 'product-model') {
        media.parentElement.classList.remove('swiper-slide');
        media.parentElement.classList.add('hidden');
        return;
      }
      media.parentElement.classList.add('swiper-slide');
      media.parentElement.classList.remove('hidden');
    });

    this.querySelector(
      '[data-media-id]:not(.hidden [data-media-id])'
    ).loadContent();
  }

  hide() {
    super.hide();
    pauseAllMedia();
    const activeModel = this.querySelector(
      '.swiper-slide-active product-model'
    );
    if (!activeModel) {
      return;
    }
    activeModel.removeAttribute('loaded');
    activeModel.querySelector('.shopify-model-viewer-ui')?.remove();
  }

  playActiveSlideVideo(swiper) {
    pauseAllMedia();
    const activeSlide = swiper.slides.filter(sliderSlide =>
      sliderSlide.classList.contains('swiper-slide-active')
    )[0];
    activeSlide.querySelector('deferred-media').loadContent();
  }
}

customElements.define('product-modal', ProductModal);
