function slideBeforeAfter(sectionId) {
  let slideValue = document.querySelector(
    `#section-compare-slider-${sectionId} input[type="range"]`
  ).value;

  let handleValue = document.querySelector(
    `#section-compare-slider-${sectionId} .compare-slider__handle .compare-slider__handle-line`
  );

  const compareSliderImageBefore = document.querySelector(
    `#section-compare-slider-${sectionId} .compare-slider__image-before`
  );
  const compareSliderImageAfter = document.querySelector(
    `#section-compare-slider-${sectionId} .compare-slider__image-after`
  );
  const compareSliderImageBeforeRTL = document.querySelector(
    `[dir="rtl"] #section-compare-slider-${sectionId} .compare-slider__image-before`
  );
  const compareSliderImageAfterRTL = document.querySelector(
    `[dir="rtl"] #section-compare-slider-${sectionId} .compare-slider__image-after`
  );

  compareSliderImageBefore.style.cssText = `clip-path: polygon(${slideValue}% 0, 100% 0, 100% 100%, ${slideValue}% 100%);`;
  if (compareSliderImageBeforeRTL) {
    compareSliderImageBeforeRTL.style.cssText = `clip-path: polygon(0 0, ${100 - slideValue}% 0, ${100 - slideValue}% 100%, 0 100%);`;
  }

  compareSliderImageAfter.style.cssText = `clip-path: polygon(0 0, ${slideValue}% 0, ${slideValue}% 100%, 0 100%);`;
  if (compareSliderImageAfterRTL) {
    compareSliderImageAfterRTL.style.cssText = `clip-path: polygon(${100 - slideValue}% 0, 100% 0, 100% 100%, ${100 - slideValue}% 100%);`;
  }

  handleValue.style.cssText = `inset-inline-start: ${slideValue}%;`;
}

document.querySelectorAll(".section-compare-slider").forEach((item, i) => {
  const sectionId = item.dataset.id;
  const inputSelector = document.querySelector(
    `#section-compare-slider-${sectionId} input[type="range"]`
  );
  inputSelector.addEventListener("input", event =>
    slideBeforeAfter(sectionId)
  );
});

if (Shopify.designMode) {
  document.addEventListener("shopify:section:load", function (event) {
    document.querySelectorAll(".section-compare-slider").forEach((item, i) => {
      const sectionId = item.dataset.id;
      const inputSelector = document.querySelector(
        `#section-compare-slider-${sectionId} input[type="range"]`
      );
      inputSelector.addEventListener("input", () =>
        slideBeforeAfter(sectionId)
      );
    });
  });

  document.addEventListener("change", e => {
    if (
      e.target.matches('.section-compare-slider input[type="range"]')
    ) {
      const sectionId = e.target.closest(".section-compare-slider").dataset.id;
      slideBeforeAfter(sectionId);
    }
  });
}
