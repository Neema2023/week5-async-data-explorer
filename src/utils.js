
export function getVisibleItems({ items, query, filter, sort }) {
  const searchText = query.trim().toLowerCase();

  const filtered = items
    .filter(({ title = "" }) =>
      title.toLowerCase().includes(searchText)
    )
    .filter(({ category }) =>
      filter === "all" || category === filter
    );

  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.title.localeCompare(b.title),
  };

  return sorters[sort]
    ? filtered.toSorted(sorters[sort])
    : filtered;
}
