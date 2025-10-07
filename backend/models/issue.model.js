import mongoose from "mongoose";

// Updated categories
const issueCategories = [
    "Road damage",
    "Waterlogging / Drainage Issues",
    "Improper Waste Management",
    "Street lights/Exposed Wires",
    "Unauthorized loudspeakers",
    "Burning of garbage",
    "Encroachment / Illegal Construction",
    "Damaged Public Property",
    "Stray Animal Menace",
    "General Issue"
  ];

const priorityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];

// Comment sub-schema
const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Assigned staff sub-schema
const AssignedStaffSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["Supervisor", "Worker", "Coordinator"],
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true }
);

// Main Issue schema
const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: issueCategories, required: true },
    slug: { type: String, unique: true },
    priority: { type: String, enum: priorityLevels, default: "Very Low" },
    content: { type: String },
    images: [{ type: String }],
    videos: [{ type: String }],
    issueLocation: { type: String, required: true },
    issueDistrict: { type: String },
    issueState: { type: String },
    issueCountry: { type: String },
    issuePublishDate: { type: Date, required: true },

    staffsAssigned: [AssignedStaffSchema],

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],

    issueTakenUpBy: { type: mongoose.Schema.Types.ObjectId, ref: "Municipality" },
    issueTakenUpTime:{type: Date},
    deadline: { type: Date },

    // ✅ Newly added fields
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    resolutionReport: { type: mongoose.Schema.Types.ObjectId, ref: "ResolutionReport" },
  },
  { timestamps: true }
);

// Pre-validate hook to create slug
IssueSchema.pre("validate", function (next) {
  if (this.title) {
    this.slug = this.title
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, "");
  }
  next();
});

// Virtual priority based on weeks passed
IssueSchema.virtual("calculatedPriority").get(function () {
  const weeksPassed = Math.floor(
    (Date.now() - new Date(this.issuePublishDate)) / (7 * 24 * 60 * 60 * 1000)
  );
  const index = Math.min(weeksPassed, priorityLevels.length - 1);
  return priorityLevels[index];
});

// Virtual counts for convenience
IssueSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});

IssueSchema.virtual("downvoteCount").get(function () {
  return this.downvotes.length;
});

IssueSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Include virtuals in JSON/Objects
IssueSchema.set("toJSON", { virtuals: true });
IssueSchema.set("toObject", { virtuals: true });

export default mongoose.model("Issue", IssueSchema);
