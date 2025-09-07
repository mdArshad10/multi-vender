import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import ejs from 'ejs';
import path from 'node:path';

config({
  path: './.env',
});

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: Number(process.env.NODEMAILER_PORT),
  secure: Number(process.env.NODEMAILER_PORT) === 465 ? true : false, // true for 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_AUTH_USER,
    pass: process.env.NODEMAILER_AUTH_PASSWORD,
  },
});

const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    'apps',
    'auth-service',
    'src',
    'utils',
    'email-templates',
    `${templateName}.ejs`
  );

  return ejs.renderFile(templatePath, data);
};

export const sendMail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>
) => {
  try {
    const html = await renderEmailTemplate(templateName, data);
    transporter.sendMail({
      from: `<${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.log('Error Sending email', error);
    return false;
  }
};
