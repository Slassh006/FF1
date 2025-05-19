import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'password_change',
      'password_reset',
      'profile_update',
      'role_change',
      'status_change',
      'settings_update',
    ],
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'user',
      'blog',
      'wallpaper',
      'category',
      'comment',
      'quiz',
      'redeem_code',
      'craftland_map',
      'craftland_code',
      'notification',
      'settings',
    ],
  },
  entityId: {
    type: String,
    required: true,
  },
  details: {
    type: Schema.Types.Mixed,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Define the model
const AuditLog = mongoose.models?.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog; 