import { Elysia } from "elysia";
import { authRoutes } from "./auth";
import { realmRoutes } from "./realms";
import { adminRoutes } from "./admin";
import { profileRoutes } from "./profiles";
import { chatRoutes } from "./chat";
import { eventRoutes } from "./events";
import { forumRoutes } from "./forum";
import { resourceRoutes } from "./resources";
import { serviceRoutes } from "./services";
import { dashboardRoutes } from "./dashboard";

export const apiRoutes = new Elysia()
  .use(authRoutes)
  .use(realmRoutes)
  .use(adminRoutes)
  .use(profileRoutes)
  .use(chatRoutes)
  .use(eventRoutes)
  .use(forumRoutes)
  .use(resourceRoutes)
  .use(serviceRoutes)
  .use(dashboardRoutes);
