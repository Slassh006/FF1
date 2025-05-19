import { GridFSBucket, ObjectId, GridFSBucketReadStream } from 'mongodb';
import { getMongoClient } from './db';

let bucket: GridFSBucket | null = null;

async function getBucket(): Promise<GridFSBucket> {
  try {
    if (!bucket) {
      const client = await getMongoClient();
      const db = client.db();
      bucket = new GridFSBucket(db, {
        bucketName: 'wallpapers',
        chunkSizeBytes: 1024 * 1024, // 1MB chunks
      });
      console.log('GridFS bucket initialized successfully');
    }
    return bucket;
  } catch (error) {
    console.error('Error initializing GridFS bucket:', error);
    throw new Error('Failed to initialize storage system');
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ fileId: string; filename: string; contentType: string }> {
  try {
    const bucket = await getBucket();
    console.log(`Starting upload for file: ${filename} (${buffer.length} bytes)`);

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        contentType,
        metadata: {
          uploadDate: new Date(),
          filename,
          contentType
        }
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(new Error(`Failed to upload file: ${error.message}`));
      });

      uploadStream.on('finish', () => {
        console.log(`File uploaded successfully: ${filename} (ID: ${uploadStream.id})`);
        resolve({
          fileId: uploadStream.id.toString(),
          filename,
          contentType,
        });
      });

      // Add error handling for the buffer
      try {
        uploadStream.end(buffer);
      } catch (error) {
        console.error('Error writing buffer to upload stream:', error);
        reject(new Error(`Failed to write file data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    console.error('Error uploading file to GridFS:', error);
    throw new Error(`Failed to upload file to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getFile(fileId: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const startTime = Date.now();
  console.log(`[getFile START] Attempting to get file: ${fileId}`);
  try {
    // Validate fileId
    if (!fileId || typeof fileId !== 'string' || !ObjectId.isValid(fileId)) {
       console.error(`[getFile ERROR] Invalid file ID format: ${fileId}`);
       throw new Error('Invalid file ID format');
    }
    const objectId = new ObjectId(fileId);
    console.log(`[getFile] Valid ObjectId created: ${objectId}`);

    const bucket = await getBucket();

    // First get the file metadata to access contentType
    console.log(`[getFile] Searching for file metadata for ID: ${objectId}`);
    const files = await bucket.find({ _id: objectId }).limit(1).toArray(); // Added limit(1) for efficiency
    if (files.length === 0) {
      console.error(`[getFile ERROR] File metadata not found in GridFS for ID: ${fileId}`);
      throw new Error('File not found in storage');
    }
    
    const file = files[0];
    const contentType = file.contentType || 'application/octet-stream';
    const fileSize = file.length;
    const filename = file.filename;
    console.log(`[getFile] Found file metadata: Name=${file.filename}, Type=${contentType}, Size=${fileSize} bytes`);

    // Then download the file
    console.log(`[getFile] Opening download stream for ID: ${objectId}`);
    const downloadStream = bucket.openDownloadStream(objectId);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        // console.log(`[getFile] Received chunk of size: ${chunk.length}`); // Uncomment for very detailed debugging
        chunks.push(chunk);
      });
      
      downloadStream.on('error', (error) => {
        console.error(`[getFile ERROR] GridFS download stream error for ID ${fileId}:`, error);
        reject(new Error('Failed to download file from storage stream'));
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const duration = Date.now() - startTime;
        if (buffer.length === 0) {
           console.error(`[getFile ERROR] Downloaded file is empty for ID ${fileId}. Duration: ${duration}ms`);
           reject(new Error('Downloaded file is empty'));
           return;
        }
        console.log(`[getFile SUCCESS] File downloaded successfully: ID=${fileId}, Name=${file.filename}, Size=${buffer.length} bytes. Duration: ${duration}ms`);
        resolve({
          buffer,
          contentType,
          filename
        });
      });
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[getFile CATCH] Error downloading file from GridFS: ID=${fileId}. Duration: ${duration}ms`, error);
    // Re-throw specific known errors, otherwise a generic one
    if (error.message?.includes('File not found') || error.message?.includes('Invalid file ID format')) {
      throw error;
    }
    throw new Error('Failed to download file due to unexpected error');
  }
}

export async function getFileStream(fileId: string): Promise<GridFSBucketReadStream> {
  try {
    // Validate fileId format
    if (!ObjectId.isValid(fileId)) {
        throw new Error(`Invalid file ID format: ${fileId}`);
    }
    const objectId = new ObjectId(fileId);
    const bucket = await getBucket();

    // Optional: Check if file exists before attempting download stream to provide clearer error
    const fileInfo = await bucket.find({ _id: objectId }).limit(1).toArray();
    if (fileInfo.length === 0) {
         throw new Error(`File not found in storage: ${fileId}`);
    }
    
    // Return the download stream
    return bucket.openDownloadStream(objectId);

  } catch (error) {
    console.error(`Error getting file stream for ${fileId}:`, error);
    // Re-throw specific errors or a generic one
    if (error instanceof Error && error.message.includes('File not found')) {
        throw error; // Re-throw the specific not found error
    }
    // Throw generic error for other issues
    throw new Error(`Failed to get file stream: ${fileId}. Reason: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const bucket = await getBucket();
    await bucket.delete(new ObjectId(fileId));
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
    throw new Error('Failed to delete file from storage');
  }
}

export async function fileExists(fileId: string): Promise<boolean> {
  try {
    const bucket = await getBucket();
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    return files.length > 0;
  } catch (error) {
    console.error('Error checking file existence in GridFS:', error);
    return false;
  }
} 