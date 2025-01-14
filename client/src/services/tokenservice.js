export const generateToken = async () => {
    const url = "https://developer.api.autodesk.com/authentication/v2/token";
    const payload = 'grant_type=client_credentials&scope=data%3Aread';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic dGd4V2F6WWN2SGc1Q3ByQmlOVksxZFFaTGtsNGF0Zjg6OXlMSWFudWg0QmZRbWRGcw==',
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
        throw error;
    }
};