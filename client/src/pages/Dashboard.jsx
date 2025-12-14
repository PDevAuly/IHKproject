// client/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  // Kunden
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState("");
  const [customerForm, setCustomerForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    street: "",
    zip_code: "",
    city: "",
    notes: "",
  });

  // Infrastruktur
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [infraItems, setInfraItems] = useState([]);
  const [loadingInfra, setLoadingInfra] = useState(false);
  const [infraError, setInfraError] = useState("");
  const [infraForm, setInfraForm] = useState({
    system_name: "",
    system_type: "",
    os_version: "",
    ip_address: "",
    location: "",
    notes: "",
  });

  // Uploads
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  // ---------------- Lifecycle ----------------

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed.user || null);
    } catch (e) {
      console.error("Fehler beim Lesen von localStorage:", e);
    }

    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoadingCustomers(true);
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("Fehler beim Laden der Kunden:", err);
      setCustomerError("Kunden konnten nicht geladen werden.");
    } finally {
      setLoadingCustomers(false);
    }
  }

  // ---------------- Kunden-Logik ----------------

  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCustomerSubmit(e) {
    e.preventDefault();
    setCustomerError("");

    if (!customerForm.company_name.trim()) {
      setCustomerError("Firmenname ist Pflicht.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCustomerError(data.message || "Fehler beim Anlegen des Kunden.");
        return;
      }

      setCustomers((prev) => [data.customer, ...prev]);

      setCustomerForm({
        company_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        street: "",
        zip_code: "",
        city: "",
        notes: "",
      });
    } catch (err) {
      console.error("Fehler beim Anlegen des Kunden:", err);
      setCustomerError("Serverfehler beim Anlegen des Kunden.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  // ---------------- Upload-Logik ----------------

  async function loadUploadsForCustomer(customer) {
    if (!customer) return;
    setLoadingUploads(true);
    setUploadError("");
    setUploadSuccess("");
    setUploads([]);

    try {
      const res = await fetch(
        `${API_BASE}/uploads?customer_id=${customer.id}`
      );
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      console.error("Fehler beim Laden der Uploads:", err);
      setUploadError("Uploads konnten nicht geladen werden.");
    } finally {
      setLoadingUploads(false);
    }
  }

  function handleFileChange(e) {
    setUploadFile(e.target.files[0] || null);
    setUploadSuccess("");
    setUploadError("");
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    if (!selectedCustomer) {
      setUploadError("Bitte zuerst einen Kunden auswählen.");
      return;
    }
    if (!uploadFile) {
      setUploadError("Bitte eine Datei auswählen.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("customer_id", selectedCustomer.id);

      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData, // Browser setzt Content-Type selbst
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.message || "Fehler beim Hochladen.");
        return;
      }

      setUploadSuccess("Datei erfolgreich hochgeladen.");
      setUploadFile(null);

      const input = document.getElementById("fileUploadInput");
      if (input) input.value = "";

      setUploads((prev) => [data.upload, ...prev]);
    } catch (err) {
      console.error("Upload-Fehler im Frontend:", err);
      setUploadError("Serverfehler beim Upload.");
    }
  }

  // ---------------- Infrastruktur-Logik ----------------

  function handleInfraChange(e) {
    const { name, value } = e.target;
    setInfraForm((prev) => ({ ...prev, [name]: value }));
  }

  async function loadInfraForCustomer(customer) {
    if (!customer) return;
    setSelectedCustomer(customer);
    setInfraError("");
    setLoadingInfra(true);
    setInfraItems([]);

    try {
      const res = await fetch(
        `${API_BASE}/infrastructure?customer_id=${customer.id}`
      );
      const data = await res.json();
      setInfraItems(data);
    } catch (err) {
      console.error("Fehler beim Laden der Infrastruktur:", err);
      setInfraError("Infrastruktur konnte nicht geladen werden.");
    } finally {
      setLoadingInfra(false);
    }

    // NEU: auch Uploads für diesen Kunden laden
    await loadUploadsForCustomer(customer);
  }

  async function handleInfraSubmit(e) {
    e.preventDefault();
    if (!selectedCustomer) {
      setInfraError("Bitte zuerst einen Kunden aus der Liste auswählen.");
      return;
    }
    if (!infraForm.system_name.trim()) {
      setInfraError("Systemname ist Pflicht.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/infrastructure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          ...infraForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInfraError(data.message || "Fehler beim Anlegen des Systems.");
        return;
      }

      setInfraItems((prev) => [data.infrastructure, ...prev]);

      setInfraForm({
        system_name: "",
        system_type: "",
        os_version: "",
        ip_address: "",
        location: "",
        notes: "",
      });
    } catch (err) {
      console.error("Fehler beim Anlegen des Systems:", err);
      setInfraError("Serverfehler beim Anlegen des Systems.");
    }
  }

  // ---------------- Render ----------------

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1>Onboarding-Dashboard</h1>
        <div>
          {user && (
            <span style={{ marginRight: "10px" }}>
              Eingeloggt als: {user.email}
            </span>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Kunden anlegen */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ddd",
        }}
      >
        <h2>Neuen Kunden anlegen</h2>
        <form onSubmit={handleCustomerSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <input
              name="company_name"
              placeholder="Firmenname *"
              value={customerForm.company_name}
              onChange={handleCustomerChange}
            />
            <input
              name="contact_name"
              placeholder="Ansprechpartner"
              value={customerForm.contact_name}
              onChange={handleCustomerChange}
            />
            <input
              name="contact_email"
              placeholder="E-Mail"
              value={customerForm.contact_email}
              onChange={handleCustomerChange}
            />
            <input
              name="contact_phone"
              placeholder="Telefon"
              value={customerForm.contact_phone}
              onChange={handleCustomerChange}
            />
            <input
              name="street"
              placeholder="Straße"
              value={customerForm.street}
              onChange={handleCustomerChange}
            />
            <input
              name="zip_code"
              placeholder="PLZ"
              value={customerForm.zip_code}
              onChange={handleCustomerChange}
            />
            <input
              name="city"
              placeholder="Ort"
              value={customerForm.city}
              onChange={handleCustomerChange}
            />
            <input
              name="notes"
              placeholder="Notizen"
              value={customerForm.notes}
              onChange={handleCustomerChange}
            />
          </div>
          <button
            type="submit"
            style={{ marginTop: "15px", padding: "8px 16px" }}
          >
            Kunde speichern
          </button>
        </form>
        {customerError && (
          <p style={{ color: "red", marginTop: "10px" }}>{customerError}</p>
        )}
      </section>

      {/* Kundenliste + Infrastruktur + Uploads */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "20px",
        }}
      >
        {/* Kundenliste */}
        <section>
          <h2>Bestehende Kunden</h2>
          {loadingCustomers ? (
            <p>Lade Kunden...</p>
          ) : customers.length === 0 ? (
            <p>Noch keine Kunden vorhanden.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                cursor: "pointer",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Firma
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Ansprechpartner
                  </th>
                  <th
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    Ort
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => loadInfraForCustomer(c)}
                    style={{
                      borderBottom: "1px solid #eee",
                      backgroundColor:
                        selectedCustomer && selectedCustomer.id === c.id
                          ? "#f0f8ff"
                          : "transparent",
                    }}
                  >
                    <td style={{ padding: "4px 0" }}>{c.id}</td>
                    <td style={{ padding: "4px 0" }}>{c.company_name}</td>
                    <td style={{ padding: "4px 0" }}>{c.contact_name}</td>
                    <td style={{ padding: "4px 0" }}>
                      {c.zip_code} {c.city}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Infrastruktur + Dokumente */}
        <section style={{ border: "1px solid #ddd", padding: "10px" }}>
          <h2>Infrastruktur & Dokumente</h2>
          {selectedCustomer ? (
            <>
              <p>
                Aktueller Kunde:{" "}
                <strong>{selectedCustomer.company_name}</strong>
              </p>

              {/* Infrastruktur-Formular */}
              <form onSubmit={handleInfraSubmit}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <input
                    name="system_name"
                    placeholder="Systemname (z.B. Mailserver) *"
                    value={infraForm.system_name}
                    onChange={handleInfraChange}
                  />
                  <input
                    name="system_type"
                    placeholder="Typ (Server, Client, Netzwerkgerät...)"
                    value={infraForm.system_type}
                    onChange={handleInfraChange}
                  />
                  <input
                    name="os_version"
                    placeholder="OS / Version"
                    value={infraForm.os_version}
                    onChange={handleInfraChange}
                  />
                  <input
                    name="ip_address"
                    placeholder="IP-Adresse"
                    value={infraForm.ip_address}
                    onChange={handleInfraChange}
                  />
                  <input
                    name="location"
                    placeholder="Standort (z.B. Serverraum EG)"
                    value={infraForm.location}
                    onChange={handleInfraChange}
                  />
                  <input
                    name="notes"
                    placeholder="Notizen"
                    value={infraForm.notes}
                    onChange={handleInfraChange}
                  />
                </div>
                <button
                  type="submit"
                  style={{ marginTop: "10px", padding: "6px 12px" }}
                >
                  System speichern
                </button>
              </form>

              {infraError && (
                <p style={{ color: "red", marginTop: "8px" }}>{infraError}</p>
              )}

              <h3 style={{ marginTop: "15px" }}>Systeme dieses Kunden</h3>
              {loadingInfra ? (
                <p>Lade Infrastruktur...</p>
              ) : infraItems.length === 0 ? (
                <p>Noch keine Systeme erfasst.</p>
              ) : (
                <ul>
                  {infraItems.map((item) => (
                    <li key={item.id}>
                      <strong>{item.system_name}</strong>{" "}
                      {item.system_type && `(${item.system_type})`} –{" "}
                      {item.ip_address && `${item.ip_address}, `}
                      {item.location}
                    </li>
                  ))}
                </ul>
              )}

              {/* Dokumente-Bereich */}
              <h3 style={{ marginTop: "20px" }}>Dokumente</h3>

              <form onSubmit={handleUploadSubmit}>
                <input
                  id="fileUploadInput"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "block", marginBottom: "8px" }}
                />
                <button type="submit" style={{ padding: "6px 12px" }}>
                  Datei hochladen
                </button>
              </form>

              {uploadError && (
                <p style={{ color: "red", marginTop: "8px" }}>{uploadError}</p>
              )}
              {uploadSuccess && (
                <p style={{ color: "green", marginTop: "8px" }}>
                  {uploadSuccess}
                </p>
              )}

              {loadingUploads ? (
                <p>Lade Dokumente...</p>
              ) : uploads.length === 0 ? (
                <p>Noch keine Dokumente hochgeladen.</p>
              ) : (
                <ul>
                  {uploads.map((u) => (
                    <li key={u.id}>
                      {u.original_name} (
                      {Math.round((u.file_size || 0) / 1024)} kB) –{" "}
                      {u.uploaded_at &&
                        new Date(u.uploaded_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>Bitte links einen Kunden auswählen, um Infrastruktur und Dokumente zu sehen.</p>
          )}
        </section>
      </div>
    </div>
  );
}
