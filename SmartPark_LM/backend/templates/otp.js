function generateOtp(length, minute){
  let key_otp = ""
  for(let i = 1;i <= length;i++) key_otp += `${Math.floor(Math.random() * 10)}` 

  return {
          otp: key_otp,
          expiresAt: Date.now() + minute * 60 * 1000
        }
}


function otpEmail(otp){
 return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align:center;">
        <tr>
          <td style="padding-bottom:40px; font-size:33px; font-weight:normal; color:#323232;">
            Upark
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:16px; font-size:25px; font-weight:bold; color:#323232;">
            Verification code
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:24px; font-size:40px; font-weight:300; letter-spacing:6px; color:#323232;">
            ${otp}
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:40px; font-size:13px; line-height:21px; color:#323232;">
            Here is your OTP verification code.<br>
            It will expire in 5 minutes.
          </td>
        </tr>

        <tr>
          <td align="left" style="padding-bottom:24px; font-size:13px; line-height:21px; color:#323232;">
            If you didn't request this code, please ignore this email and never share the code with anyone.
          </td>
        </tr>

        <tr>
          <td style="border-top:1px solid #cccccc; padding-top:16px;" align="left">
            <span style="font-size:12px; color:#323232;">Sent by Upark</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>` 
}

module.exports = {otpEmail, generateOtp};