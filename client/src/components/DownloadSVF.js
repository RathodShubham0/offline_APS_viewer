import JSZip from "jszip";

const getManifest = async (urn, token) => {
  const url = `https://developer.api.autodesk.com/derivativeservice/v2/manifest/${urn}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Encoding": "gzip, deflate",
    },
  });
 
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.statusText}`);
  }

  return response.json();
};

const downloadFile = async (url, token) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Encoding": "gzip, deflate",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return response.blob(); // Return the file as a Blob
};

const zipSVFBundle = async (urn, token) => {
  try {
    const manifest = await getManifest(urn, token);

    // Locate SVF files
    let svfFiles = [];
    for (const derivative of manifest.derivatives) {
      if (derivative.outputType === "svf" || derivative.outputType === "svf2") {
        const geometryNode = derivative.children.find((child) => child.role === "geometry");
        if (geometryNode) {
          if (geometryNode.children && geometryNode.children.length > 0) {
            svfFiles = geometryNode.children.map((child) => child.urn);
          } else {
            svfFiles.push(geometryNode.urn);
          }
          break;
        }
      }
    }

    if (svfFiles.length === 0) {
      throw new Error("No SVF files found in the manifest.");
    }

    // Download and zip the files
    const zip = new JSZip();

    for (const fileUrl of svfFiles) {
      console.log(`Downloading: ${fileUrl}`);
      const fileBlob = await downloadFile(fileUrl, token);
      const fileName = fileUrl.split("/").pop(); // Extract the file name from the URL
      zip.file(fileName, fileBlob); // Add the file to the zip
    }

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);

    // Trigger download
    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = "svf_bundle.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();

    console.log("SVF bundle downloaded successfully.");
  } catch (error) {
    console.error("Error zipping SVF bundle:", error);
  }
};
const urn = " "; // Replace with your model URN
const token = " .eyJzY29wZSI6WyJkYXRhOnJlYWQiXSwiY2xpZW50X2lkIjoiVGY0dU9Zc3ZNVjN4RWpBOHVpUUg1QWlYV01YR290Nm4xWFp5cGhFTFRKV1BxNHN6IiwiaXNzIjoiaHR0cHM6Ly9kZXZlbG9wZXIuYXBpLmF1dG9kZXNrLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXV0b2Rlc2suY29tIiwianRpIjoic01IM3FVRTR1a1U4YXJjVlZFUHRHRktmSVVCODRkcVZYVVh5a25aNnpSVWhvS3FEZ2hFcWdkYnlnb2RYdTRjeCIsImV4cCI6MTczNjYwNzQ2MX0.jUcY7SKErD2N-CFPADYbgsN28Ic7KC-fmgZIAGxsTl1Cextt6_WLRkHB2edOk9_jX9Bqve0FQm-hfeIXixVJzYJ-TvTiYP-E5DvHOHhUErrd8Zi7DPhgVi5AWEkdD2uJk3xBSsXjrJsO67cVCtpN6jtlFj_1C7CmQAg8y7OEpFP-gEeeg-5FT6yQnnhK1nFfO8TkQGbOht3uoZRChNolmi18BSVocwtOAaGkLdEVMjnRna0uPc2RpgG4y0qDd51EY_ZE74_ICbBTQo5boO1xAWNKKgXckEPpyrjW3TsJA3LkHYpgeC4JJckFBMaQM9JKmwrMkkdc8hAf5ExDCZgUIw"; // Replace with a valid access token

zipSVFBundle(urn, token);

export default zipSVFBundle;

            // Save the SVF file
            const blob = new Blob([svfContent], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'output.svf'; // Specify the filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('SVF file downloaded successfully.');