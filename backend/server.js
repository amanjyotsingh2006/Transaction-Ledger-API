import "dotenv/config";

import app from "./src/app.js"
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT

const startServer = async () => {
    try {
        await connectDB();
    
        app.listen(PORT, () => {
            console.log(`Server running at ${PORT}`);
        })
    } catch (error) {
        console.log("Failed to start Server: ", error.message);
    }
}

startServer();