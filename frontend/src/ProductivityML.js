// Client-side ML for productivity predictions
import * as tf from '@tensorflow/tfjs';

class ProductivityML {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
  }

  // Initialize the productivity prediction model
  async initializeModel() {
    try {
      // Create a simple neural network for productivity prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [7], units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      console.log('Productivity ML model initialized');
    } catch (error) {
      console.error('Error initializing ML model:', error);
    }
  }

  // Prepare features from user task data
  prepareFeatures(tasks, currentHour = new Date().getHours()) {
    if (!tasks || tasks.length === 0) return [];

    return tasks.map(task => {
      const createdDate = new Date(task.createdAt);
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      
      return [
        currentHour / 24, // Hour of day (normalized)
        createdDate.getDay() / 7, // Day of week (normalized)
        task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.5 : 0, // Priority score
        task.category === 'work' ? 1 : 0, // Work category flag
        dueDate ? Math.min((dueDate - new Date()) / (1000 * 60 * 60 * 24), 30) / 30 : 0.5, // Days until due (normalized)
        task.description ? Math.min(task.description.length, 500) / 500 : 0, // Description length (normalized)
        task.type === 'task' ? 1 : task.type === 'event' ? 0.5 : 0 // Task type score
      ];
    });
  }

  // Predict optimal time to work on tasks
  async predictOptimalTime(tasks) {
    if (!this.isModelLoaded || !tasks || tasks.length === 0) {
      return this.getFallbackPredictions(tasks);
    }

    try {
      const features = this.prepareFeatures(tasks);
      const predictions = await this.model.predict(tf.tensor2d(features)).data();
      
      return tasks.map((task, index) => ({
        taskId: task._id,
        title: task.title,
        productivityScore: predictions[index],
        suggestedTime: this.getOptimalTimeSlot(predictions[index]),
        confidence: predictions[index] > 0.7 ? 'high' : predictions[index] > 0.4 ? 'medium' : 'low'
      }));
    } catch (error) {
      console.error('Error predicting optimal time:', error);
      return this.getFallbackPredictions(tasks);
    }
  }

  // Fallback predictions when ML model isn't available
  getFallbackPredictions(tasks) {
    if (!tasks) return [];
    
    return tasks.map(task => {
      let score = 0.5; // Default score
      
      // Increase score for high priority tasks
      if (task.priority === 'high') score += 0.3;
      if (task.priority === 'medium') score += 0.1;
      
      // Increase score for work tasks during work hours
      const currentHour = new Date().getHours();
      if (task.category === 'work' && currentHour >= 9 && currentHour <= 17) {
        score += 0.2;
      }
      
      // Increase score for tasks due soon
      if (task.dueDate) {
        const daysToDue = (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysToDue <= 1) score += 0.3;
        else if (daysToDue <= 3) score += 0.1;
      }
      
      return {
        taskId: task._id,
        title: task.title,
        productivityScore: Math.min(score, 1),
        suggestedTime: this.getOptimalTimeSlot(score),
        confidence: 'medium'
      };
    });
  }

  // Get optimal time slot based on productivity score
  getOptimalTimeSlot(score) {
    const currentHour = new Date().getHours();
    
    if (score > 0.7) {
      // High productivity - suggest current time or peak hours
      if (currentHour >= 9 && currentHour <= 11) return 'Now (Peak Morning)';
      if (currentHour >= 14 && currentHour <= 16) return 'Now (Peak Afternoon)';
      return 'Tomorrow 9-11 AM (Peak Time)';
    } else if (score > 0.4) {
      // Medium productivity - suggest regular work hours
      if (currentHour >= 9 && currentHour <= 17) return 'Now (Work Hours)';
      return 'Tomorrow during work hours';
    } else {
      // Low productivity - suggest flexible time
      return 'When you have free time';
    }
  }

  // Analyze user productivity patterns
  analyzeProductivityPatterns(tasks) {
    if (!tasks || tasks.length === 0) return {};

    const patterns = {
      bestDays: {},
      bestHours: {},
      categoryPerformance: {},
      completionRate: 0
    };

    const completedTasks = tasks.filter(task => task.status === 'completed');
    patterns.completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    completedTasks.forEach(task => {
      if (task.updatedAt) {
        const completedDate = new Date(task.updatedAt);
        const day = completedDate.getDay();
        const hour = completedDate.getHours();
        
        // Track best days
        patterns.bestDays[day] = (patterns.bestDays[day] || 0) + 1;
        
        // Track best hours
        patterns.bestHours[hour] = (patterns.bestHours[hour] || 0) + 1;
        
        // Track category performance
        const category = task.category || 'other';
        if (!patterns.categoryPerformance[category]) {
          patterns.categoryPerformance[category] = { completed: 0, total: 0 };
        }
        patterns.categoryPerformance[category].completed++;
      }
    });

    // Count total tasks per category
    tasks.forEach(task => {
      const category = task.category || 'other';
      if (!patterns.categoryPerformance[category]) {
        patterns.categoryPerformance[category] = { completed: 0, total: 0 };
      }
      patterns.categoryPerformance[category].total++;
    });

    // Convert to percentages and find best times
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = Object.keys(patterns.bestDays).reduce((a, b) => 
      patterns.bestDays[a] > patterns.bestDays[b] ? a : b, '0'
    );
    
    const bestHour = Object.keys(patterns.bestHours).reduce((a, b) => 
      patterns.bestHours[a] > patterns.bestHours[b] ? a : b, '9'
    );

    return {
      ...patterns,
      insights: {
        bestDay: dayNames[parseInt(bestDay)],
        bestHour: `${bestHour}:00`,
        mostProductiveCategory: this.getMostProductiveCategory(patterns.categoryPerformance),
        recommendations: this.generateRecommendations(patterns)
      }
    };
  }

  getMostProductiveCategory(categoryPerformance) {
    let bestCategory = 'general';
    let bestRate = 0;

    Object.keys(categoryPerformance).forEach(category => {
      const data = categoryPerformance[category];
      const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestCategory = category;
      }
    });

    return { category: bestCategory, rate: bestRate };
  }

  generateRecommendations(patterns) {
    const recommendations = [];
    
    // Day-based recommendation
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = Object.keys(patterns.bestDays).reduce((a, b) => 
      patterns.bestDays[a] > patterns.bestDays[b] ? a : b, '1'
    );
    
    recommendations.push(`You're most productive on ${dayNames[parseInt(bestDay)]}s. Schedule important tasks then.`);

    // Hour-based recommendation
    const bestHour = Object.keys(patterns.bestHours).reduce((a, b) => 
      patterns.bestHours[a] > patterns.bestHours[b] ? a : b, '9'
    );
    
    const hour12 = parseInt(bestHour) > 12 ? `${parseInt(bestHour) - 12}:00 PM` : `${bestHour}:00 AM`;
    recommendations.push(`Your peak hour is around ${hour12}. Focus on challenging tasks then.`);

    // Completion rate recommendation
    if (patterns.completionRate < 70) {
      recommendations.push('Consider breaking down large tasks into smaller, manageable chunks.');
    } else if (patterns.completionRate > 90) {
      recommendations.push('Great job! You might want to take on more challenging goals.');
    }

    return recommendations;
  }

  // Train model with user data (simplified version)
  async trainWithUserData(tasks) {
    if (!this.isModelLoaded || !tasks || tasks.length < 10) return;

    try {
      const features = this.prepareFeatures(tasks);
      const labels = tasks.map(task => task.status === 'completed' ? 1 : 0);

      const xs = tf.tensor2d(features);
      const ys = tf.tensor1d(labels);

      await this.model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });

      console.log('Model trained with user data');
    } catch (error) {
      console.error('Error training model:', error);
    }
  }
}

export default ProductivityML;
