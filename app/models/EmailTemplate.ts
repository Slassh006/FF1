import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;        // Internal name for the template
  subject: string;     // Email subject line template
  body: string;        // Email body template (HTML or text)
  createdBy: mongoose.Types.ObjectId; // Admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Ensure template names are unique
    maxLength: 100,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255,
  },
  body: {
    type: String,
    required: true,
    // Consider validation for HTML or template syntax if applicable
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
}, { timestamps: true });

// Index for finding templates by name
EmailTemplateSchema.index({ name: 1 });

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema); 