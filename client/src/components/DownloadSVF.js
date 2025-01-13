import React, { Component } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

class SvfDownloader extends Component {
  state = {
    loading: false,
  };

  generateToken = async () => {
    const url = "https://developer.api.autodesk.com/authentication/v2/token";
    const payload = "grant_type=client_credentials&scope=data%3Aread";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic VGY0dU9Zc3ZNVjN4RWpBOHVpUUg1QWlYV01YR290Nm4xWFp5cGhFTFRKV1BxNHN6OnM5ZVR4Nm54UG1HeTFsQm1LV1VSVHdyaDFvaDJ6ak1laHc3VXhGMG85cThoWE5CdGFFYWN3eGFDQURPSTBGRXc=",
      Accept: "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    return response.data.access_token;
  };

  downloadData = async () => {
    this.setState({ loading: true });
    const modelUrn =
      "dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjZsRThNSjZuU0ZTQTNhUUczaUJWMkE_dmVyc2lvbj0x"; // Replace with actual model URN
    const accessToken = await this.generateToken();

    const baseUrl =
      "https://developer.api.autodesk.com/modelderivative/v2/designdata";
    const endpoint = `${baseUrl}/${modelUrn}/manifest`;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    try {
      const response = await axios.get(endpoint, { headers });
      const manifestData = response.data;
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
              if (subChild.mime === "application/autodesk-svf") {
                svfUrns.push(subChild.urn);
              }
            }
          }
        }
      }
    }

    if (svfUrns.length > 0) {
      const svfUrn = svfUrns[0];
      const svfUrl = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${modelUrn}/manifest/${svfUrn}`;
      const headers = { Authorization: `Bearer ${accessToken}` };

      try {
        const response = await axios.get(svfUrl, { headers, responseType: "arraybuffer" });
        const svfContent = response.data;

        // Add output.svf to ZIP
        zip.folder("svf_bundle").folder("svf_file").folder("bundle").file("output.svf", svfContent);

        // Process manifest.json
        const zipContent = await JSZip.loadAsync(svfContent);
        const manifestFile = zipContent.file("manifest.json");
        if (!manifestFile) {
          console.error("manifest.json not found in the ZIP file.");
          return;
        }

        const manifestJson = JSON.parse(await manifestFile.async("string"));
        const assets = manifestJson.assets;

        for (const asset of assets) {
          const uriFilename = asset.URI;
          let assetUrl;

          if (uriFilename.startsWith("../")) {
            const index = svfUrn.indexOf("{3D}.svf");
            assetUrl =
              svfUrn.slice(0, index) + uriFilename.slice(6);
          } else if (!uriFilename.startsWith("embed:")) {
            const lastSlashIndex = svfUrn.lastIndexOf("/");
            assetUrl =
              svfUrn.slice(0, lastSlashIndex + 1) + uriFilename;
          }

          if (assetUrl) {
            const assetResponse = await axios.get(
              `https://developer.api.autodesk.com/modelderivative/v2/designdata/${modelUrn}/manifest/${assetUrl}`,
              { headers, responseType: "arraybuffer" }
            );
            const filename = uriFilename.split("/").pop();
            zip.folder("svf_bundle").file(filename, assetResponse.data);
          }
        }

        // Generate and save ZIP
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "svf_of_model.zip");

        console.log("SVF file and assets downloaded successfully.");
      } catch (error) {
        console.error("Error downloading SVF file:", error.message);
      }
    } else {
      console.error("No SVF URNs found in the manifest data.");
    }
  };

  render() {
    const { loading } = this.state;

    return (
      <div>
        <button onClick={this.downloadData} disabled={loading}>
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            "Download SVF"
          )}
        </button>
      </div>
    );
  }
}

export default SvfDownloader;
