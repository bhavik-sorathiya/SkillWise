const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.execute('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalResumes }]] = await db.execute("SELECT COUNT(*) as totalResumes FROM user_resumes WHERE status = 'active'");
    const [[{ totalInterviews }]] = await db.execute('SELECT COUNT(*) as totalInterviews FROM interview_sessions');
    
    // API Usage could be mocked or queried if an api_logs table exists
    // For now we'll send a placeholder format
    const apiUsage = [
      { date: 'Mon', count: 120 },
      { date: 'Tue', count: 150 },
      { date: 'Wed', count: 180 },
      { date: 'Thu', count: 90 },
      { date: 'Fri', count: 210 },
      { date: 'Sat', count: 80 },
      { date: 'Sun', count: 100 },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalResumes,
        totalInterviews,
      },
      apiUsage
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT 
        u.id, u.full_name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM user_resumes WHERE user_id = u.id AND status = 'active') as resume_count,
        (SELECT COUNT(*) FROM interview_sessions WHERE user_id = u.id) as interview_count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers
};
