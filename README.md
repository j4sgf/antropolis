# Antocracy - Ant Colony Simulation Game

A strategic ant colony simulation game where players build and manage their ant colonies while competing against intelligent AI opponents.

## 🎮 Game Overview

Antocracy is a real-time strategy game focused on ant colony management and warfare. Players must:
- Build and expand their ant colonies
- Manage resources (food, wood, stone, minerals, water)
- Research new technologies and unit types
- Defend against AI colony attacks
- Launch strategic raids on enemy colonies
- Adapt to dynamic AI opponents with unique personalities

## 🏗️ Project Structure

```
antocracy/
├── server/                 # Backend Node.js application
│   ├── controllers/        # API route controllers
│   ├── models/            # Data models and database schemas
│   ├── services/          # Business logic and AI systems
│   │   ├── ai/           # AI colony behavior systems
│   │   └── strategies/   # Strategic decision-making modules
│   ├── routes/           # API route definitions
│   └── config/           # Database and server configuration
├── client/               # Frontend React application (planned)
├── tasks/               # TaskMaster project management
└── scripts/             # Development and deployment scripts
```

## 🤖 AI System Features

The project features a sophisticated AI colony behavior system with:

### **Adaptive AI Colonies**
- **6 Personality Types**: Aggressive, Defensive, Expansionist, Opportunist, Militant, Builder
- **Dynamic Strategy Adaptation**: AI colonies adapt their behavior based on player actions
- **Intelligent Decision Making**: Multi-factor decision trees considering resources, threats, and opportunities

### **Advanced Behavior Systems**
- **Player Monitoring**: Tracks and analyzes player behavior patterns
- **Attack Triggers**: Smart evaluation of when to launch attacks based on multiple factors
- **Counter-Strategies**: AI selects optimal responses to player strategies
- **Exploration & Scouting**: Fog-of-war mechanics with intelligent exploration patterns

### **Growth & Scaling**
- **Dynamic Difficulty**: Adjusts AI capabilities based on player performance
- **Time-Based Growth**: Colonies evolve and expand over time
- **Resource Management**: Intelligent resource gathering and allocation
- **Territory Expansion**: Strategic territory claiming and defense

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Supabase/PostgreSQL** for data persistence
- **RESTful API** architecture
- **Modular AI system** design

### Development Tools
- **TaskMaster AI** for project management
- **Git** for version control
- **Jest** for testing (planned)

## 🚀 Recent Accomplishments

### ✅ **Task 12: AI Colony Behavior System** (COMPLETED)
- **12.1**: AI Colony Data Structure and State Management
- **12.2**: Decision Tree for AI Colony Actions  
- **12.3**: Colony Growth and Difficulty Scaling
- **12.4**: AI Scouting and Exploration Behavior
- **12.5**: Adaptive Strategies and Attack Triggers

**Total Implementation**: 15+ new classes, 30+ API endpoints, 5000+ lines of sophisticated AI code

## 📋 Current Status

**Completed Systems:**
- ✅ AI Colony Behavior System
- ✅ Strategic Decision Making
- ✅ Adaptive AI Opponents
- ✅ Resource Management
- ✅ Exploration & Scouting
- ✅ Growth & Scaling Systems

**Next Up:**
- 🔄 **Task 13**: Battle Simulation System
- 📋 **Task 14**: Frontend Development
- 📋 **Task 15**: Database Schema Implementation

## 🎯 Key Features Implemented

### **AI Decision Making**
- Multi-layered decision evaluation system
- Resource-conscious action filtering
- Threat-responsive defensive positioning
- Opportunistic attack target selection

### **Adaptive Behavior**
- Real-time player action monitoring
- Dynamic strategy adaptation with 5-minute cooldowns
- Counter-strategy selection from 12 different approaches
- Event-driven AI communication system

### **Exploration System**
- 4 exploration modes (systematic, opportunistic, resource-focused, threat-assessment)
- Advanced pathfinding with 4 modes (direct, safe, stealth, rapid)
- Comprehensive memory management with 10 specialized categories
- Fog-of-war mechanics with visibility decay

### **Growth & Scaling**
- Time-based growth calculations for all colony aspects
- Personality-driven growth modifiers
- Dynamic difficulty scaling based on player performance
- 4 development phases (early, expansion, consolidation, dominance)

## 🔗 API Endpoints

The game features a comprehensive REST API with 40+ endpoints covering:
- Colony management and CRUD operations
- Strategic decision making
- Growth and scaling operations
- Exploration and visibility management
- Adaptive behavior and analytics
- Memory and intelligence systems

## 📊 Project Management

This project uses **TaskMaster AI** for sophisticated project management:
- Hierarchical task breakdown with subtasks
- Dependency tracking and validation
- Progress monitoring and analytics
- Automated task generation from requirements

## 🔧 Setup and Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/antocracy.git

# Navigate to project directory
cd antocracy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the development server
npm run dev
```

## 🤝 Contributing

This project is actively developed using AI-assisted development practices. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎖️ Acknowledgments

- Built with TaskMaster AI project management
- AI systems designed with modular, extensible architecture
- Inspired by classic RTS games and ant colony optimization algorithms

---

**Project Status**: Active Development | **AI Sophistication**: Advanced | **Code Quality**: Production-Ready
