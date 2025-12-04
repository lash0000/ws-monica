const mdl_Comments = require('./comment.mdl');
const mdl_Tickets = require('../tickets/ticket.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const { asyncTaskRunner } = require('../../utils/async_task_runner.utils');
const EmailService = require('../email/email.srv');

class CommentService {
  constructor(category) {
    // category will be: 'ticket', 'event', 'appointment'
    this.category = category;
  }

  async notifyCommentedEntity(fullComment) {
    if (!fullComment) return;
    const commenterId = fullComment.commented_by;
    const ticketOwnerId = fullComment?.Ticket_Details?.user_id;

    // No owner? abort
    if (!ticketOwnerId) return;

    asyncTaskRunner(() =>
      EmailService.sendToUser({
        user_id: commenterId,
        template: "ticket_comments/creator",
        subject: `Your comment was added successfully mula sa Barangay Santa Monica.`,
        data: { comment: fullComment.comment }
      })
    );

    if (ticketOwnerId !== commenterId) {
      asyncTaskRunner(() =>
        EmailService.sendToUser({
          user_id: ticketOwnerId,
          template: "ticket_comments/recipient",
          subject: `A new comment has been added to your ticket mula sa Barangay Santa Monica.`,
          data: { comment: fullComment.comment }
        })
      );
    }
  }

  async addNewComment({ parent_id, commented_by, comment }) {
    try {
      const created = await mdl_Comments.create({
        parent_id,
        commented_by,
        comment,
        category: this.category
      });

      const fullComment = await mdl_Comments.findOne({
        where: { id: created.id },
        include: [
          { model: mdl_Tickets, as: 'Ticket_Details' },
          { model: mdl_UserCredentials, as: 'UserCredential', include: [{ model: mdl_UserProfile, as: 'UserProfile' }] },
          { model: mdl_UserProfile, as: 'UserProfile' }
        ]
      });
      this.notifyCommentedEntity(fullComment);
      return fullComment;
    } catch (err) {
      throw new Error(`Failed to add comment: ${err.message}`);
    }
  }

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
