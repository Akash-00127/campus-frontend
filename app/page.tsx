import Image from "next/image";
import { unstable_rethrow } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { api } from "./api";
import { deleteProduct, logout, mutate, uploadCarouselImages, uploadProductImage } from "./actions";
import { ProductCreateForm } from "./product-create-form";
import { UniversityActions } from "./university-actions";
import { AdministratorActions } from "./administrator-actions";
import { OrderActions } from "./order-actions";
import { RecordActions } from "./record-actions";
import { AutoSubmitFilters } from "./auto-submit-filters";
import { AdminInputRules } from "./admin-input-rules";
import { AdminSidebar } from "./admin-sidebar";
type Row = Record<string, any>;
const sections = [
  ["overview", "Overview"],
  ["universities", "Universities"],
  ["campuses", "Campuses"],
  ["vendors", "Vendors"],
  ["categories", "Categories"],
  ["products", "Products"],
  ["orders", "Orders"],
  ["payments", "Payments & COD"],
  ["coupons", "Coupons"],
  ["reviews", "Reviews"],
  ["users", "Students & accounts"],
  ["administrators", "Admin settings"],
  ["support", "Support"],
  ["carousel", "Home carousel"],
  ["settings", "App content"],
  ["audit-logs", "Audit history"],
];
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n / 100,
  );
const mediaSource = (value?: string) =>
  value?.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:4000/v1"}`.replace(/\/v1$/, "") + value
    : value;
type TableColumn = { label: string; cell: (row: Row) => ReactNode };
const dateTime = (value?: string) => value ? new Date(value).toLocaleString("en-IN") : "—";
function carouselList(rows: Row[]) {
  try {
    const value = rows.find((row) => row.key === "carouselImages")?.value || "[]";
    const images: unknown = JSON.parse(value);
    return Array.isArray(images) ? images.filter((image): image is string => typeof image === "string" && image.length > 0) : [];
  } catch { return []; }
}
function tableColumns(tab: string): TableColumn[] {
  const status = (row: Row) => <span className="badge">{row.approvalStatus || row.status || (row.active === undefined ? "Recorded" : row.active ? "ACTIVE" : "HIDDEN")}</span>;
  if (tab === "products") return [
    { label: "Product", cell: (row) => <div className="record-cell">{row.image && <Image className="table-image" src={mediaSource(row.image)!} alt="" width={44} height={44} unoptimized />}<div><strong>{row.name}</strong><small>{row.id}</small></div></div> },
    { label: "Vendor", cell: (row) => row.vendor?.name || row.vendorId },
    { label: "Category", cell: (row) => row.category?.name || "Uncategorised" },
    { label: "Price", cell: (row) => money(row.pricePaise) },
    { label: "Stock", cell: (row) => row.stock ?? "Untracked" },
    { label: "Type", cell: (row) => row.vegetarian ? "Vegetarian" : "Not specified" },
    { label: "Status", cell: status },
  ];
  if (tab === "orders" || tab === "payments") return [
    { label: "Order", cell: (row) => <><strong>{row.code}</strong><small>{dateTime(row.createdAt)}</small></> },
    { label: "Student", cell: (row) => row.student?.name || row.studentId },
    { label: "Vendor", cell: (row) => row.vendor?.name || row.vendorId },
    { label: "Amount", cell: (row) => money(row.totalPaise) },
    { label: "Method", cell: (row) => row.paymentMethod || "COD" },
    { label: "Payment", cell: (row) => <span className="badge">{row.paymentStatus}</span> },
    { label: tab === "payments" ? "Cash collected" : "Order status", cell: (row) => tab === "payments" ? (row.cashCollectedAt ? dateTime(row.cashCollectedAt) : "Pending") : status(row) },
  ];
  if (tab === "users" || tab === "administrators") return [
    { label: "Name", cell: (row) => <><strong>{row.name}</strong><small>{row.id}</small></> },
    { label: "Email", cell: (row) => row.email },
    { label: "Mobile", cell: (row) => row.phone || "Not provided" },
    { label: "Role", cell: (row) => row.role?.replaceAll("_", " ") },
    { label: "University", cell: (row) => row.university?.name || "—" },
    { label: "Campus", cell: (row) => row.campus?.name || "—" },
    { label: "Joined", cell: (row) => dateTime(row.createdAt) },
    { label: "Status", cell: status },
  ];
  if (tab === "vendors") return [
    { label: "Vendor", cell: (row) => <><strong>{row.name}</strong><small>{row.id}</small></> },
    { label: "Address", cell: (row) => row.address || "—" },
    { label: "Campus", cell: (row) => row.campusId },
    { label: "Operating", cell: (row) => row.operatingStatus },
    { label: "Commission", cell: (row) => `${Number(row.commissionRateBps || 0) / 100}%` },
    { label: "Approval", cell: status },
  ];
  return [
    { label: "Record", cell: (row) => <><strong>{row.name || row.code || row.subject || row.action || (tab === "reviews" ? `${row.rating}/5 review` : row.id)}</strong><small>{row.email || row.id}</small></> },
    { label: "Details", cell: (row) => tab === "reviews" ? row.comment : tab === "coupons" ? `${row.type} · ${row.value}` : row.city || row.description || row.message || row.entity || row.universityId || "—" },
    { label: "Created", cell: (row) => dateTime(row.createdAt) },
    { label: "Status", cell: status },
  ];
}
function Field({
  name,
  label,
  value,
  type = "text",
  minLength,
  maxLength,
  pattern,
  inputMode,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url" | "none";
}) {
  const phoneField = name === "phone";
  const lettersOnly = ["name", "shopName", "city", "state"].includes(name);
  const resolvedType = phoneField ? "tel" : type;
  const resolvedPattern = phoneField ? "[0-9]{10}" : pattern || (lettersOnly ? "[A-Za-z][A-Za-z .,'&()_-]*" : undefined);
  return (
    <label>
      {label}
      <input name={name} type={resolvedType} defaultValue={value} minLength={minLength} maxLength={phoneField ? 10 : maxLength} pattern={resolvedPattern} inputMode={phoneField ? "numeric" : inputMode} title={phoneField ? "Enter exactly 10 digits" : lettersOnly ? "Numbers are not allowed in this field" : undefined} required />
    </label>
  );
}
function Select({
  name,
  label,
  values,
  value,
}: {
  name: string;
  label: string;
  values: string[];
  value?: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value}>
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
function Hidden({ action, id }: { action: string; id?: string }) {
  return (
    <>
      <input type="hidden" name="action" value={action} />
      {id && <input type="hidden" name="id" value={id} />}
    </>
  );
}
function UniversitySelect({ rows }: { rows: Row[] }) {
  return (
    <label>
      University
      <select name="universityId" required>
        <option value="">Choose university</option>
        {rows.map((u) => (
          <option value={u.id} key={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tab = sections.some((s) => s[0] === params.tab)
    ? params.tab!
    : "overview";
  const page = Math.max(1, Number(params.page) || 1);
  const me = await api("/auth/me");
  if (!["ADMIN", "SUPER_ADMIN"].includes(me.role))
    return (
      <main className="content">
        <h1>Administrator access required</h1>
        <form action={logout}>
          <button>Sign out</button>
        </form>
      </main>
    );
  const isSuperAdmin = me.role === "SUPER_ADMIN";
  let rows: Row[] = [];
  let metrics: Row = {};
  let total = 0;
  let error = "";
  let universities: Row[] = [];
  let campuses: Row[] = [];
  let vendors: Row[] = [];
  let categories: Row[] = [];
  let detail: Row | null = null;
  try {
    if (tab === "overview") metrics = await api("/admin/overview");
    else if (["settings", "carousel"].includes(tab)) rows = await api("/admin/settings");
    else if (tab === "administrators" && !isSuperAdmin) {
      rows = [];
      total = 0;
    }
    else {
      const q = new URLSearchParams({ page: String(page), limit: "30" });
      for (const k of ["q", "universityId", "campusId", "vendorId"])
        if (params[k]) q.set(k, params[k]!);
      const result = await api(`/admin/${tab}?${q}`);
      rows = result.items;
      total = result.total;
    }
    if (["campuses", "categories", "vendors", "coupons", "products", "users", "payments"].includes(tab))
      universities = await api("/universities");
    if (["vendors", "products", "users", "payments"].includes(tab))
      campuses = (await api("/admin/campuses?limit=100")).items;
    if (["products", "payments"].includes(tab))
      vendors = (await api("/admin/vendors?limit=100")).items;
    if (tab === "products")
      categories = (await api("/admin/categories?limit=100")).items;
    if (tab === "orders" && params.order)
      detail = await api(`/orders/${encodeURIComponent(params.order)}`);
  } catch (e) {
    unstable_rethrow(e);
    error = e instanceof Error ? e.message : "Unable to load data";
  }
  const title = sections.find((s) => s[0] === tab)![1];
  const columns = tableColumns(tab);
  const carouselImages = tab === "carousel" ? carouselList(rows) : [];
  const totalPages = Math.max(1, Math.ceil(total / 30));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    const start = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4));
    return start + index;
  });
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams({ tab, page: String(nextPage) });
    for (const key of ["q", "universityId", "campusId", "vendorId"])
      if (params[key]) next.set(key, params[key]!);
    return `/?${next}`;
  };
  return (
    <div className="workspace"><AdminInputRules />
      <AdminSidebar name={me.name} role={me.role} />
      <main className="content">
        <header>
          <div>
            <p className="eyebrow">CAMPUS DROP / OPERATIONS</p>
            <h1>{title}</h1>
            <p className="muted">
              {tab === "overview"
                ? "A clear view of your campus marketplace."
                : "Manage your marketplace with permission-controlled, audited changes."}
            </p>
          </div>
          <span className="pill">Shared platform API</span>
        </header>
        {(error || params.error) && (
          <p className="alert">{error || params.error}</p>
        )}
        {params.saved && <p className="success">Changes saved.</p>}
        {tab === "administrators" && (isSuperAdmin ? (
          <details className="panel" open={!rows.length}>
            <summary>Admin settings · create a role account</summary>
            <p className="muted">Create role-based operations accounts. Super Admin accounts can manage administrators; Admin accounts can manage daily platform operations.</p>
            <form action={mutate} className="form-grid">
              <Hidden action="createAdministrator" />
              <Field name="name" label="Full name" minLength={2} maxLength={100} />
              <Field name="email" label="Email address" type="email" />
              <Field name="phone" label="Mobile number" type="tel" pattern="\\+?[0-9]{10,15}" inputMode="tel" />
              <Field name="password" label="Temporary password (8–72 characters)" type="password" minLength={8} maxLength={72} />
              <Select name="role" label="Administrator role" values={["ADMIN", "SUPER_ADMIN"]} value="ADMIN" />
              <button className="create-button"><span aria-hidden="true">＋</span>Create role account</button>
            </form>
          </details>
        ) : <section className="panel role-notice"><p className="eyebrow">ADMIN SETTINGS</p><h2>Super Admin access required</h2><p className="muted">Your Admin account can operate the marketplace, but only a Super Admin can view, create, disable, or assign administrator roles.</p></section>)}
        {tab === "overview" && (
          <>
            <div className="hero">
              <div>
                <p className="eyebrow">YOUR NEXT ACTION</p>
                <h2>Run your campus marketplace.</h2>
                <p>Review sellers and enable delivery as each campus is ready.</p>
                <Link className="button" href="/?tab=vendors">
                  Review vendors →
                </Link>
              </div>
            </div>
            <div className="metrics">
              {[
                ["Universities", "universities", "universities"],
                ["Campuses", "campuses", "campuses"],
                ["Vendors", "vendors", "vendors"],
                ["Students", "students", "users"],
                ["Orders", "orders", "orders"],
                ["Students to verify", "pendingStudents", "users"],
              ].map(([label, key, target]) => (
                <Link className="metric-link" href={`/?tab=${target}`} key={key}>
                <article>
                  <span>{label}</span>
                  <strong>{metrics[key] ?? "—"}</strong>
                </article></Link>
              ))}
            </div>
            <section className="panel">
              <h2>Commerce overview</h2>
              <div className="metrics financial">
                {[
                  ["Delivered GMV", "deliveredGmvPaise"],
                  ["Cash collected by vendors", "vendorCashCollectedPaise"],
                  ["Commission accrued", "commissionAccruedPaise"],
                ].map(([label, key]) => (
                  <article key={key}>
                    <span>{label}</span>
                    <strong>{money(metrics[key] || 0)}</strong>
                  </article>
                ))}
              </div>
              <p className="muted small">
                GMV is order value. Vendor-collected cash and accrued commission
                are not cash received by Campus Drop.
              </p>
            </section>
          </>
        )}
        {tab === "universities" && (
          <details className="panel">
            <summary>Add a university</summary>
            <form action={mutate} className="form-grid">
              <Hidden action="university" />
              <Field name="name" label="University name" minLength={2} maxLength={150} />
              <Field name="city" label="City" minLength={2} maxLength={100} />
              <Field name="state" label="State" minLength={2} maxLength={100} />
              <Select name="type" label="University type" values={["CENTRAL", "STATE", "PRIVATE", "DEEMED", "OTHER"]} />

              <button className="create-button"><span aria-hidden="true">＋</span>Create university</button>
            </form>
          </details>
        )}
        {tab === "campuses" && (
          <details className="panel">
            <summary>Add a campus</summary>
            <form action={mutate} className="form-grid">
              <Hidden action="campus" />
              <UniversitySelect rows={universities} />
              <Field name="name" label="Campus name" />

              <Field name="address" label="Address" />
              <button>Create campus</button>
            </form>
          </details>
        )}
        {tab === "vendors" && (
          <details className="panel">
            <summary>Create a vendor account</summary>
            <form action={mutate} className="form-grid">
              <Hidden action="createVendor" />
              <Field name="name" label="Owner name" />
              <Field name="email" label="Owner email" type="email" />
              <Field name="phone" label="Phone" />
              <Field name="shopName" label="Shop name" />
              <UniversitySelect rows={universities} />
              <label>
                Campus
                <select name="campusId" required>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ·{" "}
                      {universities.find((u) => u.id === c.universityId)?.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="address" label="Shop address" />
              <Field name="description" label="Description" />
              <button>Create pending vendor</button>
            </form>
          </details>
        )}
        {tab === "categories" && (
          <details className="panel">
            <summary>Add a category</summary>
            <form action={mutate} className="form-grid">
              <Hidden action="category" />
              <UniversitySelect rows={universities} />
              <Field name="name" label="Category name" />
              <button>Create category</button>
            </form>
          </details>
        )}
        {tab === "settings" && (
          <section className="panel">
            <h2>Student app operations</h2>
            <p className="muted">
              Published to the student catalog API when saved. The app reads these values on every home refresh.
            </p>
            {["announcement", "supportEmail"].map((key) => (
              <form action={mutate} className="inline-form" key={key}>
                <Hidden action="setting" />
                <input type="hidden" name="key" value={key} />
                <Field
                  name="value"
                  label={key}
                  value={rows.find((r) => r.key === key)?.value || ""}
                />
                <button>Save</button>
              </form>
            ))}
          </section>
        )}
        {tab === "carousel" && (
          <section className="panel carousel-manager">
            <div className="panel-heading"><div><p className="eyebrow">STUDENT APP CONTENT</p><h2>Home carousel</h2><p className="muted">Upload clean 16:9 images. They appear at the top of the student home screen and rotate automatically.</p></div></div>
            <form action={uploadCarouselImages} className="carousel-upload">
              <input type="hidden" name="current" value={JSON.stringify(carouselImages)} />
              <label className="carousel-dropzone"><span>Choose carousel images</span><small>JPG, PNG or WEBP · 16:9 recommended · maximum 10 active images</small><input name="files" type="file" accept="image/png,image/jpeg,image/webp" multiple required /></label>
              <button className="create-button">Upload images</button>
            </form>
            <div className="carousel-grid">{carouselImages.map((url, index) => <article className="carousel-card" key={url}><Image src={mediaSource(url)!} alt={`Carousel image ${index + 1}`} width={640} height={360} unoptimized style={{ height: "auto" }} /><div><strong>Slide {index + 1}</strong><form action={mutate}><Hidden action="setting" /><input type="hidden" name="key" value="carouselImages" /><input type="hidden" name="value" value={JSON.stringify(carouselImages.filter((_, current) => current !== index))} /><button className="secondary danger">Remove</button></form></div></article>)}</div>
            {!carouselImages.length && <p className="empty-state">No carousel images have been published yet.</p>}
          </section>
        )}
        {tab === "products" && (
          <details className="panel create-panel">
            <summary>Add a product</summary>
            <p className="muted">Choose the vendor first. Categories are then limited to that vendor&apos;s university, and ownership is assigned securely by the backend.</p>
            <ProductCreateForm
              vendors={vendors.filter(v => v.approvalStatus === "APPROVED" && v.status === "ACTIVE").map(v => ({ id: v.id, name: v.name, universityId: v.universityId, campusId: v.campusId, campusName: campuses.find(c => c.id === v.campusId)?.name }))}
              categories={categories.filter(c => c.active).map(c => ({ id: c.id, name: c.name, universityId: c.universityId }))}
            />
          </details>
        )}
        {tab === "coupons" && <section className="panel coupon-create-panel"><div className="panel-heading"><div><p className="eyebrow">PROMOTION CONTROL</p><h2>Create campus coupon</h2><p className="muted">Configure the discount, eligibility and limits in one place. Amount fields use paise.</p></div></div><form action={mutate} className="coupon-form"><Hidden action="coupon"/><Field name="code" label="Coupon code" /><UniversitySelect rows={universities}/><Select name="type" label="Discount type" values={["FIXED","PERCENTAGE"]}/><Field name="value" label="Discount value" type="number"/><Field name="minOrderPaise" label="Minimum subtotal (paise)" type="number" value={0}/><Field name="maxDiscountPaise" label="Maximum discount (paise)" type="number"/><Field name="usageLimit" label="Total usage limit" type="number"/><Field name="perUserLimit" label="Per student limit" type="number" value={1}/><Field name="endsAt" label="Expiry (ISO time, e.g. 2026-12-31T18:30:00Z)"/><div className="coupon-submit"><button className="create-button"><span aria-hidden="true">＋</span>Create coupon</button></div></form></section>}
        {!["overview", "settings", "carousel", ...(isSuperAdmin ? [] : ["administrators"])].includes(tab) && (
          <>
            <AutoSubmitFilters>
              <input type="hidden" name="tab" value={tab} />
              <input
                name="q"
                placeholder={tab === "users" || tab === "administrators" ? "Search name, email or mobile" : "Search by name"}
                defaultValue={params.q}
              />
              {["categories", "products", "users", "payments"].includes(tab) && <select name="universityId" defaultValue={params.universityId || ""}><option value="">All universities</option>{universities.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>}
              {["products", "users", "payments"].includes(tab) && <select name="campusId" defaultValue={params.campusId || ""}><option value="">All campuses</option>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
              {["products", "payments"].includes(tab) && <select name="vendorId" defaultValue={params.vendorId || ""}><option value="">All vendors</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>}
              <button className="secondary">Search</button>
              <span className="muted">{total} records</span>
            </AutoSubmitFilters>
            <section className="panel table-panel">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {columns.map(column => <th key={column.label}>{column.label}</th>)}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        {columns.map(column => <td key={column.label}>{column.cell(row)}</td>)}
                        <td>
                          {! ["universities", "orders", "administrators"].includes(tab) && <RecordActions tab={tab} row={row} />}
                          {tab === "administrators" && <AdministratorActions administrator={row as { id: string; name: string; email: string; phone?: string; role: string; status: string; createdAt?: string }} canDisable={row.status === "ACTIVE" && row.id !== me.id} />}
                          {tab==='coupons'&&<form action={mutate}><Hidden action="couponStatus" id={row.id}/><input type="hidden" name="active" value={String(!row.active)}/><button>{row.active?'Deactivate':'Activate'}</button></form>}
                          {tab==='reviews'&&<form action={mutate}><Hidden action="reviewVisibility" id={row.id}/><input type="hidden" name="visible" value={String(!row.visible)}/><button>{row.visible?'Hide review':'Restore review'}</button></form>}
                          {tab === "categories" && <details><summary>Edit category</summary><form action={mutate} className="edit-form"><Hidden action="categoryEdit" id={row.id} /><Field name="name" label="Category name" value={row.name} /><Field name="image" label="Category image URL" value={row.image || ""} /><Select name="active" label="Visible in app" values={["true", "false"]} value={String(row.active)} /><button>Save category</button></form>{row.active && <form action={mutate} className="danger-action"><Hidden action="categoryDelete" id={row.id} /><button className="danger">Remove from app</button></form>}</details>}
                          {tab === "vendors" && (
                            <details>
                              <summary>Review shop</summary>
                              <form action={mutate} className="edit-form">
                                <Hidden action="vendor" id={row.id} />
                                <small>
                                  Owner: {row.ownerId}
                                  <br />
                                  Campus: {row.campusId}
                                  <br />
                                  {row.address}
                                </small>
                                <Select
                                  name="approvalStatus"
                                  label="Decision"
                                  values={[
                                    "APPROVED",
                                    "CHANGES_REQUESTED",
                                    "REJECTED",
                                  ]}
                                  value={
                                    row.approvalStatus === "PENDING"
                                      ? "CHANGES_REQUESTED"
                                      : row.approvalStatus
                                  }
                                />
                                <Select
                                  name="status"
                                  label="Account status"
                                  values={["ACTIVE", "INACTIVE", "SUSPENDED"]}
                                  value={row.status}
                                />
                                <Field
                                  name="commissionRateBps"
                                  label="Commission (100 basis points = 1%)"
                                  type="number"
                                  value={row.commissionRateBps}
                                />
                                <Select
                                  name="codEnabled"
                                  label="COD enabled"
                                  values={["true", "false"]}
                                  value={String(row.codEnabled)}
                                />
                                <label>
                                  Review reason
                                  <input
                                    name="reviewReason"
                                    defaultValue={row.reviewReason || ""}
                                  />
                                </label>
                                <button>Save review</button>
                              </form>
                            </details>
                          )}
                          {tab === "users" &&
                            ["STUDENT", "VENDOR"].includes(row.role) && (
                              <details>
                                <summary>Review account</summary>
                                <form action={mutate} className="edit-form">
                                  <Hidden action="user" id={row.id} />
                                  <small>
                                    {row.role}
                                    <br />
                                    University: {row.universityId}
                                    <br />
                                    Campus: {row.campusId}
                                  </small>
                                  <Select
                                    name="verified"
                                    label="Campus membership verified"
                                    values={["false", "true"]}
                                    value={String(row.verified)}
                                  />
                                  <Select
                                    name="status"
                                    label="Status"
                                    values={["ACTIVE", "INACTIVE", "SUSPENDED"]}
                                    value={row.status}
                                  />
                                  <button>Save account</button>
                                </form>
                              </details>
                            )}
                          {tab === "campuses" && (
                            <details>
                              <summary>Delivery policy</summary>
                              <form action={mutate} className="edit-form">
                                <Hidden action="policy" id={row.id} />
                                <Select
                                  name="serviceEnabled"
                                  label="Delivery launched"
                                  values={["false", "true"]}
                                  value={String(row.serviceEnabled)}
                                />
                                <Select
                                  name="codEnabled"
                                  label="COD enabled"
                                  values={["true", "false"]}
                                  value={String(row.codEnabled)}
                                />
                                <Field
                                  name="deliveryFeePaise"
                                  label="Delivery fee (paise)"
                                  type="number"
                                  value={row.deliveryFeePaise}
                                />
                                <Field
                                  name="platformFeePaise"
                                  label="Platform fee (paise)"
                                  type="number"
                                  value={row.platformFeePaise}
                                />
                                <Field
                                  name="codLimitPaise"
                                  label="COD maximum (paise)"
                                  type="number"
                                  value={row.codLimitPaise}
                                />
                                <button>Save policy</button>
                              </form>
                            </details>
                          )}
                          {tab === "products" && (
                            <>
                              <form action={mutate}>
                                <Hidden action="product" id={row.id} />
                                <input type="hidden" name="active" value={String(!row.active)} />
                                <button className="secondary">{row.active ? "Hide product" : "Restore product"}</button>
                              </form>
                              <details>
                                <summary>Edit product & image</summary>
                                <form action={uploadProductImage} className="edit-form">
                                  <input type="hidden" name="id" value={row.id} />
                                  <label>Replace product image<input name="file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
                                  <button>Upload image</button>
                                </form>
                                <form action={mutate} className="edit-form">
                                  <Hidden action="productEdit" id={row.id} />
                                  <Field name="name" label="Product name" value={row.name} />
                                  <Field name="description" label="Description" value={row.description || ""} />
                                  <Field name="image" label="Image URL" value={row.image || ""} />
                                  <Field name="pricePaise" label="Price (paise)" type="number" value={row.pricePaise} />
                                  <Field name="stock" label="Stock (blank means unlimited)" type="number" value={row.stock ?? ""} />
                                  <Select name="vegetarian" label="Vegetarian" values={["false", "true"]} value={String(row.vegetarian)} />
                                  <Select name="available" label="Available" values={["true", "false"]} value={String(row.available)} />
                                  <input type="hidden" name="active" value={String(row.active)} />
                                  <button>Save product</button>
                                </form>
                              </details>
                              {row.active && <form action={deleteProduct} className="danger-action">
                                <input type="hidden" name="id" value={row.id} />
                                <button className="danger">Delete product</button>
                              </form>}
                            </>
                          )}
                          {tab === "universities" && (
                            <div className="table-actions">
                              <UniversityActions university={row as { id: string; name: string; city?: string; state?: string; type?: string; status?: string; createdAt?: string }} />
                              <form action={mutate}>
                                <Hidden action="universityStatus" id={row.id} />
                                <input type="hidden" name="status" value={row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                                <button className="small-action secondary">{row.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>
                              </form>
                            </div>
                          )}
                          {tab === "orders" && <OrderActions order={row as { id: string; code: string; status: string; totalPaise: number; paymentStatus?: string; createdAt?: string; student?: { name?: string }; vendor?: { name?: string } }} />}
                          {tab === "support" && (
                            <details>
                              <summary>Reply</summary>
                              <form action={mutate} className="edit-form">
                                <Hidden action="support" id={row.id} />
                                <Field
                                  name="reply"
                                  label="Reply"
                                  value={row.reply}
                                />
                                <Select
                                  name="status"
                                  label="Status"
                                  values={["OPEN", "RESOLVED"]}
                                  value={row.status}
                                />
                                <button>Send reply</button>
                              </form>
                            </details>
                          )}
                          {tab === "audit-logs" && (
                            <small>
                              {new Date(row.createdAt).toLocaleString("en-IN")}
                              <br />
                              Actor: {row.actorId}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <div className="empty">
                  <h3>No records yet</h3>
                  <p>
                    New marketplace activity will appear here. No sample
                    business data has been added.
                  </p>
                </div>
              )}
            </section>
            <div className="pagination">
              <span className="page-summary">Showing {rows.length ? (page - 1) * 30 + 1 : 0}–{Math.min(page * 30, total)} of {total}</span>
              <div className="page-links">
                <Link className={page <= 1 ? "disabled" : ""} aria-disabled={page <= 1} href={page > 1 ? pageHref(page - 1) : pageHref(1)}>← Previous</Link>
                {visiblePages.map(number => <Link key={number} className={number === page ? "current" : ""} href={pageHref(number)}>{number}</Link>)}
                <Link className={page >= totalPages ? "disabled" : ""} aria-disabled={page >= totalPages} href={page < totalPages ? pageHref(page + 1) : pageHref(totalPages)}>Next →</Link>
              </div>
            </div>
          </>
        )}
        {detail && (
          <section className="panel">
            <h2>{detail.code} · Order detail</h2>
            <p>{detail.deliveryAddress}</p>
            <p>
              {money(detail.totalPaise)} · {detail.paymentStatus}
            </p>
            {detail.items?.map((i: Row) => (
              <p key={i.id}>
                {i.quantity} × {i.name} · {money(i.unitPricePaise)}
              </p>
            ))}
            <h3>Timeline</h3>
            {detail.history?.map((h: Row) => (
              <p key={h.id}>
                {new Date(h.createdAt).toLocaleString("en-IN")} — {h.status}{" "}
                {h.reason && `· ${h.reason}`}
              </p>
            ))}
          </section>
        )}
        <footer>
          Campus Drop · University-isolated commerce · All amounts in INR
        </footer>
      </main>
    </div>
  );
}
