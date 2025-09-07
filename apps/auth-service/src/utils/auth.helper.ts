import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { sendMail } from './sendMail/index.js';
import { prisma } from '@multi-venden/database';
import {
  ApiResponse,
  ValidationError,
  redis,
} from '@multi-venden/backend-utils';

const checkOtpRestrictions = async (email: string, next: NextFunction) => {
  try {
    if (await redis.get(`otp_lock:${email}`)) {
      return next(
        new ValidationError(
          'Account locked due to multiple failed attempts! Try again after 30 minutes'
        )
      );
    }
    if (await redis.get(`otp_span_lock:${email}`)) {
      return next(
        new ValidationError(
          'Too many OTP request! Please wait 1hour before requesting again'
        )
      );
    }
    if (await redis.get(`otp_cooldown:${email}`)) {
      return next(
        new ValidationError('Please wait 1 minutes before requesting a new OTP')
      );
    }
  } catch (error) {
    console.log('The error on check Otp Restriction', error);
  }
};

const trackOtpRestrictions = async (email: string, next: NextFunction) => {
  try {
    const otpRequestKey = `otp_request_count:${email}`;
    const otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');
    if (otpRequests >= 2) {
      await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
      return next(
        new ValidationError(
          'Too many OTP. Please wait 1 hour before requesting again'
        )
      );
    }
    await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600);
  } catch (error) {
    console.log('Error on track OTP restrictions', error);
  }
};

const sendOtp = async (name: string, email: string, template: string) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendMail(email, 'Verify the Email', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60);
};

const verifyOtp = async (otp: string, email: string, next: NextFunction) => {
  try {
    const savedOtp = await redis.get(`otp:${email}`);
    if (!savedOtp) {
      return next(new ValidationError('Invalid or expire Otp'));
    }
    const failedAttemptsKey = `opt_attempts:${email}`;
    const failedAttempts = parseInt(
      (await redis.get(failedAttemptsKey)) || '0'
    );
    if (otp !== savedOtp) {
      if (failedAttempts >= 2) {
        await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800);
        await redis.del(`otp:${email}`, failedAttemptsKey);
        return next(
          new ValidationError(
            'Too many Failed attempts, your account is locked for 30 minutes'
          )
        );
      } else {
        await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 300);
        return next(
          new ValidationError(
            `Incorrect Otp. ${2 - failedAttempts} attempts left.`
          )
        );
      }
    }
    await redis.del(`otp:${email}`, failedAttemptsKey);
  } catch (error) {
    console.log('Error on track OTP restrictions', error);
  }
};

const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
) => {
  try {
    const { email } = req.body;
    const user =
      userType == 'user'
        ? await prisma.users.findUnique({ where: { email } })
        // : await prisma.sellers.findUnique({ where: { email } });
        :null;
    if (!user) {
      return next(new ValidationError(`${userType} not found!`));
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRestrictions(email, next);

    await sendOtp(
      user.name,
      email,
      userType == 'user'
        ? 'forgot password user mail'
        : 'forgot password seller mail'
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, 'OTP send to email. please verify your account')
      );
  } catch (error) {
    return next(error);
  }
};

export {
  checkOtpRestrictions,
  trackOtpRestrictions,
  sendOtp,
  verifyOtp,
  handleForgotPassword,
};
