const getRegistrationEmailBody = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Finance Management System</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Finance Management System</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Welcome aboard! Your account has been successfully created in the Finance Management System.</p>
        <p>You can now:</p>
        <ul>
          <li>Track your income and expenses</li>
          <li>View detailed financial reports</li>
          <li>Set financial goals and track progress</li>
          <li>Request edits or deletions for your records</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

const getAccountStatusChangeEmailBody = (userName, newStatus) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Status Updated</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .status-active {
          color: #28a745;
          font-weight: bold;
        }
        .status-inactive {
          color: #dc3545;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Account Status Updated</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Your account status has been updated.</p>
        <p>New Status: <span class="status-${newStatus.toLowerCase()}">${newStatus}</span></p>
        ${newStatus === 'Active' ? 
          '<p>Your account is now active and you can access all features of the system.</p>' :
          '<p>Your account has been deactivated. Please contact support for more information.</p>'
        }
        <p>If you have any questions or concerns, please contact our support team.</p>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

const getEditRequestApprovedEmailBody = (userName, recordId) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Edit Request Approved</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .success {
          color: #28a745;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Edit Request Approved</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Your edit request for financial record <strong>#${recordId}</strong> has been <span class="success">approved</span>.</p>
        <p>The requested changes have been applied to your record.</p>
        <p>You can view the updated record in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

const getEditRequestRejectedEmailBody = (userName, recordId, adminNotes) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Edit Request Rejected</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .rejected {
          color: #dc3545;
          font-weight: bold;
        }
        .admin-notes {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Edit Request Rejected</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Your edit request for financial record <strong>#${recordId}</strong> has been <span class="rejected">rejected</span>.</p>
        ${adminNotes ? `
          <div class="admin-notes">
            <strong>Admin Notes:</strong><br>
            ${adminNotes}
          </div>
        ` : ''}
        <p>If you have any questions about this decision, please contact our support team.</p>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

const getDeleteRequestApprovedEmailBody = (userName, recordId) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Delete Request Approved</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .success {
          color: #28a745;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Delete Request Approved</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Your delete request for financial record <strong>#${recordId}</strong> has been <span class="success">approved</span>.</p>
        <p>The record has been permanently removed from your account.</p>
        <p>You can view your remaining records in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

const getDeleteRequestRejectedEmailBody = (userName, recordId, adminNotes) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Delete Request Rejected</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .rejected {
          color: #dc3545;
          font-weight: bold;
        }
        .admin-notes {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Delete Request Rejected</h1>
      </div>
      <div class="content">
        <h2>Hello ${userName},</h2>
        <p>Your delete request for financial record <strong>#${recordId}</strong> has been <span class="rejected">rejected</span>.</p>
        <p>The record remains active in your account.</p>
        ${adminNotes ? `
          <div class="admin-notes">
            <strong>Admin Notes:</strong><br>
            ${adminNotes}
          </div>
        ` : ''}
        <p>If you have any questions about this decision, please contact our support team.</p>
        <p>Best regards,<br>Finance Management Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getRegistrationEmailBody,
  getAccountStatusChangeEmailBody,
  getEditRequestApprovedEmailBody,
  getEditRequestRejectedEmailBody,
  getDeleteRequestApprovedEmailBody,
  getDeleteRequestRejectedEmailBody
};
