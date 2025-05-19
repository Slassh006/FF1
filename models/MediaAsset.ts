import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMediaAsset extends Document {
  _id: Types.ObjectId;
  gridfs_id_original: Types.ObjectId; // Link to original file in GridFS
  gridfs_id_compressed?: Types.ObjectId; // Link to compressed version
  gridfs_id_edited?: Types.ObjectId;   // Link to edited version
  filename_original: string;
  tags: string[];
  uploaderId?: Types.ObjectId; // Link to User model
  uploaderName?: string; // Denormalized for easier display
  uploaderEmail?: string; // Denormalized
  uploaderRole?: string; // Denormalized
  size_original?: number;
  size_compressed?: number;
  resolution?: string; // e.g., "1920x1080"
  mimeType: string;
  type: 'admin' | 'profile' | 'wallpaper' | 'other'; // Source/type of upload
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    gridfs_id_original: { type: Schema.Types.ObjectId, required: true, ref: 'fs.files' }, // Ref GridFS files collection
    gridfs_id_compressed: { type: Schema.Types.ObjectId, ref: 'fs.files' },
    gridfs_id_edited: { type: Schema.Types.ObjectId, ref: 'fs.files' },
    filename_original: { type: String, required: true },
    tags: [String],
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference the User model
    uploaderName: String,
    uploaderEmail: String,
    uploaderRole: String,
    size_original: Number,
    size_compressed: Number,
    resolution: String,
    mimeType: { type: String, required: true },
    type: {
      type: String,
      enum: ['admin', 'profile', 'wallpaper', 'other'],
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Add indexes for common query patterns
MediaAssetSchema.index({ type: 1 });
MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ uploaderId: 1 });

export default mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema); 