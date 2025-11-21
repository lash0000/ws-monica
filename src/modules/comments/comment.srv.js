const mdl_Comments = require('./comment.mdl');
const mdl_Tickets = require('../tickets/ticket.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');

class CommentService {
  constructor(category) {
    // category will be: 'ticket', 'event', 'appointment'
    this.category = category;
  }

  // Add new comment
  async addNewComment({ parent_id, commented_by, comment }) {
    try {
      const newComment = await mdl_Comments.create({
        parent_id,
        commented_by,
        comment,
        category: this.category
      });

      return newComment;
    } catch (err) {
      throw new Error(`Failed to add comment: ${err.message}`);
    }
  }

  // Update a comment by ID
  async updateComment(id, updates) {
    try {
      const existing = await mdl_Comments.findByPk(id);
      if (!existing) throw new Error(`Comment not found`);

      // Only update allowed fields
      await existing.update({ comment: updates.comment });

      return existing;
    } catch (err) {
      throw new Error(`Failed to update comment: ${err.message}`);
    }
  }

  // Get all comments for the parent record (ticket/event/appointment)
  async getAllComment(parent_id) {
    try {
      return await mdl_Comments.findAll({
        where: {
          parent_id,
          category: this.category
        },
        include: [
          { model: mdl_Tickets, as: 'Ticket_Details' },
          { model: mdl_UserCredentials, as: 'UserCredential' },
          { model: mdl_UserProfile, as: 'UserProfile' }
        ],
        order: [['createdAt', 'ASC']]
      });
    } catch (err) {
      throw new Error(`Failed to get comments: ${err.message}`);
    }
  }

  // Get a single comment (not tied to a specific category)
  async getCommentByID(id) {
    try {
      const comment = await mdl_Comments.findByPk(id);
      if (!comment) throw new Error('Comment not found');

      return comment;
    } catch (err) {
      throw new Error(`Failed to get comment: ${err.message}`);
    }
  }

  // Get comments created by a specific user
  async myComment(user_id) {
    try {
      return await mdl_Comments.findAll({
        where: { commented_by: user_id },
        include: [
          { model: mdl_Tickets, as: 'Ticket_Details' },
          { model: mdl_UserCredentials, as: 'UserCredential' },
          { model: mdl_UserProfile, as: 'UserProfile' }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      throw new Error(`Failed to fetch user comments: ${err.message}`);
    }
  }
}

module.exports = CommentService;
