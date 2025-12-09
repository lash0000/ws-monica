const AIServiceFactory = require("./ai.srv");

class AIController {
  constructor(io) {
    this.io = io;
    this.AIService = AIServiceFactory(io);
  }

  /**
   * Generate AI review (no required fields)
   * POST /api/ai/review
   */
  generateAIReview = async (req, res) => {
    try {
      const result = await this.AIService.generateAIReview();
      
      res.status(201).json({
        success: true,
        message: 'AI review generated successfully',
        data: result
      });
    } catch (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }
  };

  /**
   * Get AI review for a specific ticket
   * GET /api/ai/review/:id
   */
  getAIReview = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.AIService.getAIReview(id);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(404).json({ 
        success: false,
        error: err.message 
      });
    }
  };

  /**
   * Get all AI reviews
   * GET /api/ai/reviews
   */
  getAllAIReviews = async (req, res) => {
    try {
      const result = await this.AIService.getAllAIReviews();
      
      res.status(200).json({
        success: true,
        count: result.length,
        data: result
      });
    } catch (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }
  };
}

module.exports = AIController;
