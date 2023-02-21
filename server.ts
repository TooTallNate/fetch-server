import { createServer } from "http";
import createFetchServer from './';

const server = createServer(createFetchServer(req => {
    console.log(req.url);
    console.log(req.headers);
    return new Response('hello world!', { headers: { 'content-type': 'foo' }});
}));

server.listen(3000);