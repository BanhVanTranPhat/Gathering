/**
 * Client auth: gọi backend Gathering (Express + MongoDB).
 */
import { getToken, setToken, api, authLogout } from "../backendApi";

export function createClient() {
  return {
    auth: {
      async getSession() {
        const token = getToken();
        if (!token) return { data: { session: null } };
        try {
          const user = await api.get<{
            id: string;
            email?: string;
            displayName?: string;
          }>("/auth/me");
          return {
            data: {
              session: {
                access_token: token,
                user: {
                  id: user.id,
                  email: user.email,
                  user_metadata: {
                    email: user.email,
                    displayName: user.displayName,
                  },
                },
              },
            },
          };
        } catch {
          setToken(null);
          return { data: { session: null } };
        }
      },
      async getUser(accessToken?: string) {
        const token = accessToken || getToken();
        if (!token)
          return { data: { user: null }, error: { message: "No token" } };
        try {
          const user = await api.get<{
            id: string;
            email?: string;
            displayName?: string;
          }>("/auth/me");
          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: {
                  email: user.email,
                  displayName: user.displayName,
                },
              },
            },
            error: null,
          };
        } catch (e: any) {
          return {
            data: { user: null },
            error: { message: e?.message || "Invalid token" },
          };
        }
      },
      async signOut() {
        authLogout();
      },
      async signInWithOAuth(_opts: any) {
        return {
          data: null,
          error: { message: "Use email/password login. Go to /signin" },
        };
      },
    },
    from(table: string) {
      let method = "GET";
      let body: any = undefined;
      let path = table === "realms" ? "/realms" : "/profiles/me";
      let id: string | null = null;

      const run = async () => {
        if (method === "POST") return api.post(path, body);
        if (method === "PATCH") return api.patch(path, body);
        if (method === "DELETE") return api.delete(path);
        return api.get(path);
      };

      const chain: any = {
        select(_cols?: string) {
          path = table === "realms" ? "/realms" : "/profiles/me";
          return chain;
        },
        eq(col: string, val: string) {
          if (col === "id") id = val;
          if (table === "realms" && col === "id") path = `/realms/${val}`;
          if (table === "realms" && col === "share_id")
            path = `/realms/by-share/${val}`;
          return chain;
        },
        single: async () => {
          const data = await run();
          return { data: Array.isArray(data) ? data[0] : data, error: null };
        },
        insert(obj: any) {
          method = "POST";
          body =
            table === "realms"
              ? {
                  name: obj.name,
                  map_data: obj.map_data,
                  mapTemplate: obj.mapTemplate,
                }
              : obj;
          path = table === "realms" ? "/realms" : "/profiles/me";
          return chain;
        },
        update(obj: any) {
          method = "PATCH";
          body = obj;
          if (table === "realms" && id) path = `/realms/${id}`;
          if (table === "profiles") path = "/profiles/me";
          return chain;
        },
        delete() {
          method = "DELETE";
          if (table === "realms" && id) path = `/realms/${id}`;
          return chain;
        },
        then(resolve: (r: any) => any, reject?: (e: any) => void) {
          const normalize = (d: any) => {
            if (
              method === "GET" &&
              table === "realms" &&
              d &&
              !Array.isArray(d) &&
              Array.isArray(d.realms)
            )
              return d.realms;
            return d;
          };
          const p =
            method === "GET"
              ? run().then((d) => ({ data: normalize(d), error: null }))
              : method === "POST"
                ? run().then((d) => ({
                    data: Array.isArray(d) ? d : [d],
                    error: null,
                  }))
                : method === "PATCH"
                  ? run().then((d) => ({ data: d, error: null }))
                  : method === "DELETE"
                    ? run().then(() => ({ data: null, error: null }))
                    : Promise.resolve({ data: null, error: null });
          return p.then(resolve, reject);
        },
      };
      return chain;
    },
  };
}
