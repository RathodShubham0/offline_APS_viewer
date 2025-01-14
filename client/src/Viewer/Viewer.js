import React, { useEffect, useRef, useState } from "react";
/* global Autodesk */
 import { generateToken } from "../services/tokenservice";
const Viewer =  React.forwardRef((props, ref)  => {
  const viewerDiv = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Local and online model paths
  const LOCAL_MODEL_PATH = "/svf_bundle/svf_file/bundle/output.svf"; // Ensure this is hosted via a static server with proper CORS headers
  const MODEL_URN = "dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjZsRThNSjZuU0ZTQTNhUUczaUJWMkE_dmVyc2lvbj0x";

  useEffect(() => {
    // Fetch Autodesk access token
    setAccessToken(generateToken());
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
     
    if(viewer){
      viewer.tearDown();
      viewer.finish();
      setViewer(null);
     
    }
      
    if (viewer==null) {
      //debugger;
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
    }  
  };

  React.useImperativeHandle(ref, () => ({
    handleToggle,
  }));


  return (
    <div>
      <div id="viewerDiv" ref={viewerDiv} style={{ height: "9vh", width: "100%" }}></div>
    </div>
  );
});

export default Viewer;
