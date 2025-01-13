import React, { useEffect, useRef, useState } from "react";
/* global Autodesk */

const Viewer = () => {
  const viewerDiv = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Local and online model paths
  const LOCAL_MODEL_PATH = "http://192.168.127.12:8000/svf_bundle/svf_file/bundle/output.svf"; // Ensure this is hosted via a static server with proper CORS headers
  const MODEL_URN = "dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjZsRThNSjZuU0ZTQTNhUUczaUJWMkE_dmVyc2lvbj0x";

  useEffect(() => {
    // Fetch Autodesk access token
    const fetchToken = async () => {
      try {
        const response = await fetch(
          "https://developer.api.autodesk.com/authentication/v2/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
              Authorization: "Basic VGY0dU9Zc3ZNVjN4RWpBOHVpUUg1QWlYV01YR290Nm4xWFp5cGhFTFRKV1BxNHN6OnM5ZVR4Nm54UG1HeTFsQm1LV1VSVHdyaDFvaDJ6ak1laHc3VXhGMG85cThoWE5CdGFFYWN3eGFDQURPSTBGRXc=", // Replace with your encoded client_id:client_secret
            },
            body: new URLSearchParams({
              grant_type: "client_credentials",
              scope: "data:read",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const data = await response.json();
        setAccessToken(data.access_token);
      } catch (error) {
        console.error("Error fetching access token:", error);
      }
    };

    fetchToken();
  }, []);

  // Load local model
  const loadLocalModel = (viewerInstance) => {
    const options = {
      env: "Local",
      useADP: false, // Ensures the viewer doesn't use Autodesk's cloud services
    };

    Autodesk.Viewing.Initializer(options, () => {
      viewerInstance.start();
      viewerInstance.loadModel(
        LOCAL_MODEL_PATH,
        {},
        () => console.log("Local model loaded successfully."),
        (error) => console.error("Error loading local model:", error)
      );
    });
  };

  // Load online model
  const loadOnlineModel = (viewerInstance) => {
    if (!accessToken) {
      console.error("Access token is not available. Cannot load online model.");
      return;
    }

    const options = {
      env: "AutodeskProduction",
      accessToken,
    };

    Autodesk.Viewing.Initializer(options, () => {
      const urn = `urn:${MODEL_URN}`;

      Autodesk.Viewing.Document.load(
        urn,
        (doc) => {
          const viewables = doc.getRoot().search({ type: "geometry" });
          if (viewables && viewables.length > 0) {
            viewerInstance
              .loadDocumentNode(doc, viewables[0], { globalOffset: { x: 0, y: 0, z: 0 } })
              .then(() => console.log("Online model loaded successfully."))
              .catch((err) => console.error("Error loading online model:", err));
          } else {
            console.error("No viewable geometry found in the document.");
          }
        },
        (errorCode, errorMsg) => {
          console.error(`Error loading document: ${errorCode} - ${errorMsg}`);
        }
      );
    });
  };

  // Toggle between online and local models
  const handleToggle = () => {
    if (!viewer) {
      const viewerInstance = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current);
      viewerInstance.start();
      setViewer(viewerInstance);

      const status = document.getElementById("status");
      if (status.innerText === "Model: Online") {
        loadLocalModel(viewerInstance);
        status.innerText = "Model: Offline";
      } else {
        loadOnlineModel(viewerInstance);
        status.innerText = "Model: Online";
      }
    } else {
      viewer.tearDown();
      viewer.finish();
      setViewer(null);
    }
  };

  // Download the SVF bundle
  const downloadSvfBundle = () => {
    fetch("http://127.0.0.1:5000/download_svf_bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_urn: MODEL_URN }),
    })
      .then((response) => response.text())
      .then((result) => console.log("SVF bundle downloaded:", result))
      .catch((error) => console.error("Error downloading SVF bundle:", error));
  };

  return (
    <div>
      <nav className="navbar">
        <h4>Offline Viewer</h4>
        <div className="toggle-container">
          <button onClick={handleToggle}>Toggle Model</button>
          <div id="status">Model: Online</div>
          <button onClick={downloadSvfBundle}>Download SVF Bundle</button>
        </div>
      </nav>
      <div id="viewerDiv" ref={viewerDiv} style={{ height: "100vh", width: "100%" }}></div>
    </div>
  );
};

export default Viewer;
