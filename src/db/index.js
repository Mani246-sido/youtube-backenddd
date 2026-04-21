import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectioninst=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n connected !! DB HOST: ${connectioninst.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection failed thoda check kro", error);
        process.exit(1)
        
    }
}
export default connectDB