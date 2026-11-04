import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export const API = process.env.BACKEND_URL || "http://localhost:4000/v1";
export async function api(path: string, init: RequestInit = {}) {
  const token = (await cookies()).get("campus_admin_token")?.value;
  if (!token) redirect("/login");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) redirect("/login?error=Please+sign+in+again");
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || `Request failed (${response.status})`,
    );
  return data;
}
