if (!customElements.get('shop-the-look-slider')) {
  class ShopTheLookSlider extends customElements.get(
    'card-product-slider'
  ) {
    constructor() {
      super();

      this.dotsList = this.querySelector('.js-dots-list');
      this.pagination = this.querySelector('.shop-the-look--pagination');
      this.nextArrow = this.querySelector('.shop-the-look--next');
      this.prevArrow = this.querySelector('.shop-the-look--prev');

      this.sliderOptions.breakpoints = {
        750: {
          slidesPerView: 1,
          spaceBetween: 72
        },
        990: {
          spaceBetween: 100
        },
        1100: {
          spaceBetween: 130
        },
        1200: {
          spaceBetween: 156
        }
      };

      this.sliderOptions.navigation = {
        prevEl: this.prevArrow,
        nextEl: this.nextArrow,
      }

      this.sliderOptions.pagination = {
        el: this.pagination,
        type: 'progressbar'
      }

      if (Shopify.designMode) {
        window.addEventListener('shopify:section:load', (e) => {
          this.initSlider(this.querySelector('.js-slider'));
        });
      }

      this.initSlider(this.querySelector('.js-slider'));

      this.dotsList?.addEventListener('click', e => {
        const isBtn = e.target.classList.contains('js-btn');

        if (!isBtn) {
          return;
        }

        e.preventDefault();

        const btn = e.target;
        const isCurrent = btn.classList.contains('is-current');

        if (isCurrent) {
          return;
        }

        const btnIndex = +btn.dataset.index;

        this.updateActiveDot(btn);
        this.slider.slideTo(btnIndex, 300);
      });

      this.slider?.on('slideChange', e => {
        const sliderIndex = e.realIndex;
        const btn = this.dotsList?.querySelector(
          `.js-btn[data-index="${sliderIndex}"]`
        );

        this.updateActiveDot(btn);
      });
      this.initDrawer();
    }

    connectedCallback() {}

    updateActiveDot(btn) {
      const currentBtn = this.dotsList?.querySelector(
        '.js-btn.is-current'
      );

      currentBtn.classList.remove('is-current');
      currentBtn.setAttribute('aria-current', false);

      btn.classList.add('is-current');
      btn.setAttribute('aria-current', true);
    }

    initDrawer() {
      const drawer = document.querySelector(
        ".shop-the-look-drawer__blocks"
      );
      const drawerContainer = document.querySelector(
        "shop-the-look-drawer"
      );
      if (!drawer || !drawerContainer) return;
      const handle = drawerContainer.querySelector(
        ".shop-the-look-drawer__handle"
      );
      let startY,
        currentY,
        isDragging = false;

      const closeDrawer = () => {
        drawerContainer.style.display = "none";
        drawerContainer.classList.remove("is--open");
        drawer.style.transform = "translateY(0)";
        drawer.scrollTop = 0;
      };

      handle.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
        isDragging = true;
      });

      handle.addEventListener("touchmove", e => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
          drawer.style.transform = `translateY(${diff}px)`;
        }
      });

      handle.addEventListener("touchend", () => {
        isDragging = false;

        if (currentY - startY > 50) {
          closeDrawer();
        } else {
          drawer.style.transform = "translateY(0)";
        }
      });

      const openDrawer = () => {
        drawerContainer.style.display = "block";
        drawerContainer.classList.add("is--open");
        drawer.style.transform = "translateY(0)";
        drawer.scrollTop = 0;
      };
    }
  }

  customElements.define('shop-the-look-slider', ShopTheLookSlider);
}
