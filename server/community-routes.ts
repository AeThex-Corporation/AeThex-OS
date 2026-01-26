import express from 'express';

const app = express.Router();

// Mock data for now - will connect to Supabase later
const mockEvents = [
  {
    id: '1',
    title: 'AeThex Developer Workshop',
    description: 'Learn advanced game development techniques with AeThex APIs',
    category: 'workshop',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Virtual',
    price: 0,
    attendees: 45,
    capacity: 100,
    featured: true
  },
  {
    id: '2',
    title: 'Web3 Gaming Summit',
    description: 'Join industry leaders discussing the future of blockchain gaming',
    category: 'conference',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'San Francisco, CA',
    price: 299,
    attendees: 234,
    capacity: 500,
    featured: true
  },
  {
    id: '3',
    title: 'Monthly Game Dev Meetup',
    description: 'Casual meetup for game developers to network and share projects',
    category: 'meetup',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'New York, NY',
    price: 0,
    attendees: 67,
    capacity: 80,
    featured: false
  },
  {
    id: '4',
    title: '48-Hour Game Jam',
    description: 'Build a game from scratch in 48 hours with your team',
    category: 'hackathon',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Online',
    price: 25,
    attendees: 156,
    capacity: 200,
    featured: true
  }
];

const mockOpportunities = [
  {
    id: '1',
    title: 'Senior Game Developer',
    company: 'AeThex Studios',
    arm: 'codex',
    type: 'full-time',
    location: 'Remote',
    description: 'Build next-generation metaverse experiences using AeThex platform',
    requirements: ['5+ years game dev experience', 'Unity/Unreal expertise', 'Multiplayer networking'],
    salary_min: 120000,
    salary_max: 180000,
    posted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 23
  },
  {
    id: '2',
    title: 'Security Engineer',
    company: 'AeThex Corporation',
    arm: 'aegis',
    type: 'full-time',
    location: 'Hybrid - Austin, TX',
    description: 'Protect our ecosystem with cutting-edge security solutions',
    requirements: ['Security certifications', 'Penetration testing', 'Cloud security'],
    salary_min: 150000,
    salary_max: 200000,
    posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 15
  },
  {
    id: '3',
    title: 'Community Manager',
    company: 'AeThex Network',
    arm: 'axiom',
    type: 'full-time',
    location: 'Remote',
    description: 'Build and nurture our growing community of developers and creators',
    requirements: ['3+ years community management', 'Gaming industry experience', 'Content creation'],
    salary_min: 70000,
    salary_max: 95000,
    posted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 45
  },
  {
    id: '4',
    title: 'Blockchain Developer',
    company: 'AeThex Labs',
    arm: 'codex',
    type: 'contract',
    location: 'Remote',
    description: 'Develop Web3 integrations for gaming platforms',
    requirements: ['Solidity/Rust', 'Smart contracts', 'DeFi experience'],
    salary_min: 100000,
    salary_max: 150000,
    posted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    applicants: 31
  }
];

const mockMessages = [
  {
    id: '1',
    sender_id: 'user_123',
    sender_name: 'Alex Chen',
    content: 'Hey, saw your mod workshop submission. Really impressive work!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    avatar: null
  },
  {
    id: '2',
    sender_id: 'user_456',
    sender_name: 'Jordan Smith',
    content: 'Are you attending the developer workshop next week?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    avatar: null
  },
  {
    id: '3',
    sender_id: 'admin_001',
    sender_name: 'AeThex Team',
    content: 'Your marketplace listing has been approved! It\'s now live.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    avatar: null
  }
];

// ==================== EVENTS ROUTES ====================

// GET /api/events - List all events
app.get('/events', async (req, res) => {
  try {
    const { category, featured } = req.query;
    
    let filtered = [...mockEvents];
    
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    
    if (featured === 'true') {
      filtered = filtered.filter(e => e.featured);
    }
    
    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id - Get single event
app.get('/events/:id', async (req, res) => {
  try {
    const event = mockEvents.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/:id/register - Register for event
app.post('/events/:id/register', async (req, res) => {
  try {
    const event = mockEvents.find(e => e.id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.attendees >= event.capacity) {
      return res.status(400).json({ error: 'Event is full' });
    }
    
    // Mock registration
    event.attendees += 1;
    
    res.json({ 
      success: true, 
      message: 'Successfully registered for event',
      event 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== OPPORTUNITIES ROUTES ====================

// GET /api/opportunities - List all job opportunities
app.get('/opportunities', async (req, res) => {
  try {
    const { arm, type } = req.query;
    
    let filtered = [...mockOpportunities];
    
    if (arm) {
      filtered = filtered.filter(o => o.arm === arm);
    }
    
    if (type) {
      filtered = filtered.filter(o => o.type === type);
    }
    
    // Sort by posted date (newest first)
    filtered.sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime());
    
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/opportunities/:id - Get single opportunity
app.get('/opportunities/:id', async (req, res) => {
  try {
    const opportunity = mockOpportunities.find(o => o.id === req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json(opportunity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/opportunities/:id/apply - Apply to job
app.post('/opportunities/:id/apply', async (req, res) => {
  try {
    const opportunity = mockOpportunities.find(o => o.id === req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    const { resume, cover_letter } = req.body;
    
    if (!resume) {
      return res.status(400).json({ error: 'Resume is required' });
    }
    
    // Mock application
    opportunity.applicants += 1;
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      opportunity 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGES ROUTES ====================

// GET /api/messages - List all messages
app.get('/messages', async (req, res) => {
  try {
    const { unread_only } = req.query;
    
    let filtered = [...mockMessages];
    
    if (unread_only === 'true') {
      filtered = filtered.filter(m => !m.read);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/:id - Get single message
app.get('/messages/:id', async (req, res) => {
  try {
    const message = mockMessages.find(m => m.id === req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Mark as read
    message.read = true;
    
    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages - Send new message
app.post('/messages', async (req, res) => {
  try {
    const { recipient_id, content } = req.body;
    
    if (!recipient_id || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }
    
    const newMessage = {
      id: String(mockMessages.length + 1),
      sender_id: 'current_user',
      sender_name: 'You',
      content,
      timestamp: new Date().toISOString(),
      read: false,
      avatar: null
    };
    
    mockMessages.unshift(newMessage);
    
    res.json({ 
      success: true, 
      message: 'Message sent',
      data: newMessage 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/messages/:id/read - Mark message as read
app.put('/messages/:id/read', async (req, res) => {
  try {
    const message = mockMessages.find(m => m.id === req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.read = true;
    
    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
