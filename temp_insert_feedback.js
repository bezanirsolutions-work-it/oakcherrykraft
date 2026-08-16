const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jmrxmexmlejfksjlzvit.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function insertFeedback() {
  try {
    // Insert feedback for the session we've been testing
    const sessionId = '718f5f9f-a38d-4d6d-8047-e601724b55d4';
    
    const { data, error } = await supabase
      .from('live_chat_feedback')
      .insert({
        session_id: sessionId,
        rating: 5,
        comment: 'Great experience with Oak Cherry Kraft! Very professional and helpful.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error inserting feedback:', error);
      process.exit(1);
    }

    console.log('Feedback inserted successfully:', data);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

insertFeedback();
