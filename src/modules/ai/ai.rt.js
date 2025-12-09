const express = require("express");
const AIController = require("./ai.ctrl");

module.exports = (io) => {
    const router = express.Router();
    const controller = new AIController(io);
    const f_authMiddleware = require('../../middlewares/auth.mw');

    router.post("/review", f_authMiddleware, (req, res) =>
        controller.generateAIReview(req, res)
    );
    router.get("/review/:id", f_authMiddleware, (req, res) =>
        controller.getAIReview(req, res)
    );
    router.get("/reviews", f_authMiddleware, (req, res) =>
        controller.getAllAIReviews(req, res)
    );
    
    return router;
}
