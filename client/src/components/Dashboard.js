import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { generateToken } from '../services/tokenservice';
function Dashboard() {
  const [models, setModels] = useState([]);

  
  const fetchModels = async () => {
    debugger;
    try {
      const accessToken = await generateToken();

      // Fetch hubs
      const hubsResponse = await axios.get('https://developer.api.autodesk.com/project/v1/hubs', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const hubs = hubsResponse.data.data;

      const allModels = [];

      for (const hub of hubs) {
        const hubId = hub.id;

        // Fetch projects in the hub
        const projectsResponse = await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const projects = projectsResponse.data.data;

        for (const project of projects) {
          const projectId = project.id;

          // Fetch top folders in the project
          const topFoldersResponse = await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const topFolders = topFoldersResponse.data.data;

          for (const folder of topFolders) {
            const folderId = folder.id;

            // Fetch items in the folder
            const itemsResponse = await axios.get(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const items = itemsResponse.data.data;

            for (const item of items) {
              if (item.type === 'items' && item.attributes.extension.type === 'items:autodesk.bim360:File') {
                allModels.push(item);
              }
            }
          }
        }
      }

      setModels(allModels);
      console.log("User's models:", allModels);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div>
      <h1>User's Models</h1>
      <ul>
        {models.map(model => (
          <li key={model.id}>{model.attributes.displayName}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;