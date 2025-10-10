import Job from "./models/jobQueue.model.js";
import { sendEmail } from "./utils/sendEmail.js";
import {
  generateIssueAssignedEmailTemplate,
  generateIssueCompletedEmailTemplate,
  generateTaskAssignmentEmailTemplate,
  generateTaskEscalationEmailTemplate,
  generateTaskDeadlineReminderEmailTemplate,
} from "./utils/emailTemplates.js";

export const processJobQueue = async () => {
  let job;
  while (true) {
    try {
      // Find a pending job and update its status to 'processing'
      job = await Job.findOneAndUpdate(
        { status: "pending" },
        { status: "processing", $inc: { attempts: 1 } },
        { new: true, sort: { createdAt: 1 } }
      );

      if (!job) {
        return;
      }
      switch (job.type) {
        case "Issue_Assigned_Email": {
          const { email, staffName, issueTitle } = job.payload;
          const emailBody = generateIssueAssignedEmailTemplate(
            staffName,
            issueTitle
          );
          await sendEmail({
            email: email,
            subject: "New Issue Assigned",
            message: emailBody,
          });
          break;
        }

        case "Issue_Completed_Email": {
          const { email, staffName, issueTitle } = job.payload;
          const emailBody = generateIssueCompletedEmailTemplate(
            staffName,
            issueTitle
          );
          await sendEmail({
            email: email,
            subject: "Issue Completed",
            message: emailBody,
          });
          break;
        }

        case "Task_Assigned_Email": {
          const { email, staffName, issueTitle } = job.payload;
          const emailBody = generateTaskAssignmentEmailTemplate(
            staffName,
            issueTitle
          );
          await sendEmail({
            email: email,
            subject: "New Task Assigned",
            message: emailBody,
          });
          break;
        }

        case "Task_Escalated_Email": {
          const { email, staffName, issueTitle, message } = job.payload;
          const emailBody = generateTaskEscalationEmailTemplate(
            staffName,
            issueTitle,
            message
          );
          await sendEmail({
            email: email,
            subject: "Task Escalation Notification",
            message: emailBody,
          });
          break;
        }

        case "Task_Deadline_Reminder_Email": {
          const { email, staffName, issueTitle, deadline, timeLeft } =
            job.payload;
          const emailBody = generateTaskDeadlineReminderEmailTemplate(
            staffName,
            issueTitle,
            new Date(deadline),
            timeLeft
          );
          await sendEmail({
            email: email,
            subject: "Task Deadline Reminder",
            message: emailBody,
          });
          break;
        }

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = "completed";
      await job.save();
      console.log(`Job ${job._id} completed successfully.`);
    } catch (error) {
      if (job) {
        console.error(`Job ${job._id} failed:`, error);
        job.status = "failed";
        job.lastError = error.message;
        await job.save();
      } else {
        console.error("Job processing failed:", error);
      }
    }
  }
};
