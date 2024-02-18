import { Plugin } from "esbuild";
import { existsSync, readFileSync, statSync } from "fs";
import { IncomingMessage, ServerResponse, createServer } from "http";
import * as path from "path";
import * as mime from 'mime-types';

type PluginOptions = {
    server?: StaticServerOptions
}
export const createStaticServer = (opt?: PluginOptions):Plugin => {
    let promise: (Promise<void> & {resolver: () => void})| null;
    const server = getStaticServer({
        ...(opt?.server || {}),
        async onRequest(req, res) {
            await promise;
            return false;
        },
    });
    return {
        name: 'static-server-plugin',
        setup(build) {
            build.onStart(() => {
                let _resolver: NonNullable<typeof promise>['resolver'];
                promise = new Promise(resolver => {
                    _resolver = resolver
                }) as typeof promise;
                promise!.resolver = _resolver!;
            });
            build.onEnd(() => {
                promise?.resolver();
                promise = null;
            });
        },
    }
}

type StaticServerOptions = {
    port?: number,
    root?: string,
    onRequest?: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => Promise<boolean> | boolean
}
const getStaticServer = (opt?: StaticServerOptions) => {
    const port = opt?.port || 3001;
    const root_path = opt?.root || process.cwd();
    const getURL = (static_path: string) => {
        const font_file = path.join(root_path, static_path);
        if(!existsSync(font_file)) return void 0;
        if(statSync(font_file).isDirectory()) return void 0;
        return font_file
    }
    const server = createServer(async (req, res) => {
        const custom_handled = await opt?.onRequest?.(req, res);
        if(custom_handled) {
            return;
        }
        const url = req.url;
        
        if(!url) {
            res.end(404);
            return;
        }
        let resource_path = url;
        console.log(url);
        if(url.endsWith('/')) {
            resource_path += 'index.html'
        }
        const static_path = getURL(resource_path);
        if(static_path) {
            const content = readFileSync(static_path);
            const mime_type = mime.contentType(path.extname(static_path))
            res.setHeader('content-type', mime_type || 'application/octet-stream');
            res.end(content);
            return;
        }else{
            res.statusCode = 404;
            res.end('not found');
            return;
        }
        
    });
    server.listen(port);
    return server;
}