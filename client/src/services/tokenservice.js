import { toast } from 'react-toastify';


export const generateToken = async () => {
    const url = "https://developer.api.autodesk.com/authentication/v2/token";
    const payload = 'grant_type=client_credentials&scope=data%3Aread';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic bTNlQ0xyNkE0enJ1R09JQ0pCUDlsVXZETkRHaXpGQWE1eVZHb1JTNGFUWDBkN3JJOkFjdjR2WThTcDZhcldWOTR6TkFERDg3YWVXdUVWdVc0cDE4REU2S1EzWDBnanhLc3R5blh3YXdzZWRTUk5KWng=',
       
        'Accept': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload
        });

        if (!response.ok) {
            // toast.error(`Error fetching access token ${response.statusText}`);
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
       // console.error("Error fetching access token:", error);
        toast.error("Error fetching access token. Please check your internet connection.");
        throw error;
    }
};