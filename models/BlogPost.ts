import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  author: mongoose.Types.ObjectId;
  categories: mongoose.Types.ObjectId[];
  tags: string[];
  status: 'draft' | 'published';
  publishedAt?: Date;
  viewCount: number;
  likes: number;
  comments: number;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 500,
  },
  featuredImage: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  metaTitle: {
    type: String,
    maxlength: 100,
  },
  metaDescription: {
    type: String,
    maxlength: 200,
  },
}, {
  timestamps: true,
});

// Create slug from title
blogPostSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Add indexes
blogPostSchema.index({ title: 'text', content: 'text' });
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ publishedAt: 1 });
blogPostSchema.index({ isFeatured: 1 });

// Define the model
const BlogPost = mongoose.models?.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema);

export default BlogPost; 