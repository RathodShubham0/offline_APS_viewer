import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { generateToken } from '../services/tokenservice';
import { Spinner } from 'react-bootstrap';

function Dashboard() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
 
  const fetchFolderContents = async (projectId, folderId, accessToken) => {
    let allItems = [];
    let nextUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`;
  
    while (nextUrl) {
      const itemsResponse = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log(`Items in folder ${folderId}:`, itemsResponse.data);
      const items = itemsResponse.data.data;
      allItems = allItems.concat(items);
  
      // Check for more pages
      nextUrl = itemsResponse.data.links?.next?.href || null;
  
      // Recursively fetch subfolder contents
      for (const item of items) {
        if (item.type === "folders") {
          const subfolderId = item.id;
          const subfolderItems = await fetchFolderContents(
            projectId,
            subfolderId,
            accessToken
          );
          allItems = allItems.concat(subfolderItems);
        }
      }
    }
  
    return allItems;
  };
  
  const fetchModels = async () => {
    setLoading(true);
    try {
      const accessToken = await generateToken();
      console.log("Access Token:", accessToken);
  
      // Fetch hubs
      const hubsResponse = await axios.get('https://developer.api.autodesk.com/project/v1/hubs', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Hubs response:", hubsResponse.data);
      const hubs = hubsResponse.data.data;
  
      const allModels = [];
  
      for (const hub of hubs) {
        const hubId = hub.id;
  
        // Fetch projects in the hub
        const projectsResponse = await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log(`Projects in hub ${hubId}:`, projectsResponse.data);
        const projects = projectsResponse.data.data;
  
        for (const project of projects) {
          const projectId = project.id;
  
          // Fetch top folders in the project
          const topFoldersResponse = await axios.get(`https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log(`Top folders in project ${projectId}:`, topFoldersResponse.data);
          const topFolders = topFoldersResponse.data.data;
  
          for (const folder of topFolders) {
            const folderId = folder.id;
  
            // Fetch all items recursively (including subfolders)
            const folderItems = await fetchFolderContents(
              projectId,
              folderId,
              accessToken
            );
  
            for (const item of folderItems) {
              if (
                item.type === "items" &&
                item.attributes.extension.type === "items:autodesk.bim360:File"
              ) {
                allModels.push(item);
              }
            }
          }
        }
      }
  
      setModels(allModels);
      console.log("User's models:", allModels);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching models:", error.response ? error.response.data : error.message);
    }
    setLoading(false);
  };
  

  useEffect(() => {
    fetchModels();
  }, []);
  
  return (
    <div className="container mt-4">
    <h1 className="text-center mb-4">User's Online Models</h1>
    <div className="table-responsive">
      <table className="table table-striped table-bordered">
        <thead className="thead-dark">
          <tr>
            <th scope="col">Model Name</th>
            <th scope="col">Creation Time</th>
            <th scope="col">Created By</th>
            <th scope="col">Last Modified</th>
            <th scope="col">View Link</th>
          </tr>
        </thead>
        <tbody>    {loading && <Spinner animation="border" role="status">
 
 </Spinner>} 
          {models.map((model) => (
            <tr key={model.id}>
              <td>{model.attributes.displayName}</td>
              <td>{new Date(model.attributes.createTime).toLocaleString()}</td>
              <td>{model.attributes.createUserName}</td>
              <td>{new Date(model.attributes.lastModifiedTime).toLocaleString()}</td>
              <td>
                <a
                  href={model.links.webView.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  View Model
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  
  );
}
export default Dashboard;
