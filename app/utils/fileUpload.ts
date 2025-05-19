import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoClient } from '../lib/db';
import { Readable } from 'stream';

export async function uploadFile(
  file: Buffer | Readable,
  filename: string,
  contentType: string
): Promise<ObjectId> {
  const client = await getMongoClient();
  const bucket = new GridFSBucket(client.db());
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
    });

    if (Buffer.isBuffer(file)) {
      uploadStream.end(file);
    } else {
      file.pipe(uploadStream);
    }

    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });
  });
}

export async function getFile(fileId: string): Promise<{ stream: Readable; contentType: string }> {
  const client = await getMongoClient();
  const bucket = new GridFSBucket(client.db());
  
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  if (files.length === 0) {
    throw new Error('File not found');
  }

  const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
  return {
    stream: downloadStream,
    contentType: files[0].contentType || 'application/octet-stream',
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  const client = await getMongoClient();
  const bucket = new GridFSBucket(client.db());
  
  await bucket.delete(new ObjectId(fileId));
} 