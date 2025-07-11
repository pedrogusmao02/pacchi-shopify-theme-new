function openTabFeed(evt, sectionId, tabName) {
  // get all elements with class="tabcontent" and hide them except the first one
  const tabcontent = document.getElementsByClassName(
    "products-feed__tabcontent--" + sectionId
  );
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // get all elements with class="tablinks" and remove the class "active" except the first one
  const tablinks = document.getElementsByClassName(
    "products-feed__tablinks--" + sectionId
  );
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(
      " active",
      ""
    );
  }

  // show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// show the first tabs by default on load - data-default-open
document.querySelectorAll("[data-default-open]").forEach(el => {
  el.click();
});
window.addEventListener("shopify:section:load", () => {
  document.querySelectorAll("[data-default-open]").forEach(el => {
    el.click();
  });
});
