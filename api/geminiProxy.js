// This file should be located at: AlloCate-Project/api/geminiProxy.js

export default async function handler(request, response) {
    // Only allow POST requests, as our client-side app will send data this way
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Retrieve the Gemini API key securely from Vercel's Environment Variables
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.error("CRITICAL: GEMINI_API_KEY environment variable is not set on the server.");
            // Send a generic error to the client, don't expose too much detail
            return response.status(500).json({ error: "Server configuration error. Please contact support." });
        }

        // Expect the client to send an object in the request body containing:
        // 1. The 'model' name (e.g., "gemini-2.0-flash")
        // 2. The 'geminiPayload' (which includes 'contents' and optionally 'generationConfig')
        const { model, geminiPayload } = request.body;

        if (!model || !geminiPayload) {
            return response.status(400).json({ error: "Bad request: Missing 'model' or 'geminiPayload' in the request body." });
        }
        
        // Construct the actual URL for the Gemini API
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        // Make the call to the Gemini API
        const geminiApiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload), // Forward the payload from the client
        });

        // Get the response from Gemini (could be success or error JSON)
        const responseData = await geminiApiResponse.json();

        // Send Gemini's status code and response data back to our client-side AlloCate app
        return response.status(geminiApiResponse.status).json(responseData);

    } catch (error) {
        console.error("Proxy function internal error:", error);
        // Handle any unexpected errors within the proxy function itself
        return response.status(500).json({ error: `Proxy internal error: ${error.message || 'An unknown error occurred.'}` });
    }
}