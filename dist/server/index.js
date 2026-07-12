const HTML_FALLBACK = "/index.html";

function buildRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

async function fetchAsset(env, request, pathname) {
  return env.ASSETS.fetch(buildRequest(request, pathname));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    let response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    if (pathname === "/") {
      return fetchAsset(env, request, HTML_FALLBACK);
    }

    if (!pathname.includes(".")) {
      response = await fetchAsset(env, request, pathname.replace(/\/?$/, "/index.html"));
      if (response.status !== 404) return response;

      response = await fetchAsset(env, request, pathname + ".html");
      if (response.status !== 404) return response;
    }

    return new Response("Not found", { status: 404 });
  },
};
