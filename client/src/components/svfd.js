import React from 'react';

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
    const res = { model_urn: 'your_model_urn_here' }; // Replace with actual model URN
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

async function downloadSvfFileUrl(manifest_data, new_urn, access_token) {
    const svf_urns = [];
    const derivatives = manifest_data.derivatives;

    derivatives.forEach(item => {
        if (item.children) {
            item.children.forEach(child => {
                if (child.children) {
                    child.children.forEach(sub_child => {
                        if (sub_child.mime === "application/autodesk-svf") {
                            svf_urns.push(sub_child.urn);
                        }
                    });
                }
            });
        }
    });

    if (svf_urns.length > 0) {
        const svf_urn = svf_urns[0];
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${new_urn}/manifest/${svf_urn}`;
        const headers = {
            'Authorization': `Bearer ${access_token}`
        };

        const response = await fetch(url, { headers: headers });
        if (response.status === 200) {
            const svf_content = await response.blob();
            const svf_url = URL.createObjectURL(svf_content);
            const a = document.createElement('a');
            a.href = svf_url;
            a.download = 'output.svf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log("SVF file downloaded successfully.");
        } else {
            console.log("Failed to download SVF file.");
        }
    } else {
        console.log("No SVF URNs found in the manifest data.");
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