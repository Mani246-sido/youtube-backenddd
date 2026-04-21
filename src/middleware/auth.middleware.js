import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken"

//verify that theres a user or not
export const verifyjwt =  asyncHandler(async(req,_,next ) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","")
        //autherization jwt ka token h iske baad bearer tokken use krteh uske baad <token>
        //if no token avaialbe jus give bboom baam errror
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
        //if user not found then throw error
        if(!user){

            
            //todo frontend
            throw new ApiError(404,"user not found")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401,"Invalid access token")
        
    }



})