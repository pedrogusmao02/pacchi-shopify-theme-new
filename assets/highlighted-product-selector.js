if (!customElements.get('product-selector')) {
  class ProductSelector extends HTMLElement {
    constructor() {
      super();
      this.mainElement = this.closest('.highlighted-product');
      this.inputWrapper = '[data-input-wrapper]';
      this.variants = JSON.parse(
        this.querySelector('[type="application/json"]').textContent
      );
      this.variantOptionInputs = this.querySelectorAll('.product-option__input');
      this.form = document.querySelector(
        `#ProductForm-${this.dataset.sectionId}`
      );
      this.purchaseOptions = document.querySelector(
        `#Product-Purchase-Options-${this.dataset.sectionId}`
      );
      this.productBar = document.querySelector(
        `#ProductBar-${this.dataset.sectionId}`
      );
      this.installmentsForm = document.querySelector(
        `#Product-Installments-${this.dataset.installmentsFormId}` // check: `${this.dataset.installmentsFormId}`
      );
      this.addEventListener('change', this.onVariantChange);
      this.addEventListener('keydown', this.onKeyDown);
      this.updateOptions();
      this.updateVariantStatuses();
      this.updateVariant();
      this.updateMedia();
      this.scrollToImage();

      this.form?.toggleAddButton(!this.currentVariant.available, '');
    }

    updateVariantStatuses() {
      const optionOneValue = this.querySelector(
        this.inputWrapper
      ).querySelector(':checked').value;
      const selectedOptionOneVariants = this.variants.filter(
        variant => optionOneValue === variant.option1
      );
      const inputWrappers = [
        ...this.querySelectorAll(this.inputWrapper)
      ];

      inputWrappers.forEach((option, index) => {
        if (index === 0) return;

        const previousOptionSelected =
          inputWrappers[index - 1].querySelector(':checked').value;
        const listOfAvailableOptions = selectedOptionOneVariants
          .filter(
            variant =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map(variantOption => variantOption[`option${index + 1}`]);

        const optionInputs = [
          ...option.querySelectorAll('input[type="radio"], option')
        ];

        optionInputs.forEach(input => {
          const inputIsDisabled = !listOfAvailableOptions.includes(
            input.getAttribute('value')
          );

          input.disabled = inputIsDisabled;
          if (input.tagName.toLowerCase() === 'option') {
            const escapedValue = input.value.replace(/"/g, '\\"');
            const selector = `button[data-value="${escapedValue}"]`;
            const button = input
              .closest('dropdown-input')
              .querySelector(selector);
            if (button) {
              button.disabled = inputIsDisabled;
            }
          }
          if (!this.productBar) return;
          const inputId = input.dataset.id || input.id;
          const productBarInput = this.productBar.querySelector(
            `option[data-id="${inputId}"]`
          );
          if (!productBarInput) return;
          productBarInput.disabled = inputIsDisabled;
        });
      });

      // add .is-active class to selected swatch with coming from URL
      this.querySelectorAll('input[type="radio"]').forEach(input => {
        if (input.checked) {
          input.nextElementSibling.classList.add('is-active');
        }
      });

      this.updateVariantOptionsLegend();
    }

    updatePriceForVariant(variantId) {
      // variants contains the variant data, including price
      const selectedVariant = this.variants.find(
        variant => variant.id === variantId
      );

      if (selectedVariant) {
        const priceContainer = this.mainElement.querySelector(".price__container");
        if (!priceContainer) return;
        const moneyFormat = priceContainer.dataset.moneyFormat;
        const price = formatPrice(
          moneyFormat,
          selectedVariant.price / 100
        );
        const compare_at_price = formatPrice(
          moneyFormat,
          selectedVariant.compare_at_price / 100
        );
        const labelPriceRegular =
          priceContainer.dataset.labelPriceRegular;
        const labelPriceSale = priceContainer.dataset.labelPriceSale;

        if (compare_at_price > price) {
          // generate html block and append to price container
          const priceHtml = `
            <div class="price__sale">
              <div class="price__sale-inner">
                <span class="visually-hidden">${labelPriceSale}</span>
                <s>${compare_at_price}</s>
                <ins>
                  <span class="visually-hidden">${labelPriceRegular}</span>
                  ${price}
                </ins>
              </div>
            </div>
          `;
          priceContainer.innerHTML = priceHtml;
        } else {
          // generate html block and append to price container
          const priceHtml = `
            <div class="price__sale">
              <div class="price__sale-inner">
                <span class="visually-hidden">${labelPriceRegular}</span>
                ${price}
              </div>
            </div>
          `;
          priceContainer.innerHTML = priceHtml;
        }
      }
    }

    updateDiscountBadgeForVariant(variantId) {
      // variants contains the variant data, including price
      const selectedVariant = this.variants.find(
        variant => variant.id === variantId
      );

      if (selectedVariant) {
        const discountBadge = this.mainElement.querySelector(".product-card__badge--discount");
        if (discountBadge) {
          if (
            selectedVariant.compare_at_price > selectedVariant.price
          ) {
            discountBadge.classList.remove("hidden");
            const percentageElement =
              discountBadge.querySelector(".percentage");
            // calculate discount percentage
            const discountPercentage = Math.round(
              ((selectedVariant.compare_at_price -
                selectedVariant.price) /
                selectedVariant.compare_at_price) *
                100
            );
            // update discount percentage
            percentageElement.textContent = discountPercentage;
          } else {
            discountBadge.classList.add("hidden");
          }
        }
      }
    }

    onKeyDown(event) {
      if (event.key === 'Enter') {
        const target = event.target;
        if (target.classList.contains('swatch')) {
          target.click();
        }
      }
    }

    onVariantChange(event) {
      if (event.target.type === 'number') return;
      this.updateOptions();
      if (this.currentVariant === this.getVariantData()) return;

      this.updateVariant();
      this.updateVariantStatuses();

      // call to update price when variant is changed
      this.updatePriceForVariant(this.currentVariant.id);

      // call to update discount badge when variant is changed
      this.updateDiscountBadgeForVariant(this.currentVariant.id);

      this.productBarUpdateOptions();
      this.updatePickupAvailability();
      this.form.removeAttribute('data-has-selling-plan');
      this.form.toggleAddButton(false, '');
      this.form.handleErrorMessage();

      if (!this.currentVariant) {
        this.form.toggleAddButton(true, '');
        this.setUnavailable();

        return;
      }

      if (!this.currentVariant.available) {
        this.form.toggleAddButton(true, window.variantStrings.soldOut);
      }

      if (!this.closest('.product').classList.contains('highlighted-product')) this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateSKU();
      this.updateVariantOptionsLegend();
      this.updateMedia();
      this.scrollToImage();
    }

    updateOptions() {
      this.querySelectorAll('input[type="radio"]').forEach(input => {
        if (input.disabled) {
          input.nextElementSibling.classList.toggle(
            "is-active",
            false
          );
        } else {
          input.nextElementSibling.classList.toggle(
            "is-active",
            input.checked
          );
        }
      });
      this.options = Array.from(
        this.querySelectorAll('input[type="radio"]:checked, select'),
        el => ({ name: el.dataset.name || el.name, value: el.value })
      );
    }

    productBarUpdateOptions() {
      if (this.productBar) {
        Array.from(this.productBar.querySelectorAll('select')).map(
          selector => {
            selector.value = this.options.find(
              option => option.name === selector.name
            ).value;
          }
        );
        // update dropdowns in product bar
        this.productBar.querySelectorAll('dropdown-input').forEach(
          dropdown => {
            // update dropdown list with usage update() of 'class DropdownInput extends HTMLElement' in global.js
            dropdown.update();
          }
        );
      }
    }

    updateInventoryNotice(html) {
      const destination = this.closest('.product').querySelector('[data-inventory-notice]');
      const source = html.querySelector('[data-inventory-notice]');

      if (source && destination) destination.innerHTML = source.innerHTML;
    }

    updatePickupAvailability() {
      const pickUpAvailabilityNode = document.querySelector(
        'pickup-availability'
      );

      if (!pickUpAvailabilityNode || !this.currentVariant) return;

      pickUpAvailabilityNode.dataset.variantId = this.currentVariant.id;

      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailabilityNode.setAttribute('available', '');
        pickUpAvailabilityNode.fetchAvailability(
          pickUpAvailabilityNode.dataset.variantId
        );

        return;
      }

      pickUpAvailabilityNode.removeAttribute('available');
      pickUpAvailabilityNode.innerHTML = '';
    }

    updateVariant() {
      this.currentVariant = this.getVariantData();
    }

    getVariantData() {
      return this.options.length
        ? this.variants.find(variant => {
            return !variant.options
              .map(
                (option, index) => this.options[index].value === option
              )
              .includes(false);
          })
        : this.variants[0];
    }

    updateMedia() {
      // console.log(this.currentVariant);
      if (!this.currentVariant || !this.currentVariant.featured_media)
        return;

      let productMedia = this.closest('.product').querySelector('product-media');
      if (!productMedia) {
        productMedia = this.closest('.main-product').querySelector('swiper-product-gallery');
      }
      productMedia.setActiveMedia(
        this.currentVariant.featured_media.id
      );
    }

    updateSKU() {
      if (document.querySelector(".product__sku"))
        document.querySelector(".product__sku span").innerText =
          this.currentVariant.sku || "";
    }

    updateURL(sellingPlanId) {
      if (!this.currentVariant) return;
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      if (sellingPlanId) {
        params[params.has('selling_plan') ? 'set' : 'append'](
          'selling_plan',
          sellingPlanId
        );
      } else {
        params.delete('selling_plan');
      }
      window.history.replaceState(
        {},
        '',
        `${this.dataset.url}?${params.toString()}`
      );
    }

    updateVariantInput() {
      const inputs = [
        this.querySelector('[name="id"'),
        this.installmentsForm?.querySelector('[name="id"]')
      ];
      inputs.forEach(input => {
        if (!input) return;
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    setUnavailable() {
      const submitButton = this.form.submitButton;
      const price = this.querySelector(
        `#Product-Price-${this.dataset.sectionId}`
      );

      if (!submitButton) return;
      submitButton.textContent = window.variantStrings.unavailable;
      if (price) price.classList.add('visibility-hidden');
    }

    renderProductInfo() {
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      if (!this.closest('.product').classList.contains('highlighted-product')) {
        params.append('section_id', this.dataset.sectionId);
      }

      fetch(`${this.dataset.url}?${params.toString()}`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html'
          );
          [
            `#Product-Price-${this.dataset.sectionId}`,
            `#Product-Purchase-Options-${this.dataset.sectionId}`,
            '.product__sticky-cart-wrapper',
          ].map(liveRegionSelector => {
            const destination = document.querySelector(
              liveRegionSelector
            );
            const source = html.querySelector(liveRegionSelector);

            this.updateInventoryNotice(html);

            if (destination && source) {
              destination.classList.remove('visibility-hidden');
              destination.innerHTML = source.innerHTML;
            }
          });
        });
    }

updateVariantOptionsLegend() {
  this.variantOptionInputs.forEach(input => {
    const legend = input.closest(".js-product-variants").querySelector('legend');
    const labelSpan = legend.querySelector('.product-selector__label-text');

    if (!labelSpan) return; // Hedef span yoksa işlemi atla

    if (input.checked) {
      const activeVariantOptionLabel = input.nextElementSibling.title;
      let existingSpan = labelSpan.nextElementSibling;

      if (!existingSpan || !existingSpan.classList.contains('active-variant-label')) {
        const span = document.createElement('span');
        span.classList.add('active-variant-label');
        span.textContent = activeVariantOptionLabel;
        labelSpan.insertAdjacentElement('afterend', span);
      } else {
        existingSpan.textContent = activeVariantOptionLabel;
      }
    }
  });
}

    scrollToImage() {
      this
        .closest(".product")
        .querySelectorAll("[data-product-images]")
        .forEach(img => {
          if (
            img
              .getAttribute("data-product-images")
              .includes(this.currentVariant.id)
          )
            img.scrollIntoView({
              behavior: "smooth"
            });
        });
    }
  }
  customElements.define('product-selector', ProductSelector);
}
