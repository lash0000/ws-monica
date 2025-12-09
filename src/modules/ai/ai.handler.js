module.exports = (io, service) => {
  io.on("connection", (socket) => {

    /**
     * Generate AI review for a specific ticket
     * Event: "ai:generate_review"
     */
    socket.on("ai:generate_review", async ({ ticketId, userId }) => {
      try {
        const result = await service.generateAIReview(ticketId, userId);
        socket.emit("ai:review_generated", { 
          success: true, 
          message: 'AI review generated successfully',
          data: result 
        });
        
        // Broadcast to all clients that a new review was generated
        io.emit("ai:new_review", { 
          ticketId, 
          reviewId: result.id 
        });
      } catch (err) {
        socket.emit("ai:error", { 
          success: false, 
          message: err.message 
        });
      }
    });

    /**
     * Get AI review for a specific ticket
     * Event: "ai:fetch_review"
     */
    socket.on("ai:fetch_review", async (ticketId) => {
      try {
        const result = await service.getAIReview(ticketId);
        socket.emit("ai:review_data", { 
          success: true, 
          data: result 
        });
      } catch (err) {
        socket.emit("ai:error", { 
          success: false, 
          message: err.message 
        });
      }
    });

    /**
     * Get all AI reviews
     * Event: "ai:fetch_all_reviews"
     */
    socket.on("ai:fetch_all_reviews", async () => {
      try {
        const result = await service.getAllAIReviews();
        socket.emit("ai:reviews_list", { 
          success: true, 
          count: result.length,
          data: result 
        });
      } catch (err) {
        socket.emit("ai:error", { 
          success: false, 
          message: err.message 
        });
      }
    });

  });
};
