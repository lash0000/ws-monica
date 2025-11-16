const TicketServiceFactory = require("./ticket.srv");

module.exports = (io) => {
  const TicketService = TicketServiceFactory(io);

  io.on("connection", (socket) => {
    socket.on("tickets:fetch_all", async () => {
      socket.emit("tickets:list", await TicketService.getAllTickets());
    });

    socket.on("tickets:refresh_one", async (id) => {
      socket.emit("tickets:one", await TicketService.getTicketById(id));
    });
  });
};
