# FixCus

FixCus is a citizen-centric issue reporting and municipal operations platform that connects residents with their local government. It enables citizens to report civic issues (with images, video, geolocation and voice input), lets municipal staff manage and resolve those issues using task assignments and escalations, and provides AI-assisted tools for categorization and feedback summarization.

---

## Table of Contents

* [Key Features](#key-features)
* [User Roles & Dashboards](#user-roles--dashboards)
* [Workflow Overview](#workflow-overview)
* [UI / UX Features](#ui--ux-features)
* [Notifications & Communication](#notifications--communication)
* [Data & Visualizations](#data--visualizations)

---

## Key Features

* **Issue Reporting (Citizen-facing)**

  * Submit textual reports (supports speech-to-text) and attach images/videos.
  * Automatic geocoding of reported location from user input or device GPS.
  * AI-assisted category suggestion while reporting to speed up submission.
  * Option to auto-generate a report using AI (based on images) or create manually.

* **Issue Priority & Aging**

  * Each issue has a priority level that increases automatically if not acted on for a configurable time window (aging/escalation policy).

* **Task Assignment & Staff Management**

  * Municipalities can assign staff (with roles) to issues.
  * Supervisors and coordinators can create and assign tasks to staff.
  * Tasks require updates and proof (photos/notes) and must be approved by the assigner.

* **Escalations**

  * Overdue tasks are escalated automatically: first to Coordinator, then to Supervisor.
  * Supervisors may either act directly or reassign to a Coordinator.

* **Feedback & AI Summaries**

  * After resolution, citizens and staff can submit feedback.
  * AI generates concise feedback summaries from the final supervisor response and collected feedback.

* **Heatmap & Geospatial Tools**

  * All issues are geocoded and visualized on an interactive heatmap for trend analysis and hotspot detection.

* **Timelines & Auditing**

  * Comprehensive timeline tracking every action an issue experiences from creation to closure (assignment, updates, approvals, escalations).

* **Role-specific Dashboards**

  * Each major role (Citizen, Staff, Coordinator, Supervisor, Municipality Admin) has a tailored dashboard showing relevant KPIs and actionable items.

* **Notifications & Email Services**

  * In-app notifications for all major actions (assignment, approval required, escalation, resolution).
  * Optional email notifications for important events (can be toggled per role/event).

---

## User Roles & Dashboards

* **Citizen**: Report issues, attach media, view status, receive notifications, provide feedback.
* **Staff / Field Worker**: Receive tasks, submit updates with proof, request help or approval.
* **Coordinator**: Manage and reassign team tasks, handle escalations from staff.
* **Supervisor**: Oversee coordinators, approve completed tasks, finalize issue resolution and feedback.
* **Municipality Admin**: Configure priorities, escalation rules, manage users, view analytics and heatmaps.

Each role gets a dashboard tuned to their daily needs: pending tasks, overdue items, local heatmap, recent activity, and quick actions.

---

## Workflow Overview

1. **Report**: Citizen creates an issue (manual or AI-assisted) with location and media.
2. **Triage**: AI suggests a category and initial priority. Municipality staff or an automated rule assigns the issue.
3. **Assign**: Supervisor/Coordinator assigns tasks to staff with deadlines and proof requirements.
4. **Work & Update**: Staff work on task, upload proof and status updates.
5. **Approve**: Assigner reviews proof; approves or requests more info.
6. **Escalate**: If overdue, system escalates to Coordinator → Supervisor.
7. **Resolve & Feedback**: Supervisor marks issue resolved. Citizen and staff feedback captured; AI generates a summary.
8. **Visualize & Learn**: Issues appear on the heatmap; analytics drive operational improvements.

---

## UI / UX Features

* Clean, role-specific dashboards.
* Mobile-first responsive design; touch-optimized controls for field staff.
* Timeline view per issue showing a chronological audit trail.
* Heatmap overlay with filters (time range, category, priority).
* Rich issue cards with media previews, quick actions, and status badges.

---



## Data & Visualizations

* **Heatmap**: Aggregated issue density visualized on a map with clustering and zoom-level sensitivity.
* **Analytics dashboards**: KPIs such as average time-to-assign, time-to-resolve, overdue counts, top categories.
* **Export**: CSV / JSON export of issue lists and timeline events for reporting.


