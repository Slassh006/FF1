import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminMailLog extends Document {
  adminUserId: mongoose.Types.ObjectId; // Admin who sent the mail
  subject: string;
  recipientType: 'all' | 'specific';
  recipientIds?: mongoose.Types.ObjectId[]; // Store IDs if specific
  status: 'success' | 'failed' | 'processing' | 'partial_success';
  errorMessage?: string; // Store error if failed
  sentAt: Date;
  templateUsed?: mongoose.Types.ObjectId; // Optional link to template
  // Consider storing a snapshot of the body for logging?
}

const AdminMailLogSchema = new Schema({
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming admins are also Users
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['all', 'specific'],
  },
  recipientIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'processing', 'partial_success'],
    index: true,
  },
  errorMessage: String,
  templateUsed: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate'
  }
}, { timestamps: { createdAt: 'sentAt', updatedAt: false } });

// Index for querying logs by admin
AdminMailLogSchema.index({ adminUserId: 1 });

export default mongoose.models.AdminMailLog || mongoose.model<IAdminMailLog>('AdminMailLog', AdminMailLogSchema); 