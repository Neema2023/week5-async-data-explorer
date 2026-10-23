
const BASE_URL = "https://dummyjson.com";

// Reusable function for fetching JSON data
export async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

// Fetch up to 100 products
export async function getProducts() {
  return getJSON(`${BASE_URL}/products?limit=100`);
}

// Fetch one product using its ID
export async function getProduct(id) {
  return getJSON(`${BASE_URL}/products/${id}`);
}

// Fetch all available product categories
export async function getCategories() {
  return getJSON(`${BASE_URL}/products/category-list`);
}
