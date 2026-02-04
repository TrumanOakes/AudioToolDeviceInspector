import { useState } from "react"
import { DeviceInspector } from "@/components/DeviceInspector"
import { useProjects } from "@/hooks/useProjects"
import { AudiotoolClient } from "@audiotool/nexus"


interface ProjectsPageProps {
    client: AudiotoolClient
}
function ProjectsPage({ client }: ProjectsPageProps) {
    // Fetch projects using the authenticated client
    const projectsResult = useProjects(client)

    const [selectedProjectId, setSelectedProjectId] = useState("")
  const [doc, setDoc] = useState<any>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [actionLog, setActionLog] = useState<string>("")
  


 const connect = async () => {
  if (doc) return
  if (!selectedProjectId) return
 


    try {
      const d = await client.createSyncedDocument({
        mode: "online",
        project: `https://beta.audiotool.com/studio?project=${selectedProjectId}`,
      })
      await d.start()
      setDoc(d)
    } catch (e: any) {
      setConnectError(e?.message ?? String(e))
    }
  }

  const disconnect = async () => {
  if (!doc) return

  try {
    if (doc.connected?.terminate) {
      await doc.connected.terminate()
      setDoc(null)
    }
  } catch (e) {
    console.error("disconnect failed", e)
  } finally {
    setDoc(null)
  }


  <button
  onClick={() => {
    // hard reset clears the active synced document session
    window.location.reload()
  }}
>
  Reset (Reload)
</button>
}

    // Create a new project and open it in Audiotool Studio
    const handleNewProject = async () => {
  if (projectsResult.case !== "loaded") return

  const created = await projectsResult.createProject("New Project")
  if (!created) return

  window.open(
    `https://beta.audiotool.com/studio?project=${created.name}`,
    "_blank"
  )
}
    <button
  onClick={() => {
    if (!selectedProjectId) return
    window.open(`https://beta.audiotool.com/studio?project=${selectedProjectId}`, "_blank")
  }}
  disabled={!selectedProjectId}
>
  Open Studio
</button>


    return (
        <>
        <div>
        Successfully Logged In! Welcome!
        </div>

        {/* Show loading state while fetching projects */}
        {projectsResult.case === 'loading' && (
            <div className="projects-loading">
                <p>Loading projects...</p>
            </div>
        )}
        {/* Show error state with retry option */}
        {projectsResult.case === 'error' && (
            <div className="projects-error">
              <p>Failed to load projects: {projectsResult.error}</p>
              <button onClick={projectsResult.retry} className="retry-btn">
                Retry
              </button>
            </div>
        )}
        {/* Show projects list when loaded */}
        {projectsResult.case === 'loaded' && (
            <div className="projects-loaded">
                <button onClick={() => {
                    handleNewProject()
                }}>Create New Project</button>
                <br />
                Existing Projects: 
                <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
                >
            <option value="">-- choose a project --</option>
             {projectsResult.projects.map((project) => (
     <option key={project.name} value={project.name}>
      {project.displayName}
    </option>
  ))}
</select>
<div style={{ marginTop: 12, display: "flex", gap: 8 }}>
  <button onClick={connect} disabled={!selectedProjectId || !!doc}>
    Connect
  </button>
  <button onClick={disconnect} disabled={!doc}>
    Disconnect
  </button>

<button
  onClick={async () => {
    if (!doc) return
    try {
      setActionLog("Creating tonematrix...")
      await doc.modify((t: any) =>
        t.create("tonematrix", {
          displayName: "Inspector Test",
          positionX: 200,
          positionY: 200,
        })
      )
      setActionLog("✅ Created tonematrix (modify completed). Open Studio to confirm.")

      // 🔑 Force DeviceInspector to re-query
      setDoc((prev: any) => ({ ...prev }))
    } catch (e: any) {
      setActionLog(`❌ Create failed: ${e?.message ?? String(e)}`)
      console.error(e)
    }
  }}
  disabled={!doc}
>
  Create Tonematrix
</button>

{actionLog && (
  <p style={{ color: actionLog.startsWith("❌") ? "crimson" : "green" }}>
    {actionLog}
  </p>
)}


</div>

{connectError && <p style={{ color: "crimson" }}>{connectError}</p>}
            </div>
        )}

        
        {doc && <DeviceInspector doc={doc} />}
        </>
  )
  
}

export default ProjectsPage