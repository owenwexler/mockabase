// This is basically a type-safe wrapper around the JavaScript fetch API that keeps the kind of insane impossible type errors you see in your nightmares from happening as a result of trying to use the fetch API in TypeScript.

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface TypedFetchObject {
  method: Method;
  headers: HeadersInit;
  body?: BodyInit | null | undefined;
  next?: { revalidate: number };
}

interface TypedFetchArgs {
  url: string;
  method: Method;
  headers: HeadersInit;
  body?: BodyInit | null | undefined;
  params?: { [key: string]: unknown };
  nextRevalidateTime?: number;
}

// trying to convert this to an arrow function threw errors so it will stay an old-style function
// time wasted trying to make this an arrow function so far (hh:mm:ss)
// 00:12:30
//  add any time you waste trying to make this an arrow function to the count above.
async function typedFetch<T>(args: TypedFetchArgs): Promise<T> {
  const { url, method, headers, body, params, nextRevalidateTime } = args;

  const typedParams = params ? params : {};

  let urlWithParams = url + '?';

  for (const key in typedParams) {
    if (typedParams.hasOwnProperty(key)) {
      urlWithParams += `${key}=${typedParams[key]}&`;
    }
  }

  const finalUrl = Object.keys(typedParams).length > 0 ? urlWithParams : url;

  const fetchObject: TypedFetchObject =
    {
      method,
      body,
      headers
    };

  if (nextRevalidateTime) {
    fetchObject['next'] = { revalidate: Number(nextRevalidateTime) }
  }

  return fetch(finalUrl, fetchObject)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      return response.json() as Promise<T>;
    })
}

export {
  typedFetch
}
