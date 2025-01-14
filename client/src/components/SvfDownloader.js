import React, { Component } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
class SvfDownloader extends Component {
    state = {
        loading: false,
    };

    generateToken = async () => {
        const url = "https://developer.api.autodesk.com/authentication/v2/token";
        const payload = 'grant_type=client_credentials&scope=data%3Aread';
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic  GY0dU9Zc3ZNVjN4RWpBOHVpUUg1QWlYV01YR290Nm4xWFp5cGhFTFRKV1BxNHN6OnM5ZVR4Nm54UG1HeTFsQm1LV1VSVHdyaDFvaDJ6ak1laHc3VXhGMG85cThoWE5CdGFFYWN3eGFDQURPSTBGRXc=',
            'Accept': 'application/json'
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: payload
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token: ${response.statusText}`);
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error("Error fetching access token:", error);
            toast.error("Failed to fetch access token. Please check your internet connection.");
            throw error;
        }
    };

    downloadData = async () => {
        this.setState({ loading: true });
        const modelUrn = 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjZsRThNSjZuU0ZTQTNhUUczaUJWMkE_dmVyc2lvbj0x'; // Replace with actual model URN
        const accessToken = await this.generateToken();

        const baseUrl = "https://developer.api.autodesk.com/modelderivative/v2/designdata";
        const endpoint = `${baseUrl}/${modelUrn}/manifest`;

        const headers = {
            'Authorization': `Bearer ${accessToken}`
        };

        try {
            const response = await fetch(endpoint, { headers: headers });
            const manifestData = await response.json();
            const status = manifestData.status;

            console.log("Status of manifest:", status);

            if (status === "success") {
                await this.downloadSvfFiles(manifestData, modelUrn, accessToken);
            } else if (status === "failed") {
                console.log("Manifest processing failed.");
            } else if (status === "pending" || status === "inprogress") {
                setTimeout(this.downloadData, 10000); // Retry after 10 seconds
            }
        } catch (error) {
            console.error("An error occurred:", error);
        } finally {
            this.setState({ loading: false });
        }
    };

    downloadSvfFiles = async (manifestData, modelUrn, accessToken) => {
        const svfUrns = [];
        const derivatives = manifestData.derivatives || [];
        const zip = new JSZip();

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
            const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${modelUrn}/manifest/${svfUrn}`;
            const headers = { Authorization: `Bearer ${accessToken}` };
            try {
                // Fetch SVF file
                const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
                const svfContent = response.data;

                // Add output.svf to ZIP
                zip.file('output.svf', svfContent);

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
                    } else if (!uriFilename.startsWith('embed:')) {
                        const lastSlashIndex = svfUrn.lastIndexOf('/');
                        modifiedUrn = svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
                    }
                    if (modifiedUrn) {
                        const assetUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${modelUrn}/manifest/${modifiedUrn}`;
                        const assetResponse = await axios.get(assetUrl, { headers, responseType: 'arraybuffer' });
                        const filename = uriFilename.split('/').pop();
                        zip.file(filename, assetResponse.data);
                    }
                }

                // Generate and download the ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                saveAs(zipBlob, 'svf_of_model.zip');

                console.log('SVF file and assets downloaded successfully.');
            } catch (error) {
                console.error('Error downloading SVF file:', error.message);
            }
        } else {
            console.error('No SVF URNs found in the manifest data.');
        }
    };

    render() {
        const { loading } = this.state;

        return (
            <div>  <ToastContainer />
                <button onClick={this.downloadData}>Download SVF<div>
                    {loading && <Spinner animation="border" role="status">
                    <span className="sr-only"></span>
                </Spinner>}</div></button>
                
            </div>
        );
    }
}

export default SvfDownloader;