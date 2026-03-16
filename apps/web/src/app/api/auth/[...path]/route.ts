type AuthRouteContext = {
  params: { path?: string[] } | Promise<{ path?: string[] }>;
};

const getServerAuthBase = () => {
  const url = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SERVER_URL is required for web auth proxy requests",
    );
  }

  return new URL(url);
};

const toServerUrl = async (path: string[], requestUrl: string): Promise<URL> => {
  const pathname =
    path.length === 0 ? "/api/auth" : `/api/auth/${path.join("/")}`;
  const targetUrl = new URL(pathname, getServerAuthBase());
  const requestUrlObject = new URL(requestUrl);

  targetUrl.search = requestUrlObject.search;

  return targetUrl;
};

const handleAuthProxy = async (
  request: Request,
  context: AuthRouteContext,
): Promise<Response> => {
  const { path = [] } = await context.params;
  const target = await toServerUrl(path, request.url);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("referer");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return fetch(target, init);
};

export const GET = (request: Request, context: AuthRouteContext) =>
  handleAuthProxy(request, context);

export const POST = (request: Request, context: AuthRouteContext) =>
  handleAuthProxy(request, context);
