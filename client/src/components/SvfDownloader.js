import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { generateToken } from '../services/tokenservice';
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

const SvfDownloader = () => {
    const [loading, setLoading] = useState(false);
    const [encodedUrn, setEncodedUrn] = useState('');
    const location = useLocation();
    const { modelUrn } = useParams();

    useEffect(() => {
        const getVersionFromQuery = () => {
            const queryString = location.search; // Get the query string (e.g., "?version=2")
            const params = new URLSearchParams(queryString); // Parse query string
            return params.get("version"); // Get the "version" parameter
        };

        const version = getVersionFromQuery();

        const encodeForAPSViewer = (urn) => {
            let base64 = btoa(urn);
            base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
            return base64;
        };

        const urnWithVersion = version ? `${modelUrn}?version=${version}` : modelUrn;
        const encodedUrn = encodeForAPSViewer(urnWithVersion);
        setEncodedUrn(encodedUrn);
    }, [location.search, modelUrn]);

    const downloadData = async () => {
        setLoading(true);
        const accessToken = await generateToken();

        const baseUrl = "https://developer.api.autodesk.com/modelderivative/v2/designdata";
        const endpoint = `${baseUrl}/${encodedUrn}/manifest`;

        const headers = {
            'Authorization': `Bearer ${accessToken}`
        };

        try {
            const response = await fetch(endpoint, { headers: headers });
            const manifestData = await response.json();
            console.log("Manifest data:", manifestData);
            const status = manifestData.status;

            console.log("Status of manifest:", status);

            if (status === "success") {
                await downloadSvfFiles(manifestData, encodedUrn, accessToken);
            } else if (status === "failed") {
                console.log("Manifest processing failed.");
            } else if (status === "pending" || status === "inprogress") {
                setTimeout(downloadData, 10000); // Retry after 10 seconds
            }
        } catch (error) {
            console.error("An error occurred:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadSvfFiles = async (manifestData, encodedUrn, accessToken) => {
        const svfUrns = [];
        const derivatives = manifestData.derivatives || [];
        const zip = new JSZip();

        // Extract the SVF URNs
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
            const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/manifest/${svfUrn}`;
            const headers = { Authorization: `Bearer ${accessToken}` };

            try {
                // Fetch SVF file
                const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
                const svfContent = response.data;

                // Add output.svf to ZIP
 
                const folderStructure = `svf_file/bundle/`;
                zip.folder(folderStructure).file('output.svf', svfContent);
                // Extract ZIP contents
                const zipContent = await JSZip.loadAsync(svfContent);
                const manifestFile = zipContent.file('manifest.json');
                if (!manifestFile) {
                    console.error('manifest.json not found in the ZIP file.');
                    return;
                }

                // Parse manifest.json
                const manifestJson = JSON.parse(await manifestFile.async('string'));
                const assets = manifestJson.assets;
 
                // Download and add assets to ZIP
                for (const asset of assets) {
                    const uriFilename = asset.URI;
                    let modifiedUrn;

                    if (uriFilename.startsWith('../../')) {
                        const index = svfUrn.indexOf('{3D}.svf');
                        modifiedUrn = svfUrn.slice(0, index) + uriFilename;
                        const lastSlashIndex = svfUrn.lastIndexOf('/');
                        modifiedUrn = svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
                        const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/manifest/${modifiedUrn}`;
                        const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                        const filename = uriFilename.split('/').pop(); // Extract the filename from uriFilename
                        const folderStructure = ``;
                       zip.folder(folderStructure).file(filename, assetResponse.data);
                    
                    } else if (!uriFilename.startsWith('embed:')) {
                    
                        const lastSlashIndex = svfUrn.lastIndexOf('/');
                        modifiedUrn = svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
                        const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/manifest/${modifiedUrn}`;
                        const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                        const folderStructure = `svf_file/bundle/`;
                        zip.folder(folderStructure).file(uriFilename, assetResponse.data);
                    }
                    else {
                        // const index = svfUrn.indexOf("{3D}.svf");
                        // let modifiedUrn = svfUrn.slice(0, index) + uriFilename;
                        // const lastSlashIndex = svfUrn.lastIndexOf('/');
                        // modifiedUrn = svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
                        // const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/manifest/${modifiedUrn}`;
                        // const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                        // const folderStructure = `svf_bundle/svf_file/bundle/${uriFilename}`;
                        // zip.folder(folderStructure).file(uriFilename, assetResponse.data);

                    }
                    // if (modifiedUrn) {
                    //     const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodedUrn}/manifest/${modifiedUrn}`;
                    //     const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                    //     const filename = uriFilename.split('/').pop();
                    //     zip.file(filename, assetResponse.data);
                    // }
                }

                // Generate and download the ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                saveAs(zipBlob, 'svf_bundle.zip');

                console.log('SVF file and assets downloaded successfully.');
            } catch (error) {
                console.error('Error downloading SVF file:', error.message);
            }
        } else {
            console.error('No SVF URNs found in the manifest data.');
        }
    };

    return (
        <div>
            <ToastContainer />
            <button onClick={downloadData}>
                Download SVF
                <div>
                    {loading && <Spinner animation="border" role="status"></Spinner>}
                </div>
            </button>
        </div>
    );
};

export default SvfDownloader;
