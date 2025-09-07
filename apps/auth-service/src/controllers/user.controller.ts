import { Request, Response, NextFunction } from 'express';
import { prisma } from '@multi-venden/database';
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRestrictions,
  verifyOtp,
} from '../utils/auth.helper.js';
import {
  ApiResponse,
  AuthError,
  ValidationError,
} from '@multi-venden/backend-utils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie } from '../utils/setCookies/setCookies.js';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRETE_KEY!, {
//   apiVersion: '2025-08-27.basil',
// });

const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // i validata user input in router level
  try {
    const { name, email } = req.body;

    const existingEmail = await prisma.users.findUnique({ where: { email } });
    if (existingEmail) {
      throw next(new ValidationError('user already exist with this email'));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRestrictions(email, next);
    await sendOtp(name, email, 'user-activation-mail');
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'OTP send to the email. please verify your account'
        )
      );
  } catch (error) {
    return next(error);
  }
};

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password, name } = req.body;

    const existingEmail = await prisma.users.findUnique({ where: { email } });
    if (existingEmail) {
      throw next(new ValidationError('user already exist with this email'));
    }

    await verifyOtp(otp, email, next);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      omit: {
        password: true,
      },
    });
    res
      .status(201)
      .json(new ApiResponse(201, 'user is login successfully', user));
  } catch (error) {
    return next(error);
  }
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new AuthError("User doesn't exists!"));
    }

    const isMatchPassword = await bcrypt.compare(password, user.password ?? '');
    if (!isMatchPassword) {
      return next(new AuthError('Invalid email or password'));
    }

    const refreshToken = jwt.sign(
      { id: user.id, role: 'user' },
      process.env.REFRESH_TOKEN as string,
      {
        expiresIn: '30m',
      }
    );
    const accessToken = await jwt.sign(
      { id: user.id, role: 'user' },
      process.env.ACCESS_TOKEN as string,
      {
        expiresIn: '7d',
      }
    );

    setCookie(res, 'ACCESS_TOKEN', accessToken);
    setCookie(res, 'REFRESH_TOKEN', refreshToken);

    const data = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    res.status(200).json(new ApiResponse(200, 'Login Successfully', data));
  } catch (error) {
    return next(error);
  }
};

const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await handleForgotPassword(req, res, next, 'user');
  } catch (error) {
    return next(error);
  }
};

const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    await verifyOtp(otp, email, next);

    res
      .status(200)
      .json(
        new ApiResponse(200, 'OTP verify. You can now reset your password')
      );
  } catch (error) {
    return next(error);
  }
};

const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new ValidationError(`user not found`));
    }

    const isCompareWithOld = await bcrypt.compare(newPassword, user.password!);
    if (isCompareWithOld) {
      return next(
        new ValidationError('new Password cannot be same as the old password')
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });
    res.status(200).json(new ApiResponse(200, 'Password reset successfully'));
  } catch (error) {
    return next(error);
  }
};

const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email } = req.body;
    // const existingSeller = await prisma.sellers.findUnique({
    //   where: {
    //     email,
    //   },
    // });
    const existingSeller = null;
    if (existingSeller) {
      throw next(new ValidationError('seller already exist with this email'));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRestrictions(email, next);
    await sendOtp(name, email, 'seller-activation');
    res
      .status(200)
      .json(
        new ApiResponse(200, 'OTP send to email. please verify your account')
      );
  } catch (error) {
    return next(error);
  }
};

// const verifySeller = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { email, otp, name, password, phoneNumber, country } = req.body;

//     // const existingUser = await prisma.sellers.findUnique({ where: { email } });
//     const existingUser = null;
//     if (!existingUser) {
//       throw next(new ValidationError('seller already exist with this email'));
//     }
//     await verifyOtp(otp, email, next);
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = null;
//     // const newUser = await prisma.sellers.create({
//     //   data: {
//     //     email,
//     //     password: hashedPassword,
//     //     name,
//     //     phone_number: phoneNumber,
//     //     country,
//     //   },
//     //   omit: {
//     //     password: true,
//     //   },
//     // });
//     return newUser;
//   } catch (error) {
//     return next(error);
//   }
// };

// const createShop = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, bio, category, address, opening_hours, sellerId } = req.body;

//     const shopData = {
//       name,
//       bio,
//       category,
//       address,
//       opening_hours,
//       sellerId,
//     };

//     // if (website && website.trim() !== '') {
//     //   shopData.website = website;
//     // }

//     const shop = null;
//     // const shop = await prisma.shops.create({
//     //   data: shopData,
//     // });

//     res
//       .status(201)
//       .json(new ApiResponse(201, 'new shop is created successfully', shop));
//   } catch (error) {
//     return next(error);
//   }
// };

// const createStripAccountLink = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { sellerId } = req.body;

//     // const seller = await prisma.sellers.findUnique({ data: { id: sellerId } });
//     const seller = null;
//     if (!seller) {
//       throw next(new ValidationError('seller is not exist'));
//     }
//     const stripeAccount = await stripe.accounts.create({
//       type: 'express',
//       // email: seller.email,
//       email: '',
//       country: 'IN',
//       capabilities: {
//         card_payments: { requested: true },
//         transfers: { requested: true },
//       },
//     });

//     // await prisma.sellers.update({
//     //   where: { id: sellerId },
//     //   data: { stripeId: stripeAccount.id },
//     // });
//     const generateAccountLink = await stripe.accountLinks.create({
//       account: stripeAccount.id,
//       refresh_url: '',
//       return_url: '',
//       type: 'account_onboarding',
//     });

//     res.status(200).json(
//       new ApiResponse(200, 'Generated the account link', {
//         url: generateAccountLink.url,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

const sellerLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //code
  } catch (error) {
    return next(error);
  }
};

export {
  userRegistration,
  verifyUser,
  userLogin,
  userForgotPassword,
  resetUserPassword,
  verifyUserForgotPassword,
  registerSeller,
  // verifySeller,
  // createShop,
  // createStripAccountLink,
  sellerLogin,
};
