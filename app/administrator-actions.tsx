"use client";

import { useState } from "react";
import { mutate } from "./actions";

type Administrator = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt?: string;
};

function Icon({ name }: { name: "view" | "edit" | "close" | "disable" }) {
  const paths = {
    view: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.7" /></>,
    edit: <><path d="m4 20 4.1-.9L19.3 7.9a2.2 2.2 0 0 0-3.1-3.1L5 16l-1 4Z"/><path d="m14.7 4.1 3.2 3.2"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    disable: <><circle cx="12" cy="12" r="8.5" /><path d="m6 18 12-12" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function AdministratorActions({ administrator, canDisable }: { administrator: Administrator; canDisable: boolean }) {
  const [mode, setMode] = useState<"view" | "edit" | "disable" | null>(null);
  const close = () => setMode(null);
  return <>
    <div className="icon-actions">
      <button type="button" className="icon-button" aria-label={`View ${administrator.name}`} title="View administrator" onClick={() => setMode("view")}><Icon name="view" /></button>
      <button type="button" className="icon-button" aria-label={`Edit ${administrator.name}`} title="Edit administrator" onClick={() => setMode("edit")}><Icon name="edit" /></button>
      {canDisable && <button type="button" className="icon-button danger-icon" aria-label={`Disable ${administrator.name}`} title="Disable administrator" onClick={() => setMode("disable")}><Icon name="disable" /></button>}
    </div>
    {mode && <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="administrator-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close" onClick={close}><Icon name="close" /></button>
        {mode === "view" ? <>
          <p className="eyebrow">ADMINISTRATOR ACCOUNT</p>
          <h2 id="administrator-modal-title">{administrator.name}</h2>
          <dl className="record-details">
            <div><dt>Email</dt><dd>{administrator.email}</dd></div>
            <div><dt>Mobile</dt><dd>{administrator.phone || "Not provided"}</dd></div>
            <div><dt>Role</dt><dd>{administrator.role}</dd></div>
            <div><dt>Status</dt><dd><span className="badge">{administrator.status}</span></dd></div>
            {administrator.createdAt && <div className="full-detail"><dt>Created</dt><dd>{new Date(administrator.createdAt).toLocaleString("en-IN")}</dd></div>}
          </dl>
        </> : mode === "edit" ? <>
          <p className="eyebrow">ADMINISTRATOR ACCOUNT</p>
          <h2 id="administrator-modal-title">Edit {administrator.name}</h2>
          <form action={mutate} className="modal-form">
            <input type="hidden" name="action" value="updateAdministrator" />
            <input type="hidden" name="id" value={administrator.id} />
            <label className="modal-full">Full name<input name="name" defaultValue={administrator.name} minLength={2} maxLength={100} required /></label>
            <label>Email address<input name="email" type="email" defaultValue={administrator.email} required /></label>
            <label>Mobile number<input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter exactly 10 digits" defaultValue={administrator.phone || ""} required /></label>
            <label className="modal-full">Role<select name="role" defaultValue={administrator.role}><option>ADMIN</option><option>SUPER_ADMIN</option></select></label>
            <label className="modal-full">Set new password <input name="newPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" placeholder="Leave empty to keep the current password" /></label>
            <p className="muted modal-full">Changing a password signs this administrator out on all devices. You cannot remove your own Super Admin role or the final active Super Admin role.</p>
            <div className="modal-buttons"><button type="button" className="secondary" onClick={close}>Cancel</button><button>Save administrator</button></div>
          </form>
        </> : <>
          <p className="eyebrow">ADMINISTRATOR ACCESS</p>
          <h2 id="administrator-modal-title">Disable {administrator.name}?</h2>
          <p className="muted">This immediately signs the administrator out and prevents future sign-ins. The account record remains in the audit history.</p>
          <form action={mutate} className="modal-buttons modal-delete">
            <input type="hidden" name="action" value="deleteAdministrator" />
            <input type="hidden" name="id" value={administrator.id} />
            <button type="button" className="secondary" onClick={close}>Cancel</button>
            <button className="danger">Disable administrator</button>
          </form>
        </>}
      </section>
    </div>}
  </>;
}
