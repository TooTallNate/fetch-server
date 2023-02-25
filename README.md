
Deploy to a Vercel API endpoint:

```
import fetchServer from 'fetch-server';

export default fetchServer(async req => {
    console.log(req.url);
    console.log(req.headers.get('x-custom'));

    return Response.json({ hello: 'world' });
});
```

Standalone:

```
import http from 'node:http';
import fetchServer from 'fetch-server';

const server = http.createServer(fetchServer(async req => {
    console.log(req.url);
    console.log(req.headers.get('x-custom'));

    return Response.json({ hello: 'world' });
}));
```