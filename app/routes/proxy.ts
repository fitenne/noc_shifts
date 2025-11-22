import { API_ORIGIN } from "~/config";
import type { Route } from "../+types/root";
import ky from "ky";

export async function action({ request }: Route.ActionArgs) {
  const thisUrl = new URL(request.url);
  const toUrl = new URL(thisUrl.pathname, API_ORIGIN);

  return ky(toUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}
