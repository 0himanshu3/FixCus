import e from "express";

export function generateVerificationOtpEmailTemplate(otpCode){
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">

    <h2 style="color: #fff; text-align: center;">Verify Your Email Address</h2>

    <p style="font-size: 16px; color: #ccc;">Dear User,</p>

    <p style="font-size: 16px; color: #ccc;">To complete your registration or login, please use the following verification code:</p>

    <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #000; padding: 10px 20px; border: 1px solid #fff; border-radius: 5px; background-color: #fff;">
            ${otpCode}
        </span>
    </div>

    <p style="font-size: 16px; color: #ccc;">This code is valid for 15 minutes. Please do not share this code with anyone.</p>

    <p style="font-size: 16px; color: #ccc;">If you did not request this email, please ignore it.</p>

    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>

</div>`
}


export function generateForgotPasswordEmailTemplate(resetPasswordUrl){
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">Reset Your Password</h2>
    <p style="font-size: 16px; color: #ccc;">Dear User,</p>
    <p style="font-size: 16px; color: #ccc;">You requested to reset your password. Please click the button below to proceed:</p>
    <div style="text-align: center; margin: 20px 0;">
        <a href="${resetPasswordUrl}" style="display: inline-block; font-size: 16px; font-weight: bold; color: #000; text-decoration: none; padding: 12px 20px; border: 1px solid #fff; border-radius: 5px; background-color: #fff;">
            Reset Password
        </a>
    </div>
    <p style="font-size: 16px; color: #ccc;">If you did not request this, please ignore this email. The link will expire in 10 minutes.</p>
    <p style="font-size: 16px; color: #ccc;">If the button above doesn't work, copy and paste the following URL into your browser:</p>
    <p style="font-size: 16px; color: #fff; word-wrap: break-word;">${resetPasswordUrl}</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`
}

export function generateOrganizerApprovalEmailTemplate(organizerName, organizerEmail) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">

    <h2 style="color: #fff; text-align: center;">Organizer Approval Request</h2>

    <p style="font-size: 16px; color: #ccc;">Dear Admin,</p>

    <p style="font-size: 16px; color: #ccc;">A new organizer has requested approval to join the platform. Below are the details:</p>

    <div style="margin: 20px 0; padding: 15px; border: 1px solid #fff; border-radius: 5px; background-color: #111;">
        <p style="font-size: 16px; color: #fff;"><strong>Name:</strong> ${organizerName}</p>
        <p style="font-size: 16px; color: #fff;"><strong>Email:</strong> ${organizerEmail}</p>
    </div>

    <p style="font-size: 16px; color: #ccc;">Please review and take the necessary action.</p>

    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>

</div>`
}




export function generateIssueAssignedEmailTemplate(staffName, issueTitle) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">New Issue Assigned</h2>
    <p style="font-size: 16px; color: #ccc;">Dear ${staffName},</p>
    <p style="font-size: 16px; color: #ccc;">You have been assigned a new issue: <strong>${issueTitle}</strong>.</p>
    <p style="font-size: 16px; color: #ccc;">Please take the necessary actions to address this issue.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`;
}

export function generateIssueCompletedEmailTemplate(citizenName, issueTitle) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">Issue Resolved</h2>
    <p style="font-size: 16px; color: #ccc;">Dear ${citizenName},</p>
    <p style="font-size: 16px; color: #ccc;">We are pleased to inform you that your reported issue: <strong>${issueTitle}</strong> has been resolved.</p>
    <p style="font-size: 16px; color: #ccc;">Thank you for bringing this to our attention. If you have any further concerns, please do not hesitate to contact us.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`;
}

export function generateTaskEscalationEmailTemplate(issueTitle, msg) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">Task Escalation Notification</h2>
    <p style="font-size: 16px; color: #ccc;">Dear Team,</p>
    <p style="font-size: 16px; color: #ccc;">The following issue has been escalated: <strong>${issueTitle}</strong>.</p>
    <p style="font-size: 16px; color: #ccc;">Escalation Message: ${msg}</p>
    <p style="font-size: 16px; color: #ccc;">Please take the necessary actions to address this issue.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`;
}

export function generateTaskAssignmentEmailTemplate(issueTitle, assigneeName) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">New Task Assigned</h2>
    <p style="font-size: 16px; color: #ccc;">Dear ${assigneeName},</p>
    <p style="font-size: 16px; color: #ccc;">You have been assigned a new task related to the issue: <strong>${issueTitle}</strong>.</p>
    <p style="font-size: 16px; color: #ccc;">Please log in to your account to view the task details and take the necessary actions.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`;
}

export function generateTaskDeadlineReminderEmailTemplate(issueTitle, assigneeName, deadline, timeLeft) {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
    <h2 style="color: #fff; text-align: center;">Task Deadline Reminder</h2>
    <p style="font-size: 16px; color: #ccc;">Dear ${assigneeName},</p>
    <p style="font-size: 16px; color: #ccc;">This is a reminder that the task related to the issue: <strong>${issueTitle}</strong> is due on <strong>${new Date(deadline).toLocaleString()}</strong>.</p>
    <p style="font-size: 16px; color: #ccc;">Time left to complete the task: <strong>${timeLeft}</strong>.</p>
    <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br>FixCus Team</p>
        <p style="font-size: 12px; color: #444;">This is an automated message. Please do not reply to this email.</p>
    </footer>
</div>`;
}

