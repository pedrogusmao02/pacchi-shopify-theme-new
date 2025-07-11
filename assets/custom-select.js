if (!customElements.get("custom-select")) {
  class CustomSelect extends HTMLElement {
    constructor() {
      super();

      this.selectEl = this.querySelector("select");

      this.createCustomSelect();

      this.dropdown = this.querySelector(".js-dropdown");
      this.btnToggleDropdown = this.querySelector(".js-btn-dropdown");
      this.listOptions = this.querySelector(".js-list-options");
      this.isExpanded = false;

      this.selectLabel = this.getAttribute("data-label");

      window.addEventListener("shopify:section:load", () => {
        clearTimeout(this.loadTimeout);
      });

      window.addEventListener("resize", () => {
        const isMobileMedium = window.innerWidth < tabletWidth;

        if (isMobileMedium) {
          return;
        }

        const isWidthUnchanged =
          +this.btnToggleDropdown.style.width.replace("px", "") ===
          this.dropdown.clientWidth;

        if (isWidthUnchanged) {
          return;
        }

        this.btnToggleDropdown.style.width = `${this.dropdown.clientWidth}px`;
      });

      this.btnToggleDropdown.addEventListener("click", e => {
        e.preventDefault();

        const isExpanded = this.classList.contains("is-expanded");

        if (isExpanded) {
          this.hideDropdown();

          return;
        }

        this.showDropdown();
      });

      this.btnToggleDropdown.addEventListener("keydown", e => {
        if (e.key.includes("Arrow")) {
          e.preventDefault();

          const isArrowRight = e.key.includes("Right");
          const isHorizontalArrow =
            e.key.includes("Left") || isArrowRight;

          if (this.isExpanded && isHorizontalArrow) {
            return;
          }

          const isNextKey = isArrowRight || e.key.includes("Down");

          const btnOptionSelected = this.listOptions.querySelector(
            ".js-btn-option.is-selected"
          );
          const selectedOptionParent =
            btnOptionSelected.parentElement;
          let prevNextBtnOption = isNextKey
            ? selectedOptionParent.nextElementSibling
                ?.firstElementChild
            : selectedOptionParent.previousElementSibling
                ?.firstElementChild;

          if (!prevNextBtnOption) {
            prevNextBtnOption = isNextKey
              ? this.listOptions.firstElementChild.firstElementChild
              : this.listOptions.lastElementChild.firstElementChild;
          }

          this.changeSelectedOption(
            btnOptionSelected,
            prevNextBtnOption
          );

          return;
        }

        if (!this.isExpanded) {
          return;
        }

        const isEscape = e.key === "Escape";
        const isTab = e.key === "Tab";

        if (!isEscape && !isTab) {
          return;
        }

        e.preventDefault();

        this.hideDropdown();
      });

      this.listOptions.addEventListener("click", e => {
        const isBtnOption =
          e.target.classList.contains("js-btn-option");

        if (!isBtnOption) {
          return;
        }

        e.preventDefault();

        const btnOption = e.target;
        const isSelected =
          btnOption.classList.contains("is-selected");

        this.hideDropdown();

        if (isSelected) {
          return;
        }

        this.changeSelectedOption(undefined, btnOption);
      });

      document.addEventListener("click", e => {
        if (!this.isExpanded) {
          return;
        }

        const isThisSelect =
          e.target.closest("custom-select") === this;

        if (isThisSelect) {
          return;
        }

        this.hideDropdown();
      });
    }

    createCustomSelect() {
      const selectLabel = this.getAttribute("data-label");
      const options = this.querySelectorAll("option");
      const selectedOption = this.selectEl.querySelector(
        'option[selected="selected"]'
      );
      let optionsMarkup = "";

      options.forEach(option => {
        const optionMarkup = `
          <li class="custom-select__item">
            <button
              type="button"
              class="custom-select__option button-reset js-btn-option ${
                option.selected ? "is-selected" : ""
              }"
              data-value="${option.value}"
              tabindex="-1"
              aria-selected="${option.selected}"
            >${option.textContent}</button>
          </li>
        `;

        optionsMarkup += optionMarkup;
      });

      const markup = `
        <div class="custom-select__wrapper">
          <button
            type="button"
            class="custom-select__btn button-reset focus-inset js-btn-dropdown facets__button-custom"
            aria-controls="${this.dataset.dropdownId}"
            aria-expanded="false"
          >
            ${selectedOption.textContent} ${this.dataset.iconChevronDown}
          </button>
          <div class="custom-select__dropdown js-dropdown" id="${this.dataset.dropdownId}">
            <ul class="custom-select__items list-unstyled js-list-options">
              ${optionsMarkup}
            </ul>
          </div>
        </div>
      `;

      this.insertAdjacentHTML("afterbegin", markup);
      this.dataset.value = selectedOption.value;
    }

    changeSelectedOption(
      selectedOption = this.listOptions.querySelector(
        ".js-btn-option.is-selected"
      ),
      newSelectedOption
    ) {
      this.btnToggleDropdown.innerHTML = newSelectedOption.textContent + this.dataset.iconChevronDown;
      this.dataset.value = newSelectedOption.dataset.value;

      newSelectedOption.classList.add("is-selected");
      newSelectedOption.setAttribute("aria-selected", true);

      selectedOption.classList.remove("is-selected");
      selectedOption.setAttribute("aria-selected", false);

      const nativeSelectedOption = this.selectEl.querySelector(
        'option[selected="selected"]'
      );
      const newNativeSelectedOption = this.selectEl.querySelector(
        `option[value="${this.dataset.value}"]`
      );

      nativeSelectedOption.removeAttribute("selected");
      newNativeSelectedOption.setAttribute("selected", "selected");

      // Trigger input event

      const inputEvent = new Event("input", { bubbles: true });

      this.selectEl.dispatchEvent(inputEvent);
    }

    showDropdown() {
      this.isExpanded = true;
      this.classList.add("is-expanded");
      this.btnToggleDropdown.setAttribute("aria-expanded", true);
    }

    hideDropdown() {
      this.isExpanded = false;
      this.classList.remove("is-expanded");
      this.btnToggleDropdown.setAttribute("aria-expanded", false);
    }
  }

  customElements.define("custom-select", CustomSelect);
}
