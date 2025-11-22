import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/index/route.tsx"),
  ...prefix("/api/v1", [route("/*", "routes/proxy.ts")]),
] satisfies RouteConfig;
