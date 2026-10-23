"use client";

import { useState } from "react";
import { mutate } from "./actions";

type University = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  type?: string;
  status?: string;
  createdAt?: string;
};

function Icon({ name }: { name: "view" | "edit" | "delete" | "close" }) {
  const paths = {
    view: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></>,
    edit: <><path d="m4 20 4.1-.9L19.3 7.9a2.2 2.2 0 0 0-3.1-3.1L5 16l-1 4Z"/><path d="m14.7 4.1 3.2 3.2"/></>,
    delete: <><path d="M4 7h16"/><path d="M9 7V4h6v3M7 7l.8 13h8.4L17 7M10 11v5M14 11v5"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function UniversityActions({ university }: { university: University }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete" | null>(null);
  const close = () => setMode(null);
  return <>
    <div className="icon-actions">
      <button type="button" className="icon-button" aria-label={`View ${university.name}`} title="View university" onClick={() => setMode("view")}><Icon name="view" /></button>
      <button type="button" className="icon-button" aria-label={`Edit ${university.name}`} title="Edit university" onClick={() => setMode("edit")}><Icon name="edit" /></button>
      <button type="button" className="icon-button danger-icon" aria-label={`Delete ${university.name}`} title="Delete university" onClick={() => setMode("delete")}><Icon name="delete" /></button>
    </div>

    {mode && <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="university-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close" onClick={close}><Icon name="close" /></button>
        {mode === "view" && <>
          <p className="eyebrow">UNIVERSITY RECORD</p>
          <h2 id="university-modal-title">{university.name}</h2>
          <dl className="record-details">
            <div><dt>City</dt><dd>{university.city || "Not set"}</dd></div>
            <div><dt>State</dt><dd>{university.state || "Not set"}</dd></div>
            <div><dt>Type</dt><dd>{university.type || "OTHER"}</dd></div>
            <div><dt>Status</dt><dd><span className="badge">{university.status || "ACTIVE"}</span></dd></div>
            <div className="full-detail"><dt>University ID</dt><dd>{university.id}</dd></div>
          </dl>
        </>}
        {mode === "edit" && <>
          <p className="eyebrow">EDIT UNIVERSITY</p>
          <h2 id="university-modal-title">{university.name}</h2>
          <form action={mutate} className="modal-form">
            <input type="hidden" name="action" value="universityEdit" />
            <input type="hidden" name="id" value={university.id} />
            <label>University name<input name="name" defaultValue={university.name} required minLength={2} maxLength={150} /></label>
            <label>City<input name="city" defaultValue={university.city || ""} maxLength={100} /></label>
            <label>State<input name="state" defaultValue={university.state || ""} maxLength={100} /></label>
            <label>University type<select name="type" defaultValue={university.type || "OTHER"}>{["CENTRAL", "STATE", "PRIVATE", "DEEMED", "OTHER"].map((type) => <option key={type}>{type}</option>)}</select></label>
            <div className="modal-buttons"><button type="button" className="secondary" onClick={close}>Cancel</button><button>Save changes</button></div>
          </form>
        </>}
        {mode === "delete" && <>
          <p className="eyebrow">DELETE UNIVERSITY</p>
          <h2 id="university-modal-title">Delete {university.name}?</h2>
          <p className="muted">This permanently removes campuses, shops, products, categories and coupons for this university. Student and seller accounts are suspended. Universities with order history cannot be deleted, because financial records must be retained.</p>
          <form action={mutate} className="modal-buttons modal-delete">
            <input type="hidden" name="action" value="universityDelete" />
            <input type="hidden" name="id" value={university.id} />
            <button type="button" className="secondary" onClick={close}>Cancel</button><button className="danger">Delete university</button>
          </form>
        </>}
      </section>
    </div>}
  </>;
}
