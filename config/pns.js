exports.settings = {
    gcm: {
        id: null,
    },
    apn: {
        token: {
            key: './certs/key.p12', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: 'ESAVDP29NP',
        }
    },
};
