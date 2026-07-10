# Feature Improvement Checklist

> OC TechCloudUp dashboard — prioritized feature roadmap

---

## 🔴 HIGH Impact

### 1. Multi-City Comparison Mode

Compare 2–3 cities side-by-side in a unified comparison view.

- [x] Change state model: `selected: CityData[]` from `CityData | null`
- [x] Map interaction: Shift+Click to add, plain click to replace/toggle
- [x] URL hash: `#metric=income&city=Irvine&city=Newport+Beach`
- [x] Redesigned CityPanel: comparison table layout for multiple cities
- [x] Multi-bar ComparisonBar: overlay bars per selected city
- [x] Map highlights: distinct border colors per selected city
- [x] Desktop: comparison sidebar (wider, w-96)
- [ ] Mobile: scrollable comparison sheet (needs testing)
- [x] Max 3 cities enforced in selectCity logic

### 2. OC County Overview Dashboard

Default view when no city is selected. Shows county-wide stats.

- [x] Summary cards: total population, median income, avg home value
- [x] Top 3 / Bottom 3 city highlights per metric
- [x] "Best value" insight (high income + low home price ratio)
- [x] Replaces empty sidebar on initial load

### 3. Sortable City Table View

All 34 cities as a filterable, sortable data table.

- [x] Table/list toggle in the UI
- [x] Columns: City, Income, Population, Homes, Education, etc.
- [x] Click column header to sort asc/desc
- [x] Click row to select city on map (sync highlight)
- [x] Text filter/search across all columns
- [x] Responsive: horizontal scroll on mobile

---

## 🟡 MEDIUM Impact

### 4. Time-Series Trends

- [ ] Add historical ACS data (multiple year ranges)
- [ ] Line chart in CityPanel showing metric over time
- [ ] County average trend line for reference
- [ ] Animated transitions between years

### 5. Metric Correlation Scatter Plot

- [ ] X-axis / Y-axis metric selectors
- [ ] Each dot = one city
- [ ] Hover for city name + values
- [ ] Trend line (linear regression)
- [ ] Color by population size

### 6. Data Export

- [ ] CSV export for selected cities or all
- [ ] JSON export for developers
- [ ] Download button in comparison view + table view
- [ ] `navigator.share()` Web Share API fallback

### 7. Share Feature Enhancement

- [ ] "Share" button with copy-to-clipboard
- [ ] Twitter/X share template
- [ ] LinkedIn share template
- [ ] `navigator.share()` for mobile
- [ ] Short URL generation (optional)

---

## 🟢 LOW Impact / Nice-to-Have

### 8. Dark Mode

- [ ] `prefers-color-scheme` auto-detection
- [ ] Manual toggle in Nav
- [ ] Tailwind `dark:` classes
- [ ] Persist preference to localStorage

### 9. Map Base Layer Switcher

- [ ] Satellite (Carto voyager)
- [ ] Dark map
- [ ] Terrain
- [ ] Layer control in map corner

### 10. Keyboard Navigation

- [ ] Tab through cities on map
- [ ] Enter to select
- [ ] Escape to close panel
- [ ] Arrow keys for metric switching
- [ ] Focus trap in comparison panel

### 11. Data Freshness Badge

- [ ] "Last updated: July 2026" badge in footer
- [ ] "ACS 2019–2023" source tag
- [ ] Link to methodology page

### 12. Favorite Cities

- [ ] localStorage favorites list
- [ ] Star icon on city cards
- [ ] "Favorites" section in search dropdown
- [ ] Quick compare from favorites

---

**Status**: 2026-07-10 — #1, #2, #3 completed ✅
