
const realServer = new Proxy({} as ServerFunctions, {
    get(_, prop: string) {
        return (...args: unknown[]) => {
            return new Promise((resolve, reject) => {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                [prop](...args);
            });
        };
    },
})

export const server = realServer as ServerFunctions;