// Replace your app.use(cors({...})) with this:
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://sensational-blancmange-048bc5.netlify.app',
        'https://6854aa939e5549c6ad6d363d--frolicking-crisp-0b1d43.netlify.app',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});
