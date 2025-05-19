import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  likes: number;
  isEdited: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  likes: {
    type: Number,
    default: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes
commentSchema.index({ user: 1 });
commentSchema.index({ post: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ isActive: 1 });
commentSchema.index({ createdAt: -1 });

// Define the model
const Comment = mongoose.models?.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment; 