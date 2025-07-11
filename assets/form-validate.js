if (!customElements.get('form-validate')) {
  class FormValidation extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      if (!this.form) throw new Error('Form element does not exist');
    }

    toggleErrorMessage(input, field) {
      const errorMessageWrapper =
        field.querySelector('[data-message]');
      errorMessageWrapper.classList.toggle(
        'hidden',
        input.validity.valid
      );
      errorMessageWrapper.parentElement.classList.toggle(
        'has-error',
        !input.validity.valid
      );

      errorMessageWrapper.innerHTML =
        input.type === 'email'
          ? window.validationStrings.invalidEmail
          : input.validationMessage;
    }

    setFieldValidity(input) {
      input.setAttribute('aria-invalid', !input.validity.valid);
      const field = input.closest('[data-input-wrapper]');
      if (!field) return;
      field.classList.toggle('has-error', !input.validity.valid);
      this.toggleErrorMessage(input, field);
    }

    onSubmit(event) {
      if (!this.form.reportValidity()) event.preventDefault();
      this.form.submit();
    }

    setHandlers() {
      this.form.addEventListener('submit', this.onSubmit.bind(this));
      for (const input of this.form.elements) {
        if (input.hasAttribute('data-no-validate')) continue;

        ['input', 'blur', 'change', 'invalid'].forEach(eventName => {
          input.addEventListener(
            eventName,
            this.setInputHandler.bind(this)
          );
        });
      }
    }

    setInputHandler(event) {
      if (event.type === 'invalid') {
        event.preventDefault();
      }

      this.setFieldValidity(event.target);
    }

    connectedCallback() {
      this.setHandlers();
    }
  }

  customElements.define('form-validate', FormValidation);
}
