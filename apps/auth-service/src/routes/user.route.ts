import express from 'express';
import {
  userRegistration,
  verifyUser,
  userLogin,
  resetUserPassword,
  userForgotPassword,
  verifyUserForgotPassword,
} from '../controllers/user.controller.js';
const router = express.Router();

router.route('/register').post(userRegistration);
router.route('/verify-user').post(verifyUser);
router.route('/login-user').post(userLogin);
router.route('/forgot-password').post(userForgotPassword); //❎
router.route('/verify-forgot-password').post(verifyUserForgotPassword);
router.route('/reset-password').post(resetUserPassword); 

export default router;
