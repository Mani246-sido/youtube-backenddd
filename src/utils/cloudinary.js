import fs from "fs"
//fs sile system h ye file ko read write and remove krwata h 
  
import { v2 as cloudinary } from 'cloudinary';
import { response } from "express";

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    
    // Upload an image
     const uploadOnCloudinary=async(localfilepath)=>{
        try {
            if(!localfilepath) return null
            //upload the file
            cloudinary.uploader.upload(localfilepath,{
                resource_type: "auto",
            })
            //file to upload hogyi uper
            console.log("file uploaded sucessfully.... buddy!",response.url);
            return response;
            
        } catch (error) {
            fs.unlinkSync(localfilepath)//remove the locally save temp file as the upload opt got failed
            return null;
            
        }
     }
export {uploadOnCloudinary}
    