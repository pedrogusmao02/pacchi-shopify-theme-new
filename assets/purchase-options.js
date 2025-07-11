class PurchaseOptions extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      product: "[data-main-product]",
      sellingPlanGroups: "[data-selling-plan-group-selector]",
      sellingPlans: "[data-selling-plan-selector]",
      sellingPlansWrapper: "[data-selling-plans-wrapper]"
    };
    this.productBase = false;

    this.productSelector = this.closest(
      this.selectors.product
    ).querySelector("product-selector");

    if (!this.productSelector) {
      this.productSelector = this.closest(this.selectors.product);
      this.productBase = true;
    }

    this.productForm = this.closest(
      this.selectors.product
    ).querySelector("product-form");
  }

  connectedCallback() {
    this.setHandlers();
  }

  setHandlers() {
    this.querySelector(
      this.selectors.sellingPlanGroups
    ).addEventListener(
      "change",
      this.onSellingGroupChange.bind(this)
    );
    this.querySelectorAll(this.selectors.sellingPlans).forEach(
      sellingPlanSelector =>
        sellingPlanSelector.addEventListener("change", event => {
          event.target
            .closest("dropdown-input")
            ?.classList?.remove("has-error");
          this.updateProductSelector(event.target.value);
        })
    );
  }

  onSellingGroupChange(event) {
    if (event.target.value == "one-time") {
      Array.from(
        this.querySelectorAll(this.selectors.sellingPlans)
      ).map(select => {
        select.value = "";
      });

      const sellingPlansWrapper = this.querySelector(
        this.selectors.sellingPlansWrapper
      );
      sellingPlansWrapper.style.maxHeight = "0";
      sellingPlansWrapper.classList.add("is-hidden");


      const sellingPlanInfo = this.closest('.product__purchase-options').querySelector('.product__purchase--info');
      sellingPlanInfo.classList.add("hidden");

      this.updateProductSelector();
      return;
    }

    const sellingPlansWrapperId = event.target.querySelector(
      `option[value="${event.target.value}"]`
    ).dataset.id;

    const sellingPlansWrapper = this.querySelector(
      this.selectors.sellingPlansWrapper
    );
    sellingPlansWrapper
      .querySelectorAll(`[data-id]`)
      .forEach(sellingGroupWrapper => {
        sellingGroupWrapper.classList.toggle(
          "is-hidden",
          sellingGroupWrapper.dataset.id !== sellingPlansWrapperId
        );
      });
    sellingPlansWrapper.style.maxHeight = `${sellingPlansWrapper.scrollHeight}px`;
    sellingPlansWrapper.classList.remove("is-hidden");
  }

  isOneTimePurchase() {
    return (
      this.querySelector('[name="selling_plan_group"]').value ===
      "one-time"
    );
  }

  showError() {
    const sellingPlanWrappers = this.querySelectorAll(
      this.selectors.sellingPlansWrapper
    );
    const activeSellingPlanWrapper = [...sellingPlanWrappers].filter(
      sellingPlanWrapper =>
        !sellingPlanWrapper.classList.contains("is-hidden")
    )[0];
    activeSellingPlanWrapper
      .querySelectorAll("dropdown-input")
      .forEach(dropdownInput =>
        dropdownInput.classList.add("has-error")
      );
  }

  updateProductSelector(sellingPlanId) {
    if (this.productBase) {
      this.updateProductBase(sellingPlanId);
      return;
    }

    if (!this.productSelector.currentVariant) {
      this.productSelector.updateVariant();
    }

    this.productSelector.updateURL(sellingPlanId);
    this.productSelector.renderProductInfo();
    if (
      this.productSelector.currentVariant.available &&
      sellingPlanId
    ) {
      this.productForm.setAttribute("data-has-selling-plan", "true");
      this.productForm.toggleAddButton(false, "");
      return;
    }

    this.productForm.removeAttribute("data-has-selling-plan", true);
    this.productForm.toggleAddButton(false, "");
  }

  updateProductBase(sellingPlanId) {
    const selectedVariant = this.productSelector.getSelectedVariant(
      this.productSelector
    );

    this.productSelector.updateSellingPlanURL(
      sellingPlanId,
      selectedVariant.id
    );
    this.renderPurchaseInfo(selectedVariant.id);

    if (selectedVariant.available && sellingPlanId) {
      this.productForm.setAttribute("data-has-selling-plan", "true");
      this.productForm.toggleSubmitButton(false, "");
      return;
    }

    this.productForm.removeAttribute("data-has-selling-plan");
    this.productForm.toggleSubmitButton(false, "");
  }

  renderPurchaseInfo(selectedVariantId) {
    const params = new URLSearchParams(window.location.search);
    params[params.has("variant") ? "set" : "append"](
      "variant",
      selectedVariantId
    );

    fetch(`${this.productSelector.dataset.url}?${params.toString()}`)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(
          responseText,
          "text/html"
        );
        [
          `#Product-Purchase-Options-${this.productSelector.dataset.section}`,
          `#ProductPurchaseInfo-${this.productSelector.dataset.section}`
        ].map(
          liveRegionSelector => {
            const destination = document.querySelector(
              liveRegionSelector
            );
            const source = html.querySelector(liveRegionSelector);
            if (destination && source) {
              destination.classList.remove("hidden");
              destination.innerHTML = source.innerHTML;
            }
          }
        );
      })
      .catch(error => {
        console.error(error);
      });
  }
}

customElements.define('purchase-options', PurchaseOptions);
