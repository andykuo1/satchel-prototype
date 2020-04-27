// Textbook RSA for digital signatures (NOT secure for ACTUAL use, just fun)

function millerRabinPrimalityTest(n, t = 64)
{
    // SOURCE: Handbook of Applied Cryptography [4.24] (A. Menezes, P. van Oorschot, S. Vanstone)
    if (n <= 0) throw new Error('n must be a positive odd integer.');
    if (n === 1 || n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;
    if (t < 1) throw new Error('t must be positive.');

    let r;
    let s = 1;
    while((r = Math.trunc((n - 1) / Math.pow(2, s))) % 2 === 0) ++s;

    for(let i = 0; i < t; ++i)
    {
        let a = randomInt(2, n - 1);
        let y = Math.pow(a, r) % n;
        if (y !== 1 && y !== n - 1)
        {
            let j = 1;
            while(j <= s - 1 && y !== n - 1)
            {
                y = Math.pow(y, 2) % n;
                if (y === 1) return false;
                j += 1;
            }
            if (y !== n - 1) return false;
        }
    }

    return true;
}

function randomInt(min, max)
{
    return Math.trunc((crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF) * (max - min)) + min;
}

/*
function generateLargePrimeNumber()
{
    let i = 0;
    let result = Math.abs(crypto.getRandomValues(new Uint32Array(1))[0]);
    while(!millerRabinPrimalityTest(result))
    {
        result = Math.abs(result + 2);
        ++i;
        if (i > 1000000) throw new Error('too many steps');
    }
    return result;
}

let p = 53;
let q = 59;
let n = p * q;
let totient = (p - 1) * (q - 1);

// 65537
let e = Math.abs(randomInt(2, totient));
let publicKey = [e, n];

let k = 2;
let d = Math.trunc((totient * k + 1) / e);
let privateKey = [d, n];

console.log(publicKey, privateKey);

function encrypt()
{

}

function decrypt()
{

}

function getCharCodesFromString(s)
{
    let result = new Array(s.length);
    for(let i = 0; i < result.length; ++i)
    {
        result[i] = s.charCodeAt(i);
    }
    return result;
}
*/