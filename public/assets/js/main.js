'use strict';

window.portfolioUi = {
  element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  },
};

const i18n = window.portfolioI18n;



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    const selectedValue = this.dataset.filterValue || "all";
    selectValue.innerText = this.innerText;
    selectValue.dataset.filterValue = selectedValue;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

const filterFunc = function (selectedValue) {
  const filterItems = document.querySelectorAll("[data-filter-item]");
  for (let i = 0; i < filterItems.length; i++) {
    if (selectedValue.toLowerCase() === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue.toLowerCase() === filterItems[i].dataset.category.toLowerCase()) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
        }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    const selectedValue = this.dataset.filterValue || "all";
    selectValue.innerText = this.innerText;
    selectValue.dataset.filterValue = selectedValue;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const activatePage = function (targetPage, shouldScroll = true) {
  const pageExists = [...pages].some((page) => page.dataset.page === targetPage);
  const nextPage = pageExists ? targetPage : "about";
  for (const page of pages) page.classList.toggle("active", page.dataset.page === nextPage);
  for (const link of navigationLinks) {
    link.classList.toggle("active", link.dataset.route === nextPage);
  }
  if (shouldScroll) window.scrollTo(0, 0);
};

window.portfolioUi.navigateTo = function (targetPage) {
  const nextHash = `#${targetPage}`;
  if (window.location.hash === nextHash) activatePage(targetPage);
  else window.location.hash = nextHash;
};

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    window.portfolioUi.navigateTo(this.dataset.route);
  });
}

window.addEventListener("hashchange", function () {
  activatePage(window.location.hash.slice(1).split("/")[0] || "about");
});

if (window.location.hash) {
  activatePage(window.location.hash.slice(1).split("/")[0], false);
}

window.addEventListener("portfolio:loaded", function () {
  filterFunc(selectValue.dataset.filterValue || "all");
});

window.addEventListener("portfolio:localechange", function () {
  activatePage(window.location.hash.slice(1).split("/")[0] || "about", false);
  filterFunc(selectValue.dataset.filterValue || "all");
});

const birthday = document.querySelector('time[datetime="1999-07-12"]');
function localizeBirthday() {
  if (!birthday) return;
  birthday.textContent = new Intl.DateTimeFormat(i18n.dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date("1999-07-12T00:00:00Z"));
}
localizeBirthday();
window.addEventListener("portfolio:localechange", localizeBirthday);
