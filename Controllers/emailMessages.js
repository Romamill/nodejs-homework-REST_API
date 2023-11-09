module.exports = {
  verification: (verificationLink) => ({
    to: RECEIVER_EMAIL,
    from: process.env.SENDER_EMAIL,
    subject: 'Email Verification',
    text: `Click on the link to verify your email: ${verificationLink}`,
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`,
  }),
};