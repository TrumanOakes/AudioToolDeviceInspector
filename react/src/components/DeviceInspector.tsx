import { useEffect, useMemo, useState } from "react"

export function DeviceInspector({ doc }: { doc: any }) {
  const [entities, setEntities] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  // Debug: what the doc actually has
  useEffect(() => {
    if (!doc) return
    console.log("DOC KEYS:", Object.keys(doc))
    console.log("events.onCreate type:", typeof (doc.events as any)?.onCreate)
    console.log("events.onUpdate type:", typeof (doc.events as any)?.onUpdate)
    console.log("events.onDelete type:", typeof (doc.events as any)?.onDelete)
    console.log("HAS modify:", typeof doc.modify)
    console.log("DOC PROTO:", Object.getOwnPropertyNames(Object.getPrototypeOf(doc)))
    console.log("CONNECTED KEYS:", Object.keys(doc.connected ?? {}))
    console.log(
      "CONNECTED PROTO:",
      doc.connected ? Object.getOwnPropertyNames(Object.getPrototypeOf(doc.connected)) : null
    )
  }, [doc])

  // Load existing entities
  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)

      try {
        // ✅ Correct for your Nexus version
        const all = await doc.queryEntities.get()
        const arr = Array.isArray(all) ? all : []
        if (cancelled) return

        setEntities(arr)

        // Debug (optional)
        console.log("ENTITIES:", arr)
        console.log("ENTITY SAMPLE:", arr[0])
        console.log("ENTITY KEYS:", arr[0] ? Object.keys(arr[0]) : null)

        if (!selectedId && arr[0]?.id) {
          setSelectedId(arr[0].id)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e))
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  // Filter “device-like” entities (yours have entityType)
  const devices = useMemo(() => {
    return entities.filter(
      (e) => e && typeof e === "object" && typeof e.entityType === "string"
    )
  }, [entities])

  // Search filter
  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return devices
    return devices.filter((d) => {
      const name = String(d.fields?.displayName ?? d.entityType ?? d.id).toLowerCase()
      const type = String(d.entityType ?? "").toLowerCase()
      return name.includes(q) || type.includes(q)
    })
  }, [devices, query])

  const selected = useMemo(
    () => devices.find((d) => d.id === selectedId) ?? null,
    [devices, selectedId]
  )

  const connectedLabel = doc?.connected ? "Connected" : "Disconnected"

  return (
    <div style={{ marginTop: 16 }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18 }}>Device Inspector</div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            border: "1px solid #e5e7eb",
            background: doc?.connected ? "#ecfdf5" : "#fef2f2",
          }}
        >
          <span style={{ fontWeight: 700 }}>{connectedLabel}</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 }}>
        {/* Sidebar */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            background: "white",
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid #e5e7eb",
              background: "#fcfcfc",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Devices</div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search devices…"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                outline: "none",
              }}
            />

            {error && (
              <div style={{ marginTop: 10, color: "#b91c1c", whiteSpace: "pre-wrap" }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Showing <b>{filteredDevices.length}</b> of <b>{devices.length}</b>
            </div>
          </div>

          <div style={{ maxHeight: 520, overflow: "auto", padding: 10 }}>
            {filteredDevices.map((d) => {
              const isActive = d.id === selectedId
              const title = String(d.fields?.displayName ?? d.entityType ?? d.id)
              const subtitle = `${String(d.entityType ?? "unknown")} • ${String(d.id).slice(
                0,
                8
              )}…`

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 12,
                    border: isActive ? "1px solid #111827" : "1px solid #e5e7eb",
                    background: isActive ? "#111827" : "white",
                    color: isActive ? "white" : "#111827",
                    cursor: "pointer",
                    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, opacity: isActive ? 0.9 : 0.65 }}>
                    {subtitle}
                  </div>
                </button>
              )
            })}

            {devices.length === 0 && (
              <div style={{ padding: 14, color: "#6b7280" }}>No devices found yet.</div>
            )}

            {devices.length > 0 && filteredDevices.length === 0 && (
              <div style={{ padding: 14, color: "#6b7280" }}>No matches for “{query}”.</div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            background: "white",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #e5e7eb",
              background: "#fcfcfc",
            }}
          >
            <div style={{ fontWeight: 800 }}>Inspector</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Select a device to view/edit its fields.
            </div>
          </div>

          <div style={{ padding: 14 }}>
            {!selected && <div style={{ color: "#6b7280" }}>Pick a device on the left.</div>}

            {selected && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#fafafa",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {String(selected.entityType)}
                  </div>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#fafafa",
                      fontSize: 12,
                    }}
                  >
                    id: {String(selected.id).slice(0, 10)}…
                  </div>
                </div>

                {/* ===== Controls (safe + basic) ===== */}
                <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                  {/* Only shows if displayName is actually a string */}
                  {typeof selected.fields?.displayName === "string" && (
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                        Display name
                      </span>
                      <input
                        value={selected.fields.displayName}
                        onChange={(e) => {
                          const next = e.target.value
                          doc.modify((t: any) =>
                            t.update(selected.id, {
                              fields: { displayName: next },
                            })
                          )
                        }}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          outline: "none",
                        }}
                      />
                    </label>
                  )}

                  {/* Auto numeric controls: only proto-typed field objects */}
                  {selected.fields &&
                    typeof selected.fields === "object" &&
                    Object.entries(selected.fields).map(([key, val]: any) => {
                      if (!val || typeof val !== "object") return null
                      if (!val.mutable) return null

                      if (
                        val._protoType !== "float" &&
                        val._protoType !== "uint32" &&
                        val._protoType !== "int32"
                      ) {
                        return null
                      }

                      return (
                        <label key={key} style={{ display: "grid", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                            {key}{" "}
                            <span style={{ fontWeight: 500, color: "#6b7280" }}>
                              ({val._protoType})
                            </span>
                          </span>
                          <input
                            type="number"
                            onChange={(e) => {
                              const num = Number(e.target.value)
                              doc.modify((t: any) =>
                                t.update(selected.id, {
                                  fields: { [key]: num },
                                })
                              )
                            }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              outline: "none",
                            }}
                          />
                        </label>
                      )
                    })}
                </div>

                {/* ===== Raw JSON (debug) ===== */}
                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>Raw JSON</summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: "#0b1020",
                      color: "white",
                      fontSize: 12,
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
