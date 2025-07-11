const viewMoreElement = document.querySelector('.js-btn-load-more');

if (viewMoreElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
          viewMoreElement.click();
        }
    });
  });
  observer.observe(viewMoreElement);
}
