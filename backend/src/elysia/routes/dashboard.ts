import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import Event from "../../models/Event";
import Resource from "../../models/Resource";
import Thread from "../../models/Thread";
import Service from "../../models/Service";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    }),
  )
  .derive(async ({ headers, jwt }) => {
    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      return { user: null };
    }
    const token = auth.split(" ")[1];
    const user = await jwt.verify(token);
    return { user: user || null };
  })
  .get("/summary", async ({ user, query, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    const realmIds = String((query as any).realmIds || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const eventFilter: any = realmIds.length
      ? { realmId: { $in: realmIds } }
      : { createdBy: (user as any).userId || (user as any).id };
    const resourceFilter: any = realmIds.length
      ? {
          $or: [{ realmId: { $in: realmIds } }, { realmId: null }],
          isApproved: true,
        }
      : { isApproved: true };
    const threadFilter: any = realmIds.length
      ? { realmId: { $in: realmIds } }
      : {};
    const serviceFilter: any = realmIds.length
      ? {
          $or: [{ realmId: { $in: realmIds } }, { realmId: null }],
          isApproved: true,
        }
      : { isApproved: true };

    const now = new Date();

    const [
      upcomingEvents,
      recentResources,
      recentThreads,
      featuredServices,
      totalEvents,
      totalResources,
      totalThreads,
      totalServices,
    ] = await Promise.all([
      Event.find({ ...eventFilter, startTime: { $gte: now } })
        .sort({ startTime: 1 })
        .limit(5)
        .lean(),
      Resource.find(resourceFilter).sort({ createdAt: -1 }).limit(5).lean(),
      Thread.find(threadFilter)
        .sort({ lastPostAt: -1, updatedAt: -1 })
        .limit(5)
        .lean(),
      Service.find(serviceFilter).sort({ createdAt: -1 }).limit(5).lean(),
      Event.countDocuments(eventFilter),
      Resource.countDocuments(resourceFilter),
      Thread.countDocuments(threadFilter),
      Service.countDocuments(serviceFilter),
    ]);

    return {
      counts: {
        events: totalEvents,
        resources: totalResources,
        threads: totalThreads,
        services: totalServices,
      },
      upcomingEvents,
      recentResources,
      recentThreads,
      featuredServices,
    };
  });
