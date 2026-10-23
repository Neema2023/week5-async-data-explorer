
import { getVisibleItems } from "./utils.js";

// Escape API text before inserting it into HTML
export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// Format prices consistently
function formatPrice(price) {
  return `$${Number(price ?? 0).toFixed(2)}`;
}

// Display loading skeleton cards
function renderLoading() {
  return Array.from({ length: 8 }, () => `
    <article class="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="h-48 bg-slate-200"></div>
      <div class="space-y-3 p-4">
        <div class="h-4 w-3/4 rounded bg-slate-200"></div>
        <div class="h-4 w-1/2 rounded bg-slate-200"></div>
        <div class="h-8 w-1/3 rounded bg-slate-200"></div>
      </div>
    </article>
  `).join("");
}

// Display a friendly error and Retry button
function renderError(message) {
  return `
    <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h3 class="mb-2 text-lg font-bold text-red-800">
        Unable to load products
      </h3>

      <p class="mb-4 text-sm text-red-700">
        ${escapeHTML(message || "Something went wrong. Please try again.")}
      </p>

      <button
        id="retry-button"
        type="button"
        class="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Retry
      </button>
    </div>
  `;
}

// Display an empty state
function renderEmpty() {
  return `
    <div class="col-span-full rounded-xl border border-slate-200 bg-white p-10 text-center">
      <h3 class="mb-2 text-lg font-bold text-slate-800">
        No products found
      </h3>

      <p class="text-slate-500">
        Try another search term or choose a different category.
      </p>
    </div>
  `;
}

// Render a single product card
function renderProductCard(product) {
  const {
    id,
    title,
    description,
    price,
    category,
    rating,
    thumbnail,
  } = product;

  const safeTitle = escapeHTML(title || "Untitled product");
  const safeDescription = escapeHTML(
    description || "No description available."
  );
  const safeCategory = escapeHTML(category || "Uncategorized");
  const safePrice = formatPrice(price);
  const safeRating = Number.isFinite(Number(rating))
    ? Number(rating).toFixed(1)
    : "N/A";

  // Accept only valid HTTPS image URLs
  let imageHTML = `
    <div class="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
      Image unavailable
    </div>
  `;

  try {
    const imageURL = new URL(thumbnail);

    if (imageURL.protocol === "https:") {
      imageHTML = `
        <img
          src="${escapeHTML(imageURL.href)}"
          alt="${safeTitle}"
          loading="lazy"
          class="h-48 w-full object-contain p-4"
        />
      `;
    }
  } catch {
    // Keep the fallback if the image URL is missing or invalid
  }

  return `
    <article class="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
      ${imageHTML}

      <div class="p-4">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
          ${safeCategory}
        </p>

        <h3 class="mb-2 line-clamp-2 min-h-12 font-bold text-slate-900">
          ${safeTitle}
        </h3>

        <p class="mb-3 line-clamp-2 text-sm leading-6 text-slate-500">
          ${safeDescription}
        </p>

        <div class="mb-4 flex items-center justify-between gap-2">
          <span class="text-lg font-bold text-slate-900">
            ${safePrice}
          </span>

          <span class="text-sm text-amber-600" aria-label="Rating ${safeRating} out of 5">
            ★ ${safeRating}
          </span>
        </div>

        <button
          type="button"
          data-product-id="${Number(id)}"
          class="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          View details
        </button>
      </div>
    </article>
  `;
}

// Build the category dropdown from API data
function renderCategories(categories) {
  const select = document.querySelector("#category-filter");
  const currentValue = select.value;

  const options = categories
    .toSorted((a, b) => a.localeCompare(b))
    .map((category) => `
      <option value="${escapeHTML(category)}">
        ${escapeHTML(category
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "))}
      </option>
    `)
    .join("");

  select.innerHTML = `
    <option value="all">All categories</option>
    ${options}
  `;

  const availableValues = [
    "all",
    ...categories,
  ];

  select.value = availableValues.includes(currentValue)
    ? currentValue
    : "all";
}

// Render the product details dialog
export function renderDetails(product) {
  const dialog = document.querySelector("#product-dialog");
  const content = document.querySelector("#dialog-content");

  const {
    title,
    description,
    price,
    category,
    rating,
    brand,
    images,
    thumbnail,
    stock,
    warrantyInformation,
    shippingInformation,
  } = product;

  const safeTitle = escapeHTML(title || "Product details");
  const safeDescription = escapeHTML(
    description || "No description available."
  );

  const imageCandidate = images?.[0] || thumbnail;
  let imageHTML = "";

  try {
    const imageURL = new URL(imageCandidate);

    if (imageURL.protocol === "https:") {
      imageHTML = `
        <img
          src="${escapeHTML(imageURL.href)}"
          alt="${safeTitle}"
          class="mb-5 h-56 w-full rounded-xl bg-slate-50 object-contain p-3"
        />
      `;
    }
  } catch {
    // The details can still be shown without an image
  }

  content.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <h2 id="dialog-title" class="mb-4 text-2xl font-bold">
        ${safeTitle}
      </h2>

      <button
        id="close-dialog"
        type="button"
        aria-label="Close product details"
        class="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
      >
        &times;
      </button>
    </div>

    ${imageHTML}

    <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
      ${escapeHTML(category || "Uncategorized")}
    </p>

    <p class="mb-5 leading-7 text-slate-600">
      ${safeDescription}
    </p>

    <p class="mb-2 text-2xl font-bold">
      ${formatPrice(price)}
    </p>

    <div class="space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
      <p><strong>Brand:</strong> ${escapeHTML(brand || "Not specified")}</p>
      <p><strong>Rating:</strong> ${Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : "N/A"} / 5</p>
      <p><strong>Stock:</strong> ${Number.isFinite(Number(stock)) ? Number(stock) : "Not specified"}</p>
      <p><strong>Warranty:</strong> ${escapeHTML(warrantyInformation || "Not specified")}</p>
      <p><strong>Shipping:</strong> ${escapeHTML(shippingInformation || "Not specified")}</p>
    </div>
  `;

  if (!dialog.open) {
    dialog.showModal();
  }
}

// Show loading or error text in the details dialog
export function renderDialogError(message) {
  const content = document.querySelector("#dialog-content");

  content.innerHTML = `
    <div class="py-8 text-center">
      <p class="mb-4 text-slate-600" role="status" aria-live="polite">
        ${escapeHTML(message)}
      </p>

      <button
        id="close-dialog"
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
      >
        Close
      </button>
    </div>
  `;
}

// Main render function: update the page from state
export function render(state) {
  const grid = document.querySelector("#product-grid");
  const statusMessage = document.querySelector("#status-message");
  const resultsCount = document.querySelector("#results-count");

  const totalProducts = document.querySelector("#total-products");
  const shownProducts = document.querySelector("#shown-products");
  const averagePrice = document.querySelector("#average-price");

  totalProducts.textContent = String(state.items.length);

  if (state.status === "loading") {
    statusMessage.innerHTML = `
      <p role="status" aria-live="polite" class="text-slate-500">
        Loading products...
      </p>
    `;

    resultsCount.textContent = "Loading...";
    grid.innerHTML = renderLoading();

    shownProducts.textContent = "—";
    averagePrice.textContent = "—";

    return;
  }

  if (state.status === "error") {
    statusMessage.innerHTML = renderError(state.error);

    resultsCount.textContent = "Products unavailable";
    grid.innerHTML = "";

    shownProducts.textContent = "—";
    averagePrice.textContent = "—";

    return;
  }

  renderCategories(state.categories);

  const visibleItems = getVisibleItems(state);

  const totalPrice = visibleItems.reduce(
    (total, { price }) => total + (Number(price) || 0),
    0
  );

  const average = visibleItems.length
    ? totalPrice / visibleItems.length
    : 0;

  shownProducts.textContent = String(visibleItems.length);
  averagePrice.textContent = formatPrice(average);

  resultsCount.textContent =
    `${visibleItems.length} product${visibleItems.length === 1 ? "" : "s"} found`;

  statusMessage.innerHTML = `
    <p class="text-sm text-slate-500" role="status" aria-live="polite">
      Showing ${visibleItems.length} of ${state.items.length} products.
    </p>
  `;

  if (visibleItems.length === 0) {
    grid.innerHTML = renderEmpty();
    return;
  }

  grid.innerHTML = visibleItems
    .map((product) => renderProductCard(product))
    .join("");
}
