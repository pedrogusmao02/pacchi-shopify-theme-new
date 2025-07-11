if (!customElements.get("quick-cart-drawer")) {
  class QuickCartDrawer extends HTMLElement {
    constructor() {
      super();
      if (Shopify.designMode) {
        window.addEventListener("shopify:section:load", this.init.bind(this));
        this.parentElement.addEventListener("shopify:section:select", () => this.open());
        this.parentElement.addEventListener("shopify:section:deselect", () => this.close());
      }
    }

    connectedCallback() {
      this.init();
    }

    init() {
      this.toggleState = false;

      if (!this.classList.contains("is--open")) {
        document
          .querySelector("body")
          .classList.remove("overflow-hidden");
      }

      this.querySelector(".button--close").addEventListener(
        "click",
        this.close.bind(this)
      );
      this.querySelector(
        ".quick-cart-drawer__backdrop"
      ).addEventListener("click", this.close.bind(this));

      this.querySelector(".quick-cart-drawer__blocks").addEventListener("keydown", e => {
        if (e.key === "Escape" && this.toggleState) {
          this.close();
        }

        if (this.toggleState) {
          const focusableElements = this.querySelectorAll(
            'button, [href], input, select, label, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusableElement = focusableElements[0];
          const lastFocusableElement =
            focusableElements[focusableElements.length - 1];

          let isTabPressed = e.key === "Tab";

          if (!isTabPressed) {
            return;
          }

          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              e.preventDefault();
              lastFocusableElement.focus();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              e.preventDefault();
              firstFocusableElement.focus();
            }
          }
        }
      });

      this.initTriggers();
    }

    initTriggers() {
      const observer = new MutationObserver(() => {
        document
          .querySelectorAll(".quick-cart-drawer__trigger")
          .forEach(element => {
            if (!element._init) { // Daha önce eklenmiş mi kontrol edin
              element.addEventListener("click", event => {
                this.fetchProductForQuickCartDrawer(event);
              });
              element._init = true; // Eklenmiş olarak işaretleyin
            }
          });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    async fetchProductForQuickCartDrawer(event) {
      /** stop autoplay on quick cart trigger */
      if (event.target.closest("card-product-slider")) {
        event.target
          .closest("card-product-slider")
          .slider.autoplay.stop();
        event.target
          .closest("card-product-slider")
          .classList.add("product--open-on-quick-cart");
      }

      const isRecommendations = event.target.classList.contains(
        "quick-cart-drawer__trigger--recommendations"
      );

      const productCard = event.target.closest("product-card");
      let productOptions = null;

      if (!isRecommendations) {
        if (!productCard) return;
        // get all checked options
        productOptions = productCard.querySelectorAll(
          'input[type="radio"]:checked, select'
        );
      }

      const trigger = event.target.closest("[data-product-url]");
      trigger.classList.toggle("is--loading");
      try {
        const productCardResponse = await fetch(
          `${trigger.dataset.productUrl}/?view=quick-cart`
        );
        if (!productCardResponse) return;

        const productCardHTML = await productCardResponse.text();
        const productCard = document.createElement("DIV");
        productCard.insertAdjacentHTML("beforeend", productCardHTML);
        if (!productCard.querySelector(".quick-cart-product")) return;
        this.querySelector(".quick-cart-drawer__main").innerHTML = "";
        this.querySelector(".quick-cart-drawer__main").append(
          productCard.querySelector(".quick-cart-product")
        );

        this.sliderInstance = new Swiper(".quick-cart-drawer__media-swiper", {
          slidesPerView: 1.25,
          spaceBetween: 8,
          freeMode: {
            enabled: true
          },
          breakpoints: {
            750: {
              slidesPerView: 2
            }
          }
        });
      } catch (error) {
        // console.log(error);
      } finally {
        trigger.classList.toggle("is--loading");

        if (!isRecommendations) {
          // update quick cart drawer options with product options
          productOptions.forEach(productOption => {
            // console.log(productOption);
            const quickCartDrawerOption = this.querySelector(
              `[name="${productOption.name}"][value="${productOption.value}"]`
            );
            const quickCartDrawerOptionLabel = quickCartDrawerOption.parentElement.parentElement.querySelector('legend');
            const quickCartDrawerOptionLabelInnerHTML =
              quickCartDrawerOptionLabel.innerHTML;

            // before updating radio button state, remove checked attribute for specific name
            this.querySelectorAll(
              `[name="${productOption.name}"]`
            ).forEach(radioInput => {
              radioInput.removeAttribute("checked");
              radioInput.closest("li").classList.remove("checked");
            });

            if (quickCartDrawerOption) {
              quickCartDrawerOption.setAttribute("checked", "");
              const quickCartDrawerOptionLabelSpan = quickCartDrawerOptionLabel.querySelector('[data-selected-variant]');
              if (quickCartDrawerOptionLabelSpan) {
                quickCartDrawerOptionLabelSpan.innerHTML = productOption.value;
              }
            }

            // update variant id in product card with selected variant id
            this.querySelector("product-card").querySelector(
              'input[name="id"]'
            ).value = productCard.querySelector(
              'input[name="id"]'
            ).value;

            // update radio button state
            if (quickCartDrawerOption) {
              quickCartDrawerOption
                .closest("li")
                .classList.add("checked");
            }

            // initilise for disabled states to be checked and updated
            this.querySelector("product-card").init();
          });
        }

        // short wait before opening drawer
        setTimeout(() => {
          this.open();
        }, 500);

        // add small delay to open drawer
        // this.open();

        // update label when variant is selected
        this.querySelector(".quick-cart-drawer__main")
          .querySelectorAll(".variant-option-radio-input")
          .forEach(radioInput => {
            radioInput.addEventListener("change", event => {
              const quickCartDrawerOptionLabel = event.target.parentElement.parentElement.querySelector('legend');
              const quickCartDrawerOptionLabelSpan = quickCartDrawerOptionLabel.querySelector('[data-selected-variant]');
              if (quickCartDrawerOptionLabelSpan) {
                quickCartDrawerOptionLabelSpan.innerHTML = event.target.value;
              }

              // update variant id in product card with selected variant id
              const selectedVariantId = this.querySelector(
                ".product-card__add-to-cart--form input[name='id']"
              ).value;

              // get product variants data
              const productVariantsData = this.querySelector("product-card").variantsObj;
              const featuredMedia = productVariantsData.find(
                variant => variant.id == selectedVariantId
              )?.featured_media;

              if (featuredMedia) {
                this.setActiveMedia(featuredMedia.id);
              }
            });
          });
      }
    }

    setActiveMedia(id) {
      const mediaFound = Array.from(
        this.querySelectorAll("[data-media-id]")
      ).find(media => Number(media.dataset.mediaId) === id);
      if (mediaFound) {
        this.sliderInstance.slideTo(Number(mediaFound.dataset.index));
      }
    }

    /** Drawer coreß functions */
    toggle() {
      if (!this.toggleState) {
        this.open();
      } else {
        this.close();
      }
    }

    open() {
      this.toggleState = true;
      document.querySelector("body").classList.add("overflow-hidden");
      const quickCartDrawer = document.querySelector(".quick-cart-drawer__blocks");
      const closeButton = quickCartDrawer.querySelector(".button--close");
      quickCartDrawer.setAttribute("tabindex", "0");
      closeButton.setAttribute("tabindex", "0");
      this.classList.add("is--open");
      this.opened();

      const firstFocusableElement = this.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }

    close() {
      this.toggleState = false;

      const shopTheLookDrawer = document.querySelector("shop-the-look-drawer");

      if(shopTheLookDrawer && !shopTheLookDrawer.classList.contains("is--open")) {
        document
          .querySelector("body")
          .classList.remove("overflow-hidden");
      }
      if(!shopTheLookDrawer) {
        document
          .querySelector("body")
          .classList.remove("overflow-hidden");
      }
      this.classList.remove("is--open");
      this.closed();
      this.toggleAriaExpanded();

      /** start autoplay on quick cart drawe close */
      if (document.querySelector("card-product-slider.product--open-on-quick-cart")) {
        document.querySelector("card-product-slider.product--open-on-quick-cart").slider.autoplay.start();
        document.querySelector("card-product-slider.product--open-on-quick-cart").classList.remove("product--open-on-quick-cart");
      }
    }

    toggleAriaExpanded(event) {
      if (event) {
        if (event.target.closest("button"))
          event.target
            .closest("button")
            .setAttribute("aria-expanded", true);
        this.querySelector(".button--close").setAttribute(
          "aria-expanded",
          true
        );
      } else {
        document
          .querySelectorAll('[aria-controls="quick-cart-drawer"]')
          .forEach(button => {
            button.setAttribute("aria-expanded", false);
          });
      }
    }

    opened() {
      const openedEvent = new Event("opened", { bubbles: true });
      this.dispatchEvent(openedEvent);
    }

    closed() {
      const closedEvent = new Event("closed", { bubbles: true });
      this.dispatchEvent(closedEvent);
    }
  }

  customElements.define("quick-cart-drawer", QuickCartDrawer);
}
