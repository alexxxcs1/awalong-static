export const randomArray = <T extends Array<any>>(arr: T):T => {
    const tmp_arr = [...arr];
    const result = [];
    for (const _ of arr) {
        let idx = Math.floor(Math.random() * tmp_arr.length);
        idx === tmp_arr.length && (idx -= 1);
        const data = tmp_arr.splice(idx, 1);
        result.push(...data);
    }
    return result as T;
}