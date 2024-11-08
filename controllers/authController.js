const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const User = require('../models/User');
const sendOtpByEmail = require('../utils/mailer');
const otpGenerator = require('otp-generator');
require('dotenv').config();

function generateOTP() {
    return otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
}

exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        
        const user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        let otpRecord = await Otp.findOne({ email });
        const now = new Date();

        if (otpRecord && otpRecord.expiresAt > now) {
            return res.status(200).json({ message: 'OTP already sent, still valid.' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(now.getTime() + 5 * 60000); // OTP expires in 5 minutes

        if (otpRecord) {
            await Otp.findByIdAndUpdate(otpRecord._id, { otp, expiresAt });
        } else {
            await new Otp({ email, otp, expiresAt }).save();
        }

        sendOtpByEmail(email, otp);
        res.status(200).json({ message: 'OTP sent to email', otp });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};



exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    
    if (!email) return res.status(400).json({ message: 'Email is required' });

    
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    
    let otpRecord = await Otp.findOne({ email });
    const now = new Date();

    if (otpRecord && otpRecord.expiresAt > now) {
     
      sendOtpByEmail(email, otpRecord.otp);
      return res.status(200).json({ message: 'OTP has been resent to your email. It is still valid.', otp: otpRecord.otp });
    }

    
    const otp = generateOTP();
    const expiresAt = new Date(now.getTime() + 2 * 60000); 

    if (otpRecord) {
     
      await Otp.findByIdAndUpdate(otpRecord._id, { otp, expiresAt });
    } else {
      
      await new Otp({ email, otp, expiresAt }).save();
    }

    
    sendOtpByEmail(email, otp);
    return res.status(200).json({ message: 'New OTP has been sent to your email.', otp });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const otpRecord = await Otp.findOne({ email });
        const now = new Date();

        if (!otpRecord) return res.status(400).json({ message: 'OTP not found' });
        if (otpRecord.expiresAt < now) return res.status(400).json({ message: 'OTP expired' });
        if (otpRecord.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        res.status(200).json({ message: 'OTP verified' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


exports.signup = async (req, res) => {
    const { name, email, password, otp } = req.body;

    try {
        const otpRecord = await Otp.findOne({ email });
        const now = new Date();

        if (!otpRecord || otpRecord.expiresAt < now || otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

       
        await Otp.findOneAndDelete({ email });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: newUser });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, user });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
