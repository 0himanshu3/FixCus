import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        // Link to the specific issue this feedback is for
        issue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Issue",
            required: true,
            index: true,
        },
        // Link to the user who submitted the feedback
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Section 1: Resolution Experience
        resolved: {
            type: String,
            enum: ["Yes", "Partially", "No"],
            required: [true, "Resolution status is required."],
        },
        resolutionTime: {
            type: String,
            enum: ["Very fast", "Acceptable", "Too slow", "Still pending"],
        },
        resolutionQuality: {
            type: String,
            enum: ["Fully satisfactory", "Partially satisfactory", "Unsatisfactory"],
        },
        staffProfessionalism: {
            type: String,
            enum: ["Yes", "No"],
        },

        // Section 2: Citizen Satisfaction
        satisfactionRating: {
            type: Number,
            min: 1,
            max: 5,
            required: [true, "Overall satisfaction rating is required."],
        },
        takenSeriously: {
            type: String,
            enum: ["Yes", "No", "To some extent"],
        },
        clearCommunication: {
            type: String,
            enum: ["Yes", "No"],
        },
        suggestions: {
            type: String,
            trim: true,
        },

        // Section 3: Transparency & Trust
        futureTrust: {
            type: String,
            enum: ["Yes", "No", "Not sure"],
        },
        useSystemAgain: {
            type: String,
            enum: ["Yes", "No"],
        },

        // Section 4: Additional Feedback
        additionalComments: {
            type: String,
            trim: true,
        },
        photos: [
            {
                type: String, // Array of image URLs from Firebase
            },
        ],
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
