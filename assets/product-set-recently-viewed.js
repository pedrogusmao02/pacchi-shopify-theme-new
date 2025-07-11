document.addEventListener("DOMContentLoaded", () => {
  function addHandleForRecentProductsFetch() {
    const handles = localStorage.getItem("recently-viewed");
    const productHandle =
      document.querySelector(".js-product").dataset.productHandle;

    if (handles) {
      if (handles.includes(productHandle)) return;

      const handlesToAdd = [productHandle, ...handles.split(",")];

      if (handlesToAdd.length > 10) {
        handlesToAdd.pop();
      }

      localStorage.setItem("recently-viewed", handlesToAdd.join(","));

      return;
    }

    localStorage.setItem("recently-viewed", productHandle);
  }
  addHandleForRecentProductsFetch();
});
