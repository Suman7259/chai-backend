import { asyncHandler } from "../utils/asyncHandlers.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, UsuploadOnCloudinaryer } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async( req,res ) =>{
    
    //get user details from frontend
    const {fullName,username,email,password}= req.body
        console.log("fullName : ", fullName);

    //validation or check any field empty or not

    // if(fullName === ""){
    //     throw new ApiError(400,"fullname is required")
    // } checked for full name now individually check for all
    
    if([fullName,email,password,username].some((field)=>
        field?.trim()===""))
    {
        throw new ApiError(400,"All fields are required")
    }

    //check user exists or not
    const existedUser=User.findOne({
        $or:[{ username },{ email }]
    })
    if( existedUser ){
        throw new ApiError(409,"email or user name already exists")
    }

    //check for imgs and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload in cloudinary,check avatar
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    // check for user creation,remove pass word and refresh token from response
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})

export {registerUser}