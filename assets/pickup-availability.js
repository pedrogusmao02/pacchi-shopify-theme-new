class PickupAvailability extends HTMLElement {
  constructor() {
    super();

    if (!this.hasAttribute('available')) return;

    this.errorHtml =
      this.querySelector(
        'template'
      ).content.firstElementChild.cloneNode(true);
    this.onClickRefreshList = this.onClickRefreshList.bind(this);
    this.fetchAvailability(this.dataset.variantId);
  }

  fetchAvailability(variantId) {
    const rootUrl = !this.dataset.rootUrl.endsWith('/')
      ? `${this.dataset.rootUrl}/`
      : this.dataset.rootUrl;

    const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

    fetch(variantSectionUrl)
      .then(response => response.text())
      .then(text => {
        const sectionInnerHTML = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('.shopify-section');
        this.renderPreview(sectionInnerHTML);
      })
      .catch(e => {
        const button = this.querySelector('button');

        if (button)
          button.removeEventListener(
            'click',
            this.onClickRefreshList
          );

        this.renderError();
      });
  }

  onClickRefreshList(event) {
    this.fetchAvailability(this.dataset.variantId);
  }

  renderError() {
    this.innerHTML = '';
    this.appendChild(this.errorHtml);
    this.querySelector('button').addEventListener(
      'click',
      this.onClickRefreshList
    );
  }

  renderPreview(sectionInnerHTML) {
    if (
      !sectionInnerHTML.querySelector('pickup-availability-preview')
    ) {
      this.innerHTML = '';
      this.removeAttribute('available');

      return;
    }

    this.innerHTML = sectionInnerHTML.querySelector(
      'pickup-availability-preview'
    ).outerHTML;
    this.setAttribute('available', '');
  }
}

customElements.define('pickup-availability', PickupAvailability);
