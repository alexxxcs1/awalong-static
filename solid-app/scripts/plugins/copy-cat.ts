import { Plugin } from "esbuild";
import { statSync, readdirSync, copyFileSync, existsSync, mkdirSync } from "fs-extra";
import * as path from "path";

type CopyOptions = {
    paths: Array<string>,
    output: string,
    copyOn?: "start" | "end",
    filter?: (path: string) => boolean
}
export const Copy = (opt:CopyOptions):Plugin => {
    const { copyOn = 'start', paths, filter, output } = opt || {};
    return {
        name: 'copy-cat',
        setup(build) {
            const doCopy = () => {
                for (const path_info of paths) {
                    walk(path_info, (p: string) => {
                        const dst = p.replace(path_info, output);
                        if (!existsSync(path.dirname(dst))) {
                            mkdirSync(path.dirname(dst), {
                                recursive: true
                            })
                        }
                        if(filter) {
                            const need_copy = filter(p);
                            if(need_copy) {
                                copyFileSync(p, dst);
                            }
                        }else{
                            copyFileSync(p, dst);
                        }
                    })
                }
            }
            if(copyOn === 'start') {
                build.onStart(() => {
                    doCopy();
                });
            }else {
                build.onEnd(() => {
                    doCopy();
                });
            }
        },
    }
}

const walk = (dir_path: string, callback: (p: string) => void) => {
    const stat = statSync(dir_path);
    if(stat.isDirectory()) {
        const childs = readdirSync(dir_path);
        for (const child of childs) {
            const p = path.join(dir_path, child);
            walk(p, callback);
        }
    }else{
        callback(dir_path);
    }
}