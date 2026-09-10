
// script.js

// 1. Smooth scroll for internal anchor links (if you add any like href="#contact")
document.addEventListener("click", function (e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute("href").slice(1);
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  e.preventDefault();
  targetEl.scrollIntoView({ behavior: "smooth" });
});

// 2. Shrink header slightly on scroll
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("site-header--scrolled");
    } else {
      header.classList.remove("site-header--scrolled");
    }
  }

  window.addEventListener("scroll", onScroll);
  onScroll();
})();

// 3. Basic contact form handler (front-end only)
(function () {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name") || "friend";

    alert(
      `Thank you, ${name}! Your message has been received.\n\n` +
      "Since this is a static site, please make sure to connect this form to a real backend or email service later."
    );

    form.reset();
  });
})();

