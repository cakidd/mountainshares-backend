// REMOVE your existing app.use(cors({...})) and replace with:
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "https://sensational-blancmange-048bc5.netlify.app");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
   res.header("Access-Control-Allow-Credentials", "true");
   
   if (req.method === 'OPTIONS') {
       return res.sendStatus(200);
   }
   next();
});
