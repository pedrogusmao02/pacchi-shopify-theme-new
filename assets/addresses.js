class CustomerCountrySelect extends DropdownInput {
  constructor() {
    super();
  }

  connectedCallback() {
    this.setupCountries();
    this.init();
  }

  setupCountries() {
    if (!Shopify || !Shopify.CountryProvinceSelector) return;
    const formId = this.select.dataset.formId;
    // eslint-disable-next-line no-new
    new Shopify.CountryProvinceSelector(
      formId ? `AddressCountry_${formId}` : 'AddressCountry_new',
      formId ? `AddressProvince_${formId}` : 'AddressProvince_new',
      {
        hideElement: formId
          ? `AddressProvinceContainer_${formId}`
          : 'AddressProvinceContainer_new'
      }
    );
    this.select.addEventListener('change', () => {
      document
        .querySelector(
          formId
            ? `#AddressProvinceContainer_${formId} customer-country-select`
            : '#AddressProvinceContainer_new customer-country-select'
        )
        .update();
    });
  }
}

customElements.define(
  'customer-country-select',
  CustomerCountrySelect
);

class CustomerAddresses {
  constructor() {
    this.selectors = {
      customerAddresses: '[data-addresses-wrapper]',
      toggleAddressButton: 'button[data-form-id]',
      deleteAddressButton: 'button[data-confirm-message]'
    };
    this.attributes = {
      confirmMessage: 'data-confirm-message'
    };
    this.elements = this._getElements();
    if (Object.keys(this.elements).length === 0) return;
    this._setupEventListeners();
  }

  _getElements() {
    const container = document.querySelector(
      this.selectors.customerAddresses
    );
    return container
      ? {
          container,
          toggleButtons: document.querySelectorAll(
            this.selectors.toggleAddressButton
          ),
          deleteButtons: container.querySelectorAll(
            this.selectors.deleteAddressButton
          )
        }
      : {};
  }

  _setupEventListeners() {
    this.elements.toggleButtons.forEach(element => {
      element.addEventListener(
        'click',
        this._handleToggleButtonsClick
      );
    });
    this.elements.deleteButtons.forEach(element => {
      element.addEventListener(
        'click',
        this._handleDeleteButtonClick
      );
    });
  }

  _toggleExpanded(target) {
    const targetForm = document.querySelector(
      `#${target.dataset.formId}`
    );
    targetForm.classList.toggle('hidden');
    this.elements.container.classList.toggle('hidden');
  }

  _handleToggleButtonsClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget);
  };

  _handleDeleteButtonClick = ({ currentTarget }) => {
    // eslint-disable-next-line no-alert
    if (
      confirm(
        currentTarget.getAttribute(this.attributes.confirmMessage)
      )
    ) {
      Shopify.postLink(currentTarget.dataset.target, {
        parameters: { _method: 'delete' }
      });
    }
  };
}
