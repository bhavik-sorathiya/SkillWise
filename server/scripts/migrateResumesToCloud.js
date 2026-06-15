const path = require('path');
const fs = require('fs');
const db = require('../src/config/db');
const { uploadFileToSupabase } = require('../src/utils/cloudStorage');
const UserProfile = require('../src/models/userProfileModel');

async function migrateResumesToCloud() {
  try {
    console.log('Renaming file_path to file_link in user_resumes table...');
    try {
      await db.execute('ALTER TABLE user_resumes RENAME COLUMN file_path TO file_link');
      console.log('Column file_path renamed to file_link successfully.');
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message.includes("check that column/key exists")) {
        console.log('Column file_path does not exist, likely already renamed to file_link.');
      } else {
        throw err;
      }
    }

    console.log('Fetching all resumes with local paths from DB...');
    // We fetch any resume whose file_link does not start with http
    const [resumes] = await db.execute('SELECT id, user_id, file_name, file_link FROM user_resumes WHERE file_link NOT LIKE "http%"');
    
    console.log(`Found ${resumes.length} resumes to migrate to Supabase.`);

    for (const resume of resumes) {
      if (!resume.file_link) {
        console.log(`Resume ID ${resume.id} has no file_link, skipping.`);
        continue;
      }

      const relativePath = resume.file_link.replace(/^[\/\\]+/, ''); // Strip leading slashes
      const fullPath = path.resolve(__dirname, '../', relativePath);
      
      try {
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️ Local file not found for Resume ID ${resume.id} at ${fullPath}. Skipping.`);
            continue;
        }

        console.log(`Reading local file for Resume ID ${resume.id} from ${fullPath}...`);
        const fileBuffer = fs.readFileSync(fullPath);
        
        // Get user info to construct new file name
        const userInfo = await UserProfile.getUserById(resume.user_id);
        const rawName = userInfo?.full_name || userInfo?.email?.split('@')[0] || 'user';
        const userName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const timestamp = Date.now();
        const newFileName = `${resume.user_id}_${userName}_resume_${timestamp}.docx`;

        console.log(`Uploading to Supabase as ${newFileName}...`);
        const fileUrl = await uploadFileToSupabase(fileBuffer, newFileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        
        await db.execute('UPDATE user_resumes SET file_link = ?, file_name = ? WHERE id = ?', [fileUrl, newFileName, resume.id]);
        console.log(`✅ Successfully uploaded and updated DB for Resume ID ${resume.id}`);
      } catch (err) {
        console.error(`❌ Failed to upload Resume ID ${resume.id}:`, err.message);
      }
    }

    console.log('Migration to Cloud Storage completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateResumesToCloud();
