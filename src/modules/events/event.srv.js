const mdl_Events = require('../events/event.mdl');
const mdl_UserCredentials = require('../user_creds/user_creds.mdl');
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const sequelize = require('../../../config/db.config');
const { asyncTaskRunner } = require('../../utils/async_task_runner.utils');
const EmailService = require('../email/email.srv');

class EventService {
  constructor(io) {
    this.io = io;
  }

  // Create Event
  async createEvent(payload) {
    const t = await sequelize.transaction();

    try {
      const { created_by } = payload;
      const profile = await mdl_UserProfile.findOne({
        where: { user_id: created_by },
        transaction: t
      });

      if (!profile) {
        throw new Error("User profile does not exist. Complete profile first.");
      }

      const newEvent = await mdl_Events.create(payload, { transaction: t });
      await t.commit();

      this.io.emit("EVENT_CREATED", newEvent);
      return newEvent;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // Update Event

  async updateEvent(eventId, payload) {
    const t = await sequelize.transaction();

    try {
      const event = await mdl_Events.findByPk(eventId);

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if the event was previously unpublished
      const wasPreviouslyPublished = event.is_published === true;

      // Update event
      await event.update(payload, { transaction: t });
      await t.commit();

      // If this update toggles is_published → true for the first time
      if (payload.is_published === true && !wasPreviouslyPublished) {
        asyncTaskRunner(async () => {
          const users = await mdl_UserCredentials.findAll({
            attributes: ["email"],
            where: { is_active: true }
          });

          const emails = users.map(u => u.email).filter(Boolean);

          const eventData = {
            category: event.category,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location
          };

          for (const email of emails) {
            await EmailService.sendEventAnnouncement({
              email,
              event: eventData
            });
          }

          console.log("Event announcement broadcast completed.");
        });
      }

      // Emit real-time update
      this.io.emit("EVENT_UPDATED", event);
      return event;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // List all events
  async getAllEvents() {
    return await mdl_Events.findAll({
      include: [
        {
          model: mdl_UserCredentials,
          as: "EventCreator",
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });
  }

  // Get all my events
  async getAllMyEvents(user_id) {
    return mdl_Events.findAll({
      where: { created_by: user_id },

      include: [
        {
          model: mdl_UserCredentials,
          as: 'EventCreator',
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });
  }

  // Get event by ID
  async getEventById(eventId) {
    const event = await mdl_Events.findByPk(eventId, {
      include: [
        {
          model: mdl_UserCredentials,
          as: "EventCreator",
          include: [
            {
              model: mdl_UserProfile
            }
          ]
        }
      ]
    });

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  }
}

module.exports = EventService;
