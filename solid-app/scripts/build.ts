import { rimrafSync } from "rimraf";
import { Copy } from "./plugins/copy-cat";
import { STATIC, getBuildConfig, getBuildContext } from "./util"

const build = async () => {
    const options = await getBuildConfig();
    options.plugins = [
        ...(options.plugins || []),
        Copy({
            paths: [STATIC],
            output: options.outdir!
        })
    ]
    const context = await getBuildContext(options);
    console.log(options.outdir);
    // rimrafSync(options.outdir!);
    await context.rebuild();
}

build();