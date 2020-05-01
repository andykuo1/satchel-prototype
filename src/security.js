async function generateKeyPair()
{
    return window.crypto.subtle
        .generateKey({
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: 'SHA-256' },
        },
        true,
        [ 'sign', 'verify' ])
        .then(key => [ key.publicKey, key.privateKey ]);
}

async function sign(privateKey, data)
{
    return window.crypto.subtle
        .sign({
            name: 'RSA-PSS',
            saltLength: 128,
        },
        privateKey,
        data);
}

async function verify(publicKey, data, signature)
{
    return window.crypto.subtle
        .verify({
            name: 'RSA-PSS',
            saltLength: 128,
        },
        publicKey,
        signature,
        data);
}
