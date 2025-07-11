(() => {
  if (customElements.get('product-form')) {
    return;
  }

  class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.submitButton = this.form.querySelector('[name="add"]');
      this.cartDrawer = document.querySelector('cart-drawer');
      this.productBar = document.querySelector(
        `#ProductBar-${this.dataset.sectionId}`
      );

      this.form.addEventListener(
        'submit',
        this.onSubmitHandler.bind(this)
      );
    }

    onSubmitHandler(event) {
      event.preventDefault();
      const purchaseOptions = document.querySelector(
        'purchase-options'
      );
      if (
        !!purchaseOptions &&
        !purchaseOptions.isOneTimePurchase() &&
        !this.hasAttribute('data-has-selling-plan')
      ) {
        purchaseOptions.showError();
        return;
      }

      this.submitButton.classList.add('disabled');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      const formData = new FormData(this.form);
      formData.append(
        'sections',
        this.cartDrawer
          .getSectionsToRender()
          .map(section => section.section)
      );
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then(response => response.json())
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.message);
            return;
          }

          this.cartDrawer.renderContents(response);
          const cartDrawerCounter = document.querySelector(
            ".cart-drawer__title-counter"
          );
          if (cartDrawerCounter) {
            var counterValue = cartDrawerCounter.innerHTML;
            counterValue = parseInt(counterValue) + 1;
            cartDrawerCounter.innerHTML = counterValue;
          }
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.submitButton.classList.remove('disabled');
        });
    }

    handleErrorMessage(errorMessage = false) {
      const errorWrapper = this.querySelector('[data-error-wrapper]');
      if (!errorWrapper) return;
      errorWrapper.classList.toggle('hidden', !errorMessage);
      errorWrapper.textContent = errorMessage || '';
      setTimeout(() => {
        errorWrapper.classList.add('hidden');
      }, 5000);
    }

    toggleAddButton(disable, text) {
      [
        this.submitButton,
        this.productBar?.querySelector('[name="add"]')
      ].forEach(submitButton => {
        if (disable) {
          submitButton?.setAttribute('disabled', 'disabled');
          if (text && submitButton) submitButton.textContent = text;
        } else if (submitButton) {
          submitButton.removeAttribute('disabled');
          submitButton.textContent = this.hasAttribute(
            'data-has-selling-plan'
          )
            ? window.variantStrings.addSubscriptionToCart
            : window.variantStrings.addToCart;
        }
      });
    }
  }

  customElements.define('product-form', ProductForm);
})();
