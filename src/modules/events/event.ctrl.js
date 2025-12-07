const EventService = require('./event.srv');

class EventController {
  constructor(io) {
    this.service = new EventService(io);
  }

  createEvent = async (req, res) => {
    try {
      const result = await this.service.createEvent(req.body);
      res.status(201).json({ success: true, event: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  updateEvent = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.service.updateEvent(id, req.body);

      res.status(200).json({ success: true, event: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllPublishedEvents = async (req, res) => {
    try {
      const events = await this.service.getAllPublishedEvents();
      res.status(200).json({ success: true, events });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  getAllEvents = async (req, res) => {
    try {
      const events = await this.service.getAllEvents();
      res.status(200).json({ success: true, events });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getAllMyEvents = async (req, res) => {
    try {
      const user_id = req.params.id;
      const myEvents = await this.service.getAllMyEvents(user_id);
      return res.status(200).json({ success: true, events: myEvents });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message })
    }
  }

  getEventById = async (req, res) => {
    try {
      const { id } = req.params;
      const event = await this.service.getEventById(id);
      res.status(200).json({ success: true, event });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };
}

module.exports = EventController;
