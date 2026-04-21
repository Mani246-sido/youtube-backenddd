import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { jwt} from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId)=>{
   try {
     const user = await User.findById(userId)
     const accessToken =user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()

     user.refreshToken = refreshToken
     await user.save({validateBeforeSave: false})

     return {accessToken,refreshToken}

      
   } catch (error) {
      throw new ApiError(500,"Something went wrong")
      
      
   }

}


const registerUser =  asyncHandler( async(req, res) =>{
     //get user details from frontend
     //validation - non empty ho
     // already registered to nhi(email,username dono se check krna h )
     // avatar chekc rkna h or images
     //coveru=image optional h
     //upload them to cloudinary
     //user object banana pdega - create entry in db
     //remove password and refreshtoken field from respomse
     // check for user creation
     // return krna h response ko
     // nhi to error dena h ....

   const {fullname,email,username,password}= req.body
   // console.log("email",email);
   if(
    [fullname,email,username,password].some((field)=> field?.trim()==="")
   ){
      throw new ApiError(400,"all fields are mandatory")
    
   }
   //FINDONE WILL SEARCH THAT IF ITS ALREADY EXISTED OR NOT
   const existeduser =  await User.findOne({
      $or: [{username},{email}]
   })
   if(existeduser){
      //APIERROR SE LAENGE 
      throw new ApiError(409,"username or email already exists")
   }

   const avatarlocalpath = req.files?.avatar[0]?.Path;
   //const coverimagelocalpath =req.files?.coverimage[0]?.path;

   let coverimagelocalpath;
   if(req.files && Array.isArray(req.files.coverimage)&&
   req.files .coverimage.length>0){
      coverimagelocalpath = req.files.coverimage[0].path
   }


   if(!avatarlocalpath){
      throw new ApiError(400,"avatar is required")
   }

   const avatar = await uploadOnCloudinary(avatarlocalpath)
   const coverimage = await uploadOnCloudinary(coverimagelocalpath)

   if(!avatar){
      throw new ApiError(400,"avatar is required")

   }
   //CREATE KRENGE
   const user = User.create({
      fullname,
      avatar: avatar.url ,
      coverimage: coverimage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
   })
   //select passs or refreshtoken ko hta dega
   const createduser =  await User.findById(user._id).select(
      "-password -refreshToken"
   )
   if(!createduser){
      throw new ApiError(500,"Something when wrong while registering the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createduser, "User registered sucessfully")
   )

})
const loginUser = asyncHandler(async(req,res)=>{
   //req body -> data
   //user name ya email vgera h ya nhi 
   //find user 
   // pass check
   //token
   //send cokies (which will carry tokens to user)

   const {email,username,password} =  req.body

   if(!username || !email){
      throw new ApiError(400,"username or email is required")
   }
   const user = await User.findOne({
      $or: [{email}, {username}]
   })
   if(!user){
      throw new ApiError(404, "USER NOT EXIST")
      }
   const ispasswordvalid = await user.isPasswordCorrect(password)
   if(!ispasswordvalid){
      throw new ApiError(401, "invalid user credentials")
   }
   const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser =await User.findById(user._id).select("-password - refreshToken")
  const options = {
   httpOnly: true,
   secure: true
  }

  return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
   new ApiResponse(
      200,
      {
         //ye isliye kiya kya pta user custom token bhejna chahta ho ya local storage me save kr na chhahta ho :)
         user: loggedInUser,accessToken,
         refreshToken
      },
      "User logged in successfully"
   
   )
  )





})

//log out krenge abb

const logoutuser = asyncHandler(async (req, res) => {
   //we will take data from middleware so that none other than targeted one gets logged out(custome one)
   //remove cookies
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
            refreshtoken: 1 // this removes the field from document 
         }
      },
      {
         new: true
      }
   )
   const options = {
      httpOnly: true,
      secure: true
   }
   
   return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200, {}, "user loggedout successfully"))

})

const refrshAccessToken = asyncHandler(async(req,res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }

  try {
    const decodedtoken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await user.findById(decodedtoken?._id)
    
    
    if(!user){
       throw new ApiError(401, "invalid refresh token")
    }
 
    if(incomingRefreshToken !== user.refreshToken){
       throw new ApiError(401, "invalid refresh token is expired or used")
    }
 
    const options = {
       httpOnly: true,
       secure: true
    }
 
    const{accessToken,newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
    return res
    .status(200)
    .cookie("accesstoken",accessToken,options)
    .cookie("refreshtoken",newrefreshToken,options)
    .json(new ApiResponse(200, {accessToken, refreshToken: newrefreshToken}, "user loggedin successfully"))
 
  } catch (error) {
   throw new ApiError(401, error?.message || "invalid refresh token")
  }




})

const changecurrentpassword = asyncHandler(async(req,res) => {
   const {oldpassword, newpassword} = req.body
   const user = await User.findById(req.user?._id)
   const ifpassvalid =  await user.isPasswordCorrect(oldpassword)

   if(!ifpassvalid){
      throw new ApiError(400, "invalid old password")
   }
   user.password = newpassword
   await user.save({validateBeforeSave: false})

   return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getcurruser = asyncHandler(async(req,res) => {
   return res.status(200).json(200,req.user,"current user fetched successfully")
})

const updateAccdetails = asyncHandler(async(req,res)=>{
   const {fullname,email} = req.body

   if(!fullname || !email){
      throw new ApiError(400, "all fields are mandatory")
   }
   const user = User.findByIdAndUpdate(req.user?.id
      ,{
         //set parameter recieve krta hg jo bhi field update krni h
         $set:{
            fullname: fullname,
            email: email
         }
      },{new: true}
      
   ).select("-password")
   
   return res.status(200).json(new ApiResponse(200, user , "account details updated successfully changed"))
})

const updateavatar = asyncHandler(async(req,res)=>{
   const avatarlocalpath = req.file?.path

   if(!avatarlocalpath){
      throw new ApiError(400, "avatar is required")

   }
   const avatar = await uploadOnCloudinary(avatarlocalpath)

   if(!avatar.url){
      throw new ApiError(400, "avatar upload failed")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }

      },
      {new: true}
   ).select("-password")
   return res.status(200).json(new ApiResponse(
      200,user,"avatar image changed successfully"
   )
   )
})

const updateusercoverimage = asyncHandler(async(req,res)=>{
   const coverimagelocalpath= req.file?.path

   if(!coverimagelocalpath){
      throw new ApiError(400, "cover image is required")

   }
   const coverImage = await uploadOnCloudinary(coverimagelocalpath)

   if(!coverImage.url){
      throw new ApiError(400, "cover image upload failed")
   }
  const user =  await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }

      },
      {new: true}
   ).select("-password")
   
   return res.status(200).json(new ApiResponse(
      200,user,"cover image changed successfully"
   )
   )
})

const getuserchannelprofile = asyncHandler(async(req,res)=>{
   const {username} = req.params
   if(!username?.trim()){
      throw new ApiError(400, "username is required")
   }
   //aggregation pipeline match h khud dhundh leta h 
   const channel = await User.aggregate([
      {
         //kisse match krna h 
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         // lookup krna h kis collection se

         $lookup:{
            from: "subscriptions"
            ,localField: "_id"
            ,foreignField: "channel"
            ,as: "subscribers"
         }
      },
      {
         $lookup:{
            from: "subscriptions"
            ,localField: "_id"
            ,foreignField: "subscriber"
            ,as: "susbcribedto"
         }
         

      },
      {
         //jo bhi naya field add krna h
         $addFields:{
            subscribersCount: {
               // jo bhi array h uska size de dega
               $size: "$subscribers"
            },
            channelsubscribedtocount:{
               $size: "$susbcribedto"
            },
            issubscribed :{
               // agr current user ki id subscribers wale array me h to true nhi to false
               $cond:{

                  if:{$in:[req.user?._id,"$susbcribers.subscriber"]},
                  then:true,
                  else:false

               }
            }
         }
      },{
         // jo bhi field chahiye vo select krna  h
         $project:{
            subscribersCount: 1,
            _id:1,
            username:1,
            channelsubscribedtocount: 1,
            fullname:1,
            avatar: 1,
            coverImage: 1,
            issubscribed:1,
            email: 1,


         }

      }
   ])
   if(!channel?.length){
      throw new ApiError(404,"channel does not exist")
   }
   return res.status(200).json(new ApiResponse(200,channel[0],"user channel fetched successfully"))
})

const getwatchhistory= asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
      {
         $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
         }
      }
      ,
      {
         $lookup:{
            from: "videos",
            localField: "watchhistory",
            foreignField: "_id",
            as: "watchhistory",
            pipeline:[{
               $lookup:{
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline:[{
                     $project:{
                        username:1,
                        fullname:1,
                        avatar: 1,
                     }
                  },
                  {
                      //abb bss frontend easy ho uske liye krenge
                     $addFields:{
                        owner:{
                           $first: "owner"
                           }
                     }
                  }]

               }

            }]
         }
      }
   ])
   return res.status(200).json(new ApiResponse(200,user,"user watch history fetched successfully"))
})





export {registerUser,
   loginUser,
   logoutuser,
   refrshAccessToken,
   changecurrentpassword,
   getcurruser,
   updateAccdetails,
   updateavatar,
   updateusercoverimage,
   getuserchannelprofile,
   getwatchhistory,
   
}