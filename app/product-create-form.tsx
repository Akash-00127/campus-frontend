"use client";

import { useMemo, useState } from "react";
import { createProduct } from "./actions";

type VendorOption = {
  id: string;
  name: string;
  universityId: string;
  campusId: string;
  campusName?: string;
};
type CategoryOption = { id: string; name: string; universityId: string };

export function ProductCreateForm({
  vendors,
  categories,
}: {
  vendors: VendorOption[];
  categories: CategoryOption[];
}) {
  const [vendorId, setVendorId] = useState("");
  const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);
  const matchingCategories = useMemo(
    () => categories.filter((category) => category.universityId === selectedVendor?.universityId),
    [categories, selectedVendor?.universityId],
  );

  return (
    <form action={createProduct} className="form-grid">
      <label>
        Approved vendor
        <select name="vendorId" value={vendorId} onChange={(event) => setVendorId(event.target.value)} required>
          <option value="">Choose a vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}{vendor.campusName ? ` · ${vendor.campusName}` : ""}
            </option>
          ))}
        </select>
        <small>The product automatically receives this vendor&apos;s university and campus.</small>
      </label>
      <label>
        Category
        <select name="categoryId" disabled={!selectedVendor} defaultValue="">
          <option value="">{selectedVendor ? "No category" : "Choose a vendor first"}</option>
          {matchingCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>Product name<input name="name" minLength={2} maxLength={120} required placeholder="Example: Paneer roll" /></label>
      <label>Description<textarea name="description" maxLength={1000} placeholder="Ingredients, serving size and useful details" /></label>
      <label>Price in rupees<input name="priceRupees" type="number" min="0.01" max="100000" step="0.01" required placeholder="99" /></label>
      <label>Stock quantity<input name="stock" type="number" min="0" max="1000000" placeholder="Leave blank for untracked stock" /></label>
      <label>Food preference<select name="vegetarian" defaultValue="false"><option value="false">Non-vegetarian / not specified</option><option value="true">Vegetarian</option></select></label>
      <label>Product image from computer<input name="file" type="file" accept="image/png,image/jpeg,image/webp" /></label>
      <label>Or image URL<input name="image" type="url" placeholder="https://example.com/product.jpg" /></label>
      <div className="form-actions"><button disabled={!vendorId}>Create and publish product</button><small>Use either a local image or an image URL. Local image takes priority.</small></div>
    </form>
  );
}
