import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import User from "../../models/User";
import Profile from "../../models/Profile";
import Realm from "../../models/Realm";
import Event from "../../models/Event";
import Resource from "../../models/Resource";
import Service from "../../models/Service";
import Thread from "../../models/Thread";
import Post from "../../models/Post";
import ChatMessage from "../../models/ChatMessage";
import ChatChannel from "../../models/ChatChannel";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    }),
  )
  .derive(async ({ headers, jwt, set }) => {
    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      return { adminUser: null };
    }
    const token = auth.split(" ")[1];
    const decoded = await jwt.verify(token);
    if (!decoded) return { adminUser: null };

    const user = await User.findById(decoded.userId).lean();
    if (!user || user.role !== "admin") return { adminUser: null };

    return { adminUser: user };
  })
  .onBeforeHandle(({ adminUser, set }) => {
    if (!adminUser) {
      set.status = 403;
      return { message: "Forbidden: admin only" };
    }
  })
  .get("/stats", async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalRealms,
      totalEvents,
      totalResources,
      totalServices,
      totalThreads,
      totalPosts,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Realm.countDocuments(),
      Event.countDocuments(),
      Resource.countDocuments(),
      Service.countDocuments(),
      Thread.countDocuments(),
      Post.countDocuments(),
      ChatMessage.countDocuments(),
    ]);

    return {
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalRealms,
      totalEvents,
      totalResources,
      totalServices,
      totalThreads,
      totalPosts,
      totalMessages,
    };
  })
  .get("/stats/forum-activity", async () => {
    // Basic mock stats for forum activity since the full analytical pipeline might be heavy
    // We return some basic numbers for threads and active posts
    return {
      activeThreads: await Thread.countDocuments(),
      recentPosts: await Post.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      topContributors: [], // Could be an aggregation if needed
    };
  })
  .get("/stats/users-trend", async () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const pipeline = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      pipeline.map((r) => [`${r._id.y}-${r._id.m}`, r.count]),
    );
    const months: { label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      months.push({
        label: d.toLocaleDateString("vi-VN", {
          month: "short",
          year: "numeric",
        }),
        count: countMap.get(key) || 0,
      });
    }
    return { months };
  })
  .get("/stats/resources-by-type", async () => {
    const result = await Resource.aggregate([
      { $group: { _id: "$content_type", count: { $sum: 1 } } },
    ]);
    return {
      distribution: result.map((r) => ({ type: r._id, count: r.count })),
    };
  })
  .get("/stats/realms-per-owner", async () => {
    const result = await Realm.aggregate([
      { $group: { _id: "$owner_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const ownerIds = result.map((r) => r._id);
    const users = await User.find(
      { _id: { $in: ownerIds } },
      "displayName email",
    ).lean();
    const userMap = new Map(
      users.map((u) => [(u as any)._id.toString(), u.displayName || u.email]),
    );
    return {
      owners: result.map((r) => ({
        ownerId: r._id,
        name: userMap.get(r._id) || r._id,
        count: r.count,
      })),
    };
  })
  .get("/users", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const q = query.q as string;
    const filter: any = {};
    if (q) {
      const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { email: new RegExp(escaped, "i") },
        { displayName: new RegExp(escaped, "i") },
      ];
    }
    const total = await User.countDocuments(filter);
    const usersList = await User.find(filter, "-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return {
      users: usersList,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .patch("/users/:id/role", async ({ params, body, set }) => {
    const { role } = body as any;
    if (!["user", "admin"].includes(role)) {
      set.status = 400;
      return { message: "Invalid role" };
    }
    const user = await User.findByIdAndUpdate(
      params.id,
      { role },
      { new: true },
    )
      .select("-password")
      .lean();
    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }
    return { user };
  })
  .delete("/users/:id", async ({ params, adminUser, set }) => {
    if ((adminUser as any)._id.toString() === params.id) {
      set.status = 400;
      return { message: "Cannot delete yourself" };
    }
    const user = await User.findById(params.id);
    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }
    const uid = user._id.toString();
    await Promise.all([
      Profile.deleteMany({ id: uid }),
      Realm.deleteMany({ owner_id: uid }),
      Event.deleteMany({ createdBy: uid }),
      Resource.deleteMany({ createdBy: uid }),
      Thread.deleteMany({ authorId: uid }),
      Post.deleteMany({ authorId: uid }),
      User.findByIdAndDelete(uid),
    ]);
    set.status = 204;
    return;
  })
  .get("/realms", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const total = await Realm.countDocuments();
    const realms = await Realm.find({}, "-map_data")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return {
      realms,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .delete("/realms/:id", async ({ params, set }) => {
    const realm = await Realm.findById(params.id);
    if (!realm) {
      set.status = 404;
      return { message: "Realm not found" };
    }
    const realmId = (realm as any).id || realm._id.toString();
    const shareId = realm.share_id;
    await Promise.all([
      Event.deleteMany({ realmId }),
      Thread.deleteMany({ realmId }).then(async () => {
        const threadIds = (
          await Thread.find({ realmId }).select("_id").lean()
        ).map((t) => t._id);
        if (threadIds.length)
          await Post.deleteMany({ threadId: { $in: threadIds } });
      }),
      Resource.deleteMany({ realmId }),
      ChatChannel.find({ realmId }).then(async (channels) => {
        const channelIds = channels.map((c) => c._id);
        if (channelIds.length)
          await ChatMessage.deleteMany({ channelId: { $in: channelIds } });
        await ChatChannel.deleteMany({ realmId });
      }),
      Realm.findByIdAndDelete(params.id),
    ]);
    if (shareId) {
      await Profile.updateMany(
        { visited_realms: shareId },
        { $pull: { visited_realms: shareId } },
      );
    }
    set.status = 204;
    return;
  })
  .get("/events", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const total = await Event.countDocuments();
    const events = await Event.find({})
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .delete("/events/:id", async ({ params, set }) => {
    const event = await Event.findOne({
      $or: [{ eventId: params.id }, { _id: params.id }],
    });
    if (!event) {
      set.status = 404;
      return { message: "Event not found" };
    }
    await Event.deleteOne({ _id: event._id });
    set.status = 204;
    return;
  })
  .get("/resources", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const total = await Resource.countDocuments();
    const resources = await Resource.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      resources,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .delete("/resources/:id", async ({ params, set }) => {
    const resource = await Resource.findById(params.id);
    if (!resource) {
      set.status = 404;
      return { message: "Resource not found" };
    }
    await Resource.deleteOne({ _id: resource._id });
    set.status = 204;
    return;
  })
  .get("/threads", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const total = await Thread.countDocuments();
    const threads = await Thread.find({})
      .sort({ lastPostAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      threads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .delete("/threads/:id", async ({ params, set }) => {
    const thread = await Thread.findById(params.id);
    if (!thread) {
      set.status = 404;
      return { message: "Thread not found" };
    }
    await Promise.all([
      Post.deleteMany({ threadId: thread._id }),
      Thread.deleteOne({ _id: thread._id }),
    ]);
    set.status = 204;
    return;
  })
  .get("/services", async ({ query }) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const q = String(query.q || "").trim();
    const status = String(query.status || "all");

    const filter: any = {};
    if (status === "approved") filter.isApproved = true;
    if (status === "pending") filter.isApproved = false;
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { title: regex },
        { category: regex },
        { description: regex },
        { createdByName: regex },
      ];
    }

    const total = await Service.countDocuments(filter);
    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      services,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
  })
  .patch("/services/:id/approval", async ({ params, body, set }) => {
    const { isApproved } = body as any;
    if (typeof isApproved !== "boolean") {
      set.status = 400;
      return { message: "isApproved must be boolean" };
    }

    const service = await Service.findByIdAndUpdate(
      params.id,
      { isApproved },
      { new: true },
    ).lean();
    if (!service) {
      set.status = 404;
      return { message: "Service not found" };
    }

    return { service };
  })
  .patch("/services/bulk-approval", async ({ body, set }) => {
    const { ids, isApproved } = body as any;
    if (!Array.isArray(ids) || !ids.length || typeof isApproved !== "boolean") {
      set.status = 400;
      return {
        message: "ids (non-empty array) and isApproved (boolean) are required",
      };
    }

    const normalizedIds = ids
      .map((id) => String(id || "").trim())
      .filter(Boolean)
      .slice(0, 200);

    const result = await Service.updateMany(
      { _id: { $in: normalizedIds } },
      { $set: { isApproved } },
    );

    return { updated: result.modifiedCount || 0 };
  })
  .delete("/services/:id", async ({ params, set }) => {
    const service = await Service.findById(params.id);
    if (!service) {
      set.status = 404;
      return { message: "Service not found" };
    }

    await Service.deleteOne({ _id: service._id });
    set.status = 204;
    return;
  });
