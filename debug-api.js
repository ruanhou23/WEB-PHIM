const API_BASE_URL = "https://ophim1.com/v1/api";

async function fetchHome() {
    const url = `${API_BASE_URL}/the-loai`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response Type:", typeof data);
        console.log("Response Keys:", Object.keys(data));

        if (data.data) {
            console.log("Data Type:", typeof data.data);
            console.log("Data isArray:", Array.isArray(data.data));
            console.log("Data Sample:", JSON.stringify(data.data).slice(0, 200));

            if (data.data.items) {
                console.log("Data.items isArray:", Array.isArray(data.data.items));
                console.log("Data.items Sample:", JSON.stringify(data.data.items).slice(0, 200));
            }
        } else {
            console.log("Data property is missing or null");
        }

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

fetchHome();
