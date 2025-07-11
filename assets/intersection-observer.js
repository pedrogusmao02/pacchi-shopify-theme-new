/**
 * Intersection Observer
 * Companent for multiple sections animations
 * */
document
  .querySelectorAll("[data-intersection-observer]")
  .forEach((intersectElement, i) => {
    const intersectionID = intersectElement.dataset.id;
    const observerElement = document.querySelector(
      `[data-id="${intersectionID}"]`
    );

    const intersectOnce =
      observerElement.dataset.intersectOnce || true;
    const observerOptions = {
      rootMargin: "0px 0px -50% 0px",
      threshold: 0,
      ...(JSON.parse(
        observerElement.dataset.intersectionObserver || "{}"
      ) || {})
    };

    const animationBody = observerElement.querySelector(
      ".full-width-banner__animation--body"
    );
    const animationElements = observerElement.querySelectorAll(
      ".full-width-banner__animation"
    );

    const intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (intersectionID !== entry.target.dataset.id) {
            return;
          }
          // console.log("intersectionObserver", observerElement.dataset.id);

          /** check if already animated */
          if (
            observerElement.classList.contains("isAnimated") &&
            intersectOnce
          ) {
            return;
          }

          observerElement.classList.remove("inAnimation");

          let animationDelay =
            animationBody.dataset.animationDelay || 300;
          let animationDuration =
            animationBody.dataset.animationDuration || 900;

          setAnimation({
            observerElement,
            animationBody,
            animationElements
          });

          setTimeout(() => {
            if (
              observerElement.classList.contains("isAnimated") &&
              intersectOnce
            ) {
              intersectionObserver.unobserve(observerElement);
            } else if (
              observerElement.classList.contains(
                "isAnimated" && !intersectOnce
              )
            ) {
              observerElement.classList.remove("isAnimated");
            }
          }, animationElements.length * (animationDelay + animationDuration) + animationDelay);
        }
      });
    }, observerOptions);

    intersectionObserver.observe(observerElement);

    function setAnimation(params) {
      const { observerElement, animationBody, animationElements } =
        params;

      let animationDelay =
        animationBody.dataset.animationDelay || 300;
      let animationDuration =
        animationBody.dataset.animationDuration || 900;

      animationElements.forEach((element, i) => {
        i++;
        animationDelay =
          element.dataset.animationDelay || animationDelay;
        animationDuration =
          element.dataset.animationDuration || animationDuration;
        setTimeout(() => {
          element.classList.add("inAnimation");
          element.querySelector(
            "*"
          ).style.animationDuration = `${animationDuration}ms`;
        }, i * animationDelay);

        setTimeout(() => {
          element.querySelector("*").style.animationDuration = "";
          if (element.querySelector("*").style.length === 0) {
            element.querySelector("*").removeAttribute("style");
          }
          element.classList.remove("inAnimation");
          element.classList.add("isAnimated");
          if (i === animationElements.length) {
            observerElement.classList.remove("inAnimation");
            observerElement.classList.add("isAnimated");
          }
        }, i * (animationDelay + animationDuration));
      });
    }
  });
