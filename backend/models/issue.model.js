import mongoose from "mongoose";

//change these categories

const issueCategories = [
  "Education & Skill Development",
  "Sports & Cultural Events",
  "Health & Well-being",
  "Women Empowerment",
  "Environmental Sustainability",
  "Social Inclusion & Awareness"
];

const priorityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];

// Main event schema
const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, enum: issueCategories, required: true },
    slug: { type: String, unique: true },
    // Default lowest priority
    priority: { type: String, enum: priorityLevels, default: "Very Low" },
    content: { type: String },
    image: { type: String },
    issueLocation: { type: String, required: true },
    issuePublishDate: { type: Date, required: true },
    staffsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
    donation: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-validate hook to create a slug from the title
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

// Virtual priority calculation based on weeks passed
IssueSchema.virtual("calculatedPriority").get(function () {
  const weeksPassed = Math.floor(
    (Date.now() - new Date(this.issuePublishDate)) / (7 * 24 * 60 * 60 * 1000)
  );
  
  // Clamp priority within available levels
  const index = Math.min(weeksPassed, priorityLevels.length - 1);
  return priorityLevels[index];
});

// Ensure virtuals are included when converting to JSON/Objects
IssueSchema.set("toJSON", { virtuals: true });
IssueSchema.set("toObject", { virtuals: true });

export default mongoose.model("Issue", IssueSchema);
