const AWS = require('aws-sdk');
const CONFIG = require('../config');
// Configure AWS
AWS.config.update({
  // region: process.env.AWS_REGION,
  secretAccessKey: CONFIG.AWS.secretAccessKey,
  accessKeyId: CONFIG.AWS.accessKeyId,
});

const s3 = new AWS.S3();

const uploadXmlToS3 = async (xmlData, merchantName) => {
  try {
    // Generate unique filename
    const fileName = `reviewXmlsFeed/${merchantName}.xml`;
    // S3 upload parameters
    const params = {
      Bucket: CONFIG.AWS.bucket,
      Key: fileName,
      Body: xmlData,
      ContentType: 'application/xml',
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

module.exports = uploadXmlToS3;
