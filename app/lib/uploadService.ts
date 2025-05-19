import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { uploadFile } from './gridfs';
import { FileType, UploadConfig, UploadResult, UploadError, DEFAULT_CONFIGS } from '../types/upload';

export class UploadService {
  private static instance: UploadService;
  private configs: Record<FileType, UploadConfig>;

  private constructor() {
    this.configs = DEFAULT_CONFIGS;
  }

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  public setConfig(fileType: FileType, config: Partial<UploadConfig>) {
    this.configs[fileType] = { ...this.configs[fileType], ...config };
  }

  private validateFile(file: File, fileType: FileType): UploadError | null {
    const config = this.configs[fileType];

    if (!config) {
      return {
        code: 'INVALID_FILE_TYPE',
        message: `Invalid file type: ${fileType}`
      };
    }

    if (file.size > config.maxSize) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `File size exceeds the limit of ${config.maxSize / 1024 / 1024}MB`
      };
    }

    if (!config.allowedTypes.includes(file.type)) {
      return {
        code: 'INVALID_MIME_TYPE',
        message: `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`
      };
    }

    return null;
  }

  private async processImage(
    buffer: Buffer,
    config: UploadConfig,
    metadata: Record<string, any> = {}
  ): Promise<{ processedBuffer: Buffer; thumbnailBuffer?: Buffer }> {
    let processedBuffer = buffer;
    let thumbnailBuffer: Buffer | undefined;

    // Apply compression if configured
    if (config.compressConfig) {
      const { quality, maxWidth, maxHeight } = config.compressConfig;
      processedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    }

    // Generate thumbnail if configured
    if (config.generateThumbnail && config.thumbnailConfig) {
      const { width, height, quality } = config.thumbnailConfig;
      thumbnailBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .jpeg({ quality })
        .toBuffer();
    }

    return { processedBuffer, thumbnailBuffer };
  }

  private async processVideo(
    buffer: Buffer,
    config: UploadConfig
  ): Promise<{ processedBuffer: Buffer; thumbnailBuffer?: Buffer }> {
    // TODO: Implement video processing (compression, thumbnail generation)
    // For now, just return the original buffer
    return { processedBuffer: buffer };
  }

  public async upload(
    file: File,
    fileType: FileType,
    metadata: Record<string, any> = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validationError = this.validateFile(file, fileType);
      if (validationError) {
        throw validationError;
      }

      const config = this.configs[fileType];
      const buffer = Buffer.from(await file.arrayBuffer());

      // Process file based on type
      let processedBuffer: Buffer;
      let thumbnailBuffer: Buffer | undefined;

      if (fileType === 'image' || fileType === 'avatar' || fileType === 'thumbnail' || fileType === 'wallpaper') {
        const result = await this.processImage(buffer, config, metadata);
        processedBuffer = result.processedBuffer;
        thumbnailBuffer = result.thumbnailBuffer;
      } else if (fileType === 'video') {
        const result = await this.processVideo(buffer, config);
        processedBuffer = result.processedBuffer;
        thumbnailBuffer = result.thumbnailBuffer;
      } else {
        processedBuffer = buffer;
      }

      // Generate unique filename
      const uniqueId = uuidv4();
      const extension = file.name.split('.').pop() || '';
      const filename = `${fileType}-${uniqueId}.${extension}`;

      // Upload main file
      const uploadResult = await uploadFile(processedBuffer, filename, file.type);
      if (!uploadResult || !uploadResult.fileId) {
        throw new Error('Failed to upload file');
      }

      // Upload thumbnail if generated
      let thumbnailUrl: string | undefined;
      if (thumbnailBuffer) {
        const thumbnailFilename = `thumb-${filename}`;
        const thumbnailResult = await uploadFile(thumbnailBuffer, thumbnailFilename, 'image/jpeg');
        if (thumbnailResult && thumbnailResult.fileId) {
          thumbnailUrl = `/api/files/${thumbnailResult.fileId}`;
        }
      }

      return {
        fileId: uploadResult.fileId,
        filename: filename,
        contentType: file.type,
        size: processedBuffer.length,
        url: `/api/files/${uploadResult.fileId}`,
        thumbnailUrl,
        metadata: {
          ...metadata,
          originalName: file.name,
          originalSize: file.size,
          processedSize: processedBuffer.length
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Failed to upload file',
        details: error
      };
    }
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance(); 