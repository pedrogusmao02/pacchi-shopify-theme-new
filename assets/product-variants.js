class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

class QuantityInputDawn extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}

customElements.define('quantity-input-dawn', QuantityInputDawn);

class ProductVariantSelects extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('change', (event) => {
      const target = this.getInputForEventTarget(event.target);
      this.updateSelectionMetadata(event);

      publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
        data: {
          event,
          target,
          selectedOptionValues: this.selectedOptionValues,
        },
      });
    });
  }

  updateSelectionMetadata({ target }) {
    const { value, tagName } = target;

    if (tagName === 'SELECT' && target.selectedOptions.length) {

      Array.from(target.options)
        .find((option) => option.getAttribute('selected'))
        .removeAttribute('selected');

      // change previous target.selectedOptions with new value
      const newSelectedOption = Array.from(target.options).find((option) => option.value === value);
      if (newSelectedOption) {
        newSelectedOption.setAttribute('selected', 'selected');
      }

      const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
      const selectedDropdownSwatchValue = target
        .closest('.product-form__input')
        .querySelector('[data-selected-value] > .product-option__swatch');
      if (!selectedDropdownSwatchValue) return;
      if (swatchValue) {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
        selectedDropdownSwatchValue.classList.remove('product-option__swatch--unavailable');
      } else {
        selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
        selectedDropdownSwatchValue.classList.add('product-option__swatch--unavailable');
      }

      selectedDropdownSwatchValue.style.setProperty(
        '--swatch-focal-point',
        target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
      );
    } else if (tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = target.closest(`.product-form__input`).querySelector('[data-selected-value]');
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  getInputForEventTarget(target) {
    return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
  }

  get selectedOptionValues() {
    return Array.from(this.querySelectorAll('select option[selected], fieldset input:checked')).map(
      ({ dataset }) => dataset.optionValueId
    );
  }
}
customElements.define('product-variant-selects', ProductVariantSelects);

if (!customElements.get('product-info')) {
  customElements.define(
    "product-info",
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();

        this.quantityInput = this.querySelector(".quantity__input");
        this.productMediaGallery = this.querySelector(`[id^="MediaGallery-${this.dataset.section}"]`);
        this.productVariantSelects = this.querySelector('product-variant-selects');
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        this.initQuantityHandlers();
        this.dispatchEvent(
          new CustomEvent("product-info:loaded", { bubbles: true })
        );
        this.initUpdateMedia();

        if (this.productMediaGallery && this.productMediaGallery.dataset.hideOtherVariantsMedia === 'true') {
          this.updateVariantMedia();
        }
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector(
          ".product-form__quantity"
        );
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(
            PUB_SUB_EVENTS.cartUpdate,
            this.fetchQuantityRules.bind(this)
          );
        }
      }

      initUpdateMedia() {
        const variantIdFromUrl = parseInt(window.location.search.split('?').filter(item => item.includes('variant='))[0]?.split('=')[1]) || null;
        if (!variantIdFromUrl) { return; }
        const variant = this.getSelectedVariant(this);
        if (!variant || !variantIdFromUrl) { return; }
        if (variant?.id === variantIdFromUrl) {
          this.updateMedia(variant?.featured_media?.id);
        }
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber();
        this.cartUpdateUnsubscriber?.();
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push(html =>
          html
            .querySelectorAll(".scroll-trigger")
            .forEach(element =>
              element.classList.add("scroll-trigger--cancel")
            )
        );
        this.postProcessHtmlCallbacks.push(newNode => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR();
        });
      }

      handleOptionValueChange({
        data: { event, target, selectedOptionValues }
      }) {
        if (!this.contains(event.target)) return;

        this.resetProductFormState();

        const productUrl =
          target.dataset.productUrl ||
          this.pendingRequestUrl ||
          this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage =
          this.dataset.updateUrl === "true" && shouldSwapProduct;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(
            productUrl,
            selectedOptionValues,
            shouldFetchFullPage
          ),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
            : this.handleUpdateProductInfo(productUrl)
        });
      }

      resetProductFormState() {
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true);
        productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return html => {
          this.productModal?.remove();

          const selector = updateFullPage
            ? "product-info[id^='MainProduct']"
            : "product-info";
          const variant = this.getSelectedVariant(
            html.querySelector(selector)
          );
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector("head title").innerHTML =
              html.querySelector("head title").innerHTML;

            HTMLUpdateUtility.viewTransition(
              document.querySelector("main"),
              html.querySelector("main"),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          } else {
            HTMLUpdateUtility.viewTransition(
              this,
              html.querySelector("product-info"),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          }
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
          .then(response => response.text())
          .then(responseText => {
            this.pendingRequestUrl = null;
            const html = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            callback(html);
          })
          .then(() => {
            // set focus to last clicked option value
            document.querySelector(`#${targetId}`)?.focus();
          })
          .catch(error => {
            if (error.name === "AbortError") {
              // console.log("Fetch aborted by user");
            } else {
              // console.error(error);
            }
          });
      }

      getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode.querySelector(
          "product-variant-selects [data-selected-variant]"
        )?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      buildRequestUrlWithParams(
        url,
        optionValues,
        shouldFetchFullPage = false
      ) {
        const params = [];

        !shouldFetchFullPage &&
          params.push(`section_id=${this.sectionId}`);

        if (optionValues.length) {
          params.push(`option_values=${optionValues.join(",")}`);
        }

        return `${url}?${params.join("&")}`;
      }

      updateOptionValues(html) {
        const productVariantSelects = html.querySelector("product-variant-selects");
        if (productVariantSelects) {
          HTMLUpdateUtility.viewTransition(
            this.variantSelectors,
            productVariantSelects,
            this.preProcessHtmlCallbacks
          );
        }
      }

      handleUpdateProductInfo(productUrl) {
        return html => {
          const variant = this.getSelectedVariant(html);

          // this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);
          this.updateVariantDiscountBadge(variant?.price, variant?.compare_at_price);
          this.updateVariantDetails(variant?.id);

          if (this.productMediaGallery && this.productMediaGallery.dataset.hideOtherVariantsMedia === 'true') {
            this.updateVariantMedia(html);
          }

          if (!variant) {
            this.setUnavailable();
            return;
          }

          this.updateMedia(variant?.featured_media?.id);

          const updateSourceFromDestination = (
            id,
            shouldHide = source => false
          ) => {
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const destination = this.querySelector(`#${id}-${this.dataset.section}`);

            if (source && destination) {

              destination.innerHTML = source.innerHTML;

              if (id === 'Inventory') {
                const inventoryThreshold = parseInt(source.dataset.inventoryThreshold);
                const inventoryQuantity = parseInt(source.dataset.inventoryQuantity);
                destination.classList.toggle("hidden", inventoryThreshold && inventoryQuantity > inventoryThreshold || inventoryQuantity < 1);
              } else {
                destination.classList.toggle("hidden", shouldHide(source));
              }
            }
          };

          updateSourceFromDestination("ProductPurchaseInfo");
          updateSourceFromDestination("ProductStickyCart");

          updateSourceFromDestination("price");
          updateSourceFromDestination("Sku", ({ classList }) => classList.contains("hidden"));

          updateSourceFromDestination("Inventory", ({ innerText }) => innerText === "");

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(
            `#Quantity-Rules-${this.dataset.section}`
          )?.classList.remove("hidden");

          this.productForm?.toggleSubmitButton(
            html
              .getElementById(`ProductSubmitButton-${this.sectionId}`)
              ?.hasAttribute("disabled") ?? true,
            window.variantStrings.soldOut
          );

          publish(PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: this.sectionId,
              html,
              variant
            }
          });
        };
      }

      updateVariantMedia() {
        const select_variant_options_handle = this.querySelector(
          'product-variant-selects [data-selected-variant-options-handle]'
        )?.innerHTML.trim();

        if (!select_variant_options_handle) {
          const productAllVariants = this.productVariantSelects.querySelector('[data-all-variants]').innerHTML.trim();

          // Make sure to attach the event listener to the correct element
          this.productVariantSelects.addEventListener('click', (event) => {
            const closestVariantOptionInput = event.target.closest('.product-option__input');

            // Ensure that you are finding the correct input
            if (closestVariantOptionInput) {
              const closestVariantOptionInputValue = closestVariantOptionInput.value;

              // Parse productAllVariants and check for the selected variant
              const availableVariant = JSON.parse(productAllVariants).find(variant => {
                return variant.options.some(option => option === closestVariantOptionInputValue);
              });
            } else {
              // console.log('No variant option input found');
            }
          });
        }

        this.productMediaGallery.querySelectorAll('[data-media-group]').forEach(element => element.classList.add('hidden'));

        this.productMediaGallery.querySelectorAll(`[data-media-group="${select_variant_options_handle}"]`).forEach(element => element.classList.remove('hidden'));

        this.productMediaGallery.querySelectorAll('swiper-product-gallery').forEach(swiperSlide => {
          if (swiperSlide.instance) {
            swiperSlide.instance.update(); // Update the Swiper instance
          } else {
            swiperSlide.init(); // If the instance is not available, reinitialize
          }
        });
      }

      updateVariantOptionMedia() {
        this.productMediaGallery.querySelectorAll('[data-media-group]:not(.hidden)').forEach(element => {

        });
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        ).forEach(productForm => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = variantId ?? "";
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }

      updateURL(url, variantId) {
        this.querySelector("share-button")?.updateUrl(
          `${window.shopUrl}${url}${
            variantId ? `?variant=${variantId}` : ""
          }`
        );

        if (this.dataset.updateUrl === "false") return;
        window.history.replaceState(
          {},
          "",
          `${url}${variantId ? `?variant=${variantId}` : ""}`
        );
      }

      updateSellingPlanURL(sellingPlanId, selectedVariantId) {
        if (!selectedVariantId) return;
        if (!sellingPlanId) {
          window.history.replaceState({}, "", `${window.location.href.replace(/&selling_plan=\d+/, "")}`);
        } else {
          const params = new URLSearchParams(window.location.search);
          params[params.has("variant") ? "set" : "append"](
            "variant",
            selectedVariantId
          );
          if (sellingPlanId) {
            params[params.has("selling_plan") ? "set" : "append"](
              "selling_plan",
              sellingPlanId
            );
          } else {
            params.delete("selling_plan");
          }
          window.history.replaceState({}, "", `${this.dataset.url}?${params.toString()}`);
        }
      }

      updateVariantDetails(variantId) {
        const productVariantDetails = this.querySelectorAll('.product__metafield_for_variant-block');
        if (productVariantDetails) {
          productVariantDetails.forEach((productVariantDetail) => {
            const block_id = productVariantDetail.getAttribute('data-block-id');
            const metafieldDataElement = this.querySelector(`#product__metafield_for_variant-block--${block_id}`);
            if (!metafieldDataElement) {
              return;
            }
            try {
              let productVariantDetailsData = JSON.parse(metafieldDataElement?.textContent);
              productVariantDetail.innerHTML = productVariantDetailsData?.[variantId]?.replaceAll('\n', '<br />') || '';
            } catch (error) {
              console.error('Error parsing JSON', error);
            }
          });
        }
      }

      updateVariantDiscountBadge(price, compare_at_price) {
        const discountBadge = this.querySelector(".product-card__badge--discount");
        if (!discountBadge) return;


        if (compare_at_price > price) {
          discountBadge.classList.remove("hidden");
          const percentageElement = discountBadge.querySelector(".percentage");
          // calculate discount percentage
          const discountPercentage = Math.round(
            ((compare_at_price - price) / compare_at_price) * 100
          );
          // update discount percentage
          percentageElement.textContent = discountPercentage;
        } else {
          discountBadge.classList.add("hidden");
        }
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(
          true,
          window.variantStrings.unavailable
        );

        const selectors = [
          "price",
          "Inventory",
          "Sku",
          "Quantity-Rules"
        ]
          .map(id => `#${id}-${this.dataset.section}`)
          .join(", ");
        document
          .querySelectorAll(selectors)
          .forEach(({ classList }) => classList.add("hidden"));
      }

      updateMedia(variantFeaturedMediaId) {
        if (!variantFeaturedMediaId) return;

        if (
          this.querySelector(".main-product__media")?.hasAttribute(
            "data-desktop-grid"
          ) && window.innerWidth >= 750
        ) {
          this.scrollToImage(variantFeaturedMediaId);
        }

        const productMedia = this.querySelector(
          "swiper-product-gallery"
        );
        productMedia?.setActiveMedia(variantFeaturedMediaId);
      }

      scrollToImage(variantFeaturedMediaId) {
        this.querySelectorAll("[data-media-id]").forEach(img => {
          if (
            img.getAttribute("data-media-id") ==
            variantFeaturedMediaId
          ) {
            img.scrollIntoView({
              block: "end",
              behavior: "smooth"
            });
          }
        });
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.quantityInput.dataset.cartQuantity
            ? parseInt(this.quantityInput.dataset.cartQuantity)
            : 0,
          min: this.quantityInput.dataset.min
            ? parseInt(this.quantityInput.dataset.min)
            : 1,
          max: this.quantityInput.dataset.max
            ? parseInt(this.quantityInput.dataset.max)
            : null,
          step: this.quantityInput.step
            ? parseInt(this.quantityInput.step)
            : 1
        };

        let min = data.min;
        const max =
          data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min)
          min = Math.min(min, data.step);

        this.quantityInput.min = min;

        if (max) {
          this.quantityInput.max = max;
        } else {
          this.quantityInput.removeAttribute("max");
        }
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const currentVariantId =
          this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        this.querySelector(
          ".quantity__rules-cart .loading__spinner"
        ).classList.remove("hidden");
        fetch(
          `${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`
        )
          .then(response => response.text())
          .then(responseText => {
            const html = new DOMParser().parseFromString(
              responseText,
              "text/html"
            );
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch(e => console.error(e))
          .finally(() =>
            this.querySelector(
              ".quantity__rules-cart .loading__spinner"
            ).classList.add("hidden")
          );
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(
          `Quantity-Form-${sectionId}`
        );
        const selectors = [
          ".quantity__input",
          ".quantity__rules",
          ".quantity__label"
        ];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === ".quantity__input") {
            const attributes = [
              "data-cart-quantity",
              "data-min",
              "data-max",
              "step"
            ];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) {
                current.setAttribute(attribute, valueUpdated);
              } else {
                current.removeAttribute(attribute);
              }
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get productModal() {
        return document.querySelector(
          `#ProductModal-${this.dataset.section}`
        );
      }

      get pickupAvailability() {
        return this.querySelector(`pickup-availability`);
      }

      get variantSelectors() {
        return this.querySelector("product-variant-selects");
      }

      get relatedProducts() {
        const relatedProductsSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          "related-products"
        );
        return document.querySelector(
          `product-recommendations[data-section-id^="${relatedProductsSectionId}"]`
        );
      }

      get quickOrderList() {
        const quickOrderListSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          "quick_order_list"
        );
        return document.querySelector(
          `quick-order-list[data-id^="${quickOrderListSectionId}"]`
        );
      }

      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }
    }
  );
}

if (!customElements.get('product-form')) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.variantIdInput.disabled = false;
        this.form.addEventListener(
          "submit",
          this.onSubmitHandler.bind(this)
        );
        this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText =
          this.submitButton.querySelector("span");

        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (
          this.submitButton.getAttribute("aria-disabled") === "true"
        )
          return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading__spinner").classList.remove(
          "hidden"
        );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart
              .getSectionsToRender()
              .map(section => section.section)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then(response => response.json())
          .then(response => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector(
                ".sold-out-message"
              );
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButtonText.classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: formData.get("id"),
                cartData: response
              });
            this.error = false;
            this.cart.renderContents(response);
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error)
              this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading__spinner").classList.add(
              "hidden"
            );
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute(
          "hidden",
          !errorMessage
        );

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute("disabled", "disabled");
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute("disabled");
          this.submitButtonText.textContent = this.hasAttribute(
            "data-has-selling-plan"
          )
            ? window.variantStrings.addSubscriptionToCart
            : this.submitButtonText.textContent = this.hasAttribute(
                "data-has-pre-order"
              )
            ?  window.variantStrings.preOrder
            : window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }
    }
  );
}

