export const NumberPair = {
    parse(string)
    {
        if (!string) return [0, 0];
        string = string.trim();
        let a, b;
        let i = string.indexOf(' ');
        let k = i;
        a = Number(string.substring(0, k));
        b = Number(string.substring(k + 1).trim());
        return [a, b];
    },
    stringify(value)
    {
        if (value)
        {
            let a = value[0];
            let b = value[1];
            return `${a} ${b}`;
        }
        else
        {
            return '';
        }
    },
};
