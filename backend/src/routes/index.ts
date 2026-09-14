import type { Express } from "express";

import { adminRouter } from "./admin.routes.js";
import { ageVerificationRouter } from "./age-verification.routes.js";
import { authRouter } from "./auth.routes.js";
import { bookingRouter } from "./booking.routes.js";
import { cinemasRouter, concessionsRouter, moviesRouter, showtimesRouter } from "./catalog.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { ticketRouter } from "./ticket.routes.js";

export function mountRoutes(app: Express) {
  app.use("/auth", authRouter);
  app.use("/movies", moviesRouter);
  app.use("/cinemas", cinemasRouter);
  app.use("/concessions", concessionsRouter);
  app.use("/showtimes", showtimesRouter);
  app.use("/bookings", bookingRouter);
  app.use("/age-verification", ageVerificationRouter);
  app.use("/payments", paymentRouter);
  app.use("/tickets", ticketRouter);
  app.use("/notifications", notificationRouter);
  app.use("/admin", adminRouter);
}
