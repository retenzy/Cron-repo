const AWS = require('aws-sdk');
const CONFIG = require('../config');
// Configure AWS
AWS.config.update({
  // region: process.env.AWS_REGION,
  secretAccessKey: CONFIG.AWS.secretAccessKey,
  accessKeyId: CONFIG.AWS.accessKeyId,
});

const s3 = new AWS.S3();

const uploadMediaToS3 = async (fileData) => {
  try {
    // const base64Data = fileData.base64.replace("/^data:image\/\w+;base64,/", "");
    const buffer = Buffer.from(fileData.base64, 'base64');
    console.log('bufferee', buffer);
    const params = {
      Bucket: CONFIG.AWS.bucket,
      Key: fileData.filename + '-' + Date.now() + '-' + fileData.filetype,
      Body: buffer,
      ContentType: fileData.filetype,
      ACL: 'public-read',
    };
    // Upload to S3
    const uploadResult = await s3.upload(params).promise();
    // Get the URL of uploaded file
    const fileUrl = uploadResult.Location;

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error) {
    console.log('Error uploading to S3:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = uploadMediaToS3;
