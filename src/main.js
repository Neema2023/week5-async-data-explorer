
import {
  getProducts,
  getProduct,
  getCategories,
} from "./api.js";

import {
  render,
  renderDetails,
  renderDialogError,
} from "./render.js";

import { getVisibleItems } from "./utils.js";

// 1. Keep the application's data in one state object
const state = {
  items: [],
  categories: [],
  status: "loading",
  error: null,
  query: "",
  filter: "all",
  sort: "default",
};

// 2. Update the interface from the current state
function updateUI() {
  render(state);
}

// 3. Fetch products and categories at the same time
async function loadProducts() {
  state.status = "loading";
  state.error = null;
  updateUI();

  try {
    const [productsData, categoriesData] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    state.items = productsData.products;
    state.categories = categoriesData;
    state.status = "success";
  } catch (error) {
    state.status = "error";
    state.error =
      error instanceof Error
        ? error.message
        : "Something went wrong while loading products.";
  } finally {
    updateUI();
  }
}

// 4. Search products as the user types
const searchInput = document.querySelector("#search");

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  updateUI();
});

// 5. Filter products by category
const categoryFilter = document.querySelector("#category-filter");

categoryFilter.addEventListener("change", (event) => {
  state.filter = event.target.value;
  updateUI();
});

// 6. Sort products
const sortSelect = document.querySelector("#sort-by");

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  updateUI();
});

// 7. Retry loading if a request fails
document.addEventListener("click", (event) => {
  if (event.target.closest("#retry-button")) {
    loadProducts();
  }
});

// 8. Open product details
const productGrid = document.querySelector("#product-grid");
const productDialog = document.querySelector("#product-dialog");

productGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-product-id]");

  if (!button) return;

  const productId = Number(button.dataset.productId);

  if (!Number.isInteger(productId) || productId < 1) return;

  productDialog.showModal();
  renderDialogError("Loading product details...");

  try {
    const product = await getProduct(productId);

    // Do not update a dialog that the user has already closed
    if (productDialog.open) {
      renderDetails(product);
    }
  } catch (error) {
    if (productDialog.open) {
      const message =
        error instanceof Error
          ? error.message
          : "Please try again.";

      renderDialogError(
        `Unable to load product details. ${message}`
      );
    }
  }
});

// 9. Close the dialog when clicking its backdrop
productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) {
    productDialog.close();
  }
});

// 10. Close the dialog using its close button
productDialog.addEventListener("click", (event) => {
  if (event.target.closest("#close-dialog")) {
    productDialog.close();
  }
});

// 11. Load products when the page opens
loadProducts();
