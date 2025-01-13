import React from 'react';
import axios from 'axios';
// import fs from 'fs';
// import path from 'path';
// import unzipper from 'unzipper';
import JSZip from 'jszip';
async function generateToken() {
    const url = "https://developer.api.autodesk.com/authentication/v2/token";
    const payload = 'grant_type=client_credentials&scope=data%3Aread';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic VGY0dU9Zc3ZNVjN4RWpBOHVpUUg1QWlYV01YR290Nm4xWFp5cGhFTFRKV1BxNHN6OnM5ZVR4Nm54UG1HeTFsQm1LV1VSVHdyaDFvaDJ6ak1laHc3VXhGMG85cThoWE5CdGFFYWN3eGFDQURPSTBGRXc=',
        'Accept': 'application/json'
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    });

    const data = await response.json();
    return data.access_token;
}

async function downloadData() {
    const res = { model_urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjZsRThNSjZuU0ZTQTNhUUczaUJWMkE_dmVyc2lvbj0x' }; // Replace with actual model URN
    const new_urn = res.model_urn;
    const access_token = await generateToken();

    const base_url = "https://developer.api.autodesk.com/modelderivative/v2/designdata";
    const endpoint = `${base_url}/${new_urn}/manifest`;

    const headers = {
        'Authorization': `Bearer ${access_token}`
    };

    try {
        const response = await fetch(endpoint, { headers: headers });
        const manifest_data = await response.json();
        const status = manifest_data.status;

        console.log("Status of manifest:", status);

        if (status === "success") {
            await downloadSvfFileUrl(manifest_data, new_urn, access_token);
        } else if (status === "failed") {
            console.log("Manifest processing failed.");
        } else if (status === "pending" || status === "inprogress") {
            setTimeout(downloadData, 10000); // Retry after 10 seconds
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function downloadSvfFileUrl(manifestData, newUrn, accessToken) {
    const svfUrns = [];
    const derivatives = manifestData.derivatives || [];
    for (const item of derivatives) {
        if (item.children) {
            for (const child of item.children) {
                if (child.children) {
                    for (const subChild of child.children) {
                        if (subChild.mime === 'application/autodesk-svf') {
                            svfUrns.push(subChild.urn);
                        }
                    }
                }
            }
        }
    }
    if (svfUrns.length > 0) {
        const svfUrn = svfUrns[0];
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${newUrn}/manifest/${svfUrn}`;
        const headers = { Authorization: `Bearer ${accessToken}` };
        try {
            // Fetch SVF file
            const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
            const svfContent = response.data;
            // Extract ZIP contents
            const zip = await JSZip.loadAsync(svfContent);
            const manifestFile = zip.file('manifest.json');
            if (!manifestFile) {
                console.error('manifest.json not found in the ZIP file.');
                return;
            }
            // Parse manifest.json
            const manifestData = JSON.parse(await manifestFile.async('string'));
            const assets = manifestData.assets;
            // Download and save assets
            for (const asset of assets) {
                const uriFilename = asset.URI;
                let modifiedUrn;
                if (uriFilename.startsWith('../../')) {
                    const index = svfUrn.indexOf('{3D}.svf');
                    modifiedUrn = svfUrn.slice(0, index) + uriFilename;
                } else if (!uriFilename.startsWith('embed:')) {
                    const lastSlashIndex = svfUrn.lastIndexOf('/');
                    modifiedUrn = svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
                }
                if (modifiedUrn) {
                    const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${newUrn}/manifest/${modifiedUrn}`;
                    const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                    // Save the asset as a downloadable file
                    const blob = new Blob([assetResponse.data]);
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = uriFilename.split('/').pop(); // Extract the filename
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
            console.log('SVF file and assets downloaded successfully.');
        } catch (error) {
            console.error('Error downloading SVF file:', error.message);
        }
    } else {
        console.error('No SVF URNs found in the manifest data.');
    }
}

const Svfd = () => {
    return (
        <div>
            <button onClick={downloadData}>Download SVF</button>
        </div>
    );
};

export default Svfd;