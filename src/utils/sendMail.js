const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const sendMail = async (to, message, url) => {
    //TODO: use OAuth2

    const transporter = nodemailer.createTransport(
        smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    );

    const mailOptions = {
        from: `${process.env.EMAIL_SENDER}`,
        to: to,
        subject: `${process.env.APP_NAME}`,
        html: `
            <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
            <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the ${process.env.APP_NAME}.</h2>
            <p>Congratulations! You're almost set to start using ${process.env.APP_NAME}.
                Just click the button below to validate your email address.
            </p>
            
            <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${message}</a>
        
            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
        
            <div>${url}</div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(`[SENDING MAIL] Error: ${err}`);
        } else {
            console.log(`[SENDING MAIL] Sent: ${info.response}`);
        }
    });
};

module.exports = sendMail;
