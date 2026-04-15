import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import User from "../../models/User";
import { comparePassword, hashPassword } from "../../models/User";
import { sendEmail } from "../../utils/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  sub?: string;
};

async function verifyGoogleCredential(credential: string) {
  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const res = await fetch(tokenInfoUrl);
  if (!res.ok) {
    throw new Error("Invalid Google credential");
  }

  const info = (await res.json()) as GoogleTokenInfo;
  if (GOOGLE_CLIENT_ID && info.aud && info.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google client mismatch");
  }

  const isVerified =
    info.email_verified === true || info.email_verified === "true";
  if (!info.email || !isVerified || !info.sub) {
    throw new Error("Google account data is incomplete");
  }

  return {
    email: info.email,
    googleId: info.sub,
    username: info.name,
    avatar: info.picture,
  };
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
    }),
  )
  .post(
    "/send-otp",
    async ({ body, set }) => {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        set.status = 503;
        return {
          message:
            "SMTP chưa cấu hình (thiếu SMTP_USER/SMTP_PASS), chưa thể gửi OTP.",
        };
      }

      const email = String((body as any)?.email || "")
        .trim()
        .toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        set.status = 400;
        return { message: "Email không hợp lệ" };
      }

      const now = Date.now();
      const existing = otpStore.get(email);
      if (existing && existing.lastSentAt + OTP_COOLDOWN_MS > now) {
        set.status = 429;
        return { message: "Vui lòng chờ trước khi gửi lại mã" };
      }

      const user = await User.findOne({ email }).lean();
      const isNewUser = !user;
      const code = String(Math.floor(100000 + Math.random() * 900000));
      otpStore.set(email, {
        code,
        expiresAt: now + OTP_TTL_MS,
        isNewUser,
        lastSentAt: now,
      });

      await sendEmail({
        to: email,
        subject: "The Gathering - OTP code",
        html: `<p>Mã OTP của bạn là <b>${code}</b>. Mã có hiệu lực trong 5 phút.</p>`,
      });

      return { sent: true, isNewUser };
    },
    {
      body: t.Object({ email: t.String() }),
    },
  )
  .post(
    "/verify-otp",
    async ({ body, jwt, set }) => {
      const email = String((body as any)?.email || "")
        .trim()
        .toLowerCase();
      const code = String((body as any)?.code || "").trim();
      const displayName = String((body as any)?.displayName || "").trim();

      const otp = otpStore.get(email);
      if (!otp || otp.expiresAt < Date.now() || otp.code !== code) {
        set.status = 400;
        return { message: "Mã OTP không đúng hoặc đã hết hạn" };
      }
      otpStore.delete(email);

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          displayName: displayName || email.split("@")[0],
          role: "user",
        });
      } else if (!user.displayName && displayName) {
        user.displayName = displayName;
        await user.save();
      }

      const token = await jwt.sign({
        userId: (user as any)._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: (user as any).role || "user",
      });

      return {
        token,
        user: {
          id: (user as any)._id.toString(),
          email: user.email,
          displayName: user.displayName,
          role: (user as any).role || "user",
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
        displayName: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const email = String((body as any)?.email || "")
        .trim()
        .toLowerCase();
      const password = String((body as any)?.password || "");
      const displayName = String((body as any)?.displayName || "").trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
        set.status = 400;
        return { message: "Email hoặc mật khẩu không hợp lệ" };
      }
      const existing = await User.findOne({ email }).lean();
      if (existing) {
        set.status = 409;
        return { message: "Email đã tồn tại" };
      }

      const user = await User.create({
        email,
        password: await hashPassword(password),
        displayName: displayName || email.split("@")[0],
        role: "user",
      });

      const token = await jwt.sign({
        userId: (user as any)._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: (user as any).role || "user",
      });

      return {
        token,
        user: {
          id: (user as any)._id.toString(),
          email: user.email,
          displayName: user.displayName,
          role: (user as any).role || "user",
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        displayName: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const email = String((body as any)?.email || "")
        .trim()
        .toLowerCase();
      const password = String((body as any)?.password || "");

      const user = await User.findOne({ email });
      if (!user || !user.password) {
        set.status = 401;
        return { message: "Sai email hoặc mật khẩu" };
      }
      const ok = await comparePassword(password, user.password);
      if (!ok) {
        set.status = 401;
        return { message: "Sai email hoặc mật khẩu" };
      }

      const token = await jwt.sign({
        userId: (user as any)._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: (user as any).role || "user",
      });
      return {
        token,
        user: {
          id: (user as any)._id.toString(),
          email: user.email,
          displayName: user.displayName,
          role: (user as any).role || "user",
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  )
  .post("/google", async ({ body, jwt, set }) => {
    const { credential, email, googleId, username, avatar } = body as any;

    let resolvedEmail = email;
    let resolvedGoogleId = googleId;
    let resolvedUsername = username;
    let resolvedAvatar = avatar;

    if (credential) {
      try {
        const info = await verifyGoogleCredential(credential);
        resolvedEmail = info.email;
        resolvedGoogleId = info.googleId;
        resolvedUsername = info.username;
        resolvedAvatar = info.avatar;
      } catch (_err) {
        set.status = 401;
        return { message: "Google credential is invalid or expired" };
      }
    }

    if (!resolvedEmail) {
      set.status = 400;
      return { message: "Email is required" };
    }
    const normalizedEmail = resolvedEmail.trim().toLowerCase();
    const orQuery = [{ email: normalizedEmail }];
    if (resolvedGoogleId) orQuery.unshift({ googleId: resolvedGoogleId });
    let user = await User.findOne({ $or: orQuery });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        googleId: resolvedGoogleId,
        displayName: resolvedUsername || normalizedEmail.split("@")[0],
        avatar: resolvedAvatar,
      });
    } else {
      if (!user.googleId && resolvedGoogleId) {
        user.googleId = resolvedGoogleId;
      }
      if (resolvedAvatar && !user.avatar) {
        user.avatar = resolvedAvatar;
      }
      if (!user.displayName && resolvedUsername) {
        user.displayName = resolvedUsername;
      }
      if (user.isModified()) {
        await user.save();
      }
    }

    const token = await jwt.sign({
      userId: (user as any)._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: (user as any).role || "user",
    });

    return {
      token,
      user: {
        id: (user as any)._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: (user as any).role || "user",
      },
    };
  })
  .get("/me", async ({ headers, set, jwt }) => {
    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
    const token = auth.split(" ")[1];
    const decoded = await jwt.verify(token);
    if (!decoded) {
      set.status = 401;
      return { message: "Invalid token" };
    }
    return {
      id: decoded.userId,
      email: decoded.email,
      displayName: decoded.displayName,
      role: decoded.role || "user",
    };
  });

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const otpStore = new Map<
  string,
  { code: string; expiresAt: number; isNewUser: boolean; lastSentAt: number }
>();
