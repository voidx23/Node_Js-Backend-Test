const express = require('express');
const { sendOtp, verifyOtp, signup, login, resendOtp  } = require('../controllers/authController');

const router = express.Router();

router.post('/send-otp', sendOtp);      
router.post('/verify-otp', verifyOtp);  
router.post('/signup', signup);         
router.post('/login', login);           
router.post('/resend-otp', resendOtp);  

module.exports = router;
