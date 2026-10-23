"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, ClipboardList, CreditCard, Headphones, ImagePlus, LayoutDashboard, MapPinned, Package, Search, Settings2, ShieldCheck, Star, Store, Tags, TicketPercent, UserCog, Users, LogOut } from "lucide-react";
import { logout } from "./actions";

const groups = [
  { label: "Overview", items: [{ id: "overview", label: "Dashboard", Icon: LayoutDashboard }] },
  { label: "Campus network", items: [{ id: "universities", label: "Universities", Icon: Building2 }, { id: "campuses", label: "Campuses", Icon: MapPinned }, { id: "vendors", label: "Vendors", Icon: Store }] },
  { label: "Marketplace", items: [{ id: "categories", label: "Categories", Icon: Tags }, { id: "products", label: "Products", Icon: Package }, { id: "orders", label: "Orders", Icon: ClipboardList }, { id: "payments", label: "Payments & COD", Icon: CreditCard }] },
  { label: "People", items: [{ id: "users", label: "Students & accounts", Icon: Users }, { id: "administrators", label: "Admin settings", Icon: UserCog }] },
  { label: "Operations", items: [{ id: "coupons", label: "Coupons", Icon: TicketPercent }, { id: "reviews", label: "Reviews", Icon: Star }, { id: "support", label: "Support", Icon: Headphones }, { id: "carousel", label: "Home carousel", Icon: ImagePlus }, { id: "settings", label: "App settings", Icon: Settings2 }, { id: "audit-logs", label: "Audit history", Icon: ShieldCheck }] },
];

export function AdminSidebar({ name, role }: { name: string; role: string }) {
  const params = useSearchParams(); const pathname = usePathname(); const router = useRouter();
  const [collapsed, setCollapsed] = useState(false); const [search, setSearch] = useState("");
  const active = params.get("tab") || "overview";
  const visibleGroups = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase())) })).filter((group) => group.items.length), [search]);
  return <aside className={collapsed ? "reference-sidebar collapsed" : "reference-sidebar"}>
    <div className="reference-brand"><Link href="/" aria-label="Campus Drop dashboard"><Image src="/campus-drop-icon.png" alt="" width={42} height={42} /></Link>{!collapsed && <div><strong>Campus Drop</strong><small>Operations console</small></div>}<button className="collapse-button" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div>
    {!collapsed && <label className="nav-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace" /></label>}
    <nav>{visibleGroups.map((group) => <section className="reference-nav-group" key={group.label}>{!collapsed && <p>{group.label}</p>}{group.items.map(({ id, label, Icon }) => { const href = `${pathname}?tab=${id}`; return <Link key={id} href={href} prefetch onMouseEnter={() => router.prefetch(href)} className={active === id ? "active" : ""} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></Link>; })}</section>)}</nav>
    <div className="reference-account"><span>{name.slice(0, 1).toUpperCase()}</span>{!collapsed && <div><strong>{name}</strong><small>{role.replaceAll("_", " ")}</small></div>}</div>
    <form action={logout} className="reference-signout"><button type="submit" title="Sign out"><LogOut size={17} /><span>Sign out</span></button></form>
  </aside>;
}
