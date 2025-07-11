if (Shopify.designMode) {
  window.addEventListener('shopify:block:select', function (event) {
    const activeElements = document.querySelectorAll('.section-interactive-banner .section-interactive-banner__element.active');
    activeElements.forEach(function(element) {
      element.classList.remove('active');
    });
    const selectedBlock = document.querySelector(`.section-interactive-banner__media-element-${event.detail.blockId}`);
    const element = document.querySelector(`.section-interactive-banner__element[data-hover-target='.section-interactive-banner__media-element-${event.detail.blockId}']`);
    element.classList.add("active");
    selectedBlock.classList.add("active");
  });
}


document.addEventListener("DOMContentLoaded", function () {
  let elements = document.querySelectorAll(
    ".section-interactive-banner__element"
  );
  elements.forEach(element => {
    let innerText = element.innerText;
    element.innerHTML = "";

    let textContainer = document.createElement("div");
    textContainer.classList.add("block");

    let span = document.createElement("span");
    span.innerText = innerText.trim() === "" ? "\xa0" : innerText;
    span.classList.add("word");
    textContainer.appendChild(span);

    element.appendChild(textContainer);
    element.appendChild(textContainer.cloneNode(true));

    let firstBlock = element.querySelector(".block");
    let firstBlockHeight = firstBlock.getBoundingClientRect().height;

    element.style.setProperty(
      "--interactive-banner-element-height",
      `${firstBlockHeight}px`
    );
  });
});
