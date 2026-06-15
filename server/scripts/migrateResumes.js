const path = require('path');
const mammoth = require('mammoth');
const db = require('../src/config/db');

async function migrateResumes() {
  try {
    console.log('Adding raw_text column to user_resumes table (if not exists)...');
    try {
      await db.execute('ALTER TABLE user_resumes ADD COLUMN raw_text LONGTEXT');
      console.log('Column raw_text added successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column raw_text already exists, skipping ADD COLUMN.');
      } else {
        throw err;
      }
    }

    console.log('Fetching all resumes from DB...');
    const [resumes] = await db.execute('SELECT id, file_path FROM user_resumes WHERE raw_text IS NULL OR raw_text = ""');
    
    console.log(`Found ${resumes.length} resumes to migrate.`);

    for (const resume of resumes) {
      if (!resume.file_path) {
        console.log(`Resume ID ${resume.id} has no file_path, skipping.`);
        continue;
      }

      const relativePath = resume.file_path.replace(/^[\/\\]+/, ''); // Strip leading slashes
      const fullPath = path.resolve(__dirname, '../', relativePath);
      try {
        console.log(`Extracting text for Resume ID ${resume.id} from ${fullPath}...`);
        const result = await mammoth.extractRawText({ path: fullPath });
        const text = result.value;
        
        if (text && text.trim().length > 0) {
          await db.execute('UPDATE user_resumes SET raw_text = ? WHERE id = ?', [text, resume.id]);
          console.log(`✅ Successfully updated raw_text for Resume ID ${resume.id}`);
        } else {
          console.log(`⚠️ Extracted text is empty for Resume ID ${resume.id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to extract/update text for Resume ID ${resume.id}:`, err.message);
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateResumes();
