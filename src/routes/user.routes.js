import { Router } from "express";
import { changecurrentpassword, getcurruser, getuserchannelprofile, getwatchhistory, loginUser, logoutuser, refrshAccessToken, registerUser, updateAccdetails, updateavatar, updateusercoverimage } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }

    ]),
    registerUser)
router.route("/login").post(loginUser)
//secured routes
router.route("/logout").post(verifyjwt, logoutuser)
router.route("/refresh-token").post(refrshAccessToken)
router.route("/change-password").post(verifyjwt,changecurrentpassword)
router.route("/current-user").get(verifyjwt,getcurruser)
router.route("/update-account").patch(verifyjwt,updateAccdetails)
router.route("/avatar").patch(verifyjwt,upload.single("avatar"),updateavatar
)
router.route("/cover-image").patch(verifyjwt,upload.single("coverImage"),updateusercoverimage)
router.route("/c/:username").get(verifyjwt,getuserchannelprofile)
router.route("/history").get(verifyjwt,getwatchhistory)


export default router
