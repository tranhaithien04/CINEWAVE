import { Router } from "express";

import * as adminController from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/overview", adminController.overview);
adminRouter.get("/reports/revenue", adminController.revenue);

adminRouter.get("/movies", adminController.listMovies);
adminRouter.post("/movies", adminController.createMovie);
adminRouter.patch("/movies/:id", adminController.updateMovie);
adminRouter.delete("/movies/:id", adminController.deleteMovie);

adminRouter.get("/showtimes", adminController.listShowtimes);
adminRouter.post("/showtimes", adminController.createShowtime);
adminRouter.patch("/showtimes/:id", adminController.updateShowtime);
adminRouter.delete("/showtimes/:id", adminController.deleteShowtime);
adminRouter.post("/showtimes/:id/close", adminController.closeShowtime);

adminRouter.get("/bookings", adminController.listBookings);
adminRouter.post("/bookings/:id/cancel", adminController.cancelBooking);
adminRouter.post("/bookings/:id/refund", adminController.refundBooking);

adminRouter.get("/tickets", adminController.listTickets);
adminRouter.post("/tickets/:code/check-in", adminController.checkInTicket);

adminRouter.get("/users", adminController.listUsers);
adminRouter.patch("/users/:id", adminController.changeUserRole);
