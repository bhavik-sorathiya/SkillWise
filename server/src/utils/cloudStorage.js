// server/src/utils/cloudStorage.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found in environment variables. Cloud storage might fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const uploadFileToSupabase = async (fileBuffer, filename, mimetype) => {
  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filename, fileBuffer, {
        contentType: mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // User mentioned bucket is NON PUBLIC. So we generate a 10-year signed URL.
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filename, 60 * 60 * 24 * 365 * 10); // 10 years

    if (signedUrlError) {
      console.error('Supabase signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    return signedUrlData.signedUrl;
  } catch (err) {
    console.error('Failed to upload file to Supabase:', err);
    throw err;
  }
};

const deleteFileFromSupabase = async (filename) => {
  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .remove([filename]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete file from Supabase:', err);
    throw err;
  }
};

module.exports = {
  uploadFileToSupabase,
  deleteFileFromSupabase,
  supabase
};
