import { Copy } from "./plugins/copy-cat";
import { createStaticServer } from "./plugins/static-server";
import { STATIC, getBuildConfig, getBuildContext } from "./util"

const start = async () => {
    const options = await getBuildConfig();
    options.plugins = [
        ...(options.plugins || []),
        createStaticServer({
            server: { root: options.outdir }
        }),
        Copy({
            paths: [STATIC],
            output: options.outdir!
        })
    ]
    const context = await getBuildContext(options);
    await context.rebuild();
    context.watch()
}

start();