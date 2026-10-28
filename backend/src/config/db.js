import mongoose from "mongoose"

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_Url);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.log("Error in connecting MongoDB: ", error.message);
    }
}

export default connectDB