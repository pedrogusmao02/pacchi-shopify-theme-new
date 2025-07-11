// Function to generate section data
const getSectionData = (id, section, selector) => ({ id, section, selector });

// Check cart drawer and set sections to render
const cartDrawer = document.querySelector('cart-drawer');
let sectionsToRender = [];

if (cartDrawer) {
  const mainCartId = document.getElementById('main-cart-items')?.dataset.id;
  if (mainCartId) {
    sectionsToRender = [
      getSectionData(`#shopify-section-${mainCartId}`, mainCartId, `#shopify-section-${mainCartId} cart-items`),
      getSectionData("#cart-counter", "cart-counter", "#shopify-section-cart-counter"),
      getSectionData("#CartDrawer-Body", "cart-drawer", "#shopify-section-cart-drawer #CartDrawer-Body")
    ];
  } else {
    sectionsToRender = [
      getSectionData("#CartDrawer-Body", "cart-drawer", "#shopify-section-cart-drawer #CartDrawer-Body")
    ];
  }
} else {
  const mainCartId = document.getElementById('main-cart-items')?.dataset.id;
  if (mainCartId) {
    sectionsToRender = [
      getSectionData(`#shopify-section-${mainCartId}`, mainCartId, `#shopify-section-${mainCartId} cart-items`),
      getSectionData('#cart-counter', 'cart-counter', '#shopify-section-cart-counter')
    ];
  } else {
    sectionsToRender = [];
  }
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', event => {
      event.preventDefault();
      const cartItems =
        this.closest('cart-drawer-items') ||
        this.closest('cart-items');
      cartItems.updateQuantity(this.dataset.index, 0);
      updateFreeShipping();
    });
  }
}
customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.freeShipping = document.querySelectorAll('shipping-bar');

    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    ).reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce(event => {
      this.onChange(event);
    }, 300);
    this.addEventListener(
      'change', this.debouncedOnChange.bind(this)
    );

    updateFreeShipping();
  }

  calculateTotalItemCount(items) {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  onChange(event) {
    if (event.target.name !== 'updates[]') return;

    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute('name')
    );
  }

  getSectionsToRender() {
    return sectionsToRender;
  }

  updateQuantity(line, quantity, name) {
    this.classList.add('is-loading');

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map(section => section.section),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {
      ...fetchConfig(),
      ...{ body }
    })
      .then(response => response.text())
      .then(state => {
        const parsedState = JSON.parse(state);
        this.getSectionsToRender()?.forEach(section => {
          const elementToReplace = document.querySelector(section.selector) || document.querySelector(section.id);


          if (elementToReplace) {
            if (!parsedState.errors) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(
                parsedState.sections[section.section],
                section.selector
              );
            }
          } else {
            console.error(`Element with selector ${section.selector} not found`);
          }

        });
        if (!parsedState.errors) {
          this.totalItemCount = this.calculateTotalItemCount(parsedState.items);
        }
        this.updateLiveRegions(line, parsedState.item_count, parsedState.errors);

        const lineItem = document.getElementById(`CartItem-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`))
          lineItem.querySelector(`[name="${name}"]`).focus();

        updateCartCounters();
        updateFreeShipping();
      })
      .finally(() => this.classList.remove('is-loading'));
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  updateLiveRegions(line, itemCount, parsedError) {
    if (parsedError) {
      document
        .querySelectorAll(`[data-line-item-error][data-line="${line}"]`)
        .forEach(error => {
          error.innerHTML = parsedError;
        });
    }

    this.currentItemCount = itemCount;
  }
}
customElements.define('cart-items', CartItems);

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("keyup", event => event.code.toUpperCase() === "ESCAPE" && this.close());
    this.setCartLink();
    this.parentElement.addEventListener("shopify:section:select", () => this.open());
    this.parentElement.addEventListener("shopify:section:deselect", () => this.close());
  }

  setCartLink() {
    const cartLink = document.querySelector("[data-cart-link]");
    if (cartLink) {
      cartLink.setAttribute("role", "button");
      cartLink.setAttribute("aria-haspopup", "dialog");
      cartLink.addEventListener("click", event => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener("keydown", event => {
        if (event.code.toUpperCase() !== "SPACE") return;
        event.preventDefault();
        this.open(cartLink);
      });
    } else {
      console.error("Cart link not found");
    }
  }

  open(opener) {
    if (opener) this.setActiveElement(opener);
    this.classList.add("is-visible");
    document.querySelector('body').style.overflow = 'hidden';
    this.addEventListener("transitionend", () => { this.focusOnCartDrawer(); }, { once: true });

    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 100);

    const productReccomendations = document.querySelector(".product-recommendations");
    if (productReccomendations) {
      if (productReccomendations.classList.contains("hidden")) {
        document.querySelector(".cart-drawer-items").classList.add("cart-drawer-items__full");
      } else {
        document.querySelector(".cart-drawer-items").classList.remove("cart-drawer-items__full");
      }
    }
  }

  close() {
    this.classList.remove("is-visible");
    document.querySelector('body').style.overflow = 'auto';
    removeTrapFocus(this.activeElement);

    document.removeEventListener("click", this.handleOutsideClick);

    const isHeaderMenuOpen = header.classList.contains("menu-open");

    if (isHeaderMenuOpen) {
      return;
    }

    // if we are on the cart page, resubmit form
    if (window.location.pathname === "/cart") {
      const cartDrawerForm = document.getElementById("CartDrawer-FormSummary");
      if (cartDrawerForm) {
        cartDrawerForm.submit();
      }
    }
  }

  handleOutsideClick = event => {
    const cartDrawerInner = this.querySelector(".cart-drawer__inner");
    if (cartDrawerInner && !cartDrawerInner.contains(event.target)) {
      this.close();
    }
  };

  setActiveElement(element) {
    this.activeElement = element;
  }

  focusOnCartDrawer() {
    const containerToTrapFocusOn = this.firstElementChild;
    const focusElement = this.querySelector("[data-drawer-close]");
    trapFocus(containerToTrapFocusOn, focusElement);
  }

  renderContents(response, open = true) {
    this.getSectionsToRender()?.forEach(section => {
      const sectionElement = document.querySelector(section.id);
      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(
        response.sections[section.section],
        section.selector
      );

      updateCartCounters();
    });
    if (!open) {
      return;
    }

    this.open();
  }

  getSectionsToRender() {
    return sectionsToRender;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}
customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return sectionsToRender;
  }
}
customElements.define("cart-drawer-items", CartDrawerItems);
