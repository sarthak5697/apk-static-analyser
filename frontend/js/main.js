import {
  populateCompareDropdowns,
  initCompareForm,
  populateAPKDropdown,
  initAPKForm,
  initEventListeners,
} from "./uiHandlers.js";
import { compareJSONData } from "./comparison/index.js";


document.addEventListener('DOMContentLoaded', function () {
  const stickyContainer = document.querySelector('.sticky-container');
  const observer = new IntersectionObserver(
    ([e]) => e.target.classList.toggle('stuck', e.intersectionRatio < 1),
    { threshold: [1] }
  );

  if (stickyContainer) {
    observer.observe(stickyContainer);
  }
});
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await populateAPKDropdown();
  } catch (error) {
    console.error("Failed to populate APK dropdown:", error);
    alert("Error loading APK packages. Please try again.");
  }

  try {
    await populateCompareDropdowns();
  } catch (error) {
    console.error("Failed to populate compare dropdowns:", error);
    alert("Error loading comparison data. Please try again.");
  }

  initCompareForm();
  initAPKForm();
  initEventListeners();
});
