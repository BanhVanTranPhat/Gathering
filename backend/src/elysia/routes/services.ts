import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import Service from "../../models/Service";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const serviceRoutes = new Elysia({ prefix: "/services" })
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
  .get("/", async ({ query, user }) => {
    const { realmId, category, q, page: pageStr } = query as any;
    const page = Math.max(1, Number(pageStr) || 1);
    const limit = 12;

    const userId = user ? (user as any).userId || (user as any).id : null;
    const filter: any = userId
      ? { $or: [{ isApproved: true }, { createdBy: userId }] }
      : { isApproved: true };
    if (realmId) filter.$or = [{ realmId }, { realmId: null }];
    if (category && category !== "all") filter.category = category;

    if (q && typeof q === "string" && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$and = [
        {
          $or: [
            { title: regex },
            { description: regex },
            { category: regex },
            { tags: regex },
          ],
        },
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
  .post("/", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    const userId = (user as any).userId || (user as any).id;
    const {
      title,
      category,
      description,
      contactEmail,
      contactPhone,
      contactUrl,
      tags,
      realmId,
      createdByName,
    } = body as any;

    if (!title || !category || !description) {
      set.status = 400;
      return { message: "title, category and description are required" };
    }

    const normalizedTags = Array.isArray(tags)
      ? tags
          .map((tag) => String(tag || "").trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

    const service = await Service.create({
      title: title.slice(0, 160),
      category: category.slice(0, 80),
      description: description.slice(0, 3000),
      contactEmail: (contactEmail || "").slice(0, 200),
      contactPhone: (contactPhone || "").slice(0, 60),
      contactUrl: (contactUrl || "").slice(0, 500),
      tags: normalizedTags,
      realmId: realmId || null,
      createdBy: userId,
      createdByName: (createdByName || "").slice(0, 100),
      isApproved: (user as any).role === "admin",
    });

    set.status = 201;
    return { service };
  })
  .delete("/:id", async ({ params, user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    const userId = (user as any).userId || (user as any).id;
    const isAdmin = (user as any).role === "admin";
    const service = await Service.findById(params.id);
    if (!service) {
      set.status = 404;
      return { message: "Not found" };
    }

    if (service.createdBy !== userId && !isAdmin) {
      set.status = 403;
      return { message: "Forbidden" };
    }

    await Service.deleteOne({ _id: service._id });
    set.status = 204;
    return;
  });
