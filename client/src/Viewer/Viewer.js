import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
/* global Autodesk */
import { useLocation } from "react-router-dom";
import SvfDownloader from "../components/SvfDownloader";
 import { generateToken } from "../services/tokenservice";
const Viewer =  React.forwardRef((props, ref)  => {
  const viewerDiv = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const { modelUrn } = useParams(); 
  const [model_Urn, setmodel_Urn] = useState('');
  // Local and online model paths
  const LOCAL_MODEL_PATH = "/svf_bundle/svf_file/bundle/output.svf"; // Ensure this is hosted via a static server with proper CORS headers
    
  const location = useLocation();
  

  
  
  useEffect(async () => {
    const getVersionFromQuery = () => {
      const queryString = location.search; // Get the query string (e.g., "?version=2")
      const params = new URLSearchParams(queryString); // Parse query string
      return params.get("version"); // Get the "version" parameter
    };
    
    // Replace this with the actual modelURN you receive
    const version = getVersionFromQuery();
    
    const encodeForAPSViewer = (urn) => {
      let base64 = btoa(urn);
    
      // Make it URL-safe
      base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
       console.log("base64",base64);
      return base64;
    };
    
    const urnWithVersion = version ? `${modelUrn}?version=${version}` : modelUrn;
    const encodedUrn = encodeForAPSViewer(urnWithVersion);
    setmodel_Urn(encodedUrn);
  
    // Fetch Autodesk access token
    setAccessToken(await generateToken());

    loadOnlineModel();
  }, []);

  // Load local model
  const loadLocalModel = ( ) => {
     
    const viewerInstance = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current);
    viewerInstance.start();
    setViewer(viewerInstance);
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
  const loadOnlineModel = async ( ) => {
        
      const viewerInstance = new Autodesk.Viewing.GuiViewer3D(viewerDiv.current);
      viewerInstance.start();
      setViewer(viewerInstance);                        
    if (!accessToken) {
      console.error("Access token is not available. Cannot load online model.");
      return;
    }
  
    try {
      // Ensure the access token is resolved and valid.
      const token = await accessToken;  // If accessToken is a promise, await its resolution.
      const options = {
        env: "AutodeskProduction",
        accessToken: token,  // Use the resolved token
      };
  
      Autodesk.Viewing.Initializer(options, () => {
        const urn = `urn:${model_Urn}`;
  
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
    } catch (err) {
      console.error("Error while loading model:", err);
    }
  };
  
  

  // Toggle between online and local models
  const handleToggle = () => {


      const status = document.getElementById("status");
      if (status.innerText === "Model: Online") {
        loadLocalModel();
        status.innerText = "Model: Offline";
      } else {
        loadOnlineModel();
        status.innerText = "Model: Online";
      }
     if(viewer){
      viewer.tearDown();
      viewer.finish();
      setViewer(null);
     }
  };

  React.useImperativeHandle(ref, () => ({
    handleToggle,
  }));


  return (<>
      <SvfDownloader/>
    <div>
      <div id="viewerDiv" ref={viewerDiv} style={{ height: "9vh", width: "100%" }}></div>
    </div>
  </>
  );
});

export default Viewer;
