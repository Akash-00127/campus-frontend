"use server";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, API } from "./api";
export async function login(form: FormData) {
  let data;
  let failure = "";
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!email || !password) redirect("/login?error=Enter+your+email+and+password");
  try {
    const response = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    data = await response.json().catch(() => null);
    if (!response.ok) {
      failure = response.status === 401
        ? "Incorrect email or password, or your account is disabled. Use your administrator email and current password."
        : response.status === 429
          ? "Too many sign-in attempts. Please wait one minute and try again."
          : response.status === 400
            ? "Check your email format and enter an 8–72 character password."
            : "The backend could not complete sign-in. Please try again shortly.";
    } else if (!data?.accessToken || !data?.user) {
      failure = "The backend returned an invalid sign-in response.";
    } else if (!["ADMIN", "SUPER_ADMIN"].includes(data.user.role)) {
      failure = "This account does not have administrator access. Sign in with an Admin or Super Admin account.";
    }
  } catch {
    failure = "Cannot connect to the backend. Check that the Campus Drop backend container is running on port 4000.";
  }
  if (failure) redirect("/login?error=" + encodeURIComponent(failure));
  (await cookies()).set("campus_admin_token", data.accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 43200,
    path: "/",
  });
  redirect("/");
}
export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {}
  (await cookies()).delete("campus_admin_token");
  redirect("/login");
}
async function uploadImage(file: FormDataEntryValue | null) {
  if (!file || typeof file === "string") throw new Error("Choose an image file first.");
  const token = (await cookies()).get("campus_admin_token")?.value;
  if (!token) redirect("/login");
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API}/admin/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Image upload failed");
  return String(data.url);
}
export async function uploadProductImage(form: FormData) {
  const id = String(form.get("id") || "");
  let error = "";
  try {
    const image = await uploadImage(form.get("file"));
    await api(`/admin/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ image }),
    });
  } catch (e) {
    unstable_rethrow(e);
    error = e instanceof Error ? e.message : "Product image upload failed";
  }
  revalidatePath("/");
  redirect(`/?tab=products&${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}
export async function uploadCarouselImages(form: FormData) {
  let error = "";
  try {
    const files = form.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
    if (!files.length) throw new Error("Choose at least one carousel image.");
    if (files.length > 10) throw new Error("You can upload up to 10 carousel images at once.");
    const current = String(form.get("current") || "[]");
    const existing: unknown = JSON.parse(current);
    const urls = Array.isArray(existing) ? existing.filter((value): value is string => typeof value === "string") : [];
    for (const file of files) urls.push(await uploadImage(file));
    if (urls.length > 10) throw new Error("A maximum of 10 carousel images can be active.");
    await api("/admin/settings", { method: "POST", body: JSON.stringify({ key: "carouselImages", value: JSON.stringify(urls) }) });
  } catch (caught) {
    unstable_rethrow(caught);
    error = caught instanceof Error ? caught.message : "Carousel images could not be uploaded.";
  }
  revalidatePath("/");
  redirect(`/?tab=carousel&${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}
export async function deleteProduct(form: FormData) {
  const id = encodeURIComponent(String(form.get("id") || ""));
  let error = "";
  try {
    await api(`/admin/products/${id}`, { method: "DELETE" });
  } catch (e) {
    unstable_rethrow(e);
    error = e instanceof Error ? e.message : "Product could not be deleted";
  }
  revalidatePath("/");
  redirect(`/?tab=products&${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}
export async function createProduct(form: FormData) {
  const text = (key: string) => String(form.get(key) || "").trim();
  let error = "";
  try {
    let image = text("image");
    const file = form.get("file");
    if (file && typeof file !== "string" && file.size > 0)
      image = await uploadImage(file);
    const priceRupees = Number(form.get("priceRupees"));
    if (!Number.isFinite(priceRupees) || priceRupees <= 0)
      throw new Error("Enter a valid product price in rupees.");
    await api("/admin/products", {
      method: "POST",
      body: JSON.stringify({
        vendorId: text("vendorId"),
        categoryId: text("categoryId") || undefined,
        name: text("name"),
        description: text("description"),
        pricePaise: Math.round(priceRupees * 100),
        stock: text("stock") ? Number(form.get("stock")) : undefined,
        vegetarian: text("vegetarian") === "true",
        image: image || undefined,
        available: true,
        active: true,
      }),
    });
  } catch (e) {
    unstable_rethrow(e);
    error = e instanceof Error ? e.message : "Product could not be created";
  }
  revalidatePath("/");
  redirect(`/?tab=products&${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}
export async function mutate(form: FormData) {
  const action = String(form.get("action"));
  const id = encodeURIComponent(String(form.get("id") || ""));
  const text = (k: string) => String(form.get(k) || "");
  const number = (k: string) => Number(form.get(k));
  const bool = (k: string) => form.get(k) === "true";
  const actions: Record<
    string,
    { path: string; method: string; body: unknown; tab: string }
  > = {
    coupon:{path:'/admin/coupons',method:'POST',tab:'coupons',body:{code:text('code').toUpperCase(),type:text('type'),value:number('value'),minOrderPaise:number('minOrderPaise'),maxDiscountPaise:number('maxDiscountPaise'),usageLimit:number('usageLimit'),perUserLimit:number('perUserLimit'),endsAt:text('endsAt'),active:true,...(text('universityId')?{universityId:text('universityId')}:{})}},
    couponStatus:{path:`/admin/coupons/${id}`,method:'PATCH',tab:'coupons',body:{active:bool('active')}},
    reviewVisibility:{path:`/admin/reviews/${id}`,method:'PATCH',tab:'reviews',body:{visible:bool('visible')}},
    createVendor: {
      path: "/admin/vendors",
      method: "POST",
      body: {
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        shopName: text("shopName"),
        universityId: text("universityId"),
        campusId: text("campusId"),
        address: text("address"),
        description: text("description"),
      },
      tab: "vendors",
    },
    createAdministrator: {
      path: "/admin/administrators",
      method: "POST",
      body: {
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        password: text("password"),
        role: text("role"),
      },
      tab: "administrators",
    },
    updateAdministrator: {
      path: `/admin/administrators/${id}`,
      method: "PATCH",
      body: { name: text("name"), email: text("email"), phone: text("phone"), role: text("role"), ...(text("newPassword") ? { newPassword: text("newPassword") } : {}) },
      tab: "administrators",
    },
    deleteAdministrator: {
      path: `/admin/administrators/${id}`,
      method: "DELETE",
      body: undefined,
      tab: "administrators",
    },
    university: {
      path: "/admin/universities",
      method: "POST",
      body: {
        name: text("name"),
        city: text("city"),
        state: text("state"),
        type: text("type"),
      },
      tab: "universities",
    },
    universityEdit: {
      path: `/admin/universities/${id}`,
      method: "PATCH",
      body: {
        name: text("name"),
        city: text("city"),
        state: text("state"),
        type: text("type"),
      },
      tab: "universities",
    },
    universityDelete: {
      path: `/admin/universities/${id}`,
      method: "DELETE",
      body: undefined,
      tab: "universities",
    },
    campus: {
      path: "/admin/campuses",
      method: "POST",
      body: {
        name: text("name"),
        universityId: text("universityId"),
        address: text("address"),
      },
      tab: "campuses",
    },
    policy: {
      path: `/admin/campuses/${id}/policy`,
      method: "PATCH",
      body: {
        serviceEnabled: bool("serviceEnabled"),
        codEnabled: bool("codEnabled"),
        deliveryFeePaise: number("deliveryFeePaise"),
        platformFeePaise: number("platformFeePaise"),
        codLimitPaise: number("codLimitPaise"),
      },
      tab: "campuses",
    },
    vendor: {
      path: `/admin/vendors/${id}/review`,
      method: "PATCH",
      body: {
        approvalStatus: text("approvalStatus"),
        status: text("status"),
        commissionRateBps: number("commissionRateBps"),
        codEnabled: bool("codEnabled"),
        reviewReason: text("reviewReason"),
      },
      tab: "vendors",
    },
    user: {
      path: `/admin/users/${id}`,
      method: "PATCH",
      body: { name: text("name"), email: text("email"), phone: text("phone"), verified: bool("verified"), status: text("status") },
      tab: "users",
    },
    userPassword: {
      path: `/admin/users/${id}/password`,
      method: "POST",
      body: { newPassword: text("newPassword") },
      tab: "users",
    },
    category: {
      path: "/admin/categories",
      method: "POST",
      body: { name: text("name"), universityId: text("universityId") },
      tab: "categories",
    },
    categoryEdit: {
      path: `/admin/categories/${id}`,
      method: "PATCH",
      body: { name: text("name"), image: text("image"), active: bool("active") },
      tab: "categories",
    },
    categoryDelete: {
      path: `/admin/categories/${id}`,
      method: "DELETE",
      body: undefined,
      tab: "categories",
    },
    product: {
      path: `/admin/products/${id}/availability`,
      method: "PATCH",
      body: { active: bool("active") },
      tab: "products",
    },
    productEdit: {
      path: `/admin/products/${id}`,
      method: "PATCH",
      body: {
        name: text("name"),
        description: text("description"),
        image: text("image"),
        pricePaise: number("pricePaise"),
        stock: text("stock") ? number("stock") : undefined,
        vegetarian: bool("vegetarian"),
        available: bool("available"),
        active: bool("active"),
      },
      tab: "products",
    },
    setting: {
      path: "/admin/settings",
      method: "POST",
      body: { key: text("key"), value: text("value") },
      tab: "settings",
    },
    cancel: {
      path: `/admin/orders/${id}/status`,
      method: "PATCH",
      body: { status: "CANCELLED_BY_ADMIN", reason: text("reason") },
      tab: "orders",
    },
    markDelivered: {
      path: `/admin/orders/${id}/status`,
      method: "PATCH",
      body: { status: "DELIVERED" },
      tab: "orders",
    },
    support: {
      path: `/admin/support/${id}/reply`,
      method: "PATCH",
      body: { status: text("status"), reply: text("reply") },
      tab: "support",
    },
    universityStatus: {
      path: `/admin/universities/${id}/status`,
      method: "PATCH",
      body: { status: text("status") },
      tab: "universities",
    },
  };
  const spec = actions[action];
  if (!spec) throw new Error("Invalid operation");
  let error = "";
  try {
    await api(spec.path, {
      method: spec.method,
      body: JSON.stringify(spec.body),
    });
  } catch (e) {
    unstable_rethrow(e);
    error = e instanceof Error ? e.message : "Could not save";
  }
  revalidatePath("/");
  redirect(
    `/?tab=${spec.tab}&${error ? "error=" + encodeURIComponent(error) : "saved=1"}`,
  );
}
