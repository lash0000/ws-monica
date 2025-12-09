const mdl_AIReview = require('./ai_review.mdl');
const mdl_Tickets = require('../tickets/ticket.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const Perplexity = require('@perplexity-ai/perplexity_ai');

const client = new Perplexity({
  apiKey: process.env['PERPLEXITY_API_KEY'], 
});

class AIService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Generate AI overview for a specific ticket ID
   * @param {String} ticketId - UUID of the ticket
   * @param {String} userId - Optional user ID who requested the analysis
   * @returns {Object} - AI overview record
   */
async generateAIReview() {
  try {
    // 1. Count all tickets

    
    // 2. Check if count is 5 or more - do not generate AI review

    // 3. Fetch all tickets with nested associations
    const tickets = await mdl_Tickets.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: mdl_UserCredentials,
          include: [
            { model: mdl_UserProfile }
          ]
        }
      ]
    });

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets found');
    }

    // 4. Prepare summary information from all tickets
    const ticketsSummary = tickets.map(ticket => `
      Ticket ID: ${ticket.id}
      Subject: ${ticket.subject}
      Category: ${ticket.category}
      Concern Details: ${ticket.concern_details}
      Priority Level: ${ticket.priority_level}
      Status: ${ticket.status}
      Persons Involved: ${ticket.persons_involved || 'None specified'}
      Created: ${ticket.createdAt}
      Submitted By: ${ticket.UserCredential?.username || 'Unknown'}
    `).join('\n---\n');

    const summaryInfo = `
      Total Tickets: ${tickets.length}
      
      Tickets:
      ${ticketsSummary}
    `;

    // 5. Generate AI review using Perplexity API
    const chatCompletion = await client.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes support tickets. Provide a concise summary and a list of recommended actions in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze these tickets and respond with: 1) A brief summary, 2) Recommended actions as a JSON array:\n\n${summaryInfo}`
        }
      ],
    });

    const aiResponse = chatCompletion.choices[0].message.content;

    // 6. Parse the AI response to extract summary and actions
    let summary = '';
    let actions = [];

    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        actions = JSON.parse(jsonMatch[0]);
        summary = aiResponse.replace(jsonMatch[0], '').trim();
      } else {
        summary = aiResponse;
        actions = [{ action: 'Review tickets manually', priority: 'medium' }];
      }
    } catch (parseError) {
      console.warn('Failed to parse AI actions, using fallback');
      summary = aiResponse;
      actions = [{ action: 'Review tickets manually', priority: 'medium' }];
    }

    // 7. Generate AI reviews for each ticket
    const aiReviews = await Promise.all(
      tickets.map(async (ticket) => {
        const existingReview = await mdl_AIReview.findOne({
          where: { ticket_id: ticket.id }
        });

        if (existingReview) {
          await existingReview.update({
            summary,
            actions
          });
          return existingReview;
        } else {
          return await mdl_AIReview.create({
            ticket_id: ticket.id,
            summary,
            actions
          });
        }
      })
    );

    // 8. Emit Socket.IO event for real-time updates
    if (this.io) {
      this.io.emit('ai-review-generated', {
        reviewsCount: aiReviews.length,
        message: 'AI reviews generated successfully'
      });
    }

    return aiReviews;

  } catch (err) {
    throw err;
  }
}


  /**
   * Get AI review for a specific ticket ID
   * @param {String} ticketId - UUID of the ticket
   * @returns {Object} - AI review record with ticket details
   */
  async getAIReview(ticketId) {
    try {
      const aiReview = await mdl_AIReview.findOne({
        where: { ticket_id: ticketId },
        include: [
          {
            model: mdl_Tickets,
            include: [
              {
                model: mdl_UserCredentials,
                include: [
                  {
                    model: mdl_UserProfile
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!aiReview) {
        throw new Error('AI review not found for this ticket');
      }

      return aiReview;

    } catch (error) {
      console.error('Error fetching AI review:', error.message);
      throw error;
    }
  }

  /**
   * Get all AI reviews
   * @returns {Array} - All AI review records with ticket details
   */
  async getAllAIReviews() {
    try {
      return await mdl_AIReview.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: mdl_Tickets,
            include: [
              {
                model: mdl_UserCredentials,
                include: [
                  {
                    model: mdl_UserProfile
                  }
                ]
              }
            ]
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching all AI reviews:', error.message);
      throw error;
    }
  }
}

// Factory function for dependency injection
module.exports = (io) => new AIService(io);
