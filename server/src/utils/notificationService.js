const Candidate = require('../models/Candidate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmailSafely } = require('./mailer');

const notifyProjectAssigned = async ({ assignment, task, assignedBy }) => {
  let candidateObj = null;
  let candidateId = null;

  if (assignment.candidate && typeof assignment.candidate === 'object' && assignment.candidate._id) {
    candidateObj = assignment.candidate;
    candidateId = assignment.candidate._id;
  } else if (assignment.candidate) {
    candidateId = assignment.candidate;
    candidateObj = await Candidate.findById(candidateId);
  }

  // Find linked User accounts for in-app notifications and email delivery
  const userQuery = [];
  if (candidateId) {
    userQuery.push({ candidateId });
  }
  if (candidateObj?.email) {
    userQuery.push({ email: candidateObj.email.toLowerCase().trim() });
  }

  const recipientUsers = userQuery.length > 0
    ? await User.find({ $or: userQuery }).select('name email')
    : [];

  const recipientName = candidateObj?.name || (recipientUsers.length > 0 ? recipientUsers[0].name : 'Employee');

  const deadlineFormatted = assignment.deadline
    ? new Date(assignment.deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not specified';

  // Plain-text formatted content matching exact structure
  let textMessage = `Hello ${recipientName},\n\nA new task has been assigned to you.\n\nTask Title:\n${task.title}\n\nDetailed Description & Acceptance Criteria:\n${task.description}\n\nTask Deadline:\n${deadlineFormatted}\n`;

  if (assignment.notes && assignment.notes.trim()) {
    textMessage += `\nAssignment Notes / References:\n${assignment.notes.trim()}\n`;
  }

  textMessage += `\nPlease review the task and complete it before the specified deadline.\n\nRegards,\n${assignedBy?.name || 'Administration'}`;

  const inAppMessage = `Task: ${task.title}\nDescription: ${task.description}\nDeadline: ${deadlineFormatted}${assignment.notes ? `\nNotes: ${assignment.notes}` : ''}\nAssigned by: ${assignedBy?.name || 'Administration'}`;

  // In-app notifications
  if (recipientUsers.length > 0) {
    await Notification.insertMany(
      recipientUsers.map((recipient) => ({
        recipient: recipient._id,
        title: `New Task Assigned - ${task.title}`,
        message: inAppMessage,
        type: 'PROJECT_ASSIGNED',
        relatedAssignment: assignment._id,
      }))
    );
  }

  // Deduplicate email recipients
  const emailSet = new Set();
  if (candidateObj?.email) {
    emailSet.add(candidateObj.email.toLowerCase().trim());
  }
  recipientUsers.forEach((u) => {
    if (u.email) {
      emailSet.add(u.email.toLowerCase().trim());
    }
  });

  const emailsToSend = Array.from(emailSet).filter(Boolean);
  if (!emailsToSend.length) {
    console.log('[Notification] No recipient email found for candidate:', candidateId);
    return;
  }

  console.log('Assignment created successfully');
  console.log('Sending assignment email...');
  console.log(`Recipients: ${emailsToSend.join(', ')}`);

  const htmlMessage = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">New Task Assigned</h2>
      </div>
      <div style="padding: 24px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">Hello <strong>${recipientName}</strong>,</p>
        <p style="color: #475569; font-size: 14px;">A new task has been assigned to you.</p>

        <div style="margin: 18px 0;">
          <strong style="color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Task Title:</strong>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${task.title}</div>
        </div>

        <div style="margin: 18px 0;">
          <strong style="color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Detailed Description & Acceptance Criteria:</strong>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 14px; font-size: 14px; color: #334155; white-space: pre-wrap;">${task.description}</div>
        </div>

        <div style="margin: 18px 0;">
          <strong style="color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Task Deadline:</strong>
          <div style="font-size: 15px; font-weight: 600; color: #dc2626;">${deadlineFormatted}</div>
        </div>

        ${
          assignment.notes && assignment.notes.trim()
            ? `<div style="margin: 18px 0;">
                <strong style="color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Assignment Notes / References:</strong>
                <div style="background-color: #f8fafc; border-left: 4px solid #64748b; border-radius: 4px; padding: 14px; font-size: 14px; color: #334155; white-space: pre-wrap;">${assignment.notes.trim()}</div>
              </div>`
            : ''
        }

        <p style="margin-top: 20px; font-size: 14px; color: #475569;">Please review the task and complete it before the specified deadline.</p>

        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
          Regards,<br />
          <strong style="color: #334155;">${assignedBy?.name || 'Administration'}</strong>
        </div>
      </div>
    </div>
  `;

  try {
    const results = await Promise.all(
      emailsToSend.map((email) =>
        sendEmailSafely({
          to: email,
          subject: `New Task Assigned - ${task.title}`,
          text: textMessage,
          html: htmlMessage,
        })
      )
    );

    if (results.every(Boolean)) {
      console.log('Assignment email sent successfully');
    }
  } catch (err) {
    console.error('Email sending failed:', err.message);
  }
};

const notifyProjectSubmitted = async ({ submission, assignment, task, candidate }) => {
  const admins = await User.find({ role: 'ADMIN' }).select('name email');
  if (!admins.length) return;

  const submittedAt = new Date(submission.submittedAt).toLocaleString();
  const message = `Employee: ${candidate.name}\nEmployee email: ${candidate.email}\nProject: ${task.title}\nSubmitted: ${submittedAt}\nStatus: ${submission.status}\nSubmission information: ${submission.submissionText}${submission.attachmentUrl ? `\nAttachment: ${submission.attachmentUrl}` : ''}`;

  await Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin._id,
      title: 'Project Submitted',
      message,
      type: 'PROJECT_SUBMITTED',
      relatedAssignment: assignment._id,
    }))
  );

  await Promise.all(
    admins.map((admin) =>
      sendEmailSafely({
        to: admin.email,
        subject: `Project Submitted: ${task.title}`,
        text: message,
      })
    )
  );
};

module.exports = { notifyProjectAssigned, notifyProjectSubmitted };