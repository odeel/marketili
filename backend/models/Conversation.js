const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },
    participants: [
      {
        participantType: {
          type: String,
          enum: ["Client", "Agency", "Freelancer", "Team"],
        },
        participantId: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
